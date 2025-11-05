/**
 * Utilidades para manejo de JWT
 */

const jwt = require('jsonwebtoken');

/**
 * Generar token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * Verificar token JWT
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Decodificar token sin verificar (útil para debugging)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Generar token para vendedor
 */
const generateVendedorToken = (vendedor) => {
  return generateToken({
    id: vendedor.id,
    tipo: 'vendedor',
    codigoVendedor: vendedor.codigo_vendedor,
    email: vendedor.email
  });
};

/**
 * Generar token para cliente
 */
const generateClienteToken = (cliente, contrato) => {
  return generateToken({
    id: cliente.id,
    tipo: 'cliente',
    codigoAcceso: contrato.codigo_acceso_cliente,
    contratoId: contrato.id,
    email: cliente.email
  });
};

/**
 * Generar token para manager
 */
const generateManagerToken = (manager) => {
  return generateToken({
    id: manager.id,
    tipo: 'manager',
    codigoManager: manager.codigo_manager,
    email: manager.email
  });
};

/**
 * Generar token para gerente
 */
const generateGerenteToken = (gerente) => {
  return generateToken({
    id: gerente.id,
    tipo: 'gerente',
    codigoGerente: gerente.codigo_gerente,
    email: gerente.email
  });
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateVendedorToken,
  generateClienteToken,
  generateManagerToken,
  generateGerenteToken
};
