const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generarPDFPlaylist } = require('../utils/pdfPlaylist');

const prisma = getPrismaClient();

// ====================================
// OBTENER TODAS LAS CANCIONES DE UN CONTRATO
// ====================================
router.get('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;
    const { categoria } = req.query; // opcional: filtrar por categoría

    const where = {
      contrato_id: parseInt(contratoId)
    };

    if (categoria) {
      where.categoria = categoria;
    }

    const canciones = await prisma.playlist_canciones.findMany({
      where,
      orderBy: [
        { categoria: 'asc' }, // favorita, prohibida, sugerida
        { orden: 'asc' },
        { fecha_creacion: 'desc' }
      ]
    });

    // Agrupar por categoría
    const agrupadas = {
      favoritas: canciones.filter(c => c.categoria === 'favorita'),
      prohibidas: canciones.filter(c => c.categoria === 'prohibida'),
      sugeridas: canciones.filter(c => c.categoria === 'sugerida')
    };

    res.json({
      success: true,
      canciones,
      total: canciones.length,
      agrupadas,
      stats: {
        favoritas: agrupadas.favoritas.length,
        prohibidas: agrupadas.prohibidas.length,
        sugeridas: agrupadas.sugeridas.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER UNA CANCIÓN
// ====================================
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const cancion = await prisma.playlist_canciones.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cancion) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }

    res.json({
      success: true,
      cancion
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// AGREGAR CANCIÓN (UNA O VARIAS)
// ====================================
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { contrato_id, canciones } = req.body;

    // Validar datos requeridos
    if (!contrato_id) {
      return res.status(400).json({
        success: false,
        message: 'Falta el contrato_id'
      });
    }

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) }
    });

    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Determinar quién agregó la canción
    const agregadoPor = req.user.tipo === 'cliente' ? 'cliente' : 'vendedor';

    // Si se envía una sola canción (objeto)
    if (!Array.isArray(canciones)) {
      const { titulo, artista, genero, categoria, notas, orden } = canciones;

      if (!titulo) {
        return res.status(400).json({
          success: false,
          message: 'Falta el título de la canción'
        });
      }

      const nuevaCancion = await prisma.playlist_canciones.create({
        data: {
          contrato_id: parseInt(contrato_id),
          titulo,
          artista: artista || null,
          genero: genero || null,
          categoria: categoria || 'favorita',
          notas: notas || null,
          orden: orden ? parseInt(orden) : null,
          agregado_por: agregadoPor
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Canción agregada exitosamente',
        cancion: nuevaCancion
      });
    }

    // Si se envían múltiples canciones (array)
    if (canciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos una canción'
      });
    }

    const cancionesCrear = canciones.map(c => ({
      contrato_id: parseInt(contrato_id),
      titulo: c.titulo,
      artista: c.artista || null,
      genero: c.genero || null,
      categoria: c.categoria || 'favorita',
      notas: c.notas || null,
      orden: c.orden ? parseInt(c.orden) : null,
      agregado_por: agregadoPor
    }));

    const resultado = await prisma.playlist_canciones.createMany({
      data: cancionesCrear,
      skipDuplicates: false
    });

    res.status(201).json({
      success: true,
      message: `${resultado.count} canción(es) agregada(s) exitosamente`,
      count: resultado.count
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ACTUALIZAR CANCIÓN
// ====================================
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      artista,
      genero,
      categoria,
      notas,
      orden,
      reproducida
    } = req.body;

    const cancionExistente = await prisma.playlist_canciones.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cancionExistente) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }

    const cancionActualizada = await prisma.playlist_canciones.update({
      where: { id: parseInt(id) },
      data: {
        titulo: titulo || cancionExistente.titulo,
        artista: artista !== undefined ? artista : cancionExistente.artista,
        genero: genero !== undefined ? genero : cancionExistente.genero,
        categoria: categoria || cancionExistente.categoria,
        notas: notas !== undefined ? notas : cancionExistente.notas,
        orden: orden !== undefined ? (orden ? parseInt(orden) : null) : cancionExistente.orden,
        reproducida: reproducida !== undefined ? reproducida : cancionExistente.reproducida,
        fecha_actualizacion: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Canción actualizada exitosamente',
      cancion: cancionActualizada
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// MARCAR CANCIÓN COMO REPRODUCIDA
// ====================================
router.patch('/:id/reproducida', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reproducida } = req.body;

    const cancion = await prisma.playlist_canciones.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cancion) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }

    const cancionActualizada = await prisma.playlist_canciones.update({
      where: { id: parseInt(id) },
      data: {
        reproducida: reproducida !== undefined ? reproducida : true,
        fecha_actualizacion: new Date()
      }
    });

    res.json({
      success: true,
      message: `Canción marcada como ${cancionActualizada.reproducida ? 'reproducida' : 'pendiente'}`,
      cancion: cancionActualizada
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// REORDENAR CANCIONES
// ====================================
router.patch('/contrato/:contratoId/reordenar', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;
    const { canciones } = req.body; // Array de { id, orden }

    if (!Array.isArray(canciones) || canciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de canciones con id y orden'
      });
    }

    // Actualizar orden de cada canción
    const actualizaciones = canciones.map(c =>
      prisma.playlist_canciones.update({
        where: { id: parseInt(c.id) },
        data: {
          orden: parseInt(c.orden),
          fecha_actualizacion: new Date()
        }
      })
    );

    await prisma.$transaction(actualizaciones);

    res.json({
      success: true,
      message: 'Canciones reordenadas exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ELIMINAR CANCIÓN
// ====================================
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const cancionExistente = await prisma.playlist_canciones.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cancionExistente) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }

    await prisma.playlist_canciones.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Canción eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ELIMINAR TODAS LAS CANCIONES DE UN CONTRATO
// ====================================
router.delete('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;
    const { categoria } = req.query; // opcional: solo eliminar de una categoría

    const where = {
      contrato_id: parseInt(contratoId)
    };

    if (categoria) {
      where.categoria = categoria;
    }

    const resultado = await prisma.playlist_canciones.deleteMany({
      where
    });

    res.json({
      success: true,
      message: `${resultado.count} canción(es) eliminada(s) exitosamente`,
      count: resultado.count
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// DESCARGAR PDF DE PLAYLIST
// ====================================
router.get('/contrato/:contratoId/pdf', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    // Obtener contrato con relaciones
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contratoId) },
      include: {
        clientes: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este contrato'
      });
    }

    // Obtener todas las canciones
    const canciones = await prisma.playlist_canciones.findMany({
      where: { contrato_id: parseInt(contratoId) },
      orderBy: [
        { categoria: 'asc' },
        { orden: 'asc' },
        { fecha_creacion: 'desc' }
      ]
    });

    // Obtener ajustes para las URLs de playlists externas
    const ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) },
      select: {
        playlist_urls: true
      }
    });

    // Generar PDF
    const doc = generarPDFPlaylist(canciones, contrato, ajustes);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Playlist-${contrato.codigo_contrato}.pdf`);

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

module.exports = router;



