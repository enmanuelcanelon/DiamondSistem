/**
 * Rutas para Managers - Checklist de Servicios Externos
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireManager } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * Servicios externos válidos
 */
const SERVICIOS_EXTERNOS_VALIDOS = [
  'foto_video',
  'dj',
  'comida',
  'cake',
  'mini_postres',
  'limosina',
  'hora_loca',
  'animador',
  'maestro_ceremonia'
];

/**
 * @route   GET /api/managers/contratos
 * @desc    Obtener todos los contratos activos con información de servicios externos
 * @access  Private (Manager)
 */
router.get('/contratos', authenticate, requireManager, async (req, res, next) => {
  try {
    const contratos = await prisma.contratos.findMany({
      where: {
        estado: 'activo'
      },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            fecha_evento: true,
            hora_inicio: true,
            hora_fin: true,
            cantidad_invitados_confirmados: true
          }
        },
        paquetes: {
          select: {
            id: true,
            nombre: true,
            precio_base: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        contratos_servicios: {
          include: {
            servicios: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        checklist_servicios_externos: {
          select: {
            id: true,
            servicio_tipo: true,
            contacto_realizado: true,
            fecha_contacto: true,
            fecha_pago: true,
            hora_recogida: true,
            notas: true,
            estado: true,
            usuario_id: true,
            usuarios: {
              select: {
                id: true,
                nombre_completo: true,
                codigo_usuario: true
              }
            }
          }
        },
        ajustes_evento: true
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Función helper para mapear nombre de servicio a tipo
    const mapearServicioATipo = (nombreServicio) => {
      const nombre = nombreServicio.toLowerCase();
      if (nombre.includes('foto') || nombre.includes('video') || nombre.includes('fotografía')) {
        return 'foto_video';
      } else if (nombre.includes('dj') || nombre.includes('disc jockey')) {
        return 'dj';
      } else if (nombre.includes('comida') || nombre.includes('catering') || nombre.includes('menú')) {
        return 'comida';
      } else if (nombre.includes('cake') || nombre.includes('torta') || nombre.includes('pastel')) {
        return 'cake';
      } else if (nombre.includes('mini postre') || nombre.includes('postre')) {
        return 'mini_postres';
      } else if (nombre.includes('limosina') || nombre.includes('limousine')) {
        return 'limosina';
      } else if (nombre.includes('hora loca')) {
        return 'hora_loca';
      } else if (nombre.includes('animador')) {
        return 'animador';
      } else if (nombre.includes('maestro') && nombre.includes('ceremonia')) {
        return 'maestro_ceremonia';
      }
      return null;
    };

    // Procesar contratos para identificar servicios externos
    const contratosProcesados = contratos.map(contrato => {
      // Identificar servicios externos contratados
      const serviciosExternos = contrato.contratos_servicios
        .map(cs => mapearServicioATipo(cs.servicios.nombre))
        .filter(Boolean);

      // Obtener checklist existente por tipo
      const checklistPorTipo = {};
      contrato.checklist_servicios_externos.forEach(item => {
        checklistPorTipo[item.servicio_tipo] = item;
      });

      // Crear checklist completo solo con servicios que están contratados
      const checklistCompleto = SERVICIOS_EXTERNOS_VALIDOS.map(tipo => {
        if (checklistPorTipo[tipo]) {
          return checklistPorTipo[tipo];
        }
        // Solo crear checklist si el servicio está contratado
        if (serviciosExternos.includes(tipo)) {
          return {
            id: null,
            contrato_id: contrato.id,
            servicio_tipo: tipo,
            contacto_realizado: false,
            fecha_contacto: null,
            fecha_pago: null,
            hora_recogida: null,
            notas: null,
            estado: 'pendiente',
            manager_id: null,
            fecha_creacion: null,
            fecha_actualizacion: null,
            managers: null
          };
        }
        return null;
      }).filter(Boolean);

      return {
        id: contrato.id,
        codigo_contrato: contrato.codigo_contrato,
        fecha_evento: contrato.fecha_evento,
        clientes: contrato.clientes,
        eventos: contrato.eventos,
        salones: contrato.salones,
        paquetes: contrato.paquetes,
        contratos_servicios: contrato.contratos_servicios,
        ajustes_evento: contrato.ajustes_evento,
        servicios_externos: serviciosExternos,
        checklist: checklistCompleto
      };
    });

    res.json({
      success: true,
      count: contratosProcesados.length,
      contratos: contratosProcesados
    });

  } catch (error) {
    logger.error('Error al obtener contratos para manager:', error);
    next(error);
  }
});

/**
 * @route   GET /api/managers/contratos/:id
 * @desc    Obtener un contrato específico con checklist
 * @access  Private (Manager)
 */
router.get('/contratos/:id', authenticate, requireManager, async (req, res, next) => {
  try {
    const { id } = req.params;
    const contratoId = parseInt(id);

    const contrato = await prisma.contratos.findUnique({
      where: { id: contratoId },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            fecha_evento: true,
            hora_inicio: true,
            hora_fin: true,
            cantidad_invitados_confirmados: true
          }
        },
        paquetes: {
          select: {
            id: true,
            nombre: true,
            precio_base: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        contratos_servicios: {
          include: {
            servicios: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        checklist_servicios_externos: {
          select: {
            id: true,
            servicio_tipo: true,
            contacto_realizado: true,
            fecha_contacto: true,
            fecha_pago: true,
            hora_recogida: true,
            notas: true,
            estado: true,
            usuario_id: true,
            usuarios: {
              select: {
                id: true,
                nombre_completo: true,
                codigo_usuario: true
              }
            }
          },
          orderBy: {
            servicio_tipo: 'asc'
          }
        },
        ajustes_evento: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Función helper para mapear nombre de servicio a tipo
    const mapearServicioATipo = (nombreServicio) => {
      const nombre = nombreServicio.toLowerCase();
      if (nombre.includes('foto') || nombre.includes('video') || nombre.includes('fotografía')) {
        return 'foto_video';
      } else if (nombre.includes('dj') || nombre.includes('disc jockey')) {
        return 'dj';
      } else if (nombre.includes('comida') || nombre.includes('catering') || nombre.includes('menú')) {
        return 'comida';
      } else if (nombre.includes('cake') || nombre.includes('torta') || nombre.includes('pastel')) {
        return 'cake';
      } else if (nombre.includes('mini postre') || nombre.includes('postre')) {
        return 'mini_postres';
      } else if (nombre.includes('limosina') || nombre.includes('limousine')) {
        return 'limosina';
      } else if (nombre.includes('hora loca')) {
        return 'hora_loca';
      } else if (nombre.includes('animador')) {
        return 'animador';
      } else if (nombre.includes('maestro') && nombre.includes('ceremonia')) {
        return 'maestro_ceremonia';
      }
      return null;
    };

    // Identificar servicios externos contratados
    const serviciosExternos = contrato.contratos_servicios
      .map(cs => mapearServicioATipo(cs.servicios.nombre))
      .filter(Boolean);

    // Obtener checklist existente
    const checklistPorTipo = {};
    contrato.checklist_servicios_externos.forEach(item => {
      checklistPorTipo[item.servicio_tipo] = item;
    });

    // Crear checklist completo solo con servicios que están contratados
    const checklistCompleto = SERVICIOS_EXTERNOS_VALIDOS.map(tipo => {
      if (checklistPorTipo[tipo]) {
        return checklistPorTipo[tipo];
      }
      // Solo crear checklist si el servicio está contratado
      if (serviciosExternos.includes(tipo)) {
        return {
          id: null,
          contrato_id: contrato.id,
          servicio_tipo: tipo,
          contacto_realizado: false,
          fecha_contacto: null,
          fecha_pago: null,
          hora_recogida: null,
          notas: null,
          estado: 'pendiente',
          manager_id: null,
          fecha_creacion: null,
          fecha_actualizacion: null,
          managers: null
        };
      }
      return null;
    }).filter(Boolean);

    res.json({
      success: true,
      contrato: {
        id: contrato.id,
        codigo_contrato: contrato.codigo_contrato,
        fecha_evento: contrato.fecha_evento,
        clientes: contrato.clientes,
        eventos: contrato.eventos,
        salones: contrato.salones,
        paquetes: contrato.paquetes,
        contratos_servicios: contrato.contratos_servicios,
        ajustes_evento: contrato.ajustes_evento,
        servicios_externos: serviciosExternos,
        checklist: checklistCompleto
      }
    });

  } catch (error) {
    logger.error('Error al obtener contrato para manager:', error);
    next(error);
  }
});

/**
 * @route   POST /api/managers/checklist
 * @desc    Crear o actualizar un item del checklist
 * @access  Private (Manager)
 */
router.post('/checklist', authenticate, requireManager, async (req, res, next) => {
  try {
    const { contrato_id, servicio_tipo, fecha_contacto, fecha_pago, hora_recogida, notas, estado } = req.body;
    const managerId = req.user.id;

    // Validaciones
    if (!contrato_id || !servicio_tipo) {
      throw new ValidationError('Contrato ID y tipo de servicio son requeridos');
    }

    if (!SERVICIOS_EXTERNOS_VALIDOS.includes(servicio_tipo)) {
      throw new ValidationError(`Tipo de servicio inválido. Debe ser uno de: ${SERVICIOS_EXTERNOS_VALIDOS.join(', ')}`);
    }

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Estados válidos
    const estadosValidos = ['pendiente', 'completado'];
    const estadoFinal = estado && estadosValidos.includes(estado) ? estado : 'pendiente';

    // Buscar si ya existe un checklist para este contrato y servicio
    const checklistExistente = await prisma.checklist_servicios_externos.findUnique({
      where: {
        contrato_id_servicio_tipo: {
          contrato_id: parseInt(contrato_id),
          servicio_tipo
        }
      }
    });

    let resultado;

    if (checklistExistente) {
      // Actualizar checklist existente
      resultado = await prisma.checklist_servicios_externos.update({
        where: {
          id: checklistExistente.id
        },
        data: {
          fecha_contacto: fecha_contacto ? new Date(fecha_contacto) : checklistExistente.fecha_contacto,
          fecha_pago: fecha_pago ? new Date(fecha_pago) : checklistExistente.fecha_pago,
          hora_recogida: hora_recogida ? new Date(hora_recogida) : checklistExistente.hora_recogida,
          notas: notas !== undefined ? notas : checklistExistente.notas,
          estado: estadoFinal,
          usuario_id: managerId,
          fecha_actualizacion: new Date()
        },
        include: {
          usuarios: {
            select: {
              id: true,
              nombre_completo: true,
              codigo_usuario: true
            }
          }
        }
      });
    } else {
      // Crear nuevo checklist
      const createData = {
        contrato_id: parseInt(contrato_id),
        servicio_tipo,
        fecha_contacto: fecha_contacto ? new Date(fecha_contacto) : null,
        fecha_pago: fecha_pago ? new Date(fecha_pago) : null,
        hora_recogida: hora_recogida ? new Date(hora_recogida) : null,
        notas: notas || null,
        estado: estadoFinal,
        usuario_id: managerId || null
      };

      resultado = await prisma.checklist_servicios_externos.create({
        data: createData,
        include: {
          usuarios: {
            select: {
              id: true,
              nombre_completo: true,
              codigo_usuario: true
            }
          }
        }
      });
    }

    res.json({
      success: true,
      message: checklistExistente ? 'Checklist actualizado exitosamente' : 'Checklist creado exitosamente',
      checklist: resultado
    });

  } catch (error) {
    logger.error('Error al crear/actualizar checklist:', error);
    next(error);
  }
});

/**
 * @route   PUT /api/managers/checklist/:id
 * @desc    Actualizar un item específico del checklist
 * @access  Private (Manager)
 */
router.put('/checklist/:id', authenticate, requireManager, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_contacto, fecha_pago, hora_recogida, notas, estado } = req.body;
    const managerId = req.user.id;

    const checklistId = parseInt(id);

    // Verificar que el checklist existe
    const checklistExistente = await prisma.checklist_servicios_externos.findUnique({
      where: { id: checklistId }
    });

    if (!checklistExistente) {
      throw new NotFoundError('Item del checklist no encontrado');
    }

    // Validar estado
    const estadosValidos = ['pendiente', 'completado'];
    const estadoFinal = estado && estadosValidos.includes(estado) ? estado : checklistExistente.estado;

    // Actualizar
    const resultado = await prisma.checklist_servicios_externos.update({
      where: { id: checklistId },
      data: {
        fecha_contacto: fecha_contacto ? new Date(fecha_contacto) : checklistExistente.fecha_contacto,
        fecha_pago: fecha_pago ? new Date(fecha_pago) : checklistExistente.fecha_pago,
        hora_recogida: hora_recogida ? new Date(hora_recogida) : checklistExistente.hora_recogida,
        notas: notas !== undefined ? notas : checklistExistente.notas,
        estado: estadoFinal,
        manager_id: managerId,
        fecha_actualizacion: new Date()
      },
      include: {
        managers: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_manager: true
          }
        },
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            fecha_evento: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Checklist actualizado exitosamente',
      checklist: resultado
    });

  } catch (error) {
    logger.error('Error al actualizar checklist:', error);
    next(error);
  }
});

/**
 * @route   GET /api/managers/checklist/resumen
 * @desc    Obtener resumen de checklist por estado
 * @access  Private (Manager)
 */
router.get('/checklist/resumen', authenticate, requireManager, async (req, res, next) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    // Construir filtro de fecha
    const whereFecha = {};
    if (fecha_desde || fecha_hasta) {
      whereFecha.contratos = {
        fecha_evento: {}
      };
      if (fecha_desde) {
        whereFecha.contratos.fecha_evento.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        whereFecha.contratos.fecha_evento.lte = new Date(fecha_hasta);
      }
    }

    // Obtener todos los checklist
    const checklistItems = await prisma.checklist_servicios_externos.findMany({
      where: whereFecha,
      include: {
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            fecha_evento: true,
            clientes: {
              select: {
                nombre_completo: true
              }
            }
          }
        }
      }
    });

    // Agrupar por estado
    const resumen = {
      total: checklistItems.length,
      pendiente: checklistItems.filter(item => item.estado === 'pendiente').length,
      completado: checklistItems.filter(item => item.estado === 'completado').length,
      por_servicio: {
        foto_video: {
          total: checklistItems.filter(item => item.servicio_tipo === 'foto_video').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'foto_video' && item.estado === 'completado').length
        },
        dj: {
          total: checklistItems.filter(item => item.servicio_tipo === 'dj').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'dj' && item.estado === 'completado').length
        },
        comida: {
          total: checklistItems.filter(item => item.servicio_tipo === 'comida').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'comida' && item.estado === 'completado').length
        },
        cake: {
          total: checklistItems.filter(item => item.servicio_tipo === 'cake').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'cake' && item.estado === 'completado').length
        },
        mini_postres: {
          total: checklistItems.filter(item => item.servicio_tipo === 'mini_postres').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'mini_postres' && item.estado === 'completado').length
        },
        limosina: {
          total: checklistItems.filter(item => item.servicio_tipo === 'limosina').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'limosina' && item.estado === 'completado').length
        },
        hora_loca: {
          total: checklistItems.filter(item => item.servicio_tipo === 'hora_loca').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'hora_loca' && item.estado === 'completado').length
        },
        animador: {
          total: checklistItems.filter(item => item.servicio_tipo === 'animador').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'animador' && item.estado === 'completado').length
        },
        maestro_ceremonia: {
          total: checklistItems.filter(item => item.servicio_tipo === 'maestro_ceremonia').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'maestro_ceremonia' && item.estado === 'completado').length
        }
      }
    };

    res.json({
      success: true,
      resumen
    });

  } catch (error) {
    logger.error('Error al obtener resumen de checklist:', error);
    next(error);
  }
});

module.exports = router;
