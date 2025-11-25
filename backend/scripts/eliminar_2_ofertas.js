/**
 * Script para eliminar las 2 ofertas existentes en la BD
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function eliminar2Ofertas() {
  try {
    console.log('🔍 Buscando ofertas en la base de datos...\n');

    // 1. Obtener todas las ofertas
    const ofertas = await prisma.ofertas.findMany({
      orderBy: { id: 'asc' },
      include: {
        clientes: {
          select: { nombre_completo: true }
        }
      }
    });

    console.log(`📊 Ofertas encontradas: ${ofertas.length}\n`);

    if (ofertas.length === 0) {
      console.log('✅ No hay ofertas para eliminar.');
      return;
    }

    // Mostrar las ofertas encontradas
    ofertas.forEach((oferta, index) => {
      console.log(`${index + 1}. ID: ${oferta.id} - Código: ${oferta.codigo_oferta || 'N/A'} - Cliente: ${oferta.clientes?.nombre_completo || 'N/A'} - Estado: ${oferta.estado}`);
    });

    // 2. Eliminar solo las 2 primeras ofertas
    const ofertasAEliminar = ofertas.slice(0, 2);
    console.log(`\n🗑️  Eliminando ${ofertasAEliminar.length} oferta(s)...\n`);

    for (const oferta of ofertasAEliminar) {
      console.log(`   Eliminando oferta ID: ${oferta.id} (${oferta.codigo_oferta || 'sin código'})...`);
      
      // Eliminar servicios adicionales primero
      await prisma.ofertas_servicios_adicionales.deleteMany({
        where: { oferta_id: oferta.id }
      });
      
      // Eliminar la oferta
      await prisma.ofertas.delete({
        where: { id: oferta.id }
      });
      
      console.log(`   ✅ Oferta ${oferta.id} eliminada`);
    }

    // Verificación final
    const ofertasRestantes = await prisma.ofertas.count();
    console.log(`\n✅ Proceso completado!`);
    console.log(`📊 Ofertas restantes: ${ofertasRestantes}`);

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  eliminar2Ofertas()
    .then(() => {
      console.log('\n✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { eliminar2Ofertas };

