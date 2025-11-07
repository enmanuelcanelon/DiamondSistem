/**
 * Rutas para envío de Emails
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const { generarPDFContrato } = require('../utils/pdfContrato');

const prisma = getPrismaClient();

/**
 * @route   POST /api/emails/contrato/:id
 * @desc    Enviar contrato por email
 * @access  Private (Vendedor)
 */
router.post('/contrato/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const email_destino = req.body?.email_destino; // Opcional

    // Obtener contrato completo
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
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

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el vendedor tenga acceso
    if (contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Generar PDF del contrato
    const doc = generarPDFContrato(contrato);
    const chunks = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Enviar email con PDF adjunto
    const destinatario = email_destino || contrato.clientes.email;
    await emailService.enviarContratoPDF(
      destinatario,
      contrato,
      contrato.clientes,
      pdfBuffer
    );

    res.json({
      success: true,
      message: `Contrato enviado a ${destinatario}`,
    });

  } catch (error) {
    console.error('❌ Error al enviar contrato por email:', error);
    next(error);
  }
});

/**
 * @route   POST /api/emails/recordatorio-pago/:id
 * @desc    Enviar recordatorio de pago
 * @access  Private (Vendedor)
 */
router.post('/recordatorio-pago/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el vendedor tenga acceso
    if (contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Verificar que haya saldo pendiente
    const montoPendiente = parseFloat(contrato.saldo_pendiente);
    if (montoPendiente <= 0) {
      throw new ValidationError('No hay saldo pendiente para este contrato');
    }

    // Enviar email de recordatorio
    await emailService.enviarRecordatorioPago(
      contrato.clientes.email,
      contrato,
      contrato.clientes,
      montoPendiente
    );

    res.json({
      success: true,
      message: `Recordatorio de pago enviado a ${contrato.clientes.email}`,
    });

  } catch (error) {
    console.error('❌ Error al enviar recordatorio de pago:', error);
    next(error);
  }
});

/**
 * @route   POST /api/emails/confirmacion-contrato/:id
 * @desc    Enviar confirmación de contrato (automático al crear)
 * @access  Private (Vendedor)
 */
router.post('/confirmacion-contrato/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el vendedor tenga acceso
    if (contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Enviar email de confirmación
    await emailService.enviarConfirmacionContrato(
      contrato.clientes.email,
      contrato,
      contrato.clientes
    );

    res.json({
      success: true,
      message: `Confirmación enviada a ${contrato.clientes.email}`,
    });

  } catch (error) {
    console.error('❌ Error al enviar confirmación:', error);
    next(error);
  }
});

/**
 * @route   GET /api/emails/verificar
 * @desc    Verificar configuración del servidor de email
 * @access  Private (Vendedor)
 */
router.get('/verificar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const isConfigured = await emailService.verificarConfiguracion();
    
    res.json({
      success: isConfigured,
      message: isConfigured 
        ? 'Servidor de email configurado correctamente' 
        : 'Error en la configuración del servidor de email',
    });

  } catch (error) {
    console.error('❌ Error al verificar configuración:', error);
    next(error);
  }
});

module.exports = router;

