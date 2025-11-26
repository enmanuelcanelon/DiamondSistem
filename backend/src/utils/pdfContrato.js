const PDFDocument = require('pdfkit');

// ============================================
// CONFIGURACIÓN VISUAL - PROFESIONAL Y LEGAL
// ============================================

const CONFIG_VISUAL = {
  // COLORES (Diseño profesional y serio)
  colores: {
    primario: '#000000',        // Negro para títulos principales
    secundario: '#333333',      // Gris oscuro para subtítulos
    texto: '#000000',           // Negro para texto principal
    textoClaro: '#FFFFFF',      // Blanco para texto sobre fondos oscuros
    exito: '#1F5F1F',           // Verde oscuro para estados positivos
    advertencia: '#8B4513',     // Marrón para alertas
    error: '#8B0000',           // Rojo oscuro para errores
    fondoClaro: '#FAFAFA',      // Fondo muy claro
    fondoOscuro: '#1A1A1A',     // Fondo oscuro para encabezados
    borde: '#000000',           // Bordes negros sólidos
    bordeClaro: '#CCCCCC',      // Bordes claros para separadores
  },

  // FUENTES (Profesionales)
  fuentes: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  },

  // TAMAÑOS DE FUENTE (Aumentados)
  tamanosTexto: {
    titulo: 24,                 // Título principal
    subtituloGrande: 18,        // Subtítulo de documento
    subtituloMedio: 14,         // Subtítulo en portada
    seccion: 12,                // Títulos de secciones
    subseccion: 11,             // Subtítulos de secciones
    subseccionPequena: 10,      // Subtítulos pequeños
    normal: 10,                 // Texto normal
    pequeno: 9,                 // Texto pequeño
    muyPequeno: 8,              // Pie de página, notas
  },

  // MÁRGENES Y ESPACIADO (Compactados)
  layout: {
    margenSuperior: 40,
    margenInferior: 40,
    margenIzquierdo: 40,
    margenDerecho: 40,
    anchoUtil: 532,             // 612 - 40 - 40 = 532
    alturaEncabezado: 90,
    alturaEncabezadoPagina: 35,
    alturaPiePagina: 50,
    espaciadoSeccion: 0.8,
    espaciadoParrafo: 0.3,
    bordeRedondeado: 0,         // Sin bordes redondeados (más profesional)
  },

  // ALTURAS DE ELEMENTOS (Compactados)
  alturas: {
    filaTabla: 14,
    encabezadoTabla: 18,
    cajaInfoContrato: 110,
    cajaEvento: 85,
    cajaFinanzas: 75,
    cajaPaquete: 50,
    cajaFirma: 120,
  },
};

// ============================================
// FUNCIONES AUXILIARES REUTILIZABLES
// ============================================

/**
 * Dibuja el patrón de fondo decorativo sutil
 */
function dibujarPatronFondo(doc) {
  const fondoBlanco = '#FFFFFF';
  const colorLinea = '#F0F0F0';
  const grosorLinea = 0.2;
  
  // Fondo blanco
  doc.rect(0, 0, 612, 792)
    .fillAndStroke(fondoBlanco, fondoBlanco);
  
  // Guardar el estado actual
  doc.save();
  
  // Configurar el estilo de línea muy sutil
  doc.strokeColor(colorLinea)
    .lineWidth(grosorLinea);
  
  // Dibujar patrón de líneas muy sutiles
  const paso = 30;
  
  for (let y = 0; y < 792; y += paso) {
    doc.moveTo(0, y)
      .lineTo(612, y)
      .stroke();
  }
  
  for (let x = 0; x < 612; x += paso) {
    doc.moveTo(x, 0)
      .lineTo(x, 792)
      .stroke();
  }
  
  // Restaurar el estado
  doc.restore();
}

/**
 * Obtiene la dirección del salón basado en el nombre
 */
function obtenerDireccionSalon(nombreSalon) {
  const direcciones = {
    'Doral': '4747 NW 79th Ave, Doral, FL 33166',
    'Kendall': '14271 Southwest 120th Street, Kendall, Miami, FL 33186',
    'Salón Doral': '8726 NW 26th St, Doral, FL 33172',
    'Salón kendall': '14271 Southwest 120th Street, Kendall, Miami, FL 33186',
    'Salón Diamond': '4747 NW 79th Ave, Doral, FL 33166',
  };
  
  if (!nombreSalon) return 'Dirección no especificada';
  
  for (const [key, value] of Object.entries(direcciones)) {
    if (nombreSalon.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return nombreSalon;
}

/**
 * Dibuja el encabezado principal del documento (página 1)
 */
function dibujarEncabezadoPrincipal(doc, config, contrato) {
  const { colores, tamanosTexto, fuentes, layout } = config;
  const { alturaEncabezado } = layout;

  // Fondo del encabezado (negro sólido)
  doc.rect(0, 0, 612, alturaEncabezado)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  // Título principal
  doc.fontSize(tamanosTexto.titulo)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('DIAMOND VENUE AT DORAL', { align: 'center', y: 15 });

  // Subtítulo de la empresa
  doc.fontSize(tamanosTexto.muyPequeno)
    .font(fuentes.normal)
    .text('SERVICIOS PROFESIONALES PARA EVENTOS', { align: 'center', y: 40 })
    .moveDown(0.1);

  // Información legal de la empresa
  doc.fontSize(tamanosTexto.muyPequeno)
    .text('4747 NW 79th Ave, Doral, FL 33166', { align: 'center', y: 55 })
    .text('Tel: +1 (786) 332-7065  |  Email: diamondvenueatdoral@gmail.com', { align: 'center', y: 68 })
    .text('Licencia de Negocio: [Número de Licencia]  |  Estado de Florida, USA', { align: 'center', y: 81 });

  doc.y = alturaEncabezado + 10;
}

/**
 * Dibuja un encabezado pequeño para páginas internas
 */
function dibujarEncabezadoPagina(doc, codigoContrato, config) {
  const { colores, tamanosTexto, fuentes, layout } = config;

  doc.strokeColor(colores.borde)
    .lineWidth(1)
    .moveTo(50, layout.alturaEncabezadoPagina - 1)
    .lineTo(562, layout.alturaEncabezadoPagina - 1)
    .stroke();

  doc.fontSize(tamanosTexto.muyPequeno)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('DIAMOND VENUE AT DORAL', 50, 8);

  doc.fontSize(tamanosTexto.muyPequeno)
    .fillColor(colores.secundario)
    .font(fuentes.normal)
    .text(`Contrato No. ${codigoContrato}`, 50, 20);


  doc.y = layout.alturaEncabezadoPagina + 8;
}

/**
 * Dibuja el título del tipo de documento
 */
function dibujarTituloDocumento(doc, titulo, subtitulo, config) {
  const { colores, tamanosTexto, fuentes, layout } = config;

  doc.fontSize(tamanosTexto.subtituloGrande)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(titulo, { align: 'center' })
    .moveDown(0.3);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.secundario)
    .font(fuentes.italic)
    .text(subtitulo, { align: 'center' })
    .moveDown(layout.espaciadoSeccion);
}

/**
 * Dibuja una caja de información con borde
 */
function dibujarCajaInfo(doc, x, y, ancho, alto, config, colorFondo = null, colorBorde = null) {
  const { colores, layout } = config;
  const fondo = colorFondo || colores.fondoClaro;
  const borde = colorBorde || colores.borde;

  doc.rect(x, y, ancho, alto)
    .fillAndStroke(fondo, borde);
}

/**
 * Dibuja una fila de etiqueta-valor
 */
function dibujarFilaEtiquetaValor(doc, x, y, etiqueta, valor, config, colorValor = null, anchoValor = 360) {
  const { colores, tamanosTexto, fuentes } = config;

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text(etiqueta, x, y);

  if (valor) {
    doc.font(fuentes.normal)
      .fillColor(colorValor || colores.texto)
      .text(valor, x + 120, y, { width: anchoValor });
  }
}

/**
 * Dibuja el encabezado de una tabla
 */
function dibujarEncabezadoTabla(doc, y, columnas, config) {
  const { colores, tamanosTexto, fuentes, alturas } = config;
  const { encabezadoTabla } = alturas;

  doc.rect(40, y, config.layout.anchoUtil, encabezadoTabla)
    .fillAndStroke(colores.fondoOscuro, colores.borde);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold);

  columnas.forEach(col => {
    doc.text(col.texto, col.x, y + 5, { width: col.ancho, align: col.alineacion || 'left' });
  });

  return y + encabezadoTabla;
}

/**
 * Dibuja una fila de tabla
 */
function dibujarFilaTabla(doc, y, columnas, indice, config) {
  const { colores, tamanosTexto, fuentes, alturas, layout } = config;
  const { filaTabla } = alturas;
  const colorFondo = indice % 2 === 0 ? '#FFFFFF' : colores.fondoClaro;

  doc.rect(40, y, layout.anchoUtil, filaTabla)
    .fillAndStroke(colorFondo, colores.bordeClaro);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal);

  columnas.forEach(col => {
    doc.text(col.texto, col.x, y + 3, { width: col.ancho, align: col.alineacion || 'left' });
  });

  return y + filaTabla;
}

/**
 * Dibuja el pie de página
 */
function dibujarPiePagina(doc, config, textoAdicional = '') {
  const { colores, tamanosTexto, fuentes, layout } = config;
  const yFooter = doc.page.height - layout.alturaPiePagina;

  doc.strokeColor(colores.bordeClaro)
    .lineWidth(0.5)
    .moveTo(40, yFooter)
    .lineTo(572, yFooter)
    .stroke();


}

/**
 * Dibuja un título de sección
 */
function dibujarTituloSeccion(doc, titulo, config) {
  const { colores, tamanosTexto, fuentes, layout } = config;
  
  doc.fontSize(tamanosTexto.seccion)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(titulo.toUpperCase())
    .moveDown(0.1);
  
  // Línea debajo del título
  doc.strokeColor(colores.borde)
    .lineWidth(0.5)
    .moveTo(40, doc.y - 2)
    .lineTo(572, doc.y - 2)
    .stroke();
    
  doc.moveDown(0.3);
}

/**
 * Organiza servicios por categoría (similar a pdfFacturaHTML)
 */
function organizarServiciosPorCategoria(contrato) {
  const serviciosPaquete = contrato.paquetes?.paquetes_servicios || [];

  const todosServicios = serviciosPaquete.map(ps => ({
    ...ps.servicios,
    categoria: ps.servicios?.categoria,
    esPaquete: true,
    descripcion: ps.servicios?.descripcion || ps.servicios?.nombre,
    cantidad: ps.cantidad || 1
  }));

  const organizados = {
    venue: [],
    cake: [],
    decoration: [],
    specials: [],
    barService: [],
    catering: [],
    serviceCoord: []
  };

  todosServicios.forEach(servicio => {
    const categoria = servicio.categoria?.toLowerCase() || '';
    const nombre = servicio.nombre?.toLowerCase() || '';

    if (nombre.includes('cake') || nombre.includes('torta')) {
      organizados.cake.push(servicio);
    } else if (categoria.includes('decoración') || categoria.includes('decoration') || nombre.includes('decoración') || nombre.includes('decoration')) {
      organizados.decoration.push(servicio);
    } else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor') || nombre.includes('bar') || nombre.includes('bebida')) {
      organizados.barService.push(servicio);
    } else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food') || nombre.includes('comida') || nombre.includes('catering')) {
      organizados.catering.push(servicio);
    } else if (categoria.includes('fotografía') || categoria.includes('video') || categoria.includes('equipo') || categoria.includes('photobooth') || categoria.includes('hora loca') || nombre.includes('photobooth') || nombre.includes('foto')) {
      organizados.specials.push(servicio);
    } else if (categoria.includes('coordinación') || categoria.includes('coordinador') || categoria.includes('mesero') || categoria.includes('bartender') || nombre.includes('coordinador') || nombre.includes('mesero')) {
      organizados.serviceCoord.push(servicio);
    } else if (categoria.includes('venue') || nombre.includes('venue') || nombre.includes('salón')) {
      organizados.venue.push(servicio);
    } else {
      organizados.specials.push(servicio);
    }
  });

  return organizados;
}

/**
 * Organiza servicios adicionales por categoría
 * Solo incluye servicios que NO están en el paquete
 */
function organizarServiciosAdicionalesPorCategoria(contrato) {
  // Obtener IDs de servicios que están en el paquete
  const serviciosPaqueteIds = new Set();
  if (contrato.paquetes?.paquetes_servicios) {
    contrato.paquetes.paquetes_servicios.forEach(ps => {
      if (ps.servicios?.id) {
        serviciosPaqueteIds.add(ps.servicios.id);
      }
    });
  }

  // Filtrar servicios adicionales para excluir los que están en el paquete
  const serviciosAdicionales = (contrato.contratos_servicios || []).filter(cs => {
    const servicioId = cs.servicios?.id || cs.servicio_id;
    return servicioId && !serviciosPaqueteIds.has(servicioId);
  });

  const todosServicios = serviciosAdicionales.map(cs => {
    const servicio = cs.servicios || {};
    return {
      ...servicio,
      id: servicio.id || cs.servicio_id,
      categoria: servicio.categoria,
      esPaquete: false,
      descripcion: servicio.descripcion || servicio.nombre,
      cantidad: cs.cantidad || 1,
      precio_unitario: parseFloat(cs.precio_unitario || 0),
      subtotal: parseFloat(cs.subtotal || cs.precio_unitario * (cs.cantidad || 1))
    };
  });

  const organizados = {
    venue: [],
    cake: [],
    decoration: [],
    specials: [],
    barService: [],
    catering: [],
    serviceCoord: []
  };

  // Procesar servicios adicionales

  todosServicios.forEach(servicio => {
    const categoria = (servicio.categoria || '').toLowerCase();
    const nombre = (servicio.nombre || '').toLowerCase();
    
    // Normalizar nombre: remover paréntesis y caracteres especiales para mejor matching
    const nombreNormalizado = nombre.replace(/[()]/g, '').trim();

    // CAKE
    if (nombre.includes('cake') || nombre.includes('torta')) {
      organizados.cake.push(servicio);
    }
    // DECORATION
    else if (categoria.includes('decoración') || categoria.includes('decoration') || nombre.includes('decoración') || nombre.includes('decoration')) {
      organizados.decoration.push(servicio);
    }
    // BAR SERVICE
    else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor') || 
             nombre.includes('bar') || nombre.includes('bebida') || nombre.includes('champaña') || 
             nombre.includes('champagne') || nombre.includes('champagne')) {
      organizados.barService.push(servicio);
    }
    // CATERING
    else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food') || 
             nombre.includes('comida') || nombre.includes('catering') || nombre.includes('pasapalos') || 
             nombre.includes('dulces') || nombre.includes('mini dulces') || nombre.includes('pasapalo')) {
      organizados.catering.push(servicio);
    }
    // SPECIALS - Incluye fotografía, video, photobooth, hora extra, animador, maestro de ceremonia
    else if (categoria.includes('fotografía') || categoria.includes('fotografia') || categoria.includes('video') || 
             categoria.includes('equipo') || categoria.includes('photobooth') || categoria.includes('hora loca') || 
             categoria.includes('hora extra') || categoria.includes('animación') || categoria.includes('animacion') ||
             nombre.includes('photobooth') || nombreNormalizado.includes('photobooth') || nombre.includes('print') || 
             nombreNormalizado.includes('print') || nombre.includes('foto') || nombre.includes('video') || 
             nombre.includes('hora extra') || nombreNormalizado.includes('hora extra') || nombre.includes('hora loca') || 
             nombreNormalizado.includes('hora loca') || nombre.includes('animador') || nombre.includes('maestro') || 
             nombre.includes('ceremonia') || nombre.includes('mc') || nombre.includes('fotografia') || 
             nombre.includes('fotografo')) {
      organizados.specials.push(servicio);
    }
    // SERVICE COORD
    else if (categoria.includes('coordinación') || categoria.includes('coordinacion') || categoria.includes('coordinador') || 
             categoria.includes('mesero') || categoria.includes('bartender') || 
             nombre.includes('coordinador') || nombre.includes('mesero') || nombre.includes('bartender')) {
      organizados.serviceCoord.push(servicio);
    }
    // VENUE
    else if (categoria.includes('venue') || nombre.includes('venue') || nombre.includes('salón') || nombre.includes('salon')) {
      organizados.venue.push(servicio);
    }
    // Por defecto, todos los servicios no categorizados van a specials
    else {
      organizados.specials.push(servicio);
    }
  });

  return organizados;
}

// ============================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN
// ============================================

/**
 * Genera un PDF completo del contrato con términos y condiciones
 * @param {Object} contrato - Datos del contrato con relaciones
 * @returns {PDFDocument} - Documento PDF
 */
function generarPDFContrato(contrato) {
  const config = CONFIG_VISUAL;
  const { colores, tamanosTexto, fuentes, layout, alturas } = config;

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: layout.margenSuperior,
      bottom: layout.margenInferior,
      left: layout.margenIzquierdo,
      right: layout.margenDerecho
    }
  });

  // Función helper para agregar página con patrón de fondo
  const agregarPaginaConFondo = () => {
    doc.addPage();
    dibujarPatronFondo(doc);
  };

  // ============================================
  // PÁGINA 1: INFORMACIÓN DEL EVENTO Y DATOS DEL CLIENTE
  // ============================================
  
  dibujarPatronFondo(doc);
  dibujarEncabezadoPrincipal(doc, config, contrato);
  dibujarTituloDocumento(
    doc,
    'CONTRATO DE SERVICIOS PARA EVENTOS',
    'Documento Legal Vinculante',
    config
  );

  // Información del evento (estilo ofertas)
  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('INFORMACIÓN DEL EVENTO', 40)
    .moveDown(0.4);

  const tipoEvento = contrato.clientes?.tipo_evento || 'Evento';
  const lugarEvento = contrato.lugar_salon || contrato.ofertas?.lugar_evento || 'Por definir';
  const direccionSalon = obtenerDireccionSalon(lugarEvento);
  const cantidadInvitados = contrato.cantidad_invitados || 0;
  const horaInicio = contrato.hora_inicio instanceof Date 
    ? contrato.hora_inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : (contrato.hora_inicio || 'Por definir');
  const horaFin = contrato.hora_fin instanceof Date
    ? contrato.hora_fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : (contrato.hora_fin || 'Por definir');
  const horario = `${horaInicio} - ${horaFin}`;

  // Tabla de información (estilo ofertas)
  const infoRows = [
    { label: 'Número de Contrato', value: contrato.codigo_contrato },
    { label: 'Contratante', value: contrato.clientes?.nombre_completo || 'N/A' },
    { label: 'Correo Electrónico', value: contrato.clientes?.email || 'N/A' },
    { label: 'Teléfono de Contacto', value: contrato.clientes?.telefono || 'N/A' },
    { label: 'Representante de Ventas', value: `${contrato.vendedores?.nombre_completo || 'N/A'} (${contrato.vendedores?.codigo_vendedor || 'N/A'})` },
    { label: 'Fecha del Evento', value: new Date(contrato.fecha_evento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) },
    { label: 'Tipo de Evento', value: tipoEvento },
    ...(contrato.homenajeado ? [{ label: 'Homenajeado/a', value: contrato.homenajeado }] : []),
    { label: 'Horario', value: horario },
    { label: 'Número de Invitados', value: `${cantidadInvitados} personas` },
    { label: 'Ubicación', value: `${lugarEvento}\n${direccionSalon}` }
  ];

  infoRows.forEach((row, index) => {
    const yPos = doc.y;
    doc.fontSize(tamanosTexto.pequeno)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text(row.label + ':', 50, yPos, { width: 200 });
    
    doc.fontSize(tamanosTexto.pequeno)
      .fillColor(colores.texto)
      .font(fuentes.normal)
      .text(row.value, 260, yPos, { width: 312 });
    
    doc.moveDown(0.4);
  });

  // PIE DE PÁGINA
  dibujarPiePagina(doc, config);

  // ============================================
  // PÁGINA 2: PAQUETE CONTRATADO
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('PAQUETE CONTRATADO', { align: 'center' })
    .moveDown(0.3);

  const nombrePaquete = contrato.paquetes?.nombre || 'No especificado';

  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(nombrePaquete, { align: 'center' })
    .moveDown(0.3);

  // Servicios incluidos en el paquete (Página 2)
  if (contrato.paquetes?.paquetes_servicios && contrato.paquetes.paquetes_servicios.length > 0) {
    doc.fontSize(tamanosTexto.seccion)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('SERVICIOS INCLUIDOS EN EL PAQUETE', { align: 'center' })
      .moveDown(0.3);

    // Organizar servicios por categoría
    const serviciosOrganizados = organizarServiciosPorCategoria(contrato);
    
    const categorias = [
      { key: 'venue', titulo: 'VENUE' },
      { key: 'cake', titulo: 'CAKE' },
      { key: 'decoration', titulo: 'DECORATION' },
      { key: 'specials', titulo: 'SPECIALS' },
      { key: 'barService', titulo: 'BAR SERVICE' },
      { key: 'catering', titulo: 'CATERING' },
      { key: 'serviceCoord', titulo: 'SERVICE COORD & DESIGN' }
    ];

    categorias.forEach((cat, catIndex) => {
      const servicios = serviciosOrganizados[cat.key] || [];
      
      if (servicios.length > 0) {
        // Verificar si hay espacio suficiente en la página antes de agregar nueva categoría
        // Altura aproximada: título (20) + línea (5) + servicios (15 cada uno) + espaciado (10)
        const alturaNecesaria = 35 + (servicios.length * 15);
        const alturaDisponible = doc.page.height - doc.y - layout.margenInferior - 50; // 50 para pie de página
        
        if (alturaDisponible < alturaNecesaria && catIndex > 0) {
          // Si no hay espacio, agregar nueva página
          agregarPaginaConFondo();
          dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);
        }
        
        // Título de categoría (compacto)
        doc.fontSize(tamanosTexto.subseccionPequena)
          .fillColor(colores.primario)
          .font(fuentes.bold)
          .text(cat.titulo, 50)
          .moveDown(0.1);

        // Línea debajo del título (sutil)
        doc.strokeColor(colores.bordeClaro)
          .lineWidth(0.5)
          .moveTo(50, doc.y - 2)
          .lineTo(562, doc.y - 2)
          .stroke();

        doc.moveDown(0.1);

        // Listar servicios de esta categoría (más compacto)
        servicios.forEach((servicio, index) => {
          const nombreServicio = servicio.servicios?.nombre || servicio.nombre || 'No especificado';
          const descripcion = servicio.servicios?.descripcion || servicio.descripcion || '';
          const cantidad = servicio.cantidad || servicio.servicios?.cantidad || 1;
          
          // Formato más compacto: solo nombre si no hay descripción, o nombre: descripción corta
          let textoServicio;
          if (descripcion && descripcion.length > 80) {
            // Truncar descripción si es muy larga
            textoServicio = `${nombreServicio}: ${descripcion.substring(0, 80)}...${cantidad > 1 ? ` (x${cantidad})` : ''}`;
          } else {
            textoServicio = descripcion 
              ? `${nombreServicio}: ${descripcion}${cantidad > 1 ? ` (x${cantidad})` : ''}`
              : `${nombreServicio}${cantidad > 1 ? ` (x${cantidad})` : ''}`;
          }

          doc.fontSize(tamanosTexto.muyPequeno)
            .fillColor(colores.texto)
            .font(fuentes.normal)
            .text('•', 60, doc.y)
            .text(textoServicio, 70, doc.y, { width: 490, align: 'left', lineGap: 1 });
          
          doc.moveDown(0.1);
        });

        doc.moveDown(0.15);
      }
    });
  }

  // PIE DE PÁGINA PÁGINA 2
  dibujarPiePagina(doc, config);

  // ============================================
  // PÁGINA 3: SERVICIOS ADICIONALES
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  if (contrato.contratos_servicios && contrato.contratos_servicios.length > 0) {
    doc.fontSize(tamanosTexto.subtituloMedio)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('SERVICIOS ADICIONALES EXTRAS', { align: 'center' })
      .moveDown(0.5);

    // Organizar servicios adicionales por categoría
    const serviciosAdicionalesOrganizados = organizarServiciosAdicionalesPorCategoria(contrato);
    
    const categorias = [
      { key: 'venue', titulo: 'VENUE' },
      { key: 'cake', titulo: 'CAKE' },
      { key: 'decoration', titulo: 'DECORATION' },
      { key: 'specials', titulo: 'SPECIALS' },
      { key: 'barService', titulo: 'BAR SERVICE' },
      { key: 'catering', titulo: 'CATERING' },
      { key: 'serviceCoord', titulo: 'SERVICE COORD & DESIGN' }
    ];

    let totalServiciosAdicionales = 0;

    categorias.forEach((cat) => {
      const servicios = serviciosAdicionalesOrganizados[cat.key] || [];
      
      if (servicios.length > 0) {
        // Título de categoría (compacto)
        doc.fontSize(tamanosTexto.subseccion)
          .fillColor(colores.primario)
          .font(fuentes.bold)
          .text(cat.titulo, 50)
          .moveDown(0.15);

        // Línea debajo del título (sutil)
        doc.strokeColor(colores.bordeClaro)
          .lineWidth(0.5)
          .moveTo(50, doc.y - 2)
          .lineTo(562, doc.y - 2)
          .stroke();

        doc.moveDown(0.15);

        // Listar servicios de esta categoría (compacto, sin cajas)
        servicios.forEach((servicio) => {
          // El servicio ya viene mapeado directamente, no necesita .servicios
          const nombreServicio = servicio.nombre || 'Servicio';
          const cantidad = servicio.cantidad || 1;
          const precioUnitario = parseFloat(servicio.precio_unitario || 0);
          const subtotal = parseFloat(servicio.subtotal || precioUnitario * cantidad);
          totalServiciosAdicionales += subtotal;

          const textoServicio = `${nombreServicio}${cantidad > 1 ? ` (x${cantidad})` : ''} - $${precioUnitario.toFixed(2)} c/u = $${subtotal.toFixed(2)}`;

          doc.fontSize(tamanosTexto.normal)
            .fillColor(colores.texto)
            .font(fuentes.normal)
            .text('•', 60, doc.y)
            .text(textoServicio, 70, doc.y, { width: 490, align: 'left' });
          
          doc.moveDown(0.2);
        });

        doc.moveDown(0.2);
      }
    });

    // Total de servicios adicionales (compacto, sin caja)
    if (totalServiciosAdicionales > 0) {
      doc.moveDown(0.3);
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.primario)
        .font(fuentes.bold)
        .text(`Total Servicios Adicionales: $${totalServiciosAdicionales.toFixed(2)}`, { align: 'center' });
    }
  } else {
    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.texto)
      .font(fuentes.normal)
      .text('No hay servicios adicionales contratados.', { align: 'center' });
  }

  // PIE DE PÁGINA PÁGINA 3
  dibujarPiePagina(doc, config);

  // ============================================
  // PÁGINA 4: PAGOS
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  // DESGLOSE DE INVERSIÓN
  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('DESGLOSE DE INVERSIÓN', { align: 'center' })
    .moveDown(0.5);

  // Obtener datos del desglose desde la oferta relacionada
  const oferta = contrato.ofertas;
  if (oferta) {
    const precioPaquete = parseFloat(oferta.precio_paquete_base || oferta.precio_base_ajustado || contrato.paquetes?.precio_base || 0);
    const ajusteTemporada = parseFloat(oferta.ajuste_temporada_custom || oferta.ajuste_temporada || 0);
    const subtotalServicios = parseFloat(oferta.subtotal_servicios || 0);
    const descuento = parseFloat(oferta.descuento || 0);
    const impuestoPorcentaje = parseFloat(oferta.impuesto_porcentaje || 7);
    const impuestoMonto = parseFloat(oferta.impuesto_monto || 0);
    const tarifaServicioPorcentaje = parseFloat(oferta.tarifa_servicio_porcentaje || 18);
    const tarifaServicioMonto = parseFloat(oferta.tarifa_servicio_monto || 0);
    const totalFinal = parseFloat(oferta.total_final || contrato.total_contrato || 0);

    // Calcular subtotal antes de impuestos
    const subtotalBase = precioPaquete + ajusteTemporada + subtotalServicios - descuento;

    // Tabla de desglose
    const desgloseRows = [
      { label: 'Precio del Paquete', value: precioPaquete },
      ...(ajusteTemporada !== 0 ? [{ label: 'Ajuste de Temporada', value: ajusteTemporada }] : []),
      ...(subtotalServicios > 0 ? [{ label: 'Servicios Adicionales/Extras', value: subtotalServicios }] : []),
      ...(descuento > 0 ? [{ label: 'Descuento', value: -descuento }] : []),
      { label: 'Subtotal', value: subtotalBase },
      { label: `Impuesto (${impuestoPorcentaje}%)`, value: impuestoMonto },
      { label: `Tarifa de Servicio (${tarifaServicioPorcentaje}%)`, value: tarifaServicioMonto },
      { label: 'TOTAL A PAGAR', value: totalFinal, isTotal: true }
    ];

    desgloseRows.forEach((row, index) => {
      const yPos = doc.y;
      const isTotal = row.isTotal || false;
      
      doc.fontSize(isTotal ? tamanosTexto.seccion : tamanosTexto.normal)
        .fillColor(isTotal ? colores.primario : colores.texto)
        .font(fuentes.bold)
        .text(row.label + ':', 50, yPos, { width: 350 });
      
      const valorFormateado = `$${Math.abs(row.value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.fontSize(isTotal ? tamanosTexto.seccion : tamanosTexto.normal)
        .fillColor(isTotal ? colores.primario : colores.texto)
        .font(fuentes.bold)
        .text(valorFormateado, 400, yPos, { width: 132, align: 'right' });
      
      doc.moveDown(0.4);
    });
  } else {
    // Si no hay oferta, mostrar solo el total del contrato
    const totalContrato = parseFloat(contrato.total_contrato || 0);
    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.texto)
      .font(fuentes.normal)
      .text('Total del Contrato:', 50)
      .text(`$${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 400, doc.y - 14, { width: 132, align: 'right' });
  }

  doc.moveDown(0.8);

  // RESUMEN FINANCIERO
  const totalContrato = parseFloat(contrato.total_contrato || 0);
  const totalPagado = parseFloat(contrato.total_pagado || 0);
  const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);

  doc.strokeColor(colores.borde)
    .lineWidth(1.5)
    .moveTo(40, doc.y)
    .lineTo(572, doc.y)
    .stroke();
  
  doc.moveDown(0.5);
  
  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('RESUMEN FINANCIERO', { align: 'center' })
    .moveDown(0.4);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.texto)
    .font(fuentes.normal)
    .text(`Total del Contrato: $${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, { align: 'center' })
    .text(`Total Pagado: $${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, { align: 'center' })
    .text(`Saldo Pendiente: $${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, { align: 'center' })
    .moveDown(0.8);

  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('ACUERDO DE PAGO', { align: 'center' })
    .moveDown(0.5);

  if (contrato.tipo_pago === 'unico') {
    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.texto)
      .font(fuentes.bold)
      .text('Modalidad: PAGO ÚNICO', 50)
      .moveDown(0.3);

    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.texto)
      .font(fuentes.normal)
      .text('El pago total debe realizarse de una sola vez antes del evento. El pago completo debe estar liquidado al menos diez (10) días hábiles antes de la fecha del evento.', 50, undefined, { align: 'justify', width: 512 })
      .moveDown(0.5);

  } else if (contrato.plan_pagos && (contrato.tipo_pago === 'plazos' || contrato.tipo_pago === 'financiado')) {
    const plan = typeof contrato.plan_pagos === 'string' 
      ? JSON.parse(contrato.plan_pagos) 
      : contrato.plan_pagos;

    if (!plan) {
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.normal)
        .text('Modalidad de Pago: Plan de Pagos (Detalles no disponibles)', 50);
      doc.moveDown(0.5);
    } else {
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.bold)
        .text(`Modalidad: FINANCIAMIENTO EN ${contrato.meses_financiamiento || plan.pagos?.length || 'N/A'} CUOTAS`, 50)
        .moveDown(0.4);

      // PAGOS INICIALES
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.primario)
        .font(fuentes.bold)
        .text('PAGOS INICIALES:', 50)
        .moveDown(0.2);

      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.normal);

      // Depósito de reserva
      if (plan.depositoReserva) {
        doc.text(`• Depósito de Reserva: $${plan.depositoReserva.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (No reembolsable)`, 60)
          .moveDown(0.2);
      }

      // Segundo pago
      const segundoPago = plan.segundoPago || plan.pagoInicial || 0;
      if (segundoPago > 0) {
        doc.text(`• Segundo Pago: $${segundoPago.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (10 días después de la reserva)`, 60)
          .moveDown(0.3);
      }

    // CUOTAS MENSUALES
    if (plan.pagos && plan.pagos.length > 0) {
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.primario)
        .font(fuentes.bold)
        .text('CUOTAS MENSUALES:', 50)
        .moveDown(0.2);

      plan.pagos.forEach((pago, index) => {
        const fechaVencimiento = pago.fechaVencimiento 
          ? new Date(pago.fechaVencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : 'Por definir';
        const metodo = pago.metodo || 'Efectivo/Zelle';

        doc.fontSize(tamanosTexto.normal)
          .fillColor(colores.texto)
          .font(fuentes.normal)
          .text(`• Cuota #${index + 1}: $${pago.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} - Fecha: ${fechaVencimiento} - Método: ${metodo}`, 60);
        
        doc.moveDown(0.15);
      });

      doc.moveDown(0.3);
    }

      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.advertencia)
        .font(fuentes.bold)
        .text('IMPORTANTE: ', 50, undefined, { continued: true })
        .font(fuentes.normal)
        .text('El pago completo debe estar liquidado al menos diez (10) días hábiles antes del evento. Todos los pagos son no reembolsables.', 50, undefined, { width: 512, align: 'justify' });

      doc.moveDown(0.4);
    }
  }

  // SECCIÓN 8: PAGOS REALIZADOS (Compacto, lista simple)
  if (contrato.pagos && contrato.pagos.length > 0) {
    doc.moveDown(0.3);
    doc.strokeColor(colores.borde)
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(572, doc.y)
      .stroke();
    
    doc.moveDown(0.3);
    
    doc.fontSize(tamanosTexto.subtituloMedio)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('PAGOS REALIZADOS', { align: 'center' })
      .moveDown(0.3);

    contrato.pagos.forEach((pago) => {
      const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const monto = (parseFloat(pago.monto) || 0).toFixed(2);
      const metodo = pago.metodo_pago || 'N/A';
      const estadoPago = (pago.estado || 'completado').toUpperCase();

      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.normal)
        .text(`• ${fechaPago} - $${monto} - ${metodo} - ${estadoPago}`, 50);
      
      doc.moveDown(0.2);
    });

    doc.moveDown(0.3);
  }

  // PIE DE PÁGINA PÁGINA 4
  dibujarPiePagina(doc, config);

  // ============================================
  // PÁGINA 5: TÉRMINOS Y CONDICIONES
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);
  
  doc.fontSize(tamanosTexto.subtituloGrande)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('ACUERDO DE SERVICIO DE SALÓN DE BANQUETES', { align: 'center' })
    .moveDown(0.5);

  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('TÉRMINOS Y CONDICIONES DEL CONTRATO', { align: 'center' })
    .moveDown(0.6);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.texto)
    .font(fuentes.normal)
    .text('"Compañía" se refiere a la entidad que proporciona los servicios para la ejecución del evento contratado, y "Cliente" se refiere a la persona o entidad que contrata los servicios para la realización de su evento. "Contrato" se refiere al conjunto de Términos y Condiciones contenidos en este documento, que ambas partes —la Compañía y el Cliente— acuerdan cumplir.', 40, undefined, { 
      align: 'justify',
      lineGap: 1.2,
      width: 532
    })
    .moveDown(0.6);

  const terminos = [
    {
      titulo: '1. RESERVA, DEPÓSITO Y CONDICIONES DE PAGO',
      contenido: 'Se requiere un depósito no reembolsable de $500 para reservar la fecha del evento. Se deberá completar un pago de $1,000 dentro de los diez (10) días posteriores a la reserva. A partir de entonces, se requerirán pagos mensuales de al menos $500 hasta que se pague el saldo total. El pago total deberá completarse al menos diez (10) días hábiles antes del evento. Los pagos con Visa y MasterCard se aceptan solo hasta 30 días antes de la fecha del evento con una tarifa del 3.8%. No se acepta American Express. Todos los pagos no son reembolsables.'
    },
    {
      titulo: '2. POLÍTICA DE CANCELACIÓN DEL EVENTO',
      contenido: 'Todas las cancelaciones deben presentarse por escrito a través de correo electrónico. El Cliente perderá todos los pagos realizados y acepta no disputar ni revertir ningún pago. No se emitirán reembolsos bajo ninguna circunstancia.'
    },
    {
      titulo: '3. SERVICIOS DE TERCEROS',
      contenido: 'La Compañía no se hace responsable por fallas o retrasos en los servicios subcontratados a proveedores externos, como limusinas, fotógrafos, videógrafos, bailarines o artistas. Todos los servicios adicionales deben gestionarse a través de los proveedores aprobados por la Compañía.'
    },
    {
      titulo: '4. RESPONSABILIDAD DEL CLIENTE POR DAÑOS',
      contenido: 'El Cliente asume total responsabilidad por cualquier daño a la propiedad, muebles o infraestructura causado por invitados, miembros de la familia o proveedores externos. Los costos de reparación se facturarán al Cliente y deberán pagarse de inmediato.'
    },
    {
      titulo: '5. POLÍTICA DE DECORACIÓN Y SUMINISTROS',
      contenido: 'Todas las decoraciones o materiales traídos por el Cliente requieren aprobación previa. La entrega solo está permitida los miércoles entre las 2:00 PM y las 5:00 PM. La Compañía no se hace responsable por artículos personales perdidos o dañados. El tiempo del personal dedicado a la instalación o remoción puede ser cargado al Cliente.'
    },
    {
      titulo: '6. HORARIO Y ACCESO AL EVENTO',
      contenido: 'El Cliente y los invitados solo pueden ingresar al lugar a la hora indicada en el contrato del evento. Los cambios en los detalles del evento solo se permiten hasta diez (10) días antes del evento. Los artistas o vendedores externos no aprobados por la Compañía están prohibidos por razones de seguro.'
    },
    {
      titulo: '7. AUTORIZACIÓN DE USO DE MEDIOS',
      contenido: 'El Cliente autoriza a la Compañía a tomar fotos y videos del evento y utilizarlos con fines promocionales en redes sociales, sitios web u otros materiales de marketing.'
    },
    {
      titulo: '8. FUERZA MAYOR',
      contenido: 'La Compañía no es responsable por el incumplimiento causado por eventos fuera de su control, incluidos desastres naturales, cortes de energía, pandemias o restricciones gubernamentales.'
    },
    {
      titulo: '9. LIMITACIÓN DE RESPONSABILIDAD',
      contenido: 'La responsabilidad total de la Compañía no excederá el monto total pagado por el Cliente. La Compañía no será responsable por daños indirectos o consecuentes.'
    },
    {
      titulo: '10. LEY APLICABLE',
      contenido: 'Este Acuerdo se regirá por las leyes del Estado de Florida. Cualquier disputa se resolverá en los tribunales del Condado de Miami-Dade.'
    },
    {
      titulo: '11. ACUERDO DE NO REEMBOLSO Y NO REVERSIÓN DE CARGOS',
      contenido: 'El Cliente acepta y está de acuerdo en que todos los pagos realizados a Revolution Party Venues son finales y no reembolsables, bajo ninguna circunstancia, incluida la cancelación del evento, el aplazamiento o la insatisfacción con los servicios. Para los pagos realizados con tarjetas de crédito, el titular de la tarjeta acepta además no disputar, cancelar o solicitar ninguna reversión de cargo (chargeback) a través del banco emisor o la compañía de tarjeta de crédito por cualquier motivo relacionado con esta transacción. Cualquier disputa se manejará directamente con la compañía de acuerdo con el acuerdo de evento firmado.'
    }
  ];

  terminos.forEach((termino, index) => {
    // Verificar si necesitamos una nueva página (dejar espacio para título + contenido)
    const espacioNecesario = 80; // Espacio aproximado para título + contenido
    if (doc.y + espacioNecesario > 750 && index < terminos.length - 1) {
      agregarPaginaConFondo();
      dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.normal);
    }

    // Título del término (alineado a la izquierda, no centrado)
    doc.font(fuentes.bold)
      .fontSize(tamanosTexto.seccion)
      .fillColor(colores.primario)
      .text(termino.titulo, 40)
      .moveDown(0.3);
    
    // Contenido del término (justificado, bien espaciado)
    doc.font(fuentes.normal)
      .fontSize(tamanosTexto.normal)
      .fillColor(colores.texto)
      .text(termino.contenido, 40, undefined, { 
        align: 'justify',
        lineGap: 1.2,
        width: 532
      })
      .moveDown(0.5);
  });

  // PIE DE PÁGINA PÁGINA 5
  dibujarPiePagina(doc, config);

  // ============================================
  // PÁGINA 6: FIRMAS Y ACEPTACIÓN
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  // SECCIÓN 10: FIRMAS Y ACEPTACIÓN
  doc.fontSize(tamanosTexto.subtituloMedio)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('FIRMAS Y ACEPTACIÓN', { align: 'center' })
    .moveDown(0.6);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.texto)
    .font(fuentes.normal)
    .text('Las partes declaran haber leído, comprendido y aceptado todos los términos y condiciones establecidos en este contrato.', 40, undefined, { align: 'justify', width: 532 })
    .moveDown(4);

  // Posicionar firmas más cerca del pie de página
  const alturaPie = layout.alturaPiePagina;
  const alturaFirmas = 80; // Altura necesaria para firmas y textos finales
  const yFirmas = doc.page.height - alturaPie - alturaFirmas;
  
  // Asegurar que las firmas estén en la posición correcta
  doc.y = yFirmas;

  // FIRMA DEL CLIENTE
  doc.strokeColor(colores.borde)
    .lineWidth(1)
    .moveTo(70, yFirmas)
    .lineTo(240, yFirmas)
    .stroke();

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text('FIRMA DEL CONTRATANTE', 70, yFirmas + 10, { width: 170, align: 'center' });

  doc.font(fuentes.normal)
    .fontSize(tamanosTexto.normal)
    .text(contrato.clientes?.nombre_completo || '_______________________', 70, yFirmas + 30, { width: 170, align: 'center' })
    .text(`Fecha: ${contrato.fecha_firma ? new Date(contrato.fecha_firma).toLocaleDateString('es-ES') : '___________'}`, 70, yFirmas + 48, { width: 170, align: 'center' });

  // FIRMA DEL VENDEDOR (REPRESENTANTE AUTORIZADO)
  doc.strokeColor(colores.borde)
    .moveTo(360, yFirmas)
    .lineTo(530, yFirmas)
    .stroke();

  doc.font(fuentes.bold)
    .fontSize(tamanosTexto.normal)
    .text('REPRESENTANTE AUTORIZADO', 360, yFirmas + 10, { width: 170, align: 'center' });

  if (contrato.vendedores) {
    doc.font(fuentes.normal)
      .fontSize(tamanosTexto.normal)
      .text(contrato.vendedores.nombre_completo, 360, yFirmas + 30, { width: 170, align: 'center' });
  } else {
    doc.font(fuentes.normal)
      .fontSize(tamanosTexto.normal)
      .text('DIAMOND VENUE AT DORAL', 360, yFirmas + 30, { width: 170, align: 'center' });
  }

  doc.font(fuentes.normal)
    .fontSize(tamanosTexto.normal)
    .text(`Fecha: ${contrato.fecha_firma ? new Date(contrato.fecha_firma).toLocaleDateString('es-ES') : '___________'}`, 360, yFirmas + 48, { width: 170, align: 'center' });

  // Documento legal vinculante (después de las firmas, centrado correctamente)
  doc.moveDown(1.5);
  const textoLegal = 'Documento legal vinculante. Todas las partes deben cumplir con los términos establecidos.';
  const anchoTexto = 532;
  const xInicio = 40; // Inicio del área de texto
  
  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.secundario)
    .font(fuentes.bold)
    .text(textoLegal, xInicio, doc.y, { align: 'center', width: anchoTexto });

  // PIE DE PÁGINA
  dibujarPiePagina(doc, config);

  return doc;
}

module.exports = { generarPDFContrato };
