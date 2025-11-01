const PDFDocument = require('pdfkit');

/**
 * Genera un PDF completo del contrato con términos y condiciones
 * @param {Object} contrato - Datos del contrato con relaciones (cliente, paquete, servicios, pagos)
 * @returns {PDFDocument} - Documento PDF
 */
function generarPDFContrato(contrato) {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Configuración de fuentes y colores
  const colorPrimario = '#4F46E5'; // Indigo
  const colorSecundario = '#64748B'; // Slate
  const colorTexto = '#1E293B';

  // ENCABEZADO CON LOGO Y TÍTULO
  doc.fontSize(24)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('DIAMONDSISTEM', { align: 'center' });

  doc.fontSize(12)
    .fillColor(colorSecundario)
    .font('Helvetica')
    .text('Sistema de Gestión de Eventos', { align: 'center' })
    .moveDown(0.5);

  doc.fontSize(18)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('CONTRATO DE SERVICIOS', { align: 'center' })
    .moveDown(1);

  // INFORMACIÓN DEL CONTRATO
  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica');

  const yInicio = doc.y;
  
  // Columna izquierda
  doc.text(`Contrato No: ${contrato.codigo_contrato}`, 50, yInicio);
  doc.text(`Fecha: ${new Date(contrato.fecha_creacion).toLocaleDateString('es-ES')}`, 50);
  doc.text(`Estado: ${contrato.estado.toUpperCase()}`, 50);

  // Columna derecha
  doc.text(`Cliente: ${contrato.clientes?.nombre_completo || 'N/A'}`, 320, yInicio);
  doc.text(`Email: ${contrato.clientes?.email || 'N/A'}`, 320);
  doc.text(`Teléfono: ${contrato.clientes?.telefono || 'N/A'}`, 320);

  doc.moveDown(2);

  // LÍNEA DIVISORIA
  doc.strokeColor('#E2E8F0')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(562, doc.y)
    .stroke();

  doc.moveDown(1);

  // SECCIÓN 1: DATOS DEL EVENTO
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('1. DATOS DEL EVENTO', { underline: true })
    .moveDown(0.5);

  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica');

  doc.text(`Tipo de Evento: ${contrato.clientes?.tipo_evento || 'No especificado'}`, { indent: 20 });
  doc.text(`Fecha del Evento: ${new Date(contrato.fecha_evento).toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, { indent: 20 });
  doc.text(`Lugar: ${contrato.ofertas?.lugar_evento || 'Por definir'}`, { indent: 20 });
  doc.text(`Cantidad de Invitados: ${contrato.cantidad_invitados} personas`, { indent: 20 });
  doc.text(`Hora de Inicio: ${contrato.hora_inicio}`, { indent: 20 });
  doc.text(`Hora de Fin: ${contrato.hora_fin}`, { indent: 20 });

  doc.moveDown(1.5);

  // SECCIÓN 2: PAQUETE CONTRATADO
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('2. PAQUETE CONTRATADO', { underline: true })
    .moveDown(0.5);

  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica-Bold');

  doc.text(`Paquete: ${contrato.paquetes?.nombre || 'N/A'}`, { indent: 20 });

  doc.font('Helvetica')
    .text(`${contrato.paquetes?.descripcion || ''}`, { indent: 20 });

  doc.moveDown(0.5);

  // Servicios incluidos en el paquete
  if (contrato.paquetes?.paquetes_servicios && contrato.paquetes.paquetes_servicios.length > 0) {
    doc.font('Helvetica-Bold')
      .text('Servicios incluidos:', { indent: 20 });

    doc.font('Helvetica');
    contrato.paquetes.paquetes_servicios.forEach((ps) => {
      doc.text(`• ${ps.servicios?.nombre || 'N/A'} (x${ps.cantidad})`, { indent: 40 });
    });
  }

  doc.moveDown(1.5);

  // SECCIÓN 3: SERVICIOS ADICIONALES
  if (contrato.contratos_servicios && contrato.contratos_servicios.length > 0) {
    doc.fontSize(14)
      .fillColor(colorPrimario)
      .font('Helvetica-Bold')
      .text('3. SERVICIOS ADICIONALES', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10)
      .fillColor(colorTexto)
      .font('Helvetica');

    contrato.contratos_servicios.forEach((cs) => {
      const precioTotal = parseFloat(cs.precio_unitario) * cs.cantidad;
      doc.text(
        `• ${cs.servicios?.nombre || 'N/A'} (x${cs.cantidad}) - $${precioTotal.toFixed(2)}`,
        { indent: 20 }
      );
    });

    doc.moveDown(1.5);
  }

  // Nueva página si es necesario
  if (doc.y > 650) {
    doc.addPage();
  }

  // SECCIÓN 4: DETALLE FINANCIERO
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('4. DETALLE FINANCIERO', { underline: true })
    .moveDown(0.5);

  const subtotal = parseFloat(contrato.subtotal || 0);
  const iva = parseFloat(contrato.iva || 0);
  const serviceFee = parseFloat(contrato.service_fee || 0);
  const descuento = parseFloat(contrato.descuento_aplicado || 0);
  const totalContrato = parseFloat(contrato.total_contrato || 0);
  const totalPagado = parseFloat(contrato.total_pagado || 0);
  const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);

  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica');

  // Tabla de precios
  const yTabla = doc.y;
  
  doc.text('Subtotal:', 50, yTabla);
  doc.text(`$${subtotal.toFixed(2)}`, 400, yTabla, { align: 'right' });

  if (descuento > 0) {
    doc.text('Descuento:', 50);
    doc.fillColor('#DC2626').text(`-$${descuento.toFixed(2)}`, 400, undefined, { align: 'right' });
    doc.fillColor(colorTexto);
  }

  doc.text('IVA (7%):', 50);
  doc.text(`$${iva.toFixed(2)}`, 400, undefined, { align: 'right' });

  doc.text('Cargo por Servicio (18%):', 50);
  doc.text(`$${serviceFee.toFixed(2)}`, 400, undefined, { align: 'right' });

  doc.moveDown(0.5);

  // Línea divisoria
  doc.strokeColor('#E2E8F0')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(562, doc.y)
    .stroke();

  doc.moveDown(0.5);

  // Total
  doc.fontSize(12)
    .font('Helvetica-Bold');

  doc.text('TOTAL DEL CONTRATO:', 50);
  doc.fillColor(colorPrimario)
    .text(`$${totalContrato.toFixed(2)}`, 400, undefined, { align: 'right' });

  doc.fillColor(colorTexto)
    .fontSize(10)
    .font('Helvetica');

  doc.moveDown(0.5);

  doc.text('Total Pagado:', 50);
  doc.fillColor('#10B981').text(`$${totalPagado.toFixed(2)}`, 400, undefined, { align: 'right' });

  doc.fillColor(colorTexto);
  doc.text('Saldo Pendiente:', 50);
  doc.fillColor(saldoPendiente > 0 ? '#F59E0B' : '#10B981')
    .text(`$${saldoPendiente.toFixed(2)}`, 400, undefined, { align: 'right' });

  doc.fillColor(colorTexto);
  doc.moveDown(1.5);

  // SECCIÓN 5: PLAN DE PAGOS
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('5. PLAN DE PAGOS', { underline: true })
    .moveDown(0.5);

  doc.fontSize(10)
    .fillColor(colorTexto)
    .font('Helvetica');

  doc.text(`Tipo de Pago: ${contrato.tipo_pago === 'contado' ? 'Contado' : 'Financiado'}`, { indent: 20 });

  if (contrato.tipo_pago === 'financiado' && contrato.meses_financiamiento) {
    const cuotaMensual = totalContrato / contrato.meses_financiamiento;
    doc.text(`Plazo: ${contrato.meses_financiamiento} meses`, { indent: 20 });
    doc.text(`Cuota Mensual Aproximada: $${cuotaMensual.toFixed(2)}`, { indent: 20 });
  } else {
    doc.text('Pago completo al contado', { indent: 20 });
  }

  doc.moveDown(1);

  // Historial de pagos si existen
  if (contrato.pagos && contrato.pagos.length > 0) {
    doc.font('Helvetica-Bold')
      .text('Historial de Pagos:', { indent: 20 });

    doc.font('Helvetica');
    contrato.pagos.forEach((pago, index) => {
      const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-ES');
      doc.text(
        `${index + 1}. ${fechaPago} - $${parseFloat(pago.monto).toFixed(2)} (${pago.metodo_pago})`,
        { indent: 40 }
      );
    });
  }

  // Nueva página para términos y condiciones
  doc.addPage();

  // SECCIÓN 6: TÉRMINOS Y CONDICIONES
  doc.fontSize(14)
    .fillColor(colorPrimario)
    .font('Helvetica-Bold')
    .text('6. TÉRMINOS Y CONDICIONES', { underline: true })
    .moveDown(1);

  doc.fontSize(9)
    .fillColor(colorTexto)
    .font('Helvetica');

  const terminos = [
    {
      titulo: '6.1 OBJETO DEL CONTRATO',
      contenido: 'El presente contrato tiene por objeto la prestación de servicios de organización y ejecución de eventos, según el paquete y servicios adicionales detallados en las secciones anteriores.'
    },
    {
      titulo: '6.2 OBLIGACIONES DEL PRESTADOR',
      contenido: 'DiamondSistem se compromete a: (a) Proveer todos los servicios contratados con la calidad especificada; (b) Respetar los horarios acordados; (c) Contar con el personal capacitado necesario; (d) Mantener comunicación constante con el cliente.'
    },
    {
      titulo: '6.3 OBLIGACIONES DEL CLIENTE',
      contenido: 'El cliente se compromete a: (a) Realizar los pagos según el plan acordado; (b) Proporcionar información veraz y completa; (c) Confirmar detalles finales con 15 días de anticipación; (d) Permitir el acceso al lugar del evento con la debida anticipación.'
    },
    {
      titulo: '6.4 CONDICIONES DE PAGO',
      contenido: `Se requiere un anticipo del 50% del valor total para confirmar la reserva. El saldo restante debe pagarse ${contrato.tipo_pago === 'contado' ? 'antes del evento' : `en ${contrato.meses_financiamiento} cuotas mensuales`}. Los pagos pueden realizarse mediante transferencia bancaria, tarjeta de crédito/débito o efectivo.`
    },
    {
      titulo: '6.5 POLÍTICA DE CANCELACIÓN',
      contenido: 'Cancelaciones con más de 60 días de anticipación: reembolso del 80%. Entre 30-60 días: reembolso del 50%. Menos de 30 días: no hay reembolso del anticipo. DiamondSistem se reserva el derecho de cancelar por causas de fuerza mayor, ofreciendo reprogramación o reembolso completo.'
    },
    {
      titulo: '6.6 MODIFICACIONES AL CONTRATO',
      contenido: 'Cualquier modificación a los servicios contratados debe solicitarse por escrito con al menos 30 días de anticipación. Los cambios pueden estar sujetos a cargos adicionales según disponibilidad y naturaleza de la modificación.'
    },
    {
      titulo: '6.7 RESPONSABILIDADES',
      contenido: 'DiamondSistem no se hace responsable por: (a) Daños causados por terceros o invitados; (b) Objetos personales perdidos durante el evento; (c) Retrasos causados por el cliente o el lugar del evento; (d) Condiciones climáticas adversas en eventos al aire libre.'
    },
    {
      titulo: '6.8 GARANTÍA DE SERVICIO',
      contenido: 'Garantizamos la calidad de nuestros servicios y equipos. En caso de fallas técnicas, proporcionaremos reemplazo inmediato sin costo adicional. Si no es posible, se aplicará un descuento proporcional.'
    },
    {
      titulo: '6.9 PROTECCIÓN DE DATOS',
      contenido: 'Los datos personales proporcionados serán tratados con confidencialidad y utilizados únicamente para la gestión del evento y comunicaciones relacionadas, cumpliendo con la legislación vigente de protección de datos.'
    },
    {
      titulo: '6.10 RESOLUCIÓN DE CONFLICTOS',
      contenido: 'Cualquier disputa derivada de este contrato se resolverá de manera amigable. En caso de no llegar a un acuerdo, ambas partes se someterán a arbitraje o a la jurisdicción de los tribunales competentes.'
    }
  ];

  terminos.forEach((termino) => {
    doc.font('Helvetica-Bold')
      .text(termino.titulo, { indent: 0 });
    
    doc.font('Helvetica')
      .text(termino.contenido, { 
        indent: 0, 
        align: 'justify',
        lineGap: 3
      })
      .moveDown(0.8);

    // Nueva página si queda poco espacio
    if (doc.y > 680) {
      doc.addPage();
    }
  });

  // SECCIÓN DE FIRMAS
  doc.moveDown(2);

  // Línea divisoria antes de firmas
  if (doc.y > 600) {
    doc.addPage();
  }

  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(colorTexto)
    .text('FIRMAS Y ACEPTACIÓN DEL CONTRATO', { align: 'center' })
    .moveDown(2);

  doc.font('Helvetica');

  const yFirmas = doc.y;

  // Firma del cliente
  doc.text('_________________________', 80, yFirmas);
  doc.text('FIRMA DEL CLIENTE', 80, yFirmas + 20, { width: 150, align: 'center' });
  doc.text(contrato.clientes?.nombre_completo || '', 80, yFirmas + 35, { width: 150, align: 'center' });

  // Firma del vendedor
  doc.text('_________________________', 340, yFirmas);
  doc.text('DIAMONDSISTEM', 340, yFirmas + 20, { width: 150, align: 'center' });
  doc.text('Representante Autorizado', 340, yFirmas + 35, { width: 150, align: 'center' });

  doc.moveDown(3);

  // Pie de página
  doc.fontSize(8)
    .fillColor(colorSecundario)
    .text(
      `Fecha de emisión: ${new Date().toLocaleDateString('es-ES')} | Código de acceso cliente: ${contrato.codigo_acceso_cliente}`,
      50,
      doc.page.height - 50,
      { align: 'center', width: doc.page.width - 100 }
    );

  return doc;
}

module.exports = { generarPDFContrato };

