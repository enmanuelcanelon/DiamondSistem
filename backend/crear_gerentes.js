/**
 * Script para crear los gerentes iniciales
 * Gerentes: Charo, Mariel y Ana
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/password');

const prisma = new PrismaClient();

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
  }
];

async function crearGerentes() {
  console.log('🚀 Iniciando creación de gerentes...\n');

  for (const gerenteData of gerentes) {
    try {
      const hashedPassword = await hashPassword(gerenteData.password);

      // Verificar si ya existe
      const gerenteExistente = await prisma.gerentes.findUnique({
        where: { codigo_gerente: gerenteData.codigo_gerente }
      });

      if (gerenteExistente) {
        console.log(`⚠️  El gerente ${gerenteData.codigo_gerente} ya existe.`);
        console.log(`   Actualizando contraseña...`);
        
        await prisma.gerentes.update({
          where: { codigo_gerente: gerenteData.codigo_gerente },
          data: {
            password_hash: hashedPassword,
            fecha_actualizacion: new Date()
          }
        });
        
        console.log(`✅ Contraseña actualizada para ${gerenteData.nombre_completo}\n`);
      } else {
        console.log(`✨ Creando gerente ${gerenteData.codigo_gerente}...`);
        
        await prisma.gerentes.create({
          data: {
            nombre_completo: gerenteData.nombre_completo,
            codigo_gerente: gerenteData.codigo_gerente,
            email: gerenteData.email,
            telefono: gerenteData.telefono,
            password_hash: hashedPassword,
            activo: true,
            fecha_registro: new Date(),
            fecha_actualizacion: new Date()
          }
        });
        
        console.log(`✅ Gerente ${gerenteData.nombre_completo} creado exitosamente.\n`);
      }

      console.log(`📝 Credenciales de acceso:`);
      console.log(`   Código Gerente: ${gerenteData.codigo_gerente}`);
      console.log(`   Contraseña: ${gerenteData.password}`);
      console.log(`   Email: ${gerenteData.email}`);
      console.log(`   URL: http://localhost:5173/gerente/login\n`);
      console.log('─'.repeat(50) + '\n');

    } catch (error) {
      console.error(`❌ Error al crear/actualizar gerente ${gerenteData.codigo_gerente}:`, error.message);
    }
  }

  console.log('✅ Proceso completado.');
}

crearGerentes()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });

