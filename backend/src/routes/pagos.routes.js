/**
 * Rutas de Pagos
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { validarDatosPago } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { calcularRecargoTarjeta } = require('../utils/priceCalculator');

const prisma = new PrismaClient();

/**
 * @route   GET /api/pagos
 * @desc    Listar pagos (con filtros)
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { contrato_id, metodo_pago, fecha_desde, fecha_hasta } = req.query;

    const where = {};

    if (contrato_id) {
      where.contrato_id = parseInt(contrato_id);
    }

    if (metodo_pago) {
      where.metodo_pago = metodo_pago;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_pago = {};
      if (fecha_desde) {
        where.fecha_pago.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_pago.lte = new Date(fecha_hasta);
      }
    }

    const pagos = await prisma.pagos.findMany({
      where,
      include: {
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            clientes: {
              select: {
                id: true,
                nombre_completo: true
              }
            }
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      },
      orderBy: { fecha_pago: 'desc' }
    });

    res.json({
      success: true,
      count: pagos.length,
      pagos
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/pagos/:id
 * @desc    Obtener pago por ID
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const pago = await prisma.pagos.findUnique({
      where: { id: parseInt(id) },
      include: {
        contratos: {
          include: {
            clientes: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
                telefono: true
              }
            }
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    if (!pago) {
      throw new NotFoundError('Pago no encontrado');
    }

    res.json({
      success: true,
      pago
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/pagos
 * @desc    Registrar nuevo pago
 * @access  Private (Vendedor)
 */
router.post('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const datos = req.body;

    // Validar datos
    validarDatosPago(datos);

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(datos.contrato_id) }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el contrato no esté completado
    if (contrato.estado_pago === 'completado') {
      throw new ValidationError('El contrato ya está pagado completamente');
    }

    // Verificar que el monto no exceda el saldo pendiente
    let monto = parseFloat(datos.monto);
    if (monto > parseFloat(contrato.saldo_pendiente)) {
      throw new ValidationError(
        'El monto excede el saldo pendiente',
        [`Saldo pendiente: $${contrato.saldo_pendiente}`]
      );
    }

    // Calcular recargo si es pago con tarjeta
    let recargo_tarjeta = 0;
    let monto_total = monto;

    if (datos.metodo_pago === 'Tarjeta') {
      if (!datos.tipo_tarjeta) {
        throw new ValidationError('Debe especificar el tipo de tarjeta');
      }

      const calculo = calcularRecargoTarjeta(monto);
      recargo_tarjeta = calculo.recargo;
      monto_total = calculo.montoTotal;
    }

    // Registrar pago (el trigger se encarga de actualizar el contrato)
    const pago = await prisma.pagos.create({
      data: {
        contrato_id: parseInt(datos.contrato_id),
        monto: monto,
        metodo_pago: datos.metodo_pago,
        tipo_tarjeta: datos.tipo_tarjeta || null,
        recargo_tarjeta: recargo_tarjeta,
        monto_total: monto_total,
        numero_referencia: datos.numero_referencia || null,
        estado: 'completado',
        notas: datos.notas || null,
        registrado_por: req.user.id
      },
      include: {
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            total_pagado: true,
            saldo_pendiente: true,
            estado_pago: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      pago,
      contrato_actualizado: {
        total_pagado: pago.contratos.total_pagado,
        saldo_pendiente: pago.contratos.saldo_pendiente,
        estado_pago: pago.contratos.estado_pago
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/pagos/contrato/:contrato_id
 * @desc    Obtener pagos de un contrato específico
 * @access  Private (Vendedor)
 */
router.get('/contrato/:contrato_id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { contrato_id } = req.params;

    const pagos = await prisma.pagos.findMany({
      where: { contrato_id: parseInt(contrato_id) },
      orderBy: { fecha_pago: 'desc' }
    });

    // Obtener info del contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        total_contrato: true,
        total_pagado: true,
        saldo_pendiente: true,
        estado_pago: true
      }
    });

    res.json({
      success: true,
      count: pagos.length,
      contrato,
      pagos
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/pagos/:id/anular
 * @desc    Anular un pago registrado
 * @access  Private (Vendedor)
 */
router.put('/:id/anular', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Buscar el pago
    const pago = await prisma.pagos.findUnique({
      where: { id: parseInt(id) },
      include: {
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            total_contrato: true,
            total_pagado: true,
            saldo_pendiente: true,
            estado_pago: true
          }
        }
      }
    });

    if (!pago) {
      throw new NotFoundError('Pago no encontrado');
    }

    if (pago.estado === 'anulado') {
      throw new ValidationError('El pago ya está anulado');
    }

    // Anular el pago y actualizar el contrato
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Marcar el pago como anulado
      const pagoAnulado = await prisma.pagos.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'anulado',
          notas: pago.notas 
            ? `${pago.notas}\n[ANULADO] ${motivo || 'Sin motivo especificado'}`
            : `[ANULADO] ${motivo || 'Sin motivo especificado'}`
        }
      });

      // 2. Revertir el monto en el contrato
      const nuevoTotalPagado = parseFloat(pago.contratos.total_pagado) - parseFloat(pago.monto_total);
      const nuevoSaldoPendiente = parseFloat(pago.contratos.total_contrato) - nuevoTotalPagado;

      // Calcular el nuevo estado de pago
      let nuevoEstadoPago = 'pendiente';
      if (nuevoSaldoPendiente <= 0) {
        nuevoEstadoPago = 'completado';
      } else if (nuevoTotalPagado > 0) {
        nuevoEstadoPago = 'parcial';
      }

      await prisma.contratos.update({
        where: { id: pago.contrato_id },
        data: {
          total_pagado: nuevoTotalPagado,
          saldo_pendiente: nuevoSaldoPendiente,
          estado_pago: nuevoEstadoPago
        }
      });

      return pagoAnulado;
    });

    res.json({
      success: true,
      message: 'Pago anulado exitosamente',
      pago: resultado
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
