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
 * Obtener eventos de Google Calendar para un vendedor
 * @param {number} vendedorId - ID del vendedor
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Array de eventos
 */
async function obtenerEventosGoogleCalendar(vendedorId, fechaInicio, fechaFin) {
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
      logger.warn(`Vendedor ${vendedorId} no tiene tokens válidos de Google Calendar`);
      return [];
    }

    const oauth2Client = createAuthenticatedClient(tokens.access_token, tokens.refresh_token);
    if (!oauth2Client) {
      return [];
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Convertir fechas a formato ISO
    const timeMin = fechaInicio.toISOString();
    const timeMax = fechaFin.toISOString();

    const response = await calendar.events.list({
      calendarId: vendedor.google_calendar_id,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500
    });

    const eventos = response.data.items || [];

    // Formatear eventos
    const eventosFormateados = eventos.map(evento => {
      const inicio = evento.start?.dateTime || evento.start?.date;
      const fin = evento.end?.dateTime || evento.end?.date;
      
      return {
        id: evento.id,
        titulo: evento.summary || 'Sin título',
        descripcion: evento.description || '',
        fecha_inicio: inicio,
        fecha_fin: fin,
        ubicacion: evento.location || '',
        creador: evento.creator?.email || '',
        organizador: evento.organizer?.email || '',
        estado: evento.status || 'confirmed',
        htmlLink: evento.htmlLink || '',
      };
    });

    logger.info(`✅ Obtenidos ${eventosFormateados.length} eventos de Google Calendar para vendedor ${vendedorId}`);
    return eventosFormateados;
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
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Promise<Array>} Array de eventos con información del vendedor
 */
async function obtenerEventosTodosVendedores(fechaInicio, fechaFin) {
  try {
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

    const todosLosEventos = [];

    for (const vendedor of vendedores) {
      try {
        const eventos = await obtenerEventosGoogleCalendar(vendedor.id, fechaInicio, fechaFin);
        
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

    return todosLosEventos;
  } catch (error) {
    logger.error('Error al obtener eventos de todos los vendedores:', error);
    return [];
  }
}

module.exports = {
  obtenerEventosGoogleCalendar,
  obtenerEventosPorMes,
  obtenerEventosPorDia,
  verificarDisponibilidad,
  obtenerEventosTodosVendedores,
  getValidTokens,
};
