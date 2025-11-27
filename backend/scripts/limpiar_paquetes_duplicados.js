const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limpiarPaquetesDuplicados() {
  try {
    console.log('🧹 Limpiando paquetes duplicados...\n');

    // Obtener todos los paquetes agrupados por nombre
    const paquetes = await prisma.$queryRaw`
      SELECT nombre, COUNT(*) as cantidad, array_agg(id ORDER BY id) as ids
      FROM paquetes
      GROUP BY nombre
      HAVING COUNT(*) > 1
    `;

    if (paquetes.length === 0) {
      console.log('✅ No hay paquetes duplicados\n');
      return;
    }

    console.log(`📋 Encontrados ${paquetes.length} paquete(s) con duplicados:\n`);

    let eliminados = 0;

    for (const paquete of paquetes) {
      const ids = paquete.ids;
      const nombre = paquete.nombre;
      const cantidad = parseInt(paquete.cantidad);

      // Mantener el primero (ID más bajo) y eliminar los demás
      const idAMantener = ids[0];
      const idsAEliminar = ids.slice(1);

      console.log(`📦 ${nombre}: ${cantidad} copias encontradas`);
      console.log(`   ✅ Manteniendo ID: ${idAMantener}`);
      console.log(`   🗑️  Eliminando IDs: ${idsAEliminar.join(', ')}`);

      // Verificar si hay relaciones antes de eliminar
      for (const id of idsAEliminar) {
        // Verificar relaciones en paquetes_salones
        const relacionesSalones = await prisma.paquetes_salones.count({
          where: { paquete_id: id }
        });

        // Verificar relaciones en paquetes_servicios
        const relacionesServicios = await prisma.paquetes_servicios.count({
          where: { paquete_id: id }
        });

        // Verificar relaciones en ofertas
        const relacionesOfertas = await prisma.ofertas.count({
          where: { paquete_id: id }
        });

        // Verificar relaciones en contratos
        const relacionesContratos = await prisma.contratos.count({
          where: { paquete_id: id }
        });

        if (relacionesSalones > 0 || relacionesServicios > 0 || relacionesOfertas > 0 || relacionesContratos > 0) {
          console.log(`   ⚠️  ID ${id} tiene relaciones. Migrando a ID ${idAMantener}...`);

          // Migrar relaciones a la copia que se mantiene
          if (relacionesSalones > 0) {
            await prisma.$executeRaw`
              UPDATE paquetes_salones 
              SET paquete_id = ${idAMantener}
              WHERE paquete_id = ${id}
              AND NOT EXISTS (
                SELECT 1 FROM paquetes_salones ps2 
                WHERE ps2.paquete_id = ${idAMantener} 
                AND ps2.salon_id = paquetes_salones.salon_id
              )
            `;
            // Eliminar relaciones duplicadas
            await prisma.paquetes_salones.deleteMany({
              where: { paquete_id: id }
            });
          }

          if (relacionesServicios > 0) {
            await prisma.$executeRaw`
              UPDATE paquetes_servicios 
              SET paquete_id = ${idAMantener}
              WHERE paquete_id = ${id}
              AND NOT EXISTS (
                SELECT 1 FROM paquetes_servicios ps2 
                WHERE ps2.paquete_id = ${idAMantener} 
                AND ps2.servicio_id = paquetes_servicios.servicio_id
              )
            `;
            await prisma.paquetes_servicios.deleteMany({
              where: { paquete_id: id }
            });
          }

          if (relacionesOfertas > 0) {
            await prisma.ofertas.updateMany({
              where: { paquete_id: id },
              data: { paquete_id: idAMantener }
            });
          }

          if (relacionesContratos > 0) {
            await prisma.contratos.updateMany({
              where: { paquete_id: id },
              data: { paquete_id: idAMantener }
            });
          }
        }

        // Eliminar el paquete duplicado
        await prisma.paquetes.delete({
          where: { id: id }
        });

        eliminados++;
      }

      console.log('');
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   - Paquetes duplicados eliminados: ${eliminados}`);
    console.log(`   - Paquetes únicos mantenidos: ${paquetes.length}\n`);

  } catch (error) {
    console.error('❌ Error limpiando paquetes duplicados:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

limpiarPaquetesDuplicados()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

