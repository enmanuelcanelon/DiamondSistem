const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ====================================
// OBTENER AJUSTES DE UN CONTRATO
// ====================================
router.get('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    let ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    // Si no existen ajustes, crearlos automáticamente
    if (!ajustes) {
      ajustes = await prisma.ajustes_evento.create({
        data: {
          contrato_id: parseInt(contratoId)
        }
      });
    }

    res.json({
      success: true,
      ajustes
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ACTUALIZAR AJUSTES
// ====================================
router.put('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;
    const datosAjustes = req.body;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contratoId) }
    });

    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Buscar o crear ajustes
    let ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (ajustes) {
      // Actualizar ajustes existentes
      ajustes = await prisma.ajustes_evento.update({
        where: { contrato_id: parseInt(contratoId) },
        data: {
          ...datosAjustes,
          fecha_actualizacion: new Date()
        }
      });
    } else {
      // Crear nuevos ajustes
      ajustes = await prisma.ajustes_evento.create({
        data: {
          contrato_id: parseInt(contratoId),
          ...datosAjustes
        }
      });
    }

    res.json({
      success: true,
      message: 'Ajustes actualizados exitosamente',
      ajustes
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ACTUALIZAR SECCIÓN ESPECÍFICA
// ====================================
router.patch('/contrato/:contratoId/:seccion', authenticate, async (req, res, next) => {
  try {
    const { contratoId, seccion } = req.params;
    const datos = req.body;

    // Validar sección
    const seccionesValidas = ['torta', 'decoracion', 'menu', 'entretenimiento', 'fotografia', 'otros'];
    if (!seccionesValidas.includes(seccion)) {
      return res.status(400).json({
        success: false,
        message: 'Sección inválida'
      });
    }

    // Buscar o crear ajustes
    let ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (!ajustes) {
      ajustes = await prisma.ajustes_evento.create({
        data: {
          contrato_id: parseInt(contratoId),
          ...datos
        }
      });
    } else {
      ajustes = await prisma.ajustes_evento.update({
        where: { contrato_id: parseInt(contratoId) },
        data: {
          ...datos,
          fecha_actualizacion: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: `Sección "${seccion}" actualizada exitosamente`,
      ajustes
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PORCENTAJE DE COMPLETADO
// ====================================
router.get('/contrato/:contratoId/progreso', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) },
      select: {
        porcentaje_completado: true,
        sabor_torta: true,
        estilo_decoracion: true,
        tipo_servicio: true,
        plato_principal: true,
        colores_principales: true,
        musica_ceremonial: true,
        primer_baile: true,
        momentos_especiales: true,
        bebidas_incluidas: true,
        tematica: true
      }
    });

    if (!ajustes) {
      return res.json({
        success: true,
        porcentaje: 0,
        campos_completados: 0,
        campos_totales: 10
      });
    }

    // Contar campos completados
    const camposImportantes = [
      ajustes.sabor_torta,
      ajustes.estilo_decoracion,
      ajustes.tipo_servicio,
      ajustes.plato_principal,
      ajustes.colores_principales,
      ajustes.musica_ceremonial,
      ajustes.primer_baile,
      ajustes.momentos_especiales,
      ajustes.bebidas_incluidas,
      ajustes.tematica
    ];

    const completados = camposImportantes.filter(campo => campo !== null && campo !== '').length;

    res.json({
      success: true,
      porcentaje: ajustes.porcentaje_completado,
      campos_completados: completados,
      campos_totales: 10
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ELIMINAR AJUSTES (RESETEAR)
// ====================================
router.delete('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (!ajustes) {
      return res.status(404).json({
        success: false,
        message: 'No hay ajustes para este contrato'
      });
    }

    await prisma.ajustes_evento.delete({
      where: { contrato_id: parseInt(contratoId) }
    });

    res.json({
      success: true,
      message: 'Ajustes eliminados exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

