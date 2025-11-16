/**
 * Utilidad para asignar salón automáticamente según cantidad de invitados
 * @param {number} cantidadInvitados - Cantidad de invitados del evento
 * @returns {string|null} - Nombre del salón asignado o null si no aplica
 */
function asignarSalonPorInvitados(cantidadInvitados) {
  if (!cantidadInvitados || cantidadInvitados <= 0) {
    return null;
  }

  // 80+ invitados → Diamond
  if (cantidadInvitados >= 80) {
    return 'Diamond';
  }

  // 50-70 invitados → Kendall
  if (cantidadInvitados >= 50 && cantidadInvitados <= 70) {
    return 'Kendall';
  }

  // 50-60 invitados → Doral
  if (cantidadInvitados >= 50 && cantidadInvitados <= 60) {
    return 'Doral';
  }

  // Si no cumple ningún criterio, retornar null
  return null;
}

/**
 * Calcula la fecha del próximo contacto según el estado
 * @param {string} estado - Estado del leak
 * @returns {Date|null} - Fecha del próximo contacto o null
 */
function calcularFechaProximoContacto(estado) {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  manana.setHours(9, 0, 0, 0); // 9 AM del día siguiente

  if (estado === 'no_contesta' || estado === 'contactado_llamar_otra_vez') {
    return manana;
  }

  return null;
}

module.exports = {
  asignarSalonPorInvitados,
  calcularFechaProximoContacto
};

