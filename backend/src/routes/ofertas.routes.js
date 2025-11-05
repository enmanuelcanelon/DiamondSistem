/**
 * Rutas de Ofertas
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { validarDatosOferta } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { 
  calcularPrecioTotal, 
  getTemporadaByMes,
  calcularComisionVendedor 
} = require('../utils/priceCalculator');
const { generarCodigoOferta } = require('../utils/codeGenerator');
const { generarFacturaProforma } = require('../utils/pdfFactura');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * @route   POST /api/ofertas/calcular
 * @desc    Calcular precio de una oferta SIN guardar (para preview)
 * @access  Private (Vendedor)
 */
router.post('/calcular', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const {
      paquete_id,
      salon_id = null,
      fecha_evento,
      cantidad_invitados,
      servicios_adicionales = [],
      descuento = 0,
      precio_base_ajustado = null,
      ajuste_temporada_custom = null
    } = req.body;

    // Validaciones básicas
    if (!paquete_id || !fecha_evento || !cantidad_invitados) {
      throw new ValidationError('Faltan datos requeridos');
    }

    // Obtener paquete
    let paquete = await prisma.paquetes.findUnique({
      where: { id: parseInt(paquete_id) }
    });

    if (!paquete) {
      throw new NotFoundError('Paquete no encontrado');
    }

    // Si hay salon_id, obtener el precio del paquete para ese salón
    if (salon_id) {
      const paqueteSalon = await prisma.paquetes_salones.findFirst({
        where: {
          paquete_id: parseInt(paquete_id),
          salon_id: parseInt(salon_id)
        }
      });

      if (paqueteSalon && paqueteSalon.disponible) {
        // Usar el precio del salón en lugar del precio base del paquete
        paquete = {
          ...paquete,
          precio_base: parseFloat(paqueteSalon.precio_base),
          invitados_minimo: paqueteSalon.invitados_minimo
        };
      } else if (paqueteSalon && !paqueteSalon.disponible) {
        throw new ValidationError('Este paquete no está disponible en el salón seleccionado');
      }
    }

    // Si se proporcionó un precio base ajustado manualmente, usarlo (tiene prioridad)
    if (precio_base_ajustado && parseFloat(precio_base_ajustado) > 0) {
      paquete = {
        ...paquete,
        precio_base: parseFloat(precio_base_ajustado)
      };
    }

    // Obtener temporadas y determinar la temporada del evento
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true }
    });

    let temporada = getTemporadaByMes(new Date(fecha_evento), temporadas);

    if (!temporada) {
      throw new ValidationError('No se pudo determinar la temporada para la fecha');
    }

    // Si se proporcionó un ajuste de temporada personalizado, usarlo
    if (ajuste_temporada_custom !== null && ajuste_temporada_custom !== undefined) {
      temporada = {
        ...temporada,
        ajuste_precio: parseFloat(ajuste_temporada_custom)
      };
    }

    // Obtener servicios adicionales con sus datos
    let servicios = [];
    if (servicios_adicionales.length > 0) {
      const serviciosIds = servicios_adicionales.map(s => s.servicio_id || s.id);
      const serviciosData = await prisma.servicios.findMany({
        where: {
          id: { in: serviciosIds },
          activo: true
        }
      });

      servicios = serviciosData.map(servicio => {
        const servicioRequest = servicios_adicionales.find(s => 
          (s.servicio_id || s.id) === servicio.id
        );
        
        return {
          ...servicio,
          // Si hay precio ajustado, usarlo; si no, usar el precio base original
          precio_base: servicioRequest?.precio_ajustado 
            ? parseFloat(servicioRequest.precio_ajustado)
            : servicio.precio_base,
          cantidad: servicioRequest?.cantidad || 1
        };
      });
    }

    // Obtener configuración del sistema
    const configData = await prisma.configuracion_sistema.findMany();
    const configuracion = {};
    configData.forEach(config => {
      configuracion[config.clave] = parseFloat(config.valor);
    });

    // Calcular precio total
    const calculo = calcularPrecioTotal({
      paquete,
      temporada,
      serviciosAdicionales: servicios,
      cantidadInvitados: parseInt(cantidad_invitados),
      descuento: parseFloat(descuento) || 0,
      configuracion
    });

    res.json({
      success: true,
      calculo
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ofertas
 * @desc    Listar ofertas (con filtros)
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { cliente_id, estado } = req.query;

    // CRÍTICO: Forzar que el vendedor solo vea SUS ofertas
    const where = {
      vendedor_id: req.user.id // Solo ofertas del vendedor autenticado
    };

    // Permitir filtros adicionales
    if (cliente_id) {
      where.cliente_id = parseInt(cliente_id);
    }

    if (estado) {
      where.estado = estado;
    }

    const ofertas = await prisma.ofertas.findMany({
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
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            estado: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { fecha_creacion: 'desc' }
    });

    res.json({
      success: true,
      count: ofertas.length,
      ofertas
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ofertas/:id
 * @desc    Obtener oferta por ID
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const oferta = await prisma.ofertas.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true,
            email: true
          }
        },
        paquetes: true,
        temporadas: true,
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

    // CRÍTICO: Verificar que el vendedor solo vea SUS ofertas
    if (oferta.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a esta oferta');
    }

    res.json({
      success: true,
      oferta
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ofertas
 * @desc    Crear nueva oferta
 * @access  Private (Vendedor)
 */
router.post('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const datos = req.body;

    // Validar datos básicos
    validarDatosOferta(datos);

    // Obtener paquete
    let paquete = await prisma.paquetes.findUnique({
      where: { id: parseInt(datos.paquete_id) }
    });

    if (!paquete) {
      throw new NotFoundError('Paquete no encontrado');
    }

    // Si hay salon_id, obtener el precio del paquete para ese salón
    if (datos.salon_id) {
      const paqueteSalon = await prisma.paquetes_salones.findFirst({
        where: {
          paquete_id: parseInt(datos.paquete_id),
          salon_id: parseInt(datos.salon_id)
        }
      });

      if (paqueteSalon && paqueteSalon.disponible) {
        // Usar el precio del salón en lugar del precio base del paquete
        paquete = {
          ...paquete,
          precio_base: parseFloat(paqueteSalon.precio_base),
          invitados_minimo: paqueteSalon.invitados_minimo
        };
      } else if (paqueteSalon && !paqueteSalon.disponible) {
        throw new ValidationError('Este paquete no está disponible en el salón seleccionado');
      }
    }

    // Obtener temporadas y determinar la temporada
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true }
    });

    const temporada = getTemporadaByMes(new Date(datos.fecha_evento), temporadas);

    if (!temporada) {
      throw new ValidationError('No se pudo determinar la temporada');
    }

    // Obtener servicios adicionales
    let servicios = [];
    if (datos.servicios_adicionales && datos.servicios_adicionales.length > 0) {
      const serviciosIds = datos.servicios_adicionales.map(s => s.servicio_id || s.id);
      const serviciosData = await prisma.servicios.findMany({
        where: {
          id: { in: serviciosIds },
          activo: true
        }
      });

      servicios = serviciosData.map(servicio => ({
        ...servicio,
        cantidad: datos.servicios_adicionales.find(s => 
          (s.servicio_id || s.id) === servicio.id
        )?.cantidad || 1,
        precio_unitario: datos.servicios_adicionales.find(s => 
          (s.servicio_id || s.id) === servicio.id
        )?.precio_unitario || servicio.precio_base
      }));
    }

    // Obtener configuración
    const configData = await prisma.configuracion_sistema.findMany();
    const configuracion = {};
    configData.forEach(config => {
      configuracion[config.clave] = parseFloat(config.valor);
    });

    // Calcular precio total
    const calculo = calcularPrecioTotal({
      paquete,
      temporada,
      serviciosAdicionales: servicios,
      cantidadInvitados: parseInt(datos.cantidad_invitados),
      descuento: parseFloat(datos.descuento || datos.descuento_porcentaje) || 0,
      configuracion
    });

    // Generar código de oferta
    const ultimaOferta = await prisma.ofertas.findFirst({
      orderBy: { id: 'desc' }
    });

    const codigo_oferta = generarCodigoOferta(ultimaOferta?.id || 0);

    // Crear oferta en transacción
    const oferta = await prisma.$transaction(async (prisma) => {
      // Crear oferta
       const nuevaOferta = await prisma.ofertas.create({
         data: {
           codigo_oferta,
           cliente_id: parseInt(datos.cliente_id),
           vendedor_id: req.user.id, // SIEMPRE usar el vendedor logueado
           paquete_id: parseInt(datos.paquete_id),
           salon_id: datos.salon_id ? parseInt(datos.salon_id) : null,
           fecha_evento: new Date(datos.fecha_evento),
           hora_inicio: new Date(`1970-01-01T${datos.hora_inicio || '18:00'}:00Z`),
           hora_fin: new Date(`1970-01-01T${datos.hora_fin || '23:00'}:00Z`),
           cantidad_invitados: parseInt(datos.cantidad_invitados),
           lugar_evento: datos.lugar_evento || null,
           lugar_salon: datos.lugar_evento || null,
           homenajeado: datos.homenajeado || null,
           temporada_id: temporada.id,
          precio_paquete_base: parseFloat(calculo.desglose.paquete.precioBase),
          ajuste_temporada: parseFloat(calculo.desglose.paquete.ajusteTemporada),
          subtotal_servicios: parseFloat(calculo.desglose.serviciosAdicionales.subtotal),
          subtotal: parseFloat(calculo.desglose.subtotalBase),
          descuento: parseFloat(datos.descuento) || 0,
          impuesto_porcentaje: calculo.desglose.impuestos.iva.porcentaje,
          impuesto_monto: parseFloat(calculo.desglose.impuestos.iva.monto),
          tarifa_servicio_porcentaje: calculo.desglose.impuestos.tarifaServicio.porcentaje,
          tarifa_servicio_monto: parseFloat(calculo.desglose.impuestos.tarifaServicio.monto),
          total_final: parseFloat(calculo.desglose.totalFinal),
          estado: 'pendiente',
          notas_vendedor: datos.notas_vendedor || null
        }
      });

      // Guardar servicios adicionales
      if (servicios.length > 0) {
        for (const servicio of servicios) {
          await prisma.ofertas_servicios_adicionales.create({
            data: {
              oferta_id: nuevaOferta.id,
              servicio_id: servicio.id,
              cantidad: servicio.cantidad,
              precio_unitario: parseFloat(servicio.precio_unitario || servicio.precio_base),
              precio_original: parseFloat(servicio.precio_base),
              subtotal: parseFloat(servicio.precio_unitario || servicio.precio_base) * servicio.cantidad
            }
          });
        }
      }

      return nuevaOferta;
    });

    // Obtener oferta completa con relaciones
    const ofertaCompleta = await prisma.ofertas.findUnique({
      where: { id: oferta.id },
      include: {
        clientes: true,
        paquetes: true,
        temporadas: true,
        ofertas_servicios_adicionales: {
          include: {
            servicios: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Oferta creada exitosamente',
      oferta: ofertaCompleta,
      calculo
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/ofertas/:id
 * @desc    Actualizar una oferta existente (solo si está pendiente)
 * @access  Private (Vendedor)
 */
router.put('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    // Verificar que la oferta existe y está pendiente
    const ofertaExistente = await prisma.ofertas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ofertaExistente) {
      throw new NotFoundError('Oferta no encontrada');
    }

    // Solo se puede editar si está pendiente
    if (ofertaExistente.estado !== 'pendiente') {
      throw new ValidationError('Solo se pueden editar ofertas en estado pendiente');
    }

    // Verificar si ya tiene un contrato asociado
    const contratoExistente = await prisma.contratos.findFirst({
      where: { oferta_id: parseInt(id) }
    });

    if (contratoExistente) {
      throw new ValidationError('No se puede editar una oferta que ya tiene un contrato asociado');
    }

    // Validar datos básicos
    validarDatosOferta(datos);

    // Obtener paquete
    let paquete = await prisma.paquetes.findUnique({
      where: { id: parseInt(datos.paquete_id) }
    });

    if (!paquete) {
      throw new NotFoundError('Paquete no encontrado');
    }

    // Aplicar precio base ajustado si se proporcionó
    if (datos.precio_base_ajustado && parseFloat(datos.precio_base_ajustado) > 0) {
      paquete = {
        ...paquete,
        precio_base: parseFloat(datos.precio_base_ajustado)
      };
    }

    // Obtener temporadas y determinar la temporada
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true }
    });

    let temporada = getTemporadaByMes(new Date(datos.fecha_evento), temporadas);

    if (!temporada) {
      throw new ValidationError('No se pudo determinar la temporada');
    }

    // Aplicar ajuste de temporada personalizado si se proporcionó
    if (datos.ajuste_temporada_custom !== null && datos.ajuste_temporada_custom !== undefined) {
      temporada = {
        ...temporada,
        ajuste_precio: parseFloat(datos.ajuste_temporada_custom)
      };
    }

    // Obtener servicios adicionales
    let servicios = [];
    if (datos.servicios_adicionales && datos.servicios_adicionales.length > 0) {
      const serviciosIds = datos.servicios_adicionales.map(s => s.servicio_id || s.id);
      const serviciosData = await prisma.servicios.findMany({
        where: {
          id: { in: serviciosIds },
          activo: true
        }
      });

      servicios = serviciosData.map(servicio => {
        const servicioInput = datos.servicios_adicionales.find(s => 
          (s.servicio_id || s.id) === servicio.id
        );
        return {
          ...servicio,
          cantidad: servicioInput?.cantidad || 1,
          precio_unitario: servicioInput?.precio_ajustado || servicioInput?.precio_unitario || servicio.precio_base
        };
      });
    }

    // Obtener configuración
    const configData = await prisma.configuracion_sistema.findMany();
    const configuracion = {};
    configData.forEach(config => {
      configuracion[config.clave] = parseFloat(config.valor);
    });

    // Calcular precio total
    const calculo = calcularPrecioTotal({
      paquete,
      temporada,
      serviciosAdicionales: servicios,
      cantidadInvitados: parseInt(datos.cantidad_invitados),
      descuento: parseFloat(datos.descuento || datos.descuento_porcentaje) || 0,
      configuracion
    });

    // Actualizar oferta en transacción
    const oferta = await prisma.$transaction(async (prisma) => {
      // Actualizar oferta
      const ofertaActualizada = await prisma.ofertas.update({
        where: { id: parseInt(id) },
        data: {
          cliente_id: parseInt(datos.cliente_id),
          paquete_id: parseInt(datos.paquete_id),
          fecha_evento: new Date(datos.fecha_evento),
          hora_inicio: new Date(`1970-01-01T${datos.hora_inicio || '18:00'}:00Z`),
          hora_fin: new Date(`1970-01-01T${datos.hora_fin || '23:00'}:00Z`),
          cantidad_invitados: parseInt(datos.cantidad_invitados),
          lugar_evento: datos.lugar_evento || null,
          homenajeado: datos.homenajeado || null,
          temporada_id: temporada.id,
          precio_paquete_base: parseFloat(calculo.desglose.paquete.precioBase),
          ajuste_temporada: parseFloat(calculo.desglose.paquete.ajusteTemporada),
          subtotal_servicios: parseFloat(calculo.desglose.serviciosAdicionales.subtotal),
          subtotal: parseFloat(calculo.desglose.subtotalBase),
          descuento: parseFloat(datos.descuento) || 0,
          impuesto_porcentaje: calculo.desglose.impuestos.iva.porcentaje,
          impuesto_monto: parseFloat(calculo.desglose.impuestos.iva.monto),
          tarifa_servicio_porcentaje: calculo.desglose.impuestos.tarifaServicio.porcentaje,
          tarifa_servicio_monto: parseFloat(calculo.desglose.impuestos.tarifaServicio.monto),
          total_final: parseFloat(calculo.desglose.totalFinal),
          notas_vendedor: datos.notas_vendedor || null
        }
      });

      // Eliminar servicios adicionales anteriores
      await prisma.ofertas_servicios_adicionales.deleteMany({
        where: { oferta_id: parseInt(id) }
      });

      // Guardar nuevos servicios adicionales
      if (servicios.length > 0) {
        for (const servicio of servicios) {
          await prisma.ofertas_servicios_adicionales.create({
            data: {
              oferta_id: parseInt(id),
              servicio_id: servicio.id,
              cantidad: servicio.cantidad,
              precio_unitario: parseFloat(servicio.precio_unitario || servicio.precio_base),
              precio_original: parseFloat(servicio.precio_base),
              subtotal: parseFloat(servicio.precio_unitario || servicio.precio_base) * servicio.cantidad
            }
          });
        }
      }

      return ofertaActualizada;
    });

    // Obtener oferta completa con relaciones
    const ofertaCompleta = await prisma.ofertas.findUnique({
      where: { id: oferta.id },
      include: {
        clientes: true,
        paquetes: true,
        temporadas: true,
        ofertas_servicios_adicionales: {
          include: {
            servicios: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Oferta actualizada exitosamente',
      oferta: ofertaCompleta,
      calculo
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/ofertas/:id/aceptar
 * @desc    Aceptar oferta
 * @access  Private (Vendedor)
 */
router.put('/:id/aceptar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const oferta = await prisma.ofertas.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'aceptada',
        fecha_respuesta: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Oferta aceptada exitosamente',
      oferta
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/ofertas/:id/rechazar
 * @desc    Rechazar oferta
 * @access  Private (Vendedor)
 */
router.put('/:id/rechazar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que la oferta existe
    const ofertaExistente = await prisma.ofertas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ofertaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Actualizar solo el estado
    const oferta = await prisma.ofertas.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'rechazada',
        fecha_respuesta: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Oferta rechazada exitosamente',
      oferta
    });

  } catch (error) {
    logger.error('Error al rechazar oferta', {
      error: error.message,
      stack: error.stack,
      oferta_id: req.params.id,
      user_id: req.user?.id
    });
    next(error);
  }
});

/**
 * @route   GET /api/ofertas/:id/pdf-factura
 * @desc    Descargar PDF de la factura proforma de la oferta
 * @access  Private (Vendedor)
 */
router.get('/:id/pdf-factura', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener oferta con todas las relaciones necesarias
    const oferta = await prisma.ofertas.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        paquetes: true,
        temporadas: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
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

    // Generar PDF
    const doc = generarFacturaProforma(oferta, 'oferta');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Oferta-${oferta.codigo_oferta}.pdf`);

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

module.exports = router;
