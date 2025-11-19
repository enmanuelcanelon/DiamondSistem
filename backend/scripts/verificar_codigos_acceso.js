/**
 * Script para verificar y limpiar códigos de acceso de clientes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarYCrearCodigosAcceso() {
  try {
    console.log('🔍 Verificando códigos de acceso de clientes...\n');

    // Verificar si hay contratos (todos tienen códigos de acceso)
    const contratosConCodigo = await prisma.contratos.findMany({
      select: {
        id: true,
        codigo_contrato: true,
        codigo_acceso_cliente: true,
        fecha_evento: true
      }
    });

    console.log(`📊 Contratos con código de acceso: ${contratosConCodigo.length}`);

    if (contratosConCodigo.length > 0) {
      console.log('\n📋 Contratos encontrados:');
      contratosConCodigo.forEach(contrato => {
        console.log(`   - ID: ${contrato.id}, Código: ${contrato.codigo_contrato}, Acceso: ${contrato.codigo_acceso_cliente}, Fecha: ${contrato.fecha_evento}`);
      });

      console.log('\n⚠️  Aún hay contratos con códigos de acceso.');
      console.log('   Estos contratos deben ser eliminados primero.');
    } else {
      console.log('\n✅ No hay contratos con códigos de acceso.');
      console.log('   Todos los códigos de acceso han sido eliminados correctamente.');
    }

    // Verificar clientes
    const clientesCount = await prisma.clientes.count();
    console.log(`\n📊 Clientes en la base de datos: ${clientesCount}`);

    if (clientesCount > 0) {
      const clientes = await prisma.clientes.findMany({
        select: {
          id: true,
          nombre_completo: true,
          email: true
        }
      });
      console.log('\n📋 Clientes encontrados:');
      clientes.forEach(cliente => {
        console.log(`   - ID: ${cliente.id}, Nombre: ${cliente.nombre_completo}, Email: ${cliente.email}`);
      });
    } else {
      console.log('\n✅ No hay clientes en la base de datos.');
    }

    // Resumen final
    console.log('\n📊 Resumen:');
    console.log(`   - Contratos con código de acceso: ${contratosConCodigo.length}`);
    console.log(`   - Clientes en la base de datos: ${clientesCount}`);

    if (contratosConCodigo.length === 0 && clientesCount === 0) {
      console.log('\n✅ La base de datos está completamente limpia.');
      console.log('   No hay códigos de acceso ni clientes que puedan acceder al frontend-cliente.');
    } else {
      console.log('\n⚠️  Aún hay datos que permiten acceso al frontend-cliente.');
    }

  } catch (error) {
    console.error('❌ Error al verificar códigos de acceso:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  verificarYCrearCodigosAcceso()
    .then(() => {
      console.log('\n✨ Verificación completada.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { verificarYCrearCodigosAcceso };

