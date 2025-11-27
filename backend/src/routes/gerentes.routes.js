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
const { calcularComisionesDesbloqueadasVendedor } = require('../utils/comisionCalculator');
const { generarResumenComisionesPDF } = require('../utils/pdfComisiones');
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
    // Obtener todos los vendedores (el gerente puede ver todos y eliminar los que no quiere)
    const vendedores = await prisma.usuarios.findMany({
      where: { rol: 'vendedor' },
      orderBy: { fecha_registro: 'desc' },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true,
        telefono: true,
        comision_porcentaje: true,
        total_ventas: true,
        total_comisiones: true,
        activo: true,
        fecha_registro: true
      }
    });

    // Adaptar estructura para compatibilidad
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    // Calcular comisiones desbloqueadas para cada vendedor
    const vendedoresConComisiones = await Promise.all(
      vendedoresAdaptados.map(async (vendedor) => {
        const comisionesDesbloqueadas = await calcularComisionesDesbloqueadasVendedor(vendedor.id);
        return {
          ...vendedor,
          comisiones: {
            total: comisionesDesbloqueadas.totalComisiones,
            desbloqueadas: comisionesDesbloqueadas.totalComisionesDesbloqueadas,
            pendientes: comisionesDesbloqueadas.totalComisiones - comisionesDesbloqueadas.totalComisionesDesbloqueadas,
            por_mes: comisionesDesbloqueadas.comisionesPorMes
          }
        };
      })
    );

    res.json({
      success: true,
      count: vendedoresConComisiones.length,
      vendedores: vendedoresConComisiones
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
    const existingUsuario = await prisma.usuarios.findFirst({
      where: { 
        email,
        rol: 'vendedor'
      }
    });

    if (existingUsuario) {
      throw new ValidationError('El email ya está registrado');
    }

    // Obtener último ID para generar código
    const ultimoUsuario = await prisma.usuarios.findFirst({
      where: { rol: 'vendedor' },
      orderBy: { id: 'desc' }
    });

    const codigo_usuario = generarCodigoVendedor(ultimoUsuario?.id || 0);

    // Hashear password
    const password_hash = await hashPassword(password);

    // Crear vendedor en tabla usuarios
    const vendedor = await prisma.usuarios.create({
      data: {
        nombre_completo,
        codigo_usuario,
        email,
        telefono,
        password_hash,
        rol: 'vendedor',
        comision_porcentaje: comision_porcentaje || 3.00,
        activo: true
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
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

    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: parseInt(id),
        rol: 'vendedor'
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Si se actualiza el email, verificar que no exista
    if (email && email !== vendedor.email) {
      const existingUsuario = await prisma.usuarios.findFirst({
        where: { 
          email,
          rol: 'vendedor'
        }
      });
      if (existingUsuario) {
        throw new ValidationError('El email ya está registrado');
      }
    }

    const updatedVendedor = await prisma.usuarios.update({
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
        codigo_usuario: true,
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

    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: parseInt(id),
        rol: 'vendedor'
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Hashear nueva contraseña
    const password_hash = await hashPassword(password);

    await prisma.usuarios.update({
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

/**
 * @route   DELETE /api/gerentes/vendedores/:id
 * @desc    Eliminar vendedor
 * @access  Private (Gerente)
 */
router.delete('/vendedores/:id', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: parseInt(id),
        rol: 'vendedor'
      },
      include: {
        _count: {
          select: {
            contratos: true,
            ofertas: true,
            clientes: true
          }
        }
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Verificar si tiene contratos, ofertas o clientes asociados
    if (vendedor._count.contratos > 0 || vendedor._count.ofertas > 0 || vendedor._count.clientes > 0) {
      throw new ValidationError(
        `No se puede eliminar el vendedor porque tiene ${vendedor._count.contratos} contrato(s), ${vendedor._count.ofertas} oferta(s) y ${vendedor._count.clientes} cliente(s) asociados. Desactívalo en su lugar.`
      );
    }

    // Eliminar vendedor
    await prisma.usuarios.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Vendedor eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error al eliminar vendedor:', error);
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
    const { mes, año } = req.query;
    
    // Construir filtro de fecha si se proporciona mes y año
    let fechaFiltro = null;
    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      const fechaInicio = new Date(añoNum, mesNum - 1, 1);
      const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
      fechaFiltro = { gte: fechaInicio, lte: fechaFin };
    }

    // Estadísticas de vendedores (filtrar solo PRUEBA001 y vendedores reales)
    const vendedores = await prisma.usuarios.findMany({
      where: {
        rol: 'vendedor',
        OR: [
          { codigo_usuario: 'PRUEBA001' },
          { 
            AND: [
              { codigo_usuario: { not: { startsWith: 'PRUEBA' } } },
              { codigo_usuario: { not: { startsWith: 'TEST' } } }
            ]
          }
        ]
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        total_ventas: true,
        total_comisiones: true,
        comision_porcentaje: true,
        activo: true
      }
    });

    // Adaptar estructura para compatibilidad
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    // Calcular estadísticas por vendedor
    const estadisticasVendedores = await Promise.all(
      vendedores.map(async (vendedor) => {
        // Obtener ofertas del vendedor (con filtro de fecha si aplica)
        // CRÍTICO: Usar OR para incluir tanto usuario_id (nuevo) como vendedor_id (deprecated)
        const whereOfertas = {
          OR: [
            { usuario_id: vendedor.id },
            { vendedor_id: vendedor.id }
          ]
        };
        if (fechaFiltro) {
          whereOfertas.fecha_creacion = fechaFiltro;
        }
        const ofertas = await prisma.ofertas.findMany({
          where: whereOfertas,
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

        // Obtener contratos del vendedor (con filtro de fecha si aplica)
        // CRÍTICO: Usar OR para incluir tanto usuario_id (nuevo) como vendedor_id (deprecated)
        const whereContratos = {
          OR: [
            { usuario_id: vendedor.id },
            { vendedor_id: vendedor.id }
          ]
        };
        if (fechaFiltro) {
          whereContratos.fecha_creacion_contrato = fechaFiltro;
        }
        const contratos = await prisma.contratos.findMany({
          where: whereContratos,
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

        // Calcular comisiones totales (3% del total)
        const comisionPorcentaje = parseFloat(vendedor.comision_porcentaje || 3);
        const totalComisionesCalculado = (totalVentasCalculado * comisionPorcentaje) / 100;

        // Calcular comisiones desbloqueadas (con filtro de fecha si aplica)
        const comisionesDesbloqueadas = await calcularComisionesDesbloqueadasVendedor(vendedor.id, fechaFiltro);
        
        // Si hay filtro de mes, filtrar comisiones por mes también
        let comisionesFiltradasPorMes = null;
        if (fechaFiltro && mes && año) {
          const mesNum = parseInt(mes);
          const añoNum = parseInt(año);
          const mesKey = `${añoNum}-${String(mesNum).padStart(2, '0')}`;
          
          // Filtrar comisiones desbloqueadas del mes específico
          const comisionesDelMes = comisionesDesbloqueadas.comisionesPorMes
            .filter(item => item.mes === mesKey)
            .reduce((sum, item) => sum + item.total, 0);
          
          comisionesFiltradasPorMes = {
            total: totalComisionesCalculado,
            desbloqueadas: parseFloat(comisionesDelMes.toFixed(2)),
            pendientes: parseFloat((totalComisionesCalculado - comisionesDelMes).toFixed(2)),
            por_mes: comisionesDesbloqueadas.comisionesPorMes.filter(item => item.mes === mesKey)
          };
        }

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
            total_comisiones_desbloqueadas: fechaFiltro && mes && año && comisionesFiltradasPorMes
              ? comisionesFiltradasPorMes.desbloqueadas
              : comisionesDesbloqueadas.totalComisionesDesbloqueadas,
            contratos_totales: contratos.length,
            contratos_pagados: contratos.filter(c => c.estado_pago === 'completado').length
          },
          comisiones: fechaFiltro && mes && año && comisionesFiltradasPorMes
            ? comisionesFiltradasPorMes
            : {
                total: comisionesDesbloqueadas.totalComisiones,
                desbloqueadas: comisionesDesbloqueadas.totalComisionesDesbloqueadas,
                pendientes: comisionesDesbloqueadas.totalComisiones - comisionesDesbloqueadas.totalComisionesDesbloqueadas,
                por_mes: comisionesDesbloqueadas.comisionesPorMes
          }
        };
      })
    );

    // Estadísticas generales (con filtro de fecha si aplica)
    const whereOfertasGeneral = {};
    const whereContratosGeneral = {};
    if (fechaFiltro) {
      whereOfertasGeneral.fecha_creacion = fechaFiltro;
      whereContratosGeneral.fecha_creacion_contrato = fechaFiltro;
    }
    
    const totalOfertas = await prisma.ofertas.count({ where: whereOfertasGeneral });
    const whereOfertasPendientes = { ...whereOfertasGeneral, estado: 'pendiente' };
    const ofertasPendientes = await prisma.ofertas.count({ where: whereOfertasPendientes });
    const totalContratos = await prisma.contratos.count({ where: whereContratosGeneral });
    const whereContratosPagados = { ...whereContratosGeneral, estado_pago: 'completado' };
    const contratosPagados = await prisma.contratos.count({ where: whereContratosPagados });

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
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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
            vendedor: c.usuarios ? {
              nombre_completo: c.usuarios.nombre_completo,
              codigo_vendedor: c.usuarios.codigo_usuario
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
    // CRÍTICO: Usar OR para incluir tanto usuario_id (nuevo) como vendedor_id (deprecated)
    if (vendedor_id) {
      where.OR = [
        { usuario_id: parseInt(vendedor_id) },
        { vendedor_id: parseInt(vendedor_id) }
      ];
    }
    
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
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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
            tipo_tarjeta: true,
            numero_referencia: true,
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
    const { estado, vendedor_id, mes, año } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (vendedor_id) where.vendedor_id = parseInt(vendedor_id);
    
    // Filtro por mes y año
    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      const fechaInicio = new Date(añoNum, mesNum - 1, 1);
      const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
      where.fecha_creacion = { gte: fechaInicio, lte: fechaFin };
    }

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
 * @route   GET /api/gerentes/ofertas/:id
 * @desc    Obtener oferta por ID (gerente puede ver cualquier oferta)
 * @access  Private (Gerente)
 */
router.get('/ofertas/:id', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { id } = req.params;

    const oferta = await prisma.ofertas.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true,
            email: true
          }
        },
        paquetes: true,
        temporadas: true,
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        ofertas_servicios_adicionales: {
          include: {
            servicios: true
          }
        },
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            estado: true,
            estado_pago: true
          }
        }
      }
    });

    if (!oferta) {
      throw new NotFoundError('Oferta no encontrada');
    }

    // Obtener ofertas del vendedor en el mes/día de esta oferta
    let ofertasVendedor = [];
    if (oferta.vendedores && oferta.fecha_creacion) {
      const fechaOferta = new Date(oferta.fecha_creacion);
      const fechaInicio = new Date(fechaOferta);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaOferta);
      fechaFin.setHours(23, 59, 59, 999);

      ofertasVendedor = await prisma.ofertas.findMany({
        where: {
          vendedor_id: oferta.vendedores.id,
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        select: {
          id: true,
          codigo_oferta: true,
          estado: true,
          total_final: true,
          fecha_creacion: true,
          clientes: {
            select: {
              nombre_completo: true
            }
          }
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });
    }

    res.json({
      success: true,
      oferta,
      ofertasVendedor
    });
  } catch (error) {
    logger.error('Error al obtener oferta:', error);
    next(error);
  }
});

/**
 * @route   GET /api/gerentes/ofertas/:id/pdf-factura
 * @desc    Descargar PDF de la factura proforma de la oferta (gerente puede ver cualquier oferta)
 * @access  Private (Gerente)
 */
router.get('/ofertas/:id/pdf-factura', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { generarFacturaProformaHTML } = require('../utils/pdfFacturaHTML');

    // Obtener oferta con todas las relaciones necesarias
    const oferta = await prisma.ofertas.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        },
        temporadas: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        ofertas_servicios_adicionales: {
          include: {
            servicios: true
          }
        }
      }
    });

    if (!oferta) {
      throw new NotFoundError('Oferta no encontrada');
    }

    // Generar PDF usando HTML + Puppeteer
    const pdfBuffer = await generarFacturaProformaHTML(oferta, 'oferta');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Oferta-${oferta.codigo_oferta}.pdf`);

    // Enviar el PDF
    res.send(pdfBuffer);

  } catch (error) {
    logger.error('Error al generar PDF de factura proforma:', error);
    next(error);
  }
});

/**
 * @route   GET /api/gerentes/vendedores/:id/reporte-mensual/:mes/:año
 * @desc    Descargar reporte mensual de un vendedor en PDF (gerente puede ver reportes de cualquier vendedor)
 * @access  Private (Gerente)
 */
router.get('/vendedores/:id/reporte-mensual/:mes/:año', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { id, mes, año } = req.params;

    const mesFiltro = parseInt(mes);
    const añoFiltro = parseInt(año);

    if (mesFiltro < 1 || mesFiltro > 12) {
      throw new ValidationError('Mes inválido');
    }

    // Obtener vendedor
    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: parseInt(id),
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true,
        telefono: true,
        comision_porcentaje: true
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Adaptar estructura para compatibilidad
    const vendedorAdaptado = {
      ...vendedor,
      codigo_vendedor: vendedor.codigo_usuario
    };

    // Obtener estadísticas del mes (reutilizar lógica del endpoint de stats)
    const fechaInicio = new Date(añoFiltro, mesFiltro - 1, 1);
    const fechaFin = new Date(añoFiltro, mesFiltro, 0, 23, 59, 59);

    // Calcular estadísticas del mes
    const [
      clientesMes,
      ofertasMes,
      ofertasAceptadasMes,
      ofertasPendientesMes,
      ofertasRechazadasMes,
      contratosMes,
      contratosActivosMes,
      contratosPagadosMes,
      contratosVendedorMes
    ] = await Promise.all([
      prisma.clientes.count({
        where: {
          vendedor_id: parseInt(id),
          fecha_registro: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          vendedor_id: parseInt(id),
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          vendedor_id: parseInt(id),
          estado: 'aceptada',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          vendedor_id: parseInt(id),
          estado: 'pendiente',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          vendedor_id: parseInt(id),
          estado: 'rechazada',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          vendedor_id: parseInt(id),
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          vendedor_id: parseInt(id),
          estado: 'activo',
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          vendedor_id: parseInt(id),
          estado_pago: 'completado',
          fecha_actualizacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.findMany({
        where: {
          vendedor_id: parseInt(id),
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        select: {
          total_contrato: true
        }
      })
    ]);

    // Calcular ventas del mes
    const totalVentasMes = contratosVendedorMes.reduce((sum, contrato) => {
      return sum + parseFloat(contrato.total_contrato || 0);
    }, 0);

    // Calcular comisiones del mes (3% fijo)
    const comisionPorcentaje = parseFloat(vendedor.comision_porcentaje || 3);
    const totalComisionesMes = totalVentasMes * (comisionPorcentaje / 100);

    // Calcular comisiones desbloqueadas
    const { calcularComisionesDesbloqueadasVendedor } = require('../utils/comisionCalculator');
    const comisionesDesbloqueadas = await calcularComisionesDesbloqueadasVendedor(parseInt(id));
    
    // Filtrar comisiones desbloqueadas del mes específico
    const comisionesDesbloqueadasMes = comisionesDesbloqueadas.comisionesPorMes
      .filter(item => {
        const [anio, mes] = item.mes.split('-');
        return parseInt(mes) === mesFiltro && parseInt(anio) === añoFiltro;
      })
      .reduce((sum, item) => sum + item.total, 0);

    // Tasa de conversión del mes
    const tasaConversion = ofertasMes > 0
      ? ((ofertasAceptadasMes / ofertasMes) * 100).toFixed(2)
      : 0;

    const statsData = {
      estadisticas: {
        clientes: {
          total: clientesMes
        },
        ofertas: {
          total: ofertasMes,
          aceptadas: ofertasAceptadasMes,
          pendientes: ofertasPendientesMes,
          rechazadas: ofertasRechazadasMes,
          tasa_conversion: `${tasaConversion}%`
        },
        contratos: {
          total: contratosMes,
          activos: contratosActivosMes,
          pagados_completo: contratosPagadosMes
        },
        finanzas: {
          total_ventas: parseFloat(totalVentasMes.toFixed(2)),
          total_comisiones: parseFloat(totalComisionesMes.toFixed(2)),
          comision_porcentaje: comisionPorcentaje,
          total_comisiones_desbloqueadas_mes: parseFloat(comisionesDesbloqueadasMes.toFixed(2))
        },
        comisiones: {
          total_mes: parseFloat(totalComisionesMes.toFixed(2)),
          desbloqueadas_mes: parseFloat(comisionesDesbloqueadasMes.toFixed(2)),
          pendientes_mes: parseFloat((totalComisionesMes - comisionesDesbloqueadasMes).toFixed(2))
        },
        vendedor: {
          id: vendedor.id,
          nombre_completo: vendedor.nombre_completo,
          codigo_vendedor: vendedor.codigo_vendedor,
          comision_porcentaje: comisionPorcentaje
        }
      }
    };

    // Obtener contratos del mes
    const contratos = await prisma.contratos.findMany({
      where: {
        vendedor_id: parseInt(id),
        fecha_evento: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        paquetes: {
          select: {
            id: true,
            nombre: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Preparar datos para el PDF
    const datosReporte = {
      estadisticas: statsData.estadisticas || {},
      contratos: contratos
    };

    // Generar PDF
    const { generarReporteMensual } = require('../utils/pdfReporteMensual');
    const doc = generarReporteMensual(datosReporte, vendedor, mesFiltro, añoFiltro);

    // Configurar headers para descarga
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesNombre = nombresMeses[mesFiltro - 1];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte-Mensual-${vendedor.nombre_completo}-${mesNombre}-${añoFiltro}.pdf`
    );

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    logger.error('Error al generar reporte mensual:', error);
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
    const { fecha_desde, fecha_hasta, mes, año } = req.query;

    const where = {};
    
    // Priorizar filtro por mes/año si está presente
    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      const fechaInicio = new Date(añoNum, mesNum - 1, 1);
      const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
      where.fecha_pago = { gte: fechaInicio, lte: fechaFin };
    } else if (fecha_desde || fecha_hasta) {
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

// ============================================
// GESTIÓN DE COMISIONES (Vista del Gerente)
// ============================================

/**
 * @route   GET /api/gerentes/comisiones
 * @desc    Obtener todas las comisiones (pendientes y pagadas) de todos los vendedores
 * @access  Private (Gerente)
 */
router.get('/comisiones', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { mes, año } = req.query;
    
    // Construir filtro de fecha si se proporciona
    let fechaFiltro = null;
    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      const fechaInicio = new Date(añoNum, mesNum - 1, 1);
      const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
      fechaFiltro = {
        gte: fechaInicio,
        lte: fechaFin
      };
    }

    // Obtener todos los vendedores activos
    const vendedores = await prisma.usuarios.findMany({
      where: { 
        activo: true,
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true
      },
      orderBy: { nombre_completo: 'asc' }
    });

    // Adaptar estructura para compatibilidad
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    // Calcular comisiones desbloqueadas para cada vendedor (reutilizar lógica de comisiones.routes.js)
    const vendedoresConComisiones = await Promise.all(
      vendedoresAdaptados.map(async (vendedor) => {
        const comisionesData = await calcularComisionesDesbloqueadasVendedor(
          vendedor.id,
          fechaFiltro ? { gte: fechaFiltro.gte, lte: fechaFiltro.lte } : null
        );
        
        // Obtener contratos con pagos
        const contratos = await prisma.contratos.findMany({
          where: { vendedor_id: vendedor.id },
          include: {
            clientes: {
              select: {
                nombre_completo: true
              }
            },
            pagos: {
              where: { estado: 'completado' },
              orderBy: { fecha_pago: 'asc' }
            }
          },
          orderBy: { fecha_creacion_contrato: 'desc' }
        });

        // Obtener montos pagados usando SQL directo
        const contratosConMontosPagados = await Promise.all(
          contratos.map(async (contrato) => {
            const montos = await prisma.$queryRaw`
              SELECT 
                COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
                COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto
              FROM contratos
              WHERE id = ${contrato.id}
            `;
            return {
              ...contrato,
              comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
              comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0)
            };
          })
        );

        // Calcular comisiones pendientes y pagadas
        const comisionesPendientes = [];
        const comisionesPagadas = [];

        for (const contrato of contratosConMontosPagados) {
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const totalPagado = contrato.pagos.reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
          const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;

          // Verificar primera mitad
          let primeraMitadCumplida = false;
          if (contrato.fecha_creacion_contrato && contrato.pagos.length > 0) {
            const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
            const primerPago = contrato.pagos[0];
            const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
            
            if (montoPrimerPago >= 500) {
              const fechaLimite = new Date(fechaCreacion);
              fechaLimite.setDate(fechaLimite.getDate() + 10);
              
              const pagosEnPlazo = contrato.pagos.filter((pago, index) => {
                if (index === 0) return false;
                const fechaPago = new Date(pago.fecha_pago);
                return fechaPago > fechaCreacion && 
                       fechaPago <= fechaLimite &&
                       parseFloat(pago.monto_total) >= 500;
              });

              if (pagosEnPlazo.length > 0) {
                const montoEnPlazo = pagosEnPlazo.reduce((sum, p) => 
                  sum + parseFloat(p.monto_total), 0
                );
                
                if (montoEnPlazo >= 500 && (montoPrimerPago + montoEnPlazo) >= 1000) {
                  primeraMitadCumplida = true;
                }
              }
            }
          }

          const segundaMitadCumplida = porcentajePagado >= 50;
          const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
          const comisionSegundaMitad = (totalContrato * 1.5) / 100;

          const montoPagadoPrimera = contrato.comision_primera_mitad_pagada_monto;
          const montoPagadoSegunda = contrato.comision_segunda_mitad_pagada_monto;
          const estaCompletamentePagadaPrimera = montoPagadoPrimera >= comisionPrimeraMitad;
          const estaCompletamentePagadaSegunda = montoPagadoSegunda >= comisionSegundaMitad;

          // Primera mitad
          if (primeraMitadCumplida) {
            if (estaCompletamentePagadaPrimera) {
              comisionesPagadas.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                monto_total: comisionPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                monto_pendiente: 0,
                pagada: true,
                fecha_pago: contrato.fecha_pago_comision_primera,
                cliente: contrato.clientes.nombre_completo
              });
            } else {
              comisionesPendientes.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                monto_total: comisionPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                monto_pendiente: comisionPrimeraMitad - montoPagadoPrimera,
                pagada: false,
                cliente: contrato.clientes.nombre_completo
              });
            }
          }

          // Segunda mitad
          if (segundaMitadCumplida) {
            if (estaCompletamentePagadaSegunda) {
              comisionesPagadas.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                monto_total: comisionSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                monto_pendiente: 0,
                pagada: true,
                fecha_pago: contrato.fecha_pago_comision_segunda,
                cliente: contrato.clientes.nombre_completo
              });
            } else {
              comisionesPendientes.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                monto_total: comisionSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                monto_pendiente: comisionSegundaMitad - montoPagadoSegunda,
                pagada: false,
                cliente: contrato.clientes.nombre_completo
              });
            }
          }
        }

        return {
          vendedor: {
            id: vendedor.id,
            nombre_completo: vendedor.nombre_completo,
            codigo_vendedor: vendedor.codigo_vendedor,
            email: vendedor.email
          },
          comisiones: {
            total_desbloqueadas: comisionesData.totalComisionesDesbloqueadas,
            total: comisionesData.totalComisiones,
            pendientes: comisionesPendientes.reduce((sum, c) => sum + c.monto_pendiente, 0),
            pagadas: comisionesPagadas.reduce((sum, c) => sum + c.monto_pagado, 0)
          },
          comisiones_pendientes: comisionesPendientes,
          comisiones_pagadas: comisionesPagadas
        };
      })
    );

    res.json({
      success: true,
      count: vendedoresConComisiones.length,
      vendedores: vendedoresConComisiones
    });
  } catch (error) {
    logger.error('Error al obtener comisiones para gerente:', error);
    next(error);
  }
});

/**
 * @route   GET /api/gerentes/comisiones/resumen-pdf
 * @desc    Descargar PDF de resumen de pagos de comisiones por mes (para gerente)
 * @access  Private (Gerente)
 */
router.get('/comisiones/resumen-pdf', authenticate, requireGerente, async (req, res, next) => {
  try {
    const { mes, año } = req.query;

    if (!mes || !año) {
      throw new ValidationError('Debe proporcionar mes y año');
    }

    const mesNum = parseInt(mes);
    const añoNum = parseInt(año);

    if (mesNum < 1 || mesNum > 12) {
      throw new ValidationError('Mes inválido');
    }

    // Obtener todos los vendedores activos
    const vendedores = await prisma.usuarios.findMany({
      where: { 
        activo: true,
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true
      },
      orderBy: { nombre_completo: 'asc' }
    });

    // Adaptar estructura para compatibilidad
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    // Construir filtro de fecha
    const fechaInicio = new Date(añoNum, mesNum - 1, 1);
    const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
    const fechaFiltro = {
      gte: fechaInicio,
      lte: fechaFin
    };

    // Obtener comisiones para cada vendedor (reutilizar lógica del endpoint GET /comisiones)
    const vendedoresConComisiones = await Promise.all(
      vendedoresAdaptados.map(async (vendedor) => {
        const comisionesData = await calcularComisionesDesbloqueadasVendedor(
          vendedor.id,
          fechaFiltro
        );
        
        // Obtener contratos con pagos
        const contratos = await prisma.contratos.findMany({
          where: { vendedor_id: vendedor.id },
          include: {
            clientes: {
              select: {
                nombre_completo: true
              }
            },
            pagos: {
              where: { estado: 'completado' },
              orderBy: { fecha_pago: 'asc' }
            }
          },
          orderBy: { fecha_creacion_contrato: 'desc' }
        });

        // Obtener montos pagados usando SQL directo
        const contratosConMontosPagados = await Promise.all(
          contratos.map(async (contrato) => {
            const montos = await prisma.$queryRaw`
              SELECT 
                COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
                COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto
              FROM contratos
              WHERE id = ${contrato.id}
            `;
            return {
              ...contrato,
              comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
              comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0)
            };
          })
        );

        // Calcular comisiones pendientes y pagadas (simplificado para PDF)
        const comisionesPendientes = [];
        const comisionesPagadas = [];

        for (const contrato of contratosConMontosPagados) {
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const totalPagado = contrato.pagos.reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
          const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;

          // Verificar primera mitad
          let primeraMitadCumplida = false;
          if (contrato.fecha_creacion_contrato && contrato.pagos.length > 0) {
            const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
            const primerPago = contrato.pagos[0];
            const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
            
            if (montoPrimerPago >= 500) {
              const fechaLimite = new Date(fechaCreacion);
              fechaLimite.setDate(fechaLimite.getDate() + 10);
              
              const pagosEnPlazo = contrato.pagos.filter((pago, index) => {
                if (index === 0) return false;
                const fechaPago = new Date(pago.fecha_pago);
                return fechaPago > fechaCreacion && 
                       fechaPago <= fechaLimite &&
                       parseFloat(pago.monto_total) >= 500;
              });

              if (pagosEnPlazo.length > 0) {
                const montoEnPlazo = pagosEnPlazo.reduce((sum, p) => 
                  sum + parseFloat(p.monto_total), 0
                );
                
                if (montoEnPlazo >= 500 && (montoPrimerPago + montoEnPlazo) >= 1000) {
                  primeraMitadCumplida = true;
                }
              }
            }
          }

          const segundaMitadCumplida = porcentajePagado >= 50;
          const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
          const comisionSegundaMitad = (totalContrato * 1.5) / 100;

          const montoPagadoPrimera = contrato.comision_primera_mitad_pagada_monto;
          const montoPagadoSegunda = contrato.comision_segunda_mitad_pagada_monto;
          const estaCompletamentePagadaPrimera = montoPagadoPrimera >= comisionPrimeraMitad;
          const estaCompletamentePagadaSegunda = montoPagadoSegunda >= comisionSegundaMitad;

          // Primera mitad
          if (primeraMitadCumplida) {
            if (estaCompletamentePagadaPrimera) {
              comisionesPagadas.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                monto_total: comisionPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                monto_pendiente: 0,
                pagada: true,
                fecha_pago: contrato.fecha_pago_comision_primera
              });
            } else {
              comisionesPendientes.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                monto_total: comisionPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                monto_pendiente: comisionPrimeraMitad - montoPagadoPrimera,
                pagada: false
              });
            }
          }

          // Segunda mitad
          if (segundaMitadCumplida) {
            if (estaCompletamentePagadaSegunda) {
              comisionesPagadas.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                monto_total: comisionSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                monto_pendiente: 0,
                pagada: true,
                fecha_pago: contrato.fecha_pago_comision_segunda
              });
            } else {
              comisionesPendientes.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                monto_total: comisionSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                monto_pendiente: comisionSegundaMitad - montoPagadoSegunda,
                pagada: false
              });
            }
          }
        }

        return {
          vendedor: {
            id: vendedor.id,
            nombre_completo: vendedor.nombre_completo,
            codigo_vendedor: vendedor.codigo_vendedor,
            email: vendedor.email
          },
          comisiones: {
            total_desbloqueadas: comisionesData.totalComisionesDesbloqueadas,
            total: comisionesData.totalComisiones,
            pendientes: comisionesPendientes.reduce((sum, c) => sum + c.monto_pendiente, 0),
            pagadas: comisionesPagadas.reduce((sum, c) => sum + c.monto_pagado, 0)
          },
          comisiones_pendientes: comisionesPendientes,
          comisiones_pagadas: comisionesPagadas
        };
      })
    );

    // Generar PDF
    const pdfBuffer = await generarResumenComisionesPDF(vendedoresConComisiones, mesNum, añoNum);

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const nombreMes = nombresMeses[mesNum - 1];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Resumen-Comisiones-${nombreMes}-${añoNum}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error al generar PDF de resumen de comisiones para gerente:', error);
    next(error);
  }
});

module.exports = router;

