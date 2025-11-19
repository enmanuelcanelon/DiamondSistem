/**
 * Script para limpiar ofertas
 * Este script elimina todas las ofertas y sus datos relacionados
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarOfertas() {
  try {
    console.log('🧹 Iniciando limpieza de ofertas...\n');

    // 1. Contar ofertas antes de eliminar
    const ofertasCount = await prisma.ofertas.count();
    console.log(`📊 Ofertas encontradas: ${ofertasCount}`);

    if (ofertasCount === 0) {
      console.log('✅ No hay ofertas para eliminar.');
      return;
    }

    // 2. Eliminar servicios adicionales de ofertas primero
    console.log('\n🗑️  Eliminando servicios adicionales de ofertas...');
    const serviciosAdicionalesCount = await prisma.ofertas_servicios_adicionales.count();
    if (serviciosAdicionalesCount > 0) {
      await prisma.ofertas_servicios_adicionales.deleteMany({});
      console.log(`   ✅ ${serviciosAdicionalesCount} servicios adicionales eliminados`);
    } else {
      console.log('   ℹ️  No hay servicios adicionales para eliminar');
    }

    // 3. Eliminar ofertas
    console.log('\n🗑️  Eliminando ofertas...');
    const resultado = await prisma.ofertas.deleteMany({});
    console.log(`   ✅ ${resultado.count} ofertas eliminadas`);

    // Verificación final
    const ofertasRestantes = await prisma.ofertas.count();
    const serviciosRestantes = await prisma.ofertas_servicios_adicionales.count();

    console.log('\n✅ Limpieza completada!');
    console.log('\n📊 Resumen:');
    console.log(`   - Ofertas eliminadas: ${ofertasCount}`);
    console.log(`   - Servicios adicionales eliminados: ${serviciosAdicionalesCount}`);

    console.log('\n🔍 Verificación:');
    console.log(`   - Ofertas restantes: ${ofertasRestantes}`);
    console.log(`   - Servicios adicionales restantes: ${serviciosRestantes}`);

    if (ofertasRestantes === 0 && serviciosRestantes === 0) {
      console.log('\n✅ Todas las ofertas han sido eliminadas correctamente.');
    } else {
      console.log('\n⚠️  Algunos registros no pudieron ser eliminados.');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  limpiarOfertas()
    .then(() => {
      console.log('\n✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { limpiarOfertas };


