const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Obtener la oferta más reciente de Diamond
    const oferta = await prisma.ofertas.findFirst({
      where: {
        salones: {
          nombre: {
            contains: 'diamond',
            mode: 'insensitive'
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      },
      include: {
        ofertas_servicios_adicionales: {
          include: {
            servicios: true
          }
        },
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        }
      }
    });

    if (!oferta) {
      console.log('❌ No se encontró ninguna oferta de Diamond');
      return;
    }

    console.log('\n📋 OFERTA:', oferta.codigo_oferta);
    console.log('📦 PAQUETE:', oferta.paquetes?.nombre);

    console.log('\n🎁 SERVICIOS DEL PAQUETE:');
    if (oferta.paquetes?.paquetes_servicios) {
      oferta.paquetes.paquetes_servicios.forEach(ps => {
        console.log(`  - ${ps.servicios.nombre} (${ps.cantidad}x) - Categoría: ${ps.servicios.categoria}`);
      });
    }

    console.log('\n✨ SERVICIOS ADICIONALES (EXTRAS):');
    console.log('Total de extras en BD:', oferta.ofertas_servicios_adicionales?.length || 0);

    if (oferta.ofertas_servicios_adicionales && oferta.ofertas_servicios_adicionales.length > 0) {
      oferta.ofertas_servicios_adicionales.forEach(osa => {
        console.log(`  - ${osa.servicios.nombre} (${osa.cantidad}x) - Categoría: ${osa.servicios.categoria}`);
      });
    } else {
      console.log('  ⚠️ No hay servicios adicionales registrados en la BD');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
