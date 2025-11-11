const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarYAgregarColumnas() {
  try {
    console.log('Verificando y agregando columnas faltantes en checklist_servicios_externos...\n');
    
    const columnas = [
      { nombre: 'fecha_pago', tipo: 'TIMESTAMP(6)' },
      { nombre: 'hora_recogida', tipo: 'TIMESTAMP(6)' },
      { nombre: 'contacto_realizado', tipo: 'BOOLEAN DEFAULT false' },
      { nombre: 'fecha_contacto', tipo: 'TIMESTAMP(6)' },
      { nombre: 'notas', tipo: 'TEXT' },
      { nombre: 'estado', tipo: 'VARCHAR(50) DEFAULT \'pendiente\'' },
      { nombre: 'manager_id', tipo: 'INTEGER' },
      { nombre: 'fecha_creacion', tipo: 'TIMESTAMP(6)' },
      { nombre: 'fecha_actualizacion', tipo: 'TIMESTAMP(6)' }
    ];

    for (const columna of columnas) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE checklist_servicios_externos 
          ADD COLUMN IF NOT EXISTS ${columna.nombre} ${columna.tipo};
        `);
        console.log(`✅ Columna ${columna.nombre} verificada/agregada`);
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') || 
            error.message.includes('ya existe')) {
          console.log(`ℹ️  Columna ${columna.nombre} ya existe`);
        } else {
          console.error(`❌ Error con ${columna.nombre}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarYAgregarColumnas();

