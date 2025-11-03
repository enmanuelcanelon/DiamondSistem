/**
 * Middleware para manejo centralizado de errores
 */

const errorHandler = (err, req, res, next) => {
  // Log del error (en producción usar un servicio de logging profesional)
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflicto',
      message: 'Ya existe un registro con esos datos únicos',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'No encontrado',
      message: 'El registro solicitado no existe'
    });
  }

  if (err.code?.startsWith('P')) {
    return res.status(400).json({
      error: 'Error de base de datos',
      message: 'Ocurrió un error al procesar la solicitud',
      code: err.code
    });
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message,
      details: err.details
    });
  }

  // Errores de autenticación
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Token inválido o expirado'
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Crear errores personalizados
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Acceso prohibido') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends Error {
  constructor(message = 'Recurso no encontrado') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};



