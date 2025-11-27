/**
 * Utilidades para manejo de JWT con Refresh Tokens
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuración de tiempos de expiración
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';  // Token de acceso: 15 minutos
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d'; // Refresh token: 7 días

// Store en memoria para refresh tokens (en producción usar Redis)
// Formato: { refreshToken: { userId, userType, createdAt, expiresAt } }
const refreshTokenStore = new Map();

// Limpiar tokens expirados cada hora
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of refreshTokenStore.entries()) {
    if (data.expiresAt < now) {
      refreshTokenStore.delete(token);
    }
  }
}, 60 * 60 * 1000); // Cada hora

/**
 * Generar token JWT de acceso (corta duración)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    { ...payload, tokenType: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
};

/**
 * Generar refresh token (larga duración)
 * Usa crypto para generar un token único y lo almacena
 */
const generateRefreshToken = (userId, userType) => {
  const refreshToken = crypto.randomBytes(64).toString('hex');

  // Calcular fecha de expiración
  const expiresIn = parseExpiration(REFRESH_TOKEN_EXPIRES);
  const expiresAt = Date.now() + expiresIn;

  // Almacenar en memoria (en producción usar Redis/DB)
  refreshTokenStore.set(refreshToken, {
    userId,
    userType,
    createdAt: Date.now(),
    expiresAt
  });

  return refreshToken;
};

/**
 * Parsear string de expiración a milisegundos
 */
const parseExpiration = (expStr) => {
  const match = expStr.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default: 7 días

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

/**
 * Verificar refresh token
 */
const verifyRefreshToken = (refreshToken) => {
  const data = refreshTokenStore.get(refreshToken);

  if (!data) {
    return null;
  }

  // Verificar si expiró
  if (data.expiresAt < Date.now()) {
    refreshTokenStore.delete(refreshToken);
    return null;
  }

  return data;
};

/**
 * Revocar refresh token (logout)
 */
const revokeRefreshToken = (refreshToken) => {
  return refreshTokenStore.delete(refreshToken);
};

/**
 * Revocar todos los refresh tokens de un usuario
 */
const revokeAllUserTokens = (userId, userType) => {
  let count = 0;
  for (const [token, data] of refreshTokenStore.entries()) {
    if (data.userId === userId && data.userType === userType) {
      refreshTokenStore.delete(token);
      count++;
    }
  }
  return count;
};

/**
 * Generar token JWT (legacy - mantiene compatibilidad)
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
 * Generar par de tokens (access + refresh)
 */
const generateTokenPair = (payload, userId, userType) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(userId, userType);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES
  };
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
 * Generar tokens para vendedor (nuevo sistema con refresh)
 */
const generateVendedorTokens = (vendedor) => {
  const payload = {
    id: vendedor.id,
    tipo: 'vendedor',
    codigoVendedor: vendedor.codigo_vendedor || vendedor.codigo_usuario,
    email: vendedor.email
  };
  return generateTokenPair(payload, vendedor.id, 'vendedor');
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
 * Generar tokens para cliente (nuevo sistema con refresh)
 */
const generateClienteTokens = (cliente, contrato) => {
  const payload = {
    id: cliente.id,
    tipo: 'cliente',
    codigoAcceso: contrato.codigo_acceso_cliente,
    contratoId: contrato.id,
    email: cliente.email
  };
  return generateTokenPair(payload, cliente.id, 'cliente');
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
 * Generar tokens para manager (nuevo sistema con refresh)
 */
const generateManagerTokens = (manager) => {
  const payload = {
    id: manager.id,
    tipo: 'manager',
    codigoManager: manager.codigo_manager || manager.codigo_usuario,
    email: manager.email
  };
  return generateTokenPair(payload, manager.id, 'manager');
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

/**
 * Generar tokens para gerente (nuevo sistema con refresh)
 */
const generateGerenteTokens = (gerente) => {
  const payload = {
    id: gerente.id,
    tipo: 'gerente',
    codigoGerente: gerente.codigo_gerente || gerente.codigo_usuario,
    email: gerente.email
  };
  return generateTokenPair(payload, gerente.id, 'gerente');
};

/**
 * Generar token para usuario de inventario
 */
const generateInventarioToken = (usuario) => {
  return generateToken({
    id: usuario.id,
    tipo: 'inventario',
    codigoUsuario: usuario.codigo_usuario,
    email: usuario.email
  });
};

/**
 * Generar tokens para inventario (nuevo sistema con refresh)
 */
const generateInventarioTokens = (usuario) => {
  const payload = {
    id: usuario.id,
    tipo: 'inventario',
    codigoUsuario: usuario.codigo_usuario,
    email: usuario.email
  };
  return generateTokenPair(payload, usuario.id, 'inventario');
};

/**
 * Generar token para usuario unificado (función original)
 */
const generateUsuarioToken = (usuario) => {
  return generateToken({
    id: usuario.id,
    tipo: usuario.rol,
    codigoUsuario: usuario.codigo_usuario,
    email: usuario.email
  });
};

/**
 * Generar tokens para usuario unificado (nuevo sistema con refresh)
 */
const generateUsuarioTokens = (usuario) => {
  const payload = {
    id: usuario.id,
    tipo: usuario.rol,
    codigoUsuario: usuario.codigo_usuario,
    email: usuario.email
  };
  return generateTokenPair(payload, usuario.id, usuario.rol);
};

module.exports = {
  // Funciones legacy (compatibilidad)
  generateToken,
  verifyToken,
  decodeToken,
  generateVendedorToken,
  generateClienteToken,
  generateManagerToken,
  generateGerenteToken,
  generateInventarioToken,
  generateUsuarioToken,

  // Nuevas funciones con refresh tokens
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateTokenPair,
  generateVendedorTokens,
  generateClienteTokens,
  generateManagerTokens,
  generateGerenteTokens,
  generateInventarioTokens,
  generateUsuarioTokens,

  // Constantes exportadas
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES
};
