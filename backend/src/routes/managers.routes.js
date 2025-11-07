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
const SERVICIOS_EXTERNOS_VALIDOS = ['limosina', 'hora_loca', 'animador', 'chef'];

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
            hora_inicio: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        contratos_servicios: {
          where: {
            servicios: {
              nombre: {
                in: ['Limosina', 'Hora Loca', 'Animador', 'Chef']
              }
            }
          },
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
          include: {
            managers: {
              select: {
                id: true,
                nombre_completo: true,
                codigo_manager: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Procesar contratos para identificar servicios externos
    const contratosProcesados = contratos.map(contrato => {
      // Identificar servicios externos contratados
      const serviciosExternos = contrato.contratos_servicios.map(cs => {
        const nombreServicio = cs.servicios.nombre.toLowerCase();
        let tipoServicio = null;

        if (nombreServicio.includes('limosina') || nombreServicio.includes('limousine')) {
          tipoServicio = 'limosina';
        } else if (nombreServicio.includes('hora loca')) {
          tipoServicio = 'hora_loca';
        } else if (nombreServicio.includes('animador')) {
          tipoServicio = 'animador';
        } else if (nombreServicio.includes('chef')) {
          tipoServicio = 'chef';
        }

        return tipoServicio;
      }).filter(Boolean);

      // Obtener checklist existente por tipo
      const checklistPorTipo = {};
      contrato.checklist_servicios_externos.forEach(item => {
        checklistPorTipo[item.servicio_tipo] = item;
      });

      // Crear checklist completo (incluyendo servicios sin checklist)
      const checklistCompleto = SERVICIOS_EXTERNOS_VALIDOS.map(tipo => {
        if (checklistPorTipo[tipo]) {
          return checklistPorTipo[tipo];
        }
        // Si el servicio está contratado pero no tiene checklist, crear uno pendiente
        if (serviciosExternos.includes(tipo)) {
          return {
            id: null,
            contrato_id: contrato.id,
            servicio_tipo: tipo,
            contacto_realizado: false,
            fecha_contacto: null,
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
            hora_inicio: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        contratos_servicios: {
          where: {
            servicios: {
              nombre: {
                in: ['Limosina', 'Hora Loca', 'Animador', 'Chef']
              }
            }
          },
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
          include: {
            managers: {
              select: {
                id: true,
                nombre_completo: true,
                codigo_manager: true
              }
            }
          },
          orderBy: {
            servicio_tipo: 'asc'
          }
        }
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Identificar servicios externos contratados
    const serviciosExternos = contrato.contratos_servicios.map(cs => {
      const nombreServicio = cs.servicios.nombre.toLowerCase();
      if (nombreServicio.includes('limosina') || nombreServicio.includes('limousine')) {
        return 'limosina';
      } else if (nombreServicio.includes('hora loca')) {
        return 'hora_loca';
      } else if (nombreServicio.includes('animador')) {
        return 'animador';
      } else if (nombreServicio.includes('chef')) {
        return 'chef';
      }
      return null;
    }).filter(Boolean);

    // Obtener checklist existente
    const checklistPorTipo = {};
    contrato.checklist_servicios_externos.forEach(item => {
      checklistPorTipo[item.servicio_tipo] = item;
    });

    // Crear checklist completo
    const checklistCompleto = SERVICIOS_EXTERNOS_VALIDOS.map(tipo => {
      if (checklistPorTipo[tipo]) {
        return checklistPorTipo[tipo];
      }
      if (serviciosExternos.includes(tipo)) {
        return {
          id: null,
          contrato_id: contrato.id,
          servicio_tipo: tipo,
          contacto_realizado: false,
          fecha_contacto: null,
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
    const { contrato_id, servicio_tipo, contacto_realizado, fecha_contacto, notas, estado } = req.body;
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
    const estadosValidos = ['pendiente', 'en_proceso', 'completado'];
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
          contacto_realizado: contacto_realizado !== undefined ? contacto_realizado : checklistExistente.contacto_realizado,
          fecha_contacto: fecha_contacto ? new Date(fecha_contacto) : checklistExistente.fecha_contacto,
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
          }
        }
      });
    } else {
      // Crear nuevo checklist
      resultado = await prisma.checklist_servicios_externos.create({
        data: {
          contrato_id: parseInt(contrato_id),
          servicio_tipo,
          contacto_realizado: contacto_realizado !== undefined ? contacto_realizado : false,
          fecha_contacto: fecha_contacto ? new Date(fecha_contacto) : null,
          notas: notas || null,
          estado: estadoFinal,
          manager_id: managerId
        },
        include: {
          managers: {
            select: {
              id: true,
              nombre_completo: true,
              codigo_manager: true
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
    const { contacto_realizado, fecha_contacto, notas, estado } = req.body;
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
    const estadosValidos = ['pendiente', 'en_proceso', 'completado'];
    const estadoFinal = estado && estadosValidos.includes(estado) ? estado : checklistExistente.estado;

    // Actualizar
    const resultado = await prisma.checklist_servicios_externos.update({
      where: { id: checklistId },
      data: {
        contacto_realizado: contacto_realizado !== undefined ? contacto_realizado : checklistExistente.contacto_realizado,
        fecha_contacto: fecha_contacto ? new Date(fecha_contacto) : checklistExistente.fecha_contacto,
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
      en_proceso: checklistItems.filter(item => item.estado === 'en_proceso').length,
      completado: checklistItems.filter(item => item.estado === 'completado').length,
      por_servicio: {
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
        chef: {
          total: checklistItems.filter(item => item.servicio_tipo === 'chef').length,
          completado: checklistItems.filter(item => item.servicio_tipo === 'chef' && item.estado === 'completado').length
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
