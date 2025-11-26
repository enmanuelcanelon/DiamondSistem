const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const paquetes = await prisma.paquetes.findMany({
      include: {
        paquetes_servicios: {
          include: {
            servicios: true
          }
        }
      }
    });

    paquetes.forEach(p => {
      console.log(`\n📦 PAQUETE: ${p.nombre}`);
      console.log(`   Duración base: ${p.duracion_horas} horas`);
      console.log(`   Servicios incluidos:`);

      p.paquetes_servicios.forEach(ps => {
        console.log(`   - ${ps.servicios.nombre} (${ps.cantidad}x) | Categoría: ${ps.servicios.categoria} | Gratis: ${ps.incluido_gratis}`);
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
