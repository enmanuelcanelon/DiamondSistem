/**
 * Utilidades de encriptación para tokens sensibles
 */

const crypto = require('crypto');

// Clave de encriptación desde variables de entorno
// Si no existe, usar una clave por defecto (solo para desarrollo)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

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
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error al encriptar:', error);
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
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
};

