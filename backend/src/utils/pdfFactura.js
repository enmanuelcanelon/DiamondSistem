const PDFDocument = require('pdfkit');

// ============================================
// CONFIGURACIÓN VISUAL - FÁCIL DE MODIFICAR
// ============================================

const CONFIG_VISUAL = {
  // COLORES (Formato: '#RRGGBB')
  colores: {
    primario: '#1E40AF',        // Color principal del diseño
    secundario: '#475569',      // Color secundario/subtítulos
    texto: '#0F172A',           // Color del texto principal
    textoClaro: '#FFFFFF',      // Texto sobre fondos oscuros
    exito: '#059669',           // Para estados positivos
    advertencia: '#D97706',     // Para alertas/pendientes
    error: '#DC2626',           // Para errores/cancelaciones
    fondoClaro: '#F8FAFC',      // Fondo de cajas/secciones
    fondoOscuro: '#1E40AF',     // Fondo del encabezado
    borde: '#CBD5E1',           // Líneas y bordes
  },

  // FUENTES
  fuentes: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  },

  // TAMAÑOS DE FUENTE
  tamanosTexto: {
    titulo: 28,                 // Título principal
    subtituloGrande: 22,        // Subtítulo de documento
    seccion: 14,                // Títulos de secciones
    subseccion: 12,             // Subtítulos de secciones
    normal: 10,                 // Texto normal
    pequeno: 9,                 // Texto pequeño
    muyPequeno: 8,              // Pie de página, notas
  },

  // MÁRGENES Y ESPACIADO
  layout: {
    margenSuperior: 50,
    margenInferior: 50,
    margenIzquierdo: 50,
    margenDerecho: 50,
    anchoUtil: 512,             // 612 - 50 - 50 = 512
    alturaEncabezado: 100,
    alturaPiePagina: 70,
    espaciadoSeccion: 1.5,
    espaciadoParrafo: 0.5,
    bordeRedondeado: 6,
  },

  // ALTURAS DE ELEMENTOS
  alturas: {
    filaTabla: 20,
    encabezadoTabla: 24,
    cajaInfo: 100,
    cajaEvento: 90,
  },
};

// ============================================
// FUNCIONES AUXILIARES REUTILIZABLES
// ============================================

/**
 * Dibuja el encabezado principal del documento
 */
function dibujarEncabezado(doc, config) {
  const { colores } = config;
  const { alturaEncabezado } = config.layout;

  // Fondo del encabezado
  doc.rect(0, 0, 612, alturaEncabezado)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  // Título principal (Logo/Nombre de la empresa)
  doc.fontSize(config.tamanosTexto.titulo)
    .fillColor(colores.textoClaro)
    .font(config.fuentes.bold)
    .text('DIAMONDSISTEM', { align: 'center', y: 25 });

  // Subtítulo de la empresa
  doc.fontSize(config.tamanosTexto.pequeno + 2)
    .font(config.fuentes.normal)
    .text('Sistema Profesional de Gestión de Eventos', { align: 'center' })
    .moveDown(0.2);

  // Información de contacto
  doc.fontSize(config.tamanosTexto.pequeno)
    .text('Teléfono: +1 (809) 555-0100  |  Email: info@diamondsistem.com', { align: 'center' })
    .text('Sitio Web: www.diamondsistem.com', { align: 'center' });

  doc.y = alturaEncabezado + 20;
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

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.secundario)
    .font(fuentes.italic)
    .text(subtitulo, { align: 'center' })
    .moveDown(layout.espaciadoSeccion);
}

/**
 * Dibuja una caja de información con borde
 */
function dibujarCajaInfo(doc, x, y, ancho, alto, config, colorFondo = null) {
  const { colores, layout } = config;
  const fondo = colorFondo || colores.fondoClaro;

  doc.roundedRect(x, y, ancho, alto, layout.bordeRedondeado)
    .fillAndStroke(fondo, colores.borde);
}

/**
 * Dibuja una fila de etiqueta-valor
 */
function dibujarFilaEtiquetaValor(doc, x, y, etiqueta, valor, config, colorValor = null) {
  const { colores, tamanosTexto, fuentes } = config;

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text(etiqueta, x, y);

  doc.font(fuentes.normal)
    .fillColor(colorValor || colores.texto)
    .text(valor, x + 115, y);
}

/**
 * Dibuja el encabezado de una tabla
 */
function dibujarEncabezadoTabla(doc, y, columnas, config) {
  const { colores, tamanosTexto, fuentes, alturas } = config;
  const { encabezadoTabla } = alturas;

  doc.rect(50, y, config.layout.anchoUtil, encabezadoTabla)
    .fillAndStroke(colores.primario, colores.primario);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold);

  columnas.forEach(col => {
    doc.text(col.texto, col.x, y + 7, { width: col.ancho, align: col.alineacion || 'left' });
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

  doc.rect(50, y, layout.anchoUtil, filaTabla)
    .fillAndStroke(colorFondo, colores.borde);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal);

  columnas.forEach(col => {
    doc.text(col.texto, col.x, y + 5, { width: col.ancho, align: col.alineacion || 'left' });
  });

  return y + filaTabla;
}

/**
 * Dibuja el pie de página
 */
function dibujarPiePagina(doc, config, textoAdicional = '') {
  const { colores, tamanosTexto, fuentes, layout } = config;
  const yFooter = doc.page.height - layout.alturaPiePagina;

  doc.strokeColor(colores.borde)
    .lineWidth(1)
    .moveTo(50, yFooter)
    .lineTo(562, yFooter)
    .stroke();

  doc.fontSize(tamanosTexto.muyPequeno)
    .fillColor(colores.secundario)
    .font(fuentes.normal)
    .text(
      `Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}${textoAdicional}`,
      50,
      yFooter + 10,
      { align: 'center', width: 512 }
    );

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(
      'DiamondSistem - Creando Momentos Inolvidables',
      50,
      yFooter + 30,
      { align: 'center', width: 512 }
    );
}

/**
 * Dibuja un título de sección
 */
function dibujarTituloSeccion(doc, titulo, config) {
  doc.fontSize(config.tamanosTexto.seccion)
    .fillColor(config.colores.primario)
    .font(config.fuentes.bold)
    .text(titulo)
    .moveDown(0.5);
}

// ============================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN
// ============================================

/**
 * Genera una Factura Proforma (oferta) profesional
 * @param {Object} datos - Datos de la oferta
 * @param {String} tipo - 'oferta' o 'contrato'
 * @returns {PDFDocument} - Documento PDF
 */
function generarFacturaProforma(datos, tipo = 'oferta') {
  const config = CONFIG_VISUAL;
  const { colores, tamanosTexto, fuentes, layout } = config;

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: layout.margenSuperior,
      bottom: layout.margenInferior,
      left: layout.margenIzquierdo,
      right: layout.margenDerecho
    }
  });

  // ============================================
  // SECCIÓN 1: ENCABEZADO PRINCIPAL
  // ============================================
  dibujarEncabezado(doc, config);

  // ============================================
  // SECCIÓN 2: TÍTULO DEL DOCUMENTO
  // ============================================
  dibujarTituloDocumento(
    doc,
    'PROPUESTA COMERCIAL',
    'Este documento es una cotización - No constituye un documento fiscal',
    config
  );

  // ============================================
  // SECCIÓN 3: INFORMACIÓN DEL DOCUMENTO Y CLIENTE
  // ============================================
  const yInfo = doc.y;
  dibujarCajaInfo(doc, 50, yInfo, layout.anchoUtil, config.alturas.cajaInfo, config);

  const yContent = yInfo + 15;

  // COLUMNA IZQUIERDA: Datos del documento
  dibujarFilaEtiquetaValor(
    doc, 65, yContent,
    'NÚMERO DE PROPUESTA:',
    datos.codigo_oferta,
    config
  );

  dibujarFilaEtiquetaValor(
    doc, 65, yContent + 18,
    'FECHA DE EMISIÓN:',
    new Date(datos.fecha_creacion || datos.fecha_firma).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    config
  );

  dibujarFilaEtiquetaValor(
    doc, 65, yContent + 36,
    'VÁLIDO HASTA:',
    new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    config
  );

  // Estado con color dinámico
  const estado = datos.estado || 'pendiente';
  const textoEstado = estado === 'aceptada' ? 'ACEPTADA' : estado === 'rechazada' ? 'RECHAZADA' : 'PENDIENTE';
  const colorEstado = estado === 'aceptada' ? colores.exito : estado === 'rechazada' ? colores.error : colores.advertencia;

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text('ESTADO:', 65, yContent + 54);

  doc.fillColor(colorEstado)
    .text(textoEstado, 180, yContent + 54);

  // COLUMNA DERECHA: Datos del cliente
  dibujarFilaEtiquetaValor(
    doc, 320, yContent,
    'CLIENTE:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(datos.clientes?.nombre_completo || 'No especificado', 320, yContent + 14, { width: 230 });

  dibujarFilaEtiquetaValor(
    doc, 320, yContent + 32,
    'CORREO ELECTRÓNICO:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(datos.clientes?.email || 'No especificado', 320, yContent + 46, { width: 230 });

  dibujarFilaEtiquetaValor(
    doc, 320, yContent + 64,
    'TELÉFONO:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(datos.clientes?.telefono || 'No especificado', 320, yContent + 78);

  doc.y = yInfo + config.alturas.cajaInfo + 20;

  // ============================================
  // SECCIÓN 4: INFORMACIÓN DEL EVENTO
  // ============================================
  dibujarTituloSeccion(doc, 'INFORMACIÓN DEL EVENTO', config);

  const yEvento = doc.y;
  dibujarCajaInfo(doc, 50, yEvento, layout.anchoUtil, config.alturas.cajaEvento, config, '#FFFFFF');

  const yEventoContent = yEvento + 15;

  const fechaEvento = new Date(datos.fecha_evento);
  const lugarEvento = datos.lugar_salon || datos.lugar_evento || 'Por definir';
  const cantidadInvitados = datos.cantidad_invitados;
  const tipoEvento = datos.clientes?.tipo_evento || 'Evento';

  dibujarFilaEtiquetaValor(doc, 70, yEventoContent, 'Tipo de Evento:', tipoEvento, config);
  dibujarFilaEtiquetaValor(
    doc, 70, yEventoContent + 20,
    'Fecha:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(
      fechaEvento.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).replace(/^\w/, c => c.toUpperCase()),
      180,
      yEventoContent + 20,
      { width: 360 }
    );

  dibujarFilaEtiquetaValor(doc, 70, yEventoContent + 40, 'Lugar:', lugarEvento, config);
  dibujarFilaEtiquetaValor(doc, 320, yEventoContent, 'Cantidad de Invitados:', `${cantidadInvitados} personas`, config);

  doc.y = yEvento + config.alturas.cajaEvento + 20;

  // ============================================
  // SECCIÓN 5: PAQUETE SELECCIONADO
  // ============================================
  dibujarTituloSeccion(doc, 'PAQUETE SELECCIONADO', config);

  const nombrePaquete = datos.paquetes?.nombre || 'No especificado';
  const descripcionPaquete = datos.paquetes?.descripcion || 'Sin descripción';

  const yPaquete = doc.y;
  dibujarCajaInfo(doc, 50, yPaquete, layout.anchoUtil, 70, config, '#EEF2FF');

  doc.fontSize(tamanosTexto.subseccion)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(`Paquete: ${nombrePaquete}`, 70, yPaquete + 15);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal)
    .text(descripcionPaquete, 70, yPaquete + 35, { width: 460 });

  doc.y = yPaquete + 70 + 10;

  // ============================================
  // SECCIÓN 6: SERVICIOS INCLUIDOS
  // ============================================
  if (datos.paquetes?.paquetes_servicios && datos.paquetes.paquetes_servicios.length > 0) {
    doc.fontSize(tamanosTexto.subseccion)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('SERVICIOS INCLUIDOS EN EL PAQUETE')
      .moveDown(0.5);

    const serviciosIncluidos = datos.paquetes.paquetes_servicios;

    serviciosIncluidos.forEach((ps) => {
      const nombreServicio = ps.servicios?.nombre || 'No especificado';
      const cantidad = ps.cantidad || 1;

      doc.fontSize(tamanosTexto.pequeno)
        .fillColor(colores.exito)
        .font(fuentes.normal)
        .text('•', 70, doc.y)
        .fillColor(colores.texto)
        .text(`${nombreServicio}${cantidad > 1 ? ` (Cantidad: ${cantidad})` : ''}`, 85, doc.y, { width: 465 });
      
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  // ============================================
  // SECCIÓN 7: SERVICIOS ADICIONALES
  // ============================================
  let servicios = datos.ofertas_servicios_adicionales || [];

  if (servicios.length > 0) {
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }

    doc.fontSize(tamanosTexto.subseccion)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('SERVICIOS ADICIONALES CONTRATADOS')
      .moveDown(0.5);

    const yTabla = doc.y;

    // Definir columnas de la tabla
    const columnas = [
      { texto: 'DESCRIPCIÓN DEL SERVICIO', x: 60, ancho: 310, alineacion: 'left' },
      { texto: 'CANT.', x: 380, ancho: 50, alineacion: 'center' },
      { texto: 'PRECIO UNITARIO', x: 440, ancho: 100, alineacion: 'right' }
    ];

    let yActual = dibujarEncabezadoTabla(doc, yTabla, columnas, config);

    servicios.forEach((servicio, index) => {
      const nombreServicio = servicio.servicios?.nombre || 'Servicio no especificado';
      const cantidad = servicio.cantidad || 1;
      const precioUnitario = parseFloat(servicio.precio_unitario || 0);

      const columnasData = [
        { texto: nombreServicio, x: 60, ancho: 310, alineacion: 'left' },
        { texto: cantidad.toString(), x: 380, ancho: 50, alineacion: 'center' },
        { texto: `$${precioUnitario.toFixed(2)}`, x: 440, ancho: 100, alineacion: 'right' }
      ];

      yActual = dibujarFilaTabla(doc, yActual, columnasData, index, config);

      if (yActual > 720 && index < servicios.length - 1) {
        doc.addPage();
        yActual = 50;
      }
    });

    doc.y = yActual + 10;
  }

  // ============================================
  // SECCIÓN 8: RESUMEN FINANCIERO
  // ============================================
  if (doc.y > 580) {
    doc.addPage();
    doc.y = 50;
  }

  dibujarTituloSeccion(doc, 'RESUMEN FINANCIERO', config);

  const xLabel = 340;
  const xValor = 480;
  const anchoValor = 70;

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.texto)
    .font(fuentes.normal);

  const subtotal = parseFloat(datos.subtotal || 0);
  doc.text('Subtotal:', xLabel, doc.y);
  doc.text(`$${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, xValor, doc.y, { width: anchoValor, align: 'right' });
  doc.moveDown(0.8);

  const descuento = parseFloat(datos.descuento || 0);
  if (descuento > 0) {
    doc.text('Descuento:', xLabel, doc.y);
    doc.fillColor(colores.error)
      .text(`-$${descuento.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, xValor, doc.y, { width: anchoValor, align: 'right' });
    doc.fillColor(colores.texto);
    doc.moveDown(0.8);
  }

  const iva = parseFloat(datos.impuesto_monto || 0);
  doc.text('Impuesto (7%):', xLabel, doc.y);
  doc.text(`$${iva.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, xValor, doc.y, { width: anchoValor, align: 'right' });
  doc.moveDown(0.8);

  const serviceFee = parseFloat(datos.tarifa_servicio_monto || 0);
  doc.text('Cargo de Servicio (18%):', xLabel, doc.y);
  doc.text(`$${serviceFee.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, xValor, doc.y, { width: anchoValor, align: 'right' });
  doc.moveDown(1);

  // Línea divisoria
  doc.strokeColor(colores.primario)
    .lineWidth(2)
    .moveTo(xLabel, doc.y)
    .lineTo(562, doc.y)
    .stroke();

  doc.moveDown(0.8);

  // TOTAL
  const total = parseFloat(datos.total_final || 0);

  doc.fontSize(tamanosTexto.subseccion)
    .font(fuentes.bold)
    .fillColor(colores.texto)
    .text('TOTAL:', xLabel, doc.y);

  doc.fontSize(tamanosTexto.seccion)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(`$${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, xValor - 10, doc.y, { width: 80, align: 'right' });

  doc.moveDown(2);

  // ============================================
  // SECCIÓN 9: CONDICIONES COMERCIALES
  // ============================================
  doc.fontSize(tamanosTexto.subseccion)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('CONDICIONES COMERCIALES')
    .moveDown(0.5);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal);

  const condiciones = [
    'RESERVA: Se requiere un depósito no reembolsable de $500.00 para asegurar la fecha del evento.',
    'PAGO INICIAL: Se debe realizar un pago adicional de $1,000.00 dentro de los primeros 10 días de la firma del contrato.',
    'FINANCIAMIENTO: Ofrecemos planes de pago flexibles hasta en 12 cuotas mensuales.',
    'VIGENCIA: Esta propuesta comercial es válida por 30 días calendario desde la fecha de emisión.',
    'CANCELACIÓN: Las cancelaciones realizadas con más de 60 días de anticipación al evento permiten un reembolso del 80% (excluyendo el depósito inicial).',
    'PRECIOS: Los precios están sujetos a disponibilidad y pueden variar hasta la firma formal del contrato.'
  ];

  condiciones.forEach((cond, index) => {
    doc.text(`${index + 1}. ${cond}`, 50, doc.y, { width: 512, lineGap: 2 });
    doc.moveDown(0.5);
  });

  doc.moveDown(1);

  // ============================================
  // SECCIÓN 10: NOTA IMPORTANTE
  // ============================================
  dibujarCajaInfo(doc, 50, doc.y, layout.anchoUtil, 50, config, '#FEF3C7');

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor('#78350F')
    .font(fuentes.bold)
    .text('NOTA IMPORTANTE: ', 65, doc.y + 12, { continued: true })
    .font(fuentes.normal)
    .text('Esta propuesta comercial es un documento informativo y no constituye un comprobante fiscal válido para efectos tributarios. Los servicios están sujetos a disponibilidad hasta la confirmación del pago inicial.', { width: 480 });

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  dibujarPiePagina(doc, config);

  return doc;
}

module.exports = { generarFacturaProforma };
