/**
 * Rutas de Google Calendar con OAuth 2.0
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireVendedor, requireManager } = require('../middleware/auth');
const { getAuthUrl, getTokensFromCode, getPrimaryCalendarId } = require('../utils/googleCalendarOAuth');
const { obtenerEventosPorMes, obtenerEventosPorDia, obtenerEventosTodosVendedores, verificarDisponibilidad } = require('../utils/googleCalendarService');
const { encrypt } = require('../utils/encryption');
const { getPrismaClient } = require('../config/database');
const { ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * @route   GET /api/google-calendar/auth/url
 * @desc    Obtener URL de autorización de Google OAuth
 * @access  Private (Vendedor)
 */
router.get('/auth/url', authenticate, requireVendedor, async (req, res, next) => {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Google OAuth no configurado',
        message: 'Las credenciales de Google OAuth no están configuradas en el servidor. Por favor, contacta al administrador.'
      });
    }

    const vendedorId = req.user.id;
    const state = vendedorId.toString(); // Usar ID del vendedor como state para seguridad

    const authUrl = getAuthUrl(state);

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    logger.error('Error al generar URL de autorización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar URL de autorización',
      message: error.message || 'Ocurrió un error al intentar conectar con Google Calendar'
    });
  }
});

/**
 * @route   GET /api/google-calendar/auth/callback
 * @desc    Callback de OAuth - Intercambiar código por tokens
 * @access  Public (pero validado por state)
 */
router.get('/auth/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/configuracion?google_calendar_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/configuracion?google_calendar_error=missing_params`);
    }

    const vendedorId = parseInt(state);
    if (isNaN(vendedorId)) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/configuracion?google_calendar_error=invalid_state`);
    }

    // Verificar que el vendedor existe
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: vendedorId }
    });

    if (!vendedor) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/configuracion?google_calendar_error=vendedor_not_found`);
    }

    // Intercambiar código por tokens
    const tokens = await getTokensFromCode(code);

    // Obtener el ID del calendario principal
    const calendarId = await getPrimaryCalendarId(tokens.access_token, tokens.refresh_token);

    // Encriptar tokens antes de guardar
    const accessTokenEncriptado = encrypt(tokens.access_token);
    const refreshTokenEncriptado = encrypt(tokens.refresh_token);
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    // Guardar tokens y calendar ID en la base de datos
    await prisma.vendedores.update({
      where: { id: vendedorId },
      data: {
        google_access_token: accessTokenEncriptado,
        google_refresh_token: refreshTokenEncriptado,
        google_token_expires_at: expiryDate,
        google_calendar_id: calendarId,
        google_calendar_sync_enabled: true
      }
    });

    logger.info(`✅ Google Calendar conectado para vendedor ${vendedorId}`);

    // Redirigir al frontend con éxito
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/configuracion?google_calendar_success=true`);
  } catch (error) {
    logger.error('Error en callback de OAuth:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/configuracion?google_calendar_error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @route   POST /api/google-calendar/disconnect
 * @desc    Desconectar cuenta de Google Calendar
 * @access  Private (Vendedor)
 */
router.post('/disconnect', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedorId = req.user.id;

    await prisma.vendedores.update({
      where: { id: vendedorId },
      data: {
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_calendar_id: null,
        google_calendar_sync_enabled: false
      }
    });

    logger.info(`✅ Google Calendar desconectado para vendedor ${vendedorId}`);

    res.json({
      success: true,
      message: 'Google Calendar desconectado exitosamente'
    });
  } catch (error) {
    logger.error('Error al desconectar Google Calendar:', error);
    next(error);
  }
});

/**
 * @route   GET /api/google-calendar/status
 * @desc    Obtener estado de conexión de Google Calendar
 * @access  Private (Vendedor)
 */
router.get('/status', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedorId = req.user.id;

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: vendedorId },
      select: {
        google_calendar_sync_enabled: true,
        google_calendar_id: true,
        google_token_expires_at: true
      }
    });

    const isConnected = vendedor?.google_calendar_sync_enabled && vendedor?.google_calendar_id;
    const tokenExpiresAt = vendedor?.google_token_expires_at;

    res.json({
      success: true,
      connected: isConnected || false,
      calendarId: vendedor?.google_calendar_id || null,
      tokenExpiresAt: tokenExpiresAt || null
    });
  } catch (error) {
    logger.error('Error al obtener estado de Google Calendar:', error);
    next(error);
  }
});

/**
 * @route   GET /api/google-calendar/eventos/mes/:mes/:año
 * @desc    Obtener eventos de Google Calendar por mes (del vendedor autenticado)
 * @access  Private (Vendedor)
 */
router.get('/eventos/mes/:mes/:año', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { mes, año } = req.params;
    const vendedorId = req.user.id;

    const mesFiltro = parseInt(mes);
    const añoFiltro = parseInt(año);

    if (mesFiltro < 1 || mesFiltro > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mes inválido'
      });
    }

    const eventos = await obtenerEventosPorMes(vendedorId, mesFiltro, añoFiltro);

    res.json({
      success: true,
      mes: mesFiltro,
      año: añoFiltro,
      eventos: eventos,
      total: eventos.length
    });

  } catch (error) {
    logger.error('Error al obtener eventos de Google Calendar:', error);
    next(error);
  }
});

/**
 * @route   GET /api/google-calendar/eventos/dia/:fecha
 * @desc    Obtener eventos de Google Calendar por día (del vendedor autenticado)
 * @access  Private (Vendedor)
 */
router.get('/eventos/dia/:fecha', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { fecha } = req.params;
    const vendedorId = req.user.id;

    const fechaEvento = new Date(fecha);
    if (isNaN(fechaEvento.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }

    const eventos = await obtenerEventosPorDia(vendedorId, fechaEvento);

    res.json({
      success: true,
      fecha: fecha,
      eventos: eventos,
      total: eventos.length
    });

  } catch (error) {
    logger.error('Error al obtener eventos de Google Calendar por día:', error);
    next(error);
  }
});

/**
 * @route   GET /api/google-calendar/eventos/todos/:mes/:año
 * @desc    Obtener eventos de Google Calendar de todos los vendedores (solo managers)
 * @access  Private (Manager)
 */
router.get('/eventos/todos/:mes/:año', authenticate, requireManager, async (req, res, next) => {
  try {
    const { mes, año } = req.params;

    const mesFiltro = parseInt(mes);
    const añoFiltro = parseInt(año);

    if (mesFiltro < 1 || mesFiltro > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mes inválido'
      });
    }

    const fechaInicio = new Date(añoFiltro, mesFiltro - 1, 1);
    const fechaFin = new Date(añoFiltro, mesFiltro, 0, 23, 59, 59);

    const eventos = await obtenerEventosTodosVendedores(fechaInicio, fechaFin);

    res.json({
      success: true,
      mes: mesFiltro,
      año: añoFiltro,
      eventos: eventos,
      total: eventos.length
    });

  } catch (error) {
    logger.error('Error al obtener eventos de todos los vendedores:', error);
    next(error);
  }
});

/**
 * @route   GET /api/google-calendar/disponibilidad/:fecha
 * @desc    Verificar disponibilidad en una fecha (sin mostrar detalles)
 * @access  Private (Vendedor)
 */
router.get('/disponibilidad/:fecha', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { fecha } = req.params;
    const { hora_inicio, hora_fin } = req.query;
    const vendedorId = req.user.id;

    if (!hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'hora_inicio y hora_fin son requeridos'
      });
    }

    const fechaEvento = new Date(fecha);
    if (isNaN(fechaEvento.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }

    // Crear fechas completas con hora
    const fechaInicio = new Date(fechaEvento);
    const [horaInicio, minutoInicio] = hora_inicio.split(':').map(Number);
    fechaInicio.setHours(horaInicio, minutoInicio, 0, 0);

    const fechaFin = new Date(fechaEvento);
    const [horaFin, minutoFin] = hora_fin.split(':').map(Number);
    fechaFin.setHours(horaFin, minutoFin, 0, 0);

    // Si la hora de fin es menor que la de inicio, asumir que cruza medianoche
    if (fechaFin < fechaInicio) {
      fechaFin.setDate(fechaFin.getDate() + 1);
    }

    const tieneEventos = await verificarDisponibilidad(vendedorId, fechaInicio, fechaFin);

    res.json({
      success: true,
      disponible: !tieneEventos,
      fecha: fecha,
      hora_inicio: hora_inicio,
      hora_fin: hora_fin
    });

  } catch (error) {
    logger.error('Error al verificar disponibilidad:', error);
    next(error);
  }
});

module.exports = router;
