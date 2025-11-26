/**
 * Rutas de Vendedores
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { calcularComisionesDesbloqueadasVendedor } = require('../utils/comisionCalculator');
const { generarResumenComisionesPDF } = require('../utils/pdfComisiones');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * @route   GET /api/vendedores
 * @desc    Listar vendedores activos
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [vendedores, total] = await Promise.all([
      prisma.usuarios.findMany({
        where: { 
          activo: true,
          rol: 'vendedor'
        },
        select: {
          id: true,
          nombre_completo: true,
          codigo_usuario: true,
          email: true,
          telefono: true,
          comision_porcentaje: true,
          total_ventas: true,
          total_comisiones: true,
          fecha_registro: true
        },
        orderBy: { fecha_registro: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.usuarios.count({ 
        where: { 
          activo: true,
          rol: 'vendedor'
        } 
      })
    ]);

    // Adaptar estructura para compatibilidad con código frontend
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    res.json({
      success: true,
      count: vendedoresAdaptados.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      vendedores: vendedoresAdaptados
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id
 * @desc    Obtener vendedor por ID
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

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

    // Adaptar estructura para compatibilidad
    const vendedorAdaptado = {
      ...vendedor,
      codigo_vendedor: vendedor.codigo_usuario
    };

    res.json({
      success: true,
      vendedor: vendedorAdaptado
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/stats
 * @desc    Obtener estadísticas del vendedor
 * @access  Private (Vendedor)
 */
router.get('/:id/stats', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el vendedor existe
    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: parseInt(id),
        rol: 'vendedor'
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Obtener estadísticas - Optimizado: usar agregaciones SQL en lugar de traer todos los registros
    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedor = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
    const [
      totalClientes,
      totalOfertas,
      ofertasAceptadas,
      ofertasPendientes,
      ofertasRechazadas,
      totalContratos,
      contratosActivos,
      contratosPagados,
      totalVentasResult
    ] = await Promise.all([
      prisma.clientes.count({ where: filtroVendedor }),
      prisma.ofertas.count({ where: filtroVendedor }),
      prisma.ofertas.count({ where: { ...filtroVendedor, estado: 'aceptada' } }),
      prisma.ofertas.count({ where: { ...filtroVendedor, estado: 'pendiente' } }),
      prisma.ofertas.count({ where: { ...filtroVendedor, estado: 'rechazada' } }),
      prisma.contratos.count({ where: filtroVendedor }),
      prisma.contratos.count({ where: { ...filtroVendedor, estado: 'activo' } }),
      prisma.contratos.count({ where: { ...filtroVendedor, estado_pago: 'completado' } }),
      // Usar agregación SQL en lugar de traer todos los registros
      prisma.contratos.aggregate({
        where: filtroVendedor,
        _sum: {
          total_contrato: true
        }
      })
    ]);

    // Calcular total de ventas usando la agregación
    const totalVentas = parseFloat(totalVentasResult._sum.total_contrato || 0);

    // Calcular total de comisiones (3% fijo del total de ventas)
    // NOTA: El porcentaje de comisión es siempre 3% según la nueva lógica implementada
    const comisionPorcentaje = 3.0; // Porcentaje fijo
    const totalComisiones = totalVentas * (comisionPorcentaje / 100);

    // Calcular comisiones desbloqueadas
    const comisionesDesbloqueadas = await calcularComisionesDesbloqueadasVendedor(parseInt(id));

    // Calcular tasa de conversión
    const tasaConversion = totalOfertas > 0 
      ? ((ofertasAceptadas / totalOfertas) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      vendedor: {
        id: vendedor.id,
        nombre_completo: vendedor.nombre_completo,
        codigo_vendedor: vendedor.codigo_usuario
      },
      estadisticas: {
        clientes: {
          total: totalClientes
        },
        ofertas: {
          total: totalOfertas,
          aceptadas: ofertasAceptadas,
          pendientes: ofertasPendientes,
          rechazadas: ofertasRechazadas,
          tasa_conversion: `${tasaConversion}%`
        },
        contratos: {
          total: totalContratos,
          activos: contratosActivos,
          pagados_completo: contratosPagados
        },
        finanzas: {
          total_ventas: parseFloat(totalVentas.toFixed(2)),
          total_comisiones: parseFloat(totalComisiones.toFixed(2)),
          comision_porcentaje: comisionPorcentaje,
          total_comisiones_desbloqueadas: comisionesDesbloqueadas.totalComisionesDesbloqueadas,
          total_comisiones_pendientes: comisionesDesbloqueadas.totalComisiones - comisionesDesbloqueadas.totalComisionesDesbloqueadas
        },
        comisiones: {
          total: comisionesDesbloqueadas.totalComisiones,
          desbloqueadas: comisionesDesbloqueadas.totalComisionesDesbloqueadas,
          pendientes: comisionesDesbloqueadas.totalComisiones - comisionesDesbloqueadas.totalComisionesDesbloqueadas,
          por_mes: comisionesDesbloqueadas.comisionesPorMes
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/clientes
 * @desc    Obtener clientes del vendedor
 * @access  Private (Vendedor)
 */
router.get('/:id/clientes', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    // CRÍTICO: Verificar que el vendedor solo vea sus propios clientes
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver clientes de otro vendedor');
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);
    
    // Construir where clause con filtro de fecha si se proporciona
    // Usar usuario_id o vendedor_id para compatibilidad
    const where = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    if (fecha_desde || fecha_hasta) {
      where.fecha_registro = {};
      if (fecha_desde) {
        where.fecha_registro.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_registro.lte = new Date(fecha_hasta + 'T23:59:59');
      }
    }
    
    const [clientes, total] = await Promise.all([
      prisma.clientes.findMany({
        where,
        include: {
          _count: {
            select: {
              contratos: true,
              ofertas: true
            }
          }
        },
        orderBy: { fecha_registro: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.clientes.count({ where })
    ]);

    res.json(createPaginationResponse(clientes, total, page, limit));

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/contratos
 * @desc    Obtener contratos del vendedor
 * @access  Private (Vendedor)
 */
router.get('/:id/contratos', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // CRÍTICO: Verificar que el vendedor solo vea sus propios contratos
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver contratos de otro vendedor');
    }

    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedorContratos = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
    const contratos = await prisma.contratos.findMany({
      where: filtroVendedorContratos,
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
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            estado: true
          }
        }
      },
      orderBy: { fecha_firma: 'desc' }
    });

    res.json({
      success: true,
      count: contratos.length,
      contratos
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/stats/mes
 * @desc    Obtener estadísticas del vendedor filtradas por mes
 * @access  Private (Vendedor)
 * @query   mes, año (opcional, si no se envía usa el mes/año actual)
 */
router.get('/:id/stats/mes', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mes, año } = req.query;

    // Validar que el vendedor existe
    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: parseInt(id),
        rol: 'vendedor'
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // CRÍTICO: Verificar que el vendedor solo vea sus propias estadísticas
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver estadísticas de otro vendedor');
    }

    // Obtener mes y año (si no se proporcionan, usar el actual)
    const fechaActual = new Date();
    const mesFiltro = mes ? parseInt(mes) : fechaActual.getMonth() + 1; // 1-12
    const añoFiltro = año ? parseInt(año) : fechaActual.getFullYear();

    // Validar mes y año
    if (mesFiltro < 1 || mesFiltro > 12) {
      throw new ValidationError('Mes inválido. Debe estar entre 1 y 12');
    }
    if (añoFiltro < 2020 || añoFiltro > 2100) {
      throw new ValidationError('Año inválido');
    }

    // Fechas de inicio y fin del mes
    const fechaInicio = new Date(añoFiltro, mesFiltro - 1, 1);
    const fechaFin = new Date(añoFiltro, mesFiltro, 0, 23, 59, 59);

    // Estadísticas del mes
    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedor = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
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
      // Clientes creados en el mes
      prisma.clientes.count({
        where: {
          ...filtroVendedor,
          fecha_registro: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      // Ofertas creadas en el mes
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          estado: 'aceptada',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          estado: 'pendiente',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          estado: 'rechazada',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      // Contratos creados en el mes
      prisma.contratos.count({
        where: {
          ...filtroVendedor,
          fecha_actualizacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          ...filtroVendedor,
          estado: 'activo',
          fecha_actualizacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          ...filtroVendedor,
          estado_pago: 'completado',
          fecha_actualizacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      // Contratos con eventos en el mes (para calcular ventas) - Optimizado: usar agregación SQL
      prisma.contratos.aggregate({
        where: {
          ...filtroVendedor,
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        _sum: {
          total_contrato: true
        }
      })
    ]);

    // Calcular ventas del mes usando agregación SQL
    const totalVentasMes = parseFloat(contratosVendedorMes._sum.total_contrato || 0);

    // Calcular comisiones del mes (3% fijo)
    // NOTA: El porcentaje de comisión es siempre 3% según la nueva lógica implementada
    const comisionPorcentaje = 3.0; // Porcentaje fijo
    const totalComisionesMes = totalVentasMes * (comisionPorcentaje / 100);

    // Calcular comisiones desbloqueadas (totales y del mes específico)
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

    res.json({
      success: true,
      periodo: {
        mes: mesFiltro,
        año: añoFiltro,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString()
      },
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
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/contratos/mes/:mes/:año
 * @desc    Obtener contratos del vendedor filtrados por mes
 * @access  Private (Vendedor)
 */
router.get('/:id/contratos/mes/:mes/:año', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id, mes, año } = req.params;

    // CRÍTICO: Verificar autorización
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver contratos de otro vendedor');
    }

    const mesFiltro = parseInt(mes);
    const añoFiltro = parseInt(año);

    if (mesFiltro < 1 || mesFiltro > 12) {
      throw new ValidationError('Mes inválido');
    }

    const fechaInicio = new Date(añoFiltro, mesFiltro - 1, 1);
    const fechaFin = new Date(añoFiltro, mesFiltro, 0, 23, 59, 59);

    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedorContratos = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
    const contratos = await prisma.contratos.findMany({
      where: {
        ...filtroVendedorContratos,
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

    res.json({
      success: true,
      periodo: {
        mes: mesFiltro,
        año: añoFiltro
      },
      count: contratos.length,
      contratos
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/calendario/mes/:mes/:año
 * @desc    Obtener calendario de eventos del vendedor por mes
 * @access  Private (Vendedor)
 */
router.get('/:id/calendario/mes/:mes/:año', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id, mes, año } = req.params;

    // CRÍTICO: Verificar autorización
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver calendario de otro vendedor');
    }

    const mesFiltro = parseInt(mes);
    const añoFiltro = parseInt(año);

    if (mesFiltro < 1 || mesFiltro > 12) {
      throw new ValidationError('Mes inválido');
    }

    const fechaInicio = new Date(añoFiltro, mesFiltro - 1, 1);
    const fechaFin = new Date(añoFiltro, mesFiltro, 0, 23, 59, 59);

    // Obtener eventos de contratos
    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedorEventos = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
    const eventosContratos = await prisma.contratos.findMany({
      where: {
        ...filtroVendedorEventos,
        fecha_evento: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      select: {
        id: true,
        codigo_contrato: true,
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        cantidad_invitados: true,
        estado_pago: true,
        clientes: {
          select: {
            nombre_completo: true,
            email: true,
            telefono: true,
            tipo_evento: true
          }
        },
        salones: {
          select: {
            nombre: true
          }
        },
        eventos: {
          select: {
            nombre_evento: true,
            estado: true
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Obtener eventos de Google Calendar del vendedor (calendario principal)
    const { obtenerEventosCalendarioPrincipal, obtenerEventosCalendarioCitas } = require('../utils/googleCalendarService');
    
    let eventosCalendarioPrincipal = [];
    let eventosCalendarioCitas = [];
    
    try {
      eventosCalendarioPrincipal = await obtenerEventosCalendarioPrincipal(parseInt(id), fechaInicio, fechaFin);
    } catch (error) {
      logger.warn('Error al obtener eventos del calendario principal:', error);
    }

    try {
      eventosCalendarioCitas = await obtenerEventosCalendarioCitas(parseInt(id), fechaInicio, fechaFin);
    } catch (error) {
      logger.warn('Error al obtener eventos del calendario CITAS:', error);
    }

    // CALENDARIO 1: Solo contratos del vendedor (sin Google Calendar)
    // COMENTADO: El usuario quiere que solo se muestren eventos de Google Calendar, no contratos de BD
    // const calendarioContratos = eventosContratos.map(evento => ({
    //   ...evento,
    //   tipo: 'contrato',
    //   calendario: 'contratos'
    // }));

    // CALENDARIO 2: Eventos del calendario principal (Google Calendar - Revolution Party)
    const calendarioPrincipal = eventosCalendarioPrincipal.map(eventoGoogle => {
      try {
        // Para eventos de todo el día, parsear la fecha correctamente
        let fechaInicioEvento;
        if (eventoGoogle.es_todo_el_dia && eventoGoogle.fecha_inicio) {
          const fechaStr = eventoGoogle.fecha_inicio.split('T')[0];
          const [year, month, day] = fechaStr.split('-').map(Number);
          fechaInicioEvento = new Date(year, month - 1, day);
        } else {
          fechaInicioEvento = new Date(eventoGoogle.fecha_inicio);
        }
        
        const fechaFinEvento = eventoGoogle.fecha_fin ? new Date(eventoGoogle.fecha_fin) : null;
        
        // Extraer información del título (formato: "revolution party - [homenajeado] ([codigo])")
        const titulo = eventoGoogle.titulo || eventoGoogle.summary || '';
        const matchCodigo = titulo.match(/\(([^)]+)\)/);
        const codigo = matchCodigo ? matchCodigo[1] : null;
        const matchHomenajeado = titulo.match(/revolution party\s*-\s*([^(]+)/);
        const homenajeado = matchHomenajeado ? matchHomenajeado[1].trim() : null;
        
        return {
          id: `google_${eventoGoogle.id}`,
          codigo_contrato: codigo,
          fecha_evento: fechaInicioEvento,
          fecha_inicio: eventoGoogle.fecha_inicio,
          fecha_fin: eventoGoogle.fecha_fin,
          hora_inicio: fechaInicioEvento,
          hora_fin: fechaFinEvento,
          cantidad_invitados: null,
          estado_pago: null,
          clientes: {
            nombre_completo: homenajeado || titulo || 'Evento',
            email: eventoGoogle.creador,
            telefono: null,
            tipo_evento: null
          },
          salones: {
            nombre: eventoGoogle.ubicacion || 'Sin ubicación'
          },
          eventos: null,
          es_google_calendar: true,
          es_todo_el_dia: eventoGoogle.es_todo_el_dia || false,
          timeZone: eventoGoogle.timeZone || 'America/New_York',
          descripcion: eventoGoogle.descripcion,
          htmlLink: eventoGoogle.htmlLink,
          titulo: titulo,
          summary: eventoGoogle.summary,
          tipo: 'google_calendar',
          calendario: 'principal'
        };
      } catch (error) {
        logger.warn('Error al procesar evento de Google Calendar principal:', error);
        return null;
      }
    }).filter(e => e !== null && e.fecha_evento.getMonth() + 1 === mesFiltro && e.fecha_evento.getFullYear() === añoFiltro);

    // CALENDARIO 3: Eventos del calendario CITAS
    const calendarioCitas = eventosCalendarioCitas.map(eventoGoogle => {
      try {
        // Para eventos de todo el día, parsear la fecha correctamente
        let fechaInicioEvento;
        if (eventoGoogle.es_todo_el_dia && eventoGoogle.fecha_inicio) {
          const fechaStr = eventoGoogle.fecha_inicio.split('T')[0];
          const [year, month, day] = fechaStr.split('-').map(Number);
          fechaInicioEvento = new Date(year, month - 1, day);
        } else {
          fechaInicioEvento = new Date(eventoGoogle.fecha_inicio);
        }
        
        const fechaFinEvento = eventoGoogle.fecha_fin ? new Date(eventoGoogle.fecha_fin) : null;
        
        return {
          id: `citas_${eventoGoogle.id}`,
          codigo_contrato: null,
          fecha_evento: fechaInicioEvento,
          fecha_inicio: eventoGoogle.fecha_inicio,
          fecha_fin: eventoGoogle.fecha_fin,
          hora_inicio: fechaInicioEvento,
          hora_fin: fechaFinEvento,
          cantidad_invitados: null,
          estado_pago: null,
          clientes: {
            nombre_completo: eventoGoogle.titulo,
            email: eventoGoogle.creador,
            telefono: null
          },
          salones: {
            nombre: eventoGoogle.ubicacion || 'CITAS'
          },
          eventos: null,
          es_google_calendar: true,
          es_citas: true,
          es_todo_el_dia: eventoGoogle.es_todo_el_dia || false,
          timeZone: eventoGoogle.timeZone || 'America/New_York',
          descripcion: eventoGoogle.descripcion,
          htmlLink: eventoGoogle.htmlLink,
          tipo: 'citas',
          calendario: 'citas'
        };
      } catch (error) {
        logger.warn('Error al procesar evento de CITAS:', error);
        return null;
      }
    }).filter(e => e !== null && e.fecha_evento.getMonth() + 1 === mesFiltro && e.fecha_evento.getFullYear() === añoFiltro);

    // IMPORTANTE: Solo incluir eventos de Google Calendar (calendario principal)
    // NO incluir contratos de la base de datos porque tienen bugs
    // NO incluir ofertas pendientes de la base de datos
    const eventosCombinados = [...calendarioPrincipal];

    // Logging para debug
    logger.info(`📅 Calendario vendedor ${id} - Mes ${mesFiltro}/${añoFiltro}:`);
    logger.info(`  - Eventos Google Calendar (principal): ${calendarioPrincipal.length}`);
    logger.info(`  - Eventos Google Calendar (CITAS): ${calendarioCitas.length}`);
    logger.info(`  - Eventos combinados (solo Google Calendar): ${eventosCombinados.length}`);
    calendarioPrincipal.forEach(e => {
      logger.info(`    ✅ Google Calendar: ${e.clientes?.nombre_completo || e.titulo} - ${e.fecha_evento.toISOString().split('T')[0]}`);
    });

    // Agrupar eventos por día
    const eventosPorDia = {};
    eventosCombinados.forEach(evento => {
      const fecha = new Date(evento.fecha_evento);
      const dia = fecha.getDate();
      if (!eventosPorDia[dia]) {
        eventosPorDia[dia] = [];
      }
      eventosPorDia[dia].push(evento);
    });

    res.json({
      success: true,
      periodo: {
        mes: mesFiltro,
        año: añoFiltro,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString()
      },
      total_eventos: eventosCombinados.length,
      eventos_por_dia: eventosPorDia,
      eventos: eventosCombinados,
      // Separar por tipo de calendario
      calendario_contratos: [], // COMENTADO: No incluir contratos de BD porque tienen bugs
      calendario_citas: calendarioCitas,
      calendario_principal: calendarioPrincipal,
      estadisticas: {
        eventos_contratos: 0, // COMENTADO: No contar contratos de BD
        eventos_citas: calendarioCitas.length,
        eventos_principal: calendarioPrincipal.length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/reporte-mensual/:mes/:año
 * @desc    Descargar reporte mensual en PDF
 * @access  Private (Vendedor)
 */
router.get('/:id/reporte-mensual/:mes/:año', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id, mes, año } = req.params;

    // CRÍTICO: Verificar autorización
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver reportes de otro vendedor');
    }

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

    // Calcular estadísticas del mes (similar al endpoint de stats/mes)
    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedor = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
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
          ...filtroVendedor,
          fecha_registro: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          estado: 'aceptada',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          estado: 'pendiente',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.ofertas.count({
        where: {
          ...filtroVendedor,
          estado: 'rechazada',
          fecha_creacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          ...filtroVendedor,
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          ...filtroVendedor,
          estado: 'activo',
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          ...filtroVendedor,
          estado_pago: 'completado',
          fecha_actualizacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.findMany({
        where: {
          ...filtroVendedor,
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

    // Calcular ventas y comisiones
    const totalVentasMes = contratosVendedorMes.reduce((sum, contrato) => {
      return sum + parseFloat(contrato.total_contrato || 0);
    }, 0);

    // Calcular comisiones del mes (3% fijo)
    // NOTA: El porcentaje de comisión es siempre 3% según la nueva lógica implementada
    const comisionPorcentaje = 3.0; // Porcentaje fijo
    const totalComisionesMes = totalVentasMes * (comisionPorcentaje / 100);

    // Preparar datos de estadísticas
    const statsData = {
      estadisticas: {
        clientes: { total: clientesMes },
        ofertas: {
          total: ofertasMes,
          aceptadas: ofertasAceptadasMes,
          pendientes: ofertasPendientesMes,
          rechazadas: ofertasRechazadasMes
        },
        contratos: {
          total: contratosMes,
          activos: contratosActivosMes,
          pagados: contratosPagadosMes
        },
        finanzas: {
          total_ventas: totalVentasMes,
          total_comisiones: totalComisionesMes,
          comision_porcentaje: comisionPorcentaje
        }
      }
    };

    // Obtener contratos del mes
    // Usar usuario_id o vendedor_id para compatibilidad
    const filtroVendedorContratos = {
      OR: [
        { usuario_id: parseInt(id) },
        { vendedor_id: parseInt(id) }
      ]
    };
    
    const contratos = await prisma.contratos.findMany({
      where: {
        ...filtroVendedorContratos,
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
      `attachment; filename=Reporte-Mensual-${mesNombre}-${añoFiltro}.pdf`
    );

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/comisiones
 * @desc    Obtener comisiones del vendedor (pendientes y pagadas)
 * @access  Private (Vendedor - solo puede ver sus propias comisiones)
 */
router.get('/:id/comisiones', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedorId = parseInt(req.params.id);
    const { mes, año } = req.query;

    // Verificar que el vendedor solo pueda ver sus propias comisiones
    if (req.user.id !== vendedorId) {
      throw new ValidationError('No tienes permiso para ver estas comisiones');
    }

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

    // Obtener vendedor
    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: vendedorId,
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true
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

    // Calcular comisiones desbloqueadas
    const comisionesData = await calcularComisionesDesbloqueadasVendedor(
      vendedorId,
      fechaFiltro ? { gte: fechaFiltro.gte, lte: fechaFiltro.lte } : null
    );

    // Obtener contratos con pagos
    const contratos = await prisma.contratos.findMany({
      where: { vendedor_id: vendedorId },
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

    // Obtener montos pagados y fechas de pago usando SQL directo
    const contratosConMontosPagados = await Promise.all(
      contratos.map(async (contrato) => {
        const montos = await prisma.$queryRaw`
          SELECT 
            COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
            COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto,
            fecha_pago_comision_primera,
            fecha_pago_comision_segunda
          FROM contratos
          WHERE id = ${contrato.id}
        `;
        return {
          ...contrato,
          comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
          comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0),
          fecha_pago_comision_primera: montos[0]?.fecha_pago_comision_primera || contrato.fecha_pago_comision_primera,
          fecha_pago_comision_segunda: montos[0]?.fecha_pago_comision_segunda || contrato.fecha_pago_comision_segunda
        };
      })
    );

    // Calcular comisiones pendientes, pagadas y no desbloqueadas
    const comisionesPendientes = [];
    const comisionesPagadas = [];
    const comisionesNoDesbloqueadas = [];

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

      // Calcular información para comisiones no desbloqueadas
      let motivoPrimeraMitad = null;
      let motivoSegundaMitad = null;
      
      if (!primeraMitadCumplida) {
        if (contrato.pagos.length === 0) {
          motivoPrimeraMitad = 'No se ha realizado ningún pago';
        } else {
          const primerPago = contrato.pagos[0];
          const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
          if (montoPrimerPago < 500) {
            motivoPrimeraMitad = `El primer pago ($${montoPrimerPago.toFixed(2)}) es menor a $500`;
          } else {
            const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
            const fechaLimite = new Date(fechaCreacion);
            fechaLimite.setDate(fechaLimite.getDate() + 10);
            const ahora = new Date();
            
            if (ahora > fechaLimite) {
              const pagosDespues = contrato.pagos.filter((p, idx) => {
                if (idx === 0) return false;
                const fechaPago = new Date(p.fecha_pago);
                return fechaPago > fechaCreacion && fechaPago <= fechaLimite;
              });
              const montoEnPlazo = pagosDespues.reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
              if (montoEnPlazo < 500) {
                motivoPrimeraMitad = `⚠️ FUERA DE PLAZO: No se pagaron $500 adicionales dentro de 10 días (pagado: $${montoEnPlazo.toFixed(2)}). Debe contactar para ver qué pasa.`;
              } else {
                motivoPrimeraMitad = `⚠️ FUERA DE PLAZO: No se alcanzó el total de $1000 en los primeros 10 días. Debe contactar para ver qué pasa.`;
              }
            } else {
              motivoPrimeraMitad = `Faltan $500 adicionales dentro de 10 días (plazo vence: ${fechaLimite.toLocaleDateString('es-ES')})`;
            }
          }
        }
      }
      
      if (!segundaMitadCumplida) {
        motivoSegundaMitad = `Se requiere pagar el 50% del contrato (actualmente: ${porcentajePagado.toFixed(2)}%)`;
      }

      // Primera mitad
      if (primeraMitadCumplida) {
        if (estaCompletamentePagadaPrimera) {
          // Verificar si la fecha de pago está dentro del filtro (si hay filtro)
          const fechaPagoPrimera = contrato.fecha_pago_comision_primera ? new Date(contrato.fecha_pago_comision_primera) : null;
          const cumpleFiltroFecha = !fechaFiltro || (fechaPagoPrimera && 
            fechaPagoPrimera >= fechaFiltro.gte && 
            fechaPagoPrimera <= fechaFiltro.lte);
          
          if (cumpleFiltroFecha) {
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
          }
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
          // Verificar si la fecha de pago está dentro del filtro (si hay filtro)
          const fechaPagoSegunda = contrato.fecha_pago_comision_segunda ? new Date(contrato.fecha_pago_comision_segunda) : null;
          const cumpleFiltroFecha = !fechaFiltro || (fechaPagoSegunda && 
            fechaPagoSegunda >= fechaFiltro.gte && 
            fechaPagoSegunda <= fechaFiltro.lte);
          
          if (cumpleFiltroFecha) {
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
          }
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

      // Agregar comisiones no desbloqueadas (agrupadas por contrato)
      const mitadesNoDesbloqueadas = [];
      if (!primeraMitadCumplida) {
        mitadesNoDesbloqueadas.push({
          tipo: 'primera_mitad',
          monto_comision: comisionPrimeraMitad,
          motivo: motivoPrimeraMitad
        });
      }
      if (!segundaMitadCumplida) {
        mitadesNoDesbloqueadas.push({
          tipo: 'segunda_mitad',
          monto_comision: comisionSegundaMitad,
          motivo: motivoSegundaMitad
        });
      }

      if (mitadesNoDesbloqueadas.length > 0) {
        comisionesNoDesbloqueadas.push({
          contrato_id: contrato.id,
          codigo_contrato: contrato.codigo_contrato,
          total_contrato: totalContrato,
          cliente: contrato.clientes.nombre_completo,
          fecha_evento: contrato.fecha_evento,
          total_pagado: totalPagado,
          porcentaje_pagado: porcentajePagado,
          mitades: mitadesNoDesbloqueadas,
          monto_total_comision: mitadesNoDesbloqueadas.reduce((sum, m) => sum + m.monto_comision, 0)
        });
      }
    }

    res.json({
      success: true,
      vendedor: {
        id: vendedorAdaptado.id,
        nombre_completo: vendedorAdaptado.nombre_completo,
        codigo_vendedor: vendedorAdaptado.codigo_vendedor,
        email: vendedorAdaptado.email
      },
      comisiones: {
        total_desbloqueadas: comisionesData.totalComisionesDesbloqueadas,
        total: comisionesData.totalComisiones,
        pendientes: comisionesPendientes.reduce((sum, c) => sum + c.monto_pendiente, 0),
        pagadas: comisionesPagadas.reduce((sum, c) => sum + c.monto_pagado, 0)
      },
      comisiones_pendientes: comisionesPendientes,
      comisiones_pagadas: comisionesPagadas,
      comisiones_no_desbloqueadas: comisionesNoDesbloqueadas
    });
  } catch (error) {
    logger.error('Error al obtener comisiones del vendedor:', error);
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/comisiones/resumen-pdf
 * @desc    Descargar PDF de resumen de pagos de comisiones del vendedor
 * @access  Private (Vendedor - solo puede descargar sus propias comisiones)
 */
router.get('/:id/comisiones/resumen-pdf', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedorId = parseInt(req.params.id);
    const { mes, año } = req.query;

    // Verificar que el vendedor solo pueda descargar sus propias comisiones
    if (req.user.id !== vendedorId) {
      throw new ValidationError('No tienes permiso para descargar estas comisiones');
    }

    if (!mes || !año) {
      throw new ValidationError('Debe proporcionar mes y año');
    }

    const mesNum = parseInt(mes);
    const añoNum = parseInt(año);

    // Obtener datos de comisiones (reutilizar lógica del endpoint anterior)
    const fechaInicio = new Date(añoNum, mesNum - 1, 1);
    const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);

    const vendedor = await prisma.usuarios.findFirst({
      where: { 
        id: vendedorId,
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true
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

    // Obtener datos de comisiones (similar al endpoint anterior)
    const comisionesData = await calcularComisionesDesbloqueadasVendedor(
      vendedorId,
      { gte: fechaInicio, lte: fechaFin }
    );

    const contratos = await prisma.contratos.findMany({
      where: { vendedor_id: vendedorId },
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

    const contratosConMontosPagados = await Promise.all(
      contratos.map(async (contrato) => {
        const montos = await prisma.$queryRaw`
          SELECT 
            COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
            COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto,
            fecha_pago_comision_primera,
            fecha_pago_comision_segunda
          FROM contratos
          WHERE id = ${contrato.id}
        `;
        return {
          ...contrato,
          comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
          comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0),
          fecha_pago_comision_primera: montos[0]?.fecha_pago_comision_primera || contrato.fecha_pago_comision_primera,
          fecha_pago_comision_segunda: montos[0]?.fecha_pago_comision_segunda || contrato.fecha_pago_comision_segunda
        };
      })
    );

    const comisionesPendientes = [];
    const comisionesPagadas = [];

    for (const contrato of contratosConMontosPagados) {
      const totalContrato = parseFloat(contrato.total_contrato || 0);
      const totalPagado = contrato.pagos.reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
      const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;

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

      if (primeraMitadCumplida) {
        if (estaCompletamentePagadaPrimera) {
          // Verificar si la fecha de pago está dentro del filtro (si hay filtro)
          const fechaPagoPrimera = contrato.fecha_pago_comision_primera ? new Date(contrato.fecha_pago_comision_primera) : null;
          const fechaFiltroPDF = { gte: fechaInicio, lte: fechaFin };
          const cumpleFiltroFecha = !fechaPagoPrimera || (fechaPagoPrimera >= fechaFiltroPDF.gte && 
            fechaPagoPrimera <= fechaFiltroPDF.lte);
          
          if (cumpleFiltroFecha) {
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
          }
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

      if (segundaMitadCumplida) {
        if (estaCompletamentePagadaSegunda) {
          // Verificar si la fecha de pago está dentro del filtro (si hay filtro)
          const fechaPagoSegunda = contrato.fecha_pago_comision_segunda ? new Date(contrato.fecha_pago_comision_segunda) : null;
          const fechaFiltroPDF = { gte: fechaInicio, lte: fechaFin };
          const cumpleFiltroFecha = !fechaPagoSegunda || (fechaPagoSegunda >= fechaFiltroPDF.gte && 
            fechaPagoSegunda <= fechaFiltroPDF.lte);
          
          if (cumpleFiltroFecha) {
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
          }
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

    // Preparar datos para el PDF (formato similar al de gerente pero con un solo vendedor)
    const vendedorConComisiones = {
      vendedor: {
        id: vendedorAdaptado.id,
        nombre_completo: vendedorAdaptado.nombre_completo,
        codigo_vendedor: vendedorAdaptado.codigo_vendedor,
        email: vendedorAdaptado.email
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

    const pdfBuffer = await generarResumenComisionesPDF([vendedorConComisiones], mesNum, añoNum);

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const nombreMes = nombresMeses[mesNum - 1];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Resumen-Comisiones-${nombreMes}-${añoNum}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error al generar PDF de comisiones del vendedor:', error);
    next(error);
  }
});

module.exports = router;
