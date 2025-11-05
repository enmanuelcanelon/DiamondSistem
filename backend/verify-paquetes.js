const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    const paquetes = await prisma.paquetes.findMany({
      where: {
        nombre: {
          in: ['Paquete Personalizado', 'Servicio Especial']
        }
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      }
    });
    
    console.log('\n=== VERIFICACIÓN DE PAQUETES ===\n');
    paquetes.forEach(p => {
      console.log(`📦 ${p.nombre}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Descripción: ${p.descripcion}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();




