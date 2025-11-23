/**
 * Script de Migración: Consolidar tablas de usuarios en una sola tabla usuarios
 * 
 * Este script migra datos de:
 * - vendedores → usuarios (rol='vendedor')
 * - gerentes → usuarios (rol='gerente')
 * - managers → usuarios (rol='manager')
 * - usuarios_inventario → usuarios (rol='inventario')
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrarUsuarios() {
  console.log('🚀 Iniciando migración de usuarios...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Verificar que la tabla usuarios existe y está vacía
    const usuariosExistentes = await prisma.usuarios.count();
    if (usuariosExistentes > 0) {
      console.log('⚠️  La tabla usuarios ya contiene datos.');
      console.log('   Si deseas continuar, elimina primero los datos existentes.');
      console.log('   O ejecuta este script solo si estás seguro de continuar.\n');
      return;
    }

    const mapeoIds = {
      vendedores: {},
      gerentes: {},
      managers: {},
      usuarios_inventario: {}
    };

    // ============================================
    // 1. Migrar VENDEDORES
    // ============================================
    console.log('📋 Paso 1: Migrando vendedores...');
    const vendedores = await prisma.vendedores.findMany({
      where: { activo: true }
    });

    for (const vendedor of vendedores) {
      try {
        const nuevoUsuario = await prisma.usuarios.create({
          data: {
            nombre_completo: vendedor.nombre_completo,
            codigo_usuario: vendedor.codigo_vendedor,
            email: vendedor.email,
            telefono: vendedor.telefono,
            password_hash: vendedor.password_hash,
            rol: 'vendedor',
            activo: vendedor.activo,
            fecha_registro: vendedor.fecha_registro,
            fecha_actualizacion: vendedor.fecha_actualizacion,
            // Campos específicos de vendedor
            comision_porcentaje: vendedor.comision_porcentaje,
            salario_base: vendedor.salario_base,
            total_ventas: vendedor.total_ventas,
            total_comisiones: vendedor.total_comisiones,
            // Google Calendar
            google_calendar_id: vendedor.google_calendar_id,
            google_access_token: vendedor.google_access_token,
            google_refresh_token: vendedor.google_refresh_token,
            google_token_expires_at: vendedor.google_token_expires_at,
            google_calendar_sync_enabled: vendedor.google_calendar_sync_enabled
          }
        });
        mapeoIds.vendedores[vendedor.id] = nuevoUsuario.id;
        console.log(`   ✅ Migrado: ${vendedor.codigo_vendedor} (ID: ${vendedor.id} → ${nuevoUsuario.id})`);
      } catch (error) {
        console.error(`   ❌ Error migrando vendedor ${vendedor.codigo_vendedor}:`, error.message);
      }
    }
    console.log(`   ✨ Total vendedores migrados: ${Object.keys(mapeoIds.vendedores).length}\n`);

    // ============================================
    // 2. Migrar GERENTES
    // ============================================
    console.log('📋 Paso 2: Migrando gerentes...');
    const gerentes = await prisma.gerentes.findMany({
      where: { activo: true }
    });

    for (const gerente of gerentes) {
      try {
        const nuevoUsuario = await prisma.usuarios.create({
          data: {
            nombre_completo: gerente.nombre_completo,
            codigo_usuario: gerente.codigo_gerente,
            email: gerente.email,
            telefono: gerente.telefono,
            password_hash: gerente.password_hash,
            rol: 'gerente',
            activo: gerente.activo,
            fecha_registro: gerente.fecha_registro,
            fecha_actualizacion: gerente.fecha_actualizacion
          }
        });
        mapeoIds.gerentes[gerente.id] = nuevoUsuario.id;
        console.log(`   ✅ Migrado: ${gerente.codigo_gerente} (ID: ${gerente.id} → ${nuevoUsuario.id})`);
      } catch (error) {
        console.error(`   ❌ Error migrando gerente ${gerente.codigo_gerente}:`, error.message);
      }
    }
    console.log(`   ✨ Total gerentes migrados: ${Object.keys(mapeoIds.gerentes).length}\n`);

    // ============================================
    // 3. Migrar MANAGERS
    // ============================================
    console.log('📋 Paso 3: Migrando managers...');
    const managers = await prisma.managers.findMany({
      where: { activo: true }
    });

    for (const manager of managers) {
      try {
        const nuevoUsuario = await prisma.usuarios.create({
          data: {
            nombre_completo: manager.nombre_completo,
            codigo_usuario: manager.codigo_manager,
            email: manager.email,
            telefono: manager.telefono,
            password_hash: manager.password_hash,
            rol: 'manager',
            activo: manager.activo,
            fecha_registro: manager.fecha_registro,
            fecha_actualizacion: manager.fecha_actualizacion
          }
        });
        mapeoIds.managers[manager.id] = nuevoUsuario.id;
        console.log(`   ✅ Migrado: ${manager.codigo_manager} (ID: ${manager.id} → ${nuevoUsuario.id})`);
      } catch (error) {
        console.error(`   ❌ Error migrando manager ${manager.codigo_manager}:`, error.message);
      }
    }
    console.log(`   ✨ Total managers migrados: ${Object.keys(mapeoIds.managers).length}\n`);

    // ============================================
    // 4. Migrar USUARIOS_INVENTARIO
    // ============================================
    console.log('📋 Paso 4: Migrando usuarios de inventario...');
    const usuariosInventario = await prisma.usuarios_inventario.findMany({
      where: { activo: true }
    });

    for (const usuarioInv of usuariosInventario) {
      try {
        const nuevoUsuario = await prisma.usuarios.create({
          data: {
            nombre_completo: usuarioInv.nombre_completo,
            codigo_usuario: usuarioInv.codigo_usuario,
            email: usuarioInv.email,
            telefono: usuarioInv.telefono,
            password_hash: usuarioInv.password_hash,
            rol: 'inventario',
            activo: usuarioInv.activo,
            fecha_registro: usuarioInv.fecha_registro,
            fecha_actualizacion: usuarioInv.fecha_actualizacion
          }
        });
        mapeoIds.usuarios_inventario[usuarioInv.id] = nuevoUsuario.id;
        console.log(`   ✅ Migrado: ${usuarioInv.codigo_usuario} (ID: ${usuarioInv.id} → ${nuevoUsuario.id})`);
      } catch (error) {
        console.error(`   ❌ Error migrando usuario inventario ${usuarioInv.codigo_usuario}:`, error.message);
      }
    }
    console.log(`   ✨ Total usuarios inventario migrados: ${Object.keys(mapeoIds.usuarios_inventario).length}\n`);

    // ============================================
    // 5. Resumen
    // ============================================
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 Resumen de migración:');
    console.log(`   ✅ Vendedores: ${Object.keys(mapeoIds.vendedores).length}`);
    console.log(`   ✅ Gerentes: ${Object.keys(mapeoIds.gerentes).length}`);
    console.log(`   ✅ Managers: ${Object.keys(mapeoIds.managers).length}`);
    console.log(`   ✅ Usuarios Inventario: ${Object.keys(mapeoIds.usuarios_inventario).length}`);
    console.log(`   📦 Total usuarios migrados: ${Object.keys(mapeoIds.vendedores).length + Object.keys(mapeoIds.gerentes).length + Object.keys(mapeoIds.managers).length + Object.keys(mapeoIds.usuarios_inventario).length}\n`);

    console.log('⚠️  IMPORTANTE:');
    console.log('   Los datos se han migrado a la nueva tabla usuarios.');
    console.log('   Ahora necesitas:');
    console.log('   1. Actualizar las relaciones en las tablas que referencian usuarios');
    console.log('   2. Actualizar el código del backend para usar la nueva tabla');
    console.log('   3. Probar todo el sistema');
    console.log('   4. Solo después de verificar que todo funciona, eliminar las tablas antiguas\n');

    // Guardar mapeo de IDs en archivo JSON para referencia
    const fs = require('fs');
    const path = require('path');
    const mapeoPath = path.join(__dirname, 'mapeo_ids_usuarios.json');
    fs.writeFileSync(mapeoPath, JSON.stringify(mapeoIds, null, 2));
    console.log(`💾 Mapeo de IDs guardado en: ${mapeoPath}\n`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrarUsuarios()
  .then(() => {
    console.log('🎉 Migración completada exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

