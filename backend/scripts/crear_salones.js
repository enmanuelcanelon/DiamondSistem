const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function crearSalones() {
  try {
    console.log('🏢 Creando salones...\n');

    const salones = [
      {
        nombre: 'Diamond',
        capacidad_maxima: 200,
        pisos_torta: 3,
        descripcion: 'Salón principal con capacidad para hasta 200 invitados',
        activo: true
      },
      {
        nombre: 'Kendall',
        capacidad_maxima: 80,
        pisos_torta: 2,
        descripcion: 'Salón Kendall con capacidad para hasta 80 invitados',
        activo: true
      },
      {
        nombre: 'Doral',
        capacidad_maxima: 60,
        pisos_torta: 2,
        descripcion: 'Salón Doral con capacidad para hasta 60 invitados',
        activo: true
      }
    ];

    let creados = 0;
    let actualizados = 0;

    for (const salon of salones) {
      const existe = await prisma.salones.findUnique({
        where: { nombre: salon.nombre }
      });

      if (existe) {
        await prisma.salones.update({
          where: { nombre: salon.nombre },
          data: salon
        });
        actualizados++;
        console.log(`✅ Salón "${salon.nombre}" actualizado`);
      } else {
        await prisma.salones.create({
          data: salon
        });
        creados++;
        console.log(`✅ Salón "${salon.nombre}" creado`);
      }
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   - Creados: ${creados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Total: ${salones.length}\n`);

  } catch (error) {
    console.error('❌ Error creando salones:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearSalones()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

