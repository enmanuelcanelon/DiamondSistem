/**
 * Servicio de OAuth 2.0 para Google Calendar
 */

const { google } = require('googleapis');
const logger = require('./logger');

// Configuración OAuth 2.0
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:5000/api/google-calendar/auth/callback';

/**
 * Crear cliente OAuth 2.0
 * @returns {google.auth.OAuth2Client} Cliente OAuth
 */
function createOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    logger.warn('⚠️ Google OAuth no configurado. Variables de entorno faltantes.');
    return null;
  }

  return new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
}

/**
 * Generar URL de autorización
 * @param {string} state - Estado para verificar la solicitud (puede ser el ID del vendedor)
 * @returns {string} URL de autorización
 */
function getAuthUrl(state) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth no configurado');
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Forzar consentimiento para obtener refresh token
    state: state
  });
}

/**
 * Intercambiar código de autorización por tokens
 * @param {string} code - Código de autorización
 * @returns {Promise<Object>} Tokens (access_token, refresh_token, expiry_date)
 */
async function getTokensFromCode(code) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth no configurado');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      token_type: tokens.token_type
    };
  } catch (error) {
    logger.error('Error al obtener tokens de Google OAuth:', error);
    throw error;
  }
}

/**
 * Refrescar token de acceso
 * @param {string} refreshToken - Token de refresco
 * @returns {Promise<Object>} Nuevos tokens
 */
async function refreshAccessToken(refreshToken) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth no configurado');
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date,
      token_type: credentials.token_type
    };
  } catch (error) {
    logger.error('Error al refrescar token de Google OAuth:', error);
    throw error;
  }
}

/**
 * Crear cliente autenticado con tokens
 * @param {string} accessToken - Token de acceso
 * @param {string} refreshToken - Token de refresco (opcional)
 * @returns {google.auth.OAuth2Client} Cliente autenticado
 */
function createAuthenticatedClient(accessToken, refreshToken = null) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) {
    return null;
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return oauth2Client;
}

/**
 * Obtener lista de calendarios del usuario
 * @param {string} accessToken - Token de acceso
 * @param {string} refreshToken - Token de refresco
 * @returns {Promise<Array>} Lista de calendarios
 */
async function getCalendarList(accessToken, refreshToken = null) {
  try {
    const oauth2Client = createAuthenticatedClient(accessToken, refreshToken);
    if (!oauth2Client) {
      throw new Error('No se pudo crear cliente OAuth');
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();

    return response.data.items || [];
  } catch (error) {
    logger.error('Error al obtener lista de calendarios:', error);
    throw error;
  }
}

/**
 * Obtener el ID del calendario principal (primary)
 * @param {string} accessToken - Token de acceso
 * @param {string} refreshToken - Token de refresco
 * @returns {Promise<string>} Calendar ID
 */
async function getPrimaryCalendarId(accessToken, refreshToken = null) {
  try {
    const calendars = await getCalendarList(accessToken, refreshToken);
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
    
    return primaryCalendar ? primaryCalendar.id : null;
  } catch (error) {
    logger.error('Error al obtener calendario principal:', error);
    return null;
  }
}

module.exports = {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  refreshAccessToken,
  createAuthenticatedClient,
  getCalendarList,
  getPrimaryCalendarId,
};

