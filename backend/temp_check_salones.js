const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const salones = await prisma.salones.findMany();
    console.log('SALONES:');
    salones.forEach(s => console.log(`  ID: ${s.id} | Nombre: ${s.nombre}`));

    const contratos = await prisma.contratos.findMany({
      include: { salones: true }
    });
    console.log('\nCONTRATOS:');
    contratos.forEach(c => console.log(`  ID: ${c.id} | Codigo: ${c.codigo_contrato} | salon_id: ${c.salon_id} | Salon: ${c.salones?.nombre}`));

    const ofertas = await prisma.ofertas.findMany({
      where: { estado: 'aceptada' },
      include: { salones: true }
    });
    console.log('\nOFERTAS ACEPTADAS:');
    ofertas.forEach(o => console.log(`  ID: ${o.id} | Codigo: ${o.codigo_oferta} | salon_id: ${o.salon_id} | Salon: ${o.salones?.nombre}`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
