/**
 * ============================================
 * SERVICIO DE GMAIL - GOOGLE API
 * ============================================
 * Funciones para enviar y recibir emails
 * Reutiliza la autenticación OAuth existente de Google Calendar
 */

const { google } = require('googleapis');
const logger = require('../utils/logger');
const { getPrismaClient } = require('../config/database');
const {
  createOAuth2Client,
  createAuthenticatedClient,
  refreshAccessToken
} = require('../utils/googleCalendarOAuth');

const prisma = getPrismaClient();

// Scopes adicionales para Gmail (además de los de Calendar)
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

/**
 * Verificar si el servicio OAuth de Google está configurado
 * @returns {boolean}
 */
function isConfigured() {
  return !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

/**
 * Obtener cliente de Gmail autenticado para un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Object>} Cliente de Gmail autenticado
 */
async function getGmailClient(usuarioId) {
  try {
    // Obtener usuario con tokens de Google
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        google_access_token: true,
        google_refresh_token: true,
        google_token_expires_at: true,
        google_calendar_sync_enabled: true
      }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (!usuario.google_access_token || !usuario.google_refresh_token) {
      throw new Error('Usuario no ha conectado su cuenta de Google. Por favor, conecta tu cuenta primero.');
    }

    // Verificar si el token está expirado
    let accessToken = usuario.google_access_token;
    const expiresAt = usuario.google_token_expires_at;
    const now = new Date();

    if (expiresAt && new Date(expiresAt) <= now) {
      logger.info('Token de Google expirado, refrescando...', { usuarioId });
      
      try {
        const newTokens = await refreshAccessToken(usuario.google_refresh_token);
        accessToken = newTokens.access_token;

        // Actualizar tokens en la base de datos
        await prisma.usuarios.update({
          where: { id: usuarioId },
          data: {
            google_access_token: accessToken,
            google_token_expires_at: new Date(newTokens.expiry_date)
          }
        });
      } catch (refreshError) {
        logger.error('Error al refrescar token de Google:', refreshError);
        throw new Error('Sesión de Google expirada. Por favor, reconecta tu cuenta de Google.');
      }
    }

    // Crear cliente autenticado
    const authClient = createAuthenticatedClient(accessToken, usuario.google_refresh_token);
    if (!authClient) {
      throw new Error('No se pudo crear cliente OAuth de Google');
    }

    // Crear cliente de Gmail
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    return gmail;

  } catch (error) {
    logger.error('Error al obtener cliente de Gmail:', error);
    throw error;
  }
}

/**
 * Obtener bandeja de entrada del usuario
 * @param {number} usuarioId - ID del usuario
 * @param {number} maxResults - Número máximo de resultados (default: 20)
 * @param {string} query - Query de búsqueda (opcional)
 * @returns {Promise<Array>} Lista de emails
 */
async function obtenerBandeja(usuarioId, maxResults = 20, query = '') {
  const gmail = await getGmailClient(usuarioId);

  try {
    // Listar mensajes
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: query || 'in:inbox'
    });

    const messages = listResponse.data.messages || [];
    
    if (messages.length === 0) {
      return [];
    }

    // Obtener detalles de cada mensaje
    const emailsPromises = messages.map(async (msg) => {
      try {
        const emailData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        });

        const headers = emailData.data.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: emailData.data.id,
          threadId: emailData.data.threadId,
          snippet: emailData.data.snippet,
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          labelIds: emailData.data.labelIds || [],
          isUnread: (emailData.data.labelIds || []).includes('UNREAD')
        };
      } catch (error) {
        logger.error('Error al obtener email:', { messageId: msg.id, error: error.message });
        return null;
      }
    });

    const emails = (await Promise.all(emailsPromises)).filter(e => e !== null);

    logger.info('Bandeja de entrada obtenida', { usuarioId, count: emails.length });

    return emails;

  } catch (error) {
    logger.error('Error al obtener bandeja de entrada:', error);
    throw error;
  }
}

/**
 * Obtener un email específico con su contenido completo
 * @param {number} usuarioId - ID del usuario
 * @param {string} emailId - ID del email
 * @returns {Promise<Object>} Email con contenido
 */
async function obtenerEmail(usuarioId, emailId) {
  const gmail = await getGmailClient(usuarioId);

  try {
    const emailData = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full'
    });

    const headers = emailData.data.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    // Extraer el cuerpo del mensaje
    let body = '';
    const payload = emailData.data.payload;

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf8');
    } else if (payload.parts) {
      // Buscar la parte de texto plano o HTML
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
      } else if (htmlPart?.body?.data) {
        body = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
      } else {
        // Buscar recursivamente en partes anidadas
        const findBody = (parts) => {
          for (const part of parts) {
            if (part.body?.data) {
              return Buffer.from(part.body.data, 'base64').toString('utf8');
            }
            if (part.parts) {
              const nestedBody = findBody(part.parts);
              if (nestedBody) return nestedBody;
            }
          }
          return '';
        };
        body = findBody(payload.parts);
      }
    }

    // Extraer adjuntos
    const attachments = [];
    const extractAttachments = (parts) => {
      if (!parts) return;
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId
          });
        }
        if (part.parts) {
          extractAttachments(part.parts);
        }
      }
    };
    extractAttachments(payload.parts);

    return {
      id: emailData.data.id,
      threadId: emailData.data.threadId,
      snippet: emailData.data.snippet,
      from: getHeader('From'),
      to: getHeader('To'),
      cc: getHeader('Cc'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      body: body,
      bodyHtml: payload.mimeType === 'text/html' || payload.parts?.find(p => p.mimeType === 'text/html') ? body : null,
      labelIds: emailData.data.labelIds || [],
      isUnread: (emailData.data.labelIds || []).includes('UNREAD'),
      attachments: attachments
    };

  } catch (error) {
    logger.error('Error al obtener email:', { emailId, error: error.message });
    throw error;
  }
}

/**
 * Enviar un email
 * @param {number} usuarioId - ID del usuario
 * @param {string} destinatario - Email del destinatario
 * @param {string} asunto - Asunto del email
 * @param {string} cuerpo - Cuerpo del email (puede ser HTML)
 * @param {string} cc - CC (opcional)
 * @param {string} bcc - BCC (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
async function enviarEmail(usuarioId, destinatario, asunto, cuerpo, cc = '', bcc = '') {
  const gmail = await getGmailClient(usuarioId);

  try {
    // Obtener el email del usuario para el campo From
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { email: true, nombre_completo: true }
    });

    // Construir el mensaje en formato MIME
    const messageParts = [
      `From: ${usuario.nombre_completo} <${usuario.email}>`,
      `To: ${destinatario}`,
      `Subject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64'
    ];

    if (cc) {
      messageParts.splice(2, 0, `Cc: ${cc}`);
    }
    if (bcc) {
      messageParts.splice(cc ? 3 : 2, 0, `Bcc: ${bcc}`);
    }

    messageParts.push('', Buffer.from(cuerpo).toString('base64'));

    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    logger.info('Email enviado exitosamente', {
      usuarioId,
      to: destinatario,
      subject: asunto,
      messageId: response.data.id
    });

    return {
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
      to: destinatario,
      subject: asunto
    };

  } catch (error) {
    logger.error('Error al enviar email:', error);
    throw error;
  }
}

/**
 * Marcar un email como leído
 * @param {number} usuarioId - ID del usuario
 * @param {string} emailId - ID del email
 * @returns {Promise<Object>} Resultado
 */
async function marcarComoLeido(usuarioId, emailId) {
  const gmail = await getGmailClient(usuarioId);

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });

    logger.info('Email marcado como leído', { usuarioId, emailId });

    return { success: true, emailId };

  } catch (error) {
    logger.error('Error al marcar email como leído:', error);
    throw error;
  }
}

/**
 * Marcar un email como no leído
 * @param {number} usuarioId - ID del usuario
 * @param {string} emailId - ID del email
 * @returns {Promise<Object>} Resultado
 */
async function marcarComoNoLeido(usuarioId, emailId) {
  const gmail = await getGmailClient(usuarioId);

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: ['UNREAD']
      }
    });

    logger.info('Email marcado como no leído', { usuarioId, emailId });

    return { success: true, emailId };

  } catch (error) {
    logger.error('Error al marcar email como no leído:', error);
    throw error;
  }
}

/**
 * Responder a un email
 * @param {number} usuarioId - ID del usuario
 * @param {string} emailId - ID del email original
 * @param {string} cuerpo - Cuerpo de la respuesta
 * @returns {Promise<Object>} Resultado del envío
 */
async function responderEmail(usuarioId, emailId, cuerpo) {
  const gmail = await getGmailClient(usuarioId);

  try {
    // Obtener el email original
    const emailOriginal = await obtenerEmail(usuarioId, emailId);

    // Extraer el email del remitente
    const fromMatch = emailOriginal.from.match(/<(.+)>/) || [null, emailOriginal.from];
    const destinatario = fromMatch[1];

    // Construir el asunto de respuesta
    const asuntoOriginal = emailOriginal.subject || '';
    const asunto = asuntoOriginal.startsWith('Re:') ? asuntoOriginal : `Re: ${asuntoOriginal}`;

    // Obtener info del usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { email: true, nombre_completo: true }
    });

    // Construir el mensaje con referencias al hilo
    const messageParts = [
      `From: ${usuario.nombre_completo} <${usuario.email}>`,
      `To: ${destinatario}`,
      `Subject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=`,
      `In-Reply-To: ${emailId}`,
      `References: ${emailId}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(cuerpo).toString('base64')
    ];

    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: emailOriginal.threadId
      }
    });

    logger.info('Respuesta de email enviada', {
      usuarioId,
      to: destinatario,
      originalEmailId: emailId,
      newMessageId: response.data.id
    });

    return {
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
      to: destinatario,
      subject: asunto
    };

  } catch (error) {
    logger.error('Error al responder email:', error);
    throw error;
  }
}

/**
 * Buscar emails
 * @param {number} usuarioId - ID del usuario
 * @param {string} query - Query de búsqueda de Gmail
 * @param {number} maxResults - Número máximo de resultados
 * @returns {Promise<Array>} Lista de emails encontrados
 */
async function buscarEmails(usuarioId, query, maxResults = 20) {
  return obtenerBandeja(usuarioId, maxResults, query);
}

/**
 * Obtener los scopes de Gmail necesarios
 * @returns {Array} Array de scopes
 */
function getGmailScopes() {
  return GMAIL_SCOPES;
}

module.exports = {
  isConfigured,
  getGmailClient,
  obtenerBandeja,
  obtenerEmail,
  enviarEmail,
  marcarComoLeido,
  marcarComoNoLeido,
  responderEmail,
  buscarEmails,
  getGmailScopes
};

