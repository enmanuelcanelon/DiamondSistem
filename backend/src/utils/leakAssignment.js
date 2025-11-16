/**
 * Utilidad para asignar salón automáticamente según cantidad de invitados
 * @param {number} cantidadInvitados - Cantidad de invitados del evento
 * @returns {string|null} - Nombre del salón asignado o null si no aplica
 */
function asignarSalonPorInvitados(cantidadInvitados) {
  if (!cantidadInvitados || cantidadInvitados <= 0) {
    return null;
  }

  // Diamond: 1-200 invitados
  if (cantidadInvitados >= 1 && cantidadInvitados <= 200) {
    // Si es más de 70, solo Diamond puede manejarlo
    if (cantidadInvitados > 70) {
      return 'Diamond';
    }
    // Si es 1-60, puede ser Doral o Diamond
    if (cantidadInvitados <= 60) {
      // Preferir Doral para 1-60
      return 'Doral';
    }
    // Si es 61-70, solo Kendall
    return 'Kendall';
  }

  // Si excede 200, retornar null (no se sabe)
  return null;
}

/**
 * Valida y corrige el salón según la cantidad de invitados
 * @param {string|null} salonActual - Salón actual del leak
 * @param {number|null} cantidadInvitados - Cantidad de invitados
 * @returns {string|null} - Salón corregido o "?" si no se puede determinar
 */
function validarYCorregirSalon(salonActual, cantidadInvitados) {
  // Si no hay cantidad de invitados o es inválida, asignar desconocido
  if (!cantidadInvitados || cantidadInvitados <= 0 || isNaN(cantidadInvitados)) {
    // Si no hay salón o es desconocido, retornar "?"
    if (!salonActual || salonActual === '?' || salonActual.trim() === '') {
      return '?';
    }
    // Si hay salón pero no hay invitados, mantener el salón
    return salonActual;
  }

  // Definir rangos válidos para cada salón
  const rangosSalones = {
    'Doral': { min: 1, max: 60 },
    'Kendall': { min: 1, max: 70 },
    'Diamond': { min: 1, max: 200 }
  };

  // Normalizar nombre del salón (case-insensitive)
  const salonNormalizado = salonActual ? salonActual.trim() : null;
  const salonKey = salonNormalizado ? Object.keys(rangosSalones).find(
    key => key.toLowerCase() === salonNormalizado.toLowerCase()
  ) : null;

  // Si hay un salón asignado, verificar si es válido
  if (salonKey) {
    const rango = rangosSalones[salonKey];
    if (cantidadInvitados >= rango.min && cantidadInvitados <= rango.max) {
      // El salón es válido, mantenerlo
      return salonKey;
    }
    // El salón no es válido para esta cantidad, corregirlo
  }

  // Asignar salón correcto según cantidad
  if (cantidadInvitados > 200) {
    // Más de 200 invitados, asignar a Diamond
    return 'Diamond';
  }

  if (cantidadInvitados > 70) {
    // Solo Diamond puede manejar más de 70
    return 'Diamond';
  }

  if (cantidadInvitados >= 61 && cantidadInvitados <= 70) {
    // Solo Kendall puede manejar 61-70
    return 'Kendall';
  }

  if (cantidadInvitados >= 1 && cantidadInvitados <= 60) {
    // Puede ser Doral o Diamond, preferir Doral
    // Si el salón actual era Diamond y está en rango, mantenerlo
    if (salonKey === 'Diamond' && cantidadInvitados <= 200) {
      return 'Diamond';
    }
    return 'Doral';
  }

  // Si no cumple ningún criterio, no se sabe
  return '?';
}

/**
 * Calcula la fecha del próximo contacto según el estado
 * @param {string} estado - Estado del leak
 * @returns {Date|null} - Fecha del próximo contacto o null
 */
function calcularFechaProximoContacto(estado) {
  // Los estados 'contactado_llamar_luego' y 'no_contactado' ya tienen fecha_proximo_contacto
  // en el request body, así que no necesitamos calcularla aquí
  // Esta función se mantiene por compatibilidad pero retorna null
  return null;
}

module.exports = {
  asignarSalonPorInvitados,
  validarYCorregirSalon,
  calcularFechaProximoContacto
};

