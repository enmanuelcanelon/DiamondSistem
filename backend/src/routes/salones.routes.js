const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor, requireVendedorOrInventario } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');
const { obtenerEventosTodosVendedores } = require('../utils/googleCalendarService');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

// Debug logging solo en desarrollo
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(args.join(' '));
  }
};

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
    
    // Normalizar formato de hora (HH:mm)
    const horaInicioStr = typeof hora_inicio === 'string' 
      ? hora_inicio.length === 5 ? hora_inicio : hora_inicio.slice(0, 5)
      : hora_inicio.toTimeString().slice(0, 5);
    const horaFinStr = typeof hora_fin === 'string'
      ? hora_fin.length === 5 ? hora_fin : hora_fin.slice(0, 5)
      : hora_fin.toTimeString().slice(0, 5);

    // Obtener todos los contratos del salón - usar comparación de fecha exacta
    // Primero obtener todos los contratos del salón y luego filtrar por fecha exacta
    const todosContratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salon_id),
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

    // Función helper para extraer fecha sin problemas de zona horaria
    // CRÍTICO: PostgreSQL DATE se almacena SIN zona horaria (solo YYYY-MM-DD)
    // Prisma devuelve campos DATE como Date objects con hora 00:00:00 en UTC
    // Por lo tanto, debemos usar métodos UTC para extraer la fecha correctamente
    const extraerFechaStr = (fecha) => {
      if (!fecha) return '';
      if (fecha instanceof Date) {
        // IMPORTANTE: Usar métodos UTC para campos DATE de PostgreSQL
        // ya que se almacenan sin zona horaria y Prisma los interpreta como UTC
        const año = fecha.getUTCFullYear();
        const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getUTCDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      } else if (typeof fecha === 'string') {
        // Si es string, extraer solo la parte de fecha
        return fecha.includes('T') ? fecha.split('T')[0] : fecha;
      }
      return '';
    };

    // Filtrar contratos que están en la misma fecha exacta (comparación de fecha sin hora)
    const contratosMismaFecha = todosContratos.filter(contrato => {
      const fechaContratoStr = extraerFechaStr(contrato.fecha_evento);
      return fechaContratoStr === fechaEventoStr;
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
    // IMPORTANTE: Esta función debe manejar correctamente campos Time de Prisma
    // Los campos Time se guardan como Date con fecha 1970-01-01 y hora en formato UTC
    const extraerHora = (hora) => {
      if (typeof hora === 'string') {
        // Si es string, asumir formato HH:mm o HH:mm:ss
        return hora.slice(0, 5);
      } else if (hora instanceof Date) {
        // Para campos Time de Prisma (fecha 1970-01-01)
        // Pueden estar guardados de dos formas:
        // 1. Eventos antiguos: con Z (UTC) - ej: "1970-01-01T18:00:00Z"
        // 2. Eventos nuevos: sin Z (hora local) - ej: "1970-01-01T18:00:00"
        if (hora.getUTCFullYear() === 1970 && hora.getUTCMonth() === 0 && hora.getUTCDate() === 1) {
          // IMPORTANTE: PostgreSQL TIME se almacena sin zona horaria
          // Prisma siempre devuelve campos Time como UTC (1970-01-01TXX:XX:XXZ)
          // Por lo tanto, SIEMPRE usar getUTCHours() para campos Time de Prisma
          const horas = hora.getUTCHours();
          const minutos = hora.getUTCMinutes();
          return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        } else {
          // Para otros tipos de Date, usar hora local
          return hora.toTimeString().slice(0, 5);
        }
      } else {
        return hora.toTimeString().slice(0, 5);
      }
    };

    // Filtrar solo los contratos que están en la misma fecha y tienen solapamiento de horarios
    const contratosOcupados = contratosMismaFecha.filter(contrato => {
      const horaInicioContrato = extraerHora(contrato.hora_inicio);
      const horaFinContrato = extraerHora(contrato.hora_fin);
      
      return haySolapamiento(horaInicioStr, horaFinStr, horaInicioContrato, horaFinContrato);
    });

    // IMPORTANTE: Las ofertas NO bloquean horas - solo los contratos bloquean horas
    // Una oferta es solo una propuesta, no un evento confirmado
    // Solo cuando se convierte en contrato es que bloquea el horario
    // Por lo tanto, NO verificamos ofertas aquí
    const ofertasOcupadas = [];

    // Verificar disponibilidad en Google Calendar (sin mostrar detalles)
    let googleCalendarOcupado = false;
    try {
      const { verificarDisponibilidad } = require('../utils/googleCalendarService');
      const vendedorId = req.user.id;
      
      // Crear fechas completas con hora para verificar en Google Calendar
      // Usar la fecha normalizada para evitar problemas de zona horaria
      const fechaEventoDate = new Date(fechaEventoStr + 'T00:00:00');
      const fechaInicioCompleta = new Date(fechaEventoDate);
      const [horaInicioH, horaInicioM] = horaInicioStr.split(':').map(Number);
      fechaInicioCompleta.setHours(horaInicioH, horaInicioM, 0, 0);
      
      const fechaFinCompleta = new Date(fechaEventoDate);
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

    // IMPORTANTE: Solo contratos bloquean horas, no ofertas
    const disponible = contratosOcupados.length === 0 && !googleCalendarOcupado;

    res.json({
      success: true,
      disponible,
      conflictos: {
        contratos: contratosOcupados.map(c => ({
          codigo: c.codigo_contrato,
          cliente: c.clientes?.nombre_completo,
          hora_inicio: extraerHora(c.hora_inicio),
          hora_fin: extraerHora(c.hora_fin),
          fecha_evento: extraerFechaStr(c.fecha_evento)
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
    debugLog('🔍 /horarios-ocupados - salon_id:', salon_id, '| fecha_evento:', fecha_evento);

    if (!salon_id || !fecha_evento) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: salon_id, fecha_evento'
      });
    }

    // Convertir fecha a string normalizado (solo fecha, sin hora)
    const fechaEventoStr = fecha_evento.includes('T') ? fecha_evento.split('T')[0] : fecha_evento;
    
    // Obtener todos los contratos del salón (filtrar por fecha exacta después)
    const todosContratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salon_id),
        estado: {
          in: ['activo', 'completado']
        }
      },
      select: {
        id: true,
        codigo_contrato: true,
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true
      }
    });
    
    // Función helper para extraer fecha sin problemas de zona horaria
    // CRÍTICO: PostgreSQL DATE se almacena SIN zona horaria (solo YYYY-MM-DD)
    // Prisma devuelve campos DATE como Date objects con hora 00:00:00 en UTC
    // Por lo tanto, debemos usar métodos UTC para extraer la fecha correctamente
    const extraerFechaStr = (fecha) => {
      if (!fecha) return '';
      if (fecha instanceof Date) {
        // IMPORTANTE: Usar métodos UTC para campos DATE de PostgreSQL
        // ya que se almacenan sin zona horaria y Prisma los interpreta como UTC
        const año = fecha.getUTCFullYear();
        const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getUTCDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      } else if (typeof fecha === 'string') {
        // Si es string, extraer solo la parte de fecha
        return fecha.includes('T') ? fecha.split('T')[0] : fecha;
      }
      return '';
    };
    
    debugLog('🔍 Consultando horarios ocupados para salón', salon_id, 'en fecha', fechaEventoStr);
    debugLog('📋 Total contratos obtenidos para salón', salon_id, ':', todosContratos.length);
    todosContratos.forEach(c => {
      const fechaStr = extraerFechaStr(c.fecha_evento);
      debugLog(`  - Contrato ${c.codigo_contrato || c.id}: fecha BD=${fechaStr} (raw: ${c.fecha_evento})`);
    });

    // Filtrar contratos que están en la misma fecha exacta
    const contratosMismaFecha = todosContratos.filter(contrato => {
      const fechaContratoStr = extraerFechaStr(contrato.fecha_evento);
      const coincide = fechaContratoStr === fechaEventoStr;
      // Solo loggear si coincide para reducir ruido
      if (coincide) {
        debugLog(`  ✅ Contrato ${contrato.codigo_contrato || contrato.id} COINCIDE: fecha BD=${fechaContratoStr} == fecha consultada=${fechaEventoStr}`);
      }
      return coincide;
    });
    
    debugLog('📅 Contratos en fecha', fechaEventoStr, ':', contratosMismaFecha.length);

    // Obtener todas las ofertas del salón (aceptadas Y pendientes - filtrar por fecha exacta después)
    // IMPORTANTE: Incluir ofertas pendientes porque también bloquean horarios
    const whereClause = {
      salon_id: parseInt(salon_id),
      estado: {
        in: ['aceptada', 'pendiente'] // Incluir ofertas aceptadas y pendientes
      }
    };
    
    if (excluir_oferta_id) {
      whereClause.id = { not: parseInt(excluir_oferta_id) };
    }
    
    debugLog('🔍 Query para obtener ofertas:', JSON.stringify(whereClause, null, 2));
    
    const todasOfertas = await prisma.ofertas.findMany({
      where: whereClause,
      select: {
        id: true,
        codigo_oferta: true,
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        estado: true,
        salon_id: true,
        ofertas_servicios_adicionales: {
          where: {
            servicios: {
              nombre: 'Hora Extra'
            }
          },
          select: {
            cantidad: true,
            servicios: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
    
    debugLog('📋 Total ofertas obtenidas para salón', salon_id, ':', todasOfertas.length);
    if (todasOfertas.length === 0) {
      debugLog('⚠️ No se encontraron ofertas. Verificando si hay ofertas con salon_id diferente o null...');
      // Verificar si hay ofertas pendientes sin salon_id o con salon_id diferente
      const todasOfertasPendientes = await prisma.ofertas.findMany({
        where: {
          estado: 'pendiente'
        },
        select: {
          id: true,
          codigo_oferta: true,
          fecha_evento: true,
          salon_id: true,
          estado: true
        },
        take: 10
      });
      debugLog('📋 Total ofertas pendientes en BD (primeras 10):', todasOfertasPendientes.length);
      todasOfertasPendientes.forEach(o => {
        const fechaStr = extraerFechaStr(o.fecha_evento);
        debugLog(`  - Oferta ${o.codigo_oferta || o.id} (salon_id: ${o.salon_id}): fecha ${fechaStr}`);
      });
    }
    
    todasOfertas.forEach(o => {
      const fechaStr = extraerFechaStr(o.fecha_evento);
      debugLog(`  - Oferta ${o.codigo_oferta || o.id} (${o.estado}, salon_id: ${o.salon_id}): fecha ${fechaStr}`);
    });

    // Filtrar ofertas que están en la misma fecha exacta
    debugLog('🔍 Buscando ofertas para fecha:', fechaEventoStr);
    const ofertasMismaFecha = todasOfertas.filter(oferta => {
      const fechaOfertaStr = extraerFechaStr(oferta.fecha_evento);
      const coincide = fechaOfertaStr === fechaEventoStr;
      if (coincide) {
        debugLog(`  ✅ Oferta ${oferta.codigo_oferta || oferta.id} (${oferta.estado}) coincide con fecha ${fechaEventoStr}`);
      } else {
        debugLog(`  ❌ Oferta ${oferta.codigo_oferta || oferta.id} NO coincide: fecha oferta ${fechaOfertaStr} vs fecha consultada ${fechaEventoStr}`);
      }
      return coincide;
    });
    
    debugLog('📅 Ofertas en fecha', fechaEventoStr, ':', ofertasMismaFecha.length);

    // Obtener el nombre del salón para filtrar eventos de Google Calendar
    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salon_id) },
      select: { nombre: true }
    });

    // Crear rango de fecha para Google Calendar (necesario para la función)
    // IMPORTANTE: Usar zona horaria UTC explícita para evitar problemas de zona horaria del servidor
    // La fecha se interpreta como medianoche en UTC para asegurar consistencia
    const fechaEventoDate = new Date(fechaEventoStr + 'T00:00:00Z');
    const fechaInicio = new Date(fechaEventoDate);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaEventoDate);
    fechaFin.setUTCHours(23, 59, 59, 999);

    // Obtener eventos de Google Calendar del mismo día
    let eventosGoogleCalendar = [];
    try {
      debugLog(`🔍 Buscando eventos en Google Calendar desde ${fechaInicio.toISOString()} hasta ${fechaFin.toISOString()}`);
      const todosEventosCalendar = await obtenerEventosTodosVendedores(fechaInicio, fechaFin);
      debugLog(`📅 Eventos obtenidos de Google Calendar: ${todosEventosCalendar.length}`);
      if (todosEventosCalendar.length > 0) {
        todosEventosCalendar.forEach(e => {
          debugLog(`   - "${e.titulo}" | Ubicación: "${e.ubicacion}" | Inicio: ${e.fecha_inicio}`);
        });
      }

      // Filtrar eventos que coincidan con el salón
      // Función robusta para normalizar y comparar nombres de salón
      const normalizarNombreSalon = (nombre) => {
        if (!nombre) return '';
        return String(nombre)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ') // Normalizar espacios múltiples
          .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales excepto letras, números y espacios
          .replace(/\s+/g, ' ') // Normalizar espacios de nuevo
          .trim();
      };

      const nombreSalon = normalizarNombreSalon(salon?.nombre || '');

      // Logging para debug
      debugLog('🔍 Filtrando eventos de Google Calendar para salón:', salon?.nombre, '(normalizado:', nombreSalon, ')');
      debugLog('📋 Total eventos obtenidos:', todosEventosCalendar.length);

      eventosGoogleCalendar = todosEventosCalendar.filter(evento => {
        // Obtener ubicación del evento
        const ubicacionRaw = evento.ubicacion || '';
        const ubicacion = normalizarNombreSalon(ubicacionRaw);
        
        // Si no hay ubicación, no incluir el evento
        if (!ubicacion || ubicacion.trim() === '') {
          return false;
        }
        
        // Mapeo de variantes comunes de nombres de salón
        const variantesSalones = {
          'kendall': ['kendall', 'kendal', 'kentall'],
          'doral': ['doral'],
          'diamond': ['diamond', 'dmd']
        };
        
        // Función para verificar si dos nombres coinciden (considerando variantes)
        const nombresCoinciden = (nombre1, nombre2) => {
          if (!nombre1 || !nombre2) return false;
          
          // Comparación exacta normalizada
          if (nombre1 === nombre2) return true;
          
          // Verificar si uno contiene al otro
          if (nombre1.includes(nombre2) || nombre2.includes(nombre1)) {
            // Verificar que no sea un falso positivo (ej: "doral" en "diamond at doral")
            // PRIORIDAD: Diamond debe verificarse ANTES que Doral
            if (nombre1.includes('diamond') && nombre2.includes('doral') && !nombre2.includes('diamond')) {
              return false; // "doral" no coincide con "diamond at doral"
            }
            if (nombre2.includes('diamond') && nombre1.includes('doral') && !nombre1.includes('diamond')) {
              return false; // "doral" no coincide con "diamond at doral"
            }
            return true;
          }
          
          // Verificar variantes comunes
          for (const [salonBase, variantes] of Object.entries(variantesSalones)) {
            const nombre1EsVariante = variantes.some(v => nombre1.includes(v));
            const nombre2EsVariante = variantes.some(v => nombre2.includes(v));
            
            if (nombre1EsVariante && nombre2EsVariante) {
              // Ambos son variantes del mismo salón base
              return true;
            }
          }
          
          return false;
        };
        
        const coincide = nombresCoinciden(nombreSalon, ubicacion);
        
        // Logging detallado para debug
        if (todosEventosCalendar.length <= 5 || coincide) {
          debugLog(`  📍 Evento: "${evento.titulo}" | Ubicación raw: "${ubicacionRaw}" | Ubicación normalizada: "${ubicacion}" | Coincide: ${coincide}`);
        }
        
        return coincide;
      });

      debugLog('📅 Google Calendar - Eventos encontrados para', salon?.nombre, ':', eventosGoogleCalendar.length);
      if (eventosGoogleCalendar.length > 0) {
        debugLog('  ✅ Eventos filtrados:');
        eventosGoogleCalendar.forEach(e => {
          debugLog(`    - ${e.titulo} (${e.ubicacion})`);
        });
      }
    } catch (error) {
      logger.warn('⚠️ Error al obtener eventos de Google Calendar:', error.message);
      // Continuar sin eventos de Google Calendar si hay error
    }

    // Función para extraer hora como string (HH:mm) de un campo Time de Prisma
    const extraerHora = (hora) => {
      if (!hora) return '00:00';
      
      if (typeof hora === 'string') {
        return hora.slice(0, 5);
      } else if (hora instanceof Date) {
        if (hora.getUTCFullYear() === 1970 && hora.getUTCMonth() === 0 && hora.getUTCDate() === 1) {
          // IMPORTANTE: PostgreSQL TIME se almacena sin zona horaria
          // Prisma siempre devuelve campos Time como UTC
          // Por lo tanto, SIEMPRE usar getUTCHours() para campos Time de Prisma
          const horas = hora.getUTCHours();
          const minutos = hora.getUTCMinutes();
          return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        } else {
          return hora.toTimeString().slice(0, 5);
        }
      } else {
        return '00:00';
      }
    };

    // Función para convertir hora a minutos desde medianoche
    // IMPORTANTE: Esta función debe manejar correctamente campos Time de Prisma
    // Los campos Time se guardan como Date con fecha 1970-01-01 SIN Z (hora local)
    // Ejemplo: "18:00" se guarda como "1970-01-01T18:00:00" (6 PM hora local)
    const toMinutes = (hora) => {
      let horaStr;
      if (typeof hora === 'string') {
        // Si es string, asumir formato HH:mm o HH:mm:ss
        horaStr = hora.slice(0, 5);
      } else if (hora instanceof Date) {
        // Para campos Time de Prisma (fecha 1970-01-01)
        // Pueden estar guardados de dos formas:
        // 1. Eventos antiguos: con Z (UTC) - ej: "1970-01-01T18:00:00Z"
        // 2. Eventos nuevos: sin Z (hora local) - ej: "1970-01-01T18:00:00"
        // Verificar si es un campo Time de Prisma (fecha 1970-01-01)
        if (hora.getUTCFullYear() === 1970 && hora.getUTCMonth() === 0 && hora.getUTCDate() === 1) {
          // IMPORTANTE: PostgreSQL TIME se almacena sin zona horaria
          // Prisma siempre devuelve campos Time como UTC (1970-01-01TXX:XX:XXZ)
          // Por lo tanto, SIEMPRE usar getUTCHours() para campos Time de Prisma
          // Esto funciona tanto para eventos antiguos (guardados con Z) como nuevos (guardados sin Z)
          // porque PostgreSQL los almacena igual y Prisma los devuelve igual
          const horas = hora.getUTCHours();
          const minutos = hora.getUTCMinutes();
          horaStr = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
          debugLog('  🔍 Campo Time (Prisma) - usando UTC:', horaStr, '| UTC:', horas, '| Local:', hora.getHours());
        } else {
          // Para otros tipos de Date, usar hora local
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

    // Función para calcular horas adicionales de un servicio "Hora Extra"
    const obtenerHorasAdicionales = (serviciosAdicionales = []) => {
      if (!serviciosAdicionales || serviciosAdicionales.length === 0) {
        return 0;
      }
      const horaExtra = serviciosAdicionales.find(
        servicio => servicio.servicios?.nombre === 'Hora Extra' || 
                    servicio.servicio?.nombre === 'Hora Extra' ||
                    servicio.nombre === 'Hora Extra'
      );
      if (!horaExtra) {
        return 0;
      }
      return horaExtra.cantidad || horaExtra.cantidad_servicio || 0;
    };

    // Función para calcular hora de fin incluyendo horas extras
    const calcularHoraFinConExtras = (horaFinOriginal, horasAdicionales = 0) => {
      if (!horaFinOriginal || horasAdicionales === 0) {
        return horaFinOriginal;
      }
      const finMin = toMinutes(horaFinOriginal);
      const nuevaFinMin = finMin + (horasAdicionales * 60);
      // Convertir de vuelta a formato hora
      const nuevaHora = Math.floor(nuevaFinMin / 60) % 24;
      const nuevoMinuto = nuevaFinMin % 60;
      return `${nuevaHora.toString().padStart(2, '0')}:${nuevoMinuto.toString().padStart(2, '0')}`;
    };

    // Función para procesar un evento (contrato u oferta)
    // IMPORTANTE: Agregar 1 hora adicional después de la hora de fin para limpieza
    const procesarEvento = (horaInicio, horaFin, horasAdicionales = 0) => {
      // Calcular hora de fin incluyendo horas extras
      const horaFinConExtras = calcularHoraFinConExtras(horaFin, horasAdicionales);
      
      const inicioMin = toMinutes(horaInicio);
      let finMin = toMinutes(horaFinConExtras);
      
      // CRÍTICO: Verificar si la hora de fin original es 00:00 (medianoche)
      // Si es medianoche, el evento termina a medianoche del día siguiente
      // En ese caso, NO agregamos hora de limpieza después de medianoche
      const horaFinOriginalMin = toMinutes(horaFin);
      const terminaEnMedianoche = horaFinOriginalMin === 0 || horaFinOriginalMin === 1440;
      
      // IMPORTANTE: Agregar 1 hora adicional (60 minutos) para limpieza después del evento
      // EXCEPTO si el evento termina exactamente a medianoche (00:00)
      // Esto bloquea la hora siguiente para que no se puedan programar otros eventos
      if (!terminaEnMedianoche) {
      finMin += 60;
        // Si después de agregar la hora de limpieza, finMin excede las 24 horas (1440 minutos),
        // limitarlo a 23:59 (1439 minutos) del mismo día
        if (finMin >= 1440) {
          finMin = 1439; // 23:59 del mismo día
        }
      }
      
      // Logging para debug
      let horaInicioStr, horaFinStr;
      if (typeof horaInicio === 'string') {
        horaInicioStr = horaInicio.slice(0, 5);
      } else if (horaInicio instanceof Date) {
        if (horaInicio.getUTCFullYear() === 1970 && horaInicio.getUTCMonth() === 0 && horaInicio.getUTCDate() === 1) {
          const horas = horaInicio.getUTCHours();
          const minutos = horaInicio.getUTCMinutes();
          horaInicioStr = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        } else {
          horaInicioStr = horaInicio.toTimeString().slice(0, 5);
        }
      } else {
        horaInicioStr = horaInicio.toTimeString().slice(0, 5);
      }
      
      if (typeof horaFinConExtras === 'string') {
        horaFinStr = horaFinConExtras.slice(0, 5);
      } else if (horaFinConExtras instanceof Date) {
        if (horaFinConExtras.getUTCFullYear() === 1970 && horaFinConExtras.getUTCMonth() === 0 && horaFinConExtras.getUTCDate() === 1) {
          const horas = horaFinConExtras.getUTCHours();
          const minutos = horaFinConExtras.getUTCMinutes();
          horaFinStr = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        } else {
          horaFinStr = horaFinConExtras.toTimeString().slice(0, 5);
        }
      } else {
        horaFinStr = horaFinConExtras.toTimeString().slice(0, 5);
      }
      
      const horaFinConLimpieza = toHora(finMin);
      debugLog('  ⏰ procesarEvento - Hora inicio:', horaInicioStr, '→ minutos:', inicioMin, 
        '| Hora fin (con extras):', horaFinStr, '| Hora fin (con limpieza):', horaFinConLimpieza, '→ minutos:', finMin,
        '| Termina en medianoche:', terminaEnMedianoche);
      
      // Determinar si cruza medianoche
      // CRÍTICO: Si hora_fin es 00:00 (medianoche), significa que el evento termina a medianoche del día siguiente
      // En ese caso, solo bloqueamos hasta 23:59 del día actual
      const horaFinOriginal = toMinutes(horaFin);
      // Solo considerar que cruza medianoche si:
      // 1. La hora_fin original es menor que la hora_inicio (ej: 20:00 a 02:00)
      // 2. La hora_fin original es exactamente 00:00 (medianoche)
      // NO considerar que cruza medianoche solo porque finMin >= 1440, porque eso puede ser por la hora de limpieza
      const cruzaMedianoche = horaFinOriginal < inicioMin || horaFinOriginal === 0;
      
      if (cruzaMedianoche) {
        // Evento cruza medianoche (ej: 8 PM a 12 AM)
        // IMPORTANTE: Si la hora_fin original es 00:00 (medianoche), el evento termina a medianoche del día siguiente
        // Solo ocupamos desde inicio hasta 23:59 del mismo día (NO el día siguiente)
        const inicioMinAjustado = Math.max(0, inicioMin);
        const finMinAjustado = 1439; // 23:59 del mismo día
        
        // Si la hora_fin original es 00:00, el evento termina a medianoche, así que solo bloqueamos hasta 23:59
        // No bloqueamos horas adicionales después de medianoche porque el evento ya terminó
        debugLog(`  ⚠️ Evento cruza medianoche - bloqueando solo hasta 23:59 del día actual`);
        rangosOcupados.push({
          inicio: inicioMinAjustado,
          fin: finMinAjustado,
          inicioHora: toHora(inicioMinAjustado),
          finHora: toHora(finMinAjustado)
        });
      } else {
        // Evento NO cruza medianoche (ej: 12 PM a 4 PM + 1 hora limpieza = hasta 5 PM)
        // Ocupamos las horas del evento + 1 hora de limpieza
        const inicioMinAjustado = Math.max(0, inicioMin);
        const finMinAjustado = Math.min(1439, finMin); // Máximo 23:59 del mismo día
        
        rangosOcupados.push({
          inicio: inicioMinAjustado,
          fin: finMinAjustado,
          inicioHora: toHora(inicioMinAjustado),
          finHora: toHora(finMinAjustado)
        });
      }
    };

    // =====================================================================
    // IMPORTANTE: NO procesar contratos de la BD para bloquear horas
    // Solo usar eventos de Google Calendar como fuente de verdad
    // Los contratos pueden no estar sincronizados con Google Calendar
    // =====================================================================
    debugLog('ℹ️ Contratos de BD ignorados - Solo se usan eventos de Google Calendar para bloquear horas');
    debugLog(`   (Se encontraron ${contratosMismaFecha.length} contratos en BD para esta fecha, pero NO se procesarán)`);

    // COMENTADO: No procesar contratos de la BD
    // const contratosParaProcesar = contratosMismaFecha.filter(...)
    // contratosParaProcesar.forEach(contrato => { ... });

    // Procesar eventos de Google Calendar
    eventosGoogleCalendar.forEach(evento => {
      // Los eventos de Google Calendar vienen con fecha_inicio y fecha_fin como ISO strings
      // Necesitamos convertirlos a objetos Date y extraer las horas
      try {
        const fechaInicioEvento = new Date(evento.fecha_inicio);
        const fechaFinEvento = new Date(evento.fecha_fin);

        // Verificar que las fechas sean válidas
        if (isNaN(fechaInicioEvento.getTime()) || isNaN(fechaFinEvento.getTime())) {
          logger.warn('⚠️ Evento de Google Calendar con fechas inválidas:', evento.titulo);
          return;
        }

        // CRÍTICO: Verificar que el evento pertenezca al día específico que se está consultando
        // Extraer la fecha de inicio del evento (solo fecha, sin hora) en zona horaria de Miami
        const formatterFecha = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const partesFechaInicio = formatterFecha.formatToParts(fechaInicioEvento);
        const añoInicio = parseInt(partesFechaInicio.find(p => p.type === 'year')?.value || '0', 10);
        const mesInicio = parseInt(partesFechaInicio.find(p => p.type === 'month')?.value || '0', 10);
        const diaInicio = parseInt(partesFechaInicio.find(p => p.type === 'day')?.value || '0', 10);
        const fechaInicioEventoStr = `${añoInicio}-${mesInicio.toString().padStart(2, '0')}-${diaInicio.toString().padStart(2, '0')}`;
        
        // Comparar con la fecha que se está consultando
        if (fechaInicioEventoStr !== fechaEventoStr) {
          debugLog(`  ⏭️ Evento "${evento.titulo}" no pertenece al día ${fechaEventoStr} (fecha inicio: ${fechaInicioEventoStr}) - saltando`);
          return; // Saltar eventos que no pertenecen al día consultado
        }

        debugLog(`  ✅ Evento "${evento.titulo}" pertenece al día ${fechaEventoStr} - procesando`);

        // IMPORTANTE: Extraer la hora en la zona horaria de Miami (America/New_York)
        // Los eventos de Google Calendar vienen con timezone en el ISO string (ej: "2025-11-29T13:00:00-05:00")
        // Necesitamos extraer las horas directamente en la zona horaria de Miami
        // Usar Intl.DateTimeFormat para obtener las partes de fecha/hora en la zona horaria correcta
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        // Extraer horas directamente en zona horaria de Miami
        const partesInicio = formatter.formatToParts(fechaInicioEvento);
        const partesFin = formatter.formatToParts(fechaFinEvento);
        
        const horaInicioH = parseInt(partesInicio.find(p => p.type === 'hour')?.value || '0', 10);
        const horaInicioM = parseInt(partesInicio.find(p => p.type === 'minute')?.value || '0', 10);
        const horaFinH = parseInt(partesFin.find(p => p.type === 'hour')?.value || '0', 10);
        const horaFinM = parseInt(partesFin.find(p => p.type === 'minute')?.value || '0', 10);
        
        const horaInicioStr = `${horaInicioH.toString().padStart(2, '0')}:${horaInicioM.toString().padStart(2, '0')}`;
        const horaFinStr = `${horaFinH.toString().padStart(2, '0')}:${horaFinM.toString().padStart(2, '0')}`;

        debugLog('📅 Procesando evento Google Calendar:', evento.titulo,
          'de', horaInicioStr,
          'a', horaFinStr,
          '| Ubicación:', evento.ubicacion);

        // IMPORTANTE: Calcular minutos directamente desde las horas extraídas
        // No crear objetos Date intermedios que puedan causar problemas de zona horaria
        const inicioMin = horaInicioH * 60 + horaInicioM;
        const finMin = horaFinH * 60 + horaFinM;
        
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
          // IMPORTANTE: Agregar 1 hora adicional (60 minutos) para limpieza después del evento
          const finMinConLimpieza = finMin + 60;
          const inicioMinAjustado = Math.max(0, inicioMin);
          const finMinAjustado = Math.min(1439, finMinConLimpieza);
          
          rangosOcupados.push({
            inicio: inicioMinAjustado,
            fin: finMinAjustado,
            inicioHora: toHora(inicioMinAjustado),
            finHora: toHora(finMinAjustado)
          });
        }
      } catch (error) {
        logger.warn('⚠️ Error al procesar evento de Google Calendar:', error);
        logger.warn('  Evento:', evento);
      }
    });

    // Generar lista de horas ocupadas (cada hora completa que esté dentro de un rango)
    const horasOcupadas = new Set();

    rangosOcupados.forEach(rango => {
      // Agregar cada hora completa dentro del rango
      // IMPORTANTE: Solo procesar minutos dentro del mismo día (0-1439)
      const inicioMin = Math.max(0, rango.inicio);
      const finMin = Math.min(1439, rango.fin); // Máximo 23:59 del mismo día

      // CRÍTICO: Incluir todas las horas que estén DENTRO del rango
      // Si el rango es de 14:00 (840 min) a 20:00 (1200 min), incluir horas 14, 15, 16, 17, 18, 19, 20
      // Incluir la hora de fin si el rango llega hasta esa hora (incluso si termina exactamente al inicio)
      // La hora de limpieza significa que el salón está ocupado hasta esa hora, así que debemos incluirla
      const horaInicio = Math.floor(inicioMin / 60);
      const horaFin = Math.floor(finMin / 60);
      
      // Incluir todas las horas desde horaInicio hasta horaFin (inclusive)
      // Si el rango termina exactamente a las 20:00 (1200 min), incluir también la hora 20
      // porque el evento + limpieza ocupa hasta las 20:00, bloqueando esa hora completa
      for (let hora = horaInicio; hora <= horaFin; hora++) {
        // Asegurar que la hora esté en el rango 0-23
        if (hora >= 0 && hora < 24) {
          horasOcupadas.add(hora);
        }
      }
    });

    const horasOcupadasArray = Array.from(horasOcupadas).sort((a, b) => a - b);

    // Logging para debug
    debugLog('📊 Resumen de horarios ocupados:');
    debugLog('  - Total rangos ocupados:', rangosOcupados.length);
    rangosOcupados.forEach((r, i) => {
      debugLog(`    ${i + 1}. ${r.inicioHora} - ${r.finHora} (${r.inicio} - ${r.fin} minutos)`);
    });
    debugLog('  - Total horas ocupadas:', horasOcupadasArray.length);
    debugLog('  - Horas:', horasOcupadasArray.join(', '));

    res.json({
      success: true,
      horasOcupadas: horasOcupadasArray,
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




