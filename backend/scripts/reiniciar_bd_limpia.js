const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function reiniciarBDLimpia() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🔄 REINICIAR BASE DE DATOS - DATOS ESENCIALES       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Obtener el directorio del backend
    const backendDir = path.resolve(__dirname, '..');

    // PASO 1: Verificar qué datos importantes existen antes de limpiar
    console.log('📋 Paso 1: Verificando datos existentes...\n');

    const usuarios = await prisma.usuarios.count();
    const clientes = await prisma.clientes.count();
    const contratos = await prisma.contratos.count();
    const ofertas = await prisma.ofertas.count();
    const servicios = await prisma.servicios.count();
    const paquetes = await prisma.paquetes.count();
    const salones = await prisma.salones.count();
    const temporadas = await prisma.temporadas.count();

    console.log(`   👥 Usuarios: ${usuarios}`);
    console.log(`   👤 Clientes: ${clientes}`);
    console.log(`   📄 Contratos: ${contratos}`);
    console.log(`   💼 Ofertas: ${ofertas}`);
    console.log(`   🛠️  Servicios: ${servicios}`);
    console.log(`   📦 Paquetes: ${paquetes}`);
    console.log(`   🏢 Salones: ${salones}`);
    console.log(`   📅 Temporadas: ${temporadas}\n`);

    // ADVERTENCIA si hay datos importantes
    if (contratos > 0 || ofertas > 0 || clientes > 0) {
      console.log('⚠️  ADVERTENCIA: Existen contratos, ofertas o clientes en la base de datos');
      console.log('   Este script SOLO eliminará y recreará:');
      console.log('   - ✅ Salones');
      console.log('   - ✅ Paquetes');
      console.log('   - ✅ Servicios');
      console.log('   - ✅ Temporadas');
      console.log('   - ✅ Relaciones paquetes-salones\n');
      console.log('   NO se eliminarán:');
      console.log('   - 🔒 Usuarios');
      console.log('   - 🔒 Clientes');
      console.log('   - 🔒 Contratos');
      console.log('   - 🔒 Ofertas');
      console.log('   - 🔒 Pagos\n');
    }

    // PASO 2: Eliminar SOLO datos de catálogo (servicios, paquetes, salones, temporadas)
    console.log('🗑️  Paso 2: Eliminando datos de catálogo...\n');

    // Eliminar en orden correcto (respetando foreign keys)
    console.log('   • Eliminando relaciones paquetes-servicios...');
    await prisma.paquetes_servicios.deleteMany({});

    console.log('   • Eliminando relaciones paquetes-salones...');
    await prisma.paquetes_salones.deleteMany({});

    console.log('   • Eliminando paquetes...');
    await prisma.paquetes.deleteMany({});

    console.log('   • Eliminando servicios...');
    await prisma.servicios.deleteMany({});

    console.log('   • Eliminando salones...');
    await prisma.salones.deleteMany({});

    console.log('   • Eliminando temporadas...');
    await prisma.temporadas.deleteMany({});

    console.log('   ✅ Datos de catálogo eliminados\n');

    // PASO 3: Crear salones
    console.log('🏢 Paso 3: Creando salones...');
    try {
      execSync('node scripts/crear_salones.js', {
        stdio: 'inherit',
        cwd: backendDir
      });
      console.log('   ✅ Salones creados\n');
    } catch (error) {
      console.error('   ⚠️  Error creando salones:', error.message);
    }

    // PASO 4: Ejecutar seeds (paquetes, servicios, temporadas)
    console.log('📦 Paso 4: Cargando paquetes, servicios y temporadas...');
    try {
      execSync('node scripts/ejecutar_seeds.js', {
        stdio: 'inherit',
        cwd: backendDir
      });
      console.log('   ✅ Seeds ejecutados\n');
    } catch (error) {
      console.error('   ⚠️  Error ejecutando seeds:', error.message);
    }

    // PASO 5: Crear relaciones paquetes-salones
    console.log('🔗 Paso 5: Creando relaciones paquetes-salones...');
    try {
      execSync('node scripts/crear_paquetes_salones.js', {
        stdio: 'inherit',
        cwd: backendDir
      });
      console.log('   ✅ Relaciones creadas\n');
    } catch (error) {
      console.error('   ⚠️  Error creando relaciones:', error.message);
    }

    // PASO 6: Verificar datos finales
    console.log('🔍 Paso 6: Verificando datos finales...\n');

    const salonesFinales = await prisma.salones.count({ where: { activo: true } });
    const paquetesFinales = await prisma.paquetes.count({ where: { activo: true } });
    const serviciosFinales = await prisma.servicios.count({ where: { activo: true } });
    const temporadasFinales = await prisma.temporadas.count({ where: { activo: true } });
    const relacionesFinales = await prisma.paquetes_salones.count({ where: { disponible: true } });

    // Verificar duplicados
    const serviciosAll = await prisma.servicios.findMany({
      where: { activo: true },
      select: { id: true, nombre: true }
    });

    const nombresServicios = new Map();
    const duplicados = [];
    serviciosAll.forEach(s => {
      if (nombresServicios.has(s.nombre)) {
        duplicados.push(s.nombre);
      } else {
        nombresServicios.set(s.nombre, s.id);
      }
    });

    console.log('📊 Resumen final:');
    console.log(`   ✅ Salones: ${salonesFinales}`);
    console.log(`   ✅ Paquetes: ${paquetesFinales}`);
    console.log(`   ✅ Servicios: ${serviciosFinales}`);
    console.log(`   ✅ Temporadas: ${temporadasFinales}`);
    console.log(`   ✅ Relaciones paquetes-salones: ${relacionesFinales}`);
    console.log(`   ${duplicados.length === 0 ? '✅' : '❌'} Servicios duplicados: ${duplicados.length}\n`);

    if (duplicados.length > 0) {
      console.log('⚠️  ADVERTENCIA: Se encontraron servicios duplicados:');
      [...new Set(duplicados)].forEach(nombre => {
        console.log(`   - ${nombre}`);
      });
      console.log('');
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ BASE DE DATOS REINICIADA EXITOSAMENTE            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error durante la reinicialización:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
reiniciarBDLimpia()
  .then(() => {
    console.log('🎉 Proceso finalizado correctamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
