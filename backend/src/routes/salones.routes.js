const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor, requireVendedorOrInventario } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const prisma = getPrismaClient();

// ====================================
// OBTENER TODOS LOS SALONES ACTIVOS
// ====================================
router.get('/', authenticate, requireVendedorOrInventario, async (req, res, next) => {
  try {
    const salones = await prisma.salones.findMany({
      where: { activo: true },
      orderBy: { capacidad_maxima: 'desc' }
    });

    res.json({
      success: true,
      salones
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PAQUETES DISPONIBLES POR SALÓN
// ====================================
router.get('/:salonId/paquetes', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId } = req.params;

    // Obtener información del salón
    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salonId) }
    });

    if (!salon) {
      throw new NotFoundError('Salón no encontrado');
    }

    const paquetes = await prisma.paquetes_salones.findMany({
      where: {
        salon_id: parseInt(salonId),
        disponible: true
      },
      include: {
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        }
      }
    });

    // Formatear respuesta para incluir precio específico del salón
    const paquetesFormateados = paquetes.map(ps => {
      // Si el salón es Kendall, filtrar la Máquina de Chispas de los servicios incluidos
      let serviciosIncluidos = ps.paquetes.paquetes_servicios || [];
      if (salon.nombre === 'Kendall') {
        serviciosIncluidos = serviciosIncluidos.filter(ps_serv => 
          !ps_serv.servicios?.nombre?.toLowerCase().includes('chispas')
        );
      }
      
      return {
        ...ps.paquetes,
        precio_base_salon: ps.precio_base,
        invitados_minimo_salon: ps.invitados_minimo,
        disponible_salon: ps.disponible,
        paquetes_servicios: serviciosIncluidos
      };
    });

    res.json({
      success: true,
      paquetes: paquetesFormateados
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PRECIO DE UN PAQUETE EN UN SALÓN
// ====================================
router.get('/:salonId/paquetes/:paqueteId/precio', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId, paqueteId } = req.params;

    const precioSalon = await prisma.paquetes_salones.findFirst({
      where: {
        salon_id: parseInt(salonId),
        paquete_id: parseInt(paqueteId)
      }
    });

    if (!precioSalon) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no disponible en este salón'
      });
    }

    res.json({
      success: true,
      precio_base: precioSalon.precio_base,
      invitados_minimo: precioSalon.invitados_minimo,
      disponible: precioSalon.disponible
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// VERIFICAR DISPONIBILIDAD DE UN SALÓN
// ====================================
router.post('/disponibilidad', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salon_id, fecha_evento, hora_inicio, hora_fin, excluir_oferta_id } = req.body;

    if (!salon_id || !fecha_evento || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: salon_id, fecha_evento, hora_inicio, hora_fin'
      });
    }

    // Convertir fecha y horas a objetos Date para comparación
    // Usar solo la fecha sin hora para comparación exacta (evitar problemas de zona horaria)
    const fechaEventoStr = fecha_evento.includes('T') ? fecha_evento.split('T')[0] : fecha_evento;
    const fechaEvento = new Date(fechaEventoStr + 'T00:00:00');
    
    // Crear rango de fecha para comparación (desde inicio del día hasta fin del día)
    const fechaInicio = new Date(fechaEvento);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaEvento);
    fechaFin.setHours(23, 59, 59, 999);
    
    // Normalizar formato de hora (HH:mm)
    const horaInicioStr = typeof hora_inicio === 'string' 
      ? hora_inicio.length === 5 ? hora_inicio : hora_inicio.slice(0, 5)
      : hora_inicio.toTimeString().slice(0, 5);
    const horaFinStr = typeof hora_fin === 'string'
      ? hora_fin.length === 5 ? hora_fin : hora_fin.slice(0, 5)
      : hora_fin.toTimeString().slice(0, 5);

    // Obtener todos los contratos del salón en esa fecha (usando rango para asegurar comparación correcta)
    const todosContratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salon_id),
        fecha_evento: {
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: {
          in: ['activo', 'completado']
        }
      },
      include: {
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    // Función helper para verificar solapamiento de horarios con buffer de 1 hora
    // El buffer de 1 hora es necesario para cambiar la decoración del salón entre eventos
    const haySolapamiento = (inicio1, fin1, inicio2, fin2) => {
      // Convertir horas a minutos para facilitar comparación
      const toMinutes = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };
      
      const inicio1Min = toMinutes(inicio1);
      const fin1Min = toMinutes(fin1);
      const inicio2Min = toMinutes(inicio2);
      const fin2Min = toMinutes(fin2);
      
      // Manejar eventos que cruzan medianoche
      const fin1Ajustado = fin1Min < inicio1Min ? fin1Min + 1440 : fin1Min;
      const fin2Ajustado = fin2Min < inicio2Min ? fin2Min + 1440 : fin2Min;
      
      // Buffer de 1 hora (60 minutos) entre eventos para cambiar decoración
      const bufferMinutos = 60;
      
      // Verificar solapamiento considerando el buffer:
      // - Si el evento 1 termina, el evento 2 no puede empezar hasta 1 hora después
      // - Si el evento 2 termina, el evento 1 no puede empezar hasta 1 hora después
      // Caso 1: El nuevo evento (inicio1, fin1) se solapa con el existente (inicio2, fin2)
      // - El nuevo evento empieza antes de que termine el existente + buffer
      // - O el nuevo evento termina después de que empiece el existente - buffer
      const fin2ConBuffer = fin2Ajustado + bufferMinutos;
      const inicio2ConBuffer = inicio2Min - bufferMinutos;
      
      return (inicio1Min < fin2ConBuffer && fin1Ajustado > inicio2ConBuffer);
    };

    // Filtrar contratos que se solapan con el horario solicitado
    // Función auxiliar para extraer hora en formato HH:mm de un campo Time de Prisma
    const extraerHora = (hora) => {
      if (typeof hora === 'string') {
        return hora.slice(0, 5);
      } else if (hora instanceof Date) {
        // Para campos Time de Prisma (fecha 1970-01-01), usar UTC para evitar problemas de zona horaria
        // CRÍTICO: Usar getUTCFullYear() porque en UTC-5, getFullYear() puede devolver 1969 para 1970-01-01T00:00:00.000Z
        if (hora.getUTCFullYear() === 1970 && hora.getUTCMonth() === 0 && hora.getUTCDate() === 1) {
          const horas = hora.getUTCHours();
          const minutos = hora.getUTCMinutes();
          return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        } else {
          return hora.toTimeString().slice(0, 5);
        }
      } else {
        return hora.toTimeString().slice(0, 5);
      }
    };

    const contratosOcupados = todosContratos.filter(contrato => {
      const horaInicioContrato = extraerHora(contrato.hora_inicio);
      const horaFinContrato = extraerHora(contrato.hora_fin);
      
      return haySolapamiento(horaInicioStr, horaFinStr, horaInicioContrato, horaFinContrato);
    });

    // Obtener todas las ofertas aceptadas del salón en esa fecha
    // Si se proporciona excluir_oferta_id, excluir esa oferta (útil al editar)
    const whereClause = {
      salon_id: parseInt(salon_id),
      fecha_evento: {
        gte: fechaInicio,
        lte: fechaFin
      },
      estado: 'aceptada'
    };
    
    if (excluir_oferta_id) {
      whereClause.id = { not: parseInt(excluir_oferta_id) };
    }
    
    const todasOfertas = await prisma.ofertas.findMany({
      where: whereClause,
      include: {
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    // Filtrar ofertas que se solapan con el horario solicitado
    const ofertasOcupadas = todasOfertas.filter(oferta => {
      const horaInicioOferta = extraerHora(oferta.hora_inicio);
      const horaFinOferta = extraerHora(oferta.hora_fin);
      
      return haySolapamiento(horaInicioStr, horaFinStr, horaInicioOferta, horaFinOferta);
    });

    // Verificar disponibilidad en Google Calendar (sin mostrar detalles)
    let googleCalendarOcupado = false;
    try {
      const { verificarDisponibilidad } = require('../utils/googleCalendarService');
      const vendedorId = req.user.id;
      
      // Crear fechas completas con hora para verificar en Google Calendar
      const fechaInicioCompleta = new Date(fechaEvento);
      const [horaInicioH, horaInicioM] = horaInicioStr.split(':').map(Number);
      fechaInicioCompleta.setHours(horaInicioH, horaInicioM, 0, 0);
      
      const fechaFinCompleta = new Date(fechaEvento);
      const [horaFinH, horaFinM] = horaFinStr.split(':').map(Number);
      fechaFinCompleta.setHours(horaFinH, horaFinM, 0, 0);
      
      // Si la hora de fin es menor que la de inicio, asumir que cruza medianoche
      if (fechaFinCompleta < fechaInicioCompleta) {
        fechaFinCompleta.setDate(fechaFinCompleta.getDate() + 1);
      }
      
      googleCalendarOcupado = await verificarDisponibilidad(vendedorId, fechaInicioCompleta, fechaFinCompleta);
    } catch (error) {
      logger.warn('Error al verificar disponibilidad en Google Calendar:', error);
      // Continuar sin considerar Google Calendar si hay error
    }

    const disponible = contratosOcupados.length === 0 && ofertasOcupadas.length === 0 && !googleCalendarOcupado;

    res.json({
      success: true,
      disponible,
      conflictos: {
        contratos: contratosOcupados.map(c => ({
          codigo: c.codigo_contrato,
          cliente: c.clientes?.nombre_completo,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin
        })),
        ofertas: ofertasOcupadas.map(o => ({
          codigo: o.codigo_oferta,
          cliente: o.clientes?.nombre_completo,
          hora_inicio: o.hora_inicio,
          hora_fin: o.hora_fin
        })),
        google_calendar: googleCalendarOcupado ? [{ ocupado: true }] : [] // Solo indicar que está ocupado, sin detalles
      }
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER HORARIOS OCUPADOS DE UN SALÓN EN UNA FECHA
// ====================================
router.get('/horarios-ocupados', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salon_id, fecha_evento, excluir_oferta_id } = req.query;

    if (!salon_id || !fecha_evento) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: salon_id, fecha_evento'
      });
    }

    // Convertir fecha a objeto Date
    const fechaEventoStr = fecha_evento.includes('T') ? fecha_evento.split('T')[0] : fecha_evento;
    const fechaEvento = new Date(fechaEventoStr + 'T00:00:00');
    
    // Crear rango de fecha para comparación
    const fechaInicio = new Date(fechaEvento);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaEvento);
    fechaFin.setHours(23, 59, 59, 999);

    // Obtener todos los contratos del salón en esa fecha
    const todosContratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salon_id),
        fecha_evento: {
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: {
          in: ['activo', 'completado']
        }
      },
      select: {
        hora_inicio: true,
        hora_fin: true
      }
    });

    // Obtener todas las ofertas aceptadas del salón en esa fecha
    const whereClause = {
      salon_id: parseInt(salon_id),
      fecha_evento: {
        gte: fechaInicio,
        lte: fechaFin
      },
      estado: 'aceptada'
    };
    
    if (excluir_oferta_id) {
      whereClause.id = { not: parseInt(excluir_oferta_id) };
    }
    
    const todasOfertas = await prisma.ofertas.findMany({
      where: whereClause,
      select: {
        hora_inicio: true,
        hora_fin: true
      }
    });

    // Función para convertir hora a minutos desde medianoche
    const toMinutes = (hora) => {
      let horaStr;
      if (typeof hora === 'string') {
        horaStr = hora.slice(0, 5);
      } else if (hora instanceof Date) {
        // Para campos Time de Prisma (fecha 1970-01-01), usar UTC para evitar problemas de zona horaria
        if (hora.getFullYear() === 1970 && hora.getMonth() === 0 && hora.getDate() === 1) {
          const horas = hora.getUTCHours();
          const minutos = hora.getUTCMinutes();
          horaStr = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        } else {
          horaStr = hora.toTimeString().slice(0, 5);
        }
      } else {
        horaStr = hora.toTimeString().slice(0, 5);
      }
      const [h, m] = horaStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Función para convertir minutos a hora (HH:mm)
    const toHora = (minutos) => {
      const h = Math.floor(minutos / 60) % 24;
      const m = minutos % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Obtener todos los rangos ocupados - SOLO las horas exactas del evento, sin buffers
    const rangosOcupados = [];

    // Función para procesar un evento (contrato u oferta)
    const procesarEvento = (horaInicio, horaFin) => {
      const inicioMin = toMinutes(horaInicio);
      const finMin = toMinutes(horaFin);
      
      // Determinar si cruza medianoche
      const cruzaMedianoche = finMin < inicioMin;
      
      if (cruzaMedianoche) {
        // Evento cruza medianoche (ej: 8 PM a 12 AM)
        // Solo ocupamos desde inicio hasta 23:59 del mismo día (NO el día siguiente)
        const inicioMinAjustado = Math.max(0, inicioMin);
        const finMinAjustado = 1439; // 23:59 del mismo día
        
        rangosOcupados.push({
          inicio: inicioMinAjustado,
          fin: finMinAjustado,
          inicioHora: toHora(inicioMinAjustado),
          finHora: toHora(finMinAjustado)
        });
      } else {
        // Evento NO cruza medianoche (ej: 12 PM a 4 PM)
        // Solo ocupamos las horas exactas del evento
        const inicioMinAjustado = Math.max(0, inicioMin);
        const finMinAjustado = Math.min(1439, finMin);
        
        rangosOcupados.push({
          inicio: inicioMinAjustado,
          fin: finMinAjustado,
          inicioHora: toHora(inicioMinAjustado),
          finHora: toHora(finMinAjustado)
        });
      }
    };

    // Procesar contratos
    todosContratos.forEach(contrato => {
      procesarEvento(contrato.hora_inicio, contrato.hora_fin);
    });

    // Procesar ofertas
    todasOfertas.forEach(oferta => {
      procesarEvento(oferta.hora_inicio, oferta.hora_fin);
    });

    // Generar lista de horas ocupadas (cada hora completa que esté dentro de un rango)
    const horasOcupadas = new Set();
    
    rangosOcupados.forEach(rango => {
      // Agregar cada hora completa dentro del rango
      // IMPORTANTE: Solo procesar minutos dentro del mismo día (0-1439)
      const inicioMin = Math.max(0, rango.inicio);
      const finMin = Math.min(1439, rango.fin); // Máximo 23:59 del mismo día
      
      for (let min = inicioMin; min <= finMin; min += 60) {
        const hora = Math.floor(min / 60);
        // Asegurar que la hora esté en el rango 0-23
        if (hora >= 0 && hora < 24) {
          horasOcupadas.add(hora);
        }
      }
    });

    res.json({
      success: true,
      horasOcupadas: Array.from(horasOcupadas).sort((a, b) => a - b),
      rangosOcupados: rangosOcupados.map(r => ({
        inicio: r.inicioHora,
        fin: r.finHora
      }))
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER FECHAS OCUPADAS DE UN SALÓN EN UN RANGO
// ====================================
router.get('/:salonId/disponibilidad', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    const fechaDesde = fecha_desde ? new Date(fecha_desde) : new Date();
    const fechaHasta = fecha_hasta ? new Date(fecha_hasta) : new Date();
    fechaHasta.setMonth(fechaHasta.getMonth() + 3); // Por defecto, 3 meses adelante

    // Obtener contratos activos/completados
    const contratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salonId),
        fecha_evento: {
          gte: fechaDesde,
          lte: fechaHasta
        },
        estado: {
          in: ['activo', 'completado']
        }
      },
      select: {
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        codigo_contrato: true,
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    // Obtener ofertas aceptadas
    const ofertas = await prisma.ofertas.findMany({
      where: {
        salon_id: parseInt(salonId),
        fecha_evento: {
          gte: fechaDesde,
          lte: fechaHasta
        },
        estado: 'aceptada'
      },
      select: {
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        codigo_oferta: true,
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    res.json({
      success: true,
      ocupaciones: {
        contratos: contratos.map(c => ({
          fecha: c.fecha_evento,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          codigo: c.codigo_contrato,
          cliente: c.clientes?.nombre_completo
        })),
        ofertas: ofertas.map(o => ({
          fecha: o.fecha_evento,
          hora_inicio: o.hora_inicio,
          hora_fin: o.hora_fin,
          codigo: o.codigo_oferta,
          cliente: o.clientes?.nombre_completo
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;




