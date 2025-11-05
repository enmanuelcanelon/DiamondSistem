/**
 * Rutas para Gerentes - Gestión completa del sistema
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireGerente } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { hashPassword, validatePasswordStrength } = require('../utils/password');
const { generarCodigoVendedor } = require('../utils/codeGenerator');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ============================================
// GESTIÓN DE VENDEDORES
// ============================================

/**
 * @route   GET /api/gerentes/vendedores
 * @desc    Obtener todos los vendedores
 * @access  Private (Gerente)
 */
router.get('/vendedores', authenticate, requireGerente, async (req, res, next) => {
  try {
    const vendedores = await prisma.vendedores.findMany({
      orderBy: { fecha_registro: 'desc' },
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

    res.json({
      success: true,
      count: vendedores.length,
      vendedores
    });
  } catch (error) {
    logger.error('Error al obtener vendedores:', error);
    next(error);
  }
});

/**
 * @route   POST /api/gerentes/vendedores
 * @desc    Crear nuevo vendedor
 * @access  Private (Gerente)
 */
router.post('/vendedores', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { nombre_completo, email, telefono, password, comision_porcentaje } = req.body;

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
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        email: true,
        telefono: true,
        comision_porcentaje: true,
        activo: true,
        fecha_registro: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vendedor creado exitosamente',
      vendedor
    });
  } catch (error) {
    logger.error('Error al crear vendedor:', error);
    next(error);
  }
});

/**
 * @route   PUT /api/gerentes/vendedores/:id
 * @desc    Actualizar vendedor
 * @access  Private (Gerente)
 */
router.put('/vendedores/:id', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, telefono, comision_porcentaje, activo } = req.body;

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Si se actualiza el email, verificar que no exista
    if (email && email !== vendedor.email) {
      const existingVendedor = await prisma.vendedores.findUnique({
        where: { email }
      });
      if (existingVendedor) {
        throw new ValidationError('El email ya está registrado');
      }
    }

    const updatedVendedor = await prisma.vendedores.update({
      where: { id: parseInt(id) },
      data: {
        nombre_completo: nombre_completo || vendedor.nombre_completo,
        email: email || vendedor.email,
        telefono: telefono !== undefined ? telefono : vendedor.telefono,
        comision_porcentaje: comision_porcentaje !== undefined ? comision_porcentaje : vendedor.comision_porcentaje,
        activo: activo !== undefined ? activo : vendedor.activo,
        fecha_actualizacion: new Date()
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        email: true,
        telefono: true,
        comision_porcentaje: true,
        activo: true,
        fecha_registro: true
      }
    });

    res.json({
      success: true,
      message: 'Vendedor actualizado exitosamente',
      vendedor: updatedVendedor
    });
  } catch (error) {
    logger.error('Error al actualizar vendedor:', error);
    next(error);
  }
});

/**
 * @route   PUT /api/gerentes/vendedores/:id/password
 * @desc    Cambiar contraseña de vendedor
 * @access  Private (Gerente)
 */
router.put('/vendedores/:id/password', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new ValidationError('Contraseña es requerida');
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Contraseña débil', passwordValidation.errors);
    }

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Hashear nueva contraseña
    const password_hash = await hashPassword(password);

    await prisma.vendedores.update({
      where: { id: parseInt(id) },
      data: { password_hash, fecha_actualizacion: new Date() }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    logger.error('Error al cambiar contraseña:', error);
    next(error);
  }
});

// ============================================
// ESTADÍSTICAS Y REPORTES
// ============================================

/**
 * @route   GET /api/gerentes/dashboard
 * @desc    Obtener estadísticas generales del dashboard
 * @access  Private (Gerente)
 */
router.get('/dashboard', authenticate, requireGerente, async (req, res, next) => {
  try {
    // Estadísticas de vendedores
    const vendedores = await prisma.vendedores.findMany({
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        total_ventas: true,
        total_comisiones: true,
        comision_porcentaje: true,
        activo: true
      }
    });

    // Calcular estadísticas por vendedor
    const estadisticasVendedores = await Promise.all(
      vendedores.map(async (vendedor) => {
        // Obtener ofertas del vendedor
        const ofertas = await prisma.ofertas.findMany({
          where: { vendedor_id: vendedor.id },
          select: {
            id: true,
            estado: true,
            total_final: true
          }
        });

        const ofertasPendientes = ofertas.filter(o => o.estado === 'pendiente').length;
        const ofertasAceptadas = ofertas.filter(o => o.estado === 'aceptada').length;
        const ofertasRechazadas = ofertas.filter(o => o.estado === 'rechazada').length;
        const totalOfertas = ofertas.length;
        const tasaConversion = totalOfertas > 0 
          ? ((ofertasAceptadas / totalOfertas) * 100).toFixed(2) 
          : '0.00';

        // Obtener contratos del vendedor
        const contratos = await prisma.contratos.findMany({
          where: { vendedor_id: vendedor.id },
          select: {
            id: true,
            fecha_evento: true,
            total_contrato: true,
            estado_pago: true
          }
        });

        // Calcular total de ventas desde contratos
        const totalVentasCalculado = contratos.reduce((sum, c) => {
          return sum + parseFloat(c.total_contrato || 0);
        }, 0);

        // Calcular comisiones
        const comisionPorcentaje = parseFloat(vendedor.comision_porcentaje || 3);
        const totalComisionesCalculado = (totalVentasCalculado * comisionPorcentaje) / 100;

        return {
          vendedor: {
            id: vendedor.id,
            nombre_completo: vendedor.nombre_completo,
            codigo_vendedor: vendedor.codigo_vendedor,
            comision_porcentaje: comisionPorcentaje
          },
          ofertas: {
            total: totalOfertas,
            pendientes: ofertasPendientes,
            aceptadas: ofertasAceptadas,
            rechazadas: ofertasRechazadas,
            tasa_conversion: parseFloat(tasaConversion)
          },
          ventas: {
            total_ventas: totalVentasCalculado,
            total_comisiones: totalComisionesCalculado,
            contratos_totales: contratos.length,
            contratos_pagados: contratos.filter(c => c.estado_pago === 'completado').length
          }
        };
      })
    );

    // Estadísticas generales
    const totalOfertas = await prisma.ofertas.count();
    const ofertasPendientes = await prisma.ofertas.count({ where: { estado: 'pendiente' } });
    const totalContratos = await prisma.contratos.count();
    const contratosPagados = await prisma.contratos.count({ where: { estado_pago: 'completado' } });

    // Fechas disponibles (próximos 90 días)
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);
    const fecha90Dias = new Date();
    fecha90Dias.setDate(fecha90Dias.getDate() + 90);
    fecha90Dias.setHours(23, 59, 59, 999);

    const contratosFuturos = await prisma.contratos.findMany({
      where: {
        fecha_evento: {
          gte: fechaHoy,
          lte: fecha90Dias
        },
        estado: 'activo'
      },
      select: {
        id: true,
        codigo_contrato: true,
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        lugar_salon: true,
        cantidad_invitados: true,
        total_contrato: true,
        estado_pago: true,
        salones: {
          select: {
            nombre: true
          }
        },
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Clientes atendidos hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const clientesHoy = await prisma.contratos.count({
      where: {
        fecha_evento: {
          gte: hoy,
          lt: manana
        },
        estado: 'activo'
      }
    });

    res.json({
      success: true,
      estadisticas: {
        generales: {
          total_vendedores: vendedores.length,
          total_ofertas: totalOfertas,
          ofertas_pendientes: ofertasPendientes,
          total_contratos: totalContratos,
          contratos_pagados: contratosPagados,
          clientes_atendidos_hoy: clientesHoy
        },
        vendedores: estadisticasVendedores,
        fechas_disponibles: {
          proximos_90_dias: contratosFuturos.length,
          eventos: contratosFuturos.map(c => ({
            id: c.id,
            codigo_contrato: c.codigo_contrato,
            fecha: c.fecha_evento,
            hora_inicio: c.hora_inicio,
            hora_fin: c.hora_fin,
            salon: c.salones?.nombre || c.lugar_salon || 'Sede Externa',
            cantidad_invitados: c.cantidad_invitados,
            total_contrato: c.total_contrato,
            estado_pago: c.estado_pago,
            cliente: c.clientes ? {
              nombre_completo: c.clientes.nombre_completo,
              email: c.clientes.email,
              telefono: c.clientes.telefono
            } : null,
            vendedor: c.vendedores ? {
              nombre_completo: c.vendedores.nombre_completo,
              codigo_vendedor: c.vendedores.codigo_vendedor
            } : null
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas del dashboard:', error);
    next(error);
  }
});

/**
 * @route   GET /api/gerentes/contratos
 * @desc    Obtener todos los contratos
 * @access  Private (Gerente)
 */
router.get('/contratos', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { estado, estado_pago, vendedor_id, fecha_desde, fecha_hasta } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (estado_pago) where.estado_pago = estado_pago;
    if (vendedor_id) where.vendedor_id = parseInt(vendedor_id);
    if (fecha_desde || fecha_hasta) {
      where.fecha_evento = {};
      if (fecha_desde) where.fecha_evento.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_evento.lte = new Date(fecha_hasta);
    }

    const contratos = await prisma.contratos.findMany({
      where,
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        eventos: {
          select: {
            nombre_evento: true,
            fecha_evento: true
          }
        },
        salones: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { fecha_evento: 'desc' }
    });

    res.json({
      success: true,
      count: contratos.length,
      contratos
    });
  } catch (error) {
    logger.error('Error al obtener contratos:', error);
    next(error);
  }
});

/**
 * @route   GET /api/gerentes/ofertas
 * @desc    Obtener todas las ofertas
 * @access  Private (Gerente)
 */
router.get('/ofertas', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { estado, vendedor_id } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (vendedor_id) where.vendedor_id = parseInt(vendedor_id);

    const ofertas = await prisma.ofertas.findMany({
      where,
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { fecha_creacion: 'desc' }
    });

    res.json({
      success: true,
      count: ofertas.length,
      ofertas
    });
  } catch (error) {
    logger.error('Error al obtener ofertas:', error);
    next(error);
  }
});

/**
 * @route   GET /api/gerentes/pagos
 * @desc    Obtener todos los pagos
 * @access  Private (Gerente)
 */
router.get('/pagos', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const where = {};
    if (fecha_desde || fecha_hasta) {
      where.fecha_pago = {};
      if (fecha_desde) where.fecha_pago.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_pago.lte = new Date(fecha_hasta);
    }

    const pagos = await prisma.pagos.findMany({
      where,
      include: {
        contratos: {
          include: {
            clientes: {
              select: {
                nombre_completo: true
              }
            },
            vendedores: {
              select: {
                nombre_completo: true,
                codigo_vendedor: true
              }
            }
          }
        }
      },
      orderBy: { fecha_pago: 'desc' }
    });

    const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

    res.json({
      success: true,
      count: pagos.length,
      total_pagos: totalPagos,
      pagos
    });
  } catch (error) {
    logger.error('Error al obtener pagos:', error);
    next(error);
  }
});

module.exports = router;

