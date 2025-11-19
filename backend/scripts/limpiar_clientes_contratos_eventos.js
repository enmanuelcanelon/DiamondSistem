/**
 * Script para limpiar clientes, contratos y eventos
 * Este script elimina todos los eventos, contratos y clientes de la base de datos
 * Respetando el orden de dependencias
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarClientesContratosEventos() {
  try {
    console.log('🧹 Iniciando limpieza de clientes, contratos y eventos...\n');

    // 1. Contar registros antes de eliminar
    const eventosCount = await prisma.eventos.count();
    const contratosCount = await prisma.contratos.count();
    const clientesCount = await prisma.clientes.count();
    
    console.log('📊 Registros encontrados:');
    console.log(`   - Eventos: ${eventosCount}`);
    console.log(`   - Contratos: ${contratosCount}`);
    console.log(`   - Clientes: ${clientesCount}\n`);

    // 2. Eliminar eventos primero (dependen de contratos)
    console.log('🗑️  Eliminando eventos...');
    if (eventosCount > 0) {
      await prisma.eventos.deleteMany({});
      console.log(`   ✅ ${eventosCount} eventos eliminados`);
    } else {
      console.log('   ℹ️  No hay eventos para eliminar');
    }

    // 3. Eliminar datos relacionados con contratos (en orden de dependencias)
    console.log('\n🗑️  Eliminando datos relacionados con contratos...');
    
    if (contratosCount > 0) {
      // Eliminar en orden de dependencias
      const movimientosCount = await prisma.movimientos_inventario.count({
        where: { contrato_id: { not: null } }
      });
      if (movimientosCount > 0) {
        await prisma.movimientos_inventario.deleteMany({
          where: { contrato_id: { not: null } }
        });
        console.log(`   ✅ ${movimientosCount} movimientos de inventario eliminados`);
      }

      const asignacionesCount = await prisma.asignaciones_inventario.count();
      if (asignacionesCount > 0) {
        await prisma.asignaciones_inventario.deleteMany({});
        console.log(`   ✅ ${asignacionesCount} asignaciones de inventario eliminadas`);
      }

      const checklistCount = await prisma.checklist_servicios_externos.count();
      if (checklistCount > 0) {
        await prisma.checklist_servicios_externos.deleteMany({});
        console.log(`   ✅ ${checklistCount} checklist de servicios externos eliminados`);
      }

      const mensajesCount = await prisma.mensajes.count();
      if (mensajesCount > 0) {
        await prisma.mensajes.deleteMany({});
        console.log(`   ✅ ${mensajesCount} mensajes eliminados`);
      }

      const playlistCount = await prisma.playlist_canciones.count();
      if (playlistCount > 0) {
        await prisma.playlist_canciones.deleteMany({});
        console.log(`   ✅ ${playlistCount} playlist de canciones eliminadas`);
      }

      const invitadosCount = await prisma.invitados.count();
      if (invitadosCount > 0) {
        await prisma.invitados.deleteMany({});
        console.log(`   ✅ ${invitadosCount} invitados eliminados`);
      }

      const mesasCount = await prisma.mesas.count();
      if (mesasCount > 0) {
        await prisma.mesas.deleteMany({});
        console.log(`   ✅ ${mesasCount} mesas eliminadas`);
      }

      const versionesCount = await prisma.versiones_contratos_pdf.count();
      if (versionesCount > 0) {
        await prisma.versiones_contratos_pdf.deleteMany({});
        console.log(`   ✅ ${versionesCount} versiones de contratos PDF eliminadas`);
      }

      const ajustesCount = await prisma.ajustes_evento.count();
      if (ajustesCount > 0) {
        await prisma.ajustes_evento.deleteMany({});
        console.log(`   ✅ ${ajustesCount} ajustes de evento eliminados`);
      }

      const solicitudesCount = await prisma.solicitudes_cliente.count({
        where: { contrato_id: { not: null } }
      });
      if (solicitudesCount > 0) {
        await prisma.solicitudes_cliente.deleteMany({
          where: { contrato_id: { not: null } }
        });
        console.log(`   ✅ ${solicitudesCount} solicitudes de cliente (con contrato) eliminadas`);
      }

      const pagosCount = await prisma.pagos.count();
      if (pagosCount > 0) {
        await prisma.pagos.deleteMany({});
        console.log(`   ✅ ${pagosCount} pagos eliminados`);
      }

      const serviciosContratosCount = await prisma.contratos_servicios.count();
      if (serviciosContratosCount > 0) {
        await prisma.contratos_servicios.deleteMany({});
        console.log(`   ✅ ${serviciosContratosCount} servicios de contratos eliminados`);
      }

      // Finalmente eliminar contratos
      await prisma.contratos.deleteMany({});
      console.log(`   ✅ ${contratosCount} contratos eliminados`);
    } else {
      console.log('   ℹ️  No hay contratos para eliminar');
    }

    // 4. Desvincular leaks de clientes antes de eliminar clientes
    console.log('\n🔗 Desvinculando leaks de clientes...');
    const leaksConCliente = await prisma.leaks.count({
      where: { cliente_id: { not: null } }
    });
    if (leaksConCliente > 0) {
      await prisma.leaks.updateMany({
        where: { cliente_id: { not: null } },
        data: { cliente_id: null }
      });
      console.log(`   ✅ ${leaksConCliente} leaks desvinculados de clientes`);
    } else {
      console.log('   ℹ️  No hay leaks vinculados a clientes');
    }

    // 5. Eliminar solicitudes de cliente sin contrato
    console.log('\n🗑️  Eliminando solicitudes de cliente sin contrato...');
    const solicitudesSinContrato = await prisma.solicitudes_cliente.count({
      where: { contrato_id: null }
    });
    if (solicitudesSinContrato > 0) {
      await prisma.solicitudes_cliente.deleteMany({
        where: { contrato_id: null }
      });
      console.log(`   ✅ ${solicitudesSinContrato} solicitudes de cliente sin contrato eliminadas`);
    } else {
      console.log('   ℹ️  No hay solicitudes de cliente sin contrato');
    }

    // 6. Finalmente eliminar clientes
    console.log('\n🗑️  Eliminando clientes...');
    if (clientesCount > 0) {
      await prisma.clientes.deleteMany({});
      console.log(`   ✅ ${clientesCount} clientes eliminados`);
    } else {
      console.log('   ℹ️  No hay clientes para eliminar');
    }

    // Resumen final
    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Eventos eliminados: ${eventosCount}`);
    console.log(`   - Contratos eliminados: ${contratosCount}`);
    console.log(`   - Clientes eliminados: ${clientesCount}`);
    console.log(`   - Leaks desvinculados: ${leaksConCliente}`);

    // Verificación final
    const eventosRestantes = await prisma.eventos.count();
    const contratosRestantes = await prisma.contratos.count();
    const clientesRestantes = await prisma.clientes.count();

    console.log('\n🔍 Verificación:');
    console.log(`   - Eventos restantes: ${eventosRestantes}`);
    console.log(`   - Contratos restantes: ${contratosRestantes}`);
    console.log(`   - Clientes restantes: ${clientesRestantes}`);

    if (eventosRestantes === 0 && contratosRestantes === 0 && clientesRestantes === 0) {
      console.log('\n✅ Todos los registros han sido eliminados correctamente.');
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
  limpiarClientesContratosEventos()
    .then(() => {
      console.log('\n✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { limpiarClientesContratosEventos };



