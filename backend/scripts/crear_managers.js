const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function crearManagers() {
  try {
    console.log('👨‍💼 Creando managers...\n');

    const managers = [
      {
        nombre_completo: 'Manager 1',
        codigo_manager: 'MGR001',
        email: 'manager1@diamondsistem.com',
        telefono: '+1-305-555-0201',
        password: 'Manager2025!'
      },
      {
        nombre_completo: 'Manager 2',
        codigo_manager: 'MGR002',
        email: 'manager2@diamondsistem.com',
        telefono: '+1-305-555-0202',
        password: 'Manager2025!'
      },
      {
        nombre_completo: 'Manager 3',
        codigo_manager: 'MGR003',
        email: 'manager3@diamondsistem.com',
        telefono: '+1-305-555-0203',
        password: 'Manager2025!'
      },
      {
        nombre_completo: 'Manager 4',
        codigo_manager: 'MGR004',
        email: 'manager4@diamondsistem.com',
        telefono: '+1-305-555-0204',
        password: 'Manager2025!'
      }
    ];

    let creados = 0;
    let actualizados = 0;

    for (const managerData of managers) {
      try {
        // Verificar si ya existe en tabla usuarios
        let existe = await prisma.usuarios.findFirst({
          where: { 
            codigo_usuario: managerData.codigo_manager,
            rol: 'manager'
          }
        });

        // Si no existe en usuarios, verificar en tabla antigua (compatibilidad)
        if (!existe) {
          existe = await prisma.managers.findUnique({
            where: { codigo_manager: managerData.codigo_manager }
          });
        }

        // Crear hash de la contraseña
        const passwordHash = await hashPassword(managerData.password);

        if (existe) {
          // Actualizar si existe (en tabla usuarios o antigua)
          if (existe.rol || existe.codigo_usuario) {
            await prisma.usuarios.update({
              where: { id: existe.id },
              data: {
                nombre_completo: managerData.nombre_completo,
                email: managerData.email,
                telefono: managerData.telefono,
                password_hash: passwordHash,
                activo: true
              }
            });
          } else {
            await prisma.managers.update({
              where: { codigo_manager: managerData.codigo_manager },
              data: {
                nombre_completo: managerData.nombre_completo,
                email: managerData.email,
                telefono: managerData.telefono,
                password_hash: passwordHash,
                activo: true
              }
            });
          }
          actualizados++;
          console.log(`✅ Manager "${managerData.codigo_manager}" actualizado`);
        } else {
          // Crear nuevo en tabla usuarios
          await prisma.usuarios.create({
            data: {
              nombre_completo: managerData.nombre_completo,
              codigo_usuario: managerData.codigo_manager,
              email: managerData.email,
              telefono: managerData.telefono,
              password_hash: passwordHash,
              rol: 'manager',
              activo: true
            }
          });
          creados++;
          console.log(`✅ Manager "${managerData.codigo_manager}" creado`);
        }
      } catch (error) {
        console.error(`❌ Error con manager ${managerData.codigo_manager}:`, error.message);
      }
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   - Creados: ${creados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Total: ${managers.length}\n`);

    console.log('📋 Credenciales creadas:');
    managers.forEach(m => {
      console.log(`   ${m.codigo_manager}: ${m.password}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error creando managers:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearManagers()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

