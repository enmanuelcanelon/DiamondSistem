const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVendedor } = require('../middleware/auth');

const prisma = new PrismaClient();

// ====================================
// OBTENER TODOS LOS SALONES ACTIVOS
// ====================================
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const salones = await prisma.salones.findMany({
      where: { activo: true },
      orderBy: { capacidad_maxima: 'desc' }
    });

    res.json({
      success: true,
      salones
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PAQUETES DISPONIBLES POR SALÓN
// ====================================
router.get('/:salonId/paquetes', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId } = req.params;

    const paquetes = await prisma.paquetes_salones.findMany({
      where: {
        salon_id: parseInt(salonId),
        disponible: true
      },
      include: {
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        }
      }
    });

    // Formatear respuesta para incluir precio específico del salón
    const paquetesFormateados = paquetes.map(ps => ({
      ...ps.paquetes,
      precio_base_salon: ps.precio_base,
      invitados_minimo_salon: ps.invitados_minimo,
      disponible_salon: ps.disponible
    }));

    res.json({
      success: true,
      paquetes: paquetesFormateados
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PRECIO DE UN PAQUETE EN UN SALÓN
// ====================================
router.get('/:salonId/paquetes/:paqueteId/precio', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId, paqueteId } = req.params;

    const precioSalon = await prisma.paquetes_salones.findFirst({
      where: {
        salon_id: parseInt(salonId),
        paquete_id: parseInt(paqueteId)
      }
    });

    if (!precioSalon) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no disponible en este salón'
      });
    }

    res.json({
      success: true,
      precio_base: precioSalon.precio_base,
      invitados_minimo: precioSalon.invitados_minimo,
      disponible: precioSalon.disponible
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;




