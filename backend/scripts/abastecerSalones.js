/**
 * Script para abastecer los salones desde el inventario central
 * Transfiere productos del almacén central a Diamond, Kendall y Doral
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function abastecerSalones() {
  try {
    console.log('🚀 Iniciando abastecimiento de salones...\n');

    // Obtener IDs de los salones
    const salones = await prisma.salones.findMany({
      where: {
        nombre: {
          in: ['Diamond', 'Kendall', 'Doral']
        },
        activo: true
      }
    });

    if (salones.length === 0) {
      console.error('❌ No se encontraron los salones Diamond, Kendall o Doral');
      return;
    }

    console.log(`✅ Salones encontrados: ${salones.map(s => s.nombre).join(', ')}\n`);

    // Obtener todos los items del inventario central
    const inventarioCentral = await prisma.inventario_central.findMany({
      include: {
        inventario_items: true
      },
      where: {
        cantidad_actual: {
          gt: 0
        }
      }
    });

    if (inventarioCentral.length === 0) {
      console.error('❌ No hay items en el inventario central');
      return;
    }

    console.log(`📦 Items en inventario central: ${inventarioCentral.length}\n`);

    // Cantidad a transferir por item a cada salón
    const CANTIDAD_POR_SALON = 50; // Ajusta esta cantidad según necesites

    let totalTransferencias = 0;
    let totalErrores = 0;

    // Para cada salón
    for (const salon of salones) {
      console.log(`\n🏢 Abasteciendo salón: ${salon.nombre}`);
      console.log('─'.repeat(50));

      let transferenciasSalon = 0;
      let erroresSalon = 0;

      // Para cada item del inventario central
      for (const itemCentral of inventarioCentral) {
        const item = itemCentral.inventario_items;
        const cantidadDisponible = parseFloat(itemCentral.cantidad_actual);
        const cantidadATransferir = Math.min(CANTIDAD_POR_SALON, cantidadDisponible);

        if (cantidadATransferir <= 0) {
          continue;
        }

        try {
          // Verificar si ya existe inventario en el salón para este item
          const inventarioSalonExistente = await prisma.inventario_salones.findUnique({
            where: {
              salon_id_item_id: {
                salon_id: salon.id,
                item_id: item.id
              }
            }
          });

          if (inventarioSalonExistente) {
            // Si ya existe, solo actualizar la cantidad
            await prisma.inventario_salones.update({
              where: {
                salon_id_item_id: {
                  salon_id: salon.id,
                  item_id: item.id
                }
              },
              data: {
                cantidad_actual: {
                  increment: cantidadATransferir
                },
                fecha_actualizacion: new Date()
              }
            });
          } else {
            // Si no existe, crear nuevo registro
            await prisma.inventario_salones.create({
              data: {
                salon_id: salon.id,
                item_id: item.id,
                cantidad_actual: cantidadATransferir,
                cantidad_minima: 10.00,
                fecha_actualizacion: new Date()
              }
            });
          }

          // Restar del inventario central
          await prisma.inventario_central.update({
            where: {
              item_id: item.id
            },
            data: {
              cantidad_actual: {
                decrement: cantidadATransferir
              },
              fecha_actualizacion: new Date()
            }
          });

          // Registrar movimiento
          await prisma.movimientos_inventario.create({
            data: {
              item_id: item.id,
              tipo_movimiento: 'transferencia',
              origen: 'central',
              destino: salon.nombre.toLowerCase(),
              cantidad: cantidadATransferir,
              motivo: `Abastecimiento inicial del salón ${salon.nombre}`,
              fecha_movimiento: new Date()
            }
          });

          transferenciasSalon++;
          totalTransferencias++;

          console.log(`  ✅ ${item.nombre}: ${cantidadATransferir} ${item.unidad_medida}`);
        } catch (error) {
          erroresSalon++;
          totalErrores++;
          console.error(`  ❌ Error con ${item.nombre}: ${error.message}`);
        }
      }

      console.log(`\n📊 Resumen ${salon.nombre}: ${transferenciasSalon} items transferidos, ${erroresSalon} errores`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(50));
    console.log(`✅ Total de transferencias exitosas: ${totalTransferencias}`);
    console.log(`❌ Total de errores: ${totalErrores}`);
    console.log(`🏢 Salones abastecidos: ${salones.length}`);
    console.log('\n✅ Abastecimiento completado!');

  } catch (error) {
    console.error('❌ Error en el proceso de abastecimiento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  abastecerSalones()
    .then(() => {
      console.log('\n✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error ejecutando el script:', error);
      process.exit(1);
    });
}

module.exports = { abastecerSalones };

