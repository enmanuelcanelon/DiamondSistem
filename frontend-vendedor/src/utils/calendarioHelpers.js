/**
 * Utilidades para manejo de calendario y eventos
 * Centraliza funciones relacionadas con fechas, eventos y calendarios
 */

/**
 * Deduplica un array de eventos por su ID
 * IMPORTANTE: Los eventos pueden venir duplicados desde el backend si múltiples
 * vendedores comparten el mismo calendario de Google
 * 
 * @param {Array} eventos - Array de eventos
 * @returns {Array} Array de eventos sin duplicados
 */
export function deduplicarEventos(eventos) {
  const eventosVistos = new Set();
  
  return eventos.filter(evento => {
    // Generar ID único considerando diferentes formatos
    // 1. Usar el ID del evento si existe (con o sin prefijo "google_")
    // 2. Si no hay ID, crear uno único con fecha_inicio + ubicación + título
    let eventoId = evento.id;
    
    if (!eventoId) {
      // Fallback: crear ID único basado en las características del evento
      const fecha = evento.fecha_inicio || evento.fecha_evento || '';
      const ubicacion = evento.ubicacion || evento.salon || '';
      const titulo = evento.titulo || evento.summary || '';
      eventoId = `${fecha}_${ubicacion}_${titulo}`;
    }
    
    if (eventosVistos.has(eventoId)) {
      console.debug('[Deduplicación] Evento duplicado eliminado:', evento.titulo || evento.summary, eventoId);
      return false; // Ya existe, eliminarlo
    }
    
    eventosVistos.add(eventoId);
    return true;
  });
}

/**
 * Obtiene el nombre del salón de un evento, normalizándolo
 * @param {Object} evento - Evento
 * @returns {string} Nombre normalizado del salón
 */
export function obtenerNombreSalon(evento) {
  let nombreSalon = '';
  
  if (evento.salones?.nombre) {
    nombreSalon = String(evento.salones.nombre);
  } else if (evento.salon) {
    nombreSalon = String(evento.salon);
  } else if (evento.ubicacion) {
    nombreSalon = String(evento.ubicacion);
  }
  
  return nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Filtra eventos según los filtros de salones activos
 * @param {Array} eventos - Array de eventos
 * @param {Object} filtrosSalones - Objeto con filtros activos {doral, kendall, diamond, otros}
 * @returns {Array} Array de eventos filtrados
 */
export function filtrarEventosPorSalon(eventos, filtrosSalones) {
  return eventos.filter(evento => {
    const nombreSalon = obtenerNombreSalon(evento);
    
    // Verificar si es Diamond
    if (nombreSalon.includes('diamond')) {
      return filtrosSalones.diamond;
    }
    
    // Verificar si es Doral (pero NO Diamond at Doral)
    if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      return filtrosSalones.doral;
    }
    
    // Verificar si es Kendall (o variantes como Kendal)
    if (nombreSalon.includes('kendall') || nombreSalon.includes('kendal')) {
      return filtrosSalones.kendall;
    }
    
    // Si no tiene salón o es un salón desconocido, usar filtro "otros"
    return filtrosSalones.otros;
  });
}

/**
 * Filtra eventos pasados - solo retorna eventos de hoy en adelante
 * Usa zona horaria de Miami (America/New_York)
 * @param {Array} eventos - Array de eventos
 * @returns {Array} Array de eventos futuros o actuales
 */
export function filtrarEventosPasados(eventos) {
  // Obtener "hoy" en zona horaria de Miami
  const ahoraMiami = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hoyMiami = new Date(ahoraMiami.getFullYear(), ahoraMiami.getMonth(), ahoraMiami.getDate());
  hoyMiami.setHours(0, 0, 0, 0);

  return eventos.filter(evento => {
    // Intentar obtener fecha del evento de múltiples campos posibles
    let fechaEvento;
    if (evento.fecha_evento) {
      fechaEvento = new Date(evento.fecha_evento);
    } else if (evento.fecha_inicio) {
      fechaEvento = new Date(evento.fecha_inicio);
    } else if (evento.hora_inicio) {
      fechaEvento = new Date(evento.hora_inicio);
    } else {
      return false; // No tiene fecha válida
    }

    // Validar que la fecha sea válida
    if (!fechaEvento || isNaN(fechaEvento.getTime())) {
      return false;
    }

    // Convertir a zona horaria de Miami
    const fechaEventoMiami = new Date(fechaEvento.toLocaleString("en-US", { timeZone: "America/New_York" }));

    // Para eventos de todo el día, comparar solo las fechas (sin hora)
    if (evento.es_todo_el_dia) {
      const fechaEventoSolo = new Date(
        fechaEventoMiami.getFullYear(), 
        fechaEventoMiami.getMonth(), 
        fechaEventoMiami.getDate()
      );
      fechaEventoSolo.setHours(0, 0, 0, 0);
      return fechaEventoSolo >= hoyMiami;
    }

    // Para eventos con hora, incluir si es hoy o futuro
    return fechaEventoMiami >= hoyMiami;
  });
}

/**
 * Formatea una fecha para input HTML (YYYY-MM-DD)
 * @param {number} dia - Día del mes (1-31)
 * @param {number} mes - Mes (1-12)
 * @param {number} año - Año
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatearFechaParaInput(dia, mes, año) {
  return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Obtiene la fecha mínima permitida (hoy en Miami)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function obtenerFechaMinima() {
  const ahoraMiami = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const year = ahoraMiami.getFullYear();
  const month = String(ahoraMiami.getMonth() + 1).padStart(2, '0');
  const day = String(ahoraMiami.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica si una fecha es válida (no es pasada)
 * @param {number} dia - Día del mes
 * @param {number} mes - Mes (1-12)
 * @param {number} año - Año
 * @param {string} fechaMinima - Fecha mínima en formato YYYY-MM-DD (opcional)
 * @returns {boolean} True si la fecha es válida
 */
export function esFechaValida(dia, mes, año, fechaMinima = null) {
  const fecha = new Date(año, mes - 1, dia);
  const hoy = fechaMinima ? new Date(fechaMinima) : new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return fecha >= hoy;
}

/**
 * Verifica si una fecha corresponde a hoy
 * @param {number} dia - Día del mes
 * @param {number} mes - Mes (1-12)
 * @param {number} año - Año
 * @returns {boolean} True si es hoy
 */
export function esHoy(dia, mes, año) {
  const hoy = new Date();
  return dia === hoy.getDate() && 
         mes === hoy.getMonth() + 1 &&
         año === hoy.getFullYear();
}

/**
 * Obtiene el color (clases de Tailwind) para un evento según su salón
 * @param {Object} evento - Evento
 * @returns {Object} Objeto con clases de Tailwind {bg, border, text, dot}
 */
export function obtenerColorEvento(evento) {
  const nombreSalon = obtenerNombreSalon(evento);

  // Naranja = Diamond
  if (nombreSalon && nombreSalon.includes('diamond')) {
    return {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-l-4 border-orange-500',
      text: 'text-orange-800 dark:text-orange-200',
      dot: 'bg-orange-500'
    };
  }

  // Verde = Doral
  if (nombreSalon && nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-l-4 border-green-500',
      text: 'text-green-800 dark:text-green-200',
      dot: 'bg-green-500'
    };
  }

  // Azul = Kendall
  if (nombreSalon && (nombreSalon.includes('kendall') || nombreSalon.includes('kendal') || nombreSalon.includes('kentall'))) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-l-4 border-blue-500',
      text: 'text-blue-800 dark:text-blue-200',
      dot: 'bg-blue-500'
    };
  }

  // Morado = Otros (Google Calendar sin salón o salones desconocidos)
  if (evento.es_google_calendar || evento.id?.toString().startsWith('google_')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-l-4 border-purple-500',
      text: 'text-purple-800 dark:text-purple-200',
      dot: 'bg-purple-500'
    };
  }

  // Default: morado
  return {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-l-4 border-purple-500',
    text: 'text-purple-800 dark:text-purple-200',
    dot: 'bg-purple-500'
  };
}

/**
 * Obtiene información del mes y año del calendario
 * @param {number} mes - Mes (1-12)
 * @param {number} año - Año
 * @returns {Object} {diasEnMes, diaInicioSemana}
 */
export function obtenerDiasDelMes(mes, año) {
  const primerDia = new Date(año, mes - 1, 1);
  const diasEnMes = new Date(año, mes, 0).getDate();
  const diaInicioSemana = primerDia.getDay();
  return { diasEnMes, diaInicioSemana };
}

/**
 * Nombres de los meses en español
 */
export const nombresMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Nombres de los días de la semana (abreviados)
 */
export const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Nombres completos de los días de la semana
 */
export const diasSemanaCompletos = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

