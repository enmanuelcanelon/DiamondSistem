const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function crearPaquetesSalones() {
  try {
    console.log('🔗 Creando relaciones paquetes-salones...\n');

    // Obtener todos los salones y paquetes
    const salones = await prisma.salones.findMany({ where: { activo: true } });
    const paquetes = await prisma.paquetes.findMany({ where: { activo: true } });

    if (salones.length === 0) {
      console.log('⚠️  No hay salones. Ejecuta primero: node scripts/crear_salones.js');
      return;
    }

    if (paquetes.length === 0) {
      console.log('⚠️  No hay paquetes. Ejecuta primero: node scripts/ejecutar_seeds.js');
      return;
    }

    console.log(`📋 Salones encontrados: ${salones.length}`);
    console.log(`📦 Paquetes encontrados: ${paquetes.length}\n`);

    // Mapeo de precios por salón según migration_salones.sql
    const preciosPorSalon = {
      'Diamond': {
        'Especial': { precio: 3500, invitados: 80, disponible: true },
        'Platinum': { precio: 7500, invitados: 80, disponible: true },
        'Diamond': { precio: 10500, invitados: 80, disponible: true },
        'Deluxe': { precio: 12500, invitados: 80, disponible: true },
        'Personalizado': { precio: 6000, invitados: 50, disponible: true }
      },
      'Kendall': {
        'Especial': { precio: 2500, invitados: 60, disponible: true },
        'Platinum': { precio: 4200, invitados: 60, disponible: true },
        'Diamond': { precio: 5500, invitados: 60, disponible: true },
        'Deluxe': { precio: 0, invitados: 60, disponible: false }, // No disponible en Kendall
        'Personalizado': { precio: 3500, invitados: 60, disponible: true }
      },
      'Doral': {
        'Especial': { precio: 2500, invitados: 60, disponible: true },
        'Platinum': { precio: 4200, invitados: 60, disponible: true },
        'Diamond': { precio: 5500, invitados: 60, disponible: true },
        'Deluxe': { precio: 0, invitados: 60, disponible: false }, // No disponible en Doral
        'Personalizado': { precio: 3500, invitados: 60, disponible: true }
      }
    };

    let creados = 0;
    let actualizados = 0;

    for (const salon of salones) {
      for (const paquete of paquetes) {
        const precioInfo = preciosPorSalon[salon.nombre]?.[paquete.nombre];
        
        if (!precioInfo) {
          console.log(`⚠️  No hay precio configurado para ${paquete.nombre} en ${salon.nombre}`);
          continue;
        }

        // Verificar si ya existe
        const existe = await prisma.paquetes_salones.findFirst({
          where: {
            salon_id: salon.id,
            paquete_id: paquete.id
          }
        });

        const data = {
          salon_id: salon.id,
          paquete_id: paquete.id,
          precio_base: precioInfo.precio,
          invitados_minimo: precioInfo.invitados,
          disponible: precioInfo.disponible
        };

        if (existe) {
          await prisma.paquetes_salones.update({
            where: { id: existe.id },
            data
          });
          actualizados++;
        } else {
          await prisma.paquetes_salones.create({ data });
          creados++;
        }
      }
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   - Creados: ${creados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Total: ${creados + actualizados}\n`);

  } catch (error) {
    console.error('❌ Error creando relaciones:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearPaquetesSalones()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

