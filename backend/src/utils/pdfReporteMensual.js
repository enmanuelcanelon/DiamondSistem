const PDFDocument = require('pdfkit');

// ============================================
// CONFIGURACIÓN VISUAL
// ============================================

const CONFIG_VISUAL = {
  colores: {
    texto: '#000000',
    fondoClaro: '#F5F5F5',
    borde: '#000000',
  },
  fuentes: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
  },
  tamanosTexto: {
    titulo: 16,
    subtitulo: 11,
    seccion: 10,
    normal: 9,
    pequeno: 8,
  },
  layout: {
    margenSuperior: 30,
    margenInferior: 30,
    margenIzquierdo: 40,
    margenDerecho: 40,
    anchoUtil: 532,
  },
};

/**
 * Dibuja el encabezado del reporte
 */
function dibujarEncabezado(doc, config, vendedor, mes, año) {
  const { colores, tamanosTexto, fuentes } = config;

  // Título
  doc.fontSize(tamanosTexto.titulo)
    .fillColor('#000000')
    .font(fuentes.bold)
    .text('REPORTE MENSUAL DE VENTAS', { align: 'center', y: 20 });

  // Línea divisoria
  doc.moveTo(40, 45)
    .lineTo(572, 45)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();

  // Información del reporte (más compacta)
  doc.fontSize(8)
    .font(fuentes.normal)
    .fillColor('#000000')
    .text(`Período: ${mes} ${año} | Vendedor: ${vendedor.nombre_completo} (${vendedor.codigo_vendedor}) | Generado: ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 40, 50, { width: 532 });

  // Posición inicial después del encabezado
  doc.y = 65;
}

/**
 * Dibuja una caja con borde limpia para información
 */
function dibujarCaja(doc, x, y, ancho, alto, titulo, lineas) {
  // Borde de la caja
  doc.rect(x, y, ancho, alto)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();

  // Título de la caja
  if (titulo) {
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(titulo, x + 8, y + 8, { width: ancho - 16 });
    
    // Línea bajo el título
    doc.moveTo(x + 5, y + 24)
      .lineTo(x + ancho - 5, y + 24)
      .strokeColor('#000000')
      .lineWidth(0.3)
      .stroke();
  }

  // Contenido (array de líneas)
  if (lineas && Array.isArray(lineas)) {
    let yActual = y + (titulo ? 30 : 10);
    lineas.forEach((linea, index) => {
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(linea, x + 8, yActual, { width: ancho - 16 });
      yActual += 15;
    });
  }

  return y + alto;
}

/**
 * Dibuja una tabla de datos limpia y clara
 */
function dibujarTabla(doc, x, y, config, datos, columnas) {
  const { colores, tamanosTexto, fuentes } = config;
  const filaAltura = 18;
  
  // Calcular anchos totales
  let anchoTotal = 0;
  columnas.forEach(col => {
    anchoTotal += (col.ancho || 0);
  });

  // Si no hay anchos definidos, distribuir equitativamente
  if (anchoTotal === 0) {
    const anchoPorColumna = (config.layout.anchoUtil - 80) / columnas.length;
    columnas.forEach(col => {
      col.ancho = col.ancho || anchoPorColumna;
    });
    anchoTotal = (config.layout.anchoUtil - 80);
  }

  let xActual = x;
  let yActual = y;

  // Encabezado
  doc.fontSize(9)
    .font(fuentes.bold)
    .fillColor('#000000');

  // Dibujar encabezado con fondo gris claro
  doc.rect(x, yActual, anchoTotal, filaAltura)
    .fillAndStroke('#F5F5F5', '#000000');

  columnas.forEach((col) => {
    const ancho = col.ancho;
    doc.text(col.titulo, xActual + 5, yActual + 5, { width: ancho - 10 });
    xActual += ancho;
  });

  yActual += filaAltura;

  // Filas de datos
  doc.font(fuentes.normal)
    .fontSize(9)
    .fillColor('#000000');

  datos.forEach((fila, index) => {
    xActual = x;
    
    // Dibujar borde de fila
    doc.rect(x, yActual, anchoTotal, filaAltura)
      .strokeColor('#000000')
      .lineWidth(0.3)
      .stroke();

    columnas.forEach((col) => {
      const ancho = col.ancho;
      const valor = col.render ? col.render(fila) : fila[col.campo] || '';
      doc.fillColor('#000000')
        .text(String(valor), xActual + 5, yActual + 5, { width: ancho - 10 });
      xActual += ancho;
    });

    yActual += filaAltura;
  });

  return yActual;
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
    const yPie = doc.page.height - 20;
    doc.fontSize(8)
      .font(fuentes.normal)
      .fillColor('#000000')
      .text(
        `Página ${numeroPagina} | DiamondSistem - Reporte Mensual`,
        40,
        yPie,
        { align: 'center', width: layout.anchoUtil }
      );
  };

  // ============================================
  // PÁGINA 1: TODO EN UNA PÁGINA
  // ============================================
  
  dibujarEncabezado(doc, config, vendedor, mesNombre, año);

  const stats = datos.estadisticas || {};
  const anchoCaja = (layout.anchoUtil - 20) / 2; // Dos columnas
  let yInicio = doc.y;

  // CAJA 1: RESUMEN EJECUTIVO (izquierda)
  const lineasEjecutivo = [
    `Total Clientes: ${stats.clientes?.total || 0}`,
    `Total Ofertas: ${stats.ofertas?.total || 0}`,
    `Ofertas Aceptadas: ${stats.ofertas?.aceptadas || 0}`,
    `Ofertas Pendientes: ${stats.ofertas?.pendientes || 0}`,
    `Ofertas Rechazadas: ${stats.ofertas?.rechazadas || 0}`,
    `Total Contratos: ${stats.contratos?.total || 0}`
  ];
  
  const tasaConversion = stats.ofertas?.total > 0
    ? ((stats.ofertas?.aceptadas / stats.ofertas?.total) * 100).toFixed(2)
    : 0;
  lineasEjecutivo.push(`Tasa de Conversión: ${tasaConversion}%`);

  dibujarCaja(doc, 40, yInicio, anchoCaja, 140, 'RESUMEN EJECUTIVO', lineasEjecutivo);

  // CAJA 2: RESUMEN FINANCIERO (derecha)
  const lineasFinanciero = [
    `Total Ventas: $${parseFloat(stats.finanzas?.total_ventas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Porcentaje Comisión: ${stats.finanzas?.comision_porcentaje || 3}%`,
    `Total Comisiones: $${parseFloat(stats.finanzas?.total_comisiones || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ];

  dibujarCaja(doc, 40 + anchoCaja + 20, yInicio, anchoCaja, 140, 'RESUMEN FINANCIERO', lineasFinanciero);

  doc.y = yInicio + 150;

  // Contratos del Mes (si hay)
  if (datos.contratos && datos.contratos.length > 0) {
    doc.fontSize(tamanosTexto.subtitulo)
      .font(fuentes.bold)
      .fillColor('#000000')
      .text('CONTRATOS DEL MES', 40, doc.y)
      .moveDown(0.5);

    const columnas = [
      { titulo: 'Código', campo: 'codigo_contrato', ancho: 110 },
      { titulo: 'Cliente', campo: 'cliente_nombre', ancho: 180 },
      { titulo: 'Fecha', campo: 'fecha_evento', ancho: 85, render: (row) => 
        new Date(row.fecha_evento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      },
      { titulo: 'Total', campo: 'total', ancho: 100, render: (row) => 
        `$${parseFloat(row.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

    // Verificar si hay espacio suficiente, si no, nueva página
    const alturaNecesaria = 18 + (contratosData.length * 18) + 40;
    if (doc.y + alturaNecesaria > doc.page.height - 50) {
      agregarPiePagina(doc, 1);
      doc.addPage();
      doc.y = 30;
      doc.fontSize(tamanosTexto.subtitulo)
        .font(fuentes.bold)
        .fillColor('#000000')
        .text('CONTRATOS DEL MES', 40, doc.y)
        .moveDown(0.5);
    }

    let yFinal = dibujarTabla(doc, 40, doc.y, config, contratosData, columnas);
    doc.y = yFinal + 25;

    // Resumen de contratos en caja (usar estadísticas ya calculadas)
    const stats = datos.estadisticas || {};
    const contratosActivos = stats.contratos?.activos || 0;
    const contratosPagados = stats.contratos?.pagados || 0;
    const totalContratos = parseFloat(stats.finanzas?.total_ventas || 0);

    const resumenContratos = [
      `Total: ${datos.contratos.length} | Activos: ${contratosActivos} | Pagados: ${contratosPagados}`,
      `Total Generado: $${totalContratos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
    
    dibujarCaja(doc, 40, doc.y, layout.anchoUtil, 60, 'RESUMEN', resumenContratos);
  }

  // Agregar pie de página
  const pageRange = doc.bufferedPageRange();
  const startPage = pageRange.start;
  const totalPages = pageRange.count;
  
  for (let i = startPage; i < startPage + totalPages; i++) {
    doc.switchToPage(i);
    agregarPiePagina(doc, i - startPage + 1);
  }

  return doc;
}

module.exports = { generarReporteMensual };
