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
 * Sanitizar y validar número entero
 */
const sanitizarInt = (value, min = null, max = null, defaultValue = null) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    throw new ValidationError(`Valor numérico inválido: ${value}`);
  }
  
  if (min !== null && num < min) {
    throw new ValidationError(`El valor debe ser mayor o igual a ${min}`);
  }
  
  if (max !== null && num > max) {
    throw new ValidationError(`El valor debe ser menor o igual a ${max}`);
  }
  
  return num;
};

/**
 * Sanitizar y validar número decimal
 */
const sanitizarFloat = (value, min = null, max = null, defaultValue = null) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    throw new ValidationError(`Valor numérico inválido: ${value}`);
  }
  
  if (min !== null && num < min) {
    throw new ValidationError(`El valor debe ser mayor o igual a ${min}`);
  }
  
  if (max !== null && num > max) {
    throw new ValidationError(`El valor debe ser menor o igual a ${max}`);
  }
  
  return num;
};

/**
 * Sanitizar ID (debe ser un entero positivo)
 */
const sanitizarId = (value, fieldName = 'ID') => {
  if (!value) {
    throw new ValidationError(`${fieldName} es requerido`);
  }
  
  const id = sanitizarInt(value, 1, Number.MAX_SAFE_INTEGER);
  
  if (id <= 0) {
    throw new ValidationError(`${fieldName} debe ser un número positivo`);
  }
  
  return id;
};

/**
 * Sanitizar fecha
 */
const sanitizarFecha = (value, allowPast = false) => {
  if (!value) {
    throw new ValidationError('La fecha es requerida');
  }
  
  const fecha = new Date(value);
  
  if (isNaN(fecha.getTime())) {
    throw new ValidationError('Fecha inválida');
  }
  
  if (!allowPast) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    
    if (fecha < hoy) {
      throw new ValidationError('La fecha debe ser futura');
    }
  }
  
  return fecha;
};

/**
 * Sanitizar string (prevenir XSS y SQL injection)
 */
const sanitizarString = (str, maxLength = 5000) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    // Eliminar caracteres peligrosos para XSS
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar event handlers (onclick, onerror, etc.)
    // Eliminar caracteres peligrosos para SQL (aunque Prisma lo previene, es buena práctica)
    .replace(/['";\\]/g, '') // Eliminar comillas y punto y coma
    .substring(0, maxLength); // Limitar longitud
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

/**
 * Validar y sanitizar parámetros de query (paginación, filtros)
 */
const sanitizarQueryParams = (query) => {
  const sanitized = {};
  
  // Paginación
  if (query.page) {
    sanitized.page = sanitizarInt(query.page, 1, 1000, 1);
  }
  
  if (query.limit) {
    sanitized.limit = sanitizarInt(query.limit, 1, 1000, 50);
  }
  
  // Búsqueda
  if (query.search) {
    sanitized.search = sanitizarString(query.search, 200);
  }
  
  // IDs
  if (query.cliente_id) {
    sanitized.cliente_id = sanitizarId(query.cliente_id, 'cliente_id');
  }
  
  if (query.vendedor_id) {
    sanitized.vendedor_id = sanitizarId(query.vendedor_id, 'vendedor_id');
  }
  
  // Fechas
  if (query.fecha_desde) {
    sanitized.fecha_desde = sanitizarFecha(query.fecha_desde, true);
  }
  
  if (query.fecha_hasta) {
    sanitized.fecha_hasta = sanitizarFecha(query.fecha_hasta, true);
  }
  
  // Otros campos string
  if (query.estado) {
    sanitized.estado = sanitizarString(query.estado, 50);
  }
  
  if (query.estado_pago) {
    sanitized.estado_pago = sanitizarString(query.estado_pago, 50);
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
  sanitizarObjeto,
  sanitizarInt,
  sanitizarFloat,
  sanitizarId,
  sanitizarFecha,
  sanitizarQueryParams
};
