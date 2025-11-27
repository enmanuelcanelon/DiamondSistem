/**
 * Utilidades para generar códigos únicos
 * NOTA: Usa crypto.randomBytes para seguridad criptográfica
 */
const crypto = require('crypto');

/**
 * Generar bytes aleatorios seguros en formato hexadecimal
 * @param {number} length - Longitud de caracteres deseados
 * @returns {string} String aleatorio seguro
 */
const generarRandomSeguro = (length = 8) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
};

/**
 * Generar código de oferta
 * Formato: OF-YYYY-MM-XXXX
 */
const generarCodigoOferta = (ultimoId = 0) => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const numero = String(ultimoId + 1).padStart(4, '0');

  return `OF-${año}-${mes}-${numero}`;
};

/**
 * Generar código de contrato
 * Formato: CONT-YYYY-MM-XXXX
 */
const generarCodigoContrato = (ultimoId = 0) => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const numero = String(ultimoId + 1).padStart(4, '0');

  return `CONT-${año}-${mes}-${numero}`;
};

/**
 * Generar código de acceso para cliente (SEGURO)
 * Formato: CLI-CONTRATOXXXX-RANDOMXXXXXXXXXXXX
 * Usa crypto.randomBytes para evitar colisiones
 */
const generarCodigoAccesoCliente = (contratoId) => {
  const contratoNum = String(contratoId).padStart(4, '0');
  // 16 caracteres aleatorios criptográficamente seguros
  const random = generarRandomSeguro(16);

  return `CLI-${contratoNum}-${random}`;
};

/**
 * Generar código de vendedor
 * Formato: VEND-XXX
 */
const generarCodigoVendedor = (ultimoId = 0) => {
  const numero = String(ultimoId + 1).padStart(3, '0');
  return `VEND${numero}`;
};

/**
 * Generar código de referencia para pago (SEGURO)
 * Formato: PAG-YYYYMMDD-CONTRATOXXXX-RANDOM
 * Usa crypto.randomBytes para evitar colisiones
 */
const generarCodigoReferenciaPago = (contratoId) => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const contratoNum = String(contratoId).padStart(4, '0');
  const random = generarRandomSeguro(6);

  return `PAG-${año}${mes}${dia}-${contratoNum}-${random}`;
};

/**
 * Validar formato de código de oferta
 */
const validarCodigoOferta = (codigo) => {
  const regex = /^OF-\d{4}-\d{2}-\d{4}$/;
  return regex.test(codigo);
};

/**
 * Validar formato de código de contrato
 */
const validarCodigoContrato = (codigo) => {
  const regex = /^CONT-\d{4}-\d{2}-\d{4}$/;
  return regex.test(codigo);
};

/**
 * Validar formato de código de acceso cliente
 */
const validarCodigoAccesoCliente = (codigo) => {
  const regex = /^CLI-\d{4}-[A-Z0-9]+$/;
  return regex.test(codigo);
};

/**
 * Validar formato de código de vendedor
 */
const validarCodigoVendedor = (codigo) => {
  const regex = /^VEND\d{3}$/;
  return regex.test(codigo);
};

module.exports = {
  generarCodigoOferta,
  generarCodigoContrato,
  generarCodigoAccesoCliente,
  generarCodigoVendedor,
  generarCodigoReferenciaPago,
  validarCodigoOferta,
  validarCodigoContrato,
  validarCodigoAccesoCliente,
  validarCodigoVendedor
};



