/**
 * Script para limpiar contratos, clientes y ofertas
 * y resetear sus secuencias de IDs
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limpiarDatos() {
  try {
    console.log('🧹 Iniciando limpieza de datos...\n');

    // 1. Eliminar datos relacionados con contratos primero
    console.log('📋 Eliminando datos relacionados con contratos...');
    
    // Eliminar en orden de dependencias
    await prisma.versiones_contratos_pdf.deleteMany({});
    await prisma.pagos.deleteMany({});
    await prisma.contratos_servicios.deleteMany({});
    await prisma.eventos.deleteMany({});
    await prisma.movimientos_inventario.deleteMany({ where: { contrato_id: { not: null } } });
    await prisma.asignaciones_inventario.deleteMany({});
    await prisma.checklist_servicios_externos.deleteMany({});
    await prisma.mensajes.deleteMany({});
    await prisma.playlist_canciones.deleteMany({});
    await prisma.invitados.deleteMany({});
    await prisma.mesas.deleteMany({});
    await prisma.ajustes_evento.deleteMany({});
    await prisma.solicitudes_cliente.deleteMany({ where: { contrato_id: { not: null } } });
    
    // Ahora eliminar contratos
    const contratosEliminados = await prisma.contratos.deleteMany({});
    console.log(`   ✅ ${contratosEliminados.count} contratos eliminados`);

    // 2. Eliminar ofertas (y sus relaciones)
    console.log('📄 Eliminando ofertas...');
    await prisma.ofertas_servicios_adicionales.deleteMany({});
    const ofertasEliminadas = await prisma.ofertas.deleteMany({});
    console.log(`   ✅ ${ofertasEliminadas.count} ofertas eliminadas`);

    // 3. Eliminar clientes
    console.log('👥 Eliminando clientes...');
    const clientesEliminados = await prisma.clientes.deleteMany({});
    console.log(`   ✅ ${clientesEliminados.count} clientes eliminados`);

    // 4. Desasignar leads (leaks)
    console.log('🔗 Desasignando leads...');
    
    // Desvincular leaks de clientes
    const leaksConCliente = await prisma.leaks.count({
      where: { cliente_id: { not: null } }
    });
    if (leaksConCliente > 0) {
      await prisma.leaks.updateMany({
        where: { cliente_id: { not: null } },
        data: { cliente_id: null }
      });
      console.log(`   ✅ ${leaksConCliente} leads desvinculados de clientes`);
    }
    
    // Desasignar leads (poner vendedor_id y fecha_asignacion en null)
    const leaksAsignados = await prisma.leaks.count({
      where: { vendedor_id: { not: null } }
    });
    if (leaksAsignados > 0) {
      await prisma.leaks.updateMany({
        where: { vendedor_id: { not: null } },
        data: {
          vendedor_id: null,
          fecha_asignacion: null,
          fecha_actualizacion: new Date()
        }
      });
      console.log(`   ✅ ${leaksAsignados} leads desasignados`);
    }
    
    if (leaksConCliente === 0 && leaksAsignados === 0) {
      console.log('   ℹ️  No hay leads para desvincular/desasignar');
    }

    // 5. Resetear secuencias de PostgreSQL
    console.log('\n🔄 Reseteando secuencias de IDs...');
    
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "clientes_id_seq" RESTART WITH 1;`);
    console.log('   ✅ Secuencia de clientes_id_seq reseteada a 1');
    
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "contratos_id_seq" RESTART WITH 1;`);
    console.log('   ✅ Secuencia de contratos_id_seq reseteada a 1');
    
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "ofertas_id_seq" RESTART WITH 1;`);
    console.log('   ✅ Secuencia de ofertas_id_seq reseteada a 1');
    
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "leaks_id_seq" RESTART WITH 1;`);
    console.log('   ✅ Secuencia de leaks_id_seq reseteada a 1');

    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Contratos eliminados: ${contratosEliminados.count}`);
    console.log(`   - Ofertas eliminadas: ${ofertasEliminadas.count}`);
    console.log(`   - Clientes eliminados: ${clientesEliminados.count}`);
    console.log(`   - Leads desvinculados: ${leaksConCliente}`);
    console.log(`   - Leads desasignados: ${leaksAsignados}`);
    console.log(`   - Secuencias reseteadas: 4`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
limpiarDatos()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

