const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarDescripcionCake() {
  try {
    // Actualizar descripción de "Cake"
    const result = await prisma.servicios.updateMany({
      where: {
        nombre: 'Cake'
      },
      data: {
        descripcion: 'Cake (vainilla o marmoleado)'
      }
    });
    
    console.log(`✅ Descripción de Cake actualizada`);
    console.log(`   Registros actualizados: ${result.count}`);
    
    // Verificar el cambio
    const servicio = await prisma.servicios.findFirst({
      where: {
        nombre: 'Cake'
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio_base: true
      }
    });
    
    if (servicio) {
      console.log(`   Verificación:`);
      console.log(`   - Nombre: ${servicio.nombre}`);
      console.log(`   - Descripción: ${servicio.descripcion}`);
      console.log(`   - Precio: $${servicio.precio_base}`);
    } else {
      console.log(`   ⚠️ No se encontró el servicio Cake`);
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar descripción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarDescripcionCake();

