/**
 * Script para verificar que los campos de pagos parciales existan
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando campos de pagos parciales...');

    // Intentar leer un campo para verificar que existe
    const resultado = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'contratos' 
        AND column_name IN ('comision_primera_mitad_pagada_monto', 'comision_segunda_mitad_pagada_monto')
    `;

    console.log('✅ Campos encontrados:', resultado);

    if (resultado.length === 0) {
      console.log('⚠️  Los campos no existen. Ejecutando migración...');
      await prisma.$executeRaw`
        ALTER TABLE contratos 
        ADD COLUMN IF NOT EXISTS comision_primera_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS comision_segunda_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00;
      `;
      console.log('✅ Campos agregados');
    } else {
      console.log('✅ Los campos ya existen en la base de datos');
    }

    console.log('✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificar()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

