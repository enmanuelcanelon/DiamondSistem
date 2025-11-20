/**
 * Script para resetear las secuencias de IDs en PostgreSQL
 * Esto hace que los IDs empiecen desde 1 nuevamente después de limpiar datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetearSecuencias() {
  try {
    console.log('🔄 Reseteando secuencias de IDs...\n');

    // Lista de tablas y sus secuencias
    const secuencias = [
      'clientes_id_seq',
      'contratos_id_seq',
      'ofertas_id_seq',
      'eventos_id_seq',
      'leaks_id_seq',
      'pagos_id_seq',
      'invitados_id_seq',
      'mesas_id_seq',
      'mensajes_id_seq',
      'solicitudes_cliente_id_seq',
      'versiones_contratos_pdf_id_seq',
      'ajustes_evento_id_seq',
      'playlist_canciones_id_seq',
      'checklist_servicios_externos_id_seq',
      'asignaciones_inventario_id_seq',
      'movimientos_inventario_id_seq',
      'contratos_servicios_id_seq',
      'ofertas_servicios_adicionales_id_seq'
    ];

    console.log('📋 Reseteando secuencias:');
    
    for (const secuencia of secuencias) {
      try {
        // Verificar si la secuencia existe antes de resetearla
        const existe = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = $1
          );
        `, secuencia);
        
        if (existe && existe[0]?.exists) {
          await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${secuencia} RESTART WITH 1;`);
          console.log(`   ✅ ${secuencia} reseteada`);
        } else {
          console.log(`   ⚠️  ${secuencia} no existe (puede ser normal)`);
        }
      } catch (error) {
        console.log(`   ❌ Error al resetear ${secuencia}: ${error.message}`);
      }
    }

    // Verificar los valores actuales
    console.log('\n📊 Verificando valores actuales de secuencias:');
    const secuenciasPrincipales = ['clientes_id_seq', 'contratos_id_seq', 'ofertas_id_seq', 'eventos_id_seq'];
    
    for (const secuencia of secuenciasPrincipales) {
      try {
        const resultado = await prisma.$queryRawUnsafe(`
          SELECT last_value FROM ${secuencia};
        `);
        if (resultado && resultado[0]) {
          console.log(`   - ${secuencia}: ${resultado[0].last_value}`);
        }
      } catch (error) {
        // Secuencia no existe, ignorar
      }
    }

    console.log('\n✅ Secuencias reseteadas exitosamente!');
    console.log('ℹ️  Los próximos registros insertados empezarán desde ID 1');

  } catch (error) {
    console.error('\n❌ Error al resetear secuencias:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  resetearSecuencias()
    .then(() => {
      console.log('\n✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetearSecuencias };

