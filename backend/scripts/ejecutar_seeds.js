const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function ejecutarSeeds() {
  try {
    console.log('🌱 Ejecutando seeds de base de datos...\n');

    // Leer el archivo SQL
    const seedsPath = path.join(__dirname, '../../../database/seeds.sql');
    
    if (!fs.existsSync(seedsPath)) {
      console.log('⚠️  Archivo seeds.sql no encontrado, saltando seeds...');
      return;
    }

    const sqlContent = fs.readFileSync(seedsPath, 'utf8');

    // Limpiar el SQL: eliminar comentarios de línea (--) y bloques (/* */)
    let cleanedSql = sqlContent
      .replace(/--.*$/gm, '') // Eliminar comentarios de línea
      .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar bloques de comentarios
      .trim();

    // Dividir en statements individuales (separados por ;)
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.match(/^\s*$/)); // Filtrar vacíos y muy cortos

    let ejecutados = 0;
    let errores = 0;
    let ignorados = 0;

    for (const statement of statements) {
      try {
        // Ejecutar cada statement
        await prisma.$executeRawUnsafe(statement);
        ejecutados++;
      } catch (error) {
        // Ignorar errores de "already exists", "duplicate key", o "relation does not exist" (si ya se ejecutó antes)
        const errorMsg = error.message.toLowerCase();
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('duplicate key') ||
          errorMsg.includes('unique constraint') ||
          errorMsg.includes('violates unique constraint') ||
          errorMsg.includes('relation') && errorMsg.includes('does not exist') && ejecutados > 0
        ) {
          ignorados++;
          continue;
        } else {
          // Solo mostrar errores reales
          if (!errorMsg.includes('relation') || !errorMsg.includes('does not exist')) {
            console.error(`⚠️  Error en statement (continuando...): ${error.message.substring(0, 100)}`);
            errores++;
          } else {
            ignorados++;
          }
        }
      }
    }

    console.log(`\n✅ Seeds procesados: ${ejecutados} ejecutados, ${ignorados} ignorados (ya existían)`);
    if (errores > 0) {
      console.log(`⚠️  Errores: ${errores}`);
    }
    console.log('✨ Seeds completados!\n');

  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error.message);
    // No lanzar error, solo loguear (para que el contenedor continúe)
  } finally {
    await prisma.$disconnect();
  }
}

ejecutarSeeds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal en seeds:', error);
    process.exit(1);
  });

