/**
 * Script para convertir y optimizar imágenes de servicios
 * Convierte imágenes de imagenes-originales a public/fotos/servicios
 * Genera múltiples tamaños: thumbnails, medium, large
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Mapeo de carpetas originales a tipos del sistema
const MAPEO_CARPETAS = {
  'Cakes': 'torta',
  'Bar': 'bar',
  'Comida': 'menu',
  'Decoracion': 'decoracion'
};

const INPUT_DIR = path.join(__dirname, '../imagenes-originales');
const OUTPUT_DIR = path.join(__dirname, '../public/fotos/servicios');

// Tamaños para generar
const SIZES = {
  thumbnails: 300,
  medium: 800,
  large: 1200
};

// Estadísticas
let stats = {
  procesadas: 0,
  errores: 0,
  tipos: {}
};

/**
 * Generar nombre descriptivo desde la ruta del archivo
 */
function generarNombreDescriptivo(filePath, tipoServicio) {
  const relativePath = path.relative(
    path.join(INPUT_DIR, Object.keys(MAPEO_CARPETAS).find(k => MAPEO_CARPETAS[k] === tipoServicio) || ''),
    filePath
  );
  
  // Remover extensión y normalizar
  const nombreSinExt = path.basename(relativePath, path.extname(relativePath));
  const carpeta = path.dirname(relativePath);
  
  // Generar descripción legible
  let descripcion = nombreSinExt
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\./g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Agregar contexto de carpeta si existe
  if (carpeta && carpeta !== '.') {
    const carpetaNombre = carpeta.split(path.sep).pop();
    descripcion = `${carpetaNombre} - ${descripcion}`;
  }
  
  return descripcion;
}

/**
 * Convertir una imagen a múltiples tamaños
 */
async function convertirImagen(inputPath, outputDir, nombreBase, tipoServicio) {
  const extension = path.extname(inputPath);
  const nombreSinExt = path.basename(nombreBase, extension);
  const nombreArchivo = `${nombreSinExt}.webp`;
  
  try {
    // Leer metadata de la imagen original
    const metadata = await sharp(inputPath).metadata();
    
    for (const [sizeName, size] of Object.entries(SIZES)) {
      const outputPath = path.join(outputDir, sizeName, nombreArchivo);
      
      // Crear directorio si no existe
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      // Calcular dimensiones manteniendo aspect ratio
      let width = size;
      let height = size;
      
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (metadata.width > metadata.height) {
          height = Math.round(size / aspectRatio);
        } else {
          width = Math.round(size * aspectRatio);
        }
      }
      
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 85,
          effort: 6 // Mayor esfuerzo = mejor compresión
        })
        .toFile(outputPath);
    }
    
    // Generar descripción
    const descripcion = generarNombreDescriptivo(inputPath, tipoServicio);
    
    return {
      nombreArchivo,
      descripcion,
      tipoServicio
    };
    
  } catch (error) {
    console.error(`❌ Error procesando ${nombreBase}:`, error.message);
    stats.errores++;
    return null;
  }
}

/**
 * Procesar recursivamente todas las imágenes en una carpeta
 */
async function procesarCarpeta(carpetaPath, tipoServicio, outputDir) {
  const archivos = fs.readdirSync(carpetaPath, { withFileTypes: true });
  const resultados = [];
  
  for (const archivo of archivos) {
    const archivoPath = path.join(carpetaPath, archivo.name);
    
    if (archivo.isDirectory()) {
      // Procesar subcarpetas recursivamente
      const subResultados = await procesarCarpeta(archivoPath, tipoServicio, outputDir);
      resultados.push(...subResultados);
    } else if (archivo.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(archivo.name)) {
      // Procesar archivo de imagen
      const resultado = await convertirImagen(archivoPath, outputDir, archivo.name, tipoServicio);
      if (resultado) {
        resultados.push(resultado);
        stats.procesadas++;
        if (!stats.tipos[tipoServicio]) {
          stats.tipos[tipoServicio] = 0;
        }
        stats.tipos[tipoServicio]++;
        console.log(`✅ ${tipoServicio}/${archivo.name}`);
      }
    }
  }
  
  return resultados;
}

/**
 * Función principal
 */
async function procesarImagenes() {
  console.log('🚀 Iniciando conversión de imágenes...\n');
  
  // Verificar que existe el directorio de entrada
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Directorio no encontrado: ${INPUT_DIR}`);
    process.exit(1);
  }
  
  const todosLosResultados = [];
  
  // Procesar cada tipo de servicio
  for (const [carpetaOriginal, tipoServicio] of Object.entries(MAPEO_CARPETAS)) {
    const carpetaPath = path.join(INPUT_DIR, carpetaOriginal);
    
    if (!fs.existsSync(carpetaPath)) {
      console.log(`⚠️  Directorio no encontrado: ${carpetaPath}`);
      continue;
    }
    
    const outputDir = path.join(OUTPUT_DIR, tipoServicio);
    console.log(`\n📁 Procesando ${carpetaOriginal} -> ${tipoServicio}...`);
    
    const resultados = await procesarCarpeta(carpetaPath, tipoServicio, outputDir);
    todosLosResultados.push(...resultados);
  }
  
  // Guardar resultados en JSON para el script de inserción
  const resultadosPath = path.join(__dirname, '../imagenes-resultados.json');
  fs.writeFileSync(resultadosPath, JSON.stringify(todosLosResultados, null, 2));
  
  // Mostrar estadísticas
  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTADÍSTICAS:');
  console.log('='.repeat(50));
  console.log(`✅ Imágenes procesadas: ${stats.procesadas}`);
  console.log(`❌ Errores: ${stats.errores}`);
  console.log('\nPor tipo:');
  for (const [tipo, cantidad] of Object.entries(stats.tipos)) {
    console.log(`  - ${tipo}: ${cantidad}`);
  }
  console.log('\n✨ Conversión completada!');
  console.log(`📄 Resultados guardados en: ${resultadosPath}`);
  console.log('\n💡 Siguiente paso: Ejecuta el script de inserción en la base de datos');
}

// Ejecutar
procesarImagenes().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

 * Script para convertir y optimizar imágenes de servicios
 * Convierte imágenes de imagenes-originales a public/fotos/servicios
 * Genera múltiples tamaños: thumbnails, medium, large
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Mapeo de carpetas originales a tipos del sistema
const MAPEO_CARPETAS = {
  'Cakes': 'torta',
  'Bar': 'bar',
  'Comida': 'menu',
  'Decoracion': 'decoracion'
};

const INPUT_DIR = path.join(__dirname, '../imagenes-originales');
const OUTPUT_DIR = path.join(__dirname, '../public/fotos/servicios');

// Tamaños para generar
const SIZES = {
  thumbnails: 300,
  medium: 800,
  large: 1200
};

// Estadísticas
let stats = {
  procesadas: 0,
  errores: 0,
  tipos: {}
};

/**
 * Generar nombre descriptivo desde la ruta del archivo
 */
function generarNombreDescriptivo(filePath, tipoServicio) {
  const relativePath = path.relative(
    path.join(INPUT_DIR, Object.keys(MAPEO_CARPETAS).find(k => MAPEO_CARPETAS[k] === tipoServicio) || ''),
    filePath
  );
  
  // Remover extensión y normalizar
  const nombreSinExt = path.basename(relativePath, path.extname(relativePath));
  const carpeta = path.dirname(relativePath);
  
  // Generar descripción legible
  let descripcion = nombreSinExt
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\./g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Agregar contexto de carpeta si existe
  if (carpeta && carpeta !== '.') {
    const carpetaNombre = carpeta.split(path.sep).pop();
    descripcion = `${carpetaNombre} - ${descripcion}`;
  }
  
  return descripcion;
}

/**
 * Convertir una imagen a múltiples tamaños
 */
async function convertirImagen(inputPath, outputDir, nombreBase, tipoServicio) {
  const extension = path.extname(inputPath);
  const nombreSinExt = path.basename(nombreBase, extension);
  const nombreArchivo = `${nombreSinExt}.webp`;
  
  try {
    // Leer metadata de la imagen original
    const metadata = await sharp(inputPath).metadata();
    
    for (const [sizeName, size] of Object.entries(SIZES)) {
      const outputPath = path.join(outputDir, sizeName, nombreArchivo);
      
      // Crear directorio si no existe
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      // Calcular dimensiones manteniendo aspect ratio
      let width = size;
      let height = size;
      
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (metadata.width > metadata.height) {
          height = Math.round(size / aspectRatio);
        } else {
          width = Math.round(size * aspectRatio);
        }
      }
      
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 85,
          effort: 6 // Mayor esfuerzo = mejor compresión
        })
        .toFile(outputPath);
    }
    
    // Generar descripción
    const descripcion = generarNombreDescriptivo(inputPath, tipoServicio);
    
    return {
      nombreArchivo,
      descripcion,
      tipoServicio
    };
    
  } catch (error) {
    console.error(`❌ Error procesando ${nombreBase}:`, error.message);
    stats.errores++;
    return null;
  }
}

/**
 * Procesar recursivamente todas las imágenes en una carpeta
 */
async function procesarCarpeta(carpetaPath, tipoServicio, outputDir) {
  const archivos = fs.readdirSync(carpetaPath, { withFileTypes: true });
  const resultados = [];
  
  for (const archivo of archivos) {
    const archivoPath = path.join(carpetaPath, archivo.name);
    
    if (archivo.isDirectory()) {
      // Procesar subcarpetas recursivamente
      const subResultados = await procesarCarpeta(archivoPath, tipoServicio, outputDir);
      resultados.push(...subResultados);
    } else if (archivo.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(archivo.name)) {
      // Procesar archivo de imagen
      const resultado = await convertirImagen(archivoPath, outputDir, archivo.name, tipoServicio);
      if (resultado) {
        resultados.push(resultado);
        stats.procesadas++;
        if (!stats.tipos[tipoServicio]) {
          stats.tipos[tipoServicio] = 0;
        }
        stats.tipos[tipoServicio]++;
        console.log(`✅ ${tipoServicio}/${archivo.name}`);
      }
    }
  }
  
  return resultados;
}

/**
 * Función principal
 */
async function procesarImagenes() {
  console.log('🚀 Iniciando conversión de imágenes...\n');
  
  // Verificar que existe el directorio de entrada
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Directorio no encontrado: ${INPUT_DIR}`);
    process.exit(1);
  }
  
  const todosLosResultados = [];
  
  // Procesar cada tipo de servicio
  for (const [carpetaOriginal, tipoServicio] of Object.entries(MAPEO_CARPETAS)) {
    const carpetaPath = path.join(INPUT_DIR, carpetaOriginal);
    
    if (!fs.existsSync(carpetaPath)) {
      console.log(`⚠️  Directorio no encontrado: ${carpetaPath}`);
      continue;
    }
    
    const outputDir = path.join(OUTPUT_DIR, tipoServicio);
    console.log(`\n📁 Procesando ${carpetaOriginal} -> ${tipoServicio}...`);
    
    const resultados = await procesarCarpeta(carpetaPath, tipoServicio, outputDir);
    todosLosResultados.push(...resultados);
  }
  
  // Guardar resultados en JSON para el script de inserción
  const resultadosPath = path.join(__dirname, '../imagenes-resultados.json');
  fs.writeFileSync(resultadosPath, JSON.stringify(todosLosResultados, null, 2));
  
  // Mostrar estadísticas
  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTADÍSTICAS:');
  console.log('='.repeat(50));
  console.log(`✅ Imágenes procesadas: ${stats.procesadas}`);
  console.log(`❌ Errores: ${stats.errores}`);
  console.log('\nPor tipo:');
  for (const [tipo, cantidad] of Object.entries(stats.tipos)) {
    console.log(`  - ${tipo}: ${cantidad}`);
  }
  console.log('\n✨ Conversión completada!');
  console.log(`📄 Resultados guardados en: ${resultadosPath}`);
  console.log('\n💡 Siguiente paso: Ejecuta el script de inserción en la base de datos');
}

// Ejecutar
procesarImagenes().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

 * Script para convertir y optimizar imágenes de servicios
 * Convierte imágenes de imagenes-originales a public/fotos/servicios
 * Genera múltiples tamaños: thumbnails, medium, large
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Mapeo de carpetas originales a tipos del sistema
const MAPEO_CARPETAS = {
  'Cakes': 'torta',
  'Bar': 'bar',
  'Comida': 'menu',
  'Decoracion': 'decoracion'
};

const INPUT_DIR = path.join(__dirname, '../imagenes-originales');
const OUTPUT_DIR = path.join(__dirname, '../public/fotos/servicios');

// Tamaños para generar
const SIZES = {
  thumbnails: 300,
  medium: 800,
  large: 1200
};

// Estadísticas
let stats = {
  procesadas: 0,
  errores: 0,
  tipos: {}
};

/**
 * Generar nombre descriptivo desde la ruta del archivo
 */
function generarNombreDescriptivo(filePath, tipoServicio) {
  const relativePath = path.relative(
    path.join(INPUT_DIR, Object.keys(MAPEO_CARPETAS).find(k => MAPEO_CARPETAS[k] === tipoServicio) || ''),
    filePath
  );
  
  // Remover extensión y normalizar
  const nombreSinExt = path.basename(relativePath, path.extname(relativePath));
  const carpeta = path.dirname(relativePath);
  
  // Generar descripción legible
  let descripcion = nombreSinExt
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\./g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Agregar contexto de carpeta si existe
  if (carpeta && carpeta !== '.') {
    const carpetaNombre = carpeta.split(path.sep).pop();
    descripcion = `${carpetaNombre} - ${descripcion}`;
  }
  
  return descripcion;
}

/**
 * Convertir una imagen a múltiples tamaños
 */
async function convertirImagen(inputPath, outputDir, nombreBase, tipoServicio) {
  const extension = path.extname(inputPath);
  const nombreSinExt = path.basename(nombreBase, extension);
  const nombreArchivo = `${nombreSinExt}.webp`;
  
  try {
    // Leer metadata de la imagen original
    const metadata = await sharp(inputPath).metadata();
    
    for (const [sizeName, size] of Object.entries(SIZES)) {
      const outputPath = path.join(outputDir, sizeName, nombreArchivo);
      
      // Crear directorio si no existe
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      // Calcular dimensiones manteniendo aspect ratio
      let width = size;
      let height = size;
      
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (metadata.width > metadata.height) {
          height = Math.round(size / aspectRatio);
        } else {
          width = Math.round(size * aspectRatio);
        }
      }
      
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 85,
          effort: 6 // Mayor esfuerzo = mejor compresión
        })
        .toFile(outputPath);
    }
    
    // Generar descripción
    const descripcion = generarNombreDescriptivo(inputPath, tipoServicio);
    
    return {
      nombreArchivo,
      descripcion,
      tipoServicio
    };
    
  } catch (error) {
    console.error(`❌ Error procesando ${nombreBase}:`, error.message);
    stats.errores++;
    return null;
  }
}

/**
 * Procesar recursivamente todas las imágenes en una carpeta
 */
async function procesarCarpeta(carpetaPath, tipoServicio, outputDir) {
  const archivos = fs.readdirSync(carpetaPath, { withFileTypes: true });
  const resultados = [];
  
  for (const archivo of archivos) {
    const archivoPath = path.join(carpetaPath, archivo.name);
    
    if (archivo.isDirectory()) {
      // Procesar subcarpetas recursivamente
      const subResultados = await procesarCarpeta(archivoPath, tipoServicio, outputDir);
      resultados.push(...subResultados);
    } else if (archivo.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(archivo.name)) {
      // Procesar archivo de imagen
      const resultado = await convertirImagen(archivoPath, outputDir, archivo.name, tipoServicio);
      if (resultado) {
        resultados.push(resultado);
        stats.procesadas++;
        if (!stats.tipos[tipoServicio]) {
          stats.tipos[tipoServicio] = 0;
        }
        stats.tipos[tipoServicio]++;
        console.log(`✅ ${tipoServicio}/${archivo.name}`);
      }
    }
  }
  
  return resultados;
}

/**
 * Función principal
 */
async function procesarImagenes() {
  console.log('🚀 Iniciando conversión de imágenes...\n');
  
  // Verificar que existe el directorio de entrada
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Directorio no encontrado: ${INPUT_DIR}`);
    process.exit(1);
  }
  
  const todosLosResultados = [];
  
  // Procesar cada tipo de servicio
  for (const [carpetaOriginal, tipoServicio] of Object.entries(MAPEO_CARPETAS)) {
    const carpetaPath = path.join(INPUT_DIR, carpetaOriginal);
    
    if (!fs.existsSync(carpetaPath)) {
      console.log(`⚠️  Directorio no encontrado: ${carpetaPath}`);
      continue;
    }
    
    const outputDir = path.join(OUTPUT_DIR, tipoServicio);
    console.log(`\n📁 Procesando ${carpetaOriginal} -> ${tipoServicio}...`);
    
    const resultados = await procesarCarpeta(carpetaPath, tipoServicio, outputDir);
    todosLosResultados.push(...resultados);
  }
  
  // Guardar resultados en JSON para el script de inserción
  const resultadosPath = path.join(__dirname, '../imagenes-resultados.json');
  fs.writeFileSync(resultadosPath, JSON.stringify(todosLosResultados, null, 2));
  
  // Mostrar estadísticas
  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTADÍSTICAS:');
  console.log('='.repeat(50));
  console.log(`✅ Imágenes procesadas: ${stats.procesadas}`);
  console.log(`❌ Errores: ${stats.errores}`);
  console.log('\nPor tipo:');
  for (const [tipo, cantidad] of Object.entries(stats.tipos)) {
    console.log(`  - ${tipo}: ${cantidad}`);
  }
  console.log('\n✨ Conversión completada!');
  console.log(`📄 Resultados guardados en: ${resultadosPath}`);
  console.log('\n💡 Siguiente paso: Ejecuta el script de inserción en la base de datos');
}

// Ejecutar
procesarImagenes().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});













