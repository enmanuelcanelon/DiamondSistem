/**
 * Utilidad para mapear selecciones del cliente a imágenes correspondientes
 */

/**
 * Obtener imagen de torta según diseño y pisos
 */
export function obtenerImagenTorta(diseno, pisos) {
  if (!diseno) return null;
  
  const disenoLower = diseno.toLowerCase();
  const pisosNum = parseInt(pisos) || 2;
  const carpetaPisos = pisosNum >= 3 ? '3pisos' : '2pisos';
  
  // Mapeo de diseños a nombres de archivo
  // Nota: "channel" puede ser "chanel" (2 pisos) o "channel" (3 pisos)
  const mapeo = {
    'channel': pisosNum >= 3 ? `cake_channel_${pisosNum}pisos.webp` : `cake_chanel_${pisosNum}pisos.webp`,
    'delux': `cake_delux_${pisosNum}pisos.webp`,
    'blanco': `cake_blanco_${pisosNum}pisos.webp`,
    'desnudo': `cake_desnudo_${pisosNum}pisos.webp`,
  };
  
  const nombreArchivo = mapeo[disenoLower];
  if (!nombreArchivo) return null;
  
  return `/fotos/servicios/torta/medium/${nombreArchivo}`;
}

/**
 * Obtener imagen de decoración según tipo y opción
 */
export function obtenerImagenDecoracion(tipo, opcion) {
  if (!tipo || !opcion) return null;
  
  const opcionLower = opcion.toLowerCase();
  
  // Mapeo de tipos de decoración
  const mapeos = {
    'centro_mesa': {
      'flor': 'centrodemesa_flor.webp',
      'rojo': 'centrodemesa_rojo.webp',
      'azul': 'centrodemesa_azul.webp',
      'rosada': 'centrodemesa_rosada.webp',
      'blanco': 'centrodemesa_blanco.webp',
      'arbol': 'centrodemesa_arbol.webp',
      'candelabro': 'centrodemesa_candelabro.webp',
      'cilindro': 'centrodemesa_cilindro.webp',
    },
    'base': {
      'silver': 'base_silver.webp',
      'dorado': 'base_dorado.webp',
      'clear': 'base_clear.webp',
      'arbol': 'base_arbol.webp',
      'candelabro': 'centrodemesa_candelabro.webp', // No existe base_candelabro, usar centro de mesa como referencia
    },
    'challer': {
      'dorado': 'challer_dorado.webp',
      'silver': 'challer_silver.webp',
      'clear': 'challer_clear.webp',
    },
    'aros': {
      'silver': 'aro_silver.webp',
      'dorado': 'aro_dorado.webp',
      'clear': 'aro_clear.webp',
    },
    'runner': {
      'dorado': 'runner_dorado.webp',
      'dorada': 'runner_dorado.webp', // Variante
      'silver': 'runner_silver.webp',
      'morado': 'runner_morado.webp',
      'azul': 'runner_azul.webp',
      'rosado': 'runner_rosado.webp',
      'rosa': 'runner_rosado.webp', // Variante
      'verde': 'runner_verde.webp',
      'rojo': 'runner_rojo.webp',
      'beige': 'runner_beige.webp',
      'negro': 'runner_negro.webp',
      'disco': 'runner_disco.webp',
      'blanco': 'runner_blanco.webp',
      'gatsby': 'runner_gatsby.webp',
    },
    'servilleta': {
      'blanca': 'servilleta_blanca.webp',
      'rosada': 'servilleta_rosada.webp',
      'azul': 'servilleta_azul.webp',
      'beige': 'sevilleta_beige.webp',
      'roja': 'servilleta_roja.webp',
      'verde': 'servilleta_verde.webp',
      'morada': 'servilleta_morada.webp',
      'vinotinto': 'servilleta_vinotinto.webp',
      'negro': 'servilleta_negra.webp',
    },
    'cojin': {
      'blancos': 'cojin_blanco.webp',
      'negros': 'cojin_negro.webp',
    },
  };
  
  const mapeo = mapeos[tipo];
  if (!mapeo) return null;
  
  const nombreArchivo = mapeo[opcionLower];
  if (!nombreArchivo) return null;
  
  return `/fotos/servicios/decoracion/medium/${nombreArchivo}`;
}

/**
 * Obtener imagen de menú según plato o acompañamiento
 */
export function obtenerImagenMenu(tipo, opcion) {
  if (!tipo || !opcion) return null;
  
  const opcionLower = opcion.toLowerCase();
  
  // Mapeo de platos principales
  const mapeos = {
    'plato_principal': {
      'pollo strogonoff con una salsa cremosa y champiñones': 'menu_polloStrongonoff.webp',
      'pollo strogonoff': 'menu_polloStrongonoff.webp',
      'pollo piccata': 'menu_PolloPicata.webp',
      'bistec (palomilla o boliche) en salsa de vino': 'menu_Bistec.webp',
      'bistec': 'menu_Bistec.webp',
      'solomillo de cerdo marinado': 'menu_SolomilloCerdoMarinado.webp',
      'solomillo de cerdo': 'menu_SolomilloCerdoMarinado.webp',
    },
    'acompanamiento': {
      'arroz blanco o amarillo': 'menu_arrozblanco.webp', // Por defecto arroz blanco
      'arroz blanco': 'menu_arrozblanco.webp',
      'arroz amarillo': 'menu_arrozamarillo.webp',
      'puré de patatas o patatas al romero': 'menu_puredepatatas.webp', // Por defecto puré
      'puré de patatas': 'menu_puredepatatas.webp',
      'patatas al romero': 'menu_patatasromero.webp',
      'verduras al vapor': 'menu_verdurasalvapor.webp',
      'plátano maduro': 'menu_platanomaduro.webp',
    },
    'entrada': {
      'ensalada césar': 'menu_ensaladaCesar.webp',
    },
    'pan': {
      'pan y mantequilla': 'menu_panymantequilla.webp',
    },
    'pasta': {
      'alfredo': 'menu_teen_pasta_alfredo.webp',
      'napolitana': 'menu_teen_pasta_napolitana.webp',
    },
    'pasapalos': {
      'tequeños': 'menu_pasapalos_tequenos.webp',
      'bolitas de carne': 'menu_pasapalos_bolasdecarne.webp',
      'salchichas en hojaldre': 'menu_pasapalos_salchichas.webp',
      'tuna tartar': 'menu_pasapalos_tunartartar.webp',
    },
  };
  
  const mapeo = mapeos[tipo];
  if (!mapeo) return null;
  
  // Buscar coincidencia parcial
  for (const [key, archivo] of Object.entries(mapeo)) {
    if (opcionLower.includes(key)) {
      return `/fotos/servicios/menu/medium/${archivo}`;
    }
  }
  
  return null;
}

/**
 * Obtener imagen de bar según tipo de bebida
 */
export function obtenerImagenBar(tipo, bebida) {
  if (!tipo || !bebida) return null;
  
  const bebidaLower = bebida.toLowerCase();
  
  // Mapeo de bebidas
  const mapeos = {
    'vino': {
      'blanco': 'bar_vino_blanco.webp',
      'tinto': 'bar_vino_tinto.webp',
      'chardonnay': 'bar_vino_chardonnay.webp',
    },
    'ron': {
      'ron bacardi blanco': 'bar_ron_bacardi.webp',
      'ron bacardi gold': 'bar_ron_bacardi_gold.webp',
      'bacardi': 'bar_ron_bacardi.webp',
      'bacardi gold': 'bar_ron_bacardi_gold.webp',
      'bacardi blanco': 'bar_ron_bacardi.webp',
      'ron spice': 'bar_ron_bacardi.webp', // Fallback
      'ron blanco': 'bar_ron_bacardi.webp', // Fallback
    },
    'whisky': {
      'whisky black label': 'bar_whisky_black_label.webp',
      'black label': 'bar_whisky_black_label.webp',
      'whisky house': 'bar_whisky_black_label.webp', // Fallback
    },
    'vodka': {
      'vodka': 'bar_vodka.webp',
    },
    'tequila': {
      'tequila': 'bar_tequila.webp',
    },
    'coctel': {
      'piña colada': 'bar_coctele_pinacolada.webp',
      'daiquirí': 'bar_cocteles_daiquiri.webp',
      'shirley temple': 'bar_cocteles_shirley_tempe.webp',
    },
    'refresco': {
      'club soda': 'bar_refrescos_clubsoda.webp',
      'agua tónica': 'bar_refresco_aguatonica.webp',
      'coca cola': 'bar_refresco_cocac.webp',
      'coca cola diet': 'bar_refresco_cokediet.webp',
      'sprite': 'bar_refresco_sprite.webp',
      'sprite diet': 'bar_refresco_spriteZero.webp',
      'fanta naranja': 'bar_refresco_fantaN.webp',
      'fanta': 'bar_refresco_fantaN.webp',
    },
    'jugo': {
      'naranja': 'bar_jugo_naranja.webp',
      'cranberry': 'bar_jugo_crawberry.webp',
    },
    'otro': {
      'granadina': 'bar_granadina.webp',
      'blue curaçao': 'bar_bluecuracao.webp',
    },
    'brindis': {
      'champagne': 'champage.webp',
      'sidra': 'sidra.webp',
    },
  };
  
  const mapeo = mapeos[tipo];
  if (!mapeo) return null;
  
  // Buscar coincidencia parcial
  for (const [key, archivo] of Object.entries(mapeo)) {
    if (bebidaLower.includes(key)) {
      return `/fotos/servicios/bar/medium/${archivo}`;
    }
  }
  
  return null;
}

