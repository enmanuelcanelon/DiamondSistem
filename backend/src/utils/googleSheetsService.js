/**
 * Servicio para sincronizar con Google Sheets
 */

const axios = require('axios');

// ID del Google Sheet
const SPREADSHEET_ID = '1UEvesE2KmDZ6kTEKz4J1cv9Aq09nkNaybkAAwFO1z64';
const GID = '1540381716'; // ID de la pestaña específica

/**
 * Obtener datos del Google Sheet exportando como CSV
 * Nota: El sheet debe estar configurado como "Cualquiera con el enlace puede ver"
 */
async function obtenerDatosGoogleSheet() {
  try {
    // Exportar el Google Sheet como CSV (método más simple y no requiere autenticación)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    
    const response = await axios.get(csvUrl, {
      responseType: 'text',
      timeout: 30000 // 30 segundos timeout
    });
    
    if (!response.data) {
      throw new Error('No se recibieron datos del Google Sheet');
    }
    
    return parsearCSV(response.data);

  } catch (error) {
    console.error('Error al obtener datos de Google Sheets:', error.message);
    throw new Error(`Error al sincronizar con Google Sheets: ${error.message}`);
  }
}

/**
 * Parsear CSV a array de objetos
 */
function parsearCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Primera línea son los headers
  const headers = parsearLineaCSV(lines[0]);
  const datos = [];

  for (let i = 1; i < lines.length; i++) {
    const valores = parsearLineaCSV(lines[i]);
    if (valores.length === 0) continue;

    const objeto = {};
    headers.forEach((header, index) => {
      objeto[header] = valores[index] || '';
    });
    datos.push(objeto);
  }

  return datos;
}

/**
 * Parsear una línea CSV considerando comillas
 */
function parsearLineaCSV(linea) {
  const valores = [];
  let valorActual = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    
    if (char === '"') {
      dentroComillas = !dentroComillas;
    } else if (char === ',' && !dentroComillas) {
      valores.push(valorActual.trim());
      valorActual = '';
    } else {
      valorActual += char;
    }
  }
  
  valores.push(valorActual.trim());
  return valores;
}

/**
 * Procesar cantidad de invitados (puede venir como "30-50", "Diamond", número, etc.)
 */
function procesarCantidadInvitados(valor) {
  if (!valor) return null;
  
  const str = String(valor).trim();
  
  // Si es un número directo
  const numero = parseInt(str);
  if (!isNaN(numero) && numero > 0) {
    return numero;
  }
  
  // Si es un rango como "30-50", tomar el máximo (más conservador)
  const rangoMatch = str.match(/(\d+)\s*-\s*(\d+)/);
  if (rangoMatch) {
    const min = parseInt(rangoMatch[1]);
    const max = parseInt(rangoMatch[2]);
    return max; // Tomar el máximo del rango
  }
  
  // Si contiene un número, extraerlo (último número encontrado)
  const numerosEnTexto = str.match(/\d+/g);
  if (numerosEnTexto && numerosEnTexto.length > 0) {
    // Tomar el último número (por si hay múltiples)
    return parseInt(numerosEnTexto[numerosEnTexto.length - 1]);
  }
  
  // Si es "Diamond", "Kendall", "Doral", "DIAMOND" (error en la columna), retornar null
  const salones = ['diamond', 'kendall', 'doral'];
  if (salones.includes(str.toLowerCase())) {
    return null;
  }
  
  return null;
}

/**
 * Limpiar y normalizar el salón
 */
function procesarSalon(valor) {
  if (!valor) return null;
  
  const str = String(valor).trim();
  if (!str || str === '' || str === '​' || str === '\u200b') return null; // Caracteres especiales vacíos
  
  // Normalizar nombres (case-insensitive)
  const salones = {
    'diamond': 'Diamond',
    'kendall': 'Kendall',
    'doral': 'Doral',
    'dmd': 'Diamond', // Abreviación común
    'rps': 'Doral' // Abreviación común
  };
  
  const normalizado = str.toLowerCase().trim();
  
  // Si coincide exactamente con un salón conocido, retornarlo normalizado
  if (salones[normalizado]) {
    return salones[normalizado];
  }
  
  // Si contiene el nombre de un salón, extraerlo
  for (const [key, value] of Object.entries(salones)) {
    if (normalizado.includes(key)) {
      return value;
    }
  }
  
  // Si no coincide, retornar el valor original (puede ser un nombre personalizado)
  return str;
}

module.exports = {
  obtenerDatosGoogleSheet,
  procesarCantidadInvitados,
  procesarSalon,
  SPREADSHEET_ID
};



