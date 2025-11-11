/**
 * Script para agregar campos de pagos parciales de comisiones
 * Ejecutar: node backend/migrar-pagos-parciales-comisiones.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrar() {
  try {
    console.log('🔄 Agregando campos para pagos parciales de comisiones...');

    // Agregar columnas si no existen
    await prisma.$executeRaw`
      ALTER TABLE contratos 
      ADD COLUMN IF NOT EXISTS comision_primera_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS comision_segunda_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00;
    `;

    console.log('✅ Columnas agregadas');

    // Actualizar los montos pagados basándose en los booleanos existentes
    await prisma.$executeRaw`
      UPDATE contratos 
      SET comision_primera_mitad_pagada_monto = comision_primera_mitad 
      WHERE comision_primera_mitad_pagada = true 
        AND comision_primera_mitad IS NOT NULL 
        AND (comision_primera_mitad_pagada_monto IS NULL OR comision_primera_mitad_pagada_monto = 0);
    `;

    await prisma.$executeRaw`
      UPDATE contratos 
      SET comision_segunda_mitad_pagada_monto = comision_segunda_mitad 
      WHERE comision_segunda_mitad_pagada = true 
        AND comision_segunda_mitad IS NOT NULL 
        AND (comision_segunda_mitad_pagada_monto IS NULL OR comision_segunda_mitad_pagada_monto = 0);
    `;

    console.log('✅ Montos pagados actualizados');

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrar()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

