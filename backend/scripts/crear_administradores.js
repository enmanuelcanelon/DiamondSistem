const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function crearAdministradores() {
  try {
    console.log('👤 Creando administradores (usuarios de inventario)...\n');

    const administradores = [
      {
        nombre_completo: 'Administrador 1',
        codigo_usuario: 'ADM001',
        email: 'admin1@diamondsistem.com',
        telefono: '+1-305-555-0301',
        password: 'Admin2025!'
      },
      {
        nombre_completo: 'Administrador 2',
        codigo_usuario: 'ADM002',
        email: 'admin2@diamondsistem.com',
        telefono: '+1-305-555-0302',
        password: 'Admin2025!'
      },
      {
        nombre_completo: 'Administrador 3',
        codigo_usuario: 'ADM003',
        email: 'admin3@diamondsistem.com',
        telefono: '+1-305-555-0303',
        password: 'Admin2025!'
      },
      {
        nombre_completo: 'Administrador 4',
        codigo_usuario: 'ADM004',
        email: 'admin4@diamondsistem.com',
        telefono: '+1-305-555-0304',
        password: 'Admin2025!'
      }
    ];

    let creados = 0;
    let actualizados = 0;

    for (const adminData of administradores) {
      try {
        // Verificar si ya existe
        const existe = await prisma.usuarios_inventario.findUnique({
          where: { codigo_usuario: adminData.codigo_usuario }
        });

        // Crear hash de la contraseña
        const passwordHash = await hashPassword(adminData.password);

        if (existe) {
          // Actualizar si existe
          await prisma.usuarios_inventario.update({
            where: { codigo_usuario: adminData.codigo_usuario },
            data: {
              nombre_completo: adminData.nombre_completo,
              email: adminData.email,
              telefono: adminData.telefono,
              password_hash: passwordHash,
              activo: true
            }
          });
          actualizados++;
          console.log(`✅ Administrador "${adminData.codigo_usuario}" actualizado`);
        } else {
          // Crear nuevo
          await prisma.usuarios_inventario.create({
            data: {
              nombre_completo: adminData.nombre_completo,
              codigo_usuario: adminData.codigo_usuario,
              email: adminData.email,
              telefono: adminData.telefono,
              password_hash: passwordHash,
              activo: true
            }
          });
          creados++;
          console.log(`✅ Administrador "${adminData.codigo_usuario}" creado`);
        }
      } catch (error) {
        console.error(`❌ Error con administrador ${adminData.codigo_usuario}:`, error.message);
      }
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   - Creados: ${creados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Total: ${administradores.length}\n`);

    console.log('📋 Credenciales creadas:');
    administradores.forEach(a => {
      console.log(`   ${a.codigo_usuario}: ${a.password}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error creando administradores:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearAdministradores()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

