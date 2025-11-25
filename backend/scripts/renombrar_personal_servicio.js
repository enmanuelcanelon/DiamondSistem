const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renombrarPersonalServicio() {
  try {
    // Renombrar "Personal de Servicio" a "Personal de Atención"
    const result = await prisma.servicios.updateMany({
      where: {
        nombre: 'Personal de Servicio'
      },
      data: {
        nombre: 'Personal de Atención',
        descripcion: 'Meseros y personal de atención'
      }
    });
    
    console.log(`✅ Servicio renombrado exitosamente`);
    console.log(`   Registros actualizados: ${result.count}`);
    
    // Verificar el cambio
    const servicio = await prisma.servicios.findFirst({
      where: {
        nombre: 'Personal de Atención'
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
      console.log(`   ⚠️ No se encontró el servicio renombrado`);
    }
    
  } catch (error) {
    console.error('❌ Error al renombrar servicio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

renombrarPersonalServicio();






