/**
 * Utilidades para formatear datos
 */

/**
 * Formatea una hora desde ISO string o formato HH:MM a formato legible
 * @param {string} isoString - Hora en formato ISO o HH:MM
 * @returns {string} Hora formateada (ej: "8:00 p.m." o "1:00 a.m.")
 */
export const formatearHora = (isoString) => {
  if (!isoString) return 'N/A';
  
  try {
    // Si es un string ISO completo, extraer solo la hora
    const fecha = new Date(isoString);
    
    // Verificar si es una fecha válida
    if (!isNaN(fecha.getTime())) {
      const horas = fecha.getHours();
      const minutos = fecha.getMinutes();
      const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = horas % 12 || 12;
      return `${hour12}:${String(minutos).padStart(2, '0')} ${ampm}`;
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
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
  }
  
  return isoString;
};

/**
 * Calcula la duración entre dos horas
 * @param {string} horaInicio - Hora de inicio en formato HH:MM o ISO
 * @param {string} horaFin - Hora de fin en formato HH:MM o ISO
 * @returns {number} Duración en horas (puede ser decimal)
 */
export const calcularDuracion = (horaInicio, horaFin) => {
  if (!horaInicio || !horaFin) return 0;
  
  try {
    let horaInicioStr, horaFinStr;
    
    // Si es un objeto Date, convertir a string
    if (horaInicio instanceof Date) {
      const h = horaInicio.getHours();
      const m = horaInicio.getMinutes();
      horaInicioStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (typeof horaInicio === 'string') {
      // Si viene como "1970-01-01T16:00:00.000Z" o similar, extraer solo HH:mm
      if (horaInicio.includes('T')) {
        const match = horaInicio.match(/(\d{2}):(\d{2})/);
        if (match) {
          horaInicioStr = `${match[1]}:${match[2]}`;
        } else {
          horaInicioStr = horaInicio.slice(0, 5);
        }
      } else {
        horaInicioStr = horaInicio.slice(0, 5);
      }
    } else {
      return 0;
    }
    
    if (horaFin instanceof Date) {
      const h = horaFin.getHours();
      const m = horaFin.getMinutes();
      horaFinStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (typeof horaFin === 'string') {
      if (horaFin.includes('T')) {
        const match = horaFin.match(/(\d{2}):(\d{2})/);
        if (match) {
          horaFinStr = `${match[1]}:${match[2]}`;
        } else {
          horaFinStr = horaFin.slice(0, 5);
        }
      } else {
        horaFinStr = horaFin.slice(0, 5);
      }
    } else {
      return 0;
    }
    
    // Validar formato HH:mm
    if (!/^\d{2}:\d{2}$/.test(horaInicioStr) || !/^\d{2}:\d{2}$/.test(horaFinStr)) {
      return 0;
    }
    
    const [hInicio, mInicio] = horaInicioStr.split(':').map(Number);
    const [hFin, mFin] = horaFinStr.split(':').map(Number);
    
    let horas = hFin - hInicio;
    let minutos = mFin - mInicio;
    
    // Ajustar si los minutos son negativos
    if (minutos < 0) {
      horas -= 1;
      minutos += 60;
    }
    
    // Si la hora de fin es menor que la de inicio, significa que cruza medianoche
    if (horas < 0) {
      horas += 24;
    }
    
    const duracionTotal = horas + (minutos / 60);
    return duracionTotal;
  } catch (e) {
    console.error('Error calculando duración:', e, { horaInicio, horaFin });
    return 0;
  }
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



