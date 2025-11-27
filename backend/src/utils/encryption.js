/**
 * Utilidades de encriptación para tokens sensibles
 */

const crypto = require('crypto');

// Clave de encriptación desde variables de entorno
// CRÍTICO: En producción, ENCRYPTION_KEY debe estar configurada
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validar configuración al cargar el módulo
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_KEY es requerida en producción. Configure la variable de entorno.');
}

// En desarrollo, generar una clave temporal con advertencia
const EFFECTIVE_KEY = ENCRYPTION_KEY || (() => {
  console.warn('⚠️ ADVERTENCIA: Usando clave de encriptación temporal. Configure ENCRYPTION_KEY en .env');
  return crypto.randomBytes(32).toString('hex');
})();

/**
 * Generar una clave de encriptación segura
 * @returns {string} Clave hexadecimal de 64 caracteres
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encriptar texto
 * @param {string} text - Texto a encriptar
 * @returns {string} Texto encriptado en formato hex:iv
 */
function encrypt(text) {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(EFFECTIVE_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    // Log estructurado sin exponer detalles sensibles
    const logger = require('./logger');
    logger.error('Error en encriptación', { errorType: error.name });
    return null;
  }
}

/**
 * Desencriptar texto
 * @param {string} encryptedText - Texto encriptado en formato hex:iv
 * @returns {string} Texto desencriptado
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return null;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(EFFECTIVE_KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Log estructurado sin exponer detalles sensibles
    const logger = require('./logger');
    logger.error('Error en desencriptación', { errorType: error.name });
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
};

