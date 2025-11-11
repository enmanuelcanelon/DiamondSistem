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
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') || 
        error.message.includes('ya existe') ||
        error.message.includes('column "fecha_pago" of relation "checklist_servicios_externos" already exists')) {
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

