/**
 * Rutas para Gerentes - Gestión completa del sistema
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireGerente } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { hashPassword, validatePasswordStrength } = require('../utils/password');
const { generarCodigoVendedor } = require('../utils/codeGenerator');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

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
    const { estado, estado_pago, vendedor_id, fecha_desde, fecha_hasta, salon_nombre, mes, anio } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (estado_pago) where.estado_pago = estado_pago;
    if (vendedor_id) where.vendedor_id = parseInt(vendedor_id);
    
    // Filtro por salón
    if (salon_nombre) {
      where.OR = [
        { salones: { nombre: { equals: salon_nombre, mode: 'insensitive' } } },
        { lugar_salon: { equals: salon_nombre, mode: 'insensitive' } }
      ];
    }
    
    // Filtro por mes y año
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const fechaInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59);
      where.fecha_evento = {
        gte: fechaInicio,
        lte: fechaFin
      };
    } else if (fecha_desde || fecha_hasta) {
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
        paquetes: {
          select: {
            id: true,
            nombre: true,
            precio_base: true
          }
        },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            fecha_evento: true,
            hora_inicio: true,
            hora_fin: true,
            cantidad_invitados_confirmados: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        contratos_servicios: {
          include: {
            servicios: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        pagos: {
          select: {
            id: true,
            monto: true,
            monto_total: true,
            metodo_pago: true,
            fecha_pago: true,
            estado: true
          },
          orderBy: {
            fecha_pago: 'desc'
          }
        }
      },
      orderBy: { fecha_evento: 'asc' }
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

/**
 * @route   GET /api/gerentes/managers/trabajo
 * @desc    Obtener trabajo de managers por evento (checklist de servicios externos)
 * @access  Private (Gerente)
 */
router.get('/managers/trabajo', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { estado, fecha_desde, fecha_hasta, salon_nombre, mes, anio } = req.query;

    // Obtener contratos que coincidan con los filtros
    const contratosWhere = {};
    if (salon_nombre) {
      contratosWhere.OR = [
        { salones: { nombre: { equals: salon_nombre, mode: 'insensitive' } } },
        { lugar_salon: { equals: salon_nombre, mode: 'insensitive' } }
      ];
    }
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const fechaInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59);
      contratosWhere.fecha_evento = {
        gte: fechaInicio,
        lte: fechaFin
      };
    } else if (fecha_desde || fecha_hasta) {
      contratosWhere.fecha_evento = {};
      if (fecha_desde) {
        contratosWhere.fecha_evento.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        contratosWhere.fecha_evento.lte = new Date(fecha_hasta);
      }
    }

    // Obtener contratos con sus servicios y checklist
    const contratos = await prisma.contratos.findMany({
      where: contratosWhere,
      include: {
        clientes: {
          select: {
            nombre_completo: true
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
        },
        contratos_servicios: {
          include: {
            servicios: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        checklist_servicios_externos: {
          include: {
            managers: {
              select: {
                id: true,
                nombre_completo: true,
                codigo_manager: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Función helper para mapear nombre de servicio a tipo
    const mapearServicioATipo = (nombreServicio) => {
      const nombre = nombreServicio.toLowerCase();
      if (nombre.includes('foto') || nombre.includes('video') || nombre.includes('fotografía')) {
        return 'foto_video';
      } else if (nombre.includes('dj') || nombre.includes('disc jockey')) {
        return 'dj';
      } else if (nombre.includes('comida') || nombre.includes('catering') || nombre.includes('menú')) {
        return 'comida';
      } else if (nombre.includes('cake') || nombre.includes('torta') || nombre.includes('pastel')) {
        return 'cake';
      } else if (nombre.includes('mini postre') || nombre.includes('postre')) {
        return 'mini_postres';
      } else if (nombre.includes('limosina') || nombre.includes('limousine')) {
        return 'limosina';
      } else if (nombre.includes('hora loca')) {
        return 'hora_loca';
      } else if (nombre.includes('animador')) {
        return 'animador';
      } else if (nombre.includes('maestro') && nombre.includes('ceremonia')) {
        return 'maestro_ceremonia';
      }
      return null;
    };

    // Servicios externos válidos
    const SERVICIOS_EXTERNOS_VALIDOS = [
      'foto_video',
      'dj',
      'comida',
      'cake',
      'mini_postres',
      'limosina',
      'hora_loca',
      'animador',
      'maestro_ceremonia'
    ];

    // Procesar contratos para incluir todos los servicios
    const trabajoPorEvento = contratos.map(contrato => {
      // Identificar servicios externos contratados
      const serviciosExternos = contrato.contratos_servicios
        .map(cs => mapearServicioATipo(cs.servicios.nombre))
        .filter(Boolean);

      // Obtener checklist existente por tipo
      const checklistPorTipo = {};
      contrato.checklist_servicios_externos.forEach(item => {
        checklistPorTipo[item.servicio_tipo] = item;
      });

      // Crear lista completa de servicios (todos los incluidos en el contrato)
      const serviciosCompletos = serviciosExternos.map(tipo => {
        if (checklistPorTipo[tipo]) {
          // Si existe checklist, usar datos del checklist
          const item = checklistPorTipo[tipo];
          return {
            id: item.id,
            servicio_tipo: item.servicio_tipo,
            contacto_realizado: item.contacto_realizado,
            fecha_contacto: item.fecha_contacto,
            fecha_pago: item.fecha_pago || null,
            hora_recogida: item.hora_recogida,
            notas: item.notas,
            estado: item.estado,
            manager: item.managers,
            fecha_creacion: item.fecha_creacion,
            fecha_actualizacion: item.fecha_actualizacion
          };
        } else {
          // Si no existe checklist, crear entrada pendiente
          return {
            id: null,
            servicio_tipo: tipo,
            contacto_realizado: false,
            fecha_contacto: null,
            fecha_pago: null,
            hora_recogida: null,
            notas: null,
            estado: 'pendiente',
            manager: null,
            fecha_creacion: null,
            fecha_actualizacion: null
          };
        }
      });

      // Filtrar servicios por estado si se especifica
      let serviciosFiltrados = serviciosCompletos;
      if (estado) {
        serviciosFiltrados = serviciosCompletos.filter(s => s.estado === estado);
      }

      return {
        contrato: {
          id: contrato.id,
          codigo_contrato: contrato.codigo_contrato,
          fecha_evento: contrato.fecha_evento,
          clientes: contrato.clientes,
          eventos: contrato.eventos,
          salones: contrato.salones
        },
        servicios: serviciosFiltrados
      };
    }).filter(evento => evento.servicios.length > 0); // Solo incluir eventos con servicios

    const eventos = trabajoPorEvento;

    // Calcular estadísticas (de todos los servicios, no solo los que tienen checklist)
    const todosLosServicios = eventos.flatMap(e => e.servicios);
    const total = todosLosServicios.length;
    const pendientes = todosLosServicios.filter(item => item.estado === 'pendiente').length;
    const completados = todosLosServicios.filter(item => item.estado === 'completado').length;

    res.json({
      success: true,
      estadisticas: {
        total,
        pendientes,
        completados
      },
      eventos
    });
  } catch (error) {
    logger.error('Error al obtener trabajo de managers:', error);
    next(error);
  }
});

module.exports = router;

