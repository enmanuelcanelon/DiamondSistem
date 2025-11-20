/**
 * Script para limpiar TODOS los datos de:
 * - Clientes
 * - Contratos
 * - Ofertas
 * - Leaks asignados (desasignar, no eliminar)
 * 
 * Respetando el orden de dependencias y manteniendo la estructura de la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarTodoDatos() {
  try {
    console.log('🧹 Iniciando limpieza completa de datos...\n');
    console.log('⚠️  ADVERTENCIA: Se eliminarán TODOS los datos de clientes, contratos, ofertas y asignaciones de leaks.\n');

    // ============================================
    // 1. ELIMINAR EVENTOS (dependen de contratos)
    // ============================================
    console.log('📅 Paso 1: Eliminando eventos...');
    const eventosCount = await prisma.eventos.count();
    if (eventosCount > 0) {
      await prisma.eventos.deleteMany({});
      console.log(`   ✅ ${eventosCount} eventos eliminados`);
    } else {
      console.log('   ℹ️  No hay eventos para eliminar');
    }

    // ============================================
    // 2. ELIMINAR DATOS RELACIONADOS CON CONTRATOS
    // ============================================
    console.log('\n📋 Paso 2: Eliminando datos relacionados con contratos...');
    const contratosCount = await prisma.contratos.count();
    
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

      const solicitudesConContrato = await prisma.solicitudes_cliente.count({
        where: { contrato_id: { not: null } }
      });
      if (solicitudesConContrato > 0) {
        await prisma.solicitudes_cliente.deleteMany({
          where: { contrato_id: { not: null } }
        });
        console.log(`   ✅ ${solicitudesConContrato} solicitudes de cliente (con contrato) eliminadas`);
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

    // ============================================
    // 3. ELIMINAR OFERTAS
    // ============================================
    console.log('\n📄 Paso 3: Eliminando ofertas...');
    const ofertasCount = await prisma.ofertas.count();
    
    if (ofertasCount > 0) {
      // Eliminar servicios adicionales primero
      const serviciosAdicionalesCount = await prisma.ofertas_servicios_adicionales.count();
      if (serviciosAdicionalesCount > 0) {
        await prisma.ofertas_servicios_adicionales.deleteMany({});
        console.log(`   ✅ ${serviciosAdicionalesCount} servicios adicionales eliminados`);
      }

      // Eliminar ofertas
      await prisma.ofertas.deleteMany({});
      console.log(`   ✅ ${ofertasCount} ofertas eliminadas`);
    } else {
      console.log('   ℹ️  No hay ofertas para eliminar');
    }

    // ============================================
    // 4. DESVINCULAR LEAKS DE CLIENTES Y DESASIGNAR
    // ============================================
    console.log('\n🔗 Paso 4: Desvinculando y desasignando leaks...');
    
    // Desvincular leaks de clientes
    const leaksConCliente = await prisma.leaks.count({
      where: { cliente_id: { not: null } }
    });
    if (leaksConCliente > 0) {
      await prisma.leaks.updateMany({
        where: { cliente_id: { not: null } },
        data: { cliente_id: null }
      });
      console.log(`   ✅ ${leaksConCliente} leaks desvinculados de clientes`);
    }

    // Desasignar leaks (poner vendedor_id y fecha_asignacion en null)
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
      console.log(`   ✅ ${leaksAsignados} leaks desasignados`);
    }

    if (leaksConCliente === 0 && leaksAsignados === 0) {
      console.log('   ℹ️  No hay leaks para desvincular/desasignar');
    }

    // ============================================
    // 5. ELIMINAR SOLICITUDES DE CLIENTE SIN CONTRATO
    // ============================================
    console.log('\n📝 Paso 5: Eliminando solicitudes de cliente sin contrato...');
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

    // ============================================
    // 6. ELIMINAR CLIENTES (al final, después de desvincular todo)
    // ============================================
    console.log('\n👥 Paso 6: Eliminando clientes...');
    const clientesCount = await prisma.clientes.count();
    
    if (clientesCount > 0) {
      await prisma.clientes.deleteMany({});
      console.log(`   ✅ ${clientesCount} clientes eliminados`);
    } else {
      console.log('   ℹ️  No hay clientes para eliminar');
    }

    // ============================================
    // 7. RESETEAR SECUENCIAS DE IDs (PostgreSQL)
    // ============================================
    console.log('\n🔄 Paso 7: Reseteando secuencias de IDs...');
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

    let secuenciasReseteadas = 0;
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
          secuenciasReseteadas++;
        }
      } catch (error) {
        // Ignorar errores de secuencias que no existen
      }
    }
    
    if (secuenciasReseteadas > 0) {
      console.log(`   ✅ ${secuenciasReseteadas} secuencias de IDs reseteadas`);
    } else {
      console.log('   ⚠️  No se pudieron resetear las secuencias automáticamente');
      console.log('   ℹ️  Ejecuta: node scripts/resetear_secuencias_ids.js');
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('\n✅ Limpieza completada exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - Eventos eliminados: ${eventosCount}`);
    console.log(`   - Contratos eliminados: ${contratosCount}`);
    console.log(`   - Ofertas eliminadas: ${ofertasCount}`);
    console.log(`   - Clientes eliminados: ${clientesCount}`);
    console.log(`   - Leaks desvinculados: ${leaksConCliente}`);
    console.log(`   - Leaks desasignados: ${leaksAsignados}`);

    // Verificación final
    console.log('\n🔍 Verificación:');
    const eventosRestantes = await prisma.eventos.count();
    const contratosRestantes = await prisma.contratos.count();
    const ofertasRestantes = await prisma.ofertas.count();
    const clientesRestantes = await prisma.clientes.count();
    const leaksAsignadosRestantes = await prisma.leaks.count({
      where: { vendedor_id: { not: null } }
    });
    const leaksConClienteRestantes = await prisma.leaks.count({
      where: { cliente_id: { not: null } }
    });

    console.log(`   - Eventos restantes: ${eventosRestantes}`);
    console.log(`   - Contratos restantes: ${contratosRestantes}`);
    console.log(`   - Ofertas restantes: ${ofertasRestantes}`);
    console.log(`   - Clientes restantes: ${clientesRestantes}`);
    console.log(`   - Leaks asignados restantes: ${leaksAsignadosRestantes}`);
    console.log(`   - Leaks con cliente restantes: ${leaksConClienteRestantes}`);

    if (eventosRestantes === 0 && 
        contratosRestantes === 0 && 
        ofertasRestantes === 0 && 
        clientesRestantes === 0 &&
        leaksAsignadosRestantes === 0 &&
        leaksConClienteRestantes === 0) {
      console.log('\n✅ Todos los datos han sido eliminados/limpiados correctamente.');
      console.log('✅ La estructura de la base de datos se mantiene intacta.');
    } else {
      console.log('\n⚠️  Algunos registros no pudieron ser eliminados/limpiados.');
    }

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  limpiarTodoDatos()
    .then(() => {
      console.log('\n✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { limpiarTodoDatos };

