/**
 * Rutas de Temporadas
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { optionalAuth } = require('../middleware/auth');
const { getTemporadaByMes } = require('../utils/priceCalculator');

const prisma = new PrismaClient();

/**
 * @route   GET /api/temporadas
 * @desc    Listar todas las temporadas
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true },
      orderBy: { ajuste_precio: 'asc' }
    });

    res.json({
      success: true,
      count: temporadas.length,
      temporadas
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/temporadas/fecha/:fecha
 * @desc    Obtener temporada según fecha del evento
 * @access  Public
 */
router.get('/fecha/:fecha', optionalAuth, async (req, res, next) => {
  try {
    const { fecha } = req.params;

    // Validar fecha
    const fechaEvento = new Date(fecha);
    if (isNaN(fechaEvento.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Fecha inválida'
      });
    }

    // Obtener todas las temporadas
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true }
    });

    // Encontrar la temporada correspondiente
    const temporada = getTemporadaByMes(fechaEvento, temporadas);

    if (!temporada) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró temporada para la fecha especificada'
      });
    }

    res.json({
      success: true,
      fecha: fecha,
      temporada
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
