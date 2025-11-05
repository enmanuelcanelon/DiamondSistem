/**
 * Rutas de Contratos
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVendedor, requireCliente, requireOwnerOrVendedor } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { generarCodigoContrato, generarCodigoAccesoCliente } = require('../utils/codeGenerator');
const { calcularComisionVendedor, calcularPagosFinanciamiento } = require('../utils/priceCalculator');
const { generarPDFContrato } = require('../utils/pdfContrato');
const { generarFacturaProforma } = require('../utils/pdfFactura');

const prisma = new PrismaClient();

/**
 * @route   GET /api/contratos
 * @desc    Listar contratos
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { vendedor_id, cliente_id, estado, estado_pago } = req.query;

    const where = {};

    if (vendedor_id) {
      where.vendedor_id = parseInt(vendedor_id);
    }

    if (cliente_id) {
      where.cliente_id = parseInt(cliente_id);
    }

    if (estado) {
      where.estado = estado;
    }

    if (estado_pago) {
      where.estado_pago = estado_pago;
    }

    const contratos = await prisma.contratos.findMany({
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
            nombre: true,
            capacidad_maxima: true
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            estado: true
          }
        }
      },
      orderBy: { fecha_firma: 'desc' }
    });

    res.json({
      success: true,
      count: contratos.length,
      contratos
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id
 * @desc    Obtener contrato por ID
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true,
            email: true,
            telefono: true
          }
        },
        paquetes: true,
        ofertas: {
          include: {
            temporadas: true
          }
        },
        contratos_servicios: {
          include: {
            servicios: true
          }
        },
        eventos: true,
        pagos: {
          orderBy: { fecha_pago: 'desc' }
        }
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar acceso
    if (req.user.tipo === 'cliente') {
      if (contrato.cliente_id !== req.user.id) {
        throw new ValidationError('No tienes acceso a este contrato');
      }
    }

    res.json({
      success: true,
      contrato
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/contratos
 * @desc    Crear contrato desde una oferta aceptada
 * @access  Private (Vendedor)
 */
router.post('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const {
      oferta_id,
      tipo_pago,
      meses_financiamiento,
      nombre_evento,
      numero_plazos,
      plan_pagos
    } = req.body;

    // Validaciones
    if (!oferta_id) {
      throw new ValidationError('El ID de la oferta es requerido');
    }

    if (!tipo_pago || !['unico', 'financiado', 'plazos'].includes(tipo_pago)) {
      throw new ValidationError('Tipo de pago inválido');
    }

    if ((tipo_pago === 'financiado' || tipo_pago === 'plazos') && (!meses_financiamiento || meses_financiamiento < 1)) {
      throw new ValidationError('Los meses de financiamiento son requeridos');
    }

    // Obtener oferta con todas sus relaciones
    const oferta = await prisma.ofertas.findUnique({
      where: { id: parseInt(oferta_id) },
      include: {
        clientes: true,
        vendedores: true,
        paquetes: true,
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        ofertas_servicios_adicionales: {
          include: {
            servicios: true
          }
        }
      }
    });

    if (!oferta) {
      throw new NotFoundError('Oferta no encontrada');
    }

    if (oferta.estado !== 'aceptada') {
      throw new ValidationError('Solo se pueden crear contratos de ofertas aceptadas');
    }

    // Verificar que no exista un contrato para esta oferta
    const contratoExistente = await prisma.contratos.findFirst({
      where: { oferta_id: parseInt(oferta_id) }
    });

    if (contratoExistente) {
      throw new ValidationError('Ya existe un contrato para esta oferta');
    }

    // Generar códigos
    const ultimoContrato = await prisma.contratos.findFirst({
      orderBy: { id: 'desc' }
    });

    const codigo_contrato = generarCodigoContrato(ultimoContrato?.id || 0);
    
    // El código de acceso se genera después de crear el contrato para usar su ID
    let codigo_acceso_temp = generarCodigoAccesoCliente(ultimoContrato?.id + 1 || 1);

    // Calcular financiamiento si aplica
    let pago_mensual = null;
    if (tipo_pago === 'financiado') {
      const financiamiento = calcularPagosFinanciamiento(
        parseFloat(oferta.total_final),
        parseInt(meses_financiamiento)
      );
      pago_mensual = financiamiento.pagoMensual;
    }

    // Calcular comisión del vendedor
    const comision = calcularComisionVendedor(
      parseFloat(oferta.total_final),
      oferta.vendedores.comision_porcentaje
    );

    // Crear contrato en transacción
    const contrato = await prisma.$transaction(async (prisma) => {
      // Crear contrato
      const nuevoContrato = await prisma.contratos.create({
        data: {
          codigo_contrato,
          oferta_id: oferta.id,
          cliente_id: oferta.cliente_id,
          vendedor_id: oferta.vendedor_id,
          paquete_id: oferta.paquete_id,
          salon_id: oferta.salon_id || null,
          lugar_salon: oferta.lugar_salon || null,
          fecha_evento: oferta.fecha_evento,
          hora_inicio: oferta.hora_inicio,
          hora_fin: oferta.hora_fin,
          cantidad_invitados: oferta.cantidad_invitados,
          total_contrato: parseFloat(oferta.total_final),
          tipo_pago,
          meses_financiamiento: (tipo_pago === 'financiado' || tipo_pago === 'plazos') ? parseInt(meses_financiamiento) : 1,
          pago_mensual,
          plan_pagos: plan_pagos || null,
          saldo_pendiente: parseFloat(oferta.total_final),
          codigo_acceso_cliente: codigo_acceso_temp,
          comision_calculada: comision.comision,
          homenajeado: oferta.homenajeado || null
        }
      });

      // Copiar servicios de la oferta al contrato
      const serviciosPaquete = await prisma.paquetes_servicios.findMany({
        where: { paquete_id: oferta.paquete_id }
      });

      // Servicios incluidos en el paquete
      for (const ps of serviciosPaquete) {
        await prisma.contratos_servicios.create({
          data: {
            contrato_id: nuevoContrato.id,
            servicio_id: ps.servicio_id,
            cantidad: ps.cantidad,
            precio_unitario: 0,
            subtotal: 0,
            incluido_en_paquete: true
          }
        });
      }

      // Servicios adicionales
      for (const osa of oferta.ofertas_servicios_adicionales) {
        await prisma.contratos_servicios.create({
          data: {
            contrato_id: nuevoContrato.id,
            servicio_id: osa.servicio_id,
            cantidad: osa.cantidad,
            precio_unitario: parseFloat(osa.precio_unitario),
            subtotal: parseFloat(osa.subtotal),
            incluido_en_paquete: false
          }
        });
      }

      // Crear evento asociado
      await prisma.eventos.create({
        data: {
          contrato_id: nuevoContrato.id,
          cliente_id: oferta.cliente_id,
          nombre_evento: nombre_evento || `${oferta.clientes.tipo_evento || 'Evento'} - ${oferta.clientes.nombre_completo}`,
          fecha_evento: oferta.fecha_evento,
          hora_inicio: oferta.hora_inicio,
          hora_fin: oferta.hora_fin,
          cantidad_invitados_confirmados: oferta.cantidad_invitados,
          estado: 'en_proceso'
        }
      });

      return nuevoContrato;
    });

    // Obtener contrato completo
    const contratoCompleto = await prisma.contratos.findUnique({
      where: { id: contrato.id },
      include: {
        clientes: true,
        paquetes: true,
        eventos: true,
        contratos_servicios: {
          include: {
            servicios: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Contrato creado exitosamente',
      contrato: contratoCompleto,
      codigo_acceso: contrato.codigo_acceso_cliente
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/pagos
 * @desc    Obtener pagos de un contrato
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id/pagos', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el contrato existe y el usuario tiene acceso
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: { cliente_id: true, vendedor_id: true }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    const pagos = await prisma.pagos.findMany({
      where: { contrato_id: parseInt(id) },
      orderBy: { fecha_pago: 'desc' }
    });

    // Obtener información de vendedores si hay registrado_por
    const pagosConVendedor = await Promise.all(
      pagos.map(async (pago) => {
        if (pago.registrado_por) {
          const vendedor = await prisma.vendedores.findUnique({
            where: { id: pago.registrado_por },
            select: {
              id: true,
              nombre_completo: true,
              codigo_vendedor: true
            }
          });
          return { ...pago, vendedor };
        }
        return { ...pago, vendedor: null };
      })
    );

    res.json({
      success: true,
      count: pagosConVendedor.length,
      pagos: pagosConVendedor
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/servicios
 * @desc    Obtener servicios de un contrato
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id/servicios', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const servicios = await prisma.contratos_servicios.findMany({
      where: { contrato_id: parseInt(id) },
      include: {
        servicios: true
      },
      orderBy: { fecha_agregado: 'asc' }
    });

    res.json({
      success: true,
      count: servicios.length,
      servicios
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/acceso/:codigo
 * @desc    Obtener contrato por código de acceso (para login de cliente)
 * @access  Public
 */
router.get('/acceso/:codigo', async (req, res, next) => {
  try {
    const { codigo } = req.params;

    const contrato = await prisma.contratos.findUnique({
      where: { codigo_acceso_cliente: codigo },
      include: {
        clientes: true,
        eventos: true,
        paquetes: {
          select: {
            id: true,
            nombre: true,
            precio_base: true
          }
        }
      }
    });

    if (!contrato) {
      throw new NotFoundError('Código de acceso inválido');
    }

    res.json({
      success: true,
      contrato
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/pdf-contrato
 * @desc    Descargar PDF del contrato completo con términos y condiciones
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id/pdf-contrato', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener contrato con todas las relaciones necesarias
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        },
        ofertas: {
          include: {
            temporadas: true
          }
        },
        contratos_servicios: {
          include: {
            servicios: true
          }
        },
        eventos: true,
        pagos: {
          orderBy: {
            fecha_pago: 'desc'
          }
        }
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar acceso
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Generar PDF
    const doc = generarPDFContrato(contrato);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Contrato-${contrato.codigo_contrato}.pdf`);

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/pdf-factura
 * @desc    Descargar PDF de la factura proforma del contrato
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id/pdf-factura', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener contrato con todas las relaciones necesarias
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        paquetes: true,
        ofertas: true,
        contratos_servicios: {
          include: {
            servicios: true
          }
        },
        pagos: {
          orderBy: {
            fecha_pago: 'desc'
          }
        }
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar acceso
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Generar PDF
    const doc = generarFacturaProforma(contrato, 'contrato');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Factura-${contrato.codigo_contrato}.pdf`);

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/historial
 * @desc    Obtener historial de cambios del contrato
 * @access  Private (Vendedor o Cliente del contrato)
 */
router.get('/:id/historial', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        vendedor_id: true,
        cliente_id: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'vendedor' && contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Obtener historial de cambios
    const historial = await prisma.historial_cambios_precios.findMany({
      where: {
        contrato_id: parseInt(id),
      },
      orderBy: {
        fecha_cambio: 'desc', // Más recientes primero
      },
    });

    // Obtener información de vendedores si hay modificado_por
    const historialConVendedor = await Promise.all(
      historial.map(async (item) => {
        if (item.modificado_por) {
          const vendedor = await prisma.vendedores.findUnique({
            where: { id: item.modificado_por },
            select: {
              nombre_completo: true,
              codigo_vendedor: true,
            }
          });
          return { ...item, vendedor };
        }
        return { ...item, vendedor: null };
      })
    );

    res.json({
      historial: historialConVendedor,
      total: historialConVendedor.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/versiones
 * @desc    Obtener todas las versiones de un contrato
 * @access  Private (Vendedor o Cliente del contrato)
 */
router.get('/:id/versiones', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        vendedor_id: true,
        cliente_id: true,
        codigo_contrato: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'vendedor' && contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Obtener todas las versiones
    const versiones = await prisma.versiones_contratos_pdf.findMany({
      where: {
        contrato_id: parseInt(id),
      },
      include: {
        vendedores: {
          select: {
            nombre_completo: true,
            codigo_vendedor: true,
          },
        },
      },
      orderBy: {
        version_numero: 'desc', // Más recientes primero
      },
    });

    res.json({
      success: true,
      contrato: {
        id: contrato.id,
        codigo: contrato.codigo_contrato,
      },
      versiones,
      total: versiones.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/contratos/:id/versiones
 * @desc    Crear una nueva versión del contrato
 * @access  Private (Vendedor)
 */
router.post('/:id/versiones', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo_cambio, cambios_detalle } = req.body;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        vendedores: true,
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

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Obtener el próximo número de versión
    const ultimaVersion = await prisma.versiones_contratos_pdf.findFirst({
      where: { contrato_id: parseInt(id) },
      orderBy: { version_numero: 'desc' },
    });

    const nuevoNumeroVersion = ultimaVersion ? ultimaVersion.version_numero + 1 : 1;

    // Generar el PDF del contrato
    const doc = generarPDFContrato(contrato);
    
    // Convertir el stream del PDF a buffer
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Crear la nueva versión
    const nuevaVersion = await prisma.versiones_contratos_pdf.create({
      data: {
        contrato_id: parseInt(id),
        version_numero: nuevoNumeroVersion,
        total_contrato: contrato.total_contrato,
        cantidad_invitados: contrato.cantidad_invitados,
        motivo_cambio: motivo_cambio || 'Actualización del contrato',
        cambios_detalle: cambios_detalle || {},
        pdf_contenido: pdfBuffer,
        generado_por: req.user.id,
      },
      include: {
        vendedores: {
          select: {
            nombre_completo: true,
            codigo_vendedor: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Versión ${nuevoNumeroVersion} creada exitosamente`,
      version: nuevaVersion,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/contratos/:id/versiones/:version_numero/pdf
 * @desc    Descargar PDF de una versión específica del contrato
 * @access  Private (Vendedor o Cliente del contrato)
 */
router.get('/:id/versiones/:version_numero/pdf', authenticate, async (req, res, next) => {
  try {
    const { id, version_numero } = req.params;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        vendedor_id: true,
        cliente_id: true,
        codigo_contrato: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'vendedor' && contrato.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Obtener la versión específica
    const version = await prisma.versiones_contratos_pdf.findFirst({
      where: {
        contrato_id: parseInt(id),
        version_numero: parseInt(version_numero),
      },
    });

    if (!version) {
      throw new NotFoundError(`Versión ${version_numero} no encontrada`);
    }

    // Si existe el PDF guardado, enviarlo
    if (version.pdf_contenido) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Contrato-${contrato.codigo_contrato}-v${version_numero}.pdf`
      );
      return res.send(version.pdf_contenido);
    }

    // Si NO existe PDF, generarlo en tiempo real con los datos actuales del contrato
    const contratoCompleto = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        vendedores: true,
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

    // Generar PDF con los datos del contrato (snapshot histórico)
    const doc = generarPDFContrato(contratoCompleto);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Contrato-${contrato.codigo_contrato}-v${version_numero}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

