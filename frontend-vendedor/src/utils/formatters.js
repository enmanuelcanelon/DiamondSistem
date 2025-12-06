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
      // Para eventos de Google Calendar, usar hora local (getHours)
      // Para eventos de la base de datos (que vienen como "1970-01-01T13:00:00Z"), usar UTC
      // Detectar si es un evento de Google Calendar: si la fecha es reciente (no 1970)
      const esEventoGoogleCalendar = fecha.getFullYear() > 2000;
      
      if (esEventoGoogleCalendar) {
        // Usar hora local para eventos de Google Calendar
        const horas = fecha.getHours();
        const minutos = fecha.getMinutes();
        const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
        const hour12 = horas % 12 || 12;
        return `${hour12}:${String(minutos).padStart(2, '0')} ${ampm}`;
      } else {
        // Usar UTC para eventos de la base de datos (formato "1970-01-01T13:00:00Z")
        const horas = fecha.getUTCHours();
        const minutos = fecha.getUTCMinutes();
        const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
        const hour12 = horas % 12 || 12;
        return `${hour12}:${String(minutos).padStart(2, '0')} ${ampm}`;
      }
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
    
    // Convertir ambas horas a minutos desde medianoche
    let minutosInicio = hInicio * 60 + mInicio;
    let minutosFin = hFin * 60 + mFin;
    
    // Determinar si el evento cruza medianoche
    // Caso 1: Hora de fin es <= 2 AM (0, 1, 2) y hora de inicio es >= 12 PM (mediodía)
    //         Esto indica que el evento termina en la madrugada del día siguiente
    // Caso 2: Hora de fin es menor que hora de inicio (ej: 20:00 a 05:00)
    const cruzaMedianoche = (hFin <= 2 && hInicio >= 12) || (hFin < hInicio);
    
    // Si cruza medianoche, agregar 24 horas (1440 minutos) a la hora de fin
    if (cruzaMedianoche) {
      minutosFin += 24 * 60;
    }
    
    // Calcular la diferencia en minutos y convertir a horas
    const diferenciaMinutos = minutosFin - minutosInicio;
    const duracionTotal = diferenciaMinutos / 60;
    
    // Asegurar que la duración sea positiva
    return Math.max(0, duracionTotal);
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
 * Formatea una fecha extrayendo directamente del string ISO para evitar problemas de zona horaria
 * @param {string} dateString - Fecha en formato ISO (ej: "2025-12-30T17:00:00.000Z")
 * @param {object} options - Opciones de formateo
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  // Extraer la fecha directamente del string ISO para evitar problemas de zona horaria
  const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mesesLargos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  let year, month, day;
  
  if (typeof dateString === 'string' && dateString.includes('T')) {
    // Formato ISO: "2025-12-30T17:00:00.000Z"
    const [datePart] = dateString.split('T');
    [year, month, day] = datePart.split('-').map(Number);
  } else if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Formato simple: "2025-12-30"
    [year, month, day] = dateString.split('-').map(Number);
  } else {
    // Fallback: usar Date con zona horaria de Miami
    const fecha = new Date(dateString);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: options.month || 'long',
      day: 'numeric',
      weekday: options.weekday,
      timeZone: 'America/New_York'
    });
  }
  
  // Formatear según las opciones
  const usarMesCorto = options.month === 'short';
  const mostrarDiaSemana = options.weekday === 'long';
  
  let resultado = '';
  
  if (mostrarDiaSemana) {
    // Calcular el día de la semana
    const fecha = new Date(year, month - 1, day);
    resultado += diasSemana[fecha.getDay()] + ', ';
  }
  
  resultado += `${day} de ${usarMesCorto ? mesesCortos[month - 1] : mesesLargos[month - 1]} de ${year}`;
  
  return resultado;
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

/**
 * Calcula la hora de fin incluyendo horas adicionales
 * @param {string} horaFinOriginal - Hora de fin original en formato HH:MM o ISO
 * @param {number} horasAdicionales - Cantidad de horas adicionales a sumar
 * @returns {string} Nueva hora de fin en formato HH:MM
 */
export const calcularHoraFinConExtras = (horaFinOriginal, horasAdicionales = 0) => {
  if (!horaFinOriginal) {
    return horaFinOriginal;
  }

  try {
    // Extraer hora y minutos - siempre normalizar a formato HH:MM
    let horaFinStr;
    if (horaFinOriginal instanceof Date) {
      const h = horaFinOriginal.getHours();
      const m = horaFinOriginal.getMinutes();
      horaFinStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (typeof horaFinOriginal === 'string') {
      if (horaFinOriginal.includes('T')) {
        const match = horaFinOriginal.match(/(\d{2}):(\d{2})/);
        if (match) {
          horaFinStr = `${match[1]}:${match[2]}`;
        } else {
          horaFinStr = horaFinOriginal.slice(0, 5);
        }
      } else {
        horaFinStr = horaFinOriginal.slice(0, 5);
      }
    } else {
      return horaFinOriginal;
    }
    
    // Si no hay horas adicionales, devolver la hora normalizada en formato HH:MM
    if (horasAdicionales === 0) {
      return horaFinStr;
    }

    const [horaFin, minutoFin] = horaFinStr.split(':').map(Number);

    // Convertir a minutos desde medianoche para facilitar el cálculo
    // Si la hora es 0-2 AM, asumimos que es del día siguiente (24-26 horas)
    let minutosDesdeMedianoche = horaFin * 60 + minutoFin;
    
    // Si es 0, 1 o 2 AM, tratarlo como 24, 25 o 26 horas
    if (horaFin <= 2) {
      minutosDesdeMedianoche = (horaFin + 24) * 60 + minutoFin;
    }

    // Sumar las horas adicionales (convertir a minutos)
    const minutosAdicionales = horasAdicionales * 60;
    const nuevaHoraEnMinutos = minutosDesdeMedianoche + minutosAdicionales;

    // Convertir de vuelta a horas y minutos
    let nuevaHora = Math.floor(nuevaHoraEnMinutos / 60);
    const nuevoMinuto = nuevaHoraEnMinutos % 60;

    // Si la hora es >= 24, convertirla al formato correcto (0-2 AM del día siguiente)
    // 24 = 0, 25 = 1, 26 = 2, etc.
    if (nuevaHora >= 24) {
      nuevaHora = nuevaHora % 24;
    }

    // Formatear la nueva hora
    const nuevaHoraFormateada = `${String(nuevaHora).padStart(2, '0')}:${String(nuevoMinuto).padStart(2, '0')}`;

    return nuevaHoraFormateada;
  } catch (error) {
    console.error('Error calculando hora fin con extras:', error);
    return horaFinOriginal;
  }
};

/**
 * Obtiene la cantidad de horas adicionales de un servicio "Hora Extra"
 * @param {Array} serviciosAdicionales - Array de servicios adicionales
 * @returns {number} Cantidad de horas adicionales
 */
export const obtenerHorasAdicionales = (serviciosAdicionales = []) => {
  if (!serviciosAdicionales || serviciosAdicionales.length === 0) {
    return 0;
  }

  // Buscar el servicio "Hora Extra"
  const horaExtra = serviciosAdicionales.find(
    servicio => servicio.servicios?.nombre === 'Hora Extra' || 
                servicio.servicio?.nombre === 'Hora Extra' ||
                servicio.nombre === 'Hora Extra'
  );

  if (!horaExtra) {
    return 0;
  }

  // Retornar la cantidad (puede estar en diferentes propiedades)
  return horaExtra.cantidad || horaExtra.cantidad_servicio || 0;
};

