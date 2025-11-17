const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarPreciosTemporadas() {
  try {
    console.log('🔄 Actualizando precios de temporadas...\n');

    // Actualizar Temporada Alta: de 4000 a 1000
    const temporadaAlta = await prisma.temporadas.updateMany({
      where: { nombre: 'Alta' },
      data: {
        ajuste_precio: 1000.00,
        descripcion: 'Temporada Alta - Ajuste de +$1,000'
      }
    });

    console.log(`✅ Temporada Alta actualizada: ${temporadaAlta.count} registro(s)`);
    console.log('   - Ajuste de precio: $4,000 → $1,000\n');

    // Actualizar Temporada Media: de 2000 a 0
    const temporadaMedia = await prisma.temporadas.updateMany({
      where: { nombre: 'Media' },
      data: {
        ajuste_precio: 0.00,
        descripcion: 'Temporada Media - Sin ajuste de precio'
      }
    });

    console.log(`✅ Temporada Media actualizada: ${temporadaMedia.count} registro(s)`);
    console.log('   - Ajuste de precio: $2,000 → $0\n');

    // Verificar los cambios
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });

    console.log('📊 Precios actualizados:');
    temporadas.forEach(t => {
      console.log(`   - ${t.nombre}: $${parseFloat(t.ajuste_precio).toFixed(2)}`);
    });

    console.log('\n✅ ¡Actualización completada exitosamente!');
  } catch (error) {
    console.error('❌ Error al actualizar precios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

actualizarPreciosTemporadas();

