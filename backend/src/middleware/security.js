/**
 * Middleware de seguridad
 */

const rateLimit = require('express-rate-limit');

// Rate limiting general para todas las rutas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP en 15 minutos
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para autenticación (protección contra fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de login',
    message: 'Has excedido el límite de intentos de login. Por favor intenta en 15 minutos.'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para creación de recursos (prevenir spam)
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Máximo 50 creaciones por hora
  message: {
    error: 'Límite de creación excedido',
    message: 'Has excedido el límite de creación de recursos. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más permisivo para fotos (muchas imágenes se cargan a la vez)
const fotosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // Máximo 200 requests por minuto (muy permisivo para galerías)
  message: {
    error: 'Demasiadas solicitudes de fotos',
    message: 'Has excedido el límite de solicitudes de fotos. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No aplicar rate limiting a archivos estáticos de imágenes
    return req.path.startsWith('/fotos/servicios');
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  fotosLimiter
};

