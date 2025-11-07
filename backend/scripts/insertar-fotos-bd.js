/**
 * Script para insertar las fotos procesadas en la base de datos
 * Lee el archivo imagenes-resultados.json y crea los registros en fotos_servicios
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const RESULTADOS_PATH = path.join(__dirname, '../imagenes-resultados.json');

// Mapeo de tipos de servicio a orden inicial
const ORDEN_INICIAL = {
  torta: 0,
  decoracion: 0,
  menu: 0,
  bar: 0
};

/**
 * Generar nombre legible desde el nombre del archivo
 */
function generarNombreLegible(nombreArchivo, descripcion) {
  // Si ya tenemos una descripción, usarla
  if (descripcion && descripcion !== nombreArchivo) {
    return descripcion;
  }
  
  // Generar desde el nombre del archivo
  return nombreArchivo
    .replace(/\.webp$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Función principal
 */
async function insertarFotos() {
  try {
    // Leer resultados
    if (!fs.existsSync(RESULTADOS_PATH)) {
      console.error(`❌ Archivo no encontrado: ${RESULTADOS_PATH}`);
      console.error('💡 Ejecuta primero el script convertir-imagenes.js');
      process.exit(1);
    }
    
    const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, 'utf-8'));
    
    console.log(`📊 Encontradas ${resultados.length} imágenes para insertar\n`);
    
    // Agrupar por tipo de servicio
    const fotosPorTipo = {};
    resultados.forEach(foto => {
      if (!fotosPorTipo[foto.tipoServicio]) {
        fotosPorTipo[foto.tipoServicio] = [];
      }
      fotosPorTipo[foto.tipoServicio].push(foto);
    });
    
    let totalInsertadas = 0;
    let totalErrores = 0;
    
    // Insertar por tipo
    for (const [tipoServicio, fotos] of Object.entries(fotosPorTipo)) {
      console.log(`\n📁 Insertando ${fotos.length} fotos de ${tipoServicio}...`);
      
      let orden = ORDEN_INICIAL[tipoServicio] || 0;
      
      for (const foto of fotos) {
        try {
          // Verificar si ya existe
          const existe = await prisma.fotos_servicios.findFirst({
            where: {
              tipo_servicio: tipoServicio,
              nombre_archivo: foto.nombreArchivo
            }
          });
          
          if (existe) {
            console.log(`  ⚠️  Ya existe: ${foto.nombreArchivo}`);
            continue;
          }
          
          // Generar nombre y descripción
          const nombre = generarNombreLegible(foto.nombreArchivo, foto.descripcion);
          const urlImagen = `/fotos/servicios/${tipoServicio}/${foto.nombreArchivo}`;
          
          // Insertar
          await prisma.fotos_servicios.create({
            data: {
              tipo_servicio: tipoServicio,
              nombre: nombre,
              nombre_archivo: foto.nombreArchivo,
              descripcion: foto.descripcion || null,
              url_imagen: urlImagen,
              orden: orden++,
              activo: true
            }
          });
          
          totalInsertadas++;
          console.log(`  ✅ ${foto.nombreArchivo}`);
          
        } catch (error) {
          totalErrores++;
          console.error(`  ❌ Error insertando ${foto.nombreArchivo}:`, error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(50));
    console.log(`✅ Insertadas: ${totalInsertadas}`);
    console.log(`❌ Errores: ${totalErrores}`);
    console.log('\n✨ Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
insertarFotos();

 * Script para insertar las fotos procesadas en la base de datos
 * Lee el archivo imagenes-resultados.json y crea los registros en fotos_servicios
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const RESULTADOS_PATH = path.join(__dirname, '../imagenes-resultados.json');

// Mapeo de tipos de servicio a orden inicial
const ORDEN_INICIAL = {
  torta: 0,
  decoracion: 0,
  menu: 0,
  bar: 0
};

/**
 * Generar nombre legible desde el nombre del archivo
 */
function generarNombreLegible(nombreArchivo, descripcion) {
  // Si ya tenemos una descripción, usarla
  if (descripcion && descripcion !== nombreArchivo) {
    return descripcion;
  }
  
  // Generar desde el nombre del archivo
  return nombreArchivo
    .replace(/\.webp$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Función principal
 */
async function insertarFotos() {
  try {
    // Leer resultados
    if (!fs.existsSync(RESULTADOS_PATH)) {
      console.error(`❌ Archivo no encontrado: ${RESULTADOS_PATH}`);
      console.error('💡 Ejecuta primero el script convertir-imagenes.js');
      process.exit(1);
    }
    
    const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, 'utf-8'));
    
    console.log(`📊 Encontradas ${resultados.length} imágenes para insertar\n`);
    
    // Agrupar por tipo de servicio
    const fotosPorTipo = {};
    resultados.forEach(foto => {
      if (!fotosPorTipo[foto.tipoServicio]) {
        fotosPorTipo[foto.tipoServicio] = [];
      }
      fotosPorTipo[foto.tipoServicio].push(foto);
    });
    
    let totalInsertadas = 0;
    let totalErrores = 0;
    
    // Insertar por tipo
    for (const [tipoServicio, fotos] of Object.entries(fotosPorTipo)) {
      console.log(`\n📁 Insertando ${fotos.length} fotos de ${tipoServicio}...`);
      
      let orden = ORDEN_INICIAL[tipoServicio] || 0;
      
      for (const foto of fotos) {
        try {
          // Verificar si ya existe
          const existe = await prisma.fotos_servicios.findFirst({
            where: {
              tipo_servicio: tipoServicio,
              nombre_archivo: foto.nombreArchivo
            }
          });
          
          if (existe) {
            console.log(`  ⚠️  Ya existe: ${foto.nombreArchivo}`);
            continue;
          }
          
          // Generar nombre y descripción
          const nombre = generarNombreLegible(foto.nombreArchivo, foto.descripcion);
          const urlImagen = `/fotos/servicios/${tipoServicio}/${foto.nombreArchivo}`;
          
          // Insertar
          await prisma.fotos_servicios.create({
            data: {
              tipo_servicio: tipoServicio,
              nombre: nombre,
              nombre_archivo: foto.nombreArchivo,
              descripcion: foto.descripcion || null,
              url_imagen: urlImagen,
              orden: orden++,
              activo: true
            }
          });
          
          totalInsertadas++;
          console.log(`  ✅ ${foto.nombreArchivo}`);
          
        } catch (error) {
          totalErrores++;
          console.error(`  ❌ Error insertando ${foto.nombreArchivo}:`, error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(50));
    console.log(`✅ Insertadas: ${totalInsertadas}`);
    console.log(`❌ Errores: ${totalErrores}`);
    console.log('\n✨ Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
insertarFotos();

 * Script para insertar las fotos procesadas en la base de datos
 * Lee el archivo imagenes-resultados.json y crea los registros en fotos_servicios
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const RESULTADOS_PATH = path.join(__dirname, '../imagenes-resultados.json');

// Mapeo de tipos de servicio a orden inicial
const ORDEN_INICIAL = {
  torta: 0,
  decoracion: 0,
  menu: 0,
  bar: 0
};

/**
 * Generar nombre legible desde el nombre del archivo
 */
function generarNombreLegible(nombreArchivo, descripcion) {
  // Si ya tenemos una descripción, usarla
  if (descripcion && descripcion !== nombreArchivo) {
    return descripcion;
  }
  
  // Generar desde el nombre del archivo
  return nombreArchivo
    .replace(/\.webp$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Función principal
 */
async function insertarFotos() {
  try {
    // Leer resultados
    if (!fs.existsSync(RESULTADOS_PATH)) {
      console.error(`❌ Archivo no encontrado: ${RESULTADOS_PATH}`);
      console.error('💡 Ejecuta primero el script convertir-imagenes.js');
      process.exit(1);
    }
    
    const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, 'utf-8'));
    
    console.log(`📊 Encontradas ${resultados.length} imágenes para insertar\n`);
    
    // Agrupar por tipo de servicio
    const fotosPorTipo = {};
    resultados.forEach(foto => {
      if (!fotosPorTipo[foto.tipoServicio]) {
        fotosPorTipo[foto.tipoServicio] = [];
      }
      fotosPorTipo[foto.tipoServicio].push(foto);
    });
    
    let totalInsertadas = 0;
    let totalErrores = 0;
    
    // Insertar por tipo
    for (const [tipoServicio, fotos] of Object.entries(fotosPorTipo)) {
      console.log(`\n📁 Insertando ${fotos.length} fotos de ${tipoServicio}...`);
      
      let orden = ORDEN_INICIAL[tipoServicio] || 0;
      
      for (const foto of fotos) {
        try {
          // Verificar si ya existe
          const existe = await prisma.fotos_servicios.findFirst({
            where: {
              tipo_servicio: tipoServicio,
              nombre_archivo: foto.nombreArchivo
            }
          });
          
          if (existe) {
            console.log(`  ⚠️  Ya existe: ${foto.nombreArchivo}`);
            continue;
          }
          
          // Generar nombre y descripción
          const nombre = generarNombreLegible(foto.nombreArchivo, foto.descripcion);
          const urlImagen = `/fotos/servicios/${tipoServicio}/${foto.nombreArchivo}`;
          
          // Insertar
          await prisma.fotos_servicios.create({
            data: {
              tipo_servicio: tipoServicio,
              nombre: nombre,
              nombre_archivo: foto.nombreArchivo,
              descripcion: foto.descripcion || null,
              url_imagen: urlImagen,
              orden: orden++,
              activo: true
            }
          });
          
          totalInsertadas++;
          console.log(`  ✅ ${foto.nombreArchivo}`);
          
        } catch (error) {
          totalErrores++;
          console.error(`  ❌ Error insertando ${foto.nombreArchivo}:`, error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(50));
    console.log(`✅ Insertadas: ${totalInsertadas}`);
    console.log(`❌ Errores: ${totalErrores}`);
    console.log('\n✨ Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
insertarFotos();













