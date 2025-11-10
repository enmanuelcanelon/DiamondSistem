const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createListasCompraTable() {
  try {
    console.log('Creando tabla listas_compra...');

    // Crear tabla
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS listas_compra (
        id SERIAL PRIMARY KEY,
        items JSONB NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT NOW(),
        fecha_recepcion TIMESTAMP,
        recibida BOOLEAN DEFAULT false,
        usuario_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✓ Tabla listas_compra creada');

    // Crear índices
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_listas_compra_recibida ON listas_compra(recibida)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_listas_compra_fecha_creacion ON listas_compra(fecha_creacion DESC)
    `;

    console.log('✓ Índices creados');
    console.log('✅ Tabla listas_compra lista para usar');

  } catch (error) {
    console.error('Error al crear la tabla:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createListasCompraTable();

