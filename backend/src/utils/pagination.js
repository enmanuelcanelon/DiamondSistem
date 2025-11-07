/**
 * ============================================
 * UTILIDADES DE PAGINACIÓN
 * ============================================
 * Funciones helper para implementar paginación consistente
 */

/**
 * Obtener parámetros de paginación desde query string
 * @param {Object} query - req.query
 * @param {Object} options - Opciones de paginación
 * @param {number} options.defaultLimit - Límite por defecto (default: 50)
 * @param {number} options.maxLimit - Límite máximo permitido (default: 100)
 * @returns {Object} { page, limit, skip }
 */
const getPaginationParams = (query, options = {}) => {
  const defaultLimit = options.defaultLimit || 50;
  const maxLimit = options.maxLimit || 1000; // Aumentado a 1000 para escalabilidad

  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || defaultLimit;

  // Validar y limitar
  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Crear respuesta de paginación
 * @param {Array} data - Datos paginados
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @returns {Object} Respuesta con metadatos de paginación
 */
const createPaginationResponse = (data, total, page, limit) => {
  return {
    success: true,
    count: data.length,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
    data
  };
};

module.exports = {
  getPaginationParams,
  createPaginationResponse
};



