/**
 * Job para asignación automática de inventario
 * Se ejecuta diariamente y asigna inventario a contratos que están a 1 mes del evento
 */

const { getPrismaClient } = require('../config/database');
const { calcularInventarioParaContrato, asignarInventarioAContrato } = require('../utils/inventarioCalculator');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * Asignar inventario automáticamente a contratos que están a 1 mes del evento
 */
const asignarInventarioAutomatico = async () => {
  try {
    logger.info('Iniciando asignación automática de inventario...');

    // Calcular fecha límite (1 mes desde hoy)
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 1);

    // Buscar contratos que:
    // 1. Tienen fecha_evento dentro de 1 mes
    // 2. Están activos
    // 3. Tienen salón asignado
    // 4. No tienen asignaciones de inventario ya creadas
    const contratos = await prisma.contratos.findMany({
      where: {
        estado: 'activo',
        salon_id: { not: null },
        fecha_evento: {
          gte: new Date(), // Evento futuro
          lte: fechaLimite // Dentro de 1 mes
        }
      },
      include: {
        salones: true,
        clientes: true,
        asignaciones_inventario: {
          where: {
            estado: { not: 'cancelado' }
          }
        }
      }
    });

    // Filtrar contratos que no tienen asignaciones
    const contratosSinAsignacion = contratos.filter(
      contrato => contrato.asignaciones_inventario.length === 0
    );

    logger.info(`Encontrados ${contratosSinAsignacion.length} contratos sin asignación de inventario`);

    let asignados = 0;
    let errores = 0;

    for (const contrato of contratosSinAsignacion) {
      try {
        // Calcular inventario necesario
        const itemsCalculados = await calcularInventarioParaContrato(contrato);

        // Asignar inventario
        const asignaciones = await asignarInventarioAContrato(
          contrato.id,
          itemsCalculados,
          contrato.salon_id
        );

        asignados++;
        logger.info(`✅ Inventario asignado automáticamente al contrato ${contrato.codigo_contrato} (${asignaciones.length} items)`);
      } catch (error) {
        errores++;
        logger.error(`❌ Error asignando inventario al contrato ${contrato.codigo_contrato}:`, error);
      }
    }

    logger.info(`Asignación automática completada: ${asignados} asignados, ${errores} errores`);

    return {
      total_contratos: contratosSinAsignacion.length,
      asignados,
      errores
    };
  } catch (error) {
    logger.error('Error en asignación automática de inventario:', error);
    throw error;
  }
};

/**
 * Obtener alertas de stock bajo
 */
const obtenerAlertasStock = async () => {
  try {
    const alertas = [];

    // Verificar inventario central
    const inventarioCentral = await prisma.inventario_central.findMany({
      include: {
        inventario_items: true
      }
    });

    for (const item of inventarioCentral) {
      if (parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 20)) {
        alertas.push({
          tipo: 'central',
          item_id: item.item_id,
          item_nombre: item.inventario_items.nombre,
          cantidad_actual: parseFloat(item.cantidad_actual),
          cantidad_minima: parseFloat(item.cantidad_minima || 20),
          unidad_medida: item.inventario_items.unidad_medida,
          necesita_reposicion: true
        });
      }
    }

    // Verificar inventario por salón
    const inventarioSalones = await prisma.inventario_salones.findMany({
      include: {
        inventario_items: true,
        salones: true
      }
    });

    for (const item of inventarioSalones) {
      if (parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 10)) {
        alertas.push({
          tipo: 'salon',
          salon_id: item.salon_id,
          salon_nombre: item.salones.nombre,
          item_id: item.item_id,
          item_nombre: item.inventario_items.nombre,
          cantidad_actual: parseFloat(item.cantidad_actual),
          cantidad_minima: parseFloat(item.cantidad_minima || 10),
          unidad_medida: item.inventario_items.unidad_medida,
          necesita_reposicion: true
        });
      }
    }

    return alertas;
  } catch (error) {
    logger.error('Error obteniendo alertas de stock:', error);
    throw error;
  }
};

module.exports = {
  asignarInventarioAutomatico,
  obtenerAlertasStock
};

