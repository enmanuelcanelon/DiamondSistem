/**
 * Rutas de Vendedores
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

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
      prisma.vendedores.findMany({
        where: { activo: true },
        select: {
          id: true,
          nombre_completo: true,
          codigo_vendedor: true,
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
      prisma.vendedores.count({ where: { activo: true } })
    ]);

    res.json({
      success: true,
      count: vendedores.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      vendedores
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

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) },
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
      vendedor
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
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Obtener estadísticas
    const [
      totalClientes,
      totalOfertas,
      ofertasAceptadas,
      ofertasPendientes,
      ofertasRechazadas,
      totalContratos,
      contratosActivos,
      contratosPagados,
      contratosVendedor
    ] = await Promise.all([
      prisma.clientes.count({ where: { vendedor_id: parseInt(id) } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id) } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id), estado: 'aceptada' } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id), estado: 'pendiente' } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id), estado: 'rechazada' } }),
      prisma.contratos.count({ where: { vendedor_id: parseInt(id) } }),
      prisma.contratos.count({ where: { vendedor_id: parseInt(id), estado: 'activo' } }),
      prisma.contratos.count({ where: { vendedor_id: parseInt(id), estado_pago: 'completado' } }),
      prisma.contratos.findMany({
        where: { vendedor_id: parseInt(id) },
        select: {
          total_contrato: true
        }
      })
    ]);

    // Calcular total de ventas sumando todos los contratos
    const totalVentas = contratosVendedor.reduce((sum, contrato) => {
      return sum + parseFloat(contrato.total_contrato || 0);
    }, 0);

    // Calcular total de comisiones (3% fijo del total de ventas)
    // NOTA: El porcentaje de comisión es siempre 3% según la nueva lógica implementada
    const comisionPorcentaje = 3.0; // Porcentaje fijo
    const totalComisiones = totalVentas * (comisionPorcentaje / 100);

    // Calcular tasa de conversión
    const tasaConversion = totalOfertas > 0 
      ? ((ofertasAceptadas / totalOfertas) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      vendedor: {
        id: vendedor.id,
        nombre_completo: vendedor.nombre_completo,
        codigo_vendedor: vendedor.codigo_vendedor
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
          comision_porcentaje: comisionPorcentaje
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

    // CRÍTICO: Verificar que el vendedor solo vea sus propios clientes
    if (parseInt(id) !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver clientes de otro vendedor');
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);
    
    const [clientes, total] = await Promise.all([
      prisma.clientes.findMany({
        where: { vendedor_id: parseInt(id) },
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
      prisma.clientes.count({ where: { vendedor_id: parseInt(id) } })
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

    const contratos = await prisma.contratos.findMany({
      where: { vendedor_id: parseInt(id) },
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
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) }
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
          vendedor_id: parseInt(id),
          fecha_registro: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      // Ofertas creadas en el mes
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
      // Contratos creados en el mes
      prisma.contratos.count({
        where: {
          vendedor_id: parseInt(id),
          fecha_actualizacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),
      prisma.contratos.count({
        where: {
          vendedor_id: parseInt(id),
          estado: 'activo',
          fecha_actualizacion: {
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
      // Contratos con eventos en el mes (para calcular ventas)
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

    // Calcular ventas del mes (contratos con eventos en el mes)
    const totalVentasMes = contratosVendedorMes.reduce((sum, contrato) => {
      return sum + parseFloat(contrato.total_contrato || 0);
    }, 0);

    // Calcular comisiones del mes (3% fijo)
    // NOTA: El porcentaje de comisión es siempre 3% según la nueva lógica implementada
    const comisionPorcentaje = 3.0; // Porcentaje fijo
    const totalComisionesMes = totalVentasMes * (comisionPorcentaje / 100);

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
          comision_porcentaje: comisionPorcentaje
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

    const eventos = await prisma.contratos.findMany({
      where: {
        vendedor_id: parseInt(id),
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
            telefono: true
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

    // Agrupar eventos por día
    const eventosPorDia = {};
    eventos.forEach(evento => {
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
      total_eventos: eventos.length,
      eventos_por_dia: eventosPorDia,
      eventos: eventos
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
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        email: true,
        telefono: true,
        comision_porcentaje: true
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Obtener estadísticas del mes (reutilizar lógica del endpoint de stats)
    const fechaInicio = new Date(añoFiltro, mesFiltro - 1, 1);
    const fechaFin = new Date(añoFiltro, mesFiltro, 0, 23, 59, 59);

    // Calcular estadísticas del mes (similar al endpoint de stats/mes)
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
      `attachment; filename=Reporte-Mensual-${mesNombre}-${añoFiltro}.pdf`
    );

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

module.exports = router;
