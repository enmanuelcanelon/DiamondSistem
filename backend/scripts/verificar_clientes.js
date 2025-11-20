/**
 * Script para verificar clientes en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarClientes() {
  try {
    console.log('🔍 Verificando clientes en la base de datos...\n');

    const clientes = await prisma.clientes.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nombre_completo: true,
        email: true,
        fecha_registro: true
      }
    });

    console.log(`📊 Total de clientes: ${clientes.length}\n`);

    if (clientes.length > 0) {
      console.log('📋 Lista de clientes:');
      clientes.forEach(cliente => {
        console.log(`   - ID: ${cliente.id} | ${cliente.nombre_completo} | ${cliente.email} | ${cliente.fecha_registro}`);
      });
    } else {
      console.log('✅ No hay clientes en la base de datos');
    }

    // Verificar el próximo ID que se usará
    const proximoId = await prisma.$queryRawUnsafe(`
      SELECT last_value FROM clientes_id_seq;
    `);
    console.log(`\n🔄 Próximo ID que se usará: ${proximoId[0]?.last_value || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarClientes()
  .then(() => {
    console.log('\n✨ Verificación completada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

