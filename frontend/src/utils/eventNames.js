/**
 * Genera un nombre descriptivo para un evento basado en el contrato
 * @param {Object} contrato - Objeto del contrato
 * @returns {string} Nombre descriptivo del evento
 */
export function generarNombreEvento(contrato) {
  if (!contrato) return 'Evento';

  const cliente = contrato.clientes?.nombre_completo || contrato.cliente?.nombre_completo || 'Cliente';
  const paquete = contrato.paquetes?.nombre || contrato.paquete?.nombre || '';
  
  // Extraer el primer nombre del cliente
  const primerNombre = cliente.split(' ')[0];
  
  // Determinar el tipo de evento basado en el paquete
  let tipoEvento = 'Evento';
  const paqueteLower = paquete.toLowerCase();
  
  if (paqueteLower.includes('quinceañera') || paqueteLower.includes('quince') || paqueteLower.includes('xv')) {
    tipoEvento = 'XV Años';
  } else if (paqueteLower.includes('boda') || paqueteLower.includes('matrimonio')) {
    tipoEvento = 'Boda';
  } else if (paqueteLower.includes('cumpleaños') || paqueteLower.includes('birthday')) {
    tipoEvento = 'Cumpleaños';
  } else if (paqueteLower.includes('corporativo') || paqueteLower.includes('empresa')) {
    tipoEvento = 'Evento Corporativo';
  } else if (paqueteLower.includes('graduación') || paqueteLower.includes('graduacion')) {
    tipoEvento = 'Graduación';
  } else if (paqueteLower.includes('aniversario')) {
    tipoEvento = 'Aniversario';
  } else if (paqueteLower.includes('baby shower')) {
    tipoEvento = 'Baby Shower';
  } else if (paqueteLower.includes('bautizo')) {
    tipoEvento = 'Bautizo';
  }
  
  // Formatear fecha si existe
  let fechaFormateada = '';
  if (contrato.fecha_evento) {
    const fecha = new Date(contrato.fecha_evento);
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    fechaFormateada = ` - ${dia} ${mes} ${año}`;
  }
  
  // Construir el nombre del evento
  if (tipoEvento === 'XV Años') {
    return `${tipoEvento} de ${primerNombre}${fechaFormateada}`;
  } else if (tipoEvento === 'Boda') {
    return `${tipoEvento} de ${cliente}${fechaFormateada}`;
  } else if (tipoEvento === 'Cumpleaños') {
    return `${tipoEvento} de ${primerNombre}${fechaFormateada}`;
  } else if (tipoEvento === 'Evento Corporativo') {
    return `${tipoEvento} - ${cliente}${fechaFormateada}`;
  } else {
    return `${tipoEvento} de ${primerNombre}${fechaFormateada}`;
  }
}

/**
 * Genera un nombre corto para el evento (sin fecha)
 * @param {Object} contrato - Objeto del contrato
 * @returns {string} Nombre corto del evento
 */
export function generarNombreEventoCorto(contrato) {
  if (!contrato) return 'Evento';

  const cliente = contrato.clientes?.nombre_completo || contrato.cliente?.nombre_completo || 'Cliente';
  const paquete = contrato.paquetes?.nombre || contrato.paquete?.nombre || '';
  
  const primerNombre = cliente.split(' ')[0];
  
  let tipoEvento = 'Evento';
  const paqueteLower = paquete.toLowerCase();
  
  if (paqueteLower.includes('quinceañera') || paqueteLower.includes('quince') || paqueteLower.includes('xv')) {
    tipoEvento = 'XV Años';
  } else if (paqueteLower.includes('boda') || paqueteLower.includes('matrimonio')) {
    tipoEvento = 'Boda';
  } else if (paqueteLower.includes('cumpleaños') || paqueteLower.includes('birthday')) {
    tipoEvento = 'Cumpleaños';
  } else if (paqueteLower.includes('corporativo') || paqueteLower.includes('empresa')) {
    tipoEvento = 'Evento Corporativo';
  } else if (paqueteLower.includes('graduación') || paqueteLower.includes('graduacion')) {
    tipoEvento = 'Graduación';
  } else if (paqueteLower.includes('aniversario')) {
    tipoEvento = 'Aniversario';
  } else if (paqueteLower.includes('baby shower')) {
    tipoEvento = 'Baby Shower';
  } else if (paqueteLower.includes('bautizo')) {
    tipoEvento = 'Bautizo';
  }
  
  if (tipoEvento === 'XV Años') {
    return `${tipoEvento} de ${primerNombre}`;
  } else if (tipoEvento === 'Boda') {
    return `${tipoEvento} de ${cliente}`;
  } else if (tipoEvento === 'Cumpleaños') {
    return `${tipoEvento} de ${primerNombre}`;
  } else if (tipoEvento === 'Evento Corporativo') {
    return `${tipoEvento} - ${cliente}`;
  } else {
    return `${tipoEvento} de ${primerNombre}`;
  }
}

/**
 * Obtiene el emoji apropiado para el tipo de evento
 * @param {Object} contrato - Objeto del contrato
 * @returns {string} Emoji del evento
 */
export function getEventoEmoji(contrato) {
  if (!contrato) return '🎉';
  
  const paquete = contrato.paquetes?.nombre || contrato.paquete?.nombre || '';
  const paqueteLower = paquete.toLowerCase();
  
  if (paqueteLower.includes('quinceañera') || paqueteLower.includes('quince') || paqueteLower.includes('xv')) {
    return '👑';
  } else if (paqueteLower.includes('boda') || paqueteLower.includes('matrimonio')) {
    return '💍';
  } else if (paqueteLower.includes('cumpleaños') || paqueteLower.includes('birthday')) {
    return '🎂';
  } else if (paqueteLower.includes('corporativo') || paqueteLower.includes('empresa')) {
    return '💼';
  } else if (paqueteLower.includes('graduación') || paqueteLower.includes('graduacion')) {
    return '🎓';
  } else if (paqueteLower.includes('aniversario')) {
    return '💕';
  } else if (paqueteLower.includes('baby shower')) {
    return '👶';
  } else if (paqueteLower.includes('bautizo')) {
    return '🕊️';
  }
  
  return '🎉';
}

