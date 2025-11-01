/**
 * Utilidades para generar códigos únicos
 */

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
 * Generar código de acceso para cliente
 * Formato: CLI-CONTRATOXXXX-RANDOMXXXX
 */
const generarCodigoAccesoCliente = (contratoId) => {
  const contratoNum = String(contratoId).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  
  return `CLI-${contratoNum}-${random}${timestamp}`;
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
 * Generar código de referencia para pago
 * Formato: PAG-YYYYMMDD-CONTRATOXXXX-RANDOM
 */
const generarCodigoReferenciaPago = (contratoId) => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const contratoNum = String(contratoId).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
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

