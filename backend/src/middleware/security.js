/**
 * Middleware de seguridad
 */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiting general para todas las rutas
// Aumentado para permitir uso normal del sistema (dashboard, listas, etc.)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Máximo 500 requests por IP en 15 minutos (aumentado de 100)
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Excluir rutas que tienen su propio rate limiter
  skip: (req) => {
    return req.path.startsWith('/api/mensajes') || 
           req.path.startsWith('/api/fotos') ||
           req.path.startsWith('/api/auth') ||
           req.path.startsWith('/api/leaks'); // Excluir leaks porque tiene su propio limiter más permisivo
  }
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

// Rate limiting muy permisivo para mensajes/chat (necesita polling frecuente)
const mensajesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // Máximo 300 requests por minuto (muy permisivo para chat en tiempo real)
  message: {
    error: 'Demasiadas solicitudes de mensajes',
    message: 'Has excedido el límite de solicitudes de mensajes. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting permisivo para leaks (múltiples vendedores, auto-refresh, etc.)
const leaksLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 500, // Máximo 500 requests por minuto (aumentado para múltiples vendedores y auto-refresh)
  message: {
    error: 'Demasiadas solicitudes de leaks',
    message: 'Has excedido el límite de solicitudes. Por favor espera un momento antes de intentar nuevamente.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usar keyGenerator para diferenciar por usuario autenticado si es posible
  keyGenerator: (req) => {
    // Si hay usuario autenticado, usar su ID, sino usar IP con helper para IPv6
    if (req.user?.id) {
      return `leaks:${req.user.id}`;
    }
    // Usar el helper de express-rate-limit para manejar IPv6 correctamente
    return ipKeyGenerator(req);
  },
  // No contar requests que fallan con 429 (evitar que se acumulen)
  skip: (req) => {
    // Esto se maneja en el handler de errores
    return false;
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  fotosLimiter,
  mensajesLimiter,
  leaksLimiter
};

