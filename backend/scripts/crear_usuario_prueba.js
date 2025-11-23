const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function crearUsuarioPrueba() {
  try {
    console.log('🔐 Creando usuario de prueba...\n');

    // Verificar si ya existe en tabla usuarios
    let existe = await prisma.usuarios.findFirst({
      where: { 
        codigo_usuario: 'PRUEBA001',
        rol: 'vendedor'
      }
    });

    // Si no existe en usuarios, verificar en tabla antigua (compatibilidad)
    if (!existe) {
      existe = await prisma.vendedores.findUnique({
        where: { codigo_vendedor: 'PRUEBA001' }
      });
    }

    if (existe) {
      console.log('⚠️  El usuario PRUEBA001 ya existe.');
      // Actualizar contraseña
      const passwordHash = await hashPassword('prueba123');
      
      // Actualizar en tabla usuarios si existe ahí
      if (existe.rol || existe.codigo_usuario) {
        await prisma.usuarios.update({
          where: { id: existe.id },
          data: { password_hash: passwordHash }
        });
        console.log('✅ Contraseña actualizada para PRUEBA001 en tabla usuarios');
      } else {
        // Actualizar en tabla antigua
        await prisma.vendedores.update({
          where: { codigo_vendedor: 'PRUEBA001' },
          data: { password_hash: passwordHash }
        });
        console.log('✅ Contraseña actualizada para PRUEBA001 en tabla vendedores');
      }
      return;
    }

    // Crear hash de la contraseña
    const passwordHash = await hashPassword('prueba123');

    // Crear el usuario en tabla usuarios
    const usuario = await prisma.usuarios.create({
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

    console.log('✅ Usuario creado exitosamente:');
    console.log(`   Código: ${usuario.codigo_usuario}`);
    console.log(`   Nombre: ${usuario.nombre_completo}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Rol: ${usuario.rol}`);
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

