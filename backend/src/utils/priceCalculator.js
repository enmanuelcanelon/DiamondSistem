/**
 * ============================================
 * CALCULADORA DE PRECIOS - DIAMONDSISTEM
 * Lógica central del cálculo de precios
 * ============================================
 */

/**
 * Obtener temporada según mes
 */
const getTemporadaByMes = (fecha, temporadas) => {
  const mes = new Date(fecha).getMonth() + 1; // 1-12
  
  const mesesMap = {
    1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
    5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
    9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
  };

  const nombreMes = mesesMap[mes];

  return temporadas.find(t => 
    t.meses.toLowerCase().includes(nombreMes.toLowerCase())
  );
};

/**
 * Calcular precio base del paquete con temporada
 */
const calcularPrecioBasePaquete = (paquete, temporada) => {
  const precioBase = parseFloat(paquete.precio_base);
  const ajusteTemporada = temporada ? parseFloat(temporada.ajuste_precio) : 0;
  
  return {
    precioBase,
    ajusteTemporada,
    total: precioBase + ajusteTemporada
  };
};

/**
 * Calcular precio de un servicio
 */
const calcularPrecioServicio = (servicio, cantidad, cantidadPersonas = 0) => {
  const precioUnitario = parseFloat(servicio.precio_base);
  let subtotal = 0;

  switch (servicio.tipo_cobro) {
    case 'fijo':
      subtotal = precioUnitario * cantidad;
      break;
    case 'por_persona':
      subtotal = precioUnitario * cantidadPersonas * cantidad;
      break;
    case 'por_unidad':
      subtotal = precioUnitario * cantidad;
      break;
    default:
      subtotal = precioUnitario * cantidad;
  }

  return {
    precioUnitario,
    cantidad,
    cantidadPersonas,
    subtotal
  };
};

/**
 * Calcular precio de servicios adicionales
 */
const calcularServiciosAdicionales = (servicios, cantidadInvitados) => {
  let subtotal = 0;
  const detalles = [];

  servicios.forEach(servicio => {
    const calculo = calcularPrecioServicio(
      servicio,
      servicio.cantidad || 1,
      cantidadInvitados
    );

    subtotal += calculo.subtotal;
    detalles.push({
      servicioId: servicio.id,
      nombre: servicio.nombre,
      ...calculo
    });
  });

  return {
    subtotal,
    detalles
  };
};

/**
 * Calcular invitados adicionales
 */
const calcularInvitadosAdicionales = (
  invitadosContrato,
  invitadosMinimo,
  temporada
) => {
  const adicionales = Math.max(0, invitadosContrato - invitadosMinimo);
  
  if (adicionales === 0) {
    return { cantidad: 0, precioUnitario: 0, subtotal: 0 };
  }

  // Determinar precio según temporada
  let precioUnitario;
  if (temporada.nombre === 'Alta') {
    precioUnitario = 80.00;
  } else {
    precioUnitario = 52.00; // Baja o Media
  }

  return {
    cantidad: adicionales,
    precioUnitario,
    subtotal: adicionales * precioUnitario
  };
};

/**
 * Calcular impuestos
 */
const calcularImpuestos = (subtotal, configuracion) => {
  const iva = configuracion.impuesto_iva || 7.00;
  const tarifaServicio = configuracion.tarifa_servicio || 18.00;

  const montoIva = (subtotal * iva) / 100;
  const montoTarifaServicio = (subtotal * tarifaServicio) / 100;

  return {
    iva: {
      porcentaje: iva,
      monto: parseFloat(montoIva.toFixed(2))
    },
    tarifaServicio: {
      porcentaje: tarifaServicio,
      monto: parseFloat(montoTarifaServicio.toFixed(2))
    },
    total: parseFloat((montoIva + montoTarifaServicio).toFixed(2))
  };
};

/**
 * Calcular precio total de una oferta/contrato
 * @param {Object} params - Parámetros del cálculo
 * @param {Object} params.paquete - Paquete seleccionado
 * @param {Object} params.temporada - Temporada del evento
 * @param {Array} params.serviciosAdicionales - Servicios adicionales
 * @param {Number} params.cantidadInvitados - Cantidad de invitados
 * @param {Number} params.descuento - Descuento aplicado
 * @param {Object} params.configuracion - Configuración del sistema (impuestos)
 */
const calcularPrecioTotal = ({
  paquete,
  temporada,
  serviciosAdicionales = [],
  cantidadInvitados,
  descuento = 0,
  configuracion = { impuesto_iva: 7, tarifa_servicio: 18 }
}) => {
  // 1. Precio base del paquete + temporada
  const precioPaquete = calcularPrecioBasePaquete(paquete, temporada);

  // 2. Calcular invitados adicionales
  const invitadosAdicionales = calcularInvitadosAdicionales(
    cantidadInvitados,
    paquete.invitados_minimo,
    temporada
  );

  // 3. Calcular servicios adicionales
  const servicios = calcularServiciosAdicionales(
    serviciosAdicionales,
    cantidadInvitados
  );

  // 4. Subtotal antes de descuento
  const subtotalBase = 
    precioPaquete.total + 
    invitadosAdicionales.subtotal + 
    servicios.subtotal;

  // 5. Aplicar descuento
  const montoDescuento = parseFloat(descuento) || 0;
  const subtotalConDescuento = subtotalBase - montoDescuento;

  // 6. Calcular impuestos (sobre el subtotal con descuento)
  const impuestos = calcularImpuestos(subtotalConDescuento, configuracion);

  // 7. Total final
  const totalFinal = subtotalConDescuento + impuestos.total;

  return {
    desglose: {
      paquete: {
        nombre: paquete.nombre,
        precioBase: precioPaquete.precioBase,
        ajusteTemporada: precioPaquete.ajusteTemporada,
        total: precioPaquete.total
      },
      temporada: {
        nombre: temporada.nombre,
        ajuste: precioPaquete.ajusteTemporada
      },
      invitados: {
        minimo: paquete.invitados_minimo,
        contratados: cantidadInvitados,
        adicionales: invitadosAdicionales.cantidad,
        precioUnitario: invitadosAdicionales.precioUnitario,
        subtotal: invitadosAdicionales.subtotal
      },
      serviciosAdicionales: {
        items: servicios.detalles,
        subtotal: servicios.subtotal
      },
      subtotalBase,
      descuento: montoDescuento,
      subtotalConDescuento,
      impuestos: {
        iva: impuestos.iva,
        tarifaServicio: impuestos.tarifaServicio,
        total: impuestos.total
      },
      totalFinal: parseFloat(totalFinal.toFixed(2))
    },
    resumen: {
      subtotal: parseFloat(subtotalBase.toFixed(2)),
      descuento: parseFloat(montoDescuento.toFixed(2)),
      impuestos: parseFloat(impuestos.total.toFixed(2)),
      total: parseFloat(totalFinal.toFixed(2))
    }
  };
};

/**
 * Calcular pagos mensuales para financiamiento
 */
const calcularPagosFinanciamiento = (totalContrato, meses, depositoInicial = 500, segundoPago = 1000) => {
  // Total a financiar después de depósito y segundo pago
  const saldoAFinanciar = totalContrato - depositoInicial - segundoPago;
  
  if (saldoAFinanciar <= 0) {
    return {
      meses: 0,
      pagoMensual: 0,
      pagos: []
    };
  }

  const pagoMensual = saldoAFinanciar / meses;

  const pagos = [
    {
      numero: 1,
      tipo: 'Depósito Inicial',
      monto: depositoInicial,
      fecha: 'Al firmar contrato'
    },
    {
      numero: 2,
      tipo: 'Segundo Pago',
      monto: segundoPago,
      fecha: '10 días después del depósito'
    }
  ];

  for (let i = 1; i <= meses; i++) {
    pagos.push({
      numero: i + 2,
      tipo: `Cuota Mensual ${i}`,
      monto: parseFloat(pagoMensual.toFixed(2)),
      fecha: `Mes ${i}`
    });
  }

  return {
    totalContrato,
    depositoInicial,
    segundoPago,
    saldoAFinanciar: parseFloat(saldoAFinanciar.toFixed(2)),
    meses,
    pagoMensual: parseFloat(pagoMensual.toFixed(2)),
    pagos
  };
};

/**
 * Calcular recargo por pago con tarjeta
 */
const calcularRecargoTarjeta = (monto) => {
  const porcentaje = 3.8;
  const recargo = (monto * porcentaje) / 100;
  
  return {
    montoOriginal: parseFloat(monto.toFixed(2)),
    recargo: parseFloat(recargo.toFixed(2)),
    montoTotal: parseFloat((monto + recargo).toFixed(2)),
    porcentaje
  };
};

/**
 * Calcular comisión del vendedor
 */
const calcularComisionVendedor = (totalContrato, porcentajeComision = 10) => {
  const comision = (totalContrato * porcentajeComision) / 100;
  
  return {
    totalContrato: parseFloat(totalContrato.toFixed(2)),
    porcentaje: porcentajeComision,
    comision: parseFloat(comision.toFixed(2))
  };
};

/**
 * Validar disponibilidad de horario
 */
const validarHorario = (paquete, horaInicio, horaFin, diaSemana) => {
  const errors = [];

  // Validar días disponibles
  const diasDisponibles = paquete.dias_disponibles.toLowerCase();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const nombreDia = diasSemana[diaSemana];

  if (diasDisponibles === 'lunes a viernes' && (diaSemana === 0 || diaSemana === 6)) {
    errors.push(`El paquete ${paquete.nombre} solo está disponible de Lunes a Viernes`);
  }

  // Validar hora de fin máxima
  const horaFinDate = new Date(`2000-01-01T${horaFin}`);
  const horaFinMaxima = new Date(`2000-01-01T${paquete.horario_fin_maximo}`);

  if (horaFinDate > horaFinMaxima) {
    errors.push(`La hora de fin no puede ser mayor a ${paquete.horario_fin_maximo}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  getTemporadaByMes,
  calcularPrecioBasePaquete,
  calcularPrecioServicio,
  calcularServiciosAdicionales,
  calcularInvitadosAdicionales,
  calcularImpuestos,
  calcularPrecioTotal,
  calcularPagosFinanciamiento,
  calcularRecargoTarjeta,
  calcularComisionVendedor,
  validarHorario
};



