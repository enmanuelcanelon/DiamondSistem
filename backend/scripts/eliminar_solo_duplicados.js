const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function eliminarSoloDuplicados() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🔍 ELIMINAR SOLO SERVICIOS DUPLICADOS                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // PASO 1: Verificar datos actuales
    console.log('📋 Verificando datos actuales...\n');

    const clientes = await prisma.clientes.count();
    const contratos = await prisma.contratos.count();
    const ofertas = await prisma.ofertas.count();
    const usuarios = await prisma.usuarios.count();
    const servicios = await prisma.servicios.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, precio_base: true, categoria: true }
    });

    console.log(`   👥 Usuarios: ${usuarios}`);
    console.log(`   👤 Clientes: ${clientes}`);
    console.log(`   💼 Ofertas: ${ofertas}`);
    console.log(`   📄 Contratos: ${contratos}`);
    console.log(`   🛠️  Servicios totales: ${servicios.length}\n`);

    // PASO 2: Identificar duplicados
    console.log('🔍 Buscando servicios duplicados...\n');

    const serviciosPorNombre = {};
    servicios.forEach(s => {
      if (!serviciosPorNombre[s.nombre]) {
        serviciosPorNombre[s.nombre] = [];
      }
      serviciosPorNombre[s.nombre].push(s);
    });

    const duplicados = [];
    Object.entries(serviciosPorNombre).forEach(([nombre, lista]) => {
      if (lista.length > 1) {
        duplicados.push({ nombre, servicios: lista });
      }
    });

    if (duplicados.length === 0) {
      console.log('✅ No se encontraron servicios duplicados\n');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ✅ NO HAY DUPLICADOS - BASE DE DATOS LIMPIA         ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      return;
    }

    console.log(`⚠️  Se encontraron ${duplicados.length} servicios duplicados:\n`);
    duplicados.forEach(dup => {
      console.log(`   📌 "${dup.nombre}" (${dup.servicios.length} copias):`);
      dup.servicios.forEach((s, idx) => {
        console.log(`      ${idx === 0 ? '✅ MANTENER' : '❌ ELIMINAR'} - ID: ${s.id} | Precio: $${s.precio_base} | Cat: ${s.categoria || 'N/A'}`);
      });
      console.log('');
    });

    // PASO 3: Confirmar eliminación
    console.log('⚠️  ADVERTENCIA: Se eliminarán los siguientes servicios duplicados:\n');
    let totalAEliminar = 0;
    const idsAEliminar = [];

    duplicados.forEach(dup => {
      // Mantener el PRIMERO (ID más bajo), eliminar el resto
      const [mantener, ...eliminar] = dup.servicios;
      eliminar.forEach(s => {
        idsAEliminar.push(s.id);
        totalAEliminar++;
        console.log(`   ❌ ID ${s.id}: ${s.nombre}`);
      });
    });

    console.log(`\n   Total a eliminar: ${totalAEliminar} servicios\n`);

    // PASO 4: Eliminar duplicados
    console.log('🗑️  Eliminando servicios duplicados...\n');

    // Primero, eliminar de tablas relacionadas
    console.log('   • Eliminando de ofertas_servicios_adicionales...');
    await prisma.ofertas_servicios_adicionales.deleteMany({
      where: { servicio_id: { in: idsAEliminar } }
    });

    console.log('   • Eliminando de contratos_servicios...');
    await prisma.contratos_servicios.deleteMany({
      where: { servicio_id: { in: idsAEliminar } }
    });

    console.log('   • Eliminando de paquetes_servicios...');
    await prisma.paquetes_servicios.deleteMany({
      where: { servicio_id: { in: idsAEliminar } }
    });

    console.log('   • Eliminando servicios duplicados...');
    const resultado = await prisma.servicios.deleteMany({
      where: { id: { in: idsAEliminar } }
    });

    console.log(`   ✅ ${resultado.count} servicios eliminados\n`);

    // PASO 5: Verificar resultado
    console.log('🔍 Verificando resultado...\n');

    const serviciosFinales = await prisma.servicios.findMany({
      where: { activo: true },
      select: { id: true, nombre: true }
    });

    const nombresFinales = new Map();
    const duplicadosFinales = [];
    serviciosFinales.forEach(s => {
      if (nombresFinales.has(s.nombre)) {
        duplicadosFinales.push(s.nombre);
      } else {
        nombresFinales.set(s.nombre, s.id);
      }
    });

    console.log('📊 Resultado final:');
    console.log(`   ✅ Servicios totales: ${serviciosFinales.length}`);
    console.log(`   ✅ Servicios únicos: ${nombresFinales.size}`);
    console.log(`   ${duplicadosFinales.length === 0 ? '✅' : '❌'} Duplicados restantes: ${duplicadosFinales.length}`);
    console.log(`   👤 Clientes: ${clientes} (sin cambios)`);
    console.log(`   💼 Ofertas: ${ofertas} (sin cambios)`);
    console.log(`   📄 Contratos: ${contratos} (sin cambios)\n`);

    if (duplicadosFinales.length === 0) {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ✅ DUPLICADOS ELIMINADOS EXITOSAMENTE               ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('⚠️  Aún quedan duplicados. Ejecuta el script nuevamente.\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante la eliminación:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
eliminarSoloDuplicados()
  .then(() => {
    console.log('🎉 Proceso finalizado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
