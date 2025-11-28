const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarDuplicados() {
  try {
    console.log('🔍 Verificando servicios duplicados...\n');

    // Obtener todos los servicios activos
    const servicios = await prisma.servicios.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        categoria: true,
        precio_base: true
      }
    });

    // Agrupar por nombre
    const serviciosPorNombre = {};
    servicios.forEach(s => {
      if (!serviciosPorNombre[s.nombre]) {
        serviciosPorNombre[s.nombre] = [];
      }
      serviciosPorNombre[s.nombre].push(s);
    });

    // Encontrar duplicados
    const duplicados = [];
    Object.entries(serviciosPorNombre).forEach(([nombre, lista]) => {
      if (lista.length > 1) {
        duplicados.push({ nombre, servicios: lista });
      }
    });

    console.log(`📊 Total servicios activos: ${servicios.length}`);
    console.log(`📊 Servicios únicos por nombre: ${Object.keys(serviciosPorNombre).length}\n`);

    if (duplicados.length === 0) {
      console.log('✅ No hay servicios duplicados\n');
    } else {
      console.log(`❌ Se encontraron ${duplicados.length} servicios duplicados:\n`);
      duplicados.forEach(dup => {
        console.log(`  📌 "${dup.nombre}" (${dup.servicios.length} copias):`);
        dup.servicios.forEach(s => {
          console.log(`     - ID: ${s.id} | Categoría: ${s.categoria || 'N/A'} | Precio: $${s.precio_base}`);
        });
        console.log('');
      });

      console.log(`\n⚠️  Total de servicios duplicados: ${duplicados.reduce((sum, d) => sum + d.servicios.length - 1, 0)}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarDuplicados()
  .then(() => {
    console.log('🎉 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
