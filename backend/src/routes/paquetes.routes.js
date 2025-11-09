/**
 * Rutas de Paquetes
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const prisma = getPrismaClient();

/**
 * @route   GET /api/paquetes
 * @desc    Listar todos los paquetes activos
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const paquetes = await prisma.paquetes.findMany({
      where: { activo: true },
      orderBy: { precio_base: 'asc' }
    });

    res.json({
      success: true,
      count: paquetes.length,
      paquetes
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/paquetes/:id
 * @desc    Obtener paquete por ID
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const paquete = await prisma.paquetes.findUnique({
      where: { id: parseInt(id) },
      include: {
        paquetes_servicios: {
          include: {
            servicios: true
          }
        }
      }
    });

    if (!paquete) {
      throw new NotFoundError('Paquete no encontrado');
    }

    res.json({
      success: true,
      paquete
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/paquetes/:id/servicios
 * @desc    Obtener servicios incluidos en un paquete
 * @access  Public
 */
router.get('/:id/servicios', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el paquete existe
    const paquete = await prisma.paquetes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!paquete) {
      throw new NotFoundError('Paquete no encontrado');
    }

    // Obtener servicios del paquete
    let servicios = await prisma.paquetes_servicios.findMany({
      where: { paquete_id: parseInt(id) },
      include: {
        servicios: true
      }
    });

    // Si se proporciona salon_id, filtrar servicios restringidos (Kendall no permite Máquina de Chispas)
    const { salon_id } = req.query;
    if (salon_id) {
      const salon = await prisma.salones.findUnique({
        where: { id: parseInt(salon_id) }
      });
      
      if (salon && salon.nombre === 'Kendall') {
        servicios = servicios.filter(ps => 
          !ps.servicios.nombre.toLowerCase().includes('chispas')
        );
      }
    }

    res.json({
      success: true,
      paquete: {
        id: paquete.id,
        nombre: paquete.nombre,
        precio_base: paquete.precio_base
      },
      servicios: servicios.map(ps => ({
        ...ps.servicios,
        cantidad: ps.cantidad,
        incluido_gratis: ps.incluido_gratis,
        notas: ps.notas
      }))
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
