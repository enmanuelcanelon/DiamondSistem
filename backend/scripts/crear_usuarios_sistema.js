/**
 * ============================================
 * SCRIPT PARA CREAR USUARIOS DEL SISTEMA
 * ============================================
 * Crea todos los usuarios necesarios para el sistema:
 * - Vendedores
 * - Gerentes
 * - Managers
 * - Administradores (Inventario)
 *
 * Uso: node backend/scripts/crear_usuarios_sistema.js
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

// ============================================
// DEFINICIÓN DE USUARIOS
// ============================================

const USUARIOS = {
  vendedores: [
    {
      nombre_completo: 'Ana',
      codigo_usuario: 'VEN001',
      email: 'ana@diamondsistem.com',
      telefono: '+1-305-555-0101',
      password: 'Ana2025!',
      comision_porcentaje: 3.00
    },
    {
      nombre_completo: 'Mariel',
      codigo_usuario: 'VEN002',
      email: 'mariel@diamondsistem.com',
      telefono: '+1-305-555-0102',
      password: 'Mariel2025!',
      comision_porcentaje: 3.00
    },
    {
      nombre_completo: 'Alejandra',
      codigo_usuario: 'VEN003',
      email: 'alejandra@diamondsistem.com',
      telefono: '+1-305-555-0103',
      password: 'Alejandra2025!',
      comision_porcentaje: 3.00
    },
    {
      nombre_completo: 'Charo',
      codigo_usuario: 'VEN004',
      email: 'charo@diamondsistem.com',
      telefono: '+1-305-555-0104',
      password: 'Charo2025!',
      comision_porcentaje: 3.00
    },
    // PRUEBA001 ya existe, no lo recreamos
  ],

  gerentes: [
    {
      nombre_completo: 'Mario',
      codigo_usuario: 'GER001',
      email: 'mario@diamondsistem.com',
      telefono: '+1-305-555-0201',
      password: 'Mario2025!'
    }
  ],

  managers: [
    {
      nombre_completo: 'Carolina',
      codigo_usuario: 'MGR001',
      email: 'carolina@diamondsistem.com',
      telefono: '+1-305-555-0301',
      password: 'Carolina2025!'
    }
  ],

  administradores: [
    {
      nombre_completo: 'Diana',
      codigo_usuario: 'ADM001',
      email: 'diana@diamondsistem.com',
      telefono: '+1-305-555-0401',
      password: 'Diana2025!'
    }
  ]
};

// ============================================
// FUNCIONES DE CREACIÓN
// ============================================

async function crearUsuario(userData, rol) {
  try {
    // Verificar si ya existe
    const existe = await prisma.usuarios.findUnique({
      where: { codigo_usuario: userData.codigo_usuario }
    });

    // Hash de contraseña
    const passwordHash = await hashPassword(userData.password);

    if (existe) {
      // Actualizar usuario existente
      await prisma.usuarios.update({
        where: { codigo_usuario: userData.codigo_usuario },
        data: {
          nombre_completo: userData.nombre_completo,
          email: userData.email,
          telefono: userData.telefono,
          password_hash: passwordHash,
          rol: rol,
          activo: true,
          comision_porcentaje: userData.comision_porcentaje || null,
          fecha_actualizacion: new Date()
        }
      });
      console.log(`   ✅ ${userData.codigo_usuario} (${userData.nombre_completo}) - ACTUALIZADO`);
      return 'actualizado';
    } else {
      // Crear nuevo usuario
      await prisma.usuarios.create({
        data: {
          nombre_completo: userData.nombre_completo,
          codigo_usuario: userData.codigo_usuario,
          email: userData.email,
          telefono: userData.telefono,
          password_hash: passwordHash,
          rol: rol,
          activo: true,
          comision_porcentaje: userData.comision_porcentaje || null,
          fecha_registro: new Date(),
          fecha_actualizacion: new Date()
        }
      });
      console.log(`   ✅ ${userData.codigo_usuario} (${userData.nombre_completo}) - CREADO`);
      return 'creado';
    }
  } catch (error) {
    console.error(`   ❌ Error con ${userData.codigo_usuario}:`, error.message);
    return 'error';
  }
}

async function crearTodosLosUsuarios() {
  console.log('\n🚀 INICIANDO CREACIÓN DE USUARIOS DEL SISTEMA\n');
  console.log('='.repeat(60));

  const stats = {
    vendedores: { creados: 0, actualizados: 0, errores: 0 },
    gerentes: { creados: 0, actualizados: 0, errores: 0 },
    managers: { creados: 0, actualizados: 0, errores: 0 },
    administradores: { creados: 0, actualizados: 0, errores: 0 }
  };

  // VENDEDORES
  console.log('\n👤 VENDEDORES');
  console.log('-'.repeat(60));
  for (const vendedor of USUARIOS.vendedores) {
    const resultado = await crearUsuario(vendedor, 'vendedor');
    if (resultado === 'creado') stats.vendedores.creados++;
    else if (resultado === 'actualizado') stats.vendedores.actualizados++;
    else stats.vendedores.errores++;
  }

  // GERENTES
  console.log('\n👔 GERENTES');
  console.log('-'.repeat(60));
  for (const gerente of USUARIOS.gerentes) {
    const resultado = await crearUsuario(gerente, 'gerente');
    if (resultado === 'creado') stats.gerentes.creados++;
    else if (resultado === 'actualizado') stats.gerentes.actualizados++;
    else stats.gerentes.errores++;
  }

  // MANAGERS
  console.log('\n👨‍💼 MANAGERS');
  console.log('-'.repeat(60));
  for (const manager of USUARIOS.managers) {
    const resultado = await crearUsuario(manager, 'manager');
    if (resultado === 'creado') stats.managers.creados++;
    else if (resultado === 'actualizado') stats.managers.actualizados++;
    else stats.managers.errores++;
  }

  // ADMINISTRADORES
  console.log('\n🔧 ADMINISTRADORES (INVENTARIO)');
  console.log('-'.repeat(60));
  for (const admin of USUARIOS.administradores) {
    const resultado = await crearUsuario(admin, 'inventario');
    if (resultado === 'creado') stats.administradores.creados++;
    else if (resultado === 'actualizado') stats.administradores.actualizados++;
    else stats.administradores.errores++;
  }

  // RESUMEN
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE OPERACIONES');
  console.log('='.repeat(60));

  const roles = ['vendedores', 'gerentes', 'managers', 'administradores'];
  const emojis = { vendedores: '👤', gerentes: '👔', managers: '👨‍💼', administradores: '🔧' };

  roles.forEach(rol => {
    const s = stats[rol];
    const total = s.creados + s.actualizados + s.errores;
    console.log(`${emojis[rol]} ${rol.toUpperCase()}: ${total} total`);
    console.log(`   - Creados: ${s.creados}`);
    console.log(`   - Actualizados: ${s.actualizados}`);
    console.log(`   - Errores: ${s.errores}`);
  });

  // CREDENCIALES
  console.log('\n' + '='.repeat(60));
  console.log('🔑 CREDENCIALES DE ACCESO');
  console.log('='.repeat(60));

  console.log('\n👤 VENDEDORES:');
  USUARIOS.vendedores.forEach(u => {
    console.log(`   ${u.codigo_usuario} → ${u.password} (${u.nombre_completo})`);
  });

  console.log('\n👔 GERENTES:');
  USUARIOS.gerentes.forEach(u => {
    console.log(`   ${u.codigo_usuario} → ${u.password} (${u.nombre_completo})`);
  });

  console.log('\n👨‍💼 MANAGERS:');
  USUARIOS.managers.forEach(u => {
    console.log(`   ${u.codigo_usuario} → ${u.password} (${u.nombre_completo})`);
  });

  console.log('\n🔧 ADMINISTRADORES:');
  USUARIOS.administradores.forEach(u => {
    console.log(`   ${u.codigo_usuario} → ${u.password} (${u.nombre_completo})`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✨ PROCESO COMPLETADO');
  console.log('='.repeat(60) + '\n');
}

// ============================================
// EJECUTAR
// ============================================

crearTodosLosUsuarios()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERROR FATAL:', error);
    prisma.$disconnect();
    process.exit(1);
  });
