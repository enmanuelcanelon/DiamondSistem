/**
 * Rutas de Mensajes
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * @route   GET /api/mensajes/contrato/:contrato_id
 * @desc    Obtener mensajes de un contrato
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/contrato/:contrato_id', authenticate, async (req, res, next) => {
  try {
    const { contrato_id } = req.params;

    // Verificar acceso al contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        cliente_id: true,
        usuario_id: true,
        vendedor_id: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el usuario tenga acceso
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a estos mensajes');
    }

    // CRÍTICO: Verificar tanto usuario_id (nuevo) como vendedor_id (deprecated) para compatibilidad
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes acceso a estos mensajes');
    }

    const mensajes = await prisma.mensajes.findMany({
      where: { contrato_id: parseInt(contrato_id) },
      orderBy: { fecha_envio: 'asc' }
    });

    // Marcar como leídos los mensajes del destinatario
    if (mensajes.length > 0) {
      const updated = await prisma.mensajes.updateMany({
        where: {
          contrato_id: parseInt(contrato_id),
          destinatario_tipo: req.user.tipo,
          destinatario_id: req.user.id,
          leido: false
        },
        data: {
          leido: true,
          fecha_lectura: new Date()
        }
      });
      
      if (updated.count > 0) {
        logger.debug(`Marcados ${updated.count} mensajes como leídos`, {
          contrato_id: parseInt(contrato_id),
          user_id: req.user.id,
          user_tipo: req.user.tipo
        });
      }
    }

    res.json({
      success: true,
      count: mensajes.length,
      mensajes
    });

  } catch (error) {
    logger.error('Error al obtener mensajes', {
      error: error.message,
      stack: error.stack,
      contrato_id: req.params.contrato_id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    next(error);
  }
});

/**
 * @route   POST /api/mensajes
 * @desc    Enviar mensaje
 * @access  Private (Vendedor o Cliente)
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { contrato_id, mensaje, destinatario_tipo, destinatario_id } = req.body;

    // Validar datos (logging se hace en logger)

    if (!contrato_id || !mensaje || !destinatario_tipo || !destinatario_id) {
      throw new ValidationError('Faltan datos requeridos');
    }

    // Verificar acceso al contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        cliente_id: true,
        usuario_id: true,
        vendedor_id: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el remitente tiene acceso a este contrato
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // CRÍTICO: Verificar tanto usuario_id (nuevo) como vendedor_id (deprecated) para compatibilidad
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Crear mensaje
    const nuevoMensaje = await prisma.mensajes.create({
      data: {
        contrato_id: parseInt(contrato_id),
        remitente_tipo: req.user.tipo,
        remitente_id: req.user.id,
        destinatario_tipo,
        destinatario_id: parseInt(destinatario_id),
        mensaje,
        leido: false
      }
    });

    logger.debug('Mensaje creado exitosamente', {
      mensaje_id: nuevoMensaje.id,
      contrato_id: parseInt(contrato_id),
      remitente_tipo: req.user.tipo,
      remitente_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      mensaje: nuevoMensaje
    });

  } catch (error) {
    logger.error('Error al enviar mensaje', {
      error: error.message,
      stack: error.stack,
      contrato_id: req.body.contrato_id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    next(error);
  }
});

/**
 * @route   GET /api/mensajes/contrato/:contrato_id/no-leidos
 * @desc    Obtener conteo de mensajes no leídos de un contrato (sin marcarlos como leídos)
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/contrato/:contrato_id/no-leidos', authenticate, async (req, res, next) => {
  try {
    const { contrato_id } = req.params;

    // Verificar acceso al contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        cliente_id: true,
        usuario_id: true,
        vendedor_id: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el usuario tenga acceso
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a estos mensajes');
    }

    // CRÍTICO: Verificar tanto usuario_id (nuevo) como vendedor_id (deprecated) para compatibilidad
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes acceso a estos mensajes');
    }

    // Contar mensajes no leídos donde el destinatario es el usuario actual
    const count = await prisma.mensajes.count({
      where: {
        contrato_id: parseInt(contrato_id),
        destinatario_tipo: req.user.tipo,
        destinatario_id: req.user.id,
        leido: false
      }
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    logger.error('Error al obtener conteo de mensajes no leídos', {
      error: error.message,
      stack: error.stack,
      contrato_id: req.params.contrato_id,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    next(error);
  }
});

/**
 * @route   GET /api/mensajes/vendedor/no-leidos/batch
 * @desc    Obtener conteo de mensajes no leídos para todos los contratos del vendedor (batch)
 * @access  Private (Vendedor)
 */
router.get('/vendedor/no-leidos/batch', authenticate, async (req, res, next) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      throw new ValidationError('Solo los vendedores pueden acceder a este endpoint');
    }

    // Obtener todos los contratos del vendedor
    // CRÍTICO: Incluir tanto usuario_id (nuevo) como vendedor_id (deprecated) para compatibilidad
    const contratos = await prisma.contratos.findMany({
      where: {
        OR: [
          { usuario_id: req.user.id },
          { vendedor_id: req.user.id }
        ]
      },
      select: {
        id: true
      }
    });

    if (contratos.length === 0) {
      return res.json({
        success: true,
        mensajes_no_leidos: {}
      });
    }

    const contratosIds = contratos.map(c => c.id);

    // OPTIMIZACIÓN: Obtener todos los conteos en una sola query usando groupBy
    const conteosRaw = await prisma.mensajes.groupBy({
      by: ['contrato_id'],
      where: {
        contrato_id: { in: contratosIds },
        destinatario_tipo: 'vendedor',
        destinatario_id: req.user.id,
        leido: false
      },
      _count: {
        id: true
      }
    });

    // Crear mapa de conteos
    const mensajesNoLeidos = {};
    conteosRaw.forEach(item => {
      if (item._count.id > 0) {
        mensajesNoLeidos[item.contrato_id] = item._count.id;
      }
    });

    res.json({
      success: true,
      mensajes_no_leidos: mensajesNoLeidos
    });

  } catch (error) {
    logger.error('Error al obtener mensajes no leídos en batch', {
      error: error.message,
      stack: error.stack,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    next(error);
  }
});

/**
 * @route   GET /api/mensajes/vendedor/buzon
 * @desc    Obtener todos los contratos del vendedor con información de mensajes (buzón)
 * @access  Private (Vendedor)
 */
router.get('/vendedor/buzon', authenticate, async (req, res, next) => {
  try {
    if (req.user.tipo !== 'vendedor') {
      throw new ValidationError('Solo los vendedores pueden acceder a este endpoint');
    }

    // Obtener todos los contratos del vendedor con clientes
    // CRÍTICO: Incluir tanto usuario_id (nuevo) como vendedor_id (deprecated) para compatibilidad
    const contratos = await prisma.contratos.findMany({
      where: {
        OR: [
          { usuario_id: req.user.id },
          { vendedor_id: req.user.id }
        ],
        mensajes: {
          some: {} // Solo contratos que tienen al menos un mensaje
        }
      },
      select: {
        id: true,
        codigo_contrato: true,
        fecha_evento: true,
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    if (contratos.length === 0) {
      return res.json({
        success: true,
        count: 0,
        buzón: []
      });
    }

    const contratosIds = contratos.map(c => c.id);

    // OPTIMIZACIÓN: Obtener todos los últimos mensajes en una sola query usando agregación
    // Usar raw query para obtener el último mensaje por contrato de forma eficiente
    const ultimosMensajesRaw = await prisma.$queryRaw`
      SELECT DISTINCT ON (contrato_id) 
        contrato_id,
        fecha_envio,
        mensaje,
        remitente_tipo,
        remitente_id
      FROM mensajes
      WHERE contrato_id = ANY(${contratosIds}::int[])
      ORDER BY contrato_id, fecha_envio DESC
    `;

    // Crear mapa de último mensaje por contrato
    const ultimosMensajesMap = new Map();
    ultimosMensajesRaw.forEach(msg => {
      ultimosMensajesMap.set(msg.contrato_id, {
        fecha: msg.fecha_envio,
        mensaje: msg.mensaje.substring(0, 100),
        remitente_tipo: msg.remitente_tipo,
        remitente_id: msg.remitente_id
      });
    });

    // OPTIMIZACIÓN: Contar todos los mensajes no leídos en una sola query usando groupBy
    const mensajesNoLeidosRaw = await prisma.mensajes.groupBy({
      by: ['contrato_id'],
      where: {
        contrato_id: { in: contratosIds },
        destinatario_tipo: 'vendedor',
        destinatario_id: req.user.id,
        leido: false
      },
      _count: {
        id: true
      }
    });

    // Crear mapa de conteos de mensajes no leídos
    const mensajesNoLeidosMap = new Map();
    mensajesNoLeidosRaw.forEach(item => {
      mensajesNoLeidosMap.set(item.contrato_id, item._count.id);
    });

    // Construir respuesta combinando datos
    const buzón = contratos
      .map(contrato => {
        const ultimoMensaje = ultimosMensajesMap.get(contrato.id);
        const mensajesNoLeidos = mensajesNoLeidosMap.get(contrato.id) || 0;

        return {
          contrato_id: contrato.id,
          codigo_contrato: contrato.codigo_contrato,
          fecha_evento: contrato.fecha_evento,
          cliente: contrato.clientes,
          ultimo_mensaje: ultimoMensaje ? {
            fecha: ultimoMensaje.fecha,
            mensaje: ultimoMensaje.mensaje,
            remitente_tipo: ultimoMensaje.remitente_tipo,
            remitente_id: ultimoMensaje.remitente_id
          } : null,
          mensajes_no_leidos: mensajesNoLeidos
        };
      })
      .filter(item => item.ultimo_mensaje !== null) // Solo contratos con mensajes
      .sort((a, b) => {
        // Ordenar por fecha del último mensaje (más reciente primero)
        if (!a.ultimo_mensaje || !b.ultimo_mensaje) return 0;
        return new Date(b.ultimo_mensaje.fecha) - new Date(a.ultimo_mensaje.fecha);
      });

    res.json({
      success: true,
      count: buzón.length,
      buzón: buzón
    });

  } catch (error) {
    logger.error('Error al obtener buzón de mensajes', {
      error: error.message,
      stack: error.stack,
      user_id: req.user?.id,
      user_tipo: req.user?.tipo
    });
    next(error);
  }
});

/**
 * @route   PUT /api/mensajes/:id/leer
 * @desc    Marcar mensaje como leído
 * @access  Private
 */
router.put('/:id/leer', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const mensaje = await prisma.mensajes.update({
      where: { id: parseInt(id) },
      data: {
        leido: true,
        fecha_lectura: new Date()
      }
    });

    res.json({
      success: true,
      mensaje
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
