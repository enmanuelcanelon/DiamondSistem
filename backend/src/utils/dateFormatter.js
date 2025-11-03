/**
 * Utilidades para manejar fechas de forma consistente
 * Todas las fechas se guardan en formato YYYY-MM-DD
 */

/**
 * Convierte cualquier formato de fecha a YYYY-MM-DD
 * @param {Date|string} fecha - Fecha en cualquier formato
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
function formatearFechaSQL(fecha) {
  if (!fecha) return null;

  let date;
  
  // Si ya es un objeto Date
  if (fecha instanceof Date) {
    date = fecha;
  } else {
    // Convertir string a Date
    date = new Date(fecha);
  }

  // Verificar que la fecha es válida
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${fecha}`);
  }

  // Extraer año, mes, día
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convierte un string de tiempo a formato HH:MM:SS
 * @param {string} tiempo - Tiempo en cualquier formato
 * @returns {string} - Tiempo en formato HH:MM:SS
 */
function formatearTiempoSQL(tiempo) {
  if (!tiempo) return null;

  // Si ya viene en formato correcto (HH:MM:SS o HH:MM)
  if (tiempo.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
    return tiempo.length === 5 ? `${tiempo}:00` : tiempo;
  }

  // Si es un objeto Date
  if (tiempo instanceof Date) {
    const hours = String(tiempo.getHours()).padStart(2, '0');
    const minutes = String(tiempo.getMinutes()).padStart(2, '0');
    const seconds = String(tiempo.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  // Intentar parsear como Date
  const date = new Date(tiempo);
  if (!isNaN(date.getTime())) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  throw new Error(`Tiempo inválido: ${tiempo}`);
}

/**
 * Normaliza datos de fecha/hora para guardar en la BD
 * @param {Object} datos - Objeto con campos de fecha/hora
 * @returns {Object} - Objeto con fechas normalizadas
 */
function normalizarFechas(datos) {
  const normalized = { ...datos };

  // Campos de fecha
  const camposFecha = [
    'fecha_evento',
    'fecha_inicio',
    'fecha_fin',
    'fecha_nacimiento',
    'fecha_pago',
    'fecha_creacion',
    'fecha_actualizacion',
  ];

  // Campos de tiempo
  const camposTiempo = [
    'hora_inicio',
    'hora_fin',
  ];

  // Normalizar fechas
  camposFecha.forEach(campo => {
    if (normalized[campo]) {
      try {
        normalized[campo] = formatearFechaSQL(normalized[campo]);
      } catch (error) {
        console.error(`Error al normalizar ${campo}:`, error.message);
        throw error;
      }
    }
  });

  // Normalizar tiempos
  camposTiempo.forEach(campo => {
    if (normalized[campo]) {
      try {
        normalized[campo] = formatearTiempoSQL(normalized[campo]);
      } catch (error) {
        console.error(`Error al normalizar ${campo}:`, error.message);
        throw error;
      }
    }
  });

  return normalized;
}

module.exports = {
  formatearFechaSQL,
  formatearTiempoSQL,
  normalizarFechas,
};

