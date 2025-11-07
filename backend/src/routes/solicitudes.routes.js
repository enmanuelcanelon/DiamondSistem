const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generarPDFContrato } = require('../utils/pdfContrato');

const prisma = getPrismaClient();

// =====================================================
// RUTAS PARA EL CLIENTE
// =====================================================

/**
 * POST /solicitudes/invitados
 * Cliente solicita agregar más invitados
 */
router.post('/invitados', authenticate, async (req, res) => {
  try {
    const { contrato_id, invitados_adicionales, cantidad_invitados, detalles_solicitud } = req.body;

    // Aceptar tanto invitados_adicionales como cantidad_invitados (para compatibilidad)
    const cantidadInvitados = invitados_adicionales || cantidad_invitados;

    if (!cantidadInvitados || cantidadInvitados <= 0) {
      return res.status(400).json({ 
        message: 'La cantidad de invitados adicionales debe ser mayor a 0' 
      });
    }

    // Verificar que el contrato existe y pertenece al cliente autenticado
    const contrato = await prisma.contratos.findFirst({
      where: {
        id: parseInt(contrato_id),
        cliente_id: req.user.tipo === 'cliente' ? req.user.id : undefined,
      },
      include: {
        clientes: true,
        salones: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // Validar capacidad máxima del salón si existe
    if (contrato.salones?.capacidad_maxima) {
      const capacidadMaxima = contrato.salones.capacidad_maxima;
      const cantidadActual = contrato.cantidad_invitados || 0;
      const cantidadTotal = cantidadActual + parseInt(cantidadInvitados);
      
      if (cantidadTotal > capacidadMaxima) {
        return res.status(400).json({
          message: `La capacidad máxima del salón es ${capacidadMaxima} invitados. No se puede crear esta solicitud.`,
          error: 'Excede capacidad máxima del salón'
        });
      }
    }

    // Crear solicitud
    const solicitud = await prisma.solicitudes_cliente.create({
      data: {
        contrato_id: parseInt(contrato_id),
        cliente_id: contrato.cliente_id,
        tipo_solicitud: 'invitados',
        invitados_adicionales: parseInt(cantidadInvitados),
        detalles_solicitud,
        estado: 'pendiente',
      },
    });

    res.status(201).json({
      message: 'Solicitud de invitados creada exitosamente',
      solicitud,
    });
  } catch (error) {
    logger.error('Error al crear solicitud de invitados', {
      error: error.message,
      stack: error.stack,
      contrato_id: req.body.contrato_id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al crear solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
    logger.error('Error al crear solicitud de servicio', {
      error: error.message,
      stack: error.stack,
      contrato_id: req.body.contrato_id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al crear solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
    logger.error('Error al obtener solicitudes', {
      error: error.message,
      stack: error.stack,
      contrato_id: req.params.contratoId,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
    logger.error('Error al obtener solicitudes pendientes', {
      error: error.message,
      stack: error.stack,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
    logger.error('Error al obtener solicitudes', {
      error: error.message,
      stack: error.stack,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
        contratos: {
          include: {
            salones: true,
          },
        },
        servicios: true,
      },
    });

    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada o ya fue procesada',
      });
    }

    // ✅ VALIDACIÓN: Verificar que haya cambios reales
    let hayCambiosReales = false;
    
    if (solicitud.tipo_solicitud === 'invitados') {
      const invitadosAdicionales = solicitud.invitados_adicionales || 0;
      
      // Contar invitados ya agregados directamente desde "Asignación de Mesas"
      const invitadosAgregadosDirectamente = await prisma.invitados.count({
        where: {
          contrato_id: solicitud.contrato_id,
        },
      });
      
      // El número de invitados en el contrato debe ser igual o menor al número de invitados agregados directamente
      // Si hay más invitados agregados directamente que en cantidad_invitados, la solicitud es válida
      // Si cantidad_invitados ya incluye todos los invitados agregados, entonces invitados_adicionales > 0 es válido
      hayCambiosReales = invitadosAdicionales > 0;
      
      // Validación adicional: verificar capacidad del salón si existe
      if (solicitud.contratos.salones?.capacidad_maxima) {
        const capacidadMaxima = solicitud.contratos.salones.capacidad_maxima;
        const cantidadActual = solicitud.contratos.cantidad_invitados || 0;
        const cantidadTotal = cantidadActual + invitadosAdicionales;
        
        if (cantidadTotal > capacidadMaxima) {
          return res.status(400).json({
            message: `La capacidad máxima del salón es ${capacidadMaxima} invitados. No se puede aprobar esta solicitud.`,
            error: 'Excede capacidad máxima del salón'
          });
        }
      }
    } else if (solicitud.tipo_solicitud === 'servicio') {
      const costoAdicional = parseFloat(solicitud.costo_adicional) || 0;
      hayCambiosReales = costoAdicional > 0;
    }

    // Si no hay cambios reales, rechazar la solicitud automáticamente
    if (!hayCambiosReales) {
      await prisma.solicitudes_cliente.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'rechazada',
          respondido_por: req.user.id,
          fecha_respuesta: new Date(),
        },
      });

      return res.status(400).json({
        message: 'No se puede aprobar: la solicitud no contiene cambios reales',
        error: 'No hay modificaciones válidas en la solicitud'
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
        const cantidadAnterior = solicitud.contratos.cantidad_invitados || 0;
        const invitadosAdicionales = parseInt(solicitud.invitados_adicionales) || 0;
        
        if (invitadosAdicionales <= 0) {
          throw new Error('La cantidad de invitados adicionales debe ser mayor a 0');
        }
        
        const cantidadNueva = cantidadAnterior + invitadosAdicionales;
        
        // Actualizar cantidad_invitados en el contrato
        const contratoActualizado = await tx.contratos.update({
          where: { id: solicitud.contrato_id },
          data: {
            cantidad_invitados: cantidadNueva,
          },
        });

        descripcionCambio = `Se agregaron ${invitadosAdicionales} invitado(s) adicional(es). Antes: ${cantidadAnterior}, Ahora: ${cantidadNueva}`;
        
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

        // 3.5. Crear una nueva versión del contrato PDF
        // Obtener el contrato actualizado con todas las relaciones
        const contratoActualizado = await tx.contratos.findUnique({
          where: { id: solicitud.contrato_id },
          include: {
            clientes: true,
            vendedores: true,
            paquetes: true,
            ofertas: {
              include: {
                temporadas: true,
              },
            },
            contratos_servicios: {
              include: {
                servicios: true,
              },
            },
          },
        });

        // Obtener el próximo número de versión
        const ultimaVersion = await tx.versiones_contratos_pdf.findFirst({
          where: { contrato_id: solicitud.contrato_id },
          orderBy: { version_numero: 'desc' },
        });

        const nuevoNumeroVersion = ultimaVersion ? ultimaVersion.version_numero + 1 : 1;

        // Generar el PDF (se ejecuta fuera de la transacción)
        let pdfBuffer = null;
        try {
          const doc = generarPDFContrato(contratoActualizado);
          const chunks = [];
          
          doc.on('data', (chunk) => chunks.push(chunk));
          
          await new Promise((resolve, reject) => {
            doc.on('end', resolve);
            doc.on('error', reject);
            doc.end();
          });

          pdfBuffer = Buffer.concat(chunks);
        } catch (pdfError) {
          logger.error('Error generando PDF', {
            error: pdfError.message,
            stack: pdfError.stack,
            contrato_id: solicitud.contrato_id,
            solicitud_id: solicitud.id
          });
          // No fallar la transacción si el PDF falla
        }

        // Guardar la versión
        await tx.versiones_contratos_pdf.create({
          data: {
            contrato_id: solicitud.contrato_id,
            version_numero: nuevoNumeroVersion,
            total_contrato: contratoActualizado.total_contrato,
            cantidad_invitados: contratoActualizado.cantidad_invitados,
            motivo_cambio: descripcionCambio,
            cambios_detalle: {
              tipo_solicitud: solicitud.tipo_solicitud,
              solicitud_id: solicitud.id,
              invitados_adicionales: solicitud.invitados_adicionales,
              servicio_id: solicitud.servicio_id,
              cantidad_servicio: solicitud.cantidad_servicio,
              costo_adicional: solicitud.costo_adicional,
            },
            pdf_contenido: pdfBuffer,
            generado_por: req.user.id,
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
    logger.error('Error al aprobar solicitud', {
      error: error.message,
      stack: error.stack,
      solicitud_id: req.params.id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al aprobar solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
    logger.error('Error al rechazar solicitud', {
      error: error.message,
      stack: error.stack,
      solicitud_id: req.params.id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al rechazar solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
    logger.error('Error al obtener estadísticas', {
      error: error.message,
      stack: error.stack,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    });
  }
});

module.exports = router;
