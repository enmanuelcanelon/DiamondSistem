const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verServicios() {
  try {
    const servicios = await prisma.servicios.findMany({
      where: {
        nombre: {
          in: ['Pasapalos', 'Mini Dulces', 'Mini Dulce']
        }
      },
      select: {
        id: true,
        nombre: true,
        precio_base: true,
        tipo_cobro: true,
        descripcion: true
      }
    });
    
    console.log('\n=== SERVICIOS ENCONTRADOS ===\n');
    
    if (servicios.length === 0) {
      console.log('❌ No se encontraron servicios con esos nombres');
      console.log('\nBuscando todos los servicios que contengan "dulce" o "pasapalos"...\n');
      
      const todosServicios = await prisma.servicios.findMany({
        select: {
          id: true,
          nombre: true,
          precio_base: true,
          tipo_cobro: true
        }
      });
      
      const filtrados = todosServicios.filter(s => 
        s.nombre.toLowerCase().includes('dulce') || 
        s.nombre.toLowerCase().includes('pasapalos')
      );
      
      filtrados.forEach(s => {
        console.log(`📦 ID: ${s.id} - ${s.nombre}`);
        console.log(`   Precio Base: $${s.precio_base}`);
        console.log(`   Tipo Cobro: ${s.tipo_cobro}`);
        console.log('');
      });
      
      if (filtrados.length === 0) {
        console.log('No se encontraron servicios relacionados');
      }
    } else {
      servicios.forEach(s => {
        console.log(`📦 ID: ${s.id} - ${s.nombre}`);
        console.log(`   Precio Base: $${s.precio_base}`);
        console.log(`   Tipo Cobro: ${s.tipo_cobro || 'NO DEFINIDO'}`);
        console.log(`   Descripción: ${s.descripcion || 'Sin descripción'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verServicios();

