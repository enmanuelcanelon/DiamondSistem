const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function inicializarBDCompleto() {
  try {
    console.log('🚀 Inicializando base de datos completa...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Obtener el directorio del backend (padre de scripts)
    const backendDir = path.resolve(__dirname, '..');

    // Paso 1: Crear salones
    console.log('📋 Paso 1: Creando salones...');
    try {
      execSync('node scripts/crear_salones.js', { 
        stdio: 'inherit',
        cwd: backendDir 
      });
      console.log('✅ Salones creados\n');
    } catch (error) {
      console.error('⚠️  Error creando salones:', error.message);
    }

    // Paso 2: Ejecutar seeds (paquetes, servicios, temporadas, etc.)
    console.log('📦 Paso 2: Cargando paquetes, servicios, temporadas...');
    try {
      execSync('node scripts/ejecutar_seeds.js', { 
        stdio: 'inherit',
        cwd: backendDir 
      });
      console.log('✅ Seeds ejecutados\n');
    } catch (error) {
      console.error('⚠️  Error ejecutando seeds:', error.message);
    }

    // Paso 3: Crear relaciones paquetes-salones
    console.log('🔗 Paso 3: Creando relaciones paquetes-salones...');
    try {
      execSync('node scripts/crear_paquetes_salones.js', { 
        stdio: 'inherit',
        cwd: backendDir 
      });
      console.log('✅ Relaciones creadas\n');
    } catch (error) {
      console.error('⚠️  Error creando relaciones:', error.message);
    }

    // Paso 4: Verificar que todo está correcto
    console.log('🔍 Paso 4: Verificando datos...\n');
    
    const salones = await prisma.salones.count({ where: { activo: true } });
    const paquetes = await prisma.paquetes.count({ where: { activo: true } });
    const servicios = await prisma.servicios.count({ where: { activo: true } });
    const temporadas = await prisma.temporadas.count({ where: { activo: true } });
    const paquetesSalones = await prisma.paquetes_salones.count({ where: { disponible: true } });

    console.log('📊 Resumen de datos cargados:');
    console.log(`   ✅ Salones: ${salones}`);
    console.log(`   ✅ Paquetes: ${paquetes}`);
    console.log(`   ✅ Servicios: ${servicios}`);
    console.log(`   ✅ Temporadas: ${temporadas}`);
    console.log(`   ✅ Relaciones paquetes-salones: ${paquetesSalones}\n`);

    if (salones === 0) {
      console.log('⚠️  ADVERTENCIA: No hay salones. Ejecuta: node scripts/crear_salones.js');
    }
    if (paquetes === 0) {
      console.log('⚠️  ADVERTENCIA: No hay paquetes. Ejecuta: node scripts/ejecutar_seeds.js');
    }
    if (paquetesSalones === 0) {
      console.log('⚠️  ADVERTENCIA: No hay relaciones paquetes-salones. Ejecuta: node scripts/crear_paquetes_salones.js');
    }

    if (salones > 0 && paquetes > 0 && paquetesSalones > 0) {
      console.log('✨ ¡Base de datos inicializada correctamente!\n');
    } else {
      console.log('⚠️  Algunos datos faltan. Revisa los warnings arriba.\n');
    }

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

inicializarBDCompleto()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

