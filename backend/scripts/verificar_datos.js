/**
 * Script para verificar qué datos quedan en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDatos() {
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');

    const eventos = await prisma.eventos.count();
    const contratos = await prisma.contratos.count();
    const clientes = await prisma.clientes.count();
    const leaks = await prisma.leaks.count();
    const leaksAsignados = await prisma.leaks.count({
      where: { vendedor_id: { not: null } }
    });
    const ofertas = await prisma.ofertas.count();
    const pagos = await prisma.pagos.count();

    console.log('📊 Resumen de datos:');
    console.log(`   - Eventos: ${eventos}`);
    console.log(`   - Contratos: ${contratos}`);
    console.log(`   - Clientes: ${clientes}`);
    console.log(`   - Leaks totales: ${leaks}`);
    console.log(`   - Leaks asignados: ${leaksAsignados}`);
    console.log(`   - Ofertas: ${ofertas}`);
    console.log(`   - Pagos: ${pagos}`);

    if (eventos > 0 || contratos > 0 || clientes > 0) {
      console.log('\n⚠️  Aún hay datos que no fueron eliminados.');
      
      if (eventos > 0) {
        const eventosList = await prisma.eventos.findMany({
          select: { id: true, nombre_evento: true, fecha_evento: true }
        });
        console.log('\n📋 Eventos restantes:');
        eventosList.forEach(e => {
          console.log(`   - ID: ${e.id}, Nombre: ${e.nombre_evento}, Fecha: ${e.fecha_evento}`);
        });
      }

      if (contratos > 0) {
        const contratosList = await prisma.contratos.findMany({
          select: { id: true, codigo_contrato: true, fecha_evento: true }
        });
        console.log('\n📋 Contratos restantes:');
        contratosList.forEach(c => {
          console.log(`   - ID: ${c.id}, Código: ${c.codigo_contrato}, Fecha: ${c.fecha_evento}`);
        });
      }

      if (clientes > 0) {
        const clientesList = await prisma.clientes.findMany({
          select: { id: true, nombre_completo: true, email: true }
        });
        console.log('\n📋 Clientes restantes:');
        clientesList.forEach(c => {
          console.log(`   - ID: ${c.id}, Nombre: ${c.nombre_completo}, Email: ${c.email}`);
        });
      }
    } else {
      console.log('\n✅ No hay eventos, contratos ni clientes en la base de datos.');
    }

  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  verificarDatos()
    .then(() => {
      console.log('\n✨ Verificación completada.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { verificarDatos };


