/**
 * Rutas de Autenticación
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateVendedorToken, generateClienteToken, generateManagerToken, generateGerenteToken, generateInventarioToken, generateUsuarioToken } = require('../utils/jwt');
const { authenticate, requireVendedor, requireManager, requireGerente, requireInventario } = require('../middleware/auth');
const { UnauthorizedError, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const prisma = getPrismaClient();

/**
 * @route   POST /api/auth/login/vendedor
 * @desc    Login de vendedor (compatibilidad - busca en usuarios con rol='vendedor')
 * @access  Public
 */
router.post('/login/vendedor', async (req, res, next) => {
  try {
    const { codigo_vendedor, password } = req.body;

    // Validar datos
    if (!codigo_vendedor || !password) {
      throw new ValidationError('Código de vendedor y contraseña son requeridos');
    }

    // Buscar usuario con rol vendedor
    const usuario = await prisma.usuarios.findFirst({
      where: { 
        codigo_usuario: codigo_vendedor,
        rol: 'vendedor'
      }
    });

    // Si no se encuentra en usuarios, buscar en tabla antigua (compatibilidad)
    let vendedor = usuario;
    if (!vendedor) {
      vendedor = await prisma.vendedores.findUnique({
        where: { codigo_vendedor }
      });
    }

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

    // Generar token (usar función unificada si es de tabla usuarios)
    const token = usuario ? generateUsuarioToken(usuario) : generateVendedorToken(vendedor);

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

    // CRÍTICO: Validar que el código no haya expirado
    // El código expira 30 días después de la fecha del evento
    if (contrato.fecha_evento) {
      const fechaEvento = new Date(contrato.fecha_evento);
      const fechaActual = new Date();
      const diasDespuesEvento = 30; // Días de gracia después del evento
      
      // Calcular fecha de expiración (30 días después del evento)
      const fechaExpiracion = new Date(fechaEvento);
      fechaExpiracion.setDate(fechaExpiracion.getDate() + diasDespuesEvento);
      
      if (fechaActual > fechaExpiracion) {
        throw new UnauthorizedError(
          `El código de acceso ha expirado. El evento fue el ${fechaEvento.toLocaleDateString('es-ES')} y el código expiró el ${fechaExpiracion.toLocaleDateString('es-ES')}. Por favor, contacta a tu vendedor para obtener un nuevo código.`
        );
      }
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
 * @route   POST /api/auth/login/manager
 * @desc    Login de manager (compatibilidad - busca en usuarios con rol='manager')
 * @access  Public
 */
router.post('/login/manager', async (req, res, next) => {
  try {
    const { codigo_manager, password } = req.body;

    // Validar datos
    if (!codigo_manager || !password) {
      throw new ValidationError('Código de manager y contraseña son requeridos');
    }

    // Buscar usuario con rol manager
    let usuario = await prisma.usuarios.findFirst({
      where: { 
        codigo_usuario: codigo_manager,
        rol: 'manager'
      }
    });

    // Si no se encuentra en usuarios, buscar en tabla antigua (compatibilidad)
    let manager = usuario;
    if (!manager) {
      manager = await prisma.managers.findUnique({
        where: { codigo_manager }
      });
    }

    if (!manager) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!manager.activo) {
      throw new UnauthorizedError('Cuenta de manager desactivada');
    }

    // Verificar password
    const isValidPassword = await comparePassword(password, manager.password_hash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token (usar función unificada si es de tabla usuarios)
    const token = usuario ? generateUsuarioToken(usuario) : generateManagerToken(manager);

    // Remover password del response
    const { password_hash, ...managerData } = manager;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: managerData
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login/gerente
 * @desc    Login de gerente (compatibilidad - busca en usuarios con rol='gerente')
 * @access  Public
 */
router.post('/login/gerente', async (req, res, next) => {
  try {
    const { codigo_gerente, password } = req.body;

    // Validar datos
    if (!codigo_gerente || !password) {
      throw new ValidationError('Código de gerente y contraseña son requeridos');
    }

    // Buscar usuario con rol gerente
    let usuario = await prisma.usuarios.findFirst({
      where: { 
        codigo_usuario: codigo_gerente,
        rol: 'gerente'
      }
    });

    // Si no se encuentra en usuarios, buscar en tabla antigua (compatibilidad)
    let gerente = usuario;
    if (!gerente) {
      gerente = await prisma.gerentes.findUnique({
        where: { codigo_gerente }
      });
    }

    if (!gerente) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!gerente.activo) {
      throw new UnauthorizedError('Cuenta de gerente desactivada');
    }

    // Verificar password
    const isValidPassword = await comparePassword(password, gerente.password_hash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token (usar función unificada si es de tabla usuarios)
    const token = usuario ? generateUsuarioToken(usuario) : generateGerenteToken(gerente);

    // Remover password del response
    const { password_hash, ...gerenteData } = gerente;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: gerenteData
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login/inventario
 * @desc    Login de usuario de inventario (compatibilidad - busca en usuarios con rol='inventario')
 * @access  Public
 */
router.post('/login/inventario', async (req, res, next) => {
  try {
    const { codigo_usuario, password } = req.body;

    // Validar datos
    if (!codigo_usuario || !password) {
      throw new ValidationError('Código de usuario y contraseña son requeridos');
    }

    // Buscar usuario con rol inventario
    let usuario = await prisma.usuarios.findFirst({
      where: { 
        codigo_usuario: codigo_usuario,
        rol: 'inventario'
      }
    });

    // Si no se encuentra en usuarios, buscar en tabla antigua (compatibilidad)
    let usuarioInv = usuario;
    if (!usuarioInv) {
      usuarioInv = await prisma.usuarios_inventario.findUnique({
        where: { codigo_usuario }
      });
    }

    if (!usuarioInv) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!usuarioInv.activo) {
      throw new UnauthorizedError('Cuenta de usuario desactivada');
    }

    // Verificar password
    const isValidPassword = await comparePassword(password, usuarioInv.password_hash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token (usar función unificada si es de tabla usuarios)
    const token = usuario ? generateUsuarioToken(usuario) : generateInventarioToken(usuarioInv);

    // Remover password del response
    const { password_hash, ...usuarioData } = usuarioInv;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: usuarioData
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/register/vendedor
 * @desc    Registrar nuevo vendedor (solo admin/vendedor autenticado)
 * @access  Private (Vendedor autenticado)
 */
router.post('/register/vendedor', authenticate, requireVendedor, async (req, res, next) => {
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
        comision_porcentaje: comision_porcentaje || 3.00,
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
      // Buscar primero en tabla usuarios
      let usuario = await prisma.usuarios.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nombre_completo: true,
          codigo_usuario: true,
          email: true,
          telefono: true,
          rol: true,
          comision_porcentaje: true,
          total_ventas: true,
          total_comisiones: true,
          activo: true,
          fecha_registro: true
        }
      });

      // Si no está en usuarios, buscar en tabla antigua (compatibilidad)
      if (!usuario) {
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

        return res.json({
          success: true,
          user: {
            ...vendedor,
            tipo: 'vendedor'
          }
        });
      }

      res.json({
        success: true,
        user: {
          ...usuario,
          codigo_vendedor: usuario.codigo_usuario, // Compatibilidad
          tipo: usuario.rol
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
    } else if (req.user.tipo === 'manager') {
      // Buscar primero en tabla usuarios
      let usuario = await prisma.usuarios.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nombre_completo: true,
          codigo_usuario: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          fecha_registro: true
        }
      });

      // Si no está en usuarios, buscar en tabla antigua (compatibilidad)
      if (!usuario) {
        const manager = await prisma.managers.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            nombre_completo: true,
            codigo_manager: true,
            email: true,
            telefono: true,
            activo: true,
            fecha_registro: true
          }
        });

        if (!manager) {
          throw new NotFoundError('Manager no encontrado');
        }

        return res.json({
          success: true,
          user: {
            ...manager,
            tipo: 'manager'
          }
        });
      }

      res.json({
        success: true,
        user: {
          ...usuario,
          codigo_manager: usuario.codigo_usuario, // Compatibilidad
          tipo: usuario.rol
        }
      });
    } else if (req.user.tipo === 'gerente') {
      // Buscar primero en tabla usuarios
      let usuario = await prisma.usuarios.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nombre_completo: true,
          codigo_usuario: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          fecha_registro: true
        }
      });

      // Si no está en usuarios, buscar en tabla antigua (compatibilidad)
      if (!usuario) {
        const gerente = await prisma.gerentes.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            nombre_completo: true,
            codigo_gerente: true,
            email: true,
            telefono: true,
            activo: true,
            fecha_registro: true
          }
        });

        if (!gerente) {
          throw new NotFoundError('Gerente no encontrado');
        }

        return res.json({
          success: true,
          user: {
            ...gerente,
            tipo: 'gerente'
          }
        });
      }

      res.json({
        success: true,
        user: {
          ...usuario,
          codigo_gerente: usuario.codigo_usuario, // Compatibilidad
          tipo: usuario.rol
        }
      });
    } else if (req.user.tipo === 'inventario') {
      // Buscar primero en tabla usuarios
      let usuario = await prisma.usuarios.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nombre_completo: true,
          codigo_usuario: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          fecha_registro: true
        }
      });

      // Si no está en usuarios, buscar en tabla antigua (compatibilidad)
      if (!usuario) {
        const usuarioInv = await prisma.usuarios_inventario.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true,
            email: true,
            telefono: true,
            activo: true,
            fecha_registro: true
          }
        });

        if (!usuarioInv) {
          throw new NotFoundError('Usuario de inventario no encontrado');
        }

        return res.json({
          success: true,
          user: {
            ...usuarioInv,
            tipo: 'inventario'
          }
        });
      }

      res.json({
        success: true,
        user: {
          ...usuario,
          tipo: usuario.rol
        }
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



