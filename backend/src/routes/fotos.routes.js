/**
 * Rutas para gestión de fotos de servicios
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireCliente } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

/**
 * Tipos de servicios válidos para fotos
 */
const TIPOS_SERVICIOS_VALIDOS = ['torta', 'decoracion', 'menu', 'bar'];

/**
 * @route   GET /api/fotos/:tipo
 * @desc    Obtener fotos de un tipo de servicio específico
 * @access  Private (Cliente)
 */
router.get('/:tipo', authenticate, requireCliente, async (req, res, next) => {
  try {
    const { tipo } = req.params;

    if (!TIPOS_SERVICIOS_VALIDOS.includes(tipo)) {
      throw new NotFoundError(`Tipo de servicio inválido. Tipos válidos: ${TIPOS_SERVICIOS_VALIDOS.join(', ')}`);
    }

    // Obtener fotos del tipo desde la base de datos
    const fotos = await prisma.fotos_servicios.findMany({
      where: {
        tipo_servicio: tipo,
        activo: true
      },
      orderBy: {
        fecha_subida: 'desc'
      }
    });

    // Construir URLs completas de las fotos
    const fotosConUrl = fotos.map(foto => ({
      id: foto.id,
      tipo_servicio: foto.tipo_servicio,
      nombre_archivo: foto.nombre_archivo,
      url: `/fotos/servicios/${tipo}/${foto.nombre_archivo}`,
      descripcion: foto.descripcion,
      fecha_subida: foto.fecha_subida
    }));

    res.json({
      success: true,
      count: fotosConUrl.length,
      fotos: fotosConUrl
    });

  } catch (error) {
    logger.error('Error al obtener fotos:', error);
    next(error);
  }
});

/**
 * @route   GET /api/fotos
 * @desc    Obtener todas las fotos disponibles
 * @access  Private (Cliente)
 */
router.get('/', authenticate, requireCliente, async (req, res, next) => {
  try {
    const fotos = await prisma.fotos_servicios.findMany({
      where: {
        activo: true
      },
      orderBy: {
        fecha_subida: 'desc'
      }
    });

    // Agrupar por tipo de servicio
    const fotosPorTipo = {};
    TIPOS_SERVICIOS_VALIDOS.forEach(tipo => {
      fotosPorTipo[tipo] = fotos
        .filter(foto => foto.tipo_servicio === tipo)
        .map(foto => ({
          id: foto.id,
          tipo_servicio: foto.tipo_servicio,
          nombre_archivo: foto.nombre_archivo,
          url: `/fotos/servicios/${tipo}/${foto.nombre_archivo}`,
          descripcion: foto.descripcion,
          fecha_subida: foto.fecha_subida
        }));
    });

    res.json({
      success: true,
      fotos: fotosPorTipo
    });

  } catch (error) {
    logger.error('Error al obtener todas las fotos:', error);
    next(error);
  }
});

module.exports = router;

