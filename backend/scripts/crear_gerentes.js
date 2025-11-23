const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function crearGerentes() {
  try {
    console.log('👔 Creando gerentes...\n');

    const gerentes = [
      {
        nombre_completo: 'Charo',
        codigo_gerente: 'GER001',
        email: 'charo@diamondsistem.com',
        telefono: '+1-305-555-0101',
        password: 'Charo2025!'
      },
      {
        nombre_completo: 'Mariel',
        codigo_gerente: 'GER002',
        email: 'mariel@diamondsistem.com',
        telefono: '+1-305-555-0102',
        password: 'Mariel2025!'
      },
      {
        nombre_completo: 'Ana',
        codigo_gerente: 'GER003',
        email: 'ana@diamondsistem.com',
        telefono: '+1-305-555-0103',
        password: 'Ana2025!'
      },
      {
        nombre_completo: 'Mario',
        codigo_gerente: 'GER004',
        email: 'mario@diamondsistem.com',
        telefono: '+1-305-555-0104',
        password: 'INVENTAALA'
      }
    ];

    let creados = 0;
    let actualizados = 0;

    for (const gerenteData of gerentes) {
      try {
        // Verificar si ya existe
        const existe = await prisma.gerentes.findUnique({
          where: { codigo_gerente: gerenteData.codigo_gerente }
        });

        // Crear hash de la contraseña
        const passwordHash = await hashPassword(gerenteData.password);

        if (existe) {
          // Actualizar si existe
          await prisma.gerentes.update({
            where: { codigo_gerente: gerenteData.codigo_gerente },
            data: {
              nombre_completo: gerenteData.nombre_completo,
              email: gerenteData.email,
              telefono: gerenteData.telefono,
              password_hash: passwordHash,
              activo: true
            }
          });
          actualizados++;
          console.log(`✅ Gerente "${gerenteData.codigo_gerente}" actualizado`);
        } else {
          // Crear nuevo
          await prisma.gerentes.create({
            data: {
              nombre_completo: gerenteData.nombre_completo,
              codigo_gerente: gerenteData.codigo_gerente,
              email: gerenteData.email,
              telefono: gerenteData.telefono,
              password_hash: passwordHash,
              activo: true
            }
          });
          creados++;
          console.log(`✅ Gerente "${gerenteData.codigo_gerente}" creado`);
        }
      } catch (error) {
        console.error(`❌ Error con gerente ${gerenteData.codigo_gerente}:`, error.message);
      }
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   - Creados: ${creados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Total: ${gerentes.length}\n`);

    console.log('📋 Credenciales creadas:');
    gerentes.forEach(g => {
      console.log(`   ${g.codigo_gerente}: ${g.password}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error creando gerentes:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearGerentes()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

