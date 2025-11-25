const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function resetearBDSoloPrueba() {
  try {
    console.log('🧹 Iniciando reset completo de base de datos...\n');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos excepto el usuario PRUEBA001\n');

    // 1. Guardar el ID del usuario PRUEBA001 si existe
    const usuarioPrueba = await prisma.usuarios.findFirst({
      where: {
        codigo_usuario: 'PRUEBA001',
        rol: 'vendedor'
      }
    });

    const usuarioPruebaId = usuarioPrueba?.id;

    // 2. Eliminar todos los datos relacionados (en orden de dependencias)
    console.log('📋 Eliminando datos relacionados con contratos...');
    
    await prisma.movimientos_inventario.deleteMany({});
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
    
    await prisma.solicitudes_cliente.deleteMany({});
    console.log('   ✓ Solicitudes de cliente eliminadas');
    
    await prisma.eventos.deleteMany({});
    console.log('   ✓ Eventos eliminados');
    
    await prisma.pagos.deleteMany({});
    console.log('   ✓ Pagos eliminados');
    
    await prisma.historial_cambios_precios.deleteMany({});
    console.log('   ✓ Historial de cambios de precios eliminado');
    
    await prisma.contratos_servicios.deleteMany({});
    console.log('   ✓ Servicios de contratos eliminados');
    
    await prisma.contratos.deleteMany({});
    console.log('   ✓ Contratos eliminados');

    // 3. Eliminar datos relacionados con ofertas
    console.log('\n📄 Eliminando datos relacionados con ofertas...');
    
    await prisma.ofertas_servicios_adicionales.deleteMany({});
    console.log('   ✓ Servicios adicionales de ofertas eliminados');
    
    await prisma.ofertas.deleteMany({});
    console.log('   ✓ Ofertas eliminadas');

    // 4. Eliminar clientes
    console.log('\n👥 Eliminando clientes...');
    
    await prisma.leaks.updateMany({
      where: { cliente_id: { not: null } },
      data: { cliente_id: null }
    });
    console.log('   ✓ Leaks desvinculados de clientes');
    
    await prisma.clientes.deleteMany({});
    console.log('   ✓ Clientess eliminados');

    // 5. Eliminar leaks
    console.log('\n📞 Eliminando leaks...');
    
    await prisma.leaks.deleteMany({});
    console.log('   ✓ Leaks eliminados');

    // 6. Eliminar todos los usuarios excepto PRUEBA001
    console.log('\n👤 Eliminando usuarios (excepto PRUEBA001)...');
    
    if (usuarioPruebaId) {
      await prisma.usuarios.deleteMany({
        where: {
          id: { not: usuarioPruebaId }
        }
      });
      console.log('   ✓ Usuarios eliminados (PRUEBA001 conservado)');
    } else {
      await prisma.usuarios.deleteMany({});
      console.log('   ✓ Todos los usuarios eliminados (PRUEBA001 no existía)');
    }

    // 7. Eliminar vendedores antiguos (tabla deprecated)
    console.log('\n🗑️  Eliminando vendedores antiguos...');
    
    await prisma.vendedores.deleteMany({});
    console.log('   ✓ Vendedores antiguos eliminados');

    // 8. Crear o actualizar usuario PRUEBA001
    console.log('\n🔐 Creando/actualizando usuario PRUEBA001...');
    
    const passwordHash = await hashPassword('prueba123');
    
    if (usuarioPruebaId) {
      // Actualizar usuario existente
      await prisma.usuarios.update({
        where: { id: usuarioPruebaId },
        data: {
          nombre_completo: 'Usuario Prueba',
          codigo_usuario: 'PRUEBA001',
          email: 'prueba@diamondsistem.com',
          telefono: '0000000000',
          password_hash: passwordHash,
          rol: 'vendedor',
          comision_porcentaje: 10.00,
          activo: true,
          total_ventas: 0,
          total_comisiones: 0,
          google_calendar_sync_enabled: false
        }
      });
      console.log('   ✓ Usuario PRUEBA001 actualizado');
    } else {
      // Crear nuevo usuario
      const nuevoUsuario = await prisma.usuarios.create({
        data: {
          nombre_completo: 'Usuario Prueba',
          codigo_usuario: 'PRUEBA001',
          email: 'prueba@diamondsistem.com',
          telefono: '0000000000',
          password_hash: passwordHash,
          rol: 'vendedor',
          comision_porcentaje: 10.00,
          activo: true
        }
      });
      console.log('   ✓ Usuario PRUEBA001 creado');
      console.log(`      ID: ${nuevoUsuario.id}`);
    }

    // 9. Resetear secuencias de IDs
    console.log('\n🔄 Reseteando secuencias de IDs...');
    
    try {
      await prisma.$executeRawUnsafe(`SELECT setval('contratos_id_seq', 1, false);`);
      await prisma.$executeRawUnsafe(`SELECT setval('ofertas_id_seq', 1, false);`);
      await prisma.$executeRawUnsafe(`SELECT setval('clientes_id_seq', 1, false);`);
      await prisma.$executeRawUnsafe(`SELECT setval('leaks_id_seq', 1, false);`);
      await prisma.$executeRawUnsafe(`SELECT setval('pagos_id_seq', 1, false);`);
      await prisma.$executeRawUnsafe(`SELECT setval('eventos_id_seq', 1, false);`);
      console.log('   ✓ Secuencias reseteadas');
    } catch (error) {
      // Si las secuencias no existen, no es crítico
      console.log('   ⚠️  Algunas secuencias no se pudieron resetear (puede ser normal)');
    }

    // 10. Verificar resultado
    console.log('\n📊 Verificación final:');
    
    const totalUsuarios = await prisma.usuarios.count();
    const totalClientes = await prisma.clientes.count();
    const totalOfertas = await prisma.ofertas.count();
    const totalContratos = await prisma.contratos.count();
    const totalLeaks = await prisma.leaks.count();
    
    console.log(`   - Usuarios: ${totalUsuarios} (debe ser 1: PRUEBA001)`);
    console.log(`   - Clientes: ${totalClientes} (debe ser 0)`);
    console.log(`   - Ofertas: ${totalOfertas} (debe ser 0)`);
    console.log(`   - Contratos: ${totalContratos} (debe ser 0)`);
    console.log(`   - Leaks: ${totalLeaks} (debe ser 0)`);

    console.log('\n✅ Base de datos reseteada exitosamente!');
    console.log('\n📝 Credenciales del usuario de prueba:');
    console.log('   Código: PRUEBA001');
    console.log('   Contraseña: prueba123');
    console.log('   Email: prueba@diamondsistem.com\n');

  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetearBDSoloPrueba()
    .then(() => {
      console.log('\n🎉 Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetearBDSoloPrueba };

