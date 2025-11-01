const PDFDocument = require('pdfkit');

/**
 * Genera una Factura Proforma (oferta/contrato)
 * @param {Object} datos - Puede ser una oferta o un contrato
 * @param {String} tipo - 'oferta' o 'contrato'
 * @returns {PDFDocument} - Documento PDF
 */
function generarFacturaProforma(datos, tipo = 'oferta') {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Configuración de colores
  const colorPrimario = '#4F46E5';
  const colorSecundario = '#64748B';
  const colorTexto = '#1E293B';
  const colorExito = '#10B981';

  // ENCABEZADO
  doc.fontSize(28)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('💎 DIAMONDSISTEM', { align: 'center' });

  doc.fontSize(11)
    .fillColor(colorSecundario)
    .font('Helvetica')
    .text('Sistema de Gestión de Eventos Profesionales', { align: 'center' })
    .moveDown(0.3);

  doc.fontSize(10)
    .text('Tel: +1 (809) 555-0100 | Email: info@diamondsistem.com', { align: 'center' })
    .text('www.diamondsistem.com', { align: 'center' })
    .moveDown(1.5);

  // TÍTULO DE DOCUMENTO
  doc.fontSize(20)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('FACTURA PROFORMA', { align: 'center' })
    .moveDown(0.5);

  doc.fontSize(9)
    .fillColor(colorSecundario)
    .font('Helvetica-Oblique')
    .text('(Documento no fiscal - Solo para fines informativos)', { align: 'center' })
    .moveDown(1.5);

  // INFORMACIÓN DEL DOCUMENTO
  const yInfo = doc.y;

  // Rectángulo de fondo para información
  doc.roundedRect(50, yInfo, 512, 80, 5)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc.fillColor(colorTexto)
    .font('Helvetica')
    .fontSize(10);

  // Columna izquierda
  const xIzq = 65;
  const yStart = yInfo + 15;

  doc.font('Helvetica-Bold').text('Documento:', xIzq, yStart);
  doc.font('Helvetica').text(tipo === 'oferta' ? datos.codigo_oferta : datos.codigo_contrato, xIzq + 80, yStart);

  doc.font('Helvetica-Bold').text('Fecha Emisión:', xIzq, yStart + 20);
  doc.font('Helvetica').text(
    new Date(datos.fecha_creacion).toLocaleDateString('es-ES'),
    xIzq + 80,
    yStart + 20
  );

  doc.font('Helvetica-Bold').text('Estado:', xIzq, yStart + 40);
  doc.fillColor(datos.estado === 'aceptada' || datos.estado === 'activo' ? colorExito : '#F59E0B')
    .font('Helvetica-Bold')
    .text(datos.estado.toUpperCase(), xIzq + 80, yStart + 40);

  // Columna derecha
  const xDer = 320;
  
  doc.fillColor(colorTexto)
    .font('Helvetica-Bold')
    .text('Cliente:', xDer, yStart);
  doc.font('Helvetica').text(datos.clientes?.nombre_completo || 'N/A', xDer + 60, yStart);

  doc.font('Helvetica-Bold').text('Email:', xDer, yStart + 20);
  doc.font('Helvetica').text(datos.clientes?.email || 'N/A', xDer + 60, yStart + 20);

  doc.font('Helvetica-Bold').text('Teléfono:', xDer, yStart + 40);
  doc.font('Helvetica').text(datos.clientes?.telefono || 'N/A', xDer + 60, yStart + 40);

  doc.moveDown(6);

  // LÍNEA DIVISORIA
  doc.strokeColor('#E2E8F0')
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(562, doc.y)
    .stroke();

  doc.moveDown(1);

  // INFORMACIÓN DEL EVENTO
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('DETALLES DEL EVENTO')
    .moveDown(0.5);

  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica');

  const fechaEvento = tipo === 'oferta' ? datos.fecha_evento : datos.fecha_evento;
  const lugarEvento = tipo === 'oferta' ? (datos.lugar_evento || 'Por definir') : (datos.ofertas?.lugar_evento || 'Por definir');
  const cantidadInvitados = tipo === 'oferta' ? datos.cantidad_invitados : datos.cantidad_invitados;

  doc.text(`📅 Fecha del Evento: ${new Date(fechaEvento).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, { indent: 10 });

  doc.text(`📍 Lugar: ${lugarEvento}`, { indent: 10 });
  doc.text(`👥 Cantidad de Invitados: ${cantidadInvitados} personas`, { indent: 10 });

  if (tipo === 'contrato') {
    doc.text(`🕐 Horario: ${datos.hora_inicio} - ${datos.hora_fin}`, { indent: 10 });
  }

  doc.moveDown(1.5);

  // TABLA DE SERVICIOS
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('SERVICIOS CONTRATADOS')
    .moveDown(0.5);

  // Encabezado de tabla
  const yTabla = doc.y;
  const alturaFila = 25;

  // Fondo del encabezado
  doc.rect(50, yTabla, 512, alturaFila)
    .fillAndStroke(colorPrimario, colorPrimario);

  doc.fontSize(10)
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold');

  doc.text('DESCRIPCIÓN', 60, yTabla + 8, { width: 400, continued: false });
  doc.text('CANTIDAD', 470, yTabla + 8, { width: 80, align: 'center', continued: false });

  let yActual = yTabla + alturaFila;

  // PAQUETE BASE
  doc.fillColor(colorTexto)
    .font('Helvetica-Bold');

  const nombrePaquete = datos.paquetes?.nombre || 'N/A';

  // Fila del paquete
  doc.rect(50, yActual, 512, alturaFila)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc.fillColor(colorTexto)
    .font('Helvetica-Bold')
    .text(`📦 ${nombrePaquete}`, 60, yActual + 8, { width: 400 });
  
  doc.font('Helvetica')
    .text(cantidadInvitados, 470, yActual + 8, { width: 80, align: 'center' });

  yActual += alturaFila;

  // SERVICIOS ADICIONALES
  let servicios = [];
  
  if (tipo === 'oferta') {
    servicios = datos.ofertas_servicios_adicionales || [];
  } else {
    servicios = datos.contratos_servicios || [];
  }

  if (servicios.length > 0) {
    servicios.forEach((servicio, index) => {
      const nombreServicio = servicio.servicios?.nombre || 'Servicio';
      const cantidad = servicio.cantidad;

      // Alternar color de fondo
      if (index % 2 === 0) {
        doc.rect(50, yActual, 512, alturaFila)
          .fillAndStroke('#FFFFFF', '#E2E8F0');
      } else {
        doc.rect(50, yActual, 512, alturaFila)
          .fillAndStroke('#F8FAFC', '#E2E8F0');
      }

      doc.fillColor(colorTexto)
        .font('Helvetica')
        .text(`   • ${nombreServicio}`, 60, yActual + 8, { width: 400 });
      doc.text(cantidad, 470, yActual + 8, { width: 80, align: 'center' });

      yActual += alturaFila;

      // Nueva página si es necesario
      if (yActual > 680) {
        doc.addPage();
        yActual = 50;
      }
    });
  }

  // Verificar espacio para totales
  if (yActual > 580) {
    doc.addPage();
    yActual = 50;
  }

  doc.moveDown(2);
  yActual = doc.y;

  // SECCIÓN DE TOTALES
  const xTotalLabel = 380;
  const xTotalValor = 470;
  const anchoValor = 80;

  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica');

  // Subtotal
  const subtotal = parseFloat(datos.subtotal || 0);
  doc.text('Subtotal:', xTotalLabel, yActual, { width: 90, align: 'left' });
  doc.text(`$${subtotal.toFixed(2)}`, xTotalValor, yActual, { width: anchoValor, align: 'right' });
  yActual += 18;

  // Descuento
  const descuento = parseFloat(datos.descuento || datos.descuento_aplicado || 0);
  if (descuento > 0) {
    doc.text('Descuento:', xTotalLabel, yActual, { width: 90, align: 'left' });
    doc.fillColor('#DC2626').text(`-$${descuento.toFixed(2)}`, xTotalValor, yActual, { width: anchoValor, align: 'right' });
    doc.fillColor(colorTexto);
    yActual += 18;
  }

  // IVA
  const iva = parseFloat(datos.impuesto_monto || datos.iva || 0);
  doc.text('IVA (7%):', xTotalLabel, yActual, { width: 90, align: 'left' });
  doc.text(`$${iva.toFixed(2)}`, xTotalValor, yActual, { width: anchoValor, align: 'right' });
  yActual += 18;

  // Service Fee
  const serviceFee = parseFloat(datos.tarifa_servicio_monto || datos.service_fee || 0);
  doc.text('Cargo Servicio (18%):', xTotalLabel, yActual, { width: 90, align: 'left' });
  doc.text(`$${serviceFee.toFixed(2)}`, xTotalValor, yActual, { width: anchoValor, align: 'right' });
  yActual += 20;

  // Línea divisoria antes del total
  doc.strokeColor(colorPrimario)
    .lineWidth(2)
    .moveTo(xTotalLabel, yActual)
    .lineTo(562, yActual)
    .stroke();

  yActual += 15;

  // TOTAL FINAL
  const total = tipo === 'oferta' ? parseFloat(datos.total_final || 0) : parseFloat(datos.total_contrato || 0);

  doc.fontSize(14)
    .font('Helvetica-Bold');

  doc.fillColor(colorTexto)
    .text('TOTAL:', xTotalLabel, yActual, { width: 90, align: 'left' });

  doc.fontSize(16)
    .fillColor(colorPrimario)
    .text(`$${total.toFixed(2)}`, xTotalValor - 10, yActual, { width: anchoValor + 10, align: 'right' });

  doc.moveDown(3);

  // INFORMACIÓN DE PAGO (solo para contratos)
  if (tipo === 'contrato') {
    doc.fontSize(12)
      .fillColor(colorPrimario)
      .font('Helvetica-Bold')
      .text('INFORMACIÓN DE PAGO')
      .moveDown(0.5);

    doc.fontSize(10)
      .fillColor(colorTexto)
      .font('Helvetica');

    const totalPagado = parseFloat(datos.total_pagado || 0);
    const saldoPendiente = parseFloat(datos.saldo_pendiente || 0);

    doc.text(`💰 Total Pagado: $${totalPagado.toFixed(2)}`, { indent: 10 });
    doc.fillColor(saldoPendiente > 0 ? '#F59E0B' : colorExito)
      .text(`📊 Saldo Pendiente: $${saldoPendiente.toFixed(2)}`, { indent: 10 });

    doc.fillColor(colorTexto)
      .text(`📅 Tipo de Pago: ${datos.tipo_pago === 'contado' ? 'Contado' : 'Financiado'}`, { indent: 10 });

    if (datos.tipo_pago === 'financiado' && datos.meses_financiamiento) {
      const cuotaMensual = total / datos.meses_financiamiento;
      doc.text(`📆 Plazo: ${datos.meses_financiamiento} meses`, { indent: 10 });
      doc.text(`💵 Cuota Mensual: $${cuotaMensual.toFixed(2)}`, { indent: 10 });
    }
  }

  doc.moveDown(2);

  // NOTAS Y CONDICIONES
  doc.fontSize(12)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('NOTAS Y CONDICIONES')
    .moveDown(0.5);

  doc.fontSize(9)
    .fillColor(colorSecundario)
    .font('Helvetica');

  const notas = [
    '• Esta factura proforma no constituye un documento fiscal válido para efectos tributarios.',
    '• Los precios están sujetos a cambios hasta la firma del contrato definitivo.',
    '• Se requiere un anticipo del 50% para confirmar la reserva de la fecha.',
    '• El saldo debe liquidarse según el plan de pagos acordado.',
    '• Cancelaciones con más de 60 días: reembolso del 80%.',
    '• Los servicios están sujetos a disponibilidad hasta la confirmación del pago inicial.'
  ];

  if (tipo === 'oferta' && datos.notas_vendedor) {
    notas.push(`• Notas del vendedor: ${datos.notas_vendedor}`);
  }

  notas.forEach((nota) => {
    doc.text(nota, { indent: 10, lineGap: 2 });
  });

  // PIE DE PÁGINA
  doc.fontSize(8)
    .fillColor(colorSecundario)
    .font('Helvetica-Oblique')
    .text(
      '───────────────────────────────────────────────────────────────',
      50,
      doc.page.height - 80,
      { align: 'center', width: 512 }
    );

  doc.text(
    `Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
    50,
    doc.page.height - 65,
    { align: 'center', width: 512 }
  );

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .text(
      '¡Gracias por confiar en DiamondSistem para tu evento especial! 💎',
      50,
      doc.page.height - 45,
      { align: 'center', width: 512 }
    );

  return doc;
}

module.exports = { generarFacturaProforma };

