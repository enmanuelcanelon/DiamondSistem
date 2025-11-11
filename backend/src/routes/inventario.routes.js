/**
 * Rutas de Inventario
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireInventario } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { calcularInventarioParaContrato, asignarInventarioAContrato } = require('../utils/inventarioCalculator');
const { obtenerAlertasStock, asignarInventarioAutomatico } = require('../jobs/inventarioAutoAsignacion');
const { generarListaCompraPDF } = require('../utils/pdfListaCompra');
const { generarInventarioPDF } = require('../utils/pdfInventario');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

// ====================================
// INVENTARIO CENTRAL
// ====================================

/**
 * @route   GET /api/inventario/central
 * @desc    Obtener todo el inventario central con alertas
 * @access  Private (Inventario)
 */
router.get('/central', authenticate, requireInventario, async (req, res, next) => {
  try {
    const inventario = await prisma.inventario_central.findMany({
      where: {
        inventario_items: {
          activo: true
        }
      },
      include: {
        inventario_items: true
      },
      orderBy: {
        inventario_items: {
          nombre: 'asc'
        }
      }
    });

    // Calcular alertas (cantidad < cantidad_minima)
    const inventarioConAlertas = inventario.map(item => ({
      ...item,
      necesita_reposicion: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 20),
      alerta: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 20)
    }));

    res.json({
      success: true,
      inventario: inventarioConAlertas,
      total_items: inventario.length,
      items_bajo_stock: inventarioConAlertas.filter(i => i.necesita_reposicion).length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/central/:itemId
 * @desc    Obtener un item específico del inventario central
 * @access  Private (Inventario)
 */
router.get('/central/:itemId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await prisma.inventario_central.findUnique({
      where: { item_id: parseInt(itemId) },
      include: {
        inventario_items: true
      }
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado en inventario central');
    }

    res.json({
      success: true,
      item: {
        ...item,
        necesita_reposicion: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 20)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/inventario/central/:itemId
 * @desc    Actualizar cantidad de un item en inventario central
 * @access  Private (Inventario)
 */
router.put('/central/:itemId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { cantidad_actual, cantidad_minima } = req.body;

    if (cantidad_actual !== undefined && cantidad_actual < 0) {
      throw new ValidationError('La cantidad no puede ser negativa');
    }

    const updateData = {
      fecha_actualizacion: new Date()
    };

    if (cantidad_actual !== undefined) {
      updateData.cantidad_actual = parseFloat(cantidad_actual);
    }

    if (cantidad_minima !== undefined) {
      updateData.cantidad_minima = parseFloat(cantidad_minima);
    }

    // Obtener el item antes de actualizar para calcular la diferencia
    const itemAnterior = await prisma.inventario_central.findUnique({
      where: { item_id: parseInt(itemId) },
      include: {
        inventario_items: true
      }
    });

    if (!itemAnterior) {
      throw new NotFoundError('Item no encontrado en inventario central');
    }

    const item = await prisma.inventario_central.update({
      where: { item_id: parseInt(itemId) },
      data: updateData,
      include: {
        inventario_items: true
      }
    });

    // Calcular la diferencia para registrar el movimiento correcto
    const cantidadAnterior = parseFloat(itemAnterior.cantidad_actual);
    const cantidadNueva = cantidad_actual !== undefined ? parseFloat(cantidad_actual) : cantidadAnterior;
    const diferencia = cantidadNueva - cantidadAnterior;

    // Registrar movimiento solo si hay cambio
    if (diferencia !== 0) {
      const motivo = diferencia > 0 
        ? `Actualización manual de inventario central - Incremento de ${Math.abs(diferencia).toFixed(2)}`
        : `Actualización manual de inventario central - Decremento de ${Math.abs(diferencia).toFixed(2)}`;
      
      await prisma.movimientos_inventario.create({
        data: {
          item_id: parseInt(itemId),
          tipo_movimiento: 'entrada', // Siempre entrada para ediciones de central
          origen: 'central',
          cantidad: Math.abs(diferencia),
          motivo: motivo,
          usuario_id: req.user.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Inventario actualizado correctamente',
      item: {
        ...item,
        necesita_reposicion: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 20)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// INVENTARIO POR SALÓN
// ====================================

/**
 * @route   GET /api/inventario/salones
 * @desc    Obtener inventario de todos los salones
 * @access  Private (Inventario)
 */
router.get('/salones', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salon_id } = req.query;

    const where = {};
    if (salon_id) {
      where.salon_id = parseInt(salon_id);
    }

    const inventario = await prisma.inventario_salones.findMany({
      where,
      include: {
        inventario_items: true,
        salones: true
      },
      orderBy: [
        { salon_id: 'asc' },
        { inventario_items: { nombre: 'asc' } }
      ]
    });

    // Agrupar por salón
    const inventarioPorSalon = inventario.reduce((acc, item) => {
      const salonNombre = item.salones.nombre;
      if (!acc[salonNombre]) {
        acc[salonNombre] = {
          salon_id: item.salon_id,
          salon_nombre: salonNombre,
          items: []
        };
      }
      acc[salonNombre].items.push({
        ...item,
        necesita_reposicion: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 10)
      });
      return acc;
    }, {});

    res.json({
      success: true,
      inventario: Object.values(inventarioPorSalon),
      total_salones: Object.keys(inventarioPorSalon).length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/salones/:salonId
 * @desc    Obtener inventario de un salón específico
 * @access  Private (Inventario)
 */
router.get('/salones/:salonId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salonId } = req.params;

    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salonId) }
    });

    if (!salon) {
      throw new NotFoundError('Salón no encontrado');
    }

    const inventario = await prisma.inventario_salones.findMany({
      where: { salon_id: parseInt(salonId) },
      include: {
        inventario_items: true
      },
      orderBy: {
        inventario_items: {
          nombre: 'asc'
        }
      }
    });

    const inventarioConAlertas = inventario.map(item => ({
      ...item,
      necesita_reposicion: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 10)
    }));

    res.json({
      success: true,
      salon: {
        id: salon.id,
        nombre: salon.nombre
      },
      inventario: inventarioConAlertas,
      total_items: inventario.length,
      items_bajo_stock: inventarioConAlertas.filter(i => i.necesita_reposicion).length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/inventario/salones/:salonId/:itemId
 * @desc    Actualizar cantidad de un item en inventario de salón
 * @access  Private (Inventario)
 */
router.put('/salones/:salonId/:itemId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salonId, itemId } = req.params;
    const { cantidad_actual, cantidad_minima } = req.body;

    if (cantidad_actual !== undefined && cantidad_actual < 0) {
      throw new ValidationError('La cantidad no puede ser negativa');
    }

    const updateData = {
      fecha_actualizacion: new Date()
    };

    if (cantidad_actual !== undefined) {
      updateData.cantidad_actual = parseFloat(cantidad_actual);
    }

    if (cantidad_minima !== undefined) {
      updateData.cantidad_minima = parseFloat(cantidad_minima);
    }

    const item = await prisma.inventario_salones.update({
      where: {
        salon_id_item_id: {
          salon_id: parseInt(salonId),
          item_id: parseInt(itemId)
        }
      },
      data: updateData,
      include: {
        inventario_items: true,
        salones: true
      }
    });

    // Registrar movimiento
    await prisma.movimientos_inventario.create({
      data: {
        item_id: parseInt(itemId),
        tipo_movimiento: 'entrada',
        origen: item.salones.nombre.toLowerCase(),
        cantidad: cantidad_actual || 0,
        motivo: 'Actualización manual de inventario de salón',
        usuario_id: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Inventario de salón actualizado correctamente',
      item: {
        ...item,
        necesita_reposicion: parseFloat(item.cantidad_actual) < parseFloat(item.cantidad_minima || 10)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/transferencia
 * @desc    Transferir items del almacén central a un salón
 * @access  Private (Inventario)
 */
router.post('/transferencia', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { item_id, salon_id, cantidad, motivo } = req.body;

    if (!item_id || !salon_id || !cantidad || cantidad <= 0) {
      throw new ValidationError('item_id, salon_id y cantidad son requeridos');
    }

    // Verificar que el item existe en inventario central
    const itemCentral = await prisma.inventario_central.findUnique({
      where: { item_id: parseInt(item_id) },
      include: { inventario_items: true }
    });

    if (!itemCentral) {
      throw new NotFoundError('Item no encontrado en inventario central');
    }

    if (parseFloat(itemCentral.cantidad_actual) < parseFloat(cantidad)) {
      throw new ValidationError('No hay suficiente stock en el almacén central');
    }

    // Verificar que el salón existe
    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salon_id) }
    });

    if (!salon) {
      throw new NotFoundError('Salón no encontrado');
    }

    // Actualizar inventario central (restar)
    await prisma.inventario_central.update({
      where: { item_id: parseInt(item_id) },
      data: {
        cantidad_actual: {
          decrement: parseFloat(cantidad)
        },
        fecha_actualizacion: new Date()
      }
    });

    // Actualizar o crear inventario del salón (sumar)
    const inventarioSalon = await prisma.inventario_salones.upsert({
      where: {
        salon_id_item_id: {
          salon_id: parseInt(salon_id),
          item_id: parseInt(item_id)
        }
      },
      update: {
        cantidad_actual: {
          increment: parseFloat(cantidad)
        },
        fecha_actualizacion: new Date()
      },
      create: {
        salon_id: parseInt(salon_id),
        item_id: parseInt(item_id),
        cantidad_actual: parseFloat(cantidad),
        cantidad_minima: 10.00,
        fecha_actualizacion: new Date()
      }
    });

    // Registrar movimiento
    await prisma.movimientos_inventario.create({
      data: {
        item_id: parseInt(item_id),
        tipo_movimiento: 'transferencia',
        origen: 'central',
        destino: salon.nombre.toLowerCase(),
        cantidad: parseFloat(cantidad),
        motivo: motivo || 'Transferencia desde almacén central',
        usuario_id: req.user.id
      }
    });

    res.json({
      success: true,
      message: `Transferencia realizada: ${cantidad} ${itemCentral.inventario_items.unidad_medida} de ${itemCentral.inventario_items.nombre} a ${salon.nombre}`,
      transferencia: {
        item: itemCentral.inventario_items.nombre,
        cantidad,
        origen: 'central',
        destino: salon.nombre,
        inventario_salon: inventarioSalon
      }
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ASIGNACIONES DE INVENTARIO
// ====================================

/**
 * @route   GET /api/inventario/asignaciones
 * @desc    Obtener todas las asignaciones de inventario
 * @access  Private (Inventario)
 */
router.get('/asignaciones', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { contrato_id, salon_id, estado } = req.query;

    const where = {};
    if (contrato_id) {
      where.contrato_id = parseInt(contrato_id);
    }
    if (salon_id) {
      where.salon_id = parseInt(salon_id);
    }
    if (estado) {
      where.estado = estado;
    }

    const asignaciones = await prisma.asignaciones_inventario.findMany({
      where,
      include: {
        contratos: {
          include: {
            clientes: true,
            salones: true
          }
        },
        inventario_items: true,
        salones: true
      },
      orderBy: {
        fecha_asignacion: 'desc'
      }
    });

    res.json({
      success: true,
      asignaciones,
      total: asignaciones.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/asignaciones/:id
 * @desc    Obtener una asignación específica
 * @access  Private (Inventario)
 */
router.get('/asignaciones/:id', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { id } = req.params;

    const asignacion = await prisma.asignaciones_inventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        contratos: {
          include: {
            clientes: true,
            salones: true
          }
        },
        inventario_items: true,
        salones: true
      }
    });

    if (!asignacion) {
      throw new NotFoundError('Asignación no encontrada');
    }

    res.json({
      success: true,
      asignacion
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/inventario/asignaciones/:id
 * @desc    Actualizar una asignación (edición manual)
 * @access  Private (Inventario)
 */
router.put('/asignaciones/:id', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cantidad_asignada, cantidad_utilizada, estado, notas } = req.body;

    // Obtener la asignación actual antes de actualizar
    const asignacionAnterior = await prisma.asignaciones_inventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        salones: true,
        inventario_items: true
      }
    });

    if (!asignacionAnterior) {
      throw new NotFoundError('Asignación no encontrada');
    }

    const updateData = {
      fecha_actualizacion: new Date()
    };

    if (cantidad_asignada !== undefined) {
      updateData.cantidad_asignada = parseFloat(cantidad_asignada);
    }

    if (cantidad_utilizada !== undefined) {
      updateData.cantidad_utilizada = parseFloat(cantidad_utilizada);
    }

    if (estado !== undefined) {
      updateData.estado = estado;
    }

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    // Si se está cancelando la asignación, devolver el inventario al salón
    if (estado === 'cancelado' && asignacionAnterior.estado !== 'cancelado') {
      const cantidadADevolver = parseFloat(asignacionAnterior.cantidad_asignada);
      
      // Verificar que el inventario del salón existe
      const inventarioSalon = await prisma.inventario_salones.findUnique({
        where: {
          salon_id_item_id: {
            salon_id: asignacionAnterior.salon_id,
            item_id: asignacionAnterior.item_id
          }
        }
      });

      if (inventarioSalon) {
        // Devolver la cantidad asignada al inventario del salón
        await prisma.inventario_salones.update({
          where: {
            salon_id_item_id: {
              salon_id: asignacionAnterior.salon_id,
              item_id: asignacionAnterior.item_id
            }
          },
          data: {
            cantidad_actual: {
              increment: cantidadADevolver
            },
            fecha_actualizacion: new Date()
          }
        });

        // Registrar movimiento de devolución
        await prisma.movimientos_inventario.create({
          data: {
            item_id: asignacionAnterior.item_id,
            tipo_movimiento: 'devolucion',
            origen: `evento-${asignacionAnterior.contrato_id}`,
            destino: asignacionAnterior.salones.nombre.toLowerCase(),
            cantidad: cantidadADevolver,
            motivo: `Cancelación de asignación - Devolución de inventario al salón`,
            contrato_id: asignacionAnterior.contrato_id,
            asignacion_id: parseInt(id),
            usuario_id: req.user.id
          }
        });
      }
    }

    // Si se está modificando la cantidad asignada, ajustar el inventario del salón
    if (cantidad_asignada !== undefined) {
      const cantidadAnterior = parseFloat(asignacionAnterior.cantidad_asignada);
      const cantidadNueva = parseFloat(cantidad_asignada);
      const diferencia = cantidadNueva - cantidadAnterior;

      // Solo ajustar si hay diferencia y la asignación está activa
      if (diferencia !== 0 && asignacionAnterior.estado !== 'cancelado') {
        // Verificar que el inventario del salón existe
        const inventarioSalon = await prisma.inventario_salones.findUnique({
          where: {
            salon_id_item_id: {
              salon_id: asignacionAnterior.salon_id,
              item_id: asignacionAnterior.item_id
            }
          }
        });

        if (inventarioSalon) {
          if (diferencia > 0) {
            // Se está aumentando la cantidad asignada, restar del inventario
            // Verificar que hay suficiente stock
            const stockDisponible = parseFloat(inventarioSalon.cantidad_actual);
            if (stockDisponible < diferencia) {
              throw new ValidationError(
                `Stock insuficiente. Disponible: ${stockDisponible.toFixed(2)}, Necesario: ${diferencia.toFixed(2)}`
              );
            }

            // Restar la diferencia del inventario del salón
            await prisma.inventario_salones.update({
              where: {
                salon_id_item_id: {
                  salon_id: asignacionAnterior.salon_id,
                  item_id: asignacionAnterior.item_id
                }
              },
              data: {
                cantidad_actual: {
                  decrement: diferencia
                },
                fecha_actualizacion: new Date()
              }
            });

            // Registrar movimiento
            await prisma.movimientos_inventario.create({
              data: {
                item_id: asignacionAnterior.item_id,
                tipo_movimiento: 'asignacion',
                origen: asignacionAnterior.salones.nombre.toLowerCase(),
                destino: `evento-${asignacionAnterior.contrato_id}`,
                cantidad: diferencia,
                motivo: `Ajuste de asignación - Aumento de cantidad asignada`,
                contrato_id: asignacionAnterior.contrato_id,
                asignacion_id: parseInt(id),
                usuario_id: req.user.id
              }
            });
          } else {
            // Se está disminuyendo la cantidad asignada, devolver al inventario
            const cantidadADevolver = Math.abs(diferencia);

            await prisma.inventario_salones.update({
              where: {
                salon_id_item_id: {
                  salon_id: asignacionAnterior.salon_id,
                  item_id: asignacionAnterior.item_id
                }
              },
              data: {
                cantidad_actual: {
                  increment: cantidadADevolver
                },
                fecha_actualizacion: new Date()
              }
            });

            // Registrar movimiento
            await prisma.movimientos_inventario.create({
              data: {
                item_id: asignacionAnterior.item_id,
                tipo_movimiento: 'devolucion',
                origen: `evento-${asignacionAnterior.contrato_id}`,
                destino: asignacionAnterior.salones.nombre.toLowerCase(),
                cantidad: cantidadADevolver,
                motivo: `Ajuste de asignación - Disminución de cantidad asignada`,
                contrato_id: asignacionAnterior.contrato_id,
                asignacion_id: parseInt(id),
                usuario_id: req.user.id
              }
            });
          }
        } else {
          // Si no existe inventario del salón y se está aumentando, no se puede asignar
          if (diferencia > 0) {
            throw new ValidationError('No hay inventario disponible en el salón para este item');
          }
        }
      }
    }

    const asignacion = await prisma.asignaciones_inventario.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        contratos: {
          include: {
            clientes: true,
            salones: true
          }
        },
        inventario_items: true,
        salones: true
      }
    });

    res.json({
      success: true,
      message: 'Asignación actualizada correctamente',
      asignacion
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/calcular/:contratoId
 * @desc    Calcular inventario necesario para un contrato
 * @access  Private (Inventario)
 */
router.post('/calcular/:contratoId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contratoId) },
      include: {
        salones: true,
        clientes: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    const itemsCalculados = await calcularInventarioParaContrato(contrato);

    res.json({
      success: true,
      contrato: {
        id: contrato.id,
        codigo_contrato: contrato.codigo_contrato,
        cliente: contrato.clientes?.nombre_completo,
        salon: contrato.salones?.nombre,
        cantidad_invitados: contrato.cantidad_invitados,
        fecha_evento: contrato.fecha_evento
      },
      items_calculados: itemsCalculados,
      total_items: itemsCalculados.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/asignar/:contratoId
 * @desc    Asignar inventario automáticamente a un contrato
 * @access  Private (Inventario)
 */
router.post('/asignar/:contratoId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { contratoId } = req.params;
    const { forzar_asignacion } = req.body; // Si true, asigna aunque no haya stock suficiente

    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contratoId) },
      include: {
        salones: true,
        clientes: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    if (!contrato.salon_id) {
      throw new ValidationError('El contrato debe tener un salón asignado');
    }

    // Verificar si ya tiene asignaciones
    const asignacionesExistentes = await prisma.asignaciones_inventario.findMany({
      where: {
        contrato_id: parseInt(contratoId),
        estado: { not: 'cancelado' }
      }
    });

    if (asignacionesExistentes.length > 0 && !forzar_asignacion) {
      return res.json({
        success: false,
        message: 'Este contrato ya tiene asignaciones de inventario. Use forzar_asignacion=true para reasignar.',
        asignaciones_existentes: asignacionesExistentes.length
      });
    }

    // Calcular inventario necesario
    const itemsCalculados = await calcularInventarioParaContrato(contrato);

    // Asignar inventario
    const asignaciones = await asignarInventarioAContrato(
      parseInt(contratoId),
      itemsCalculados,
      contrato.salon_id
    );

    res.json({
      success: true,
      message: `Inventario asignado correctamente para el contrato ${contrato.codigo_contrato}`,
      contrato: {
        id: contrato.id,
        codigo_contrato: contrato.codigo_contrato,
        cliente: contrato.clientes?.nombre_completo,
        salon: contrato.salones?.nombre,
        cantidad_invitados: contrato.cantidad_invitados
      },
      asignaciones: asignaciones.length,
      items_calculados: itemsCalculados.length,
      items_asignados: asignaciones.length
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// MOVIMIENTOS DE INVENTARIO
// ====================================

/**
 * @route   GET /api/inventario/movimientos
 * @desc    Obtener historial de movimientos filtrado por salón, mes y año
 * @access  Private (Inventario)
 */
router.get('/movimientos', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salon_nombre, mes, anio } = req.query;

    const where = {};

    // Filtrar por salón o inventario central
    if (salon_nombre) {
      const salonNombreLower = salon_nombre.toLowerCase();
      
      if (salonNombreLower === 'central') {
        // Para inventario central, incluir:
        // 1. Transferencias de central a salones (origen: 'central')
        // 2. Retornos de salones a central (destino: 'central')
        // 3. Compras entrantes (origen: 'compra')
        // 4. Ediciones de cantidad central (origen: 'central', sin destino)
        where.OR = [
          { origen: { equals: 'central', mode: 'insensitive' } },
          { destino: { equals: 'central', mode: 'insensitive' } },
          { origen: { equals: 'compra', mode: 'insensitive' } }
        ];
      } else {
        // Para salones, filtrar por origen o destino
        where.OR = [
          { origen: { equals: salonNombreLower, mode: 'insensitive' } },
          { destino: { equals: salonNombreLower, mode: 'insensitive' } }
        ];
      }
    }

    // Filtrar por mes y año
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const fechaInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59, 999);
      
      where.fecha_movimiento = {
        gte: fechaInicio,
        lte: fechaFin
      };
    }

    const movimientos = await prisma.movimientos_inventario.findMany({
      where,
      include: {
        inventario_items: true,
        contratos: {
          include: {
            clientes: true,
            salones: true
          }
        },
        usuarios_inventario: true
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    });

    res.json({
      success: true,
      movimientos,
      total: movimientos.length
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ITEMS DE INVENTARIO (Catálogo)
// ====================================

/**
 * @route   GET /api/inventario/items
 * @desc    Obtener catálogo de items de inventario
 * @access  Private (Inventario)
 */
router.get('/items', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { categoria, activo } = req.query;

    const where = {};
    if (categoria) {
      where.categoria = categoria;
    }
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const items = await prisma.inventario_items.findMany({
      where,
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json({
      success: true,
      items,
      total: items.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/categorias
 * @desc    Obtener todas las categorías existentes de items
 * @access  Private (Inventario)
 */
router.get('/categorias', authenticate, requireInventario, async (req, res, next) => {
  try {
    const items = await prisma.inventario_items.findMany({
      where: {
        categoria: { not: null },
        activo: true
      },
      select: {
        categoria: true
      },
      distinct: ['categoria']
    });

    const categorias = items
      .map(item => item.categoria)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      categorias
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/items
 * @desc    Crear un nuevo item de inventario
 * @access  Private (Inventario)
 */
router.post('/items', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { nombre, categoria, unidad_medida, descripcion, cantidad_inicial, cantidad_minima_central, cantidad_minima_salones } = req.body;
    
    // cantidad_minima_salones puede ser un objeto { diamond, kendall, doral } o un número (para compatibilidad)

    if (!nombre || !categoria || !unidad_medida) {
      throw new ValidationError('Nombre, categoría y unidad de medida son requeridos');
    }

    // Verificar si el item ya existe
    const itemExistente = await prisma.inventario_items.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        },
        activo: true
      }
    });

    if (itemExistente) {
      throw new ValidationError('Ya existe un item con ese nombre');
    }

    // Crear el item
    const nuevoItem = await prisma.inventario_items.create({
      data: {
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        unidad_medida: unidad_medida.trim(),
        descripcion: descripcion?.trim() || null,
        activo: true
      }
    });

    // Crear registro en inventario central
    const cantidadInicial = parseFloat(cantidad_inicial || 0);
    const cantidadMinimaCentral = parseFloat(cantidad_minima_central || 20);

    await prisma.inventario_central.create({
      data: {
        item_id: nuevoItem.id,
        cantidad_actual: cantidadInicial,
        cantidad_minima: cantidadMinimaCentral,
        fecha_actualizacion: new Date()
      }
    });

    // Crear registros en inventario de salones con cantidades mínimas específicas por salón
    const salones = await prisma.salones.findMany({
      where: { activo: true }
    });

    for (const salon of salones) {
      let cantidadMinima = 10; // Valor por defecto
      
      // Si cantidad_minima_salones es un objeto, usar el valor específico del salón
      if (cantidad_minima_salones && typeof cantidad_minima_salones === 'object') {
        const salonNombreLower = salon.nombre.toLowerCase();
        if (salonNombreLower === 'diamond' && cantidad_minima_salones.diamond !== undefined) {
          cantidadMinima = parseFloat(cantidad_minima_salones.diamond || 10);
        } else if (salonNombreLower === 'kendall' && cantidad_minima_salones.kendall !== undefined) {
          cantidadMinima = parseFloat(cantidad_minima_salones.kendall || 10);
        } else if (salonNombreLower === 'doral' && cantidad_minima_salones.doral !== undefined) {
          cantidadMinima = parseFloat(cantidad_minima_salones.doral || 10);
        } else {
          cantidadMinima = parseFloat(cantidad_minima_salones[salonNombreLower] || 10);
        }
      } else if (cantidad_minima_salones !== undefined) {
        // Compatibilidad: si es un número, usar ese valor para todos
        cantidadMinima = parseFloat(cantidad_minima_salones || 10);
      }

      await prisma.inventario_salones.create({
        data: {
          salon_id: salon.id,
          item_id: nuevoItem.id,
          cantidad_actual: 0,
          cantidad_minima: cantidadMinima,
          fecha_actualizacion: new Date()
        }
      });
    }

    // Registrar movimiento
    if (cantidadInicial > 0) {
      await prisma.movimientos_inventario.create({
        data: {
          item_id: nuevoItem.id,
          tipo_movimiento: 'entrada',
          origen: 'central',
          cantidad: cantidadInicial,
          motivo: 'Creación de nuevo item',
          usuario_id: req.user.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Item creado exitosamente',
      item: nuevoItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/inventario/salones/:salonId/:itemId/cantidad-minima
 * @desc    Actualizar cantidad mínima de un item en inventario de salón
 * @access  Private (Inventario)
 */
router.put('/salones/:salonId/:itemId/cantidad-minima', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salonId, itemId } = req.params;
    const { cantidad_minima } = req.body;

    if (cantidad_minima === undefined || cantidad_minima < 0) {
      throw new ValidationError('La cantidad mínima debe ser un número válido mayor o igual a 0');
    }

    // Verificar que el registro existe
    const itemSalon = await prisma.inventario_salones.findUnique({
      where: {
        salon_id_item_id: {
          salon_id: parseInt(salonId),
          item_id: parseInt(itemId)
        }
      },
      include: {
        inventario_items: true,
        salones: true
      }
    });

    if (!itemSalon) {
      throw new NotFoundError('Item no encontrado en el inventario del salón');
    }

    // Actualizar cantidad mínima
    const itemActualizado = await prisma.inventario_salones.update({
      where: {
        salon_id_item_id: {
          salon_id: parseInt(salonId),
          item_id: parseInt(itemId)
        }
      },
      data: {
        cantidad_minima: parseFloat(cantidad_minima),
        fecha_actualizacion: new Date()
      },
      include: {
        inventario_items: true,
        salones: true
      }
    });

    res.json({
      success: true,
      message: 'Cantidad mínima actualizada correctamente',
      item: {
        ...itemActualizado,
        necesita_reposicion: parseFloat(itemActualizado.cantidad_actual) < parseFloat(itemActualizado.cantidad_minima)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/inventario/items/:itemId
 * @desc    Eliminar (desactivar) un item de inventario
 * @access  Private (Inventario)
 */
router.delete('/items/:itemId', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Verificar que el item existe
    const item = await prisma.inventario_items.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        inventario_central: true,
        inventario_salones: true
      }
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado');
    }

    // Verificar si tiene inventario asignado
    const tieneInventarioCentral = item.inventario_central && item.inventario_central.length > 0;
    const tieneInventarioSalones = item.inventario_salones && item.inventario_salones.length > 0;
    const tieneCantidad = tieneInventarioCentral && 
      item.inventario_central.some(ic => parseFloat(ic.cantidad_actual) > 0) ||
      tieneInventarioSalones && 
      item.inventario_salones.some(is => parseFloat(is.cantidad_actual) > 0);

    if (tieneCantidad) {
      throw new ValidationError('No se puede eliminar un item que tiene inventario asignado. Primero debe transferir o eliminar todo el inventario.');
    }

    // Marcar como inactivo en lugar de eliminar físicamente (soft delete)
    await prisma.inventario_items.update({
      where: { id: parseInt(itemId) },
      data: {
        activo: false,
        fecha_actualizacion: new Date()
      }
    });

    // Eliminar registros de inventario central y salones si existen
    if (tieneInventarioCentral) {
      await prisma.inventario_central.deleteMany({
        where: { item_id: parseInt(itemId) }
      });
    }

    if (tieneInventarioSalones) {
      await prisma.inventario_salones.deleteMany({
        where: { item_id: parseInt(itemId) }
      });
    }

    res.json({
      success: true,
      message: 'Item eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ALERTAS DE STOCK
// ====================================

/**
 * @route   GET /api/inventario/alertas
 * @desc    Obtener alertas de stock bajo
 * @access  Private (Inventario)
 */
router.get('/alertas', authenticate, requireInventario, async (req, res, next) => {
  try {
    const alertas = await obtenerAlertasStock();

    res.json({
      success: true,
      alertas,
      total_alertas: alertas.length,
      alertas_central: alertas.filter(a => a.tipo === 'central').length,
      alertas_salones: alertas.filter(a => a.tipo === 'salon').length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/abastecer-salon
 * @desc    Abastecer un salón con múltiples items desde el almacén central
 * @access  Private (Inventario)
 */
router.post('/abastecer-salon', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salon_id, items, motivo } = req.body;

    if (!salon_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('salon_id y items (array) son requeridos');
    }

    // Verificar que el salón existe
    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salon_id) }
    });

    if (!salon) {
      throw new NotFoundError('Salón no encontrado');
    }

    const transferencias = [];
    const errores = [];

    // Procesar cada item
    for (const itemData of items) {
      const { item_id, cantidad } = itemData;

      if (!item_id || !cantidad || cantidad <= 0) {
        errores.push({ item_id, error: 'item_id y cantidad válida son requeridos' });
        continue;
      }

      try {
        // Verificar que el item existe en inventario central
        const itemCentral = await prisma.inventario_central.findUnique({
          where: { item_id: parseInt(item_id) },
          include: { inventario_items: true }
        });

        if (!itemCentral) {
          errores.push({ item_id, error: 'Item no encontrado en inventario central' });
          continue;
        }

        if (parseFloat(itemCentral.cantidad_actual) < parseFloat(cantidad)) {
          errores.push({ item_id, error: `Stock insuficiente. Disponible: ${itemCentral.cantidad_actual}` });
          continue;
        }

        // Actualizar inventario central (restar)
        await prisma.inventario_central.update({
          where: { item_id: parseInt(item_id) },
          data: {
            cantidad_actual: {
              decrement: parseFloat(cantidad)
            },
            fecha_actualizacion: new Date()
          }
        });

        // Actualizar o crear inventario del salón (sumar)
        await prisma.inventario_salones.upsert({
          where: {
            salon_id_item_id: {
              salon_id: parseInt(salon_id),
              item_id: parseInt(item_id)
            }
          },
          update: {
            cantidad_actual: {
              increment: parseFloat(cantidad)
            },
            fecha_actualizacion: new Date()
          },
          create: {
            salon_id: parseInt(salon_id),
            item_id: parseInt(item_id),
            cantidad_actual: parseFloat(cantidad),
            cantidad_minima: 10.00,
            fecha_actualizacion: new Date()
          }
        });

        // Registrar movimiento
        await prisma.movimientos_inventario.create({
          data: {
            item_id: parseInt(item_id),
            tipo_movimiento: 'transferencia',
            origen: 'central',
            destino: salon.nombre.toLowerCase(),
            cantidad: parseFloat(cantidad),
            motivo: motivo || `Abastecimiento masivo del salón ${salon.nombre}`,
            usuario_id: req.user.id
          }
        });

        transferencias.push({
          item_id: parseInt(item_id),
          item_nombre: itemCentral.inventario_items.nombre,
          cantidad: parseFloat(cantidad)
        });
      } catch (error) {
        errores.push({ item_id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Abastecimiento completado: ${transferencias.length} items transferidos, ${errores.length} errores`,
      transferencias,
      errores,
      salon: {
        id: salon.id,
        nombre: salon.nombre
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/retorno-central
 * @desc    Retornar items del inventario del salón al almacén central
 * @access  Private (Inventario)
 */
router.post('/retorno-central', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salon_id, items, motivo } = req.body;

    if (!salon_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('salon_id y items (array) son requeridos');
    }

    // Verificar que el salón existe
    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salon_id) }
    });

    if (!salon) {
      throw new NotFoundError('Salón no encontrado');
    }

    const retornos = [];
    const errores = [];

    // Procesar cada item
    for (const itemData of items) {
      const { item_id, cantidad } = itemData;

      if (!item_id || !cantidad || cantidad <= 0) {
        errores.push({ item_id, error: 'item_id y cantidad válida son requeridos' });
        continue;
      }

      try {
        // Verificar que el item existe en inventario del salón
        const itemSalon = await prisma.inventario_salones.findUnique({
          where: {
            salon_id_item_id: {
              salon_id: parseInt(salon_id),
              item_id: parseInt(item_id)
            }
          },
          include: { inventario_items: true }
        });

        if (!itemSalon) {
          errores.push({ item_id, error: 'Item no encontrado en inventario del salón' });
          continue;
        }

        if (parseFloat(itemSalon.cantidad_actual) < parseFloat(cantidad)) {
          errores.push({ item_id, error: `Stock insuficiente. Disponible: ${itemSalon.cantidad_actual}` });
          continue;
        }

        // Actualizar inventario del salón (restar)
        await prisma.inventario_salones.update({
          where: {
            salon_id_item_id: {
              salon_id: parseInt(salon_id),
              item_id: parseInt(item_id)
            }
          },
          data: {
            cantidad_actual: {
              decrement: parseFloat(cantidad)
            },
            fecha_actualizacion: new Date()
          }
        });

        // Actualizar o crear inventario central (sumar)
        await prisma.inventario_central.upsert({
          where: { item_id: parseInt(item_id) },
          update: {
            cantidad_actual: {
              increment: parseFloat(cantidad)
            },
            fecha_actualizacion: new Date()
          },
          create: {
            item_id: parseInt(item_id),
            cantidad_actual: parseFloat(cantidad),
            cantidad_minima: 20.00,
            fecha_actualizacion: new Date()
          }
        });

        // Registrar movimiento
        await prisma.movimientos_inventario.create({
          data: {
            item_id: parseInt(item_id),
            tipo_movimiento: 'salida',
            origen: salon.nombre.toLowerCase(),
            destino: 'central',
            cantidad: parseFloat(cantidad),
            motivo: motivo || `Retorno a almacén central desde ${salon.nombre}`,
            usuario_id: req.user.id
          }
        });

        retornos.push({
          item_id: parseInt(item_id),
          item_nombre: itemSalon.inventario_items.nombre,
          cantidad: parseFloat(cantidad)
        });
      } catch (error) {
        errores.push({ item_id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Retorno completado: ${retornos.length} items retornados, ${errores.length} errores`,
      retornos,
      errores,
      salon: {
        id: salon.id,
        nombre: salon.nombre
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/contratos-alertas
 * @desc    Obtener contratos que requieren asignación de inventario (30 días o menos)
 * @access  Private (Inventario)
 */
router.get('/contratos-alertas', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salon_id } = req.query;

    // Calcular fecha límite (30 días desde hoy)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);

    const where = {
      estado: 'activo',
      salon_id: { not: null },
      fecha_evento: {
        gte: fechaHoy,
        lte: fechaLimite
      }
    };

    if (salon_id) {
      where.salon_id = parseInt(salon_id);
    }

    const contratos = await prisma.contratos.findMany({
      where,
      include: {
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true
          }
        },
        asignaciones_inventario: {
          where: {
            estado: { not: 'cancelado' }
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    // Agregar información de días restantes y si necesita asignación
    const contratosConAlertas = contratos.map(contrato => {
      const fechaEvento = new Date(contrato.fecha_evento);
      const diasRestantes = Math.ceil((fechaEvento - fechaHoy) / (1000 * 60 * 60 * 24));
      const tieneAsignacion = contrato.asignaciones_inventario.length > 0;

      return {
        ...contrato,
        dias_restantes: diasRestantes,
        necesita_asignacion: !tieneAsignacion,
        tiene_asignacion: tieneAsignacion
      };
    });

    res.json({
      success: true,
      contratos: contratosConAlertas,
      total: contratosConAlertas.length,
      sin_asignacion: contratosConAlertas.filter(c => !c.tiene_asignacion).length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/ejecutar-asignacion-automatica
 * @desc    Ejecutar asignación automática de inventario manualmente
 * @access  Private (Inventario)
 */
router.post('/ejecutar-asignacion-automatica', authenticate, requireInventario, async (req, res, next) => {
  try {
    const resultado = await asignarInventarioAutomatico();

    res.json({
      success: true,
      message: 'Asignación automática ejecutada',
      resultado
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/lista-compra-pdf
 * @desc    Generar PDF de lista de compra con items seleccionados y guardar la lista
 * @access  Private (Inventario)
 */
router.post('/lista-compra-pdf', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Debe proporcionar al menos un item para la lista de compra');
    }

    // Validar que los items tengan la estructura correcta
    const itemsValidados = items.map(item => {
      if (!item.item_id) {
        throw new ValidationError('Cada item debe tener un item_id');
      }
      return {
        item_id: item.item_id,
        nombre: item.nombre || 'Item sin nombre',
        cantidad_actual: parseFloat(item.cantidad_actual || 0),
        cantidad_minima: parseFloat(item.cantidad_minima || 0),
        cantidad_a_comprar: parseFloat(item.cantidad_a_comprar || 0),
        unidad_medida: item.unidad_medida || 'unidad',
        categoria: item.categoria || 'Sin categoría'
      };
    });

    // Guardar la lista de compra en la base de datos (usando JSON en una tabla simple)
    // Primero, eliminar listas de compra anteriores no recibidas
    await prisma.$executeRaw`
      DELETE FROM listas_compra 
      WHERE recibida = false
    `.catch(() => {
      // Si la tabla no existe, la crearemos después
    });

    // Insertar nueva lista de compra
    const listaCompra = await prisma.$executeRaw`
      INSERT INTO listas_compra (items, fecha_creacion, recibida, usuario_id)
      VALUES (${JSON.stringify(itemsValidados)}::jsonb, NOW(), false, ${req.user.id})
      RETURNING *
    `.catch(async () => {
      // Si la tabla no existe, crearla primero
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS listas_compra (
          id SERIAL PRIMARY KEY,
          items JSONB NOT NULL,
          fecha_creacion TIMESTAMP DEFAULT NOW(),
          fecha_recepcion TIMESTAMP,
          recibida BOOLEAN DEFAULT false,
          usuario_id INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      // Luego insertar
      return await prisma.$executeRaw`
        INSERT INTO listas_compra (items, fecha_creacion, recibida, usuario_id)
        VALUES (${JSON.stringify(itemsValidados)}::jsonb, NOW(), false, ${req.user.id})
        RETURNING *
      `;
    });

    // Generar PDF
    const pdfBuffer = await generarListaCompraPDF(itemsValidados);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Lista-Compra-${new Date().toISOString().split('T')[0]}.pdf`);

    // Enviar el PDF
    res.send(pdfBuffer);

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/ultima-lista-compra
 * @desc    Obtener la última lista de compra generada que no ha sido recibida
 * @access  Private (Inventario)
 */
router.get('/ultima-lista-compra', authenticate, requireInventario, async (req, res, next) => {
  try {
    const listaCompra = await prisma.$queryRaw`
      SELECT * FROM listas_compra
      WHERE recibida = false
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `.catch(() => {
      return [];
    });

    // Verificar que realmente hay una lista y que no está recibida
    if (!listaCompra || !Array.isArray(listaCompra) || listaCompra.length === 0) {
      return res.json({
        success: true,
        tiene_lista: false,
        lista: null
      });
    }

    const lista = listaCompra[0];
    
    // Verificación adicional: asegurar que no esté recibida
    if (lista.recibida === true) {
      return res.json({
        success: true,
        tiene_lista: false,
        lista: null
      });
    }

    res.json({
      success: true,
      tiene_lista: true,
      lista: {
        id: lista.id,
        items: lista.items,
        fecha_creacion: lista.fecha_creacion
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/inventario/recibir-compra
 * @desc    Recibir compra y actualizar inventario central con las cantidades recibidas
 * @access  Private (Inventario)
 */
router.post('/recibir-compra', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { items } = req.body; // Array de { item_id, cantidad_recibida }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Debe proporcionar al menos un item recibido');
    }

    const resultados = [];
    const errores = [];

    // Procesar cada item recibido
    for (const itemData of items) {
      const { item_id, cantidad_recibida } = itemData;

      if (!item_id || cantidad_recibida === undefined || cantidad_recibida < 0) {
        errores.push({ item_id, error: 'item_id y cantidad_recibida válida son requeridos' });
        continue;
      }

      try {
        // Verificar que el item existe en inventario central
        const itemCentral = await prisma.inventario_central.findUnique({
          where: { item_id: parseInt(item_id) },
          include: { inventario_items: true }
        });

        if (!itemCentral) {
          errores.push({ item_id, error: 'Item no encontrado en inventario central' });
          continue;
        }

        // Actualizar inventario central (sumar cantidad recibida)
        const itemActualizado = await prisma.inventario_central.update({
          where: { item_id: parseInt(item_id) },
          data: {
            cantidad_actual: {
              increment: parseFloat(cantidad_recibida)
            },
            fecha_actualizacion: new Date()
          },
          include: {
            inventario_items: true
          }
        });

        // Registrar movimiento de entrada
        await prisma.movimientos_inventario.create({
          data: {
            item_id: parseInt(item_id),
            tipo_movimiento: 'entrada',
            origen: 'compra',
            cantidad: parseFloat(cantidad_recibida),
            motivo: 'Recepción de compra',
            usuario_id: req.user.id
          }
        });

        resultados.push({
          item_id: parseInt(item_id),
          nombre: itemActualizado.inventario_items.nombre,
          cantidad_recibida: parseFloat(cantidad_recibida),
          cantidad_anterior: parseFloat(itemCentral.cantidad_actual),
          cantidad_nueva: parseFloat(itemActualizado.cantidad_actual)
        });
      } catch (error) {
        errores.push({ item_id, error: error.message });
      }
    }

    // Marcar la lista de compra como recibida (la más reciente no recibida)
    if (resultados.length > 0) {
      try {
        // Primero obtener el ID de la lista más reciente no recibida
        const listaPendiente = await prisma.$queryRaw`
          SELECT id FROM listas_compra
          WHERE recibida = false
          ORDER BY fecha_creacion DESC
          LIMIT 1
        `;

        if (listaPendiente && listaPendiente.length > 0) {
          const listaId = listaPendiente[0].id;
          await prisma.$executeRaw`
            UPDATE listas_compra
            SET recibida = true, fecha_recepcion = NOW()
            WHERE id = ${listaId}
          `;
        }
      } catch (error) {
        logger.error('Error al marcar lista como recibida:', error);
        // Si falla, no es crítico pero lo registramos
      }
    }

    res.json({
      success: true,
      message: `Compra recibida: ${resultados.length} items actualizados`,
      resultados,
      errores: errores.length > 0 ? errores : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/inventario/contratos
 * @desc    Obtener contratos filtrados por salón y fecha (para administración de pagos)
 * @access  Private (Inventario)
 */
router.get('/contratos', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salon_nombre, mes, anio } = req.query;

    const where = {
      estado: 'activo'
    };

    // Filtro por salón (por nombre)
    if (salon_nombre) {
      where.OR = [
        { salones: { nombre: { equals: salon_nombre, mode: 'insensitive' } } },
        { lugar_salon: { equals: salon_nombre, mode: 'insensitive' } }
      ];
    }

    // Filtro por mes y año
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const fechaInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59);
      
      where.fecha_evento = {
        gte: fechaInicio,
        lte: fechaFin
      };
    }

    const contratos = await prisma.contratos.findMany({
      where,
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        paquetes: {
          select: {
            id: true,
            nombre: true,
            precio_base: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            fecha_evento: true,
            hora_inicio: true,
            hora_fin: true,
            cantidad_invitados_confirmados: true
          }
        },
        pagos: {
          select: {
            id: true,
            monto: true,
            monto_total: true,
            metodo_pago: true,
            tipo_tarjeta: true,
            numero_referencia: true,
            fecha_pago: true,
            estado: true
          },
          orderBy: {
            fecha_pago: 'desc'
          }
        }
      },
      orderBy: {
        fecha_evento: 'asc'
      }
    });

    res.json({
      success: true,
      count: contratos.length,
      contratos
    });
  } catch (error) {
    logger.error('Error al obtener contratos para administración:', error);
    next(error);
  }
});

/**
 * @route   GET /api/inventario/pdf/central
 * @desc    Generar PDF del inventario central
 * @access  Private (Inventario)
 */
router.get('/pdf/central', authenticate, requireInventario, async (req, res, next) => {
  try {
    const inventario = await prisma.inventario_central.findMany({
      include: {
        inventario_items: true
      },
      orderBy: {
        inventario_items: {
          nombre: 'asc'
        }
      }
    });

    const pdfBuffer = await generarInventarioPDF(inventario, 'central');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Inventario-Central-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error al generar PDF de inventario central:', error);
    next(error);
  }
});

/**
 * @route   GET /api/inventario/pdf/salon/:salonNombre
 * @desc    Generar PDF del inventario de un salón específico
 * @access  Private (Inventario)
 */
router.get('/pdf/salon/:salonNombre', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { salonNombre } = req.params;

    // Buscar el salón por nombre
    const salon = await prisma.salones.findFirst({
      where: {
        nombre: {
          equals: salonNombre,
          mode: 'insensitive'
        }
      }
    });

    if (!salon) {
      throw new NotFoundError(`Salón "${salonNombre}" no encontrado`);
    }

    const inventario = await prisma.inventario_salones.findMany({
      where: {
        salon_id: salon.id
      },
      include: {
        inventario_items: true
      },
      orderBy: {
        inventario_items: {
          nombre: 'asc'
        }
      }
    });

    const pdfBuffer = await generarInventarioPDF(inventario, salonNombre);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Inventario-${salonNombre}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error al generar PDF de inventario del salón ${req.params.salonNombre}:`, error);
    next(error);
  }
});

module.exports = router;

