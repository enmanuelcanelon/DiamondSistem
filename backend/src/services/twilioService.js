/**
 * ============================================
 * SERVICIO DE TWILIO - VOZ Y SMS
 * ============================================
 * Funciones para hacer llamadas y enviar SMS
 * usando Twilio Voice y Messaging APIs
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_CALLER_ID = process.env.TWILIO_CALLER_ID;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;

// Cliente de Twilio
let twilioClient = null;

/**
 * Obtener cliente de Twilio (singleton)
 * @returns {twilio.Twilio} Cliente de Twilio
 */
function getClient() {
  if (!twilioClient && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

/**
 * Verificar si el servicio está configurado
 * @returns {boolean}
 */
function isConfigured() {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

/**
 * Verificar si las llamadas desde el navegador están configuradas
 * @returns {boolean}
 */
function isVoiceConfigured() {
  return !!(
    TWILIO_ACCOUNT_SID &&
    TWILIO_API_KEY_SID &&
    TWILIO_API_KEY_SECRET &&
    TWILIO_TWIML_APP_SID
  );
}

/**
 * Formatear número de teléfono para Twilio
 * @param {string} telefono - Número de teléfono
 * @returns {string} Número formateado con formato E.164
 */
function formatearTelefono(telefono) {
  if (!telefono) return null;
  
  // Eliminar caracteres no numéricos excepto el +
  let numero = telefono.replace(/[^\d+]/g, '');
  
  // Si ya tiene formato E.164, devolverlo
  if (numero.startsWith('+')) {
    return numero;
  }
  
  // Si no tiene código de país (asumimos USA +1 por defecto)
  if (numero.length === 10) {
    return '+1' + numero;
  }
  
  // Si tiene 11 dígitos y empieza con 1, agregar +
  if (numero.length === 11 && numero.startsWith('1')) {
    return '+' + numero;
  }
  
  // Agregar + al inicio
  return '+' + numero;
}

/**
 * Generar Access Token para llamadas desde el navegador (Twilio Client SDK)
 * @param {number|string} vendedorId - ID del vendedor para identificar la conexión
 * @returns {Object} Token y configuración
 */
function generarTokenVoz(vendedorId) {
  if (!isVoiceConfigured()) {
    throw new Error('Twilio Voice no está configurado. Verifica las variables de entorno.');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  // Crear token de acceso
  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    { identity: `vendedor_${vendedorId}` }
  );

  // Configurar permisos de voz
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: TWILIO_TWIML_APP_SID,
    incomingAllow: true // Permitir llamadas entrantes
  });

  token.addGrant(voiceGrant);

  logger.info('Token de voz generado', { vendedorId });

  return {
    token: token.toJwt(),
    identity: `vendedor_${vendedorId}`,
    // El token expira en 1 hora por defecto
    expiresIn: 3600
  };
}

/**
 * Iniciar una llamada saliente
 * @param {string} desde - Número de origen (debe ser un número de Twilio verificado)
 * @param {string} hacia - Número de destino
 * @param {string} webhookUrl - URL del webhook para TwiML
 * @returns {Promise<Object>} Detalles de la llamada
 */
async function hacerLlamada(desde, hacia, webhookUrl) {
  if (!isConfigured()) {
    throw new Error('Twilio no está configurado. Verifica las variables de entorno.');
  }

  const client = getClient();
  const haciFormateado = formatearTelefono(hacia);
  
  // Usar el Caller ID configurado o el número de Twilio
  const desdeNumero = desde || TWILIO_CALLER_ID || TWILIO_PHONE_NUMBER;

  try {
    const call = await client.calls.create({
      to: haciFormateado,
      from: desdeNumero,
      url: webhookUrl // URL que devuelve TwiML con instrucciones
    });

    logger.info('Llamada iniciada', {
      callSid: call.sid,
      to: haciFormateado,
      from: desdeNumero,
      status: call.status
    });

    return {
      success: true,
      callSid: call.sid,
      to: haciFormateado,
      from: desdeNumero,
      status: call.status
    };

  } catch (error) {
    logger.error('Error al iniciar llamada:', error);
    throw error;
  }
}

/**
 * Enviar SMS
 * @param {string} hacia - Número de destino
 * @param {string} mensaje - Texto del mensaje
 * @param {string} desde - Número de origen (opcional, usa el configurado por defecto)
 * @returns {Promise<Object>} Detalles del mensaje
 */
async function enviarSMS(hacia, mensaje, desde = null) {
  if (!isConfigured()) {
    throw new Error('Twilio no está configurado. Verifica las variables de entorno.');
  }

  const client = getClient();
  const haciaFormateado = formatearTelefono(hacia);
  const desdeNumero = desde || TWILIO_PHONE_NUMBER;

  try {
    const message = await client.messages.create({
      to: haciaFormateado,
      from: desdeNumero,
      body: mensaje
    });

    logger.info('SMS enviado', {
      messageSid: message.sid,
      to: haciaFormateado,
      from: desdeNumero,
      status: message.status
    });

    return {
      success: true,
      messageSid: message.sid,
      to: haciaFormateado,
      from: desdeNumero,
      status: message.status
    };

  } catch (error) {
    logger.error('Error al enviar SMS:', error);
    throw error;
  }
}

/**
 * Generar TwiML para una llamada saliente
 * Esta función crea las instrucciones XML que Twilio necesita para manejar la llamada
 * @param {string} hacia - Número de destino
 * @param {Object} opciones - Opciones adicionales
 * @returns {string} TwiML XML
 */
function generarTwiMLLlamada(hacia, opciones = {}) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const haciaFormateado = formatearTelefono(hacia);
  const callerId = opciones.callerId || TWILIO_CALLER_ID || TWILIO_PHONE_NUMBER;

  // Si es un número SIP o client, manejar diferente
  if (hacia.startsWith('sip:') || hacia.startsWith('client:')) {
    twiml.dial({ callerId }).sip(hacia);
  } else {
    // Llamar al número
    const dial = twiml.dial({
      callerId: callerId,
      timeout: opciones.timeout || 30,
      record: opciones.record || 'do-not-record'
    });
    
    dial.number(haciaFormateado);
  }

  return twiml.toString();
}

/**
 * Generar TwiML para responder a una llamada entrante
 * @param {Object} opciones - Opciones de respuesta
 * @returns {string} TwiML XML
 */
function generarTwiMLRespuesta(opciones = {}) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  if (opciones.mensaje) {
    twiml.say({
      language: 'es-MX',
      voice: 'Polly.Mia'
    }, opciones.mensaje);
  }

  if (opciones.redirigirA) {
    const dial = twiml.dial({
      timeout: opciones.timeout || 30
    });
    dial.number(formatearTelefono(opciones.redirigirA));
  }

  return twiml.toString();
}

/**
 * Validar firma de webhook de Twilio
 * @param {string} authToken - Token de autenticación de Twilio
 * @param {string} signature - Firma X-Twilio-Signature del header
 * @param {string} url - URL completa del webhook
 * @param {Object} params - Parámetros del POST
 * @returns {boolean} True si la firma es válida
 */
function validarFirmaWebhook(authToken, signature, url, params) {
  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Obtener estado de una llamada
 * @param {string} callSid - SID de la llamada
 * @returns {Promise<Object>} Estado de la llamada
 */
async function obtenerEstadoLlamada(callSid) {
  if (!isConfigured()) {
    throw new Error('Twilio no está configurado');
  }

  const client = getClient();
  
  try {
    const call = await client.calls(callSid).fetch();
    
    return {
      callSid: call.sid,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
      from: call.from,
      to: call.to
    };
  } catch (error) {
    logger.error('Error al obtener estado de llamada:', error);
    throw error;
  }
}

/**
 * Obtener estado de un SMS
 * @param {string} messageSid - SID del mensaje
 * @returns {Promise<Object>} Estado del mensaje
 */
async function obtenerEstadoSMS(messageSid) {
  if (!isConfigured()) {
    throw new Error('Twilio no está configurado');
  }

  const client = getClient();
  
  try {
    const message = await client.messages(messageSid).fetch();
    
    return {
      messageSid: message.sid,
      status: message.status,
      dateSent: message.dateSent,
      from: message.from,
      to: message.to,
      body: message.body,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    logger.error('Error al obtener estado de SMS:', error);
    throw error;
  }
}

module.exports = {
  isConfigured,
  isVoiceConfigured,
  formatearTelefono,
  generarTokenVoz,
  hacerLlamada,
  enviarSMS,
  generarTwiMLLlamada,
  generarTwiMLRespuesta,
  validarFirmaWebhook,
  obtenerEstadoLlamada,
  obtenerEstadoSMS
};

