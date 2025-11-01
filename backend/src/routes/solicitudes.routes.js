const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// =====================================================
// RUTAS PARA EL CLIENTE
// =====================================================

/**
 * POST /solicitudes/invitados
 * Cliente solicita agregar más invitados
 */
router.post('/invitados', authenticate, async (req, res) => {
  try {
    const { contrato_id, cantidad_invitados, detalles_solicitud } = req.body;

    // Verificar que el contrato existe y pertenece al cliente autenticado
    const contrato = await prisma.contratos.findFirst({
      where: {
        id: parseInt(contrato_id),
        cliente_id: req.user.tipo === 'cliente' ? req.user.id : undefined,
      },
      include: {
        clientes: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // Crear solicitud
    const solicitud = await prisma.solicitudes_cliente.create({
      data: {
        contrato_id: parseInt(contrato_id),
        cliente_id: contrato.cliente_id,
        tipo_solicitud: 'invitados',
        invitados_adicionales: parseInt(cantidad_invitados),
        detalles_solicitud,
        estado: 'pendiente',
      },
    });

    res.status(201).json({
      message: 'Solicitud de invitados creada exitosamente',
      solicitud,
    });
  } catch (error) {
    console.error('Error al crear solicitud de invitados:', error);
    res.status(500).json({
      message: 'Error al crear solicitud',
      error: error.message,
    });
  }
});

/**
 * POST /solicitudes/servicio
 * Cliente solicita agregar un servicio adicional
 */
router.post('/servicio', authenticate, async (req, res) => {
  try {
    const {
      contrato_id,
      servicio_id,
      cantidad_servicio,
      detalles_solicitud,
    } = req.body;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findFirst({
      where: {
        id: parseInt(contrato_id),
        cliente_id: req.user.tipo === 'cliente' ? req.user.id : undefined,
      },
      include: {
        clientes: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // Verificar que el servicio existe
    const servicio = await prisma.servicios.findUnique({
      where: { id: parseInt(servicio_id) },
    });

    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Calcular costo adicional
    const cantidad = parseInt(cantidad_servicio) || 1;
    const costo_adicional =
      servicio.tipo_cobro === 'por_persona'
        ? parseFloat(servicio.precio_base) * contrato.cantidad_invitados * cantidad
        : parseFloat(servicio.precio_base) * cantidad;

    // Crear solicitud
    const solicitud = await prisma.solicitudes_cliente.create({
      data: {
        contrato_id: parseInt(contrato_id),
        cliente_id: contrato.cliente_id,
        tipo_solicitud: 'servicio',
        servicio_id: parseInt(servicio_id),
        cantidad_servicio: cantidad,
        costo_adicional,
        detalles_solicitud,
        estado: 'pendiente',
      },
      include: {
        servicios: true,
      },
    });

    res.status(201).json({
      message: 'Solicitud de servicio creada exitosamente',
      solicitud,
    });
  } catch (error) {
    console.error('Error al crear solicitud de servicio:', error);
    res.status(500).json({
      message: 'Error al crear solicitud',
      error: error.message,
    });
  }
});

/**
 * GET /solicitudes/contrato/:contratoId
 * Obtener todas las solicitudes de un contrato
 */
router.get('/contrato/:contratoId', authenticate, async (req, res) => {
  try {
    const { contratoId } = req.params;

    const solicitudes = await prisma.solicitudes_cliente.findMany({
      where: {
        contrato_id: parseInt(contratoId),
      },
      include: {
        servicios: true,
      },
      orderBy: {
        fecha_solicitud: 'desc',
      },
    });

    res.json({ solicitudes });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: error.message,
    });
  }
});

// =====================================================
// RUTAS PARA EL VENDEDOR
// =====================================================

/**
 * GET /solicitudes/vendedor/pendientes
 * Obtener todas las solicitudes pendientes del vendedor autenticado
 */
router.get('/vendedor/pendientes', authenticate, async (req, res) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const solicitudes = await prisma.solicitudes_cliente.findMany({
      where: {
        contratos: {
          vendedor_id: req.user.id, // ✅ Filtro crítico: solo SUS clientes
        },
        estado: 'pendiente',
      },
      include: {
        contratos: {
          include: {
            clientes: true,
          },
        },
        servicios: true,
      },
      orderBy: {
        fecha_solicitud: 'asc', // Las más antiguas primero
      },
    });

    res.json({
      solicitudes,
      total: solicitudes.length,
    });
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: error.message,
    });
  }
});

/**
 * GET /solicitudes/vendedor/todas
 * Obtener todas las solicitudes del vendedor (con filtros opcionales)
 */
router.get('/vendedor/todas', authenticate, async (req, res) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { estado, tipo_solicitud } = req.query;

    const where = {
      contratos: {
        vendedor_id: req.user.id, // ✅ Filtro crítico: solo SUS clientes
      },
    };

    if (estado) {
      where.estado = estado;
    }

    if (tipo_solicitud) {
      where.tipo_solicitud = tipo_solicitud;
    }

    const solicitudes = await prisma.solicitudes_cliente.findMany({
      where,
      include: {
        contratos: {
          include: {
            clientes: true,
          },
        },
        servicios: true,
      },
      orderBy: [
        {
          fecha_solicitud: 'desc',
        },
      ],
    });

    res.json({
      solicitudes,
      total: solicitudes.length,
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: error.message,
    });
  }
});

/**
 * PUT /solicitudes/:id/aprobar
 * Vendedor aprueba una solicitud
 */
router.put('/:id/aprobar', authenticate, async (req, res) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { id } = req.params;

    // Verificar que la solicitud existe y pertenece a un cliente del vendedor
    const solicitud = await prisma.solicitudes_cliente.findFirst({
      where: {
        id: parseInt(id),
        contratos: {
          vendedor_id: req.user.id, // ✅ Seguridad: solo SUS solicitudes
        },
        estado: 'pendiente',
      },
      include: {
        contratos: true,
        servicios: true,
      },
    });

    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada o ya fue procesada',
      });
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar la solicitud
      const solicitudActualizada = await tx.solicitudes_cliente.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'aprobada',
          respondido_por: req.user.id,
          fecha_respuesta: new Date(),
        },
      });

      let descripcionCambio = '';

      // 2. Actualizar el contrato según el tipo de solicitud
      if (solicitud.tipo_solicitud === 'invitados') {
        // Agregar invitados al contrato
        const cantidadAnterior = solicitud.contratos.cantidad_invitados;
        const cantidadNueva = cantidadAnterior + solicitud.invitados_adicionales;
        
        await tx.contratos.update({
          where: { id: solicitud.contrato_id },
          data: {
            cantidad_invitados: cantidadNueva,
          },
        });

        descripcionCambio = `Se agregaron ${solicitud.invitados_adicionales} invitados adicionales. Antes: ${cantidadAnterior}, Ahora: ${cantidadNueva}`;
        
      } else if (solicitud.tipo_solicitud === 'servicio') {
        // Obtener el servicio completo
        const servicio = await tx.servicios.findUnique({
          where: { id: solicitud.servicio_id },
        });

        if (!servicio) {
          throw new Error('Servicio no encontrado');
        }

          // Agregar servicio al contrato
          await tx.contratos_servicios.create({
            data: {
              contrato_id: solicitud.contrato_id,
              servicio_id: solicitud.servicio_id,
              cantidad: solicitud.cantidad_servicio || 1,
              precio_unitario: parseFloat(servicio.precio_base),
              subtotal: parseFloat(solicitud.costo_adicional),
              incluido_en_paquete: false,
            },
          });

        // Actualizar total del contrato
        const totalAnterior = solicitud.contratos.total_contrato;
        const totalNuevo = parseFloat(totalAnterior) + parseFloat(solicitud.costo_adicional);
        
        await tx.contratos.update({
          where: { id: solicitud.contrato_id },
          data: {
            total_contrato: totalNuevo,
          },
        });

        descripcionCambio = `Se agregó el servicio "${servicio.nombre}" x${solicitud.cantidad_servicio || 1}. Costo adicional: $${parseFloat(solicitud.costo_adicional).toFixed(2)}. Total anterior: $${parseFloat(totalAnterior).toFixed(2)}, Total nuevo: $${totalNuevo.toFixed(2)}`;
      }

        // 3. Registrar en historial de cambios de precios
        await tx.historial_cambios_precios.create({
          data: {
            contrato_id: solicitud.contrato_id,
            modificado_por: req.user.id,
            precio_original: parseFloat(solicitud.contratos.total_contrato),
            precio_nuevo: solicitud.tipo_solicitud === 'servicio' 
              ? parseFloat(solicitud.contratos.total_contrato) + parseFloat(solicitud.costo_adicional)
              : parseFloat(solicitud.contratos.total_contrato),
            motivo: descripcionCambio,
          },
        });

        // 4. Enviar mensaje al cliente informando
        await tx.mensajes.create({
          data: {
            contrato_id: solicitud.contrato_id,
            remitente_tipo: 'vendedor',
            remitente_id: req.user.id,
            destinatario_tipo: 'cliente',
            destinatario_id: solicitud.cliente_id,
            mensaje: `✅ Tu solicitud ha sido aprobada: ${descripcionCambio}`,
            leido: false,
          },
        });

      return solicitudActualizada;
    });

    res.json({
      message: 'Solicitud aprobada exitosamente',
      solicitud: resultado,
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({
      message: 'Error al aprobar solicitud',
      error: error.message,
    });
  }
});

/**
 * PUT /solicitudes/:id/rechazar
 * Vendedor rechaza una solicitud
 */
router.put('/:id/rechazar', authenticate, async (req, res) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { id } = req.params;
    const { motivo_rechazo } = req.body;

    // Verificar que la solicitud existe y pertenece a un cliente del vendedor
    const solicitud = await prisma.solicitudes_cliente.findFirst({
      where: {
        id: parseInt(id),
        contratos: {
          vendedor_id: req.user.id, // ✅ Seguridad: solo SUS solicitudes
        },
        estado: 'pendiente',
      },
    });

    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada o ya fue procesada',
      });
    }

    // Actualizar solicitud y enviar mensaje
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar solicitud
      const solicitudActualizada = await tx.solicitudes_cliente.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'rechazada',
          respondido_por: req.user.id,
          fecha_respuesta: new Date(),
          motivo_rechazo,
        },
      });

        // 2. Enviar mensaje al cliente informando
        const contratoData = await tx.contratos.findUnique({
          where: { id: solicitud.contrato_id },
          select: { cliente_id: true },
        });
        
        await tx.mensajes.create({
          data: {
            contrato_id: solicitud.contrato_id,
            remitente_tipo: 'vendedor',
            remitente_id: req.user.id,
            destinatario_tipo: 'cliente',
            destinatario_id: contratoData.cliente_id,
            mensaje: `❌ Tu solicitud ha sido rechazada. Motivo: ${motivo_rechazo}`,
            leido: false,
          },
        });

      return solicitudActualizada;
    });

    res.json({
      message: 'Solicitud rechazada',
      solicitud: resultado,
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({
      message: 'Error al rechazar solicitud',
      error: error.message,
    });
  }
});

/**
 * GET /solicitudes/vendedor/estadisticas
 * Obtener estadísticas de solicitudes del vendedor
 */
router.get('/vendedor/estadisticas', authenticate, async (req, res) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [pendientes, aprobadas, rechazadas, total] = await Promise.all([
      prisma.solicitudes_cliente.count({
        where: {
          contratos: { vendedor_id: req.user.id },
          estado: 'pendiente',
        },
      }),
      prisma.solicitudes_cliente.count({
        where: {
          contratos: { vendedor_id: req.user.id },
          estado: 'aprobada',
        },
      }),
      prisma.solicitudes_cliente.count({
        where: {
          contratos: { vendedor_id: req.user.id },
          estado: 'rechazada',
        },
      }),
      prisma.solicitudes_cliente.count({
        where: {
          contratos: { vendedor_id: req.user.id },
        },
      }),
    ]);

    res.json({
      estadisticas: {
        pendientes,
        aprobadas,
        rechazadas,
        total,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
});

module.exports = router;
