const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verTodos() {
  try {
    const paquetes = await prisma.paquetes.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    console.log('\n=== TODOS LOS PAQUETES ===\n');
    paquetes.forEach(p => {
      console.log(`📦 ID: ${p.id} - ${p.nombre}`);
      console.log(`   ${p.descripcion}`);
      
      // Buscar caracteres problemáticos
      if (p.descripcion && p.descripcion.includes('Ã')) {
        console.log('   ⚠️ CONTIENE ERRORES DE CODIFICACIÓN');
      }
      console.log('');
    });
    
    console.log(`\nTotal: ${paquetes.length} paquetes\n`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verTodos();




