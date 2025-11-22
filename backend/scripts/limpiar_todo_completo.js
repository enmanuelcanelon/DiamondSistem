const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function limpiarTodoCompleto() {
  try {
    console.log('🧹 Iniciando limpieza completa de base de datos...\n');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de clientes, contratos, ofertas, leaks, etc.\n');

    // 1. Eliminar datos relacionados con contratos (en orden de dependencias)
    console.log('📋 Eliminando datos relacionados con contratos...');
    
    const contratosCount = await prisma.contratos.count();
    console.log(`   - Encontrados ${contratosCount} contratos`);
    
    if (contratosCount > 0) {
      // Eliminar en orden de dependencias
      await prisma.movimientos_inventario.deleteMany({
        where: { contrato_id: { not: null } }
      });
      console.log('   ✓ Movimientos de inventario eliminados');
      
      await prisma.asignaciones_inventario.deleteMany({});
      console.log('   ✓ Asignaciones de inventario eliminadas');
      
      await prisma.checklist_servicios_externos.deleteMany({});
      console.log('   ✓ Checklist de servicios externos eliminado');
      
      await prisma.mensajes.deleteMany({});
      console.log('   ✓ Mensajes eliminados');
      
      await prisma.playlist_canciones.deleteMany({});
      console.log('   ✓ Playlist de canciones eliminada');
      
      await prisma.invitados.deleteMany({});
      console.log('   ✓ Invitados eliminados');
      
      await prisma.mesas.deleteMany({});
      console.log('   ✓ Mesas eliminadas');
      
      // Eliminar PDFs guardados en la base de datos
      const versionesCount = await prisma.versiones_contratos_pdf.count();
      await prisma.versiones_contratos_pdf.deleteMany({});
      console.log(`   ✓ ${versionesCount} versiones de contratos PDF eliminadas`);
      
      await prisma.ajustes_evento.deleteMany({});
      console.log('   ✓ Ajustes de evento eliminados');
      
      await prisma.solicitudes_cliente.deleteMany({
        where: { contrato_id: { not: null } }
      });
      console.log('   ✓ Solicitudes de cliente (con contrato) eliminadas');
      
      await prisma.eventos.deleteMany({});
      console.log('   ✓ Eventos eliminados');
      
      await prisma.pagos.deleteMany({});
      console.log('   ✓ Pagos eliminados');
      
      await prisma.contratos_servicios.deleteMany({});
      console.log('   ✓ Servicios de contratos eliminados');
      
      // Finalmente eliminar contratos
      await prisma.contratos.deleteMany({});
      console.log('   ✓ Contratos eliminados');
    }

    // 2. Eliminar datos relacionados con ofertas
    console.log('\n📄 Eliminando datos relacionados con ofertas...');
    
    const ofertasCount = await prisma.ofertas.count();
    console.log(`   - Encontradas ${ofertasCount} ofertas`);
    
    if (ofertasCount > 0) {
      await prisma.ofertas_servicios_adicionales.deleteMany({});
      console.log('   ✓ Servicios adicionales de ofertas eliminados');
      
      await prisma.ofertas.deleteMany({});
      console.log('   ✓ Ofertas eliminadas');
    }

    // 3. Eliminar clientes
    console.log('\n👥 Eliminando clientes...');
    
    const clientesCount = await prisma.clientes.count();
    console.log(`   - Encontrados ${clientesCount} clientes`);
    
    if (clientesCount > 0) {
      // Actualizar leaks para desvincularlos de clientes
      await prisma.leaks.updateMany({
        where: { cliente_id: { not: null } },
        data: { cliente_id: null }
      });
      console.log('   ✓ Leaks desvinculados de clientes');
      
      // Eliminar solicitudes de cliente que no tienen contrato
      await prisma.solicitudes_cliente.deleteMany({
        where: { contrato_id: null }
      });
      console.log('   ✓ Solicitudes de cliente sin contrato eliminadas');
      
      // Finalmente eliminar clientes
      await prisma.clientes.deleteMany({});
      console.log('   ✓ Clientes eliminados');
    }

    // 4. Eliminar TODOS los leaks (no solo convertidos)
    console.log('\n🔍 Eliminando TODOS los leaks...');
    
    const leaksCount = await prisma.leaks.count();
    console.log(`   - Encontrados ${leaksCount} leaks`);
    
    if (leaksCount > 0) {
      await prisma.leaks.deleteMany({});
      console.log('   ✓ Todos los leaks eliminados');
    }

    // 5. Limpiar historial de cambios de precios
    console.log('\n💰 Limpiando historial de cambios de precios...');
    const historialCount = await prisma.historial_cambios_precios.count();
    if (historialCount > 0) {
      await prisma.historial_cambios_precios.deleteMany({});
      console.log(`   ✓ ${historialCount} registros de historial eliminados`);
    }

    // 6. Reiniciar secuencias de IDs a 0
    console.log('\n🔄 Reiniciando secuencias de IDs...');
    
    const tablas = [
      'clientes',
      'contratos',
      'ofertas',
      'leaks',
      'pagos',
      'eventos',
      'solicitudes_cliente',
      'mensajes',
      'versiones_contratos_pdf',
      'ajustes_evento',
      'mesas',
      'invitados',
      'playlist_canciones',
      'contratos_servicios',
      'ofertas_servicios_adicionales',
      'checklist_servicios_externos',
      'asignaciones_inventario',
      'movimientos_inventario',
      'historial_cambios_precios'
    ];

    for (const tabla of tablas) {
      try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${tabla}_id_seq RESTART WITH 1;`);
        console.log(`   ✓ Secuencia de ${tabla} reiniciada`);
      } catch (error) {
        // Si la secuencia no existe o hay error, continuar
        console.log(`   ⚠  No se pudo reiniciar secuencia de ${tabla} (puede que no exista)`);
      }
    }

    // Resumen final
    console.log('\n✅ Limpieza completa finalizada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Contratos eliminados: ${contratosCount}`);
    console.log(`   - Ofertas eliminadas: ${ofertasCount}`);
    console.log(`   - Clientes eliminados: ${clientesCount}`);
    console.log(`   - Leaks eliminados: ${leaksCount}`);
    console.log(`   - Historial eliminado: ${historialCount}`);
    console.log('\n✨ La base de datos está lista para usar desde cero!');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
limpiarTodoCompleto()
  .then(() => {
    console.log('\n✨ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });


