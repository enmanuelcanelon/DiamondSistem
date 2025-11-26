const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Fecha 27 de noviembre 2025
    const fecha = new Date('2025-11-27');
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    console.log('🔍 Buscando eventos el 27 de noviembre 2025 en Kendall (salon_id: 2)');
    console.log('Rango:', fechaInicio.toISOString(), 'a', fechaFin.toISOString());

    const contratos = await prisma.contratos.findMany({
      where: {
        salon_id: 2,
        fecha_evento: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      select: {
        id: true,
        codigo_contrato: true,
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        estado: true
      }
    });

    console.log('\n📄 CONTRATOS (', contratos.length, '):');
    contratos.forEach(c => {
      console.log('  -', c.codigo_contrato, '| Estado:', c.estado, '| Fecha:', c.fecha_evento, '| Horas:', c.hora_inicio, '-', c.hora_fin);
    });

    const ofertas = await prisma.ofertas.findMany({
      where: {
        salon_id: 2,
        fecha_evento: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      select: {
        id: true,
        codigo_oferta: true,
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        estado: true
      }
    });

    console.log('\n📋 OFERTAS (', ofertas.length, '):');
    ofertas.forEach(o => {
      console.log('  -', o.codigo_oferta, '| Estado:', o.estado, '| Fecha:', o.fecha_evento, '| Horas:', o.hora_inicio, '-', o.hora_fin);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
