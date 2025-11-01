/**
 * Middleware de autenticación JWT
 */

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('./errorHandler');

/**
 * Verificar token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Agregar usuario al request
    req.user = {
      id: decoded.id,
      tipo: decoded.tipo, // 'vendedor' o 'cliente'
      codigoVendedor: decoded.codigoVendedor,
      codigoAcceso: decoded.codigoAcceso
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Token inválido'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expirado'));
    } else {
      next(error);
    }
  }
};

/**
 * Verificar que el usuario sea vendedor
 */
const requireVendedor = (req, res, next) => {
  if (req.user.tipo !== 'vendedor') {
    return next(new UnauthorizedError('Acceso solo para vendedores'));
  }
  next();
};

/**
 * Verificar que el usuario sea cliente
 */
const requireCliente = (req, res, next) => {
  if (req.user.tipo !== 'cliente') {
    return next(new UnauthorizedError('Acceso solo para clientes'));
  }
  next();
};

/**
 * Verificar que el usuario sea el propietario del recurso o vendedor
 */
const requireOwnerOrVendedor = (paramName = 'id') => {
  return (req, res, next) => {
    const resourceId = parseInt(req.params[paramName]);
    
    // Si es vendedor, tiene acceso
    if (req.user.tipo === 'vendedor') {
      return next();
    }

    // Si es cliente, verificar que sea el propietario
    if (req.user.tipo === 'cliente' && req.user.id === resourceId) {
      return next();
    }

    next(new UnauthorizedError('No tienes permiso para acceder a este recurso'));
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero lo verifica si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id,
        tipo: decoded.tipo,
        codigoVendedor: decoded.codigoVendedor,
        codigoAcceso: decoded.codigoAcceso
      };
    }

    next();
  } catch (error) {
    // Si hay error, simplemente continuar sin usuario
    next();
  }
};

module.exports = {
  authenticate,
  requireVendedor,
  requireCliente,
  requireOwnerOrVendedor,
  optionalAuth
};

