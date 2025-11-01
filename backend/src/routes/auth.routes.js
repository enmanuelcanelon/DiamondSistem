/**
 * Rutas de Autenticación
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateVendedorToken, generateClienteToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { UnauthorizedError, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/login/vendedor
 * @desc    Login de vendedor
 * @access  Public
 */
router.post('/login/vendedor', async (req, res, next) => {
  try {
    const { codigo_vendedor, password } = req.body;

    // Validar datos
    if (!codigo_vendedor || !password) {
      throw new ValidationError('Código de vendedor y contraseña son requeridos');
    }

    // Buscar vendedor
    const vendedor = await prisma.vendedores.findUnique({
      where: { codigo_vendedor }
    });

    if (!vendedor) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!vendedor.activo) {
      throw new UnauthorizedError('Cuenta de vendedor desactivada');
    }

    // Verificar password
    const isValidPassword = await comparePassword(password, vendedor.password_hash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token
    const token = generateVendedorToken(vendedor);

    // Remover password del response
    const { password_hash, ...vendedorData } = vendedor;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: vendedorData
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login/cliente
 * @desc    Login de cliente con código de acceso
 * @access  Public
 */
router.post('/login/cliente', async (req, res, next) => {
  try {
    const { codigo_acceso } = req.body;

    // Validar datos
    if (!codigo_acceso) {
      throw new ValidationError('Código de acceso es requerido');
    }

    // Buscar contrato por código de acceso
    const contrato = await prisma.contratos.findUnique({
      where: { codigo_acceso_cliente: codigo_acceso },
      include: {
        clientes: true,
        eventos: true
      }
    });

    if (!contrato) {
      throw new UnauthorizedError('Código de acceso inválido');
    }

    // Verificar que el contrato esté activo
    if (contrato.estado !== 'activo') {
      throw new UnauthorizedError('El contrato no está activo');
    }

    // Generar token
    const token = generateClienteToken(contrato.clientes, contrato);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: contrato.clientes.id,
        nombre_completo: contrato.clientes.nombre_completo,
        email: contrato.clientes.email,
        telefono: contrato.clientes.telefono
      },
      contrato: {
        id: contrato.id,
        codigo_contrato: contrato.codigo_contrato,
        fecha_evento: contrato.fecha_evento,
        total_contrato: contrato.total_contrato,
        total_pagado: contrato.total_pagado,
        saldo_pendiente: contrato.saldo_pendiente,
        estado_pago: contrato.estado_pago
      },
      evento: contrato.eventos || null
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/register/vendedor
 * @desc    Registrar nuevo vendedor (solo admin)
 * @access  Private/Admin
 */
router.post('/register/vendedor', async (req, res, next) => {
  try {
    const { 
      nombre_completo, 
      email, 
      telefono,
      password,
      comision_porcentaje 
    } = req.body;

    // Validar datos
    if (!nombre_completo || !email || !password) {
      throw new ValidationError('Nombre, email y contraseña son requeridos');
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Contraseña débil', passwordValidation.errors);
    }

    // Verificar si el email ya existe
    const existingVendedor = await prisma.vendedores.findUnique({
      where: { email }
    });

    if (existingVendedor) {
      throw new ValidationError('El email ya está registrado');
    }

    // Obtener último ID para generar código
    const ultimoVendedor = await prisma.vendedores.findFirst({
      orderBy: { id: 'desc' }
    });

    const { generarCodigoVendedor } = require('../utils/codeGenerator');
    const codigo_vendedor = generarCodigoVendedor(ultimoVendedor?.id || 0);

    // Hashear password
    const password_hash = await hashPassword(password);

    // Crear vendedor
    const vendedor = await prisma.vendedores.create({
      data: {
        nombre_completo,
        codigo_vendedor,
        email,
        telefono,
        password_hash,
        comision_porcentaje: comision_porcentaje || 10.00,
        activo: true
      }
    });

    // Remover password del response
    const { password_hash: _, ...vendedorData } = vendedor;

    res.status(201).json({
      success: true,
      message: 'Vendedor registrado exitosamente',
      vendedor: vendedorData
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario actual autenticado
 * @access  Private
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (req.user.tipo === 'vendedor') {
      const vendedor = await prisma.vendedores.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nombre_completo: true,
          codigo_vendedor: true,
          email: true,
          telefono: true,
          comision_porcentaje: true,
          total_ventas: true,
          total_comisiones: true,
          activo: true,
          fecha_registro: true
        }
      });

      if (!vendedor) {
        throw new NotFoundError('Vendedor no encontrado');
      }

      res.json({
        success: true,
        user: {
          ...vendedor,
          tipo: 'vendedor'
        }
      });

    } else if (req.user.tipo === 'cliente') {
      const contrato = await prisma.contratos.findUnique({
        where: { codigo_acceso_cliente: req.user.codigoAcceso },
        include: {
          clientes: true,
          eventos: true
        }
      });

      if (!contrato) {
        throw new NotFoundError('Contrato no encontrado');
      }

      res.json({
        success: true,
        user: {
          ...contrato.clientes,
          tipo: 'cliente'
        },
        contrato: {
          id: contrato.id,
          codigo_contrato: contrato.codigo_contrato,
          fecha_evento: contrato.fecha_evento,
          total_contrato: contrato.total_contrato,
          total_pagado: contrato.total_pagado,
          saldo_pendiente: contrato.saldo_pendiente,
          estado_pago: contrato.estado_pago
        },
        evento: contrato.eventos || null
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private (solo vendedores)
 */
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      throw new UnauthorizedError('Solo vendedores pueden cambiar contraseña');
    }

    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      throw new ValidationError('Contraseña actual y nueva son requeridas');
    }

    // Validar fortaleza de nueva contraseña
    const passwordValidation = validatePasswordStrength(password_nueva);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Contraseña nueva débil', passwordValidation.errors);
    }

    // Obtener vendedor
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: req.user.id }
    });

    // Verificar contraseña actual
    const isValidPassword = await comparePassword(password_actual, vendedor.password_hash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Contraseña actual incorrecta');
    }

    // Hashear nueva contraseña
    const password_hash = await hashPassword(password_nueva);

    // Actualizar contraseña
    await prisma.vendedores.update({
      where: { id: req.user.id },
      data: { password_hash }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

