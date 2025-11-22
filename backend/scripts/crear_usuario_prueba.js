const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function crearUsuarioPrueba() {
  try {
    console.log('🔐 Creando usuario de prueba...\n');

    // Verificar si ya existe
    const existe = await prisma.vendedores.findUnique({
      where: { codigo_vendedor: 'PRUEBA001' }
    });

    if (existe) {
      console.log('⚠️  El usuario PRUEBA001 ya existe.');
      console.log('¿Quieres actualizar su contraseña? (S/N)');
      // Por ahora, solo actualizamos la contraseña
      const passwordHash = await hashPassword('prueba123');
      await prisma.vendedores.update({
        where: { codigo_vendedor: 'PRUEBA001' },
        data: { password_hash: passwordHash }
      });
      console.log('✅ Contraseña actualizada para PRUEBA001');
      return;
    }

    // Crear hash de la contraseña
    const passwordHash = await hashPassword('prueba123');

    // Crear el usuario
    const vendedor = await prisma.vendedores.create({
      data: {
        nombre_completo: 'Usuario Prueba',
        codigo_vendedor: 'PRUEBA001',
        email: 'prueba@diamondsistem.com',
        telefono: '0000000000',
        password_hash: passwordHash,
        comision_porcentaje: 10.00,
        activo: true
      }
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log(`   Código: ${vendedor.codigo_vendedor}`);
    console.log(`   Nombre: ${vendedor.nombre_completo}`);
    console.log(`   Email: ${vendedor.email}`);
    console.log(`   Contraseña: prueba123`);
    console.log('\n✨ Usuario listo para usar!\n');

  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearUsuarioPrueba()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

