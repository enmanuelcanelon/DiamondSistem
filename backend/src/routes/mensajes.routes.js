/**
 * Rutas de Mensajes
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * @route   GET /api/mensajes/contrato/:contrato_id
 * @desc    Obtener mensajes de un contrato
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/contrato/:contrato_id', authenticate, async (req, res, next) => {
  try {
    const { contrato_id } = req.params;

    console.log('📥 Obteniendo mensajes del contrato:', contrato_id, 'por usuario:', req.user.tipo, req.user.id);

    // Verificar acceso al contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        cliente_id: true,
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

    if (req.user.tipo === 'vendedor' && contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a estos mensajes');
    }

    const mensajes = await prisma.mensajes.findMany({
      where: { contrato_id: parseInt(contrato_id) },
      orderBy: { fecha_envio: 'asc' }
    });

    console.log(`📨 Encontrados ${mensajes.length} mensajes para el contrato ${contrato_id}`);

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
        console.log(`✅ Marcados ${updated.count} mensajes como leídos`);
      }
    }

    res.json({
      success: true,
      count: mensajes.length,
      mensajes
    });

  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error.message);
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

    // Log para debug
    console.log('📩 Enviando mensaje:', {
      contrato_id,
      mensaje,
      destinatario_tipo,
      destinatario_id,
      remitente_tipo: req.user.tipo,
      remitente_id: req.user.id
    });

    if (!contrato_id || !mensaje || !destinatario_tipo || !destinatario_id) {
      throw new ValidationError('Faltan datos requeridos');
    }

    // Verificar acceso al contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        cliente_id: true,
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

    if (req.user.tipo === 'vendedor' && contrato.vendedor_id !== req.user.id) {
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

    console.log('✅ Mensaje creado exitosamente:', nuevoMensaje.id);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      mensaje: nuevoMensaje
    });

  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error.message);
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
