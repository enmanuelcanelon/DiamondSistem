/**
 * Rutas de Contratos
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor, requireCliente, requireOwnerOrVendedor, requireVendedorOrInventario } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { generarCodigoContrato, generarCodigoAccesoCliente } = require('../utils/codeGenerator');
const { calcularComisionVendedor, calcularPagosFinanciamiento } = require('../utils/priceCalculator');
const { generarPDFContrato } = require('../utils/pdfContrato');
const { generarFacturaProforma } = require('../utils/pdfFactura');
const { generarFacturaProformaHTML } = require('../utils/pdfFacturaHTML');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * @route   GET /api/contratos
 * @desc    Listar contratos
 * @access  Private (Vendedor o Inventario)
 */
router.get('/', authenticate, requireVendedorOrInventario, async (req, res, next) => {
  try {
    const { cliente_id, estado, estado_pago, fecha_desde, fecha_hasta, fecha_creacion_desde, fecha_creacion_hasta, search, salon_id, alerta_30_dias } = req.query;

    // Si es vendedor, solo ver sus contratos. Si es inventario, ver todos
    const where = {};
    
    // Construir filtro de vendedor (si aplica)
    const filtroVendedor = req.user.tipo === 'vendedor' ? {
      OR: [
        { usuario_id: req.user.id },
        { vendedor_id: req.user.id }
      ]
    } : null;
    
    // Si es inventario y no se especifica estado, mostrar solo activos por defecto
    if (req.user.tipo === 'inventario' && !estado) {
      where.estado = 'activo';
    }

    // Permitir filtros adicionales
    if (cliente_id) {
      where.cliente_id = parseInt(cliente_id);
    }

    if (estado) {
      where.estado = estado;
    }

    if (estado_pago) {
      where.estado_pago = estado_pago;
    }

    // Filtro por salón
    if (salon_id) {
      where.salon_id = parseInt(salon_id);
    }

    // Filtro para alertas de 30 días (contratos que están a 30 días o menos)
    if (alerta_30_dias === 'true') {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 30);
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);
      
      where.fecha_evento = {
        gte: fechaHoy,
        lte: fechaLimite
      };
      where.estado = 'activo';
    }

    // Filtro por fecha del evento
    if (fecha_desde || fecha_hasta) {
      where.fecha_evento = {};
      if (fecha_desde) {
        where.fecha_evento.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_evento.lte = new Date(fecha_hasta + 'T23:59:59');
      }
    }

    // Filtro por fecha de creación del contrato
    if (fecha_creacion_desde || fecha_creacion_hasta) {
      where.fecha_creacion_contrato = {};
      if (fecha_creacion_desde) {
        where.fecha_creacion_contrato.gte = new Date(fecha_creacion_desde);
      }
      if (fecha_creacion_hasta) {
        where.fecha_creacion_contrato.lte = new Date(fecha_creacion_hasta + 'T23:59:59');
      }
    }

    // Búsqueda por código de contrato o nombre de cliente
    const filtroBusqueda = search ? {
      OR: [
        { codigo_contrato: { contains: search, mode: 'insensitive' } },
        { clientes: { nombre_completo: { contains: search, mode: 'insensitive' } } }
      ]
    } : null;

    // Combinar filtros usando AND si hay filtro de vendedor o búsqueda
    if (filtroVendedor || filtroBusqueda) {
      const condicionesAND = [];
      if (filtroVendedor) {
        condicionesAND.push(filtroVendedor);
      }
      if (filtroBusqueda) {
        condicionesAND.push(filtroBusqueda);
      }
      if (condicionesAND.length > 0) {
        where.AND = condicionesAND;
      }
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [contratos, total] = await Promise.all([
      prisma.contratos.findMany({
        where,
        include: {
          clientes: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
              telefono: true,
              tipo_evento: true
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
          usuarios: {
            select: {
              id: true,
              nombre_completo: true,
              codigo_usuario: true
            }
          },
          ofertas: {
            select: {
              id: true,
              tipo_evento: true,
              codigo_oferta: true
            }
          },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            estado: true
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
        asignaciones_inventario: {
          where: {
            estado: { not: 'cancelado' }
          },
          select: {
            id: true,
            estado: true
          }
        },
        pagos: {
          where: {
            estado: 'completado'
          },
          select: {
            id: true,
            monto: true,
            monto_total: true,
            fecha_pago: true,
            estado: true
          },
          orderBy: {
            fecha_pago: 'asc'
          }
        }
      },
      orderBy: { fecha_firma: 'desc' },
      take: limit,
      skip: skip
    }),
    prisma.contratos.count({ where })
    ]);

    res.json(createPaginationResponse(contratos, total, page, limit));

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
    const { sanitizarId } = require('../utils/validators');
    const id = sanitizarId(req.params.id, 'contrato_id');

    const contrato = await prisma.contratos.findUnique({
      where: { id }, // Ya sanitizado
      include: {
        clientes: true,
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true,
            email: true,
            telefono: true
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
        salones: true,
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

    // Verificar acceso - CRÍTICO: Validar autorización
    if (req.user.tipo === 'cliente') {
      if (contrato.cliente_id !== req.user.id) {
        throw new ValidationError('No tienes acceso a este contrato');
      }
    } else if (req.user.tipo === 'vendedor') {
      // CRÍTICO: Vendedor solo puede ver SUS contratos
      // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
      if (!(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
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
    const { sanitizarId, sanitizarString, sanitizarInt } = require('../utils/validators');
    const {
      oferta_id,
      tipo_pago,
      meses_financiamiento,
      nombre_evento,
      numero_plazos,
      dia_mes_pago,  // Día del mes para pagos en plazos
      plan_pagos,
      pago_reserva_id  // ID del pago de reserva de $500
    } = req.body;

    // Sanitizar y validar
    const ofertaIdSanitizado = sanitizarId(oferta_id, 'oferta_id');

    if (!tipo_pago || !['unico', 'financiado', 'plazos'].includes(tipo_pago)) {
      throw new ValidationError('Tipo de pago inválido');
    }

    // Sanitizar meses de financiamiento si aplica
    let mesesFinanciamientoSanitizado = 1;
    if (tipo_pago === 'financiado' || tipo_pago === 'plazos') {
      if (!meses_financiamiento) {
        throw new ValidationError('Los meses de financiamiento son requeridos');
      }
      mesesFinanciamientoSanitizado = sanitizarInt(meses_financiamiento, 1, 60);
    }

    // Validar plan de pagos antes de obtener la oferta
    // Necesitamos verificar que los meses de financiamiento no excedan el tiempo hasta el evento

    // Obtener oferta con todas sus relaciones
    const oferta = await prisma.ofertas.findUnique({
      where: { id: ofertaIdSanitizado },
      include: {
        clientes: true,
        usuarios: true,
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

    // Verificar que la oferta esté pendiente (no aceptada aún)
    // La oferta se marcará como "aceptada" DESPUÉS de crear el contrato exitosamente
    if (oferta.estado === 'rechazada') {
      throw new ValidationError('No se puede crear un contrato de una oferta rechazada');
    }

    if (oferta.estado === 'aceptada') {
      // Verificar si ya existe un contrato para evitar duplicados
      const contratoExistentePrev = await prisma.contratos.findFirst({
        where: { oferta_id: ofertaIdSanitizado }
      });
      if (contratoExistentePrev) {
        throw new ValidationError('Esta oferta ya tiene un contrato asociado');
      }
    }

    // Validar que el total de la oferta no sea negativo
    if (parseFloat(oferta.total_final) < 0) {
      throw new ValidationError('No se puede crear un contrato con un total negativo. Por favor, ajusta el descuento de la oferta.');
    }

    // Verificar que no exista un contrato para esta oferta
    const contratoExistente = await prisma.contratos.findFirst({
      where: { oferta_id: ofertaIdSanitizado }
    });

    if (contratoExistente) {
      throw new ValidationError('Ya existe un contrato para esta oferta');
    }

    // NUEVO: Validar plan de pagos basado en la fecha del evento
    if (oferta.fecha_evento) {
      const fechaEvento = new Date(oferta.fecha_evento);
      const fechaActual = new Date();

      // Calcular meses hasta el evento
      const mesesHastaEvento = Math.floor(
        (fechaEvento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      // Si el evento es en 1 mes o menos, solo permitir pago único
      if (mesesHastaEvento <= 1 && tipo_pago !== 'unico') {
        throw new ValidationError(
          `El evento es en ${mesesHastaEvento <= 0 ? 'menos de 1 mes' : '1 mes'}. ` +
          'Solo se permite pago único para eventos tan próximos. ' +
          'Por favor, seleccione la opción de pago único.'
        );
      }

      // Si el evento es en menos meses que los solicitados para financiar
      if ((tipo_pago === 'financiado' || tipo_pago === 'plazos') && mesesFinanciamientoSanitizado > mesesHastaEvento) {
        throw new ValidationError(
          `No se puede financiar en ${mesesFinanciamientoSanitizado} meses cuando el evento es en ${mesesHastaEvento} ${mesesHastaEvento === 1 ? 'mes' : 'meses'}. ` +
          `El máximo de meses permitido es ${mesesHastaEvento}.`
        );
      }
    }

    // NUEVO: Validar que existe un pago de reserva de $500 antes de crear el contrato
    if (!pago_reserva_id) {
      throw new ValidationError('Se requiere un pago de reserva de $500 para crear el contrato. Por favor, registre el pago primero y proporcione el ID del pago.');
    }

    // Validar que el pago existe, es de al menos $500, no tiene contrato_id, y es del vendedor correcto
    const pagoReserva = await prisma.pagos.findUnique({
      where: { id: parseInt(pago_reserva_id) }
    });

    if (!pagoReserva) {
      throw new NotFoundError('Pago de reserva no encontrado');
    }

    if (pagoReserva.contrato_id) {
      throw new ValidationError('Este pago ya está vinculado a otro contrato');
    }

    // Verificar que el pago pertenece al vendedor de la oferta
    // Comparar usuario_id (nuevo) o registrado_por/vendedor_id (compatibilidad)
    const pagoPerteneceAlVendedor = 
      (pagoReserva.usuario_id && pagoReserva.usuario_id === oferta.usuario_id) ||
      (pagoReserva.registrado_por && pagoReserva.registrado_por === oferta.vendedor_id) ||
      (pagoReserva.usuario_id && pagoReserva.usuario_id === oferta.vendedor_id) ||
      (pagoReserva.registrado_por && pagoReserva.registrado_por === oferta.usuario_id);

    if (!pagoPerteneceAlVendedor) {
      throw new ValidationError('El pago de reserva no pertenece al vendedor de esta oferta');
    }

    const montoReserva = parseFloat(pagoReserva.monto_total || 0);
    if (montoReserva < 500) {
      throw new ValidationError('El pago de reserva debe ser de al menos $500');
    }

    // NUEVO: Validar disponibilidad del salón antes de crear el contrato
    // Verificar que no haya conflictos con otros contratos u ofertas aceptadas en el mismo horario
    if (oferta.salon_id) {
      // Normalizar fecha de evento para comparación exacta (solo fecha, sin hora)
      const fechaEventoStr = oferta.fecha_evento instanceof Date 
        ? oferta.fecha_evento.toISOString().split('T')[0]
        : oferta.fecha_evento.includes('T') 
          ? oferta.fecha_evento.split('T')[0]
          : oferta.fecha_evento;
      
      const fechaEvento = new Date(fechaEventoStr + 'T00:00:00');
      const fechaInicio = new Date(fechaEvento);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaEvento);
      fechaFin.setHours(23, 59, 59, 999);

      // Función helper para convertir hora a minutos
      const toMinutes = (hora) => {
        const horaStr = typeof hora === 'string' 
          ? hora.slice(0, 5)
          : hora.toTimeString().slice(0, 5);
        const [h, m] = horaStr.split(':').map(Number);
        return h * 60 + m;
      };

      // Verificar conflictos con contratos existentes - SOLO en la misma fecha exacta
      const contratosConflictivos = await prisma.contratos.findMany({
        where: {
          salon_id: oferta.salon_id,
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          },
          estado: {
            in: ['activo', 'completado']
          },
          id: { not: contratoExistente?.id || -1 } // Excluir el contrato actual si existe
        },
        select: {
          id: true,
          codigo_contrato: true,
          fecha_evento: true,
          hora_inicio: true,
          hora_fin: true,
          clientes: {
            select: {
              nombre_completo: true
            }
          }
        }
      });

      // Filtrar solo contratos que están en la misma fecha exacta (comparación de fecha sin hora)
      const contratosMismaFecha = contratosConflictivos.filter(contrato => {
        const fechaContratoStr = contrato.fecha_evento instanceof Date
          ? contrato.fecha_evento.toISOString().split('T')[0]
          : contrato.fecha_evento.includes('T')
            ? contrato.fecha_evento.split('T')[0]
            : contrato.fecha_evento;
        return fechaContratoStr === fechaEventoStr;
      });

      // Verificar conflictos con ofertas aceptadas (que aún no tienen contrato) - SOLO en la misma fecha exacta
      const ofertasConflictivas = await prisma.ofertas.findMany({
        where: {
          salon_id: oferta.salon_id,
          fecha_evento: {
            gte: fechaInicio,
            lte: fechaFin
          },
          estado: 'aceptada',
          id: { not: ofertaIdSanitizado } // Excluir la oferta actual
        },
        select: {
          id: true,
          codigo_oferta: true,
          fecha_evento: true,
          hora_inicio: true,
          hora_fin: true,
          clientes: {
            select: {
              nombre_completo: true
            }
          }
        }
      });

      // Filtrar solo ofertas que están en la misma fecha exacta (comparación de fecha sin hora)
      const ofertasMismaFecha = ofertasConflictivas.filter(ofertaConflictiva => {
        const fechaOfertaStr = ofertaConflictiva.fecha_evento instanceof Date
          ? ofertaConflictiva.fecha_evento.toISOString().split('T')[0]
          : ofertaConflictiva.fecha_evento.includes('T')
            ? ofertaConflictiva.fecha_evento.split('T')[0]
            : ofertaConflictiva.fecha_evento;
        return fechaOfertaStr === fechaEventoStr;
      });

      // Verificar si hay solapamiento de horarios
      const horaInicioOferta = toMinutes(oferta.hora_inicio);
      const horaFinOferta = toMinutes(oferta.hora_fin);
      const finAjustadoOferta = horaFinOferta < horaInicioOferta ? horaFinOferta + 1440 : horaFinOferta;
      const bufferMinutos = 60; // 1 hora de buffer

      // Verificar conflictos con contratos (solo los que están en la misma fecha)
      for (const contrato of contratosMismaFecha) {
        const inicioContrato = toMinutes(contrato.hora_inicio);
        const finContrato = toMinutes(contrato.hora_fin);
        const finAjustadoContrato = finContrato < inicioContrato ? finContrato + 1440 : finContrato;

        // Verificar solapamiento (con buffer)
        const haySolapamiento = 
          (horaInicioOferta < finAjustadoContrato + bufferMinutos && finAjustadoOferta + bufferMinutos > inicioContrato) ||
          (inicioContrato < finAjustadoOferta + bufferMinutos && finAjustadoContrato + bufferMinutos > horaInicioOferta);

        if (haySolapamiento) {
          throw new ValidationError(
            `El salón no está disponible en este horario. Ya existe un contrato (${contrato.codigo_contrato}) ` +
            `para ${contrato.clientes?.nombre_completo || 'cliente'} en el mismo horario.`
          );
        }
      }

      // Verificar conflictos con ofertas aceptadas (solo las que están en la misma fecha)
      for (const ofertaConflictiva of ofertasMismaFecha) {
        const inicioOfertaConflictiva = toMinutes(ofertaConflictiva.hora_inicio);
        const finOfertaConflictiva = toMinutes(ofertaConflictiva.hora_fin);
        const finAjustadoOfertaConflictiva = finOfertaConflictiva < inicioOfertaConflictiva ? finOfertaConflictiva + 1440 : finOfertaConflictiva;

        // Verificar solapamiento (con buffer)
        const haySolapamiento = 
          (horaInicioOferta < finAjustadoOfertaConflictiva + bufferMinutos && finAjustadoOferta + bufferMinutos > inicioOfertaConflictiva) ||
          (inicioOfertaConflictiva < finAjustadoOferta + bufferMinutos && finAjustadoOfertaConflictiva + bufferMinutos > horaInicioOferta);

        if (haySolapamiento) {
          throw new ValidationError(
            `El salón no está disponible en este horario. Ya existe una oferta aceptada (${ofertaConflictiva.codigo_oferta}) ` +
            `para ${ofertaConflictiva.clientes?.nombre_completo || 'cliente'} en el mismo horario.`
          );
        }
      }
    }

    // La fecha de creación del contrato será la fecha del pago de reserva
    const fechaCreacionContrato = new Date(pagoReserva.fecha_pago);

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
        mesesFinanciamientoSanitizado
      );
      pago_mensual = financiamiento.pagoMensual;
    }

    // Calcular comisiones del vendedor (3% total, dividido en dos mitades de 1.5%)
    const totalContrato = parseFloat(oferta.total_final);
    const porcentajeComision = 3; // 3% total
    const comisionTotal = (totalContrato * porcentajeComision) / 100;
    const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
    const comisionSegundaMitad = (totalContrato * 1.5) / 100;

    // Mantener comision_calculada para compatibilidad (deprecated)
    const comision = calcularComisionVendedor(
      totalContrato,
      porcentajeComision
    );

    // Crear contrato en transacción
    const contrato = await prisma.$transaction(async (prisma) => {
      // CRÍTICO: Asegurar que usuario_id siempre se asigne correctamente
      // Priorizar oferta.usuario_id, luego req.user.id, luego oferta.vendedor_id
      const usuarioIdFinal = oferta.usuario_id || req.user.id || oferta.vendedor_id;
      
      // Crear contrato
      const nuevoContrato = await prisma.contratos.create({
        data: {
          codigo_contrato,
          oferta_id: oferta.id,
          cliente_id: oferta.cliente_id,
          usuario_id: usuarioIdFinal, // CRÍTICO: Siempre asignar usuario_id
          vendedor_id: oferta.vendedor_id || null, // Mantener para compatibilidad (solo si existe en vendedores)
          paquete_id: oferta.paquete_id,
          salon_id: oferta.salon_id || null,
          lugar_salon: oferta.lugar_salon || null,
          fecha_evento: oferta.fecha_evento,
          hora_inicio: oferta.hora_inicio,
          hora_fin: oferta.hora_fin,
          cantidad_invitados: oferta.cantidad_invitados,
          total_contrato: totalContrato,
          tipo_pago,
          meses_financiamiento: mesesFinanciamientoSanitizado,
          pago_mensual,
          plan_pagos: plan_pagos || null,
          // El saldo pendiente es el total menos el pago de reserva
          total_pagado: montoReserva,
          saldo_pendiente: totalContrato - montoReserva,
          codigo_acceso_cliente: codigo_acceso_temp,
          fecha_creacion_contrato: fechaCreacionContrato, // Fecha del primer pago de $500
          comision_calculada: comision.comision, // Deprecated: mantener para compatibilidad
          comision_total_calculada: parseFloat(comisionTotal.toFixed(2)),
          comision_primera_mitad: parseFloat(comisionPrimeraMitad.toFixed(2)),
          comision_segunda_mitad: parseFloat(comisionSegundaMitad.toFixed(2)),
          comision_primera_mitad_pagada: false,
          comision_segunda_mitad_pagada: false,
          homenajeado: oferta.homenajeado || null
        }
      });

      // Vincular el pago de reserva al contrato
      await prisma.pagos.update({
        where: { id: parseInt(pago_reserva_id) },
        data: { contrato_id: nuevoContrato.id }
      });

      // Copiar servicios de la oferta al contrato
      // CRÍTICO: Obtener servicios con información del nombre para poder filtrar
      const serviciosPaquete = await prisma.paquetes_servicios.findMany({
        where: { paquete_id: oferta.paquete_id },
        include: {
          servicios: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      // Obtener selecciones de Photobooth y Sidra/Champaña de la oferta
      const seleccionPhotobooth = oferta.photobooth_tipo || null;
      const seleccionSidraChampana = oferta.seleccion_sidra_champana || null;

      // Filtrar servicios del paquete basándose en las selecciones
      const serviciosPaqueteFiltrados = serviciosPaquete.filter(ps => {
        const nombreServicio = (ps.servicios?.nombre || '').toLowerCase();
        
        // Filtrar Photobooth: solo incluir el seleccionado
        if (seleccionPhotobooth) {
          const esPhotobooth360 = nombreServicio.includes('photobooth 360') || nombreServicio.includes('cabina 360') || 
                                  (nombreServicio.includes('360') && (nombreServicio.includes('photobooth') || nombreServicio.includes('cabina')));
          const esPhotoboothPrint = nombreServicio.includes('photobooth print') || 
                                   (nombreServicio.includes('photobooth') && (nombreServicio.includes('print') || nombreServicio.includes('impresión') || nombreServicio.includes('impresion'))) || 
                                   (nombreServicio.includes('cabina') && (nombreServicio.includes('impresión') || nombreServicio.includes('impresion')));
          
          if (esPhotobooth360 || esPhotoboothPrint) {
            const seleccionNormalizada = String(seleccionPhotobooth).toLowerCase();
            const esSeleccion360 = seleccionNormalizada.includes('360');
            const esSeleccionPrint = seleccionNormalizada.includes('print') || seleccionNormalizada.includes('impresión') || seleccionNormalizada.includes('impresion');
            
            // Si es Photobooth 360 pero se seleccionó Print, excluir
            if (esPhotobooth360 && esSeleccionPrint) {
              return false;
            }
            // Si es Photobooth Print pero se seleccionó 360, excluir
            if (esPhotoboothPrint && esSeleccion360) {
              return false;
            }
          }
        }
        
        // Filtrar Sidra/Champaña: solo incluir el seleccionado
        if (seleccionSidraChampana) {
          const esSidra = nombreServicio.includes('sidra') || nombreServicio.includes('cider');
          const esChampana = nombreServicio.includes('champaña') || nombreServicio.includes('champagne');
          
          // Si es Sidra pero se seleccionó Champaña, excluir
          if (esSidra && seleccionSidraChampana === 'Champaña') {
            return false;
          }
          // Si es Champaña pero se seleccionó Sidra, excluir
          if (esChampana && seleccionSidraChampana === 'Sidra') {
            return false;
          }
        }
        
        return true;
      });

      // Servicios incluidos en el paquete (ya filtrados)
      for (const ps of serviciosPaqueteFiltrados) {
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
      // Usar tipo_evento de la oferta (específico de esta oferta) en lugar del tipo_evento del cliente
      const tipoEventoOferta = oferta.tipo_evento || oferta.clientes?.tipo_evento || 'Evento';
      await prisma.eventos.create({
        data: {
          contrato_id: nuevoContrato.id,
          cliente_id: oferta.cliente_id,
          nombre_evento: nombre_evento || `${tipoEventoOferta} - ${oferta.clientes.nombre_completo}`,
          fecha_evento: oferta.fecha_evento,
          hora_inicio: oferta.hora_inicio,
          hora_fin: oferta.hora_fin,
          cantidad_invitados_confirmados: oferta.cantidad_invitados,
          estado: 'en_proceso'
        }
      });

      // CRÍTICO: Marcar oferta como aceptada DENTRO de la transacción
      // Si algo falla después de esto, el rollback revertirá el estado
      await prisma.ofertas.update({
        where: { id: oferta.id },
        data: {
          estado: 'aceptada',
          fecha_respuesta: new Date()
        }
      });

      return nuevoContrato;
    });

    // Crear evento en Google Calendar si el vendedor tiene Google Calendar habilitado
    try {
      const { crearEventoContrato } = require('../utils/googleCalendarService');
      const eventoGoogleCalendar = await crearEventoContrato(oferta.vendedor_id, {
        codigoContrato: codigo_contrato,
        nombreCliente: oferta.clientes.nombre_completo,
        tipoEvento: oferta.tipo_evento || oferta.clientes?.tipo_evento || 'Evento',
        homenajeado: oferta.homenajeado || null,
        fechaEvento: oferta.fecha_evento,
        horaInicio: oferta.hora_inicio,
        horaFin: oferta.hora_fin,
        ubicacion: oferta.lugar_salon || oferta.salones?.nombre || null,
        cantidadInvitados: oferta.cantidad_invitados,
        paquete: oferta.paquetes?.nombre || null
      });

      if (eventoGoogleCalendar) {
        logger.info(`✅ Evento de contrato ${codigo_contrato} agregado a Google Calendar: ${eventoGoogleCalendar.id}`);
      }
    } catch (error) {
      // No fallar la creación del contrato si falla Google Calendar
      logger.error(`⚠️ Error al agregar evento a Google Calendar (no crítico):`, error);
    }

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
      select: { cliente_id: true, usuario_id: true, vendedor_id: true }
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

    // Obtener información de usuarios vendedores si hay registrado_por - Optimizado: evitar N+1 queries
    const vendedoresIds = [...new Set(pagos.filter(p => p.registrado_por).map(p => p.registrado_por))];
    const vendedores = await prisma.usuarios.findMany({
      where: { 
        id: { in: vendedoresIds },
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true
      }
    });
    const vendedoresMap = new Map(vendedores.map(v => [v.id, { ...v, codigo_vendedor: v.codigo_usuario }]));
    
    const pagosConVendedor = pagos.map(pago => ({
      ...pago,
      vendedor: pago.registrado_por ? vendedoresMap.get(pago.registrado_por) || null : null
    }));

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

    // Verificar que el contrato existe y el usuario tiene acceso
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: { cliente_id: true, usuario_id: true, vendedor_id: true }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      throw new ValidationError('No tienes acceso a este contrato');
    }
    
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

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

    // Verificar que el contrato esté activo
    if (contrato.estado !== 'activo') {
      throw new ValidationError('El contrato no está activo');
    }

    // CRÍTICO: Validar que el código no haya expirado
    // El código expira 30 días después de la fecha del evento
    if (contrato.fecha_evento) {
      const fechaEvento = new Date(contrato.fecha_evento);
      const fechaActual = new Date();
      const diasDespuesEvento = 30; // Días de gracia después del evento
      
      // Calcular fecha de expiración (30 días después del evento)
      const fechaExpiracion = new Date(fechaEvento);
      fechaExpiracion.setDate(fechaExpiracion.getDate() + diasDespuesEvento);
      
      if (fechaActual > fechaExpiracion) {
        throw new ValidationError(
          `El código de acceso ha expirado. El evento fue el ${fechaEvento.toLocaleDateString('es-ES')} y el código expiró el ${fechaExpiracion.toLocaleDateString('es-ES')}. Por favor, contacta a tu vendedor para obtener un nuevo código.`
        );
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
 * @route   GET /api/contratos/:id/pdf-contrato
 * @desc    Descargar PDF del contrato completo con términos y condiciones
 * @access  Private (Vendedor o Cliente propietario)
 */
router.get('/:id/pdf-contrato', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || 'es'; // Idioma: 'es' o 'en', por defecto español

    // Obtener contrato con todas las relaciones necesarias
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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
          select: {
            id: true,
            tipo_evento: true,
            codigo_oferta: true,
            precio_paquete_base: true,
            precio_base_ajustado: true,
            ajuste_temporada: true,
            ajuste_temporada_custom: true,
            subtotal_servicios: true,
            descuento: true,
            impuesto_porcentaje: true,
            impuesto_monto: true,
            tarifa_servicio_porcentaje: true,
            tarifa_servicio_monto: true,
            total_final: true,
            photobooth_tipo: true,
            seleccion_sidra_champana: true,
            temporadas: {
              select: {
                id: true,
                nombre: true,
                meses: true,
                ajuste_precio: true
              }
            }
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
    
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Generar PDF usando HTML + Puppeteer con el idioma seleccionado
    const { generarContratoHTML } = require('../utils/pdfContratoHTML');
    const pdfBuffer = await generarContratoHTML(contrato, lang);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Contrato-${contrato.codigo_contrato}.pdf`);

    // Enviar el PDF
    res.send(pdfBuffer);

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
    const lang = req.query.lang || 'es'; // Idioma: 'es' o 'en', por defecto español

    // Obtener contrato con todas las relaciones necesarias
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      include: {
        clientes: true,
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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
    
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes acceso a este contrato');
    }

    // Generar PDF usando HTML + Puppeteer
    const pdfBuffer = await generarFacturaProformaHTML(contrato, 'contrato');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Factura-${contrato.codigo_contrato}.pdf`);

    // Enviar el PDF
    res.send(pdfBuffer);

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
        usuario_id: true,
        vendedor_id: true,
        cliente_id: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
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

    // Obtener información de usuarios vendedores si hay modificado_por - Optimizado: evitar N+1 queries
    const vendedoresIds = [...new Set(historial.filter(h => h.modificado_por).map(h => h.modificado_por))];
    const vendedores = await prisma.usuarios.findMany({
      where: { 
        id: { in: vendedoresIds },
        rol: 'vendedor'
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
      }
    });
    const vendedoresMap = new Map(vendedores.map(v => [v.id, { ...v, codigo_vendedor: v.codigo_usuario }]));
    
    const historialConVendedor = historial.map(item => ({
      ...item,
      vendedor: item.modificado_por ? vendedoresMap.get(item.modificado_por) || null : null
    }));

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
        usuario_id: true,
        vendedor_id: true,
        cliente_id: true,
        codigo_contrato: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
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
        usuarios: {
          select: {
            nombre_completo: true,
            codigo_usuario: true,
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

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if (!(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
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

    // Crear la nueva versión en transacción (aunque solo es un INSERT, es buena práctica)
    const nuevaVersion = await prisma.$transaction(async (tx) => {
      return await tx.versiones_contratos_pdf.create({
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
          usuarios: {
            select: {
              nombre_completo: true,
              codigo_usuario: true,
            },
          },
        },
      });
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
    const lang = req.query.lang || 'es'; // Idioma: 'es' o 'en', por defecto español

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        usuario_id: true,
        vendedor_id: true,
        cliente_id: true,
        codigo_contrato: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar permisos
    if (req.user.tipo === 'vendedor' && !(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
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
        usuarios: true,
        paquetes: true,
        ofertas: {
          select: {
            id: true,
            tipo_evento: true,
            codigo_oferta: true,
            temporadas: {
              select: {
                id: true,
                nombre: true,
                meses: true,
                ajuste_precio: true
              }
            }
          }
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

/**
 * @route   PUT /api/contratos/:id/notas
 * @desc    Actualizar notas del vendedor en un contrato
 * @access  Private (Vendedor propietario del contrato)
 */
router.put('/:id/notas', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notas_vendedor } = req.body;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        vendedor_id: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que el vendedor es el propietario del contrato
    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if (!(contrato.usuario_id === req.user.id || contrato.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes permiso para actualizar las notas de este contrato');
    }

    // Actualizar las notas
    const contratoActualizado = await prisma.contratos.update({
      where: { id: parseInt(id) },
      data: {
        notas_vendedor: notas_vendedor || null,
      },
      select: {
        id: true,
        notas_vendedor: true,
      },
    });

    res.json({
      success: true,
      message: 'Notas actualizadas exitosamente',
      contrato: contratoActualizado,
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

