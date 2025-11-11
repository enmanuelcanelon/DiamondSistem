/**
 * Script para agregar la columna fecha_pago a checklist_servicios_externos
 * Ejecutar: node ejecutar-migracion-fecha-pago.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function agregarColumnaFechaPago() {
  try {
    console.log('Agregando columna fecha_pago a checklist_servicios_externos...');
    
    await prisma.$executeRaw`
      ALTER TABLE checklist_servicios_externos 
      ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP(6);
    `;
    
    console.log('✅ Columna fecha_pago agregada exitosamente');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️  La columna fecha_pago ya existe en la base de datos');
    } else {
      console.error('❌ Error al agregar la columna:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

agregarColumnaFechaPago();

