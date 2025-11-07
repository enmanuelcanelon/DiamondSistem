/**
 * Utilidades para formatear datos
 */

/**
 * Formatea una hora desde ISO string o formato HH:MM a formato legible
 * @param {string} isoString - Hora en formato ISO o HH:MM
 * @returns {string} Hora formateada (ej: "2:00 PM")
 */
export const formatearHora = (isoString) => {
  if (!isoString) return 'N/A';
  
  try {
    // Si es un string ISO completo, extraer solo la hora
    const fecha = new Date(isoString);
    
    // Verificar si es una fecha válida
    if (!isNaN(fecha.getTime())) {
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    // Continuar con el siguiente intento
  }
  
  // Si falla o es formato "HH:MM", extraer hora directamente
  if (typeof isoString === 'string' && isoString.includes(':')) {
    const parts = isoString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1]?.substring(0, 2) || '00';
    
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
  }
  
  return isoString;
};

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada (ej: "$1,234.56")
 */
export const formatearMoneda = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(amount));
};

/**
 * Formatea una fecha
 * @param {string} dateString - Fecha en formato ISO
 * @param {object} options - Opciones de formateo
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', defaultOptions);
};

/**
 * Formatea fecha y hora juntas
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha y hora formateadas
 */
export const formatearFechaHora = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};



