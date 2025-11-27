const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para limpiar paquetes duplicados ANTES de aplicar el constraint único
 * Este script debe ejecutarse antes de `prisma db push` para evitar errores P2002
 */
async function limpiarDuplicadosSQL() {
  try {
    console.log('🧹 Limpiando paquetes duplicados (SQL directo)...\n');

    // Verificar si la tabla existe
    const tablaExiste = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'paquetes'
      );
    `);

    if (!tablaExiste[0].exists) {
      console.log('⚠️  Tabla paquetes no existe aún, saltando limpieza...\n');
      return;
    }

    // Verificar si hay duplicados
    const duplicados = await prisma.$queryRawUnsafe(`
      SELECT nombre, COUNT(*) as cantidad, array_agg(id ORDER BY id) as ids
      FROM paquetes
      GROUP BY nombre
      HAVING COUNT(*) > 1;
    `);

    if (duplicados.length === 0) {
      console.log('✅ No hay paquetes duplicados\n');
      return;
    }

    console.log(`📋 Encontrados ${duplicados.length} paquete(s) con duplicados\n`);

    // Usar transacción para seguridad
    await prisma.$transaction(async (tx) => {
      for (const duplicado of duplicados) {
        const ids = duplicado.ids;
        const nombre = duplicado.nombre;
        const cantidad = parseInt(duplicado.cantidad);

        // Mantener el primero (ID más bajo) y eliminar los demás
        const idAMantener = ids[0];
        const idsAEliminar = ids.slice(1);

        console.log(`📦 ${nombre}: ${cantidad} copias encontradas`);
        console.log(`   ✅ Manteniendo ID: ${idAMantener}`);
        console.log(`   🗑️  Eliminando IDs: ${idsAEliminar.join(', ')}`);

        // Para cada ID a eliminar, migrar relaciones primero
        for (const idAEliminar of idsAEliminar) {
          // Validar que los IDs son números enteros (seguridad)
          const idMantenerNum = parseInt(idAMantener);
          const idEliminarNum = parseInt(idAEliminar);
          
          if (isNaN(idMantenerNum) || isNaN(idEliminarNum)) {
            console.error(`   ⚠️  IDs inválidos, saltando: ${idAMantener}, ${idAEliminar}`);
            continue;
          }

          // 1. Migrar relaciones en paquetes_salones (solo si la tabla existe)
          try {
            await tx.$executeRawUnsafe(`
              UPDATE paquetes_salones 
              SET paquete_id = ${idMantenerNum}
              WHERE paquete_id = ${idEliminarNum}
              AND NOT EXISTS (
                SELECT 1 FROM paquetes_salones ps2 
                WHERE ps2.paquete_id = ${idMantenerNum}
                AND ps2.salon_id = paquetes_salones.salon_id
              );
            `);

            await tx.$executeRawUnsafe(`
              DELETE FROM paquetes_salones 
              WHERE paquete_id = ${idEliminarNum};
            `);
          } catch (err) {
            // Si la tabla no existe, continuar
            if (!err.message.includes('does not exist') && !err.message.includes('relation')) {
              throw err;
            }
          }

          // 2. Migrar relaciones en paquetes_servicios (solo si la tabla existe)
          try {
            await tx.$executeRawUnsafe(`
              UPDATE paquetes_servicios 
              SET paquete_id = ${idMantenerNum}
              WHERE paquete_id = ${idEliminarNum}
              AND NOT EXISTS (
                SELECT 1 FROM paquetes_servicios ps2 
                WHERE ps2.paquete_id = ${idMantenerNum}
                AND ps2.servicio_id = paquetes_servicios.servicio_id
              );
            `);

            await tx.$executeRawUnsafe(`
              DELETE FROM paquetes_servicios 
              WHERE paquete_id = ${idEliminarNum};
            `);
          } catch (err) {
            if (!err.message.includes('does not exist') && !err.message.includes('relation')) {
              throw err;
            }
          }

          // 3. Migrar relaciones en ofertas (solo si la tabla existe)
          try {
            await tx.$executeRawUnsafe(`
              UPDATE ofertas 
              SET paquete_id = ${idMantenerNum}
              WHERE paquete_id = ${idEliminarNum};
            `);
          } catch (err) {
            if (!err.message.includes('does not exist') && !err.message.includes('relation')) {
              throw err;
            }
          }

          // 4. Migrar relaciones en contratos (solo si la tabla existe)
          try {
            await tx.$executeRawUnsafe(`
              UPDATE contratos 
              SET paquete_id = ${idMantenerNum}
              WHERE paquete_id = ${idEliminarNum};
            `);
          } catch (err) {
            if (!err.message.includes('does not exist') && !err.message.includes('relation')) {
              throw err;
            }
          }

          // 5. Finalmente eliminar el paquete duplicado
          await tx.$executeRawUnsafe(`
            DELETE FROM paquetes 
            WHERE id = ${idEliminarNum};
          `);

          console.log(`   ✅ ID ${idAEliminar} eliminado y relaciones migradas`);
        }
      }
    });

    // Verificar resultado final
    const resultado = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total, COUNT(DISTINCT nombre) as unicos
      FROM paquetes;
    `);

    console.log(`\n✨ Limpieza completada:`);
    console.log(`   ✅ Total paquetes: ${resultado[0].total}`);
    console.log(`   ✅ Paquetes únicos: ${resultado[0].unicos}\n`);

  } catch (error) {
    // Manejo de errores específicos
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
      console.log('⚠️  Tabla paquetes no existe aún, saltando limpieza...\n');
      return;
    }

    if (errorMsg.includes('connection') || errorMsg.includes('timeout')) {
      console.error('❌ Error de conexión a la base de datos');
      throw error;
    }

    // Para otros errores, loguear pero no fallar (para que continúe el deploy)
    console.error('⚠️  Error limpiando duplicados (continuando...):', error.message);
    console.error('   El deploy continuará, pero revisa los logs\n');
  } finally {
    await prisma.$disconnect();
  }
}

limpiarDuplicadosSQL()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    // No hacer exit(1) para que Railway continúe con el deploy
    // El constraint único se aplicará en db push y si falla, al menos intentamos limpiar
    process.exit(0);
  });

