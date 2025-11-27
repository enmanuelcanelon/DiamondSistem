/**
 * Script para crear usuario de prueba en producción
 * Ejecutar: node prisma/seed-production.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Verificar si el usuario ya existe
  const existingUser = await prisma.usuarios.findUnique({
    where: { codigo_usuario: 'PRUEBA001' }
  });

  if (existingUser) {
    console.log('✅ Usuario PRUEBA001 ya existe');
    return;
  }

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash('prueba123', 10);

  // Crear usuario vendedor de prueba
  const vendedor = await prisma.usuarios.create({
    data: {
      nombre_completo: 'Usuario de Prueba',
      codigo_usuario: 'PRUEBA001',
      email: 'prueba@diamondsistem.com',
      telefono: '305-123-4567',
      password_hash: passwordHash,
      rol: 'vendedor',
      activo: true,
      comision_porcentaje: 3.0,
      salario_base: 0.00,
      total_ventas: 0.00,
      total_comisiones: 0.00,
    }
  });

  console.log('✅ Usuario creado:');
  console.log('   Código: PRUEBA001');
  console.log('   Contraseña: prueba123');
  console.log('   ID:', vendedor.id);
  console.log('');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
