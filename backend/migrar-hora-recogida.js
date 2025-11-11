const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function agregarColumnaHoraRecogida() {
  try {
    console.log('Agregando columna hora_recogida a checklist_servicios_externos...');
    
    await prisma.$executeRaw`
      ALTER TABLE checklist_servicios_externos 
      ADD COLUMN IF NOT EXISTS hora_recogida TIMESTAMP(6);
    `;
    
    console.log('✅ Columna hora_recogida agregada exitosamente');
  } catch (error) {
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') || 
        error.message.includes('ya existe') ||
        error.message.includes('column "hora_recogida" of relation "checklist_servicios_externos" already exists')) {
      console.log('ℹ️  La columna hora_recogida ya existe en la base de datos');
    } else {
      console.error('❌ Error al agregar la columna:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

agregarColumnaHoraRecogida();

