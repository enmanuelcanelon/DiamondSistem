const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarDescripcionHoraLoca() {
  try {
    // Actualizar descripción de "Hora Loca" a simplemente "Hora loca"
    const result = await prisma.servicios.updateMany({
      where: {
        nombre: 'Hora Loca'
      },
      data: {
        descripcion: 'Hora loca'
      }
    });
    
    console.log(`✅ Descripción de Hora Loca actualizada`);
    console.log(`   Registros actualizados: ${result.count}`);
    
    // Verificar el cambio
    const servicio = await prisma.servicios.findFirst({
      where: {
        nombre: 'Hora Loca'
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
      console.log(`   ⚠️ No se encontró el servicio Hora Loca`);
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar descripción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarDescripcionHoraLoca();














