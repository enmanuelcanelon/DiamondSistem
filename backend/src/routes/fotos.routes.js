/**
 * Rutas para gestión de fotos de servicios
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireCliente } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const prisma = getPrismaClient();

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
      orderBy: [
        { orden: 'asc' },
        { fecha_creacion: 'desc' }
      ]
    });

    // Construir URLs completas de las fotos
    const fotosConUrl = fotos.map(foto => {
      const nombreArchivo = foto.nombre_archivo || foto.url_imagen?.split('/').pop() || 'imagen.webp';
      return {
        id: foto.id,
        tipo_servicio: foto.tipo_servicio,
        nombre_archivo: nombreArchivo,
        url: foto.url_imagen || `/fotos/servicios/${tipo}/medium/${nombreArchivo}`,
        descripcion: foto.descripcion,
        fecha_creacion: foto.fecha_creacion
      };
    });

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
      orderBy: [
        { tipo_servicio: 'asc' },
        { orden: 'asc' },
        { fecha_creacion: 'desc' }
      ]
    });

    // Agrupar por tipo de servicio
    const fotosPorTipo = {};
    TIPOS_SERVICIOS_VALIDOS.forEach(tipo => {
      fotosPorTipo[tipo] = fotos
        .filter(foto => foto.tipo_servicio === tipo)
        .map(foto => {
          const nombreArchivo = foto.nombre_archivo || foto.url_imagen?.split('/').pop() || 'imagen.webp';
          return {
            id: foto.id,
            tipo_servicio: foto.tipo_servicio,
            nombre_archivo: nombreArchivo,
            url: foto.url_imagen || `/fotos/servicios/${tipo}/medium/${nombreArchivo}`,
            descripcion: foto.descripcion,
            fecha_creacion: foto.fecha_creacion
          };
        });
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

