/**
 * Rutas de Leaks
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { asignarSalonPorInvitados, calcularFechaProximoContacto } = require('../utils/leakAssignment');

const prisma = getPrismaClient();

/**
 * @route   GET /api/leaks
 * @desc    Listar leaks del vendedor autenticado
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { estado, salon, fuente, fecha_desde, fecha_hasta } = req.query;

    const where = {
      vendedor_id: req.user.id
    };

    if (estado) {
      where.estado = estado;
    }

    if (salon) {
      where.salon_preferido = salon;
    }

    if (fuente) {
      where.fuente = { contains: fuente, mode: 'insensitive' };
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_recepcion = {};
      if (fecha_desde) {
        where.fecha_recepcion.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_recepcion.lte = new Date(fecha_hasta + 'T23:59:59');
      }
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [leaks, total] = await Promise.all([
      prisma.leaks.findMany({
        where,
        orderBy: [
          { fecha_proximo_contacto: 'asc' }, // Recordatorios primero
          { fecha_recepcion: 'desc' }
        ],
        take: limit,
        skip: skip
      }),
      prisma.leaks.count({ where })
    ]);

    res.json(createPaginationResponse(leaks, total, page, limit));

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/leaks/disponibles
 * @desc    Listar leaks disponibles para tomar (sin asignar)
 * @access  Private (Vendedor)
 */
router.get('/disponibles', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salon } = req.query;

    const where = {
      vendedor_id: null, // Sin asignar
      estado: { not: 'convertido' } // Excluir convertidos
    };

    if (salon) {
      where.salon_preferido = salon;
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [leaks, total] = await Promise.all([
      prisma.leaks.findMany({
        where,
        orderBy: { fecha_recepcion: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.leaks.count({ where })
    ]);

    res.json(createPaginationResponse(leaks, total, page, limit));

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/leaks/pendientes-contacto
 * @desc    Obtener leaks pendientes de contacto (recordatorios)
 * @access  Private (Vendedor)
 */
router.get('/pendientes-contacto', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const leaks = await prisma.leaks.findMany({
      where: {
        vendedor_id: req.user.id,
        estado: {
          in: ['no_contesta', 'contactado_llamar_otra_vez']
        },
        fecha_proximo_contacto: {
          lte: hoy
        }
      },
      orderBy: { fecha_proximo_contacto: 'asc' }
    });

    res.json({
      success: true,
      count: leaks.length,
      leaks
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/leaks/:id
 * @desc    Obtener detalle de un leak
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true
          }
        }
      }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    // Verificar que el vendedor tenga acceso (es su leak o está disponible)
    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver este leak');
    }

    res.json({
      success: true,
      leak
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/:id/tomar
 * @desc    Tomar un leak (asignarlo al vendedor)
 * @access  Private (Vendedor)
 */
router.post('/:id/tomar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    if (leak.vendedor_id) {
      throw new ValidationError('Este leak ya está asignado a otro vendedor');
    }

    if (leak.estado === 'convertido') {
      throw new ValidationError('Este leak ya fue convertido en cliente');
    }

    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: {
        vendedor_id: req.user.id,
        fecha_asignacion: new Date()
      },
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Leak asignado exitosamente',
      leak: leakActualizado
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/leaks/:id/estado
 * @desc    Cambiar estado de un leak
 * @access  Private (Vendedor)
 */
router.put('/:id/estado', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, fecha_cita_salon, motivo_rechazo, notas_vendedor } = req.body;

    const estadosValidos = ['nuevo', 'contactado', 'no_contesta', 'rechazado', 'contactado_llamar_otra_vez', 'convertido'];
    
    if (!estado || !estadosValidos.includes(estado)) {
      throw new ValidationError('Estado inválido');
    }

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    // Verificar que el vendedor tenga acceso
    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para modificar este leak');
    }

    // Validaciones según estado
    if (estado === 'contactado' && !fecha_cita_salon) {
      throw new ValidationError('La fecha de cita al salón es requerida para el estado "contactado"');
    }

    if (estado === 'rechazado' && !motivo_rechazo) {
      throw new ValidationError('El motivo de rechazo es requerido');
    }

    // Preparar datos de actualización
    const dataUpdate = {
      estado,
      fecha_ultimo_contacto: new Date(),
      fecha_actualizacion: new Date()
    };

    if (fecha_cita_salon) {
      dataUpdate.fecha_cita_salon = new Date(fecha_cita_salon);
    }

    if (motivo_rechazo) {
      dataUpdate.motivo_rechazo = motivo_rechazo;
    }

    if (notas_vendedor) {
      dataUpdate.notas_vendedor = notas_vendedor;
    }

    // Calcular fecha próximo contacto según estado
    const fechaProximoContacto = calcularFechaProximoContacto(estado);
    if (fechaProximoContacto) {
      dataUpdate.fecha_proximo_contacto = fechaProximoContacto;
    }

    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: dataUpdate,
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      leak: leakActualizado
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/:id/convertir-cliente
 * @desc    Convertir leak en cliente
 * @access  Private (Vendedor)
 */
router.post('/:id/convertir-cliente', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    // Verificar que el vendedor tenga acceso
    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para convertir este leak');
    }

    if (leak.cliente_id) {
      throw new ValidationError('Este leak ya fue convertido en cliente');
    }

    // Verificar si ya existe un cliente con el mismo email o teléfono
    const clienteExistente = await prisma.clientes.findFirst({
      where: {
        OR: [
          { email: leak.email },
          { telefono: leak.telefono }
        ]
      }
    });

    let cliente;

    if (clienteExistente) {
      // Usar el cliente existente
      cliente = clienteExistente;
    } else {
      // Crear nuevo cliente
      cliente = await prisma.clientes.create({
        data: {
          nombre_completo: leak.nombre_completo,
          email: leak.email,
          telefono: leak.telefono,
          tipo_evento: leak.tipo_evento,
          como_nos_conocio: leak.fuente || 'Leak',
          vendedor_id: req.user.id
        }
      });
    }

    // Actualizar leak
    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: {
        cliente_id: cliente.id,
        estado: 'convertido',
        fecha_actualizacion: new Date()
      },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Leak convertido en cliente exitosamente',
      leak: leakActualizado,
      cliente
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/importar
 * @desc    Importar leaks desde Excel o crear manualmente
 * @access  Private (Vendedor)
 */
router.post('/importar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { leaks } = req.body; // Array de leaks a importar

    if (!Array.isArray(leaks) || leaks.length === 0) {
      throw new ValidationError('Se requiere un array de leaks para importar');
    }

    const leaksCreados = [];
    const leaksDuplicados = [];
    const errores = [];

    for (const leakData of leaks) {
      try {
        // Verificar si ya existe un leak con el mismo email o teléfono
        const leakExistente = await prisma.leaks.findFirst({
          where: {
            OR: [
              { email: leakData.email },
              { telefono: leakData.telefono }
            ]
          }
        });

        if (leakExistente) {
          leaksDuplicados.push({
            email: leakData.email,
            telefono: leakData.telefono,
            motivo: 'Ya existe un leak con este email o teléfono'
          });
          continue;
        }

        // Asignar salón automáticamente si hay cantidad de invitados
        let salonPreferido = leakData.salon_preferido;
        if (!salonPreferido && leakData.cantidad_invitados) {
          salonPreferido = asignarSalonPorInvitados(leakData.cantidad_invitados);
        }

        // Parsear fecha_recepcion
        let fechaRecepcion = new Date();
        if (leakData.fecha_recepcion) {
          fechaRecepcion = new Date(leakData.fecha_recepcion);
        }

        // Parsear fecha_evento si existe
        let fechaEvento = null;
        if (leakData.fecha_evento) {
          fechaEvento = new Date(leakData.fecha_evento);
        }

        const leak = await prisma.leaks.create({
          data: {
            fecha_recepcion: fechaRecepcion,
            nombre_completo: leakData.nombre_completo,
            telefono: leakData.telefono,
            email: leakData.email,
            tipo_evento: leakData.tipo_evento || null,
            cantidad_invitados: leakData.cantidad_invitados ? parseInt(leakData.cantidad_invitados) : null,
            salon_preferido: salonPreferido,
            fecha_evento: fechaEvento,
            fuente: leakData.fuente || leakData.SOURCE || null,
            horario_contactar: leakData.horario_contactar || null,
            opt_in_sms: leakData.opt_in_sms || false,
            observaciones: leakData.observaciones || null,
            estado: 'nuevo'
          }
        });

        leaksCreados.push(leak);
      } catch (error) {
        errores.push({
          email: leakData.email,
            error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Importación completada: ${leaksCreados.length} creados, ${leaksDuplicados.length} duplicados, ${errores.length} errores`,
      creados: leaksCreados.length,
      duplicados: leaksDuplicados.length,
      errores: errores.length,
      detalles: {
        leaksCreados,
        leaksDuplicados,
        errores
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/sincronizar
 * @desc    Sincronizar leaks desde Google Sheets
 * @access  Private (Vendedor)
 */
router.post('/sincronizar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    // TODO: Implementar sincronización desde Google Sheets
    // Por ahora retornamos un mensaje
    res.json({
      success: true,
      message: 'Sincronización con Google Sheets pendiente de implementación'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

