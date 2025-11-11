/**
 * Utilidades para calcular comisiones de vendedores
 * 
 * Lógica de comisiones:
 * - Todos los vendedores cobran salario_base mensual
 * - Comisión total: 3% del total del contrato
 * - Primera mitad (1.5%): Se desbloquea cuando se cumple:
 *   * $500 de reserva pagados (primer pago)
 *   * $500 adicionales pagados dentro de 10 días después del primer pago
 *   * Total = $1000 pagado
 * - Segunda mitad (1.5%): Se desbloquea cuando se paga el 50% del contrato
 */

const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

/**
 * Calcular y actualizar comisiones del vendedor basadas en pagos reales
 * @param {Number} contratoId - ID del contrato
 * @returns {Object} Estado de las comisiones
 */
const calcularComisionesVendedor = async (contratoId) => {
  const contrato = await prisma.contratos.findUnique({
    where: { id: contratoId },
    include: {
      pagos: {
        where: { estado: 'completado' },
        orderBy: { fecha_pago: 'asc' }
      },
      vendedores: {
        select: {
          id: true,
          activo: true,
          salario_base: true
        }
      }
    }
  });

  if (!contrato) {
    throw new Error('Contrato no encontrado');
  }

  const totalContrato = parseFloat(contrato.total_contrato);
  const totalPagado = contrato.pagos.reduce((sum, pago) => {
    return sum + parseFloat(pago.monto_total || 0);
  }, 0);

  // Calcular comisiones (3% total, dividido en dos mitades de 1.5%)
  const comisionTotal = (totalContrato * 3) / 100;
  const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
  const comisionSegundaMitad = (totalContrato * 1.5) / 100;

  // Verificar condiciones para primera mitad (1.5%)
  // Condición: $500 reserva (primer pago) + $500 dentro de 10 días = $1000
  let primeraMitadCumplida = false;
  let reservaPagadaEnPlazo = false;

  if (contrato.fecha_creacion_contrato && contrato.pagos.length > 0) {
    const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
    
    // El primer pago debe ser de al menos $500 (reserva)
    const primerPago = contrato.pagos[0];
    const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
    
    if (montoPrimerPago >= 500) {
      // Buscar si hay un segundo pago de al menos $500 dentro de los 10 días siguientes
      const fechaLimite = new Date(fechaCreacion);
      fechaLimite.setDate(fechaLimite.getDate() + 10); // 10 días después

      // Buscar pagos dentro del plazo de 10 días (excluyendo el primer pago)
      const pagosEnPlazo = contrato.pagos.filter((pago, index) => {
        if (index === 0) return false; // Excluir el primer pago
        const fechaPago = new Date(pago.fecha_pago);
        return fechaPago > fechaCreacion && 
               fechaPago <= fechaLimite &&
               parseFloat(pago.monto_total) >= 500;
      });

      // Verificar que se cumplieron ambas condiciones
      if (pagosEnPlazo.length > 0) {
        const montoEnPlazo = pagosEnPlazo.reduce((sum, p) => 
          sum + parseFloat(p.monto_total), 0
        );
        
        if (montoEnPlazo >= 500 && (montoPrimerPago + montoEnPlazo) >= 1000) {
          reservaPagadaEnPlazo = true;
          primeraMitadCumplida = true;
        }
      }
    }
  }

  // Verificar condición para segunda mitad (1.5%): 50% del contrato pagado
  const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;
  const segundaMitadCumplida = porcentajePagado >= 50;

  // IMPORTANTE: Todos los vendedores (activos o no) cobran comisiones si sus contratos cumplen requisitos
  // La diferencia es:
  // - Vendedores activos: cobran salario_base + comisiones
  // - Vendedores que ya no trabajan (activo = false): NO cobran salario_base, pero SÍ cobran comisiones
  const vendedorActivo = contrato.vendedores?.activo ?? false;

  // Preparar datos de actualización
  const dataUpdate = {
    comision_total_calculada: parseFloat(comisionTotal.toFixed(2)),
    comision_primera_mitad: parseFloat(comisionPrimeraMitad.toFixed(2)),
    comision_segunda_mitad: parseFloat(comisionSegundaMitad.toFixed(2))
  };

  // Si se cumple la condición de la primera mitad y aún no está marcada como pagada
  // NOTA: Todos los vendedores (activos o no) cobran comisiones si se cumplen las condiciones
  if (primeraMitadCumplida && !contrato.comision_primera_mitad_pagada) {
    dataUpdate.comision_primera_mitad_pagada = true;
    dataUpdate.fecha_pago_comision_primera = new Date();

    // Actualizar total_comisiones del vendedor
    await prisma.vendedores.update({
      where: { id: contrato.vendedor_id },
      data: {
        total_comisiones: {
          increment: parseFloat(comisionPrimeraMitad.toFixed(2))
        }
      }
    });
  }

  // Si se cumple la condición de la segunda mitad y aún no está marcada como pagada
  // NOTA: Todos los vendedores (activos o no) cobran comisiones si se cumplen las condiciones
  if (segundaMitadCumplida && !contrato.comision_segunda_mitad_pagada) {
    dataUpdate.comision_segunda_mitad_pagada = true;
    dataUpdate.fecha_pago_comision_segunda = new Date();

    // Actualizar total_comisiones del vendedor
    await prisma.vendedores.update({
      where: { id: contrato.vendedor_id },
      data: {
        total_comisiones: {
          increment: parseFloat(comisionSegundaMitad.toFixed(2))
        }
      }
    });
  }

  // Actualizar contrato
  await prisma.contratos.update({
    where: { id: contratoId },
    data: dataUpdate
  });

  return {
    comisionTotal: parseFloat(comisionTotal.toFixed(2)),
    comisionPrimeraMitad: parseFloat(comisionPrimeraMitad.toFixed(2)),
    comisionSegundaMitad: parseFloat(comisionSegundaMitad.toFixed(2)),
    primeraMitadCumplida: primeraMitadCumplida, // Todos los vendedores cobran si se cumple
    segundaMitadCumplida: segundaMitadCumplida, // Todos los vendedores cobran si se cumple
    reservaPagadaEnPlazo,
    porcentajePagado: parseFloat(porcentajePagado.toFixed(2)),
    vendedorActivo, // Información para reportes (solo afecta salario_base, no comisiones)
    totalPagado: parseFloat(totalPagado.toFixed(2))
  };
};

/**
 * Calcular comisiones desbloqueadas de un vendedor
 * @param {Number} vendedorId - ID del vendedor
 * @param {Object} fechaFiltro - Opcional: { gte: Date, lte: Date } para filtrar contratos por fecha de creación
 * @returns {Object} Resumen de comisiones desbloqueadas
 */
const calcularComisionesDesbloqueadasVendedor = async (vendedorId, fechaFiltro = null) => {
  // Construir where clause
  const where = { vendedor_id: vendedorId };
  if (fechaFiltro) {
    where.fecha_creacion_contrato = fechaFiltro;
  }

  // Obtener contratos del vendedor (con filtro de fecha si aplica)
  const contratos = await prisma.contratos.findMany({
    where,
    include: {
      pagos: {
        where: { estado: 'completado' },
        orderBy: { fecha_pago: 'asc' }
      }
    }
  });

  let totalComisiones = 0;
  let totalComisionesDesbloqueadas = 0;
  const comisionesPorMes = {};

  for (const contrato of contratos) {
    const totalContrato = parseFloat(contrato.total_contrato || 0);
    const totalPagado = contrato.pagos.reduce((sum, pago) => {
      return sum + parseFloat(pago.monto_total || 0);
    }, 0);

    // Calcular comisiones (3% total, dividido en dos mitades de 1.5%)
    const comisionTotal = (totalContrato * 3) / 100;
    const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
    const comisionSegundaMitad = (totalContrato * 1.5) / 100;

    totalComisiones += comisionTotal;

    // Verificar condiciones para primera mitad (1.5%)
    let primeraMitadCumplida = false;
    if (contrato.fecha_creacion_contrato && contrato.pagos.length > 0) {
      const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
      const primerPago = contrato.pagos[0];
      const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
      
      if (montoPrimerPago >= 500) {
        const fechaLimite = new Date(fechaCreacion);
        fechaLimite.setDate(fechaLimite.getDate() + 10);
        
        const pagosEnPlazo = contrato.pagos.filter((pago, index) => {
          if (index === 0) return false;
          const fechaPago = new Date(pago.fecha_pago);
          return fechaPago > fechaCreacion && 
                 fechaPago <= fechaLimite &&
                 parseFloat(pago.monto_total) >= 500;
        });

        if (pagosEnPlazo.length > 0) {
          const montoEnPlazo = pagosEnPlazo.reduce((sum, p) => 
            sum + parseFloat(p.monto_total), 0
          );
          
          if (montoEnPlazo >= 500 && (montoPrimerPago + montoEnPlazo) >= 1000) {
            primeraMitadCumplida = true;
          }
        }
      }
    }

    // Verificar condición para segunda mitad (1.5%): 50% del contrato pagado
    const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;
    const segundaMitadCumplida = porcentajePagado >= 50;

    // Calcular comisiones desbloqueadas
    let comisionDesbloqueada = 0;
    if (primeraMitadCumplida) {
      comisionDesbloqueada += comisionPrimeraMitad;
      
      // Obtener mes de cuando se desbloqueó (fecha del segundo pago o fecha de creación + 10 días)
      if (contrato.pagos.length > 1) {
        const segundoPago = contrato.pagos[1];
        const fechaDesbloqueo = new Date(segundoPago.fecha_pago);
        const mesKey = `${fechaDesbloqueo.getFullYear()}-${String(fechaDesbloqueo.getMonth() + 1).padStart(2, '0')}`;
        if (!comisionesPorMes[mesKey]) {
          comisionesPorMes[mesKey] = { mes: mesKey, total: 0 };
        }
        comisionesPorMes[mesKey].total += comisionPrimeraMitad;
      }
    }
    
    if (segundaMitadCumplida) {
      comisionDesbloqueada += comisionSegundaMitad;
      
      // Obtener mes de cuando se desbloqueó (cuando se alcanzó el 50%)
      // Buscar el pago que hizo que se alcanzara el 50%
      let acumulado = 0;
      for (const pago of contrato.pagos) {
        acumulado += parseFloat(pago.monto_total || 0);
        const porcentaje = (acumulado / totalContrato) * 100;
        if (porcentaje >= 50) {
          const fechaDesbloqueo = new Date(pago.fecha_pago);
          const mesKey = `${fechaDesbloqueo.getFullYear()}-${String(fechaDesbloqueo.getMonth() + 1).padStart(2, '0')}`;
          if (!comisionesPorMes[mesKey]) {
            comisionesPorMes[mesKey] = { mes: mesKey, total: 0 };
          }
          comisionesPorMes[mesKey].total += comisionSegundaMitad;
          break;
        }
      }
    }

    totalComisionesDesbloqueadas += comisionDesbloqueada;
  }

  // Convertir comisionesPorMes a array y ordenar
  const comisionesPorMesArray = Object.values(comisionesPorMes)
    .map(item => ({
      mes: item.mes,
      total: parseFloat(item.total.toFixed(2))
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return {
    totalComisiones: parseFloat(totalComisiones.toFixed(2)),
    totalComisionesDesbloqueadas: parseFloat(totalComisionesDesbloqueadas.toFixed(2)),
    comisionesPorMes: comisionesPorMesArray
  };
};

module.exports = {
  calcularComisionesVendedor,
  calcularComisionesDesbloqueadasVendedor
};

