/**
 * Utilidades para cálculo automático de inventario
 * Basado en número de invitados y salón
 */

const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

// Configuración base por salón (80 invitados)
const CONFIGURACION_BASE = {
  diamond: {
    invitados_base: 80,
    items: {
      // Bebidas alcohólicas
      'Champaña': { cantidad: 10, unidad: 'botella', calculo: 'por_personas', ratio: 8 }, // 1 botella por 8 personas
      'Sidra': { cantidad: 10, unidad: 'botella', calculo: 'por_personas', ratio: 8 },
      'Whisky Premium': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Whisky House': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Vodka': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Tequila': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Ron Spice': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Ron Blanco': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Vino Blanco': { cantidad: 6, unidad: 'botella', calculo: 'fijo' },
      'Vino Tinto': { cantidad: 6, unidad: 'botella', calculo: 'fijo' },
      'Vino Chardonnay': { cantidad: 6, unidad: 'botella', calculo: 'fijo' },
      'Chamberry': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Blue Curacao': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Piña Colada': { cantidad: 4, unidad: 'botella', calculo: 'fijo' },
      
      // Bebidas no alcohólicas
      'Jugo de Naranja': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Agua Tónica': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Club Soda': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Coca Cola': { cantidad: 6, unidad: 'botella', calculo: 'fijo' },
      'Coca Cola Zero': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Coca Cola Light': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Sprite': { cantidad: 4, unidad: 'botella', calculo: 'fijo' },
      'Sprite Zero': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Fanta Naranja': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Granadina': { cantidad: 0.25, unidad: 'botella', calculo: 'fijo' },
      
      // Vajilla
      'Vasos de Vidrio': { cantidad: 200, unidad: 'unidad', calculo: 'fijo' },
      'Vasos de Plástico': { cantidad: 100, unidad: 'unidad', calculo: 'fijo' },
      'Platos para Cake': { cantidad: 80, unidad: 'unidad', calculo: 'por_invitados', ratio: 1 }, // 1 por invitado
      'Platos de Vidrio Pequeños': { cantidad: 160, unidad: 'unidad', calculo: 'por_invitados', ratio: 2 }, // 2 por invitado
      'Servilletas Blancas': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Servilletas Negras': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Pinchos para Dientes': { cantidad: 1, unidad: 'unidad', calculo: 'fijo' }, // "un montoncito"
      
      // Decoración
      'Velas para Cake': { cantidad: 2, unidad: 'unidad', calculo: 'fijo' },
      
      // Mesa de Queso
      'Queso Brie': { cantidad: 1, unidad: 'bola', calculo: 'fijo' },
      'Queso Amarillo': { cantidad: 2, unidad: 'bolsa', calculo: 'fijo' },
      'Queso Blanco': { cantidad: 2, unidad: 'bolsa', calculo: 'fijo' },
      'Queso Azul': { cantidad: 2, unidad: 'bolsa', calculo: 'fijo' },
      'Queso Parmesano': { cantidad: 2, unidad: 'bolsa', calculo: 'fijo' },
      'Queso Cuadrado Amarillo': { cantidad: 4, unidad: 'bolsa', calculo: 'fijo' },
      'Queso Cuadrado Blanco': { cantidad: 4, unidad: 'bolsa', calculo: 'fijo' },
      'Queso Cuadrado Azul': { cantidad: 4, unidad: 'bolsa', calculo: 'fijo' },
      'Prochuto': { cantidad: 0.25, unidad: 'libra', calculo: 'fijo' },
      'Salami': { cantidad: 0.25, unidad: 'libra', calculo: 'fijo' },
      'Salchichón': { cantidad: 0.25, unidad: 'libra', calculo: 'fijo' },
      'Galletas Mixtas': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Humos': { cantidad: 1, unidad: 'unidad', calculo: 'fijo' },
      'Cherry': { cantidad: 0.25, unidad: 'libra', calculo: 'fijo' },
      'Aceituna Negra': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Aceituna Verde': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Piña': { cantidad: 0.5, unidad: 'unidad', calculo: 'fijo' }, // Media piña
      'Ensalada de Pollo': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Fresa': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Uva': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Maní': { cantidad: 0.25, unidad: 'libra', calculo: 'fijo' },
      'Limón': { cantidad: 2, unidad: 'paquete', calculo: 'fijo' }
    }
  },
  kendall: {
    invitados_base: 50, // Mínimo para Kendall y Doral
    items: {
      // Bebidas alcohólicas
      'Whisky House': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Whisky Premium': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Ron Blanco': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Ron Spice': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Vodka': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Tequila': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Vino Blanco': { cantidad: 4, unidad: 'botella', calculo: 'fijo' },
      'Vino Tinto': { cantidad: 4, unidad: 'botella', calculo: 'fijo' },
      'Chamberry': { cantidad: 4, unidad: 'botella', calculo: 'fijo' },
      'Piña Colada': { cantidad: 3, unidad: 'botella', calculo: 'fijo' },
      'Sidra': { cantidad: 7, unidad: 'botella', calculo: 'fijo' },
      'Champaña': { cantidad: 7, unidad: 'botella', calculo: 'fijo' },
      
      // Bebidas no alcohólicas
      'Sprite': { cantidad: 3, unidad: 'botella', calculo: 'fijo' },
      'Sprite Zero': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Fanta Naranja': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Club Soda': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Coca Cola Light': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Coca Cola Zero': { cantidad: 1, unidad: 'botella', calculo: 'fijo' },
      'Coca Cola': { cantidad: 4, unidad: 'botella', calculo: 'fijo' },
      'Blue Curacao': { cantidad: 2, unidad: 'botella', calculo: 'fijo' },
      'Granadina': { cantidad: 0.25, unidad: 'botella', calculo: 'fijo' },
      
      // Vajilla
      'Vasos de Plástico': { cantidad: 200, unidad: 'unidad', calculo: 'fijo' }, // Grandes
      'Vasos de Plástico Pequeños': { cantidad: 100, unidad: 'unidad', calculo: 'fijo' }, // Pequeños
      'Platos para Cake': { cantidad: 50, unidad: 'unidad', calculo: 'por_invitados', ratio: 1 }, // 1 por invitado
      'Platos de Vidrio Pequeños': { cantidad: 100, unidad: 'unidad', calculo: 'por_invitados', ratio: 2 }, // 2 por invitado
      'Servilletas Blancas': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      'Servilletas Negras': { cantidad: 1, unidad: 'paquete', calculo: 'fijo' },
      
      // Decoración
      'Velas para Cake': { cantidad: 2, unidad: 'unidad', calculo: 'fijo' },
      
      // Mesa de Queso (mismo que Diamond - se copiará)
    }
  },
  doral: {
    invitados_base: 50, // Mínimo para Kendall y Doral
    items: {} // Se copiará de kendall (mismo que kendall)
  }
};

// Copiar mesa de queso de diamond a kendall y doral
const mesaDeQuesoItems = {
  'Queso Brie': CONFIGURACION_BASE.diamond.items['Queso Brie'],
  'Queso Amarillo': CONFIGURACION_BASE.diamond.items['Queso Amarillo'],
  'Queso Blanco': CONFIGURACION_BASE.diamond.items['Queso Blanco'],
  'Queso Azul': CONFIGURACION_BASE.diamond.items['Queso Azul'],
  'Queso Parmesano': CONFIGURACION_BASE.diamond.items['Queso Parmesano'],
  'Queso Cuadrado Amarillo': CONFIGURACION_BASE.diamond.items['Queso Cuadrado Amarillo'],
  'Queso Cuadrado Blanco': CONFIGURACION_BASE.diamond.items['Queso Cuadrado Blanco'],
  'Queso Cuadrado Azul': CONFIGURACION_BASE.diamond.items['Queso Cuadrado Azul'],
  'Prochuto': CONFIGURACION_BASE.diamond.items['Prochuto'],
  'Salami': CONFIGURACION_BASE.diamond.items['Salami'],
  'Salchichón': CONFIGURACION_BASE.diamond.items['Salchichón'],
  'Galletas Mixtas': CONFIGURACION_BASE.diamond.items['Galletas Mixtas'],
  'Humos': CONFIGURACION_BASE.diamond.items['Humos'],
  'Cherry': CONFIGURACION_BASE.diamond.items['Cherry'],
  'Aceituna Negra': CONFIGURACION_BASE.diamond.items['Aceituna Negra'],
  'Aceituna Verde': CONFIGURACION_BASE.diamond.items['Aceituna Verde'],
  'Piña': CONFIGURACION_BASE.diamond.items['Piña'],
  'Ensalada de Pollo': CONFIGURACION_BASE.diamond.items['Ensalada de Pollo'],
  'Fresa': CONFIGURACION_BASE.diamond.items['Fresa'],
  'Uva': CONFIGURACION_BASE.diamond.items['Uva'],
  'Maní': CONFIGURACION_BASE.diamond.items['Maní'],
  'Limón': CONFIGURACION_BASE.diamond.items['Limón']
};

// Agregar mesa de queso a kendall
Object.assign(CONFIGURACION_BASE.kendall.items, mesaDeQuesoItems);

// Copiar configuración de kendall a doral
CONFIGURACION_BASE.doral.items = JSON.parse(JSON.stringify(CONFIGURACION_BASE.kendall.items));

/**
 * Calcular cantidad necesaria de un item basado en invitados
 */
const calcularCantidadItem = (itemConfig, invitados, invitadosBase) => {
  if (!itemConfig) {
    return 0;
  }

  const { cantidad, calculo, ratio } = itemConfig;

  switch (calculo) {
    case 'por_personas':
      // Ejemplo: Champaña - 1 botella por 8 personas
      // Para 80 invitados: 10 botellas
      // Para 100 invitados: 100/8 = 12.5 -> 13 botellas
      return Math.ceil((invitados / ratio) * (cantidad / (invitadosBase / ratio)));
    
    case 'por_invitados':
      // Ejemplo: Platos para Cake - 1 por invitado
      // Para 80 invitados: 80 platos
      // Para 100 invitados: 100 platos
      return Math.ceil(invitados / ratio) * (cantidad / (invitadosBase / ratio));
    
    case 'fijo':
    default:
      // Cantidad fija independiente de invitados
      return cantidad;
  }
};

/**
 * Calcular inventario necesario para un contrato
 * @param {Object} contrato - Contrato con información del evento
 * @returns {Array} Array de items con cantidades calculadas
 */
const calcularInventarioParaContrato = async (contrato) => {
  try {
    const salonNombre = contrato.salones?.nombre?.toLowerCase() || contrato.lugar_salon?.toLowerCase() || 'diamond';
    const invitados = contrato.cantidad_invitados || 80;
    
    // Obtener configuración del salón
    let configSalon = CONFIGURACION_BASE[salonNombre];
    if (!configSalon) {
      // Si el salón no está en la configuración, usar diamond como default
      configSalon = CONFIGURACION_BASE.diamond;
    }

    const invitadosBase = configSalon.invitados_base;
    const itemsConfig = configSalon.items;

    // Obtener todos los items del catálogo
    const itemsCatalogo = await prisma.inventario_items.findMany({
      where: { activo: true }
    });

    // Calcular cantidades necesarias
    const itemsCalculados = [];

    for (const itemCatalogo of itemsCatalogo) {
      const itemConfig = itemsConfig[itemCatalogo.nombre];
      
      if (itemConfig) {
        const cantidadNecesaria = calcularCantidadItem(itemConfig, invitados, invitadosBase);
        
        itemsCalculados.push({
          item_id: itemCatalogo.id,
          item_nombre: itemCatalogo.nombre,
          cantidad_necesaria: cantidadNecesaria,
          unidad_medida: itemCatalogo.unidad_medida,
          categoria: itemCatalogo.categoria,
          calculo_usado: itemConfig.calculo,
          invitados_base: invitadosBase,
          invitados_evento: invitados
        });
      }
    }

    return itemsCalculados;
  } catch (error) {
    console.error('Error calculando inventario para contrato:', error);
    throw error;
  }
};

/**
 * Asignar inventario a un contrato
 * Toma del inventario del salón o del almacén central
 */
const asignarInventarioAContrato = async (contratoId, itemsCalculados, salonId) => {
  try {
    const asignaciones = [];

    for (const item of itemsCalculados) {
      // Intentar tomar del inventario del salón primero
      let inventarioSalon = await prisma.inventario_salones.findUnique({
        where: {
          salon_id_item_id: {
            salon_id: salonId,
            item_id: item.item_id
          }
        }
      });

      let cantidadDisponible = 0;
      let fuente = 'central';

      if (inventarioSalon && parseFloat(inventarioSalon.cantidad_actual) >= item.cantidad_necesaria) {
        // Hay suficiente en el salón
        cantidadDisponible = parseFloat(inventarioSalon.cantidad_actual);
        fuente = 'salon';
      } else {
        // Verificar inventario central
        const inventarioCentral = await prisma.inventario_central.findUnique({
          where: { item_id: item.item_id }
        });

        if (inventarioCentral && parseFloat(inventarioCentral.cantidad_actual) >= item.cantidad_necesaria) {
          cantidadDisponible = parseFloat(inventarioCentral.cantidad_actual);
          fuente = 'central';
        } else {
          // No hay suficiente stock
          console.warn(`⚠️ Stock insuficiente para ${item.item_nombre}. Necesario: ${item.cantidad_necesaria}, Disponible: ${cantidadDisponible}`);
        }
      }

      if (cantidadDisponible >= item.cantidad_necesaria) {
        // Crear asignación
        const asignacion = await prisma.asignaciones_inventario.create({
          data: {
            contrato_id: contratoId,
            item_id: item.item_id,
            salon_id: salonId,
            cantidad_asignada: item.cantidad_necesaria,
            fuente: fuente,
            estado: 'asignado',
            fecha_asignacion: new Date()
          }
        });

        // Restar del inventario correspondiente
        if (fuente === 'salon') {
          await prisma.inventario_salones.update({
            where: {
              salon_id_item_id: {
                salon_id: salonId,
                item_id: item.item_id
              }
            },
            data: {
              cantidad_actual: {
                decrement: item.cantidad_necesaria
              },
              fecha_actualizacion: new Date()
            }
          });
        } else {
          // Transferir del central al salón primero, luego asignar
          // Actualizar inventario central
          await prisma.inventario_central.update({
            where: { item_id: item.item_id },
            data: {
              cantidad_actual: {
                decrement: item.cantidad_necesaria
              },
              fecha_actualizacion: new Date()
            }
          });

          // Actualizar o crear inventario del salón
          await prisma.inventario_salones.upsert({
            where: {
              salon_id_item_id: {
                salon_id: salonId,
                item_id: item.item_id
              }
            },
            update: {
              cantidad_actual: {
                increment: item.cantidad_necesaria
              },
              fecha_actualizacion: new Date()
            },
            create: {
              salon_id: salonId,
              item_id: item.item_id,
              cantidad_actual: item.cantidad_necesaria,
              cantidad_minima: 10.00,
              fecha_actualizacion: new Date()
            }
          });

          // Luego restar del salón (ya que se asignó)
          await prisma.inventario_salones.update({
            where: {
              salon_id_item_id: {
                salon_id: salonId,
                item_id: item.item_id
              }
            },
            data: {
              cantidad_actual: {
                decrement: item.cantidad_necesaria
              },
              fecha_actualizacion: new Date()
            }
          });
        }

        // Registrar movimiento
        const salon = await prisma.salones.findUnique({
          where: { id: salonId }
        });

        await prisma.movimientos_inventario.create({
          data: {
            item_id: item.item_id,
            tipo_movimiento: 'asignacion',
            origen: fuente === 'central' ? 'central' : salon.nombre.toLowerCase(),
            destino: salon.nombre.toLowerCase(),
            cantidad: item.cantidad_necesaria,
            motivo: `Asignación automática para contrato ${contratoId}`,
            contrato_id: contratoId,
            asignacion_id: asignacion.id
          }
        });

        asignaciones.push(asignacion);
      }
    }

    return asignaciones;
  } catch (error) {
    console.error('Error asignando inventario a contrato:', error);
    throw error;
  }
};

module.exports = {
  calcularInventarioParaContrato,
  asignarInventarioAContrato,
  CONFIGURACION_BASE
};

