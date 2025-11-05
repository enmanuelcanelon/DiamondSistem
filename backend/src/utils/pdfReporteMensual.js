const PDFDocument = require('pdfkit');

// ============================================
// CONFIGURACIÓN VISUAL
// ============================================

const CONFIG_VISUAL = {
  colores: {
    primario: '#1E40AF',
    secundario: '#475569',
    texto: '#0F172A',
    textoClaro: '#FFFFFF',
    exito: '#059669',
    advertencia: '#D97706',
    error: '#DC2626',
    fondoClaro: '#F8FAFC',
    fondoOscuro: '#1E40AF',
    borde: '#CBD5E1',
  },
  fuentes: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  },
  tamanosTexto: {
    titulo: 24,
    subtitulo: 18,
    seccion: 14,
    normal: 10,
    pequeno: 9,
  },
  layout: {
    margenSuperior: 50,
    margenInferior: 50,
    margenIzquierdo: 50,
    margenDerecho: 50,
    anchoUtil: 512,
  },
};

/**
 * Dibuja el encabezado del reporte
 */
function dibujarEncabezado(doc, config, vendedor, mes, año) {
  const { colores, tamanosTexto, fuentes, layout } = config;

  // Fondo del encabezado
  doc.rect(0, 0, 612, 80)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  // Título
  doc.fontSize(tamanosTexto.titulo)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('REPORTE MENSUAL', { align: 'center', y: 25 });

  // Subtítulo
  doc.fontSize(tamanosTexto.normal)
    .font(fuentes.normal)
    .text(`${mes} ${año}`, { align: 'center' })
    .moveDown(0.3);

  // Información del vendedor
  doc.fontSize(tamanosTexto.pequeno)
    .text(`Vendedor: ${vendedor.nombre_completo} (${vendedor.codigo_vendedor})`, { align: 'center' })
    .text(`Generado: ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, { align: 'center' });

  // Posición inicial después del encabezado
  doc.y = 100;
}

/**
 * Dibuja una caja de información
 */
function dibujarCaja(doc, x, y, ancho, alto, config, titulo, valor, color = null) {
  const { colores, tamanosTexto, fuentes } = config;
  const colorFondo = color || colores.fondoClaro;

  // Fondo
  doc.rect(x, y, ancho, alto)
    .fillAndStroke(colorFondo, colores.borde)
    .fillColor(colores.texto);

  // Título
  doc.fontSize(tamanosTexto.pequeno)
    .font(fuentes.normal)
    .text(titulo, x + 10, y + 8, { width: ancho - 20 });

  // Valor
  doc.fontSize(tamanosTexto.seccion)
    .font(fuentes.bold)
    .text(valor, x + 10, y + 25, { width: ancho - 20 });
}

/**
 * Dibuja una tabla de datos
 */
function dibujarTabla(doc, x, y, config, datos, columnas) {
  const { colores, tamanosTexto, fuentes } = config;
  const filaAltura = 20;
  const anchoColumna = (config.layout.anchoUtil - 100) / columnas.length;

  // Encabezado
  doc.fontSize(tamanosTexto.normal)
    .font(fuentes.bold)
    .fillColor(colores.textoClaro);

  let xActual = x;
  doc.rect(x, y, config.layout.anchoUtil - 100, filaAltura)
    .fillAndStroke(colores.fondoOscuro, colores.borde);

  columnas.forEach((col, index) => {
    doc.text(col.titulo, xActual + 5, y + 5, { width: col.ancho || anchoColumna });
    xActual += col.ancho || anchoColumna;
  });

  // Filas de datos
  doc.fillColor(colores.texto)
    .font(fuentes.normal);

  datos.forEach((fila, index) => {
    const yFila = y + filaAltura + (index * filaAltura);
    
    // Fondo alternado
    if (index % 2 === 0) {
      doc.rect(x, yFila, config.layout.anchoUtil - 100, filaAltura)
        .fillAndStroke(colores.fondoClaro, colores.borde);
    } else {
      doc.rect(x, yFila, config.layout.anchoUtil - 100, filaAltura)
        .fillAndStroke('#FFFFFF', colores.borde);
    }

    xActual = x;
    columnas.forEach((col, colIndex) => {
      const valor = col.render ? col.render(fila) : fila[col.campo] || '';
      doc.text(String(valor), xActual + 5, yFila + 5, { width: col.ancho || anchoColumna });
      xActual += col.ancho || anchoColumna;
    });
  });

  return y + filaAltura + (datos.length * filaAltura);
}

/**
 * Genera el PDF del reporte mensual
 * @param {Object} datos - Datos del reporte mensual
 * @param {Object} vendedor - Información del vendedor
 * @param {Number} mes - Mes del reporte (1-12)
 * @param {Number} año - Año del reporte
 * @returns {PDFDocument} - Documento PDF
 */
function generarReporteMensual(datos, vendedor, mes, año) {
  const config = CONFIG_VISUAL;
  const { colores, tamanosTexto, fuentes, layout } = config;

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const mesNombre = nombresMeses[mes - 1];

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: layout.margenSuperior,
      bottom: layout.margenInferior,
      left: layout.margenIzquierdo,
      right: layout.margenDerecho
    }
  });

  // Función auxiliar para agregar pie de página
  const agregarPiePagina = (doc, numeroPagina) => {
    const yPie = doc.page.height - 30;
    doc.fontSize(tamanosTexto.pequeno)
      .font(fuentes.normal)
      .fillColor(colores.secundario)
      .text(
        `Página ${numeroPagina} | DiamondSistem - Reporte Mensual`,
        50,
        yPie,
        { align: 'center', width: layout.anchoUtil }
      );
  };

  // ============================================
  // PÁGINA 1: RESUMEN EJECUTIVO
  // ============================================
  
  dibujarEncabezado(doc, config, vendedor, mesNombre, año);

  // Título de sección
  doc.fontSize(tamanosTexto.subtitulo)
    .font(fuentes.bold)
    .fillColor(colores.texto)
    .text('RESUMEN EJECUTIVO', { align: 'left' })
    .moveDown(1);

  // Estadísticas principales
  const stats = datos.estadisticas || {};
  const anchoCaja = (layout.anchoUtil - 30) / 4;
  let x = 50;

  dibujarCaja(doc, x, doc.y, anchoCaja, 60, config, 'Clientes', stats.clientes?.total || 0);
  x += anchoCaja + 10;
  dibujarCaja(doc, x, doc.y, anchoCaja, 60, config, 'Ofertas', stats.ofertas?.total || 0);
  x += anchoCaja + 10;
  dibujarCaja(doc, x, doc.y, anchoCaja, 60, config, 'Contratos', stats.contratos?.total || 0);
  x += anchoCaja + 10;
  dibujarCaja(doc, x, doc.y, anchoCaja, 60, config, 'Ventas', `$${parseFloat(stats.finanzas?.total_ventas || 0).toLocaleString()}`);

  doc.y += 80;

  // Estadísticas financieras
  doc.fontSize(tamanosTexto.seccion)
    .font(fuentes.bold)
    .text('RESUMEN FINANCIERO', { align: 'left' })
    .moveDown(0.5);

  const anchoFin = (layout.anchoUtil - 20) / 3;
  x = 50;

  dibujarCaja(doc, x, doc.y, anchoFin, 70, config, 'Total Ventas', 
    `$${parseFloat(stats.finanzas?.total_ventas || 0).toLocaleString()}`,
    colores.exito);
  x += anchoFin + 10;
  dibujarCaja(doc, x, doc.y, anchoFin, 70, config, 'Comisión %', 
    `${stats.finanzas?.comision_porcentaje || 3}%`);
  x += anchoFin + 10;
  dibujarCaja(doc, x, doc.y, anchoFin, 70, config, 'Total Comisiones', 
    `$${parseFloat(stats.finanzas?.total_comisiones || 0).toLocaleString()}`,
    colores.advertencia);

  doc.y += 100;

  // Estado de ofertas
  doc.fontSize(tamanosTexto.seccion)
    .font(fuentes.bold)
    .text('ESTADO DE OFERTAS', { align: 'left' })
    .moveDown(0.5);

  const anchoOferta = (layout.anchoUtil - 30) / 4;
  x = 50;

  dibujarCaja(doc, x, doc.y, anchoOferta, 60, config, 'Total', stats.ofertas?.total || 0);
  x += anchoOferta + 10;
  dibujarCaja(doc, x, doc.y, anchoOferta, 60, config, 'Aceptadas', stats.ofertas?.aceptadas || 0, colores.exito);
  x += anchoOferta + 10;
  dibujarCaja(doc, x, doc.y, anchoOferta, 60, config, 'Pendientes', stats.ofertas?.pendientes || 0, colores.advertencia);
  x += anchoOferta + 10;
  dibujarCaja(doc, x, doc.y, anchoOferta, 60, config, 'Rechazadas', stats.ofertas?.rechazadas || 0, colores.error);

  doc.y += 80;

  // Tasa de conversión
  const tasaConversion = stats.ofertas?.total > 0
    ? ((stats.ofertas?.aceptadas / stats.ofertas?.total) * 100).toFixed(2)
    : 0;

  doc.fontSize(tamanosTexto.seccion)
    .font(fuentes.bold)
    .text('TASA DE CONVERSIÓN', { align: 'left' })
    .moveDown(0.3);

  doc.fontSize(tamanosTexto.subtitulo)
    .font(fuentes.bold)
    .fillColor(colores.exito)
    .text(`${tasaConversion}%`, { align: 'left' })
    .moveDown(1);

  // ============================================
  // PÁGINA 2: CONTRATOS DEL MES
  // ============================================
  
  if (datos.contratos && datos.contratos.length > 0) {
    // Agregar pie de página a la primera página antes de agregar nueva
    agregarPiePagina(doc, 1);
    
    doc.addPage();
    doc.y = 50;

    doc.fontSize(tamanosTexto.subtitulo)
      .font(fuentes.bold)
      .fillColor(colores.texto)
      .text('CONTRATOS DEL MES', { align: 'left' })
      .moveDown(0.5);

    const columnas = [
      { titulo: 'Código', campo: 'codigo_contrato', ancho: 100 },
      { titulo: 'Cliente', campo: 'cliente_nombre', ancho: 150 },
      { titulo: 'Fecha Evento', campo: 'fecha_evento', ancho: 100, render: (row) => 
        new Date(row.fecha_evento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      },
      { titulo: 'Total', campo: 'total', ancho: 100, render: (row) => 
        `$${parseFloat(row.total_contrato || 0).toLocaleString()}`
      },
      { titulo: 'Estado', campo: 'estado_pago', ancho: 80 }
    ];

    const contratosData = datos.contratos.map(c => ({
      codigo_contrato: c.codigo_contrato,
      cliente_nombre: c.clientes?.nombre_completo || 'N/A',
      fecha_evento: c.fecha_evento,
      total_contrato: c.total_contrato,
      estado_pago: c.estado_pago || 'pendiente'
    }));

    const yFinal = dibujarTabla(doc, 50, doc.y, config, contratosData, columnas);
    doc.y = yFinal + 20;

    // Resumen de contratos
    doc.fontSize(tamanosTexto.seccion)
      .font(fuentes.bold)
      .text('RESUMEN DE CONTRATOS', { align: 'left' })
      .moveDown(0.3);

    const contratosActivos = datos.contratos.filter(c => c.estado === 'activo').length;
    const contratosPagados = datos.contratos.filter(c => c.estado_pago === 'completado').length;
    const totalContratos = parseFloat(datos.contratos.reduce((sum, c) => sum + parseFloat(c.total_contrato || 0), 0));

    doc.fontSize(tamanosTexto.normal)
      .font(fuentes.normal)
      .text(`Total de Contratos: ${datos.contratos.length}`, { align: 'left' })
      .text(`Contratos Activos: ${contratosActivos}`, { align: 'left' })
      .text(`Contratos Pagados: ${contratosPagados}`, { align: 'left' })
      .text(`Total Generado: $${totalContratos.toLocaleString()}`, { align: 'left' });
    
    // Agregar pie de página a la segunda página
    agregarPiePagina(doc, 2);
  } else {
    // Si no hay contratos, agregar pie de página a la única página
    agregarPiePagina(doc, 1);
  }

  return doc;
}

module.exports = { generarReporteMensual };







