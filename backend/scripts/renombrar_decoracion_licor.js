const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renombrarDecoracionLicor() {
  try {
    // 1. Renombrar "Decoración Básica" a "Decoracion House"
    const resultDecoracion = await prisma.servicios.updateMany({
      where: {
        nombre: 'Decoración Básica'
      },
      data: {
        nombre: 'Decoracion House'
      }
    });
    
    console.log(`✅ Servicio "Decoración Básica" actualizado a "Decoracion House"`);
    console.log(`   Registros actualizados: ${resultDecoracion.count}`);
    
    // 2. Renombrar "Licor Básico" a "Licor House"
    const resultLicor = await prisma.servicios.updateMany({
      where: {
        nombre: 'Licor Básico'
      },
      data: {
        nombre: 'Licor House'
      }
    });
    
    console.log(`✅ Servicio "Licor Básico" actualizado a "Licor House"`);
    console.log(`   Registros actualizados: ${resultLicor.count}`);
    
    // Verificar los cambios
    const decoracion = await prisma.servicios.findFirst({
      where: {
        nombre: 'Decoracion House'
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      }
    });
    
    const licor = await prisma.servicios.findFirst({
      where: {
        nombre: 'Licor House'
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      }
    });
    
    if (decoracion) {
      console.log(`\n   Verificación Decoración:`);
      console.log(`   - Nombre: ${decoracion.nombre}`);
      console.log(`   - Descripción: ${decoracion.descripcion}`);
    }
    
    if (licor) {
      console.log(`\n   Verificación Licor:`);
      console.log(`   - Nombre: ${licor.nombre}`);
      console.log(`   - Descripción: ${licor.descripcion}`);
    }
    
  } catch (error) {
    console.error('❌ Error al renombrar servicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

renombrarDecoracionLicor();






