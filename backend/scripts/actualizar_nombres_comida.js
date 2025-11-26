const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarNombresComida() {
  try {
    // 1. Actualizar "Comida" a "Comida / a Menu" (mantener descripción)
    const resultComida = await prisma.servicios.updateMany({
      where: {
        nombre: 'Comida'
      },
      data: {
        nombre: 'Comida / a Menu'
      }
    });
    
    console.log(`✅ Servicio "Comida" actualizado a "Comida / a Menu"`);
    console.log(`   Registros actualizados: ${resultComida.count}`);
    
    // 2. Actualizar "Mesa de Quesos" a "Mesa de Quesos & Carnes frias"
    const resultMesa = await prisma.servicios.updateMany({
      where: {
        nombre: 'Mesa de Quesos'
      },
      data: {
        nombre: 'Mesa de Quesos & Carnes frias',
        descripcion: 'Mesa de quesos y carnes variados'
      }
    });
    
    console.log(`✅ Servicio "Mesa de Quesos" actualizado a "Mesa de Quesos & Carnes frias"`);
    console.log(`   Registros actualizados: ${resultMesa.count}`);
    
    // Verificar los cambios
    const comida = await prisma.servicios.findFirst({
      where: {
        nombre: 'Comida / a Menu'
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      }
    });
    
    const mesa = await prisma.servicios.findFirst({
      where: {
        nombre: 'Mesa de Quesos & Carnes frias'
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      }
    });
    
    if (comida) {
      console.log(`\n   Verificación Comida:`);
      console.log(`   - Nombre: ${comida.nombre}`);
      console.log(`   - Descripción: ${comida.descripcion}`);
    }
    
    if (mesa) {
      console.log(`\n   Verificación Mesa:`);
      console.log(`   - Nombre: ${mesa.nombre}`);
      console.log(`   - Descripción: ${mesa.descripcion}`);
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar servicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarNombresComida();
















