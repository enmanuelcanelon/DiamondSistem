/**
 * Rutas de Servicios
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { optionalAuth } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * @route   GET /api/servicios
 * @desc    Listar todos los servicios activos
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { categoria } = req.query;

    const where = { activo: true };

    if (categoria) {
      where.categoria = categoria;
    }

    const servicios = await prisma.servicios.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' }
      ]
    });

    res.json({
      success: true,
      count: servicios.length,
      servicios
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/servicios/categorias
 * @desc    Obtener lista de categorías únicas
 * @access  Public
 */
router.get('/categorias/list', optionalAuth, async (req, res, next) => {
  try {
    const servicios = await prisma.servicios.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria']
    });

    const categorias = servicios
      .map(s => s.categoria)
      .filter(c => c !== null)
      .sort();

    res.json({
      success: true,
      categorias
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/servicios/categoria/:categoria
 * @desc    Obtener servicios por categoría
 * @access  Public
 */
router.get('/categoria/:categoria', optionalAuth, async (req, res, next) => {
  try {
    const { categoria } = req.params;

    const servicios = await prisma.servicios.findMany({
      where: {
        categoria: categoria,
        activo: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({
      success: true,
      categoria,
      count: servicios.length,
      servicios
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/servicios/:id
 * @desc    Obtener servicio por ID
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const servicio = await prisma.servicios.findUnique({
      where: { id: parseInt(id) }
    });

    if (!servicio) {
      throw new NotFoundError('Servicio no encontrado');
    }

    res.json({
      success: true,
      servicio
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
