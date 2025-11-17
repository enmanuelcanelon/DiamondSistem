const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limpiarBaseDatos() {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...\n');

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
      
      await prisma.versiones_contratos_pdf.deleteMany({});
      console.log('   ✓ Versiones de contratos PDF eliminadas');
      
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

    // 3. Eliminar clientes (pero primero actualizar leaks para que no tengan cliente_id)
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

    // 4. Eliminar leaks convertidos
    console.log('\n🔍 Eliminando leaks convertidos...');
    
    const leaksConvertidosCount = await prisma.leaks.count({
      where: { estado: 'convertido' }
    });
    console.log(`   - Encontrados ${leaksConvertidosCount} leaks convertidos`);
    
    if (leaksConvertidosCount > 0) {
      await prisma.leaks.deleteMany({
        where: { estado: 'convertido' }
      });
      console.log('   ✓ Leaks convertidos eliminados');
    }

    // Resumen final
    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Contratos eliminados: ${contratosCount}`);
    console.log(`   - Ofertas eliminadas: ${ofertasCount}`);
    console.log(`   - Clientes eliminados: ${clientesCount}`);
    console.log(`   - Leaks convertidos eliminados: ${leaksConvertidosCount}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
limpiarBaseDatos()
  .then(() => {
    console.log('\n✨ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

