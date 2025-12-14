/**
 * Script de prueba para el módulo databaseUtils
 */

const { dbUtils, limpiarOfertas, limpiarBaseDatos } = require('../src/utils/databaseUtils');

async function testDatabaseUtils() {
  try {
    console.log('🧪 Probando módulo DatabaseUtils...\n');

    // Test 1: Obtener estadísticas
    console.log('📊 Test 1: Obtener estadísticas...');
    const contractStats = await dbUtils.getContractStats();
    const offerStats = await dbUtils.getClientOfferStats();
    console.log('✅ Estadísticas obtenidas:', { contractStats, offerStats });

    // Test 2: Verificación de limpieza (sin ejecutar limpieza real)
    console.log('\n🔍 Test 2: Verificación de estado actual...');
    const verification = await dbUtils.verifyCleanup();
    console.log('✅ Verificación completada:', verification);

    console.log('\n🎉 Todos los tests pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en tests:', error);
    throw error;
  } finally {
    await dbUtils.disconnect();
  }
}

// Ejecutar tests
if (require.main === module) {
  testDatabaseUtils()
    .then(() => {
      console.log('\n✨ Tests completados exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests fallidos:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseUtils };
