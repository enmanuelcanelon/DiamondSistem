/**
 * ============================================
 * SCRIPT DE LIMPIEZA DE BASE DE DATOS
 * ============================================
 * Limpia todas las tablas de datos operacionales:
 * - clientes
 * - contratos
 * - ofertas
 * - leaks (leads)
 * - asignaciones_inventario (asignados)
 * - versiones_contratos_pdf (pdfs)
 * - Y todas las tablas relacionadas
 * 
 * También resetea los contadores de autoincrement (ids)
 * 
 * ⚠️ ADVERTENCIA: Este script elimina TODOS los datos. Usar con precaución.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n');

  try {
    // Desactivar restricciones de foreign key temporalmente (PostgreSQL)
    console.log('📋 Desactivando restricciones de foreign key...');
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // 1. Eliminar tablas relacionadas primero (orden inverso de dependencias)
    console.log('\n🗑️  Eliminando datos de tablas relacionadas...');
    
    // PDFs de contratos
    const pdfsDeleted = await prisma.versiones_contratos_pdf.deleteMany({});
    console.log(`   ✓ versiones_contratos_pdf: ${pdfsDeleted.count} registros eliminados`);

    // Asignaciones de inventario
    const asignacionesDeleted = await prisma.asignaciones_inventario.deleteMany({});
    console.log(`   ✓ asignaciones_inventario: ${asignacionesDeleted.count} registros eliminados`);

    // Movimientos de inventario
    const movimientosDeleted = await prisma.movimientos_inventario.deleteMany({});
    console.log(`   ✓ movimientos_inventario: ${movimientosDeleted.count} registros eliminados`);

    // Checklist de servicios externos
    const checklistDeleted = await prisma.checklist_servicios_externos.deleteMany({});
    console.log(`   ✓ checklist_servicios_externos: ${checklistDeleted.count} registros eliminados`);

    // Mensajes
    const mensajesDeleted = await prisma.mensajes.deleteMany({});
    console.log(`   ✓ mensajes: ${mensajesDeleted.count} registros eliminados`);

    // Solicitudes de cliente
    const solicitudesDeleted = await prisma.solicitudes_cliente.deleteMany({});
    console.log(`   ✓ solicitudes_cliente: ${solicitudesDeleted.count} registros eliminados`);

    // Playlist de canciones
    const playlistDeleted = await prisma.playlist_canciones.deleteMany({});
    console.log(`   ✓ playlist_canciones: ${playlistDeleted.count} registros eliminados`);

    // Invitados
    const invitadosDeleted = await prisma.invitados.deleteMany({});
    console.log(`   ✓ invitados: ${invitadosDeleted.count} registros eliminados`);

    // Mesas
    const mesasDeleted = await prisma.mesas.deleteMany({});
    console.log(`   ✓ mesas: ${mesasDeleted.count} registros eliminados`);

    // Ajustes de evento
    const ajustesDeleted = await prisma.ajustes_evento.deleteMany({});
    console.log(`   ✓ ajustes_evento: ${ajustesDeleted.count} registros eliminados`);

    // Eventos
    const eventosDeleted = await prisma.eventos.deleteMany({});
    console.log(`   ✓ eventos: ${eventosDeleted.count} registros eliminados`);

    // Pagos
    const pagosDeleted = await prisma.pagos.deleteMany({});
    console.log(`   ✓ pagos: ${pagosDeleted.count} registros eliminados`);

    // Servicios de contratos
    const contratosServiciosDeleted = await prisma.contratos_servicios.deleteMany({});
    console.log(`   ✓ contratos_servicios: ${contratosServiciosDeleted.count} registros eliminados`);

    // Contratos
    const contratosDeleted = await prisma.contratos.deleteMany({});
    console.log(`   ✓ contratos: ${contratosDeleted.count} registros eliminados`);

    // Servicios adicionales de ofertas
    const ofertasServiciosDeleted = await prisma.ofertas_servicios_adicionales.deleteMany({});
    console.log(`   ✓ ofertas_servicios_adicionales: ${ofertasServiciosDeleted.count} registros eliminados`);

    // Ofertas
    const ofertasDeleted = await prisma.ofertas.deleteMany({});
    console.log(`   ✓ ofertas: ${ofertasDeleted.count} registros eliminados`);

    // Leaks (leads)
    const leaksDeleted = await prisma.leaks.deleteMany({});
    console.log(`   ✓ leaks: ${leaksDeleted.count} registros eliminados`);

    // Clientes
    const clientesDeleted = await prisma.clientes.deleteMany({});
    console.log(`   ✓ clientes: ${clientesDeleted.count} registros eliminados`);

    // Historial de cambios de precios
    const historialDeleted = await prisma.historial_cambios_precios.deleteMany({});
    console.log(`   ✓ historial_cambios_precios: ${historialDeleted.count} registros eliminados`);

    // Reactivar restricciones de foreign key
    console.log('\n📋 Reactivando restricciones de foreign key...');
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;

    // 2. Resetear contadores de autoincrement (ids)
    console.log('\n🔄 Reseteando contadores de autoincrement...');
    
    const tablesToReset = [
      'clientes',
      'contratos',
      'ofertas',
      'leaks',
      'pagos',
      'eventos',
      'solicitudes_cliente',
      'mensajes',
      'versiones_contratos_pdf',
      'mesas',
      'invitados',
      'playlist_canciones',
      'ajustes_evento',
      'contratos_servicios',
      'ofertas_servicios_adicionales',
      'asignaciones_inventario',
      'movimientos_inventario',
      'checklist_servicios_externos',
      'historial_cambios_precios'
    ];

    for (const table of tablesToReset) {
      try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`);
        console.log(`   ✓ ${table}_id_seq reseteado a 1`);
      } catch (error) {
        // Algunas tablas pueden no tener secuencia o tener nombre diferente
        console.log(`   ⚠ ${table}_id_seq: ${error.message}`);
      }
    }

    console.log('\n✅ Limpieza de base de datos completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Clientes eliminados: ${clientesDeleted.count}`);
    console.log(`   - Contratos eliminados: ${contratosDeleted.count}`);
    console.log(`   - Ofertas eliminadas: ${ofertasDeleted.count}`);
    console.log(`   - Leaks eliminados: ${leaksDeleted.count}`);
    console.log(`   - Asignaciones eliminadas: ${asignacionesDeleted.count}`);
    console.log(`   - PDFs eliminados: ${pdfsDeleted.count}`);
    console.log(`   - Todos los IDs reseteados a 1\n`);

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase };

