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
    fondoPaquete: '#EEF2FF',    // Fondo para destacar paquete
    borde: '#CBD5E1',           // Líneas y bordes
    bordeClaro: '#C7D2FE',      // Borde para elementos destacados
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
    subtituloMedio: 18,         // Subtítulo en portada
    seccion: 14,                // Títulos de secciones
    subseccion: 12,             // Subtítulos de secciones
    subseccionPequena: 11,      // Subtítulos pequeños
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
    alturaEncabezadoPagina: 50,
    alturaPiePagina: 70,
    espaciadoSeccion: 1.5,
    espaciadoParrafo: 0.5,
    bordeRedondeado: 6,
  },

  // ALTURAS DE ELEMENTOS
  alturas: {
    filaTabla: 20,
    encabezadoTabla: 24,
    cajaInfoContrato: 120,
    cajaEvento: 90,
    cajaFinanzas: 80,
    cajaPaquete: 60,
    cajaFirma: 150,
  },
};

// ============================================
// FUNCIONES AUXILIARES REUTILIZABLES
// ============================================

/**
 * Dibuja el patrón de fondo decorativo en toda la página
 */
function dibujarPatronFondo(doc) {
  const fondoGris = '#F5F5F5';
  const colorLinea = '#FFFFFF';
  const grosorLinea = 0.3;
  
  // Fondo gris claro
  doc.rect(0, 0, 612, 792)
    .fillAndStroke(fondoGris, fondoGris);
  
  // Guardar el estado actual
  doc.save();
  
  // Configurar el estilo de línea
  doc.strokeColor(colorLinea)
    .lineWidth(grosorLinea);
  
  // Dibujar patrón de líneas decorativas tipo ogee/trellis
  const paso = 25; // Espaciado del patrón
  
  for (let y = -paso; y < 792 + paso; y += paso) {
    for (let x = -paso; x < 612 + paso; x += paso) {
      const centroX = x + paso / 2;
      const centroY = y + paso / 2;
      const radio = paso * 0.35;
      
      // Dibujar arcos decorativos (formas de pétalos)
      // Arco superior
      doc.path(`M ${centroX - radio} ${centroY} Q ${centroX} ${centroY - radio * 0.8} ${centroX + radio} ${centroY}`)
        .stroke();
      
      // Arco inferior
      doc.path(`M ${centroX - radio} ${centroY} Q ${centroX} ${centroY + radio * 0.8} ${centroX + radio} ${centroY}`)
        .stroke();
      
      // Conexiones horizontales entre elementos
      if (x >= 0) {
        doc.moveTo(centroX - paso, centroY)
          .lineTo(centroX - radio, centroY)
          .stroke();
      }
    }
  }
  
  // Restaurar el estado
  doc.restore();
}

/**
 * Dibuja el encabezado principal del documento (página 1)
 */
function dibujarEncabezadoPrincipal(doc, config) {
  const { colores, tamanosTexto, fuentes, layout } = config;
  const { alturaEncabezado } = layout;

  // Fondo del encabezado
  doc.rect(0, 0, 612, alturaEncabezado)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  // Título principal (Logo/Nombre de la empresa)
  doc.fontSize(tamanosTexto.titulo)
    .fillColor(colores.textoClaro)
    .font(config.fuentes.bold)
    .text('DIAMONDSISTEM', { align: 'center', y: 25 });

  // Subtítulo de la empresa
  doc.fontSize(tamanosTexto.subseccionPequena)
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
 * Dibuja un encabezado pequeño para páginas internas
 */
function dibujarEncabezadoPagina(doc, codigoContrato, config) {
  const { colores, tamanosTexto, fuentes, layout } = config;

  doc.rect(0, 0, 612, layout.alturaEncabezadoPagina)
    .fillAndStroke(colores.fondoClaro, colores.borde);

  doc.fontSize(tamanosTexto.subseccionPequena)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('DIAMONDSISTEM', 50, 15);

  doc.fontSize(tamanosTexto.muyPequeno)
    .fillColor(colores.secundario)
    .font(fuentes.normal)
    .text(`Contrato No. ${codigoContrato}`, 50, 32);

  doc.y = 70;
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
function dibujarCajaInfo(doc, x, y, ancho, alto, config, colorFondo = null, colorBorde = null) {
  const { colores, layout } = config;
  const fondo = colorFondo || colores.fondoClaro;
  const borde = colorBorde || colores.borde;

  doc.roundedRect(x, y, ancho, alto, layout.bordeRedondeado)
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
      .text(valor, x + 110, y, { width: anchoValor });
  }
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
      `Documento generado el ${new Date().toLocaleDateString('es-ES')}${textoAdicional}`,
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
  doc.fontSize(config.tamanosTexto.subseccion)
    .fillColor(config.colores.primario)
    .font(config.fuentes.bold)
    .text(titulo)
    .moveDown(0.5);
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
  // PÁGINA 1: PORTADA DEL CONTRATO
  // ============================================
  
  // Dibujar patrón de fondo en la primera página
  dibujarPatronFondo(doc);
  
  // SECCIÓN 1: ENCABEZADO PRINCIPAL
  dibujarEncabezadoPrincipal(doc, config);

  // SECCIÓN 2: TÍTULO DEL DOCUMENTO
  dibujarTituloDocumento(
    doc,
    'CONTRATO DE SERVICIOS PARA EVENTOS',
    'Documento Legal Vinculante',
    config
  );

  // SECCIÓN 3: INFORMACIÓN DEL CONTRATO
  const yInfo = doc.y;
  dibujarCajaInfo(doc, 50, yInfo, layout.anchoUtil, alturas.cajaInfoContrato, config);

  const yContent = yInfo + 15;

  // COLUMNA IZQUIERDA: Datos del contrato
  dibujarFilaEtiquetaValor(
    doc, 65, yContent,
    'NÚMERO DE CONTRATO:',
    contrato.codigo_contrato,
    config
  );

  dibujarFilaEtiquetaValor(
    doc, 65, yContent + 18,
    'FECHA DE FIRMA:',
    new Date(contrato.fecha_firma).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    config
  );

  dibujarFilaEtiquetaValor(
    doc, 65, yContent + 36,
    'FECHA DEL EVENTO:',
    new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    config
  );

  // Estado con color dinámico
  const estado = contrato.estado || 'activo';
  const textoEstado = estado.toUpperCase();
  const colorEstado = estado === 'activo' ? colores.exito : colores.advertencia;

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text('ESTADO DEL CONTRATO:', 65, yContent + 54);

  doc.fillColor(colorEstado)
    .font(fuentes.bold)
    .text(textoEstado, 185, yContent + 54);

  dibujarFilaEtiquetaValor(
    doc, 65, yContent + 72,
    'CÓDIGO DE ACCESO:',
    contrato.codigo_acceso_cliente.substring(0, 12) + '...',
    config,
    null,
    150
  );

  // COLUMNA DERECHA: Datos del cliente
  dibujarFilaEtiquetaValor(
    doc, 320, yContent,
    'CONTRATANTE:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(contrato.clientes?.nombre_completo || 'No especificado', 320, yContent + 14, { width: 230 });

  dibujarFilaEtiquetaValor(
    doc, 320, yContent + 36,
    'CORREO ELECTRÓNICO:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(contrato.clientes?.email || 'No especificado', 320, yContent + 50, { width: 230 });

  dibujarFilaEtiquetaValor(
    doc, 320, yContent + 68,
    'TELÉFONO:',
    '',
    config
  );
  doc.font(fuentes.normal)
    .fillColor(colores.texto)
    .text(contrato.clientes?.telefono || 'No especificado', 320, yContent + 82);

  doc.y = yInfo + alturas.cajaInfoContrato + 20;

  // SECCIÓN 4: RESUMEN DEL EVENTO
  dibujarTituloSeccion(doc, 'DATOS DEL EVENTO', config);

  const yEvento = doc.y;
  dibujarCajaInfo(doc, 50, yEvento, layout.anchoUtil, alturas.cajaEvento, config, '#FFFFFF');

  const yEventoContent = yEvento + 15;

  const tipoEvento = contrato.clientes?.tipo_evento || 'Evento';
  const lugarEvento = contrato.lugar_salon || contrato.ofertas?.lugar_evento || 'Por definir';
  const cantidadInvitados = contrato.cantidad_invitados;
  const horario = `${contrato.hora_inicio} - ${contrato.hora_fin}`;

  dibujarFilaEtiquetaValor(doc, 70, yEventoContent, 'Tipo de Evento:', tipoEvento, config, null, 360);
  dibujarFilaEtiquetaValor(doc, 70, yEventoContent + 20, 'Lugar:', lugarEvento, config, null, 360);
  dibujarFilaEtiquetaValor(doc, 70, yEventoContent + 40, 'Cantidad de Invitados:', `${cantidadInvitados} personas`, config, null, 360);
  dibujarFilaEtiquetaValor(doc, 70, yEventoContent + 60, 'Horario del Evento:', horario, config, null, 360);

  doc.y = yEvento + alturas.cajaEvento + 20;

  // SECCIÓN 5: RESUMEN FINANCIERO
  dibujarTituloSeccion(doc, 'RESUMEN FINANCIERO', config);

  const totalContrato = parseFloat(contrato.total_contrato || 0);
  const totalPagado = parseFloat(contrato.total_pagado || 0);
  const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);

  const yFinanzas = doc.y;
  dibujarCajaInfo(doc, 50, yFinanzas, layout.anchoUtil, alturas.cajaFinanzas, config);

  const yFinanzasContent = yFinanzas + 15;

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text('Total del Contrato:', 70, yFinanzasContent);

  doc.fillColor(colores.primario)
    .text(`$${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 350, yFinanzasContent, { align: 'right', width: 180 });

  doc.fillColor(colores.texto)
    .text('Total Pagado:', 70, yFinanzasContent + 22);

  doc.fillColor(colores.exito)
    .text(`$${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 350, yFinanzasContent + 22, { align: 'right', width: 180 });

  doc.fillColor(colores.texto)
    .text('Saldo Pendiente:', 70, yFinanzasContent + 44);

  doc.fillColor(saldoPendiente > 0 ? colores.advertencia : colores.exito)
    .font(fuentes.bold)
    .text(`$${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 350, yFinanzasContent + 44, { align: 'right', width: 180 });

  doc.y = yFinanzas + alturas.cajaFinanzas + 20;

  // ============================================
  // PÁGINA 2: SERVICIOS CONTRATADOS
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  // SECCIÓN 6: PAQUETE CONTRATADO
  dibujarTituloSeccion(doc, 'PAQUETE CONTRATADO', config);

  const nombrePaquete = contrato.paquetes?.nombre || 'No especificado';
  const descripcionPaquete = contrato.paquetes?.descripcion || 'Sin descripción';

  const yPaquete = doc.y;
  dibujarCajaInfo(doc, 50, yPaquete, layout.anchoUtil, alturas.cajaPaquete, config, colores.fondoPaquete, colores.bordeClaro);

  doc.fontSize(tamanosTexto.subseccionPequena)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text(nombrePaquete, 70, yPaquete + 15);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal)
    .text(descripcionPaquete, 70, yPaquete + 35, { width: 460 });

  doc.y = yPaquete + alturas.cajaPaquete + 15;

  // SECCIÓN 7: SERVICIOS INCLUIDOS EN EL PAQUETE
  if (contrato.paquetes?.paquetes_servicios && contrato.paquetes.paquetes_servicios.length > 0) {
    doc.fontSize(tamanosTexto.subseccionPequena)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('SERVICIOS INCLUIDOS EN EL PAQUETE')
      .moveDown(0.5);

    const serviciosIncluidos = contrato.paquetes.paquetes_servicios;

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

  // SECCIÓN 8: SERVICIOS ADICIONALES
  if (contrato.contratos_servicios && contrato.contratos_servicios.length > 0) {
    doc.fontSize(tamanosTexto.subseccionPequena)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('SERVICIOS ADICIONALES CONTRATADOS')
      .moveDown(0.5);

    const yTabla = doc.y;

    const columnas = [
      { texto: 'DESCRIPCIÓN', x: 60, ancho: 310, alineacion: 'left' },
      { texto: 'CANT.', x: 380, ancho: 50, alineacion: 'center' },
      { texto: 'PRECIO UNIT.', x: 440, ancho: 100, alineacion: 'right' }
    ];

    let yActual = dibujarEncabezadoTabla(doc, yTabla, columnas, config);

    contrato.contratos_servicios.forEach((servicio, index) => {
      const nombreServicio = servicio.servicios?.nombre || 'Servicio';
      const cantidad = servicio.cantidad || 1;
      const precioUnitario = parseFloat(servicio.precio_unitario || 0);

      const columnasData = [
        { texto: nombreServicio, x: 60, ancho: 310, alineacion: 'left' },
        { texto: cantidad.toString(), x: 380, ancho: 50, alineacion: 'center' },
        { texto: `$${precioUnitario.toFixed(2)}`, x: 440, ancho: 100, alineacion: 'right' }
      ];

      yActual = dibujarFilaTabla(doc, yActual, columnasData, index, config);
    });

    doc.y = yActual + 10;
  }

  // ============================================
  // PÁGINA 3: PLAN DE PAGOS
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  // SECCIÓN 9: PLAN DE PAGOS
  dibujarTituloSeccion(doc, 'PLAN DE PAGOS', config);

  if (contrato.tipo_pago === 'unico') {
    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.texto)
      .font(fuentes.normal)
      .text('Modalidad de Pago: Pago Único', 50)
      .text('El pago total debe realizarse de una sola vez antes del evento.', 50);

  } else if (contrato.plan_pagos && (contrato.tipo_pago === 'plazos' || contrato.tipo_pago === 'financiado')) {
    const plan = typeof contrato.plan_pagos === 'string' 
      ? JSON.parse(contrato.plan_pagos) 
      : contrato.plan_pagos;

    if (!plan) {
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.normal)
        .text('Modalidad de Pago: Plan de Pagos (Detalles no disponibles)', 50);
      doc.moveDown(1);
    } else {
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colores.texto)
        .font(fuentes.bold)
        .text(`Modalidad de Pago: Financiamiento en ${contrato.meses_financiamiento || plan.pagos?.length || 'N/A'} Cuotas`, 50)
        .moveDown(1);

      // PAGOS INICIALES OBLIGATORIOS
      doc.fontSize(tamanosTexto.subseccionPequena)
        .fillColor(colores.primario)
        .font(fuentes.bold)
        .text('PAGOS INICIALES OBLIGATORIOS')
        .moveDown(0.5);

      doc.fontSize(tamanosTexto.pequeno)
        .fillColor(colores.texto)
        .font(fuentes.normal);

      // Depósito de reserva
      if (plan.depositoReserva) {
        doc.text(`1. Depósito de Reserva (No reembolsable): $${plan.depositoReserva.toLocaleString('es-ES')}`, 70)
          .text('   Este pago confirma la reserva de su fecha y no es reembolsable bajo ninguna circunstancia.', 70)
          .moveDown(0.5);
      }

      // Segundo pago (puede ser pagoInicial o segundoPago dependiendo de la versión)
      const segundoPago = plan.segundoPago || plan.pagoInicial || 0;
      if (segundoPago > 0) {
        doc.text(`2. Segundo Pago: $${segundoPago.toLocaleString('es-ES')}`, 70)
          .text('   Debe realizarse 15 días después de la reserva.', 70)
          .moveDown(1);
      }

    // CUOTAS MENSUALES
    if (plan.pagos && plan.pagos.length > 0) {
      doc.fontSize(tamanosTexto.subseccionPequena)
        .fillColor(colores.primario)
        .font(fuentes.bold)
        .text('CUOTAS MENSUALES')
        .moveDown(0.5);

      const yTabla = doc.y;
      const columnas = [
        { texto: 'CUOTA', x: 60, ancho: 70, alineacion: 'left' },
        { texto: 'DESCRIPCIÓN', x: 150, ancho: 280, alineacion: 'left' },
        { texto: 'MONTO', x: 440, ancho: 100, alineacion: 'right' }
      ];

      let yActual = dibujarEncabezadoTabla(doc, yTabla, columnas, config);

      plan.pagos.forEach((pago, index) => {
        const columnasData = [
          { texto: `#${index + 1}`, x: 60, ancho: 70, alineacion: 'left' },
          { texto: pago.descripcion, x: 150, ancho: 280, alineacion: 'left' },
          { texto: `$${pago.monto.toLocaleString('es-ES')}`, x: 440, ancho: 100, alineacion: 'right' }
        ];

        yActual = dibujarFilaTabla(doc, yActual, columnasData, index, config);
      });

      doc.y = yActual + 10;
    }

      doc.moveDown(1);

      // ADVERTENCIA IMPORTANTE
      dibujarCajaInfo(doc, 50, doc.y, layout.anchoUtil, 50, config, '#FEE2E2', '#FECACA');

      doc.fontSize(tamanosTexto.pequeno)
        .fillColor(colores.error)
        .font(fuentes.bold)
        .text('ADVERTENCIA IMPORTANTE: ', 65, doc.y + 12, { continued: true })
        .font(fuentes.normal)
        .text('El pago completo debe estar liquidado al menos 15 días hábiles antes del evento. El incumplimiento puede resultar en la cancelación del servicio sin derecho a reembolso.', { width: 480 });

      doc.moveDown(3);
    }
  }

  // SECCIÓN 10: HISTORIAL DE PAGOS
  if (contrato.pagos && contrato.pagos.length > 0) {
    doc.fontSize(tamanosTexto.subseccionPequena)
      .fillColor(colores.primario)
      .font(fuentes.bold)
      .text('HISTORIAL DE PAGOS REALIZADOS')
      .moveDown(0.5);

    contrato.pagos.forEach((pago) => {
      const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-ES');
      const monto = parseFloat(pago.monto).toFixed(2);
      
      doc.fontSize(tamanosTexto.pequeno)
        .fillColor(colores.texto)
        .font(fuentes.normal)
        .text(`• Fecha: ${fechaPago} | Monto: $${monto} | Método: ${pago.metodo_pago || 'N/A'}`, 70);
      
      doc.moveDown(0.3);
    });
  }

  // ============================================
  // PÁGINAS 4+: TÉRMINOS Y CONDICIONES
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  // SECCIÓN 11: TÉRMINOS Y CONDICIONES
  doc.fontSize(tamanosTexto.subseccion)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('TÉRMINOS Y CONDICIONES DEL CONTRATO')
    .moveDown(1);

  doc.fontSize(tamanosTexto.muyPequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal);

  const terminos = [
    {
      titulo: 'ARTÍCULO 1. RESERVA, DEPÓSITO Y PAGOS',
      contenido: 'Se requiere un depósito no reembolsable de $500.00 para reservar la fecha del evento. Debe completarse un pago de $1,000.00 dentro de los diez (10) días posteriores a la reserva. Los pagos mensuales de al menos $500.00 son obligatorios hasta liquidar el saldo. El pago completo debe estar completado al menos quince (15) días hábiles antes del evento. Se aceptan pagos con Visa y MasterCard hasta 30 días antes del evento con un cargo del 3.8%. No se acepta American Express. Todos los pagos son no reembolsables.'
    },
    {
      titulo: 'ARTÍCULO 2. POLÍTICA DE CANCELACIÓN',
      contenido: 'Todas las cancelaciones deben presentarse por escrito mediante correo electrónico. El Cliente renuncia a todos los pagos realizados y acepta no disputar ni revertir ningún pago. No se emitirán reembolsos bajo ninguna circunstancia.'
    },
    {
      titulo: 'ARTÍCULO 3. SERVICIOS DE TERCEROS',
      contenido: 'La Compañía no es responsable por fallas o retrasos en servicios subcontratados a terceros como limosinas, fotógrafos, videógrafos, bailarines o entretenedores. Todos los servicios adicionales deben coordinarse a través de proveedores aprobados por la Compañía.'
    },
    {
      titulo: 'ARTÍCULO 4. RESPONSABILIDAD POR DAÑOS',
      contenido: 'El Cliente asume completa responsabilidad por cualquier daño a la propiedad, mobiliario o infraestructura causado por invitados, familiares o proveedores externos. Los costos de reparación serán facturados al Cliente y deben pagarse de inmediato.'
    },
    {
      titulo: 'ARTÍCULO 5. POLÍTICA DE DECORACIÓN Y SUMINISTROS',
      contenido: 'Todas las decoraciones o materiales traídos por el Cliente requieren aprobación previa. Las entregas solo se permiten los miércoles entre 2:00 PM y 5:00 PM. La Compañía no es responsable por artículos personales perdidos o dañados. El tiempo del personal para instalación o retiro puede ser cobrado al Cliente.'
    },
    {
      titulo: 'ARTÍCULO 6. HORARIO Y ACCESO AL EVENTO',
      contenido: 'El Cliente e invitados solo pueden ingresar al local a la hora establecida en el contrato. Los cambios en los detalles del evento solo se permiten hasta diez (10) días antes del evento. Los artistas o proveedores externos no aprobados por la Compañía están prohibidos por razones de seguro.'
    },
    {
      titulo: 'ARTÍCULO 7. AUTORIZACIÓN DE USO DE MEDIOS',
      contenido: 'El Cliente autoriza a la Compañía a tomar fotografías y videos del evento y usarlos con fines promocionales en redes sociales, sitio web u otros materiales de marketing.'
    },
    {
      titulo: 'ARTÍCULO 8. FUERZA MAYOR',
      contenido: 'La Compañía no es responsable por incumplimiento causado por eventos fuera de su control, incluyendo desastres naturales, cortes de energía, pandemias o restricciones gubernamentales.'
    },
    {
      titulo: 'ARTÍCULO 9. LIMITACIÓN DE RESPONSABILIDAD',
      contenido: 'La responsabilidad total de la Compañía no excederá el monto total pagado por el Cliente. La Compañía no será responsable por daños indirectos o consecuentes.'
    },
    {
      titulo: 'ARTÍCULO 10. LEY APLICABLE Y JURISDICCIÓN',
      contenido: 'Este Contrato se regirá por las leyes del Estado de Florida. Cualquier disputa será resuelta en los tribunales del Condado de Miami-Dade.'
    }
  ];

  terminos.forEach((termino, index) => {
    doc.font(fuentes.bold)
      .text(termino.titulo, 50);
    
    doc.font(fuentes.normal)
      .text(termino.contenido, 50, undefined, { 
        align: 'justify',
        lineGap: 2
      })
      .moveDown(0.7);

    if (doc.y > 680 && index < terminos.length - 1) {
      agregarPaginaConFondo();
      dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);
    }
  });

  // ============================================
  // PÁGINA FINAL: FIRMAS
  // ============================================
  agregarPaginaConFondo();
  dibujarEncabezadoPagina(doc, contrato.codigo_contrato, config);

  // SECCIÓN 12: FIRMAS Y ACEPTACIÓN
  doc.fontSize(tamanosTexto.subseccion)
    .fillColor(colores.primario)
    .font(fuentes.bold)
    .text('FIRMAS Y ACEPTACIÓN DEL CONTRATO', { align: 'center' })
    .moveDown(1);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.normal)
    .text('Las partes firmantes declaran haber leído, comprendido y aceptado todos los términos y condiciones establecidos en el presente contrato.', { align: 'center', width: 512 })
    .moveDown(3);

  const yFirmas = doc.y;

  // FIRMA DEL CLIENTE
  doc.strokeColor(colores.borde)
    .lineWidth(1)
    .moveTo(80, yFirmas)
    .lineTo(230, yFirmas)
    .stroke();

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.texto)
    .font(fuentes.bold)
    .text('FIRMA DEL CONTRATANTE', 80, yFirmas + 15, { width: 150, align: 'center' });

  doc.font(fuentes.normal)
    .text(contrato.clientes?.nombre_completo || '', 80, yFirmas + 35, { width: 150, align: 'center' })
    .text(`Fecha: ${new Date(contrato.fecha_firma).toLocaleDateString('es-ES')}`, 80, yFirmas + 50, { width: 150, align: 'center' });

  // FIRMA DE LA EMPRESA
  doc.strokeColor(colores.borde)
    .moveTo(360, yFirmas)
    .lineTo(510, yFirmas)
    .stroke();

  doc.font(fuentes.bold)
    .text('DIAMONDSISTEM', 360, yFirmas + 15, { width: 150, align: 'center' });

  doc.font(fuentes.normal)
    .text('Representante Autorizado', 360, yFirmas + 35, { width: 150, align: 'center' })
    .text(`Fecha: ${new Date(contrato.fecha_firma).toLocaleDateString('es-ES')}`, 360, yFirmas + 50, { width: 150, align: 'center' });

  // PIE DE PÁGINA
  dibujarPiePagina(doc, config, ` | Código de Acceso Cliente: ${contrato.codigo_acceso_cliente}`);

  return doc;
}

module.exports = { generarPDFContrato };
