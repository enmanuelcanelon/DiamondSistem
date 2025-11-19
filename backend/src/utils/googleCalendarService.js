/**
 * Servicio para obtener eventos de Google Calendar usando OAuth 2.0
 */

const { google } = require('googleapis');
const logger = require('./logger');
const { createAuthenticatedClient, refreshAccessToken } = require('./googleCalendarOAuth');
const { encrypt, decrypt } = require('./encryption');
const { getPrismaClient } = require('../config/database');

const prisma = getPrismaClient();

/**
 * Obtener y refrescar tokens del vendedor si es necesario
 * @param {number} vendedorId - ID del vendedor
 * @returns {Promise<Object>} Tokens actualizados (access_token, refresh_token)
 */
async function getValidTokens(vendedorId) {
  try {
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: vendedorId },
      select: {
        google_access_token: true,
        google_refresh_token: true,
        google_token_expires_at: true
      }
    });

    if (!vendedor || !vendedor.google_access_token || !vendedor.google_refresh_token) {
      return null;
    }

    // Desencriptar tokens
    const accessToken = decrypt(vendedor.google_access_token);
    const refreshToken = decrypt(vendedor.google_refresh_token);

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Verificar si el token está expirado o está por expirar (5 minutos de margen)
    const ahora = new Date();
    const expiraEn = vendedor.google_token_expires_at ? new Date(vendedor.google_token_expires_at) : null;
    const cincoMinutos = 5 * 60 * 1000;

    if (!expiraEn || (expiraEn.getTime() - ahora.getTime()) < cincoMinutos) {
      // Token expirado o por expirar, refrescar
      logger.info(`Refrescando token de Google Calendar para vendedor ${vendedorId}`);
      
      try {
        const nuevosTokens = await refreshAccessToken(refreshToken);
        
        // Actualizar tokens en la base de datos
        const nuevoAccessTokenEncriptado = encrypt(nuevosTokens.access_token);
        const nuevoExpiryDate = nuevosTokens.expiry_date 
          ? new Date(nuevosTokens.expiry_date) 
          : new Date(Date.now() + 3600 * 1000); // Por defecto 1 hora

        await prisma.vendedores.update({
          where: { id: vendedorId },
          data: {
            google_access_token: nuevoAccessTokenEncriptado,
            google_token_expires_at: nuevoExpiryDate
          }
        });

        return {
          access_token: nuevosTokens.access_token,
          refresh_token: refreshToken
        };
      } catch (error) {
        logger.error(`Error al refrescar token para vendedor ${vendedorId}:`, error);
        return null;
      }
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  } catch (error) {
    logger.error(`Error al obtener tokens para vendedor ${vendedorId}:`, error);
    return null;
  }
}

/**
 * Obtener eventos del calendario principal del vendedor
 * @param {number} vendedorId - ID del vendedor
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Array de eventos
 */
async function obtenerEventosCalendarioPrincipal(vendedorId, fechaInicio, fechaFin) {
  try {
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: vendedorId },
      select: {
        google_calendar_id: true,
        google_calendar_sync_enabled: true
      }
    });

    if (!vendedor || !vendedor.google_calendar_sync_enabled || !vendedor.google_calendar_id) {
      return [];
    }

    const tokens = await getValidTokens(vendedorId);
    if (!tokens) {
      return [];
    }

    const oauth2Client = createAuthenticatedClient(tokens.access_token, tokens.refresh_token);
    if (!oauth2Client) {
      return [];
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const timeMin = fechaInicio.toISOString();
    const timeMax = fechaFin.toISOString();

    const response = await calendar.events.list({
      calendarId: vendedor.google_calendar_id,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
      showDeleted: false,
      // Forzar actualización evitando caché
      alwaysIncludeEmail: false
    });

    const eventos = (response.data.items || []).map(evento => {
      // Obtener fechas/horas - priorizar dateTime sobre date
      const inicio = evento.start?.dateTime || evento.start?.date;
      const fin = evento.end?.dateTime || evento.end?.date;
      
      // Detectar si es evento de todo el día (usa 'date' en lugar de 'dateTime')
      const esTodoElDia = !evento.start?.dateTime && !!evento.start?.date;
      
      let fechaInicio = inicio || null;
      let fechaFin = fin || null;
      
      // Para eventos de todo el día, parsear correctamente en zona horaria de Miami
      if (esTodoElDia && inicio && !inicio.includes('T')) {
        // Formato: "2025-11-19" -> agregar hora en zona horaria de Miami
        // Miami está en America/New_York (EST: UTC-5, EDT: UTC-4)
        // Usar EST por defecto (-05:00), se ajustará automáticamente según la fecha
        fechaInicio = `${inicio}T00:00:00-05:00`;
      }
      
      if (esTodoElDia && fin && !fin.includes('T')) {
        // Para eventos de todo el día, Google Calendar usa el día siguiente como fin
        // Ejemplo: evento del 19, fin es "2025-11-20" (día siguiente a medianoche)
        fechaFin = `${fin}T00:00:00-05:00`;
      }
      
      return {
        id: evento.id,
        titulo: evento.summary || 'Sin título',
        descripcion: evento.description || '',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        es_todo_el_dia: esTodoElDia, // Marcar como evento de todo el día
        timeZone: evento.start?.timeZone || evento.end?.timeZone || 'America/New_York',
        ubicacion: evento.location || '',
        creador: evento.creator?.email || '',
        organizador: evento.organizer?.email || '',
        estado: evento.status || 'confirmed',
        htmlLink: evento.htmlLink || '',
        calendario: 'principal',
        // Incluir información de actualización para debugging
        updated: evento.updated || null
      };
    });

    // Log de ejemplo para debugging (solo el primer evento)
    if (eventos.length > 0) {
      const primerEvento = eventos[0];
      logger.info(`✅ Obtenidos ${eventos.length} eventos del calendario principal para vendedor ${vendedorId}`);
      logger.debug(`Ejemplo evento: ${primerEvento.titulo} - Inicio: ${primerEvento.fecha_inicio}, Fin: ${primerEvento.fecha_fin}, Actualizado: ${primerEvento.updated}`);
    } else {
      logger.info(`✅ No se encontraron eventos en el calendario principal para vendedor ${vendedorId}`);
    }
    return eventos;
  } catch (error) {
    logger.error(`❌ Error al obtener eventos del calendario principal para vendedor ${vendedorId}:`, error);
    return [];
  }
}

/**
 * Crear evento en el calendario CITAS compartido
 * @param {number} vendedorId - ID del vendedor
 * @param {Object} datosEvento - Datos del evento
 * @param {string} datosEvento.titulo - Título del evento
 * @param {Date} datosEvento.fechaInicio - Fecha y hora de inicio
 * @param {Date} datosEvento.fechaFin - Fecha y hora de fin
 * @param {string} datosEvento.descripcion - Descripción del evento
 * @param {string} datosEvento.ubicacion - Ubicación/salón
 * @returns {Promise<Object>} Evento creado
 */
async function crearEventoCitas(vendedorId, datosEvento) {
  try {
    const calendarioCitasId = process.env.GOOGLE_CALENDAR_CITAS_ID;
    if (!calendarioCitasId) {
      logger.warn('⚠️ GOOGLE_CALENDAR_CITAS_ID no configurado');
      return null;
    }

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: vendedorId },
      select: {
        google_calendar_sync_enabled: true
      }
    });

    if (!vendedor || !vendedor.google_calendar_sync_enabled) {
      logger.warn(`⚠️ Vendedor ${vendedorId} no tiene Google Calendar habilitado`);
      return null;
    }

    const tokens = await getValidTokens(vendedorId);
    if (!tokens) {
      logger.warn(`⚠️ Vendedor ${vendedorId} no tiene tokens válidos`);
      return null;
    }

    const oauth2Client = createAuthenticatedClient(tokens.access_token, tokens.refresh_token);
    if (!oauth2Client) {
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Formatear fechas para Google Calendar
    const fechaInicioISO = datosEvento.fechaInicio.toISOString();
    const fechaFinISO = datosEvento.fechaFin.toISOString();

    const evento = {
      summary: datosEvento.titulo || 'Cita de Lead',
      description: datosEvento.descripcion || '',
      location: datosEvento.ubicacion || '',
      start: {
        dateTime: fechaInicioISO,
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: fechaFinISO,
        timeZone: 'America/New_York'
      }
    };

    const response = await calendar.events.insert({
      calendarId: calendarioCitasId,
      resource: evento
    });

    logger.info(`✅ Evento creado en calendario CITAS: ${response.data.id}`);
    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      titulo: response.data.summary
    };
  } catch (error) {
    logger.error(`❌ Error al crear evento en calendario CITAS:`, error);
    throw error;
  }
}

/**
 * Obtener eventos del calendario CITAS compartido
 * @param {number} vendedorId - ID del vendedor (para obtener tokens)
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Array de eventos
 */
async function obtenerEventosCalendarioCitas(vendedorId, fechaInicio, fechaFin) {
  try {
    const calendarioCitasId = process.env.GOOGLE_CALENDAR_CITAS_ID;
    if (!calendarioCitasId) {
      return [];
    }

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: vendedorId },
      select: {
        google_calendar_sync_enabled: true
      }
    });

    if (!vendedor || !vendedor.google_calendar_sync_enabled) {
      return [];
    }

    const tokens = await getValidTokens(vendedorId);
    if (!tokens) {
      return [];
    }

    const oauth2Client = createAuthenticatedClient(tokens.access_token, tokens.refresh_token);
    if (!oauth2Client) {
      return [];
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const timeMin = fechaInicio.toISOString();
    const timeMax = fechaFin.toISOString();

    const response = await calendar.events.list({
      calendarId: calendarioCitasId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
      showDeleted: false,
      // Forzar actualización evitando caché
      alwaysIncludeEmail: false
    });

    const eventos = (response.data.items || []).map(evento => {
      // Obtener fechas/horas - priorizar dateTime sobre date
      const inicio = evento.start?.dateTime || evento.start?.date;
      const fin = evento.end?.dateTime || evento.end?.date;
      
      // Detectar si es evento de todo el día (usa 'date' en lugar de 'dateTime')
      const esTodoElDia = !evento.start?.dateTime && !!evento.start?.date;
      
      let fechaInicio = inicio || null;
      let fechaFin = fin || null;
      
      // Para eventos de todo el día, parsear correctamente en zona horaria de Miami
      if (esTodoElDia && inicio && !inicio.includes('T')) {
        // Formato: "2025-11-19" -> agregar hora en zona horaria de Miami
        // Miami está en America/New_York (EST: UTC-5, EDT: UTC-4)
        // Usar EST por defecto (-05:00), se ajustará automáticamente según la fecha
        fechaInicio = `${inicio}T00:00:00-05:00`;
      }
      
      if (esTodoElDia && fin && !fin.includes('T')) {
        // Para eventos de todo el día, Google Calendar usa el día siguiente como fin
        // Ejemplo: evento del 19, fin es "2025-11-20" (día siguiente a medianoche)
        fechaFin = `${fin}T00:00:00-05:00`;
      }
      
      return {
        id: evento.id,
        titulo: evento.summary || 'Sin título',
        descripcion: evento.description || '',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        es_todo_el_dia: esTodoElDia, // Marcar como evento de todo el día
        timeZone: evento.start?.timeZone || evento.end?.timeZone || 'America/New_York',
        ubicacion: evento.location || '',
        creador: evento.creator?.email || '',
        organizador: evento.organizer?.email || '',
        estado: evento.status || 'confirmed',
        htmlLink: evento.htmlLink || '',
        calendario: 'citas',
        // Incluir información de actualización para debugging
        updated: evento.updated || null
      };
    });

    logger.info(`✅ Obtenidos ${eventos.length} eventos del calendario CITAS`);
    return eventos;
  } catch (error) {
    logger.warn(`⚠️ Error al obtener eventos del calendario CITAS:`, error);
    return [];
  }
}

/**
 * Obtener eventos de Google Calendar para un vendedor (incluye calendario principal y CITAS compartido)
 * @param {number} vendedorId - ID del vendedor
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Array de eventos
 */
async function obtenerEventosGoogleCalendar(vendedorId, fechaInicio, fechaFin) {
  try {
    const eventos = [];
    
    // 1. Obtener eventos del calendario principal
    const eventosPrincipal = await obtenerEventosCalendarioPrincipal(vendedorId, fechaInicio, fechaFin);
    eventos.push(...eventosPrincipal);

    // 2. Obtener eventos del calendario CITAS
    const eventosCitas = await obtenerEventosCalendarioCitas(vendedorId, fechaInicio, fechaFin);
    eventos.push(...eventosCitas);

    logger.info(`✅ Obtenidos ${eventos.length} eventos totales de Google Calendar para vendedor ${vendedorId}`);
    return eventos;
  } catch (error) {
    logger.error(`❌ Error al obtener eventos de Google Calendar para vendedor ${vendedorId}:`, error);
    return [];
  }
}

/**
 * Obtener eventos de Google Calendar para un mes específico
 * @param {number} vendedorId - ID del vendedor
 * @param {number} mes - Mes (1-12)
 * @param {number} año - Año
 * @returns {Promise<Array>} Array de eventos
 */
async function obtenerEventosPorMes(vendedorId, mes, año) {
  try {
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59);

    return await obtenerEventosGoogleCalendar(vendedorId, fechaInicio, fechaFin);
  } catch (error) {
    logger.error('❌ Error al obtener eventos por mes:', error);
    return [];
  }
}

/**
 * Obtener eventos de Google Calendar para un día específico
 * @param {number} vendedorId - ID del vendedor
 * @param {Date} fecha - Fecha del día
 * @returns {Promise<Array>} Array de eventos
 */
async function obtenerEventosPorDia(vendedorId, fecha) {
  try {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    return await obtenerEventosGoogleCalendar(vendedorId, fechaInicio, fechaFin);
  } catch (error) {
    logger.error('❌ Error al obtener eventos por día:', error);
    return [];
  }
}

/**
 * Verificar si hay eventos en un rango de fechas/horas (sin mostrar detalles)
 * @param {number} vendedorId - ID del vendedor
 * @param {Date} fechaInicio - Fecha y hora de inicio
 * @param {Date} fechaFin - Fecha y hora de fin
 * @returns {Promise<boolean>} true si hay eventos, false si no
 */
async function verificarDisponibilidad(vendedorId, fechaInicio, fechaFin) {
  try {
    const eventos = await obtenerEventosGoogleCalendar(vendedorId, fechaInicio, fechaFin);
    return eventos.length > 0;
  } catch (error) {
    logger.error(`Error al verificar disponibilidad para vendedor ${vendedorId}:`, error);
    return false;
  }
}

/**
 * Obtener eventos de todos los vendedores (solo para managers)
 * Incluye: calendarios principales de todos los vendedores + calendario CITAS compartido
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Array de eventos con información del vendedor
 */
async function obtenerEventosTodosVendedores(fechaInicio, fechaFin) {
  try {
    const todosLosEventos = [];

    // 1. Obtener eventos de los calendarios principales de todos los vendedores
    const vendedores = await prisma.vendedores.findMany({
      where: {
        google_calendar_sync_enabled: true,
        google_calendar_id: { not: null }
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        google_calendar_id: true
      }
    });

    for (const vendedor of vendedores) {
      try {
        const eventos = await obtenerEventosCalendarioPrincipal(vendedor.id, fechaInicio, fechaFin);
        
        eventos.forEach(evento => {
          todosLosEventos.push({
            ...evento,
            vendedor_id: vendedor.id,
            vendedor_nombre: vendedor.nombre_completo,
            vendedor_codigo: vendedor.codigo_vendedor
          });
        });
      } catch (error) {
        logger.warn(`Error al obtener eventos del vendedor ${vendedor.id}:`, error);
      }
    }

    // 2. Obtener eventos del calendario CITAS compartido (usar el primer vendedor con tokens válidos)
    const vendedorConTokens = vendedores.find(v => v.google_calendar_sync_enabled);
    if (vendedorConTokens) {
      try {
        const eventosCitas = await obtenerEventosCalendarioCitas(vendedorConTokens.id, fechaInicio, fechaFin);
        eventosCitas.forEach(evento => {
          todosLosEventos.push({
            ...evento,
            vendedor_id: null,
            vendedor_nombre: 'CITAS',
            vendedor_codigo: 'CITAS'
          });
        });
      } catch (error) {
        logger.warn('Error al obtener eventos del calendario CITAS:', error);
      }
    }

    return todosLosEventos;
  } catch (error) {
    logger.error('Error al obtener eventos de todos los vendedores:', error);
    return [];
  }
}

module.exports = {
  obtenerEventosGoogleCalendar,
  obtenerEventosCalendarioPrincipal,
  obtenerEventosCalendarioCitas,
  crearEventoCitas,
  obtenerEventosPorMes,
  obtenerEventosPorDia,
  verificarDisponibilidad,
  obtenerEventosTodosVendedores,
  getValidTokens,
};
