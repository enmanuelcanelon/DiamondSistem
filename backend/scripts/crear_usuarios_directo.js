/**
 * Script para crear usuarios usando pg directamente (sin Prisma)
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:pbtDlcAbzSAzTCarESrBHuNyLhRcqXVA@gondola.proxy.rlwy.net:28091/railway";

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
    }
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

async function crearUsuario(client, userData, rol) {
  try {
    // Verificar si existe
    const checkQuery = 'SELECT * FROM usuarios WHERE codigo_usuario = $1';
    const checkResult = await client.query(checkQuery, [userData.codigo_usuario]);

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(userData.password, 10);

    if (checkResult.rows.length > 0) {
      // Actualizar
      const updateQuery = `
        UPDATE usuarios
        SET nombre_completo = $1,
            email = $2,
            telefono = $3,
            password_hash = $4,
            rol = $5,
            activo = true,
            comision_porcentaje = $6,
            fecha_actualizacion = NOW()
        WHERE codigo_usuario = $7
      `;
      await client.query(updateQuery, [
        userData.nombre_completo,
        userData.email,
        userData.telefono,
        passwordHash,
        rol,
        userData.comision_porcentaje || null,
        userData.codigo_usuario
      ]);
      console.log(`   ✅ ${userData.codigo_usuario} (${userData.nombre_completo}) - ACTUALIZADO`);
      return 'actualizado';
    } else {
      // Crear
      const insertQuery = `
        INSERT INTO usuarios (
          nombre_completo, codigo_usuario, email, telefono,
          password_hash, rol, activo, comision_porcentaje,
          fecha_registro, fecha_actualizacion
        ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW(), NOW())
      `;
      await client.query(insertQuery, [
        userData.nombre_completo,
        userData.codigo_usuario,
        userData.email,
        userData.telefono,
        passwordHash,
        rol,
        userData.comision_porcentaje || null
      ]);
      console.log(`   ✅ ${userData.codigo_usuario} (${userData.nombre_completo}) - CREADO`);
      return 'creado';
    }
  } catch (error) {
    console.error(`   ❌ Error con ${userData.codigo_usuario}:`, error.message);
    return 'error';
  }
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('\n🚀 CONECTADO A LA BASE DE DATOS\n');
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
      const resultado = await crearUsuario(client, vendedor, 'vendedor');
      if (resultado === 'creado') stats.vendedores.creados++;
      else if (resultado === 'actualizado') stats.vendedores.actualizados++;
      else stats.vendedores.errores++;
    }

    // GERENTES
    console.log('\n👔 GERENTES');
    console.log('-'.repeat(60));
    for (const gerente of USUARIOS.gerentes) {
      const resultado = await crearUsuario(client, gerente, 'gerente');
      if (resultado === 'creado') stats.gerentes.creados++;
      else if (resultado === 'actualizado') stats.gerentes.actualizados++;
      else stats.gerentes.errores++;
    }

    // MANAGERS
    console.log('\n👨‍💼 MANAGERS');
    console.log('-'.repeat(60));
    for (const manager of USUARIOS.managers) {
      const resultado = await crearUsuario(client, manager, 'manager');
      if (resultado === 'creado') stats.managers.creados++;
      else if (resultado === 'actualizado') stats.managers.actualizados++;
      else stats.managers.errores++;
    }

    // ADMINISTRADORES
    console.log('\n🔧 ADMINISTRADORES (INVENTARIO)');
    console.log('-'.repeat(60));
    for (const admin of USUARIOS.administradores) {
      const resultado = await crearUsuario(client, admin, 'inventario');
      if (resultado === 'creado') stats.administradores.creados++;
      else if (resultado === 'actualizado') stats.administradores.actualizados++;
      else stats.administradores.errores++;
    }

    // RESUMEN
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
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
      console.log(`   ${u.codigo_usuario} → ${u.password}`);
    });

    console.log('\n👔 GERENTES:');
    USUARIOS.gerentes.forEach(u => {
      console.log(`   ${u.codigo_usuario} → ${u.password}`);
    });

    console.log('\n👨‍💼 MANAGERS:');
    USUARIOS.managers.forEach(u => {
      console.log(`   ${u.codigo_usuario} → ${u.password}`);
    });

    console.log('\n🔧 ADMINISTRADORES:');
    USUARIOS.administradores.forEach(u => {
      console.log(`   ${u.codigo_usuario} → ${u.password}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✨ COMPLETADO');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 ERROR FATAL:', error);
    process.exit(1);
  });
