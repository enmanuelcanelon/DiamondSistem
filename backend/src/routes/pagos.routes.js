/**
 * Rutas de Pagos
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { validarDatosPago } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { calcularRecargoTarjeta } = require('../utils/priceCalculator');
const { generarPDFContrato } = require('../utils/pdfContrato');

const prisma = getPrismaClient();

/**
 * @route   GET /api/pagos
 * @desc    Listar pagos (con filtros)
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { contrato_id, metodo_pago, fecha_desde, fecha_hasta } = req.query;

    // CRÍTICO: Filtrar pagos solo de contratos del vendedor autenticado
    const where = {
      contratos: {
        OR: [
          { usuario_id: req.user.id },
          { vendedor_id: req.user.id }
        ]
      }
    };

    if (contrato_id) {
      // Verificar que el contrato pertenece al vendedor
      const contrato = await prisma.contratos.findUnique({
        where: { id: parseInt(contrato_id) },
        select: { usuario_id: true, vendedor_id: true }
      });

      // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
      if (!contrato || !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
        throw new ValidationError('No tienes acceso a este contrato');
      }

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

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [pagos, total] = await Promise.all([
      prisma.pagos.findMany({
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
          usuarios: {
            select: {
              id: true,
              nombre_completo: true,
              codigo_usuario: true
            }
          }
        },
        orderBy: { fecha_pago: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.pagos.count({ where })
    ]);

    res.json(createPaginationResponse(pagos, total, page, limit));

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
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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
 * @access  Private (Vendedor o Cliente propietario del contrato)
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const datos = req.body;

    // Validar datos
    validarDatosPago(datos);

    // Sanitizar contrato_id
    const { sanitizarId, sanitizarFloat } = require('../utils/validators');
    const contratoIdSanitizado = sanitizarId(datos.contrato_id, 'contrato_id');

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: contratoIdSanitizado },
      include: {
        clientes: {
          select: {
            id: true
          }
        }
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos: vendedor, cliente propietario del contrato, o inventario (administración)
    if (req.user.tipo === 'cliente') {
      if (contrato.cliente_id !== req.user.id) {
        throw new ValidationError('No tienes permiso para registrar pagos en este contrato');
      }
    } else if (req.user.tipo !== 'vendedor' && req.user.tipo !== 'inventario') {
      throw new ValidationError('Solo vendedores, clientes y administración pueden registrar pagos');
    }

    // Verificar que el contrato no esté completado
    if (contrato.estado_pago === 'completado') {
      throw new ValidationError('El contrato ya está pagado completamente');
    }

    // Verificar que el monto no exceda el saldo pendiente
    let monto = sanitizarFloat(datos.monto, 0.01, Number.MAX_SAFE_INTEGER);
    const saldoPendiente = parseFloat(contrato.saldo_pendiente);
    if (monto > saldoPendiente) {
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

    // Registrar pago y generar nueva versión del contrato
    const resultado = await prisma.$transaction(async (tx) => {
      // Registrar pago (el trigger se encarga de actualizar el contrato)
      const pago = await tx.pagos.create({
        data: {
          contrato_id: contratoIdSanitizado, // Ya sanitizado
          monto: monto,
          metodo_pago: datos.metodo_pago,
          tipo_tarjeta: datos.tipo_tarjeta || null,
          recargo_tarjeta: recargo_tarjeta,
          monto_total: monto_total,
          numero_referencia: datos.numero_referencia || null,
          estado: 'completado',
          notas: datos.notas || null,
          registrado_por: req.user.tipo === 'vendedor' ? req.user.id : (req.user.tipo === 'inventario' ? req.user.id : null)
        }
      });

      // Obtener el contrato actualizado después del trigger
      const contratoActualizado = await tx.contratos.findUnique({
        where: { id: contratoIdSanitizado }, // Ya sanitizado
        include: {
          clientes: true,
          usuarios: true,
          paquetes: true,
          ofertas: {
            include: {
              temporadas: true,
            },
          },
          contratos_servicios: {
            include: {
              servicios: true,
            },
          },
        },
      });

      // Obtener el próximo número de versión
      const ultimaVersion = await tx.versiones_contratos_pdf.findFirst({
        where: { contrato_id: contratoIdSanitizado }, // Ya sanitizado
        orderBy: { version_numero: 'desc' },
      });

      const nuevoNumeroVersion = ultimaVersion ? ultimaVersion.version_numero + 1 : 1;

      // Generar el PDF (se ejecuta fuera de la transacción)
      let pdfBuffer = null;
      try {
        const doc = generarPDFContrato(contratoActualizado);
        const chunks = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        
        await new Promise((resolve, reject) => {
          doc.on('end', resolve);
          doc.on('error', reject);
          doc.end();
        });

        pdfBuffer = Buffer.concat(chunks);
      } catch (pdfError) {
        logger.error('Error generando PDF', {
          error: pdfError.message,
          stack: pdfError.stack,
          contrato_id: parseInt(datos.contrato_id)
        });
        // No fallar la transacción si el PDF falla
      }

      // Crear descripción del cambio
      const descripcionCambio = `Pago registrado: $${monto_total.toFixed(2)} (${datos.metodo_pago}${datos.tipo_tarjeta ? ` - ${datos.tipo_tarjeta}` : ''}). Total pagado: $${parseFloat(contratoActualizado.total_pagado).toFixed(2)}, Saldo pendiente: $${parseFloat(contratoActualizado.saldo_pendiente).toFixed(2)}`;

      // Guardar la nueva versión del contrato
      await tx.versiones_contratos_pdf.create({
        data: {
          contrato_id: parseInt(datos.contrato_id),
          version_numero: nuevoNumeroVersion,
          total_contrato: contratoActualizado.total_contrato,
          cantidad_invitados: contratoActualizado.cantidad_invitados,
          motivo_cambio: descripcionCambio,
          cambios_detalle: {
            tipo_cambio: 'pago',
            pago_id: pago.id,
            monto: monto_total,
            metodo_pago: datos.metodo_pago,
            total_pagado: parseFloat(contratoActualizado.total_pagado),
            saldo_pendiente: parseFloat(contratoActualizado.saldo_pendiente),
            estado_pago: contratoActualizado.estado_pago,
          },
          pdf_contenido: pdfBuffer,
          generado_por: req.user.tipo === 'vendedor' ? req.user.id : null,
        },
      });

      return {
        pago,
        contrato: contratoActualizado,
        version_numero: nuevoNumeroVersion
      };
    });

    // CRÍTICO: Recalcular comisiones del vendedor después de registrar el pago
    // Se ejecuta después de la transacción pero con manejo de errores robusto
    try {
      const { calcularComisionesVendedor } = require('../utils/comisionCalculator');
      await calcularComisionesVendedor(contratoIdSanitizado);
    } catch (comisionError) {
      // Loguear el error pero no fallar la respuesta - las comisiones se pueden recalcular manualmente
      const logger = require('../utils/logger');
      logger.error('Error al calcular comisiones después del pago', {
        contratoId: contratoIdSanitizado,
        error: comisionError.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente. Nueva versión del contrato generada.',
      pago: resultado.pago,
      contrato_actualizado: {
        total_pagado: parseFloat(resultado.contrato.total_pagado),
        saldo_pendiente: parseFloat(resultado.contrato.saldo_pendiente),
        estado_pago: resultado.contrato.estado_pago
      },
      version_contrato: {
        numero: resultado.version_numero,
        mensaje: `Versión ${resultado.version_numero} del contrato generada automáticamente`
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/pagos/reserva
 * @desc    Registrar pago de reserva de $500 (antes de crear contrato)
 * @access  Private (Vendedor)
 */
router.post('/reserva', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { sanitizarId, sanitizarFloat } = require('../utils/validators');
    const {
      oferta_id,
      cliente_id,
      monto,
      metodo_pago,
      tipo_tarjeta,
      numero_referencia,
      notas
    } = req.body;

    // Validar datos requeridos
    if (!oferta_id || !cliente_id || !monto || !metodo_pago) {
      throw new ValidationError('Faltan datos requeridos: oferta_id, cliente_id, monto, metodo_pago');
    }

    // Sanitizar
    const ofertaIdSanitizado = sanitizarId(oferta_id, 'oferta_id');
    const clienteIdSanitizado = sanitizarId(cliente_id, 'cliente_id');
    const montoSanitizado = sanitizarFloat(monto, 0.01, Number.MAX_SAFE_INTEGER);

    // Validar que el monto sea al menos $500
    if (montoSanitizado < 500) {
      throw new ValidationError('El pago de reserva debe ser de al menos $500');
    }

    // Verificar que la oferta existe y pertenece al vendedor
    const oferta = await prisma.ofertas.findUnique({
      where: { id: ofertaIdSanitizado },
      include: {
        clientes: true,
        usuarios: true
      }
    });

    if (!oferta) {
      throw new NotFoundError('Oferta no encontrada');
    }

    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if (!(oferta.usuario_id === req.user.id || oferta.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes permiso para registrar pagos de esta oferta');
    }

    if (oferta.cliente_id !== clienteIdSanitizado) {
      throw new ValidationError('El cliente no corresponde a la oferta');
    }

    // Verificar que no exista ya un pago de reserva para esta oferta
    // Buscar pagos sin contrato_id que puedan estar relacionados con esta oferta
    // (esto se verifica mejor al crear el contrato, aquí solo validamos que no haya múltiples pagos sin contrato del mismo vendedor)

    // Calcular recargo si es pago con tarjeta
    let recargo_tarjeta = 0;
    let monto_total = montoSanitizado;

    if (metodo_pago === 'Tarjeta') {
      if (!tipo_tarjeta) {
        throw new ValidationError('Debe especificar el tipo de tarjeta');
      }
      const calculo = calcularRecargoTarjeta(montoSanitizado);
      recargo_tarjeta = calculo.recargo;
      monto_total = calculo.montoTotal;
    }

    // Crear pago de reserva (sin contrato_id, se vinculará después)
    const pagoReserva = await prisma.pagos.create({
      data: {
        contrato_id: null, // Se vinculará cuando se cree el contrato
        monto: montoSanitizado,
        metodo_pago: metodo_pago,
        tipo_tarjeta: tipo_tarjeta || null,
        recargo_tarjeta: recargo_tarjeta,
        monto_total: monto_total,
        numero_referencia: numero_referencia || null,
        estado: 'completado',
        notas: notas || `Pago de reserva de $${montoSanitizado} para oferta ${oferta.codigo_oferta}`,
        registrado_por: req.user.id,
        fecha_pago: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago de reserva registrado exitosamente',
      pago: pagoReserva
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/pagos/contrato/:contrato_id
 * @desc    Obtener pagos de un contrato específico
 * @access  Private (Vendedor o Cliente propietario del contrato)
 */
router.get('/contrato/:contrato_id', authenticate, async (req, res, next) => {
  try {
    const { contrato_id } = req.params;

    // Verificar que el contrato existe y obtener información de permisos
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      select: {
        id: true,
        cliente_id: true,
        usuario_id: true,
        vendedor_id: true,
        total_contrato: true,
        total_pagado: true,
        saldo_pendiente: true,
        estado_pago: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos: vendedor propietario, cliente propietario, o gerente
    if (req.user.tipo === 'cliente') {
      if (contrato.cliente_id !== req.user.id) {
        throw new ValidationError('No tienes permiso para ver los pagos de este contrato');
      }
    } else if (req.user.tipo === 'vendedor') {
      // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
      if (!(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
        throw new ValidationError('No tienes permiso para ver los pagos de este contrato');
      }
    } else if (req.user.tipo !== 'gerente') {
      throw new ValidationError('Solo vendedores propietarios, clientes y gerentes pueden ver los pagos');
    }

    const pagos = await prisma.pagos.findMany({
      where: { contrato_id: parseInt(contrato_id) },
      orderBy: { fecha_pago: 'desc' }
    });

    res.json({
      success: true,
      count: pagos.length,
      contrato: {
        total_contrato: contrato.total_contrato,
        total_pagado: contrato.total_pagado,
        saldo_pendiente: contrato.saldo_pendiente,
        estado_pago: contrato.estado_pago
      },
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
