/**
 * Middleware de autenticación JWT
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { UnauthorizedError } = require('./errorHandler');

const prisma = new PrismaClient();

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

    // Si es cliente, validar que el código de acceso no haya expirado
    if (decoded.tipo === 'cliente' && decoded.codigoAcceso) {
      const contrato = await prisma.contratos.findUnique({
        where: { codigo_acceso_cliente: decoded.codigoAcceso },
        select: {
          estado: true,
          fecha_evento: true
        }
      });

      if (!contrato) {
        throw new UnauthorizedError('Código de acceso inválido');
      }

      // Verificar que el contrato esté activo
      if (contrato.estado !== 'activo') {
        throw new UnauthorizedError('El contrato no está activo');
      }

      // Validar que el código no haya expirado (30 días después del evento)
      if (contrato.fecha_evento) {
        const fechaEvento = new Date(contrato.fecha_evento);
        const fechaActual = new Date();
        const diasDespuesEvento = 30;
        
        const fechaExpiracion = new Date(fechaEvento);
        fechaExpiracion.setDate(fechaExpiracion.getDate() + diasDespuesEvento);
        
        if (fechaActual > fechaExpiracion) {
          throw new UnauthorizedError(
            `El código de acceso ha expirado. El evento fue el ${fechaEvento.toLocaleDateString('es-ES')} y el código expiró el ${fechaExpiracion.toLocaleDateString('es-ES')}. Por favor, contacta a tu vendedor para obtener un nuevo código.`
          );
        }
      }
    }

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
 * Verificar que el usuario sea manager
 */
const requireManager = (req, res, next) => {
  if (req.user.tipo !== 'manager') {
    return next(new UnauthorizedError('Acceso solo para managers'));
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
  requireManager,
  requireOwnerOrVendedor,
  optionalAuth
};

