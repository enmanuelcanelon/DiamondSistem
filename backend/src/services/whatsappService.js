/**
 * ============================================
 * SERVICIO DE WHATSAPP - META CLOUD API
 * ============================================
 * Funciones para enviar y recibir mensajes de WhatsApp
 * usando la API de Meta (Facebook) Graph API v18.0
 */

const logger = require('../utils/logger');

// Configuración de WhatsApp Cloud API
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Verificar si el servicio está configurado
 * @returns {boolean}
 */
function isConfigured() {
  return !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_VERIFY_TOKEN);
}

/**
 * Formatear número de teléfono para WhatsApp
 * WhatsApp requiere el formato: código de país + número (sin + ni espacios)
 * @param {string} telefono - Número de teléfono
 * @returns {string} Número formateado
 */
function formatearTelefono(telefono) {
  if (!telefono) return null;
  
  // Eliminar caracteres no numéricos excepto el +
  let numero = telefono.replace(/[^\d+]/g, '');
  
  // Si empieza con +, eliminar el +
  if (numero.startsWith('+')) {
    numero = numero.substring(1);
  }
  
  // Si no tiene código de país (asumimos USA +1 por defecto)
  if (numero.length === 10) {
    numero = '1' + numero;
  }
  
  return numero;
}

/**
 * Enviar mensaje de texto simple vía WhatsApp
 * @param {string} telefono - Número de teléfono del destinatario
 * @param {string} mensaje - Texto del mensaje
 * @returns {Promise<Object>} Respuesta de la API
 */
async function enviarMensajeTexto(telefono, mensaje) {
  if (!isConfigured()) {
    throw new Error('WhatsApp Cloud API no está configurado. Verifica las variables de entorno.');
  }

  const telefonoFormateado = formatearTelefono(telefono);
  if (!telefonoFormateado) {
    throw new Error('Número de teléfono inválido');
  }

  const url = `${GRAPH_API_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: telefonoFormateado,
    type: 'text',
    text: {
      preview_url: false,
      body: mensaje
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Error al enviar mensaje WhatsApp:', {
        status: response.status,
        error: data.error
      });
      throw new Error(data.error?.message || 'Error al enviar mensaje de WhatsApp');
    }

    logger.info('Mensaje WhatsApp enviado exitosamente', {
      to: telefonoFormateado,
      messageId: data.messages?.[0]?.id
    });

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      to: telefonoFormateado
    };

  } catch (error) {
    logger.error('Error en enviarMensajeTexto:', error);
    throw error;
  }
}

/**
 * Enviar mensaje con template de WhatsApp
 * @param {string} telefono - Número de teléfono del destinatario
 * @param {string} templateName - Nombre del template
 * @param {string} languageCode - Código de idioma (ej: 'es', 'en_US')
 * @param {Array} params - Parámetros del template
 * @returns {Promise<Object>} Respuesta de la API
 */
async function enviarMensajeTemplate(telefono, templateName, languageCode = 'es', params = []) {
  if (!isConfigured()) {
    throw new Error('WhatsApp Cloud API no está configurado. Verifica las variables de entorno.');
  }

  const telefonoFormateado = formatearTelefono(telefono);
  if (!telefonoFormateado) {
    throw new Error('Número de teléfono inválido');
  }

  const url = `${GRAPH_API_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Construir componentes del template
  const components = [];
  if (params.length > 0) {
    components.push({
      type: 'body',
      parameters: params.map(param => ({
        type: 'text',
        text: String(param)
      }))
    });
  }

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: telefonoFormateado,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: components.length > 0 ? components : undefined
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Error al enviar template WhatsApp:', {
        status: response.status,
        error: data.error,
        template: templateName
      });
      throw new Error(data.error?.message || 'Error al enviar template de WhatsApp');
    }

    logger.info('Template WhatsApp enviado exitosamente', {
      to: telefonoFormateado,
      template: templateName,
      messageId: data.messages?.[0]?.id
    });

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      to: telefonoFormateado,
      template: templateName
    };

  } catch (error) {
    logger.error('Error en enviarMensajeTemplate:', error);
    throw error;
  }
}

/**
 * Verificar webhook de Meta (para configuración inicial)
 * Meta envía un GET request para verificar el webhook
 * @param {string} mode - hub.mode de Meta
 * @param {string} token - hub.verify_token de Meta
 * @param {string} challenge - hub.challenge de Meta
 * @returns {Object} Resultado de la verificación
 */
function verificarWebhook(mode, token, challenge) {
  if (!WHATSAPP_VERIFY_TOKEN) {
    logger.warn('WHATSAPP_VERIFY_TOKEN no está configurado');
    return { success: false, error: 'Token de verificación no configurado' };
  }

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    logger.info('Webhook de WhatsApp verificado exitosamente');
    return { success: true, challenge: challenge };
  } else {
    logger.warn('Verificación de webhook fallida', { mode, tokenMatch: token === WHATSAPP_VERIFY_TOKEN });
    return { success: false, error: 'Verificación fallida' };
  }
}

/**
 * Procesar webhook de mensajes entrantes
 * @param {Object} body - Cuerpo del webhook de Meta
 * @returns {Object} Mensaje procesado o null si no es un mensaje
 */
function procesarWebhook(body) {
  try {
    // Verificar que es un webhook de WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      logger.debug('Webhook ignorado: no es de WhatsApp Business');
      return null;
    }

    const entry = body.entry?.[0];
    if (!entry) {
      logger.debug('Webhook sin entry');
      return null;
    }

    const changes = entry.changes?.[0];
    if (!changes) {
      logger.debug('Webhook sin changes');
      return null;
    }

    const value = changes.value;
    if (!value) {
      logger.debug('Webhook sin value');
      return null;
    }

    // Procesar mensajes entrantes
    const messages = value.messages;
    if (!messages || messages.length === 0) {
      // Puede ser una actualización de estado, no un mensaje
      const statuses = value.statuses;
      if (statuses && statuses.length > 0) {
        return procesarEstadoMensaje(statuses[0]);
      }
      logger.debug('Webhook sin mensajes ni estados');
      return null;
    }

    const message = messages[0];
    const contact = value.contacts?.[0];

    const mensajeProcesado = {
      tipo: 'mensaje_entrante',
      messageId: message.id,
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      from: message.from,
      contactName: contact?.profile?.name || 'Desconocido',
      tipoMensaje: message.type,
      contenido: null
    };

    // Extraer contenido según el tipo de mensaje
    switch (message.type) {
      case 'text':
        mensajeProcesado.contenido = message.text?.body;
        break;
      case 'image':
        mensajeProcesado.contenido = `[Imagen] ${message.image?.caption || ''}`;
        mensajeProcesado.mediaId = message.image?.id;
        break;
      case 'audio':
        mensajeProcesado.contenido = '[Audio]';
        mensajeProcesado.mediaId = message.audio?.id;
        break;
      case 'video':
        mensajeProcesado.contenido = `[Video] ${message.video?.caption || ''}`;
        mensajeProcesado.mediaId = message.video?.id;
        break;
      case 'document':
        mensajeProcesado.contenido = `[Documento] ${message.document?.filename || ''}`;
        mensajeProcesado.mediaId = message.document?.id;
        break;
      case 'location':
        mensajeProcesado.contenido = `[Ubicación] ${message.location?.name || ''} (${message.location?.latitude}, ${message.location?.longitude})`;
        break;
      case 'sticker':
        mensajeProcesado.contenido = '[Sticker]';
        mensajeProcesado.mediaId = message.sticker?.id;
        break;
      case 'contacts':
        mensajeProcesado.contenido = `[Contacto] ${message.contacts?.[0]?.name?.formatted_name || ''}`;
        break;
      case 'button':
        mensajeProcesado.contenido = message.button?.text;
        break;
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          mensajeProcesado.contenido = message.interactive.button_reply?.title;
        } else if (message.interactive?.type === 'list_reply') {
          mensajeProcesado.contenido = message.interactive.list_reply?.title;
        }
        break;
      default:
        mensajeProcesado.contenido = `[${message.type}]`;
    }

    logger.info('Mensaje WhatsApp entrante procesado', {
      from: mensajeProcesado.from,
      tipo: mensajeProcesado.tipoMensaje,
      contenido: mensajeProcesado.contenido?.substring(0, 50)
    });

    return mensajeProcesado;

  } catch (error) {
    logger.error('Error al procesar webhook de WhatsApp:', error);
    return null;
  }
}

/**
 * Procesar actualización de estado de mensaje
 * @param {Object} status - Estado del mensaje
 * @returns {Object} Estado procesado
 */
function procesarEstadoMensaje(status) {
  return {
    tipo: 'estado_mensaje',
    messageId: status.id,
    recipientId: status.recipient_id,
    estado: status.status, // sent, delivered, read, failed
    timestamp: new Date(parseInt(status.timestamp) * 1000),
    error: status.errors?.[0]
  };
}

/**
 * Marcar mensaje como leído
 * @param {string} messageId - ID del mensaje a marcar
 * @returns {Promise<Object>} Respuesta de la API
 */
async function marcarComoLeido(messageId) {
  if (!isConfigured()) {
    throw new Error('WhatsApp Cloud API no está configurado');
  }

  const url = `${GRAPH_API_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const body = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Error al marcar mensaje como leído:', data.error);
      throw new Error(data.error?.message || 'Error al marcar mensaje como leído');
    }

    return { success: true };

  } catch (error) {
    logger.error('Error en marcarComoLeido:', error);
    throw error;
  }
}

module.exports = {
  isConfigured,
  formatearTelefono,
  enviarMensajeTexto,
  enviarMensajeTemplate,
  verificarWebhook,
  procesarWebhook,
  marcarComoLeido
};

