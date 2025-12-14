/**
 * ============================================
 * RUTAS DE COMUNICACIONES - OMNICHANNEL
 * ============================================
 * Endpoints para WhatsApp, Voz (llamadas), SMS y Email
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Servicios
const whatsappService = require('../services/whatsappService');
const twilioService = require('../services/twilioService');
const gmailService = require('../services/gmailService');

const prisma = getPrismaClient();

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

/**
 * Validar que el teléfono sea válido
 */
const validarTelefono = (req, res, next) => {
  const telefono = req.body.telefono || req.body.hacia;
  if (!telefono) {
    return next(new ValidationError('El teléfono es requerido'));
  }
  next();
};

// ============================================
// ENDPOINTS DE WHATSAPP
// ============================================

/**
 * @route   POST /api/comunicaciones/whatsapp/enviar
 * @desc    Enviar mensaje de WhatsApp
 * @access  Private (Vendedor)
 */
router.post('/whatsapp/enviar', authenticate, requireVendedor, validarTelefono, async (req, res, next) => {
  try {
    const { telefono, mensaje, leadId, clienteId, contratoId, templateName, templateParams } = req.body;

    if (!mensaje && !templateName) {
      throw new ValidationError('Debe proporcionar un mensaje o un template');
    }

    let resultado;
    
    if (templateName) {
      // Enviar con template
      resultado = await whatsappService.enviarMensajeTemplate(
        telefono, 
        templateName, 
        'es', 
        templateParams || []
      );
    } else {
      // Enviar mensaje de texto
      resultado = await whatsappService.enviarMensajeTexto(telefono, mensaje);
    }

    // Guardar en la base de datos
    const comunicacion = await prisma.comunicaciones.create({
      data: {
        lead_id: leadId ? parseInt(leadId) : null,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        contrato_id: contratoId ? parseInt(contratoId) : null,
        usuario_id: req.user.id,
        canal: 'whatsapp',
        direccion: 'saliente',
        destinatario: telefono,
        contenido: templateName ? `[Template: ${templateName}]` : mensaje,
        estado: 'enviado',
        sid_externo: resultado.messageId
      }
    });

    res.json({
      success: true,
      message: 'Mensaje de WhatsApp enviado exitosamente',
      data: {
        comunicacionId: comunicacion.id,
        messageId: resultado.messageId,
        to: resultado.to
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/webhook/whatsapp
 * @desc    Verificación de webhook de Meta (WhatsApp)
 * @access  Public (verificación de Meta)
 */
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const resultado = whatsappService.verificarWebhook(mode, token, challenge);

  if (resultado.success) {
    logger.info('Webhook de WhatsApp verificado');
    res.status(200).send(resultado.challenge);
  } else {
    logger.warn('Verificación de webhook WhatsApp fallida');
    res.sendStatus(403);
  }
});

/**
 * @route   POST /api/comunicaciones/webhook/whatsapp
 * @desc    Recibir mensajes entrantes de WhatsApp
 * @access  Public (webhook de Meta)
 */
router.post('/webhook/whatsapp', async (req, res) => {
  // IMPORTANTE: Responder 200 inmediatamente para que Meta no reintente
  res.sendStatus(200);

  // Procesar el webhook de forma asíncrona
  try {
    const mensajeProcesado = whatsappService.procesarWebhook(req.body);

    if (!mensajeProcesado) {
      return; // No es un mensaje procesable
    }

    if (mensajeProcesado.tipo === 'mensaje_entrante') {
      // Buscar si hay un lead o cliente con ese teléfono
      const telefonoLimpio = mensajeProcesado.from.replace(/\D/g, '');
      
      const [lead, cliente] = await Promise.all([
        prisma.leaks.findFirst({
          where: {
            telefono: { contains: telefonoLimpio.slice(-10) }
          },
          select: { id: true, usuario_id: true }
        }),
        prisma.clientes.findFirst({
          where: {
            telefono: { contains: telefonoLimpio.slice(-10) }
          },
          select: { id: true, usuario_id: true }
        })
      ]);

      // Guardar mensaje entrante en la base de datos
      // Usar el usuario asignado al lead/cliente, o un usuario por defecto
      const usuarioId = lead?.usuario_id || cliente?.usuario_id || 1; // ID 1 como fallback

      await prisma.comunicaciones.create({
        data: {
          lead_id: lead?.id || null,
          cliente_id: cliente?.id || null,
          usuario_id: usuarioId,
          canal: 'whatsapp',
          direccion: 'entrante',
          destinatario: mensajeProcesado.from,
          contenido: mensajeProcesado.contenido,
          estado: 'recibido',
          sid_externo: mensajeProcesado.messageId
        }
      });

      logger.info('Mensaje WhatsApp entrante guardado', {
        from: mensajeProcesado.from,
        leadId: lead?.id,
        clienteId: cliente?.id
      });

    } else if (mensajeProcesado.tipo === 'estado_mensaje') {
      // Actualizar estado del mensaje enviado
      if (mensajeProcesado.messageId) {
        await prisma.comunicaciones.updateMany({
          where: { sid_externo: mensajeProcesado.messageId },
          data: { estado: mensajeProcesado.estado }
        });
      }
    }

  } catch (error) {
    logger.error('Error al procesar webhook de WhatsApp:', error);
    // No lanzar el error porque ya respondimos 200
  }
});

// ============================================
// ENDPOINTS DE VOZ (LLAMADAS)
// ============================================

/**
 * @route   POST /api/comunicaciones/voz/token
 * @desc    Generar token de Twilio para llamadas desde el navegador
 * @access  Private (Vendedor)
 */
router.post('/voz/token', authenticate, requireVendedor, async (req, res, next) => {
  try {
    if (!twilioService.isVoiceConfigured()) {
      throw new ValidationError('El servicio de llamadas no está configurado');
    }

    const tokenData = twilioService.generarTokenVoz(req.user.id);

    res.json({
      success: true,
      data: tokenData
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/comunicaciones/voz/llamar
 * @desc    Iniciar una llamada saliente (alternativa sin WebRTC)
 * @access  Private (Vendedor)
 */
router.post('/voz/llamar', authenticate, requireVendedor, validarTelefono, async (req, res, next) => {
  try {
    const { hacia, leadId, clienteId, contratoId } = req.body;

    if (!twilioService.isConfigured()) {
      throw new ValidationError('El servicio de llamadas no está configurado');
    }

    // URL del webhook para TwiML
    const baseUrl = process.env.BACKEND_URL || 'https://diamondsistem-production.up.railway.app';
    const webhookUrl = `${baseUrl}/api/comunicaciones/webhook/voz`;

    const resultado = await twilioService.hacerLlamada(null, hacia, webhookUrl);

    // Guardar en la base de datos
    const comunicacion = await prisma.comunicaciones.create({
      data: {
        lead_id: leadId ? parseInt(leadId) : null,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        contrato_id: contratoId ? parseInt(contratoId) : null,
        usuario_id: req.user.id,
        canal: 'voz',
        direccion: 'saliente',
        destinatario: hacia,
        contenido: null,
        estado: resultado.status,
        sid_externo: resultado.callSid
      }
    });

    res.json({
      success: true,
      message: 'Llamada iniciada',
      data: {
        comunicacionId: comunicacion.id,
        callSid: resultado.callSid,
        status: resultado.status
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/comunicaciones/webhook/voz
 * @desc    Webhook de Twilio para TwiML de llamadas
 * @access  Public (webhook de Twilio)
 */
router.post('/webhook/voz', async (req, res) => {
  try {
    const numeroDestino = req.body.To;
    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus;

    // Si es una actualización de estado, procesar y responder rápido
    if (callStatus && callStatus !== 'ringing' && callSid) {
      // Actualizar estado en la base de datos
      prisma.comunicaciones.updateMany({
        where: { sid_externo: callSid },
        data: { 
          estado: callStatus,
          duracion_seg: req.body.CallDuration ? parseInt(req.body.CallDuration) : null
        }
      }).catch(err => logger.error('Error al actualizar estado de llamada:', err));
    }

    // Si hay un número destino, generar TwiML para la llamada
    if (numeroDestino) {
      const twiml = twilioService.generarTwiMLLlamada(numeroDestino);
      res.type('text/xml');
      res.send(twiml);
    } else {
      // Respuesta vacía para callbacks de estado
      res.type('text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

  } catch (error) {
    logger.error('Error en webhook de voz:', error);
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

/**
 * @route   POST /api/comunicaciones/webhook/voz/status
 * @desc    Webhook de estado de llamadas de Twilio
 * @access  Public (webhook de Twilio)
 */
router.post('/webhook/voz/status', async (req, res) => {
  res.sendStatus(200);

  try {
    const { CallSid, CallStatus, CallDuration } = req.body;

    if (CallSid) {
      await prisma.comunicaciones.updateMany({
        where: { sid_externo: CallSid },
        data: {
          estado: CallStatus,
          duracion_seg: CallDuration ? parseInt(CallDuration) : null
        }
      });

      logger.info('Estado de llamada actualizado', { CallSid, CallStatus, CallDuration });
    }

  } catch (error) {
    logger.error('Error al actualizar estado de llamada:', error);
  }
});

// ============================================
// ENDPOINTS DE SMS
// ============================================

/**
 * @route   POST /api/comunicaciones/sms/enviar
 * @desc    Enviar SMS
 * @access  Private (Vendedor)
 */
router.post('/sms/enviar', authenticate, requireVendedor, validarTelefono, async (req, res, next) => {
  try {
    const { telefono, mensaje, leadId, clienteId, contratoId } = req.body;

    if (!mensaje) {
      throw new ValidationError('El mensaje es requerido');
    }

    if (!twilioService.isConfigured()) {
      throw new ValidationError('El servicio de SMS no está configurado');
    }

    const resultado = await twilioService.enviarSMS(telefono, mensaje);

    // Guardar en la base de datos
    const comunicacion = await prisma.comunicaciones.create({
      data: {
        lead_id: leadId ? parseInt(leadId) : null,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        contrato_id: contratoId ? parseInt(contratoId) : null,
        usuario_id: req.user.id,
        canal: 'sms',
        direccion: 'saliente',
        destinatario: telefono,
        contenido: mensaje,
        estado: resultado.status,
        sid_externo: resultado.messageSid
      }
    });

    res.json({
      success: true,
      message: 'SMS enviado exitosamente',
      data: {
        comunicacionId: comunicacion.id,
        messageSid: resultado.messageSid,
        to: resultado.to,
        status: resultado.status
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/comunicaciones/webhook/sms
 * @desc    Webhook para recibir SMS entrantes
 * @access  Public (webhook de Twilio)
 */
router.post('/webhook/sms', async (req, res) => {
  // Responder con TwiML vacío
  res.type('text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  try {
    const { From, Body, MessageSid, MessageStatus } = req.body;

    // Si es una actualización de estado
    if (MessageSid && MessageStatus && !Body) {
      await prisma.comunicaciones.updateMany({
        where: { sid_externo: MessageSid },
        data: { estado: MessageStatus }
      });
      return;
    }

    // Si es un SMS entrante
    if (From && Body) {
      const telefonoLimpio = From.replace(/\D/g, '');

      // Buscar lead o cliente
      const [lead, cliente] = await Promise.all([
        prisma.leaks.findFirst({
          where: { telefono: { contains: telefonoLimpio.slice(-10) } },
          select: { id: true, usuario_id: true }
        }),
        prisma.clientes.findFirst({
          where: { telefono: { contains: telefonoLimpio.slice(-10) } },
          select: { id: true, usuario_id: true }
        })
      ]);

      const usuarioId = lead?.usuario_id || cliente?.usuario_id || 1;

      await prisma.comunicaciones.create({
        data: {
          lead_id: lead?.id || null,
          cliente_id: cliente?.id || null,
          usuario_id: usuarioId,
          canal: 'sms',
          direccion: 'entrante',
          destinatario: From,
          contenido: Body,
          estado: 'recibido',
          sid_externo: MessageSid
        }
      });

      logger.info('SMS entrante guardado', { from: From });
    }

  } catch (error) {
    logger.error('Error al procesar webhook de SMS:', error);
  }
});

// ============================================
// ENDPOINTS DE EMAIL
// ============================================

/**
 * @route   GET /api/comunicaciones/email/bandeja
 * @desc    Obtener bandeja de entrada de emails
 * @access  Private (Vendedor)
 */
router.get('/email/bandeja', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { maxResults = 20, q } = req.query;

    if (!gmailService.isConfigured()) {
      throw new ValidationError('El servicio de email no está configurado');
    }

    const emails = await gmailService.obtenerBandeja(
      req.user.id, 
      parseInt(maxResults), 
      q || ''
    );

    res.json({
      success: true,
      count: emails.length,
      data: emails
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/email/:emailId
 * @desc    Obtener un email específico
 * @access  Private (Vendedor)
 */
router.get('/email/:emailId', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { emailId } = req.params;

    if (!gmailService.isConfigured()) {
      throw new ValidationError('El servicio de email no está configurado');
    }

    const email = await gmailService.obtenerEmail(req.user.id, emailId);

    res.json({
      success: true,
      data: email
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/comunicaciones/email/enviar
 * @desc    Enviar un email
 * @access  Private (Vendedor)
 */
router.post('/email/enviar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { destinatario, asunto, cuerpo, cc, bcc, leadId, clienteId, contratoId } = req.body;

    if (!destinatario || !asunto || !cuerpo) {
      throw new ValidationError('Destinatario, asunto y cuerpo son requeridos');
    }

    if (!gmailService.isConfigured()) {
      throw new ValidationError('El servicio de email no está configurado');
    }

    const resultado = await gmailService.enviarEmail(
      req.user.id,
      destinatario,
      asunto,
      cuerpo,
      cc || '',
      bcc || ''
    );

    // Guardar en la base de datos
    const comunicacion = await prisma.comunicaciones.create({
      data: {
        lead_id: leadId ? parseInt(leadId) : null,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        contrato_id: contratoId ? parseInt(contratoId) : null,
        usuario_id: req.user.id,
        canal: 'email',
        direccion: 'saliente',
        destinatario: destinatario,
        contenido: `[${asunto}] ${cuerpo.substring(0, 500)}`,
        estado: 'enviado',
        sid_externo: resultado.messageId
      }
    });

    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      data: {
        comunicacionId: comunicacion.id,
        messageId: resultado.messageId,
        to: resultado.to
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/comunicaciones/email/:emailId/marcar-leido
 * @desc    Marcar un email como leído
 * @access  Private (Vendedor)
 */
router.post('/email/:emailId/marcar-leido', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { emailId } = req.params;

    await gmailService.marcarComoLeido(req.user.id, emailId);

    res.json({
      success: true,
      message: 'Email marcado como leído'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/comunicaciones/email/:emailId/responder
 * @desc    Responder a un email
 * @access  Private (Vendedor)
 */
router.post('/email/:emailId/responder', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { emailId } = req.params;
    const { cuerpo, leadId, clienteId, contratoId } = req.body;

    if (!cuerpo) {
      throw new ValidationError('El cuerpo de la respuesta es requerido');
    }

    const resultado = await gmailService.responderEmail(req.user.id, emailId, cuerpo);

    // Guardar en la base de datos
    const comunicacion = await prisma.comunicaciones.create({
      data: {
        lead_id: leadId ? parseInt(leadId) : null,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        contrato_id: contratoId ? parseInt(contratoId) : null,
        usuario_id: req.user.id,
        canal: 'email',
        direccion: 'saliente',
        destinatario: resultado.to,
        contenido: `[Re: ${resultado.subject}] ${cuerpo.substring(0, 500)}`,
        estado: 'enviado',
        sid_externo: resultado.messageId
      }
    });

    res.json({
      success: true,
      message: 'Respuesta enviada exitosamente',
      data: {
        comunicacionId: comunicacion.id,
        messageId: resultado.messageId
      }
    });

  } catch (error) {
    next(error);
  }
});

// ============================================
// ENDPOINTS DE HISTORIAL
// ============================================

/**
 * @route   GET /api/comunicaciones/historial/:leadId
 * @desc    Obtener historial de comunicaciones de un lead
 * @access  Private (Vendedor)
 */
router.get('/historial/:leadId', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const comunicaciones = await prisma.comunicaciones.findMany({
      where: { lead_id: parseInt(leadId) },
      orderBy: { fecha_creacion: 'desc' },
      include: {
        usuarios: {
          select: { id: true, nombre_completo: true }
        }
      }
    });

    res.json({
      success: true,
      count: comunicaciones.length,
      data: comunicaciones
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/historial/cliente/:clienteId
 * @desc    Obtener historial de comunicaciones de un cliente
 * @access  Private (Vendedor)
 */
router.get('/historial/cliente/:clienteId', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { clienteId } = req.params;

    const comunicaciones = await prisma.comunicaciones.findMany({
      where: { cliente_id: parseInt(clienteId) },
      orderBy: { fecha_creacion: 'desc' },
      include: {
        usuarios: {
          select: { id: true, nombre_completo: true }
        }
      }
    });

    res.json({
      success: true,
      count: comunicaciones.length,
      data: comunicaciones
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/historial/contrato/:contratoId
 * @desc    Obtener historial de comunicaciones de un contrato
 * @access  Private (Vendedor)
 */
router.get('/historial/contrato/:contratoId', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const comunicaciones = await prisma.comunicaciones.findMany({
      where: { contrato_id: parseInt(contratoId) },
      orderBy: { fecha_creacion: 'desc' },
      include: {
        usuarios: {
          select: { id: true, nombre_completo: true }
        }
      }
    });

    res.json({
      success: true,
      count: comunicaciones.length,
      data: comunicaciones
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/mis-comunicaciones
 * @desc    Obtener las comunicaciones del vendedor autenticado
 * @access  Private (Vendedor)
 */
router.get('/mis-comunicaciones', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { canal, direccion, desde, hasta, limit = 50 } = req.query;

    const where = {
      usuario_id: req.user.id
    };

    if (canal) {
      where.canal = canal;
    }

    if (direccion) {
      where.direccion = direccion;
    }

    if (desde || hasta) {
      where.fecha_creacion = {};
      if (desde) {
        where.fecha_creacion.gte = new Date(desde);
      }
      if (hasta) {
        where.fecha_creacion.lte = new Date(hasta);
      }
    }

    const comunicaciones = await prisma.comunicaciones.findMany({
      where,
      orderBy: { fecha_creacion: 'desc' },
      take: parseInt(limit),
      include: {
        leaks: {
          select: { id: true, nombre_completo: true, telefono: true }
        },
        clientes: {
          select: { id: true, nombre_completo: true, telefono: true }
        }
      }
    });

    res.json({
      success: true,
      count: comunicaciones.length,
      data: comunicaciones
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/stats
 * @desc    Obtener estadísticas de comunicaciones
 * @access  Private (Vendedor)
 */
router.get('/stats', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedorId = req.user.id;

    // Estadísticas por canal
    const porCanal = await prisma.comunicaciones.groupBy({
      by: ['canal'],
      where: { usuario_id: vendedorId },
      _count: { id: true }
    });

    // Estadísticas por dirección
    const porDireccion = await prisma.comunicaciones.groupBy({
      by: ['direccion'],
      where: { usuario_id: vendedorId },
      _count: { id: true }
    });

    // Total de comunicaciones
    const total = await prisma.comunicaciones.count({
      where: { usuario_id: vendedorId }
    });

    // Comunicaciones de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const deHoy = await prisma.comunicaciones.count({
      where: {
        usuario_id: vendedorId,
        fecha_creacion: { gte: hoy }
      }
    });

    // Últimos 7 días por día
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    hace7Dias.setHours(0, 0, 0, 0);

    const ultimosDias = await prisma.comunicaciones.findMany({
      where: {
        usuario_id: vendedorId,
        fecha_creacion: { gte: hace7Dias }
      },
      select: { fecha_creacion: true }
    });

    // Agrupar por día
    const porDia = {};
    ultimosDias.forEach(c => {
      const fecha = c.fecha_creacion.toISOString().split('T')[0];
      porDia[fecha] = (porDia[fecha] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total,
        deHoy,
        porCanal: porCanal.map(c => ({ canal: c.canal, cantidad: c._count.id })),
        porDireccion: porDireccion.map(d => ({ direccion: d.direccion, cantidad: d._count.id })),
        ultimosDias: Object.entries(porDia).map(([fecha, cantidad]) => ({ fecha, cantidad }))
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comunicaciones/servicios/estado
 * @desc    Verificar estado de los servicios de comunicación
 * @access  Private (Vendedor)
 */
router.get('/servicios/estado', authenticate, requireVendedor, async (req, res, next) => {
  try {
    res.json({
      success: true,
      servicios: {
        whatsapp: {
          configurado: whatsappService.isConfigured(),
          descripcion: 'Meta WhatsApp Cloud API'
        },
        voz: {
          configurado: twilioService.isVoiceConfigured(),
          descripcion: 'Twilio Voice (llamadas desde navegador)'
        },
        sms: {
          configurado: twilioService.isConfigured(),
          descripcion: 'Twilio SMS'
        },
        email: {
          configurado: gmailService.isConfigured(),
          descripcion: 'Gmail API (requiere OAuth)'
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

