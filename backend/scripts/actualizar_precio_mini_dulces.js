const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarPrecioMiniDulces() {
  try {
    const result = await prisma.servicios.updateMany({
      where: {
        nombre: 'Mini Dulces'
      },
      data: {
        precio_base: 36.00
      }
    });
    
    console.log(`✅ Precio de Mini Dulces actualizado a $36.00`);
    console.log(`   Registros actualizados: ${result.count}`);
    
    // Verificar el cambio
    const servicio = await prisma.servicios.findFirst({
      where: {
        nombre: 'Mini Dulces'
      },
      select: {
        id: true,
        nombre: true,
        precio_base: true
      }
    });
    
    if (servicio) {
      console.log(`   Verificación: ${servicio.nombre} - Precio: $${servicio.precio_base}`);
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar precio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarPrecioMiniDulces();






















