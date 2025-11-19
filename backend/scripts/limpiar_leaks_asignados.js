/**
 * Script para limpiar las asignaciones de leaks
 * Este script resetea vendedor_id y fecha_asignacion de todos los leaks asignados
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarLeaksAsignados() {
  try {
    console.log('🧹 Iniciando limpieza de leaks asignados...\n');

    // Contar leaks asignados antes de limpiar
    const leaksAsignadosCount = await prisma.leaks.count({
      where: {
        vendedor_id: { not: null }
      }
    });

    console.log(`📊 Leaks asignados encontrados: ${leaksAsignadosCount}`);

    if (leaksAsignadosCount === 0) {
      console.log('✅ No hay leaks asignados para limpiar.');
      return;
    }

    // Limpiar asignaciones (poner vendedor_id y fecha_asignacion en null)
    const resultado = await prisma.leaks.updateMany({
      where: {
        vendedor_id: { not: null }
      },
      data: {
        vendedor_id: null,
        fecha_asignacion: null,
        fecha_actualizacion: new Date()
      }
    });

    console.log(`\n✅ Limpieza completada:`);
    console.log(`   - Leaks actualizados: ${resultado.count}`);
    console.log(`   - vendedor_id: null`);
    console.log(`   - fecha_asignacion: null`);

    // Verificar que se limpiaron correctamente
    const leaksAsignadosDespues = await prisma.leaks.count({
      where: {
        vendedor_id: { not: null }
      }
    });

    console.log(`\n📊 Verificación:`);
    console.log(`   - Leaks asignados restantes: ${leaksAsignadosDespues}`);

    if (leaksAsignadosDespues === 0) {
      console.log('✅ Todos los leaks han sido desasignados correctamente.');
    } else {
      console.log(`⚠️  Aún quedan ${leaksAsignadosDespues} leaks asignados.`);
    }

  } catch (error) {
    console.error('❌ Error al limpiar leaks asignados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  limpiarLeaksAsignados()
    .then(() => {
      console.log('\n✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { limpiarLeaksAsignados };




