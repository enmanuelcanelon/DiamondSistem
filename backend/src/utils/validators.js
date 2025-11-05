/**
 * Validadores de datos de entrada
 */

const { ValidationError } = require('../middleware/errorHandler');

/**
 * Validar email
 */
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar teléfono (formato internacional)
 */
const validarTelefono = (telefono) => {
  const regex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return regex.test(telefono);
};

/**
 * Validar fecha (debe ser futura)
 */
const validarFechaEvento = (fecha) => {
  const fechaEvento = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (fechaEvento < hoy) {
    return { isValid: false, error: 'La fecha del evento debe ser futura' };
  }
  
  return { isValid: true };
};

/**
 * Validar datos de cliente
 */
const validarDatosCliente = (datos) => {
  const errors = [];

  if (!datos.nombre_completo || datos.nombre_completo.trim().length < 3) {
    errors.push('El nombre completo debe tener al menos 3 caracteres');
  }

  if (!datos.email || !validarEmail(datos.email)) {
    errors.push('El email no es válido');
  }

  if (!datos.telefono || !validarTelefono(datos.telefono)) {
    errors.push('El teléfono no es válido');
  }

  if (datos.direccion && datos.direccion.length > 500) {
    errors.push('La dirección no puede exceder 500 caracteres');
  }

  if (errors.length > 0) {
    throw new ValidationError('Datos de cliente inválidos', errors);
  }

  return true;
};

/**
 * Validar datos de oferta
 */
const validarDatosOferta = (datos) => {
  const errors = [];

  if (!datos.cliente_id) {
    errors.push('El cliente_id es requerido');
  }

  // vendedor_id se obtiene del token JWT, no es necesario validarlo aquí

  if (!datos.paquete_id) {
    errors.push('El paquete_id es requerido');
  }

  if (!datos.fecha_evento) {
    errors.push('La fecha del evento es requerida');
  } else {
    const validacionFecha = validarFechaEvento(datos.fecha_evento);
    if (!validacionFecha.isValid) {
      errors.push(validacionFecha.error);
    }
  }

  if (!datos.hora_inicio) {
    errors.push('La hora de inicio es requerida');
  }

  if (!datos.hora_fin) {
    errors.push('La hora de fin es requerida');
  }

  if (!datos.cantidad_invitados || datos.cantidad_invitados < 1) {
    errors.push('La cantidad de invitados debe ser al menos 1');
  }

  if (errors.length > 0) {
    throw new ValidationError('Datos de oferta inválidos', errors);
  }

  return true;
};

/**
 * Validar datos de pago
 */
const validarDatosPago = (datos) => {
  const errors = [];

  if (!datos.contrato_id) {
    errors.push('El contrato_id es requerido');
  }

  if (!datos.monto || datos.monto <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }

  if (!datos.metodo_pago) {
    errors.push('El método de pago es requerido');
  }

  const metodosValidos = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'];
  if (datos.metodo_pago && !metodosValidos.includes(datos.metodo_pago)) {
    errors.push(`El método de pago debe ser uno de: ${metodosValidos.join(', ')}`);
  }

  if (datos.metodo_pago === 'Tarjeta' && !datos.tipo_tarjeta) {
    errors.push('El tipo de tarjeta es requerido para pagos con tarjeta');
  }

  if (errors.length > 0) {
    throw new ValidationError('Datos de pago inválidos', errors);
  }

  return true;
};

/**
 * Validar datos de solicitud de cliente
 */
const validarDatosSolicitud = (datos) => {
  const errors = [];

  if (!datos.contrato_id) {
    errors.push('El contrato_id es requerido');
  }

  if (!datos.cliente_id) {
    errors.push('El cliente_id es requerido');
  }

  if (!datos.tipo_solicitud) {
    errors.push('El tipo de solicitud es requerido');
  }

  const tiposValidos = ['agregar_invitados', 'agregar_servicio', 'modificar_detalles'];
  if (datos.tipo_solicitud && !tiposValidos.includes(datos.tipo_solicitud)) {
    errors.push(`El tipo de solicitud debe ser uno de: ${tiposValidos.join(', ')}`);
  }

  if (datos.tipo_solicitud === 'agregar_invitados' && !datos.invitados_adicionales) {
    errors.push('La cantidad de invitados adicionales es requerida');
  }

  if (datos.tipo_solicitud === 'agregar_servicio' && !datos.servicio_id) {
    errors.push('El servicio_id es requerido');
  }

  if (errors.length > 0) {
    throw new ValidationError('Datos de solicitud inválidos', errors);
  }

  return true;
};

/**
 * Sanitizar string (prevenir XSS y SQL injection)
 */
const sanitizarString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    // Eliminar caracteres peligrosos para XSS
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar event handlers (onclick, onerror, etc.)
    // Eliminar caracteres peligrosos para SQL (aunque Prisma lo previene, es buena práctica)
    .replace(/['";\\]/g, '') // Eliminar comillas y punto y coma
    .substring(0, 5000); // Limitar longitud
};

/**
 * Sanitizar objeto (aplicar sanitizarString a todas las propiedades string)
 */
const sanitizarObjeto = (obj) => {
  const sanitized = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizarString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizarObjeto(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
};

module.exports = {
  validarEmail,
  validarTelefono,
  validarFechaEvento,
  validarDatosCliente,
  validarDatosOferta,
  validarDatosPago,
  validarDatosSolicitud,
  sanitizarString,
  sanitizarObjeto
};

