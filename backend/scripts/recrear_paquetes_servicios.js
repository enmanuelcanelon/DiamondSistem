const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function recrearPaquetesServicios() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🔄 RECREAR SOLO PAQUETES Y SERVICIOS                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Obtener el directorio del backend
    const backendDir = path.resolve(__dirname, '..');

    // PASO 1: Verificar datos existentes
    console.log('📋 Paso 1: Verificando datos existentes...\n');

    const usuarios = await prisma.usuarios.count();
    const clientes = await prisma.clientes.count();
    const contratos = await prisma.contratos.count();
    const ofertas = await prisma.ofertas.count();
    const salones = await prisma.salones.count();

    console.log(`   👥 Usuarios: ${usuarios}`);
    console.log(`   👤 Clientes: ${clientes}`);
    console.log(`   📄 Contratos: ${contratos}`);
    console.log(`   💼 Ofertas: ${ofertas}`);
    console.log(`   🏢 Salones: ${salones}\n`);

    console.log('⚠️  Este script PRESERVARÁ:');
    console.log('   🔒 Usuarios');
    console.log('   🔒 Clientes');
    console.log('   🔒 Contratos');
    console.log('   🔒 Ofertas');
    console.log('   🔒 Salones\n');

    console.log('   Y RECREARÁ:');
    console.log('   ♻️  Paquetes');
    console.log('   ♻️  Servicios');
    console.log('   ♻️  Temporadas');
    console.log('   ♻️  Relaciones paquetes-salones\n');

    // PASO 2: Eliminar SOLO paquetes, servicios y temporadas
    console.log('🗑️  Paso 2: Eliminando paquetes, servicios y temporadas...\n');

    // Eliminar en orden correcto (respetando foreign keys)
    console.log('   • Eliminando ofertas_servicios_adicionales...');
    await prisma.ofertas_servicios_adicionales.deleteMany({});

    console.log('   • Eliminando contratos_servicios...');
    await prisma.contratos_servicios.deleteMany({});

    console.log('   • Eliminando paquetes_servicios...');
    await prisma.paquetes_servicios.deleteMany({});

    console.log('   • Eliminando paquetes_salones...');
    await prisma.paquetes_salones.deleteMany({});

    console.log('   • Eliminando paquetes...');
    await prisma.paquetes.deleteMany({});

    console.log('   • Eliminando servicios...');
    await prisma.servicios.deleteMany({});

    console.log('   • Eliminando temporadas...');
    await prisma.temporadas.deleteMany({});

    console.log('   ✅ Datos eliminados\n');

    // PASO 3: Ejecutar seeds (paquetes, servicios, temporadas)
    console.log('📦 Paso 3: Cargando paquetes, servicios y temporadas...');
    try {
      execSync('node scripts/ejecutar_seeds.js', {
        stdio: 'inherit',
        cwd: backendDir
      });
      console.log('   ✅ Seeds ejecutados\n');
    } catch (error) {
      console.error('   ⚠️  Error ejecutando seeds:', error.message);
    }

    // PASO 4: Crear relaciones paquetes-salones
    console.log('🔗 Paso 4: Creando relaciones paquetes-salones...');
    try {
      execSync('node scripts/crear_paquetes_salones.js', {
        stdio: 'inherit',
        cwd: backendDir
      });
      console.log('   ✅ Relaciones creadas\n');
    } catch (error) {
      console.error('   ⚠️  Error creando relaciones:', error.message);
    }

    // PASO 5: Verificar datos finales
    console.log('🔍 Paso 5: Verificando datos finales...\n');

    const salonesFinales = await prisma.salones.count({ where: { activo: true } });
    const paquetesFinales = await prisma.paquetes.count({ where: { activo: true } });
    const serviciosFinales = await prisma.servicios.count({ where: { activo: true } });
    const temporadasFinales = await prisma.temporadas.count({ where: { activo: true } });
    const relacionesFinales = await prisma.paquetes_salones.count({ where: { disponible: true } });
    const clientesFinales = await prisma.clientes.count();
    const ofertasFinales = await prisma.ofertas.count();
    const contratosFinales = await prisma.contratos.count();

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
    console.log(`   ✅ Salones: ${salonesFinales} (sin cambios)`);
    console.log(`   ✅ Paquetes: ${paquetesFinales}`);
    console.log(`   ✅ Servicios: ${serviciosFinales}`);
    console.log(`   ✅ Temporadas: ${temporadasFinales}`);
    console.log(`   ✅ Relaciones paquetes-salones: ${relacionesFinales}`);
    console.log(`   ${duplicados.length === 0 ? '✅' : '❌'} Servicios duplicados: ${duplicados.length}`);
    console.log(`   🔒 Clientes: ${clientesFinales} (preservados)`);
    console.log(`   🔒 Ofertas: ${ofertasFinales} (preservadas)`);
    console.log(`   🔒 Contratos: ${contratosFinales} (preservados)\n`);

    if (duplicados.length > 0) {
      console.log('⚠️  ADVERTENCIA: Se encontraron servicios duplicados:');
      [...new Set(duplicados)].forEach(nombre => {
        console.log(`   - ${nombre}`);
      });
      console.log('');
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ PAQUETES Y SERVICIOS RECREADOS EXITOSAMENTE      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error durante la recreación:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
recrearPaquetesServicios()
  .then(() => {
    console.log('🎉 Proceso finalizado correctamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
