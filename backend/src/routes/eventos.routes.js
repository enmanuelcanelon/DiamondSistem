/**
 * Rutas de Eventos
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const prisma = getPrismaClient();

/**
 * @route   GET /api/eventos
 * @desc    Listar eventos (con filtros)
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { estado, fecha_desde, fecha_hasta } = req.query;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_evento = {};
      if (fecha_desde) {
        where.fecha_evento.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_evento.lte = new Date(fecha_hasta);
      }
    }

    const eventos = await prisma.eventos.findMany({
      where,
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            total_contrato: true,
            estado_pago: true,
            vendedores: {
              select: {
                id: true,
                nombre_completo: true,
                codigo_vendedor: true
              }
            }
          }
        }
      },
      orderBy: { fecha_evento: 'asc' }
    });

    res.json({
      success: true,
      count: eventos.length,
      eventos
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/eventos/:id
 * @desc    Obtener evento por ID
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const evento = await prisma.eventos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        contratos: {
          include: {
            paquetes: {
              select: {
                id: true,
                nombre: true,
                precio_base: true
              }
            },
            contratos_servicios: {
              include: {
                servicios: true
              }
            }
          }
        }
      }
    });

    if (!evento) {
      throw new NotFoundError('Evento no encontrado');
    }

    res.json({
      success: true,
      evento
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/eventos/:id
 * @desc    Actualizar detalles del evento (por el cliente)
 * @access  Private (Cliente propietario o Vendedor)
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      detalles_comida,
      detalles_bebidas,
      detalles_decoracion,
      detalles_musica,
      seating_chart,
      instrucciones_especiales,
      cantidad_invitados_confirmados
    } = req.body;

    // Verificar que el evento existe
    const eventoExistente = await prisma.eventos.findUnique({
      where: { id: parseInt(id) },
      include: {
        contratos: {
          select: {
            cliente_id: true,
            vendedor_id: true
          }
        }
      }
    });

    if (!eventoExistente) {
      throw new NotFoundError('Evento no encontrado');
    }

    // Actualizar evento
    const evento = await prisma.eventos.update({
      where: { id: parseInt(id) },
      data: {
        detalles_comida: detalles_comida ? JSON.stringify(detalles_comida) : eventoExistente.detalles_comida,
        detalles_bebidas: detalles_bebidas ? JSON.stringify(detalles_bebidas) : eventoExistente.detalles_bebidas,
        detalles_decoracion: detalles_decoracion ? JSON.stringify(detalles_decoracion) : eventoExistente.detalles_decoracion,
        detalles_musica: detalles_musica || eventoExistente.detalles_musica,
        seating_chart: seating_chart ? JSON.stringify(seating_chart) : eventoExistente.seating_chart,
        instrucciones_especiales: instrucciones_especiales || eventoExistente.instrucciones_especiales,
        cantidad_invitados_confirmados: cantidad_invitados_confirmados || eventoExistente.cantidad_invitados_confirmados
      }
    });

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      evento
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
