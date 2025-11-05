/**
 * Script para crear el manager Carolina
 * Ejecutar: node crear_manager_carolina.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/password');

const prisma = new PrismaClient();

async function crearManagerCarolina() {
  try {
    // Verificar si ya existe
    const managerExistente = await prisma.managers.findUnique({
      where: { codigo_manager: 'MGR001' }
    });

    if (managerExistente) {
      console.log('⚠️  El manager MGR001 ya existe.');
      console.log('📋 Datos actuales:');
      console.log({
        id: managerExistente.id,
        nombre_completo: managerExistente.nombre_completo,
        codigo_manager: managerExistente.codigo_manager,
        email: managerExistente.email,
        telefono: managerExistente.telefono,
        activo: managerExistente.activo
      });

      // Actualizar contraseña
      const passwordHash = await hashPassword('Carolina2025!');
      await prisma.managers.update({
        where: { codigo_manager: 'MGR001' },
        data: {
          password_hash: passwordHash,
          nombre_completo: 'Carolina',
          email: 'carolina@diamondsistem.com',
          telefono: '+1-305-555-0101',
          activo: true,
          fecha_actualizacion: new Date()
        }
      });

      console.log('✅ Contraseña actualizada para el manager MGR001');
    } else {
      // Crear nuevo manager
      const passwordHash = await hashPassword('Carolina2025!');

      const nuevoManager = await prisma.managers.create({
        data: {
          nombre_completo: 'Carolina',
          codigo_manager: 'MGR001',
          email: 'carolina@diamondsistem.com',
          telefono: '+1-305-555-0101',
          password_hash: passwordHash,
          activo: true
        }
      });

      console.log('✅ Manager creado exitosamente:');
      console.log({
        id: nuevoManager.id,
        nombre_completo: nuevoManager.nombre_completo,
        codigo_manager: nuevoManager.codigo_manager,
        email: nuevoManager.email,
        telefono: nuevoManager.telefono
      });
    }

    console.log('\n📝 Credenciales de acceso:');
    console.log('   Código Manager: MGR001');
    console.log('   Contraseña: Carolina2025!');
    console.log('   Email: carolina@diamondsistem.com');
    console.log('   URL: http://localhost:5173/manager/login\n');

  } catch (error) {
    console.error('❌ Error al crear/actualizar manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearManagerCarolina();

