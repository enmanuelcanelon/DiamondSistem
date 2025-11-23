/**
 * ============================================
 * MIDDLEWARE DE CACHÉ SIMPLE EN MEMORIA
 * ============================================
 * Caché para datos semi-estáticos que no cambian frecuentemente
 * TTL configurable por tipo de dato
 */

const logger = require('../utils/logger');

// Almacenamiento en memoria del caché
const cacheStore = new Map();

/**
 * Estructura de entrada del caché:
 * {
 *   data: any,
 *   expiresAt: number (timestamp)
 * }
 */

/**
 * Obtener datos del caché
 * @param {string} key - Clave del caché
 * @returns {any|null} - Datos en caché o null si expiró/no existe
 */
const get = (key) => {
  const entry = cacheStore.get(key);
  
  if (!entry) {
    return null;
  }

  // Verificar si expiró
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.data;
};

/**
 * Guardar datos en caché
 * @param {string} key - Clave del caché
 * @param {any} data - Datos a guardar
 * @param {number} ttlSeconds - Tiempo de vida en segundos (default: 300 = 5 minutos)
 */
const set = (key, data, ttlSeconds = 300) => {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  cacheStore.set(key, {
    data,
    expiresAt
  });
};

/**
 * Eliminar entrada del caché
 * @param {string} key - Clave del caché
 */
const del = (key) => {
  cacheStore.delete(key);
};

/**
 * Limpiar todo el caché
 */
const clear = () => {
  cacheStore.clear();
};

/**
 * Invalidar todas las entradas que coincidan con un patrón
 * @param {string} pattern - Patrón a buscar (usando includes)
 */
const invalidatePattern = (pattern) => {
  const keysToDelete = [];
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cacheStore.delete(key));
};

/**
 * Middleware para Express que agrega caché a rutas
 * @param {number} ttlSeconds - Tiempo de vida en segundos
 * @returns {Function} - Middleware de Express
 */
const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generar clave del caché basada en la URL y query params
    const cacheKey = `route:${req.originalUrl}`;
    const cachedData = get(cacheKey);

    if (cachedData !== null) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Guardar la función json original
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para guardar en caché antes de enviar
    res.json = function(data) {
      // Solo cachear respuestas exitosas
      if (res.statusCode === 200) {
        set(cacheKey, data, ttlSeconds);
        logger.debug(`Cache set: ${cacheKey} (TTL: ${ttlSeconds}s)`);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Limpiar entradas expiradas del caché (ejecutar periódicamente)
 */
const cleanup = () => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiresAt) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cacheStore.delete(key));
  
  if (keysToDelete.length > 0) {
    logger.debug(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
  }
};

// Limpiar caché cada 5 minutos
setInterval(cleanup, 5 * 60 * 1000);

module.exports = {
  get,
  set,
  del,
  clear,
  invalidatePattern,
  cacheMiddleware,
  cleanup
};

