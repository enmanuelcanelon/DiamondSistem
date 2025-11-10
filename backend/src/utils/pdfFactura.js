const PDFDocument = require('pdfkit');

// ============================================
// CONFIGURACIÓN VISUAL - DIAMOND VENUE STYLE
// ============================================

const CONFIG_VISUAL = {
  // COLORES (Basados en las imágenes de Diamond Venue)
  colores: {
    fondoOscuro: '#3A103A',        // Morado oscuro (fondo principal)
    textoClaro: '#E0D8C0',         // Beige/claro (texto principal)
    dorado: '#C0A060',             // Dorado/bronce (acentos)
    doradoClaro: '#D4AF37',        // Dorado más claro
    moradoClaro: '#5A2A5A',        // Morado más claro para elementos
    borde: '#8B6F8B',              // Borde morado
    textoOscuro: '#2A0A2A',        // Texto oscuro sobre fondos claros
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
    seccion: 16,                // Títulos de secciones
    subseccion: 14,             // Subtítulos de secciones
    normal: 11,                 // Texto normal
    pequeno: 10,                // Texto pequeño
    muyPequeno: 9,              // Pie de página, notas
  },

  // MÁRGENES Y ESPACIADO
  layout: {
    margenSuperior: 50,
    margenInferior: 50,
    margenIzquierdo: 50,
    margenDerecho: 50,
    anchoUtil: 512,             // 612 - 50 - 50 = 512
    alturaEncabezado: 120,
    alturaPiePagina: 50,
    espaciadoSeccion: 1.5,
    espaciadoParrafo: 0.5,
  },
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Dibuja la página 1 completa con el diseño de Diamond Venue
 */
function dibujarPagina1(doc, nombrePaquete, config) {
  const { colores, tamanosTexto, fuentes } = config;

  // Fondo morado oscuro uniforme para toda la página
  doc.rect(0, 0, 612, 792)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  // ============================================
  // PARTE SUPERIOR: Encabezado
  // ============================================
  
  // "DIAMOND" - Grande, bold, mayúsculas, centrado
  doc.fontSize(36)
    .fillColor(colores.textoClaro) // Beige/dorado claro
    .font(fuentes.bold)
    .text('DIAMOND', { align: 'center', y: 50 });

  // "VENUE AT DORAL" - Más pequeño, centrado
  doc.fontSize(14)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('VENUE AT DORAL', { align: 'center', y: 95 });

  // Información de contacto - Tres líneas centradas
  doc.fontSize(10)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('(786) 332-7065', { align: 'center', y: 120 })
    .text('diamondvenuedoral', { align: 'center', y: 140 })
    .text('www.diamondvenuedoral.com', { align: 'center', y: 160 });

  // ============================================
  // PARTE CENTRAL: Título del paquete
  // ============================================
  
  // "Diamond" (no DIAMOND) - Cursiva, grande, dorado brillante, centrado verticalmente
  // Posición aproximada en el centro vertical de la página (alrededor de y: 350-400)
  doc.fontSize(48)
    .fillColor(colores.doradoClaro) // Dorado más brillante/saturado
    .font(fuentes.italic)
    .text('Diamond', { align: 'center', y: 350 });

  // ============================================
  // PARTE INFERIOR: Banner con "PACKAGE"
  // ============================================
  
  // Banner morado más claro
  const yBanda = 500;
  const alturaBanda = 40;
  const anchoBanda = 500; // Deja márgenes a los lados
  const xBanda = (612 - anchoBanda) / 2; // Centrado horizontalmente
  
  doc.rect(xBanda, yBanda, anchoBanda, alturaBanda)
    .fillAndStroke(colores.moradoClaro, colores.moradoClaro);

  // "PACKAGE" dentro del banner - Centrado horizontal y verticalmente
  doc.fontSize(18)
    .fillColor(colores.textoClaro) // Beige/dorado claro
    .font(fuentes.bold)
    .text('PACKAGE', { 
      align: 'center', 
      y: yBanda + (alturaBanda / 2) - 6 // Centrado verticalmente en el banner
    });

  // Ajustar posición Y para continuar
  doc.y = yBanda + alturaBanda + 50;
}

/**
 * Dibuja una sección de servicios
 * @param {Boolean} enFondoOscuro - Si está en la parte con fondo morado oscuro
 */
function dibujarSeccionServicios(doc, titulo, servicios, config, enFondoOscuro = true) {
  const { colores, tamanosTexto, fuentes } = config;

  // Título de sección
  doc.fontSize(tamanosTexto.seccion)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text(titulo, { underline: true })
    .moveDown(0.3);

  // Color del texto según el fondo
  const colorTexto = enFondoOscuro ? colores.textoClaro : colores.textoOscuro;

  // Lista de servicios
  if (servicios && servicios.length > 0) {
    servicios.forEach(servicio => {
      const nombre = servicio.servicios?.nombre || servicio.nombre || 'Servicio';
      const descripcion = servicio.servicios?.descripcion || servicio.descripcion || nombre;
      
      doc.fontSize(tamanosTexto.normal)
        .fillColor(colorTexto)
        .font(fuentes.normal)
        .text(descripcion, { width: 512, lineGap: 2 });
      
      doc.moveDown(0.3);
    });
  } else {
    doc.fontSize(tamanosTexto.normal)
      .fillColor(colorTexto)
      .font(fuentes.normal)
      .text('Incluido en el paquete.', { width: 512 });
  }

  doc.moveDown(0.8);
}

/**
 * Organiza servicios por categoría
 */
function organizarServiciosPorCategoria(datos) {
  // Manejar tanto ofertas como contratos
  const serviciosAdicionales = datos.ofertas_servicios_adicionales || datos.contratos_servicios || [];
  const serviciosPaquete = datos.paquetes?.paquetes_servicios || [];

  // Combinar servicios del paquete y adicionales
  const todosServicios = [
    ...serviciosPaquete.map(ps => ({
      ...ps.servicios,
      categoria: ps.servicios?.categoria,
      esPaquete: true,
      descripcion: ps.servicios?.descripcion || ps.servicios?.nombre
    })),
    ...serviciosAdicionales.map(os => {
      const servicio = os.servicios || os;
      return {
        ...servicio,
        categoria: servicio?.categoria,
        esPaquete: false,
        descripcion: servicio?.descripcion || servicio?.nombre
      };
    })
  ];

  // Organizar por categorías según el formato
  const organizados = {
    venue: [], // Servicios del salón/paquete base
    cake: [],  // Servicios de torta
    decoration: [], // Decoración
    specials: [], // Servicios especiales (fotografía, equipos, etc.)
    barService: [], // Bebidas
    catering: [], // Comida (excepto cake)
    serviceCoord: [] // Coordinación y servicio
  };

  todosServicios.forEach(servicio => {
    const categoria = servicio.categoria?.toLowerCase() || '';
    const nombre = servicio.nombre?.toLowerCase() || '';

    if (nombre.includes('cake') || nombre.includes('torta')) {
      organizados.cake.push(servicio);
    } else if (categoria.includes('decoración') || categoria.includes('decoration')) {
      organizados.decoration.push(servicio);
    } else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor')) {
      organizados.barService.push(servicio);
    } else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food')) {
      organizados.catering.push(servicio);
    } else if (categoria.includes('fotografía') || categoria.includes('video') || categoria.includes('equipo') || categoria.includes('photobooth') || categoria.includes('hora loca')) {
      organizados.specials.push(servicio);
    } else if (categoria.includes('coordinación') || categoria.includes('coordinador') || categoria.includes('mesero') || categoria.includes('bartender')) {
      organizados.serviceCoord.push(servicio);
    } else {
      // Por defecto, servicios especiales
      organizados.specials.push(servicio);
    }
  });

  return organizados;
}

/**
 * Formatea moneda
 */
function formatearMoneda(monto) {
  return `$${parseFloat(monto || 0).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

// ============================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN
// ============================================

/**
 * Genera una Factura Proforma (oferta) en formato Diamond Venue
 * @param {Object} datos - Datos de la oferta o contrato
 * @param {String} tipo - 'oferta' o 'contrato'
 * @returns {PDFDocument} - Documento PDF
 */
function generarFacturaProforma(datos, tipo = 'oferta') {
  const config = CONFIG_VISUAL;
  const { colores, tamanosTexto, fuentes, layout } = config;

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  // Fondo morado oscuro para parte superior de la página
  function dibujarFondoMorado(altura = 400) {
    doc.rect(0, 0, 612, altura)
      .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);
  }

  // Fondo blanco para parte inferior
  function dibujarFondoBlanco(yInicio, altura = 392) {
    doc.rect(0, yInicio, 612, altura)
      .fillAndStroke('#FFFFFF', '#FFFFFF');
  }

  // ============================================
  // PÁGINA 1: ENCABEZADO Y TÍTULO DEL PAQUETE
  // ============================================
  const nombrePaquete = datos.paquetes?.nombre || 'Deluxe Package';
  
  // Extraer solo "Diamond" del nombre del paquete (ej: "Diamond Deluxe Package" -> "Diamond")
  const nombrePaqueteLimpio = nombrePaquete.includes('Diamond') 
    ? 'Diamond' 
    : nombrePaquete.split(' ')[0] || 'Diamond';
  
  dibujarPagina1(doc, nombrePaqueteLimpio, config);

  // ============================================
  // PÁGINA 2: DETALLES DEL PAQUETE
  // ============================================
  doc.addPage();
  
  // Parte superior con fondo morado (aproximadamente 60% de la página)
  const alturaFondoMorado = 480;
  dibujarFondoMorado(alturaFondoMorado);
  
  // Parte inferior con fondo blanco
  dibujarFondoBlanco(alturaFondoMorado, 792 - alturaFondoMorado);
  
  doc.y = 50;

  doc.fontSize(tamanosTexto.subtituloGrande)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text('Deluxe Package', { align: 'center' })
    .moveDown(1.5);

  // Organizar servicios por categoría
  const serviciosOrganizados = organizarServiciosPorCategoria(datos);

  // Secciones en fondo morado (parte superior)
  // Venue
  dibujarSeccionServicios(doc, 'Venue', serviciosOrganizados.venue.length > 0 ? serviciosOrganizados.venue : [{
    nombre: 'Elegant table setting with beautiful centerpieces, runners, charger plates napkins and rings.',
    descripcion: 'Elegant table setting with beautiful centerpieces, runners, charger plates napkins and rings.'
  }], config, true);

  // Cake
  dibujarSeccionServicios(doc, 'Cake', serviciosOrganizados.cake.length > 0 ? serviciosOrganizados.cake : [{
    nombre: 'Cake decorated with buttercream.',
    descripcion: 'Cake decorated with buttercream.'
  }], config, true);

  // Decoration
  dibujarSeccionServicios(doc, 'Decoration', serviciosOrganizados.decoration.length > 0 ? serviciosOrganizados.decoration : [{
    nombre: 'Stage Decor. Uplighting throughout venue. Centerpieces. Formal table setting (runners, chargers, cloth napkins, glassware).',
    descripcion: 'Stage Decor. Uplighting throughout venue. Centerpieces. Formal table setting (runners, chargers, cloth napkins, glassware).'
  }], config, true);

  // Specials
  dibujarSeccionServicios(doc, 'Specials', serviciosOrganizados.specials.length > 0 ? serviciosOrganizados.specials : [], config, true);

  // Bar Service
  dibujarSeccionServicios(doc, 'Bar Service', serviciosOrganizados.barService.length > 0 ? serviciosOrganizados.barService : [{
    nombre: 'Premium selection of liquors (whiskey, rum, vodka and wines), cocktails and soft drinks.',
    descripcion: 'Premium selection of liquors (whiskey, rum, vodka and wines), cocktails and soft drinks.'
  }], config, true);

  // Catering
  dibujarSeccionServicios(doc, 'Catering', serviciosOrganizados.catering.length > 0 ? serviciosOrganizados.catering : [{
    nombre: 'Gourmet dinner served. Cheese Table. Appetizers.',
    descripcion: 'Gourmet dinner served. Cheese Table. Appetizers.'
  }], config, true);

  // Si el contenido se pasa del fondo morado, ajustar posición para la parte blanca
  if (doc.y >= alturaFondoMorado - 20) {
    doc.y = alturaFondoMorado + 30;
  }

  // Secciones en fondo blanco (parte inferior)
  // Service Coord & Design
  dibujarSeccionServicios(doc, 'Service Coord & Design', serviciosOrganizados.serviceCoord.length > 0 ? serviciosOrganizados.serviceCoord : [{
    nombre: 'Full set up & break down. Event Coordinator. Waiters & Bartender. Event planning & coordination are included.',
    descripcion: 'Full set up & break down. Event Coordinator. Waiters & Bartender. Event planning & coordination are included.'
  }], config, false);

  // Fees
  doc.fontSize(tamanosTexto.seccion)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text('Fees', { underline: true })
    .moveDown(0.3);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.textoOscuro)
    .font(fuentes.normal)
    .text('Package prices subject to 7% tax & 18% service fee', { width: 512 })
    .moveDown(1);

  // ============================================
  // PÁGINA 3: EVENT DETAILS Y PRICING
  // ============================================
  doc.addPage();
  dibujarFondoMorado(792);
  doc.y = 50;

  // Event Details
  doc.fontSize(tamanosTexto.subtituloGrande)
    .fillColor(colores.dorado)
    .font(fuentes.italic)
    .text('Event Details', { align: 'center', underline: true })
    .moveDown(1);

  const nombreCliente = datos.clientes?.nombre_completo || 'N/A';
  const nombreVendedor = datos.vendedores?.nombre_completo || datos.vendedor?.nombre_completo || 'N/A';
  const tipoEvento = datos.clientes?.tipo_evento || 'Event';
  const fechaEvento = new Date(datos.fecha_evento);
  // Formatear horas
  let horaInicio = '8:00PM';
  let horaFin = '1:00AM';
  
  if (datos.hora_inicio) {
    const hora = new Date(datos.hora_inicio);
    const horas = hora.getHours();
    const minutos = hora.getMinutes();
    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
    horaInicio = `${horas12}:${minutos.toString().padStart(2, '0')}${periodo}`;
  }
  
  if (datos.hora_fin) {
    const hora = new Date(datos.hora_fin);
    const horas = hora.getHours();
    const minutos = hora.getMinutes();
    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
    horaFin = `${horas12}:${minutos.toString().padStart(2, '0')}${periodo}`;
  }
  const cantidadInvitados = datos.cantidad_invitados || 0;
  const emailCliente = datos.clientes?.email || '';
  const telefonoCliente = datos.clientes?.telefono || '';

  const detalles = [
    { label: 'Name:', value: `${nombreCliente} (Attended by ${nombreVendedor})` },
    { label: 'Event:', value: tipoEvento },
    { label: 'Location:', value: 'Diamond Venue at Doral, 4747 NW 79th Ave 2nd Floor, Doral, FL 33166' },
    { label: 'Date:', value: fechaEvento.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }) },
    { label: 'Time:', value: `${horaInicio} to ${horaFin}` },
    { label: 'Number of Guests:', value: cantidadInvitados.toString() },
    { label: 'Email:', value: emailCliente },
    { label: 'Phone:', value: telefonoCliente }
  ];

  detalles.forEach(detalle => {
    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.textoClaro)
      .font(fuentes.bold)
      .text(detalle.label, 50, doc.y, { width: 150 })
      .font(fuentes.normal)
      .text(detalle.value, 200, doc.y, { width: 350 });
    doc.moveDown(0.6);
  });

  doc.moveDown(1.5);

  // Pricing
  doc.fontSize(tamanosTexto.subtituloGrande)
    .fillColor(colores.dorado)
    .font(fuentes.italic)
    .text('Pricing', { align: 'center', underline: true })
    .moveDown(1);

  // Calcular precios
  const precioPaquete = parseFloat(datos.subtotal || datos.precio_base || datos.precio_paquete_base || 0);
  const ajusteTemporada = parseFloat(datos.ajuste_temporada || datos.ajuste_temporada_custom || 0);
  const precioTemporada = precioPaquete + ajusteTemporada;
  const descuento = parseFloat(datos.descuento || 0);
  const precioEspecial = precioTemporada - descuento;
  const impuesto = parseFloat(datos.impuesto_monto || 0);
  const serviceFee = parseFloat(datos.tarifa_servicio_monto || 0);
  const total = parseFloat(datos.total_final || 0);
  
  // Obtener primer pago si existe
  const primerPago = datos.pagos && datos.pagos.length > 0 
    ? parseFloat(datos.pagos[0].monto || 0) 
    : 0;
  const fechaPrimerPago = datos.pagos && datos.pagos.length > 0 && datos.pagos[0].fecha_pago
    ? new Date(datos.pagos[0].fecha_pago).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const totalRestante = total - primerPago;

  const precios = [
    { label: 'Package Price:', value: formatearMoneda(precioPaquete) },
    { label: 'TEMP PRICE:', value: formatearMoneda(precioEspecial) },
    { label: '7% Tax:', value: formatearMoneda(impuesto) },
    { label: '18% Service fee:', value: formatearMoneda(serviceFee) },
    { label: 'TOTAL TO PAY:', value: formatearMoneda(total), bold: true },
    { label: `1º Payment (${fechaPrimerPago}):`, value: `-${formatearMoneda(primerPago)} (zelle)` },
    { label: 'TOTAL REMAINING TO PAY:', value: formatearMoneda(totalRestante), bold: true }
  ];

  precios.forEach(precio => {
    const xLabel = 50;
    const xValue = 400;
    const fontSize = precio.bold ? tamanosTexto.normal + 1 : tamanosTexto.normal;
    const fontStyle = precio.bold ? fuentes.bold : fuentes.normal;

    doc.fontSize(fontSize)
      .fillColor(colores.textoClaro)
      .font(fontStyle)
      .text(precio.label, xLabel, doc.y, { width: 350 })
      .text(precio.value, xValue, doc.y, { width: 150, align: 'right' });
    
    doc.moveDown(0.5);
  });

  doc.moveDown(1);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('**The total amount is required to be paid at least 15 days prior to the event\'s date.**', 
      { align: 'center', width: 512 });

  // ============================================
  // PÁGINA 4: TÉRMINOS Y CONDICIONES
  // ============================================
  doc.addPage();
  dibujarFondoMorado(792);
  doc.y = 50;

  doc.fontSize(tamanosTexto.titulo)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text('BANQUET HALL SERVICE AGREEMENT', { align: 'center', underline: true })
    .moveDown(1);

  doc.fontSize(tamanosTexto.seccion)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text('TERMS AND CONDITIONS OF THE CONTRACT', { align: 'center' })
    .moveDown(0.8);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('"Company" refers to the entity that provides the services for the execution of the contracted event, and "Client" refers to the person or entity that hires the services for the realization of their event. "Contract" refers to the set of Terms and Conditions contained in this document, which both parties—the Company and the Client—agree to comply with.', 
      { width: 512, lineGap: 3 })
    .moveDown(1);

  // Términos y condiciones (del FORMATO_DIAMOND.md)
  const terminos = [
    {
      titulo: 'RESERVATION, DEPOSIT, AND PAYMENT TERMS',
      texto: 'A non-refundable deposit of $500 is required to reserve the event date. A payment of $1,000 must be completed within ten (10) days after the reservation. Monthly payments of at least $500 are required thereafter until the total balance is paid. The full payment must be completed at least fifteen (15) business days before the event. Visa and MasterCard payments are accepted only up to 30 days prior to the event date with a 3.8% fee. American Express is not accepted. **All payments are non-refundable.**'
    },
    {
      titulo: 'EVENT CANCELLATION POLICY',
      texto: 'All cancellations must be submitted in writing via email. The Client forfeits all payments made and agrees not to dispute or reverse any payment. No refunds will be issued under any circumstances.'
    },
    {
      titulo: 'THIRD-PARTY SERVICES',
      texto: 'The Company is not responsible for failures or delays of services subcontracted to third-party vendors such as limousines, photographers, videographers, dancers, or entertainers. All additional services must be arranged through the Company\'s approved vendors.'
    },
    {
      titulo: 'CLIENT RESPONSIBILITY FOR DAMAGES',
      texto: 'The Client assumes full responsibility for any damage to the property, furniture, or infrastructure caused by guests, family members, or external vendors. Repair costs will be invoiced to the Client and must be paid promptly.'
    },
    {
      titulo: 'DECORATION AND SUPPLIES POLICY',
      texto: 'All decorations or materials brought by the Client require prior approval. Delivery is only allowed on Wednesdays between 2:00 PM and 5:00 PM. The Company is not responsible for lost or damaged personal items. Staff time for setup or removal may be charged to the Client.'
    },
    {
      titulo: 'EVENT SCHEDULE AND ACCESS',
      texto: 'Client and guests may only enter the venue at the time stated in the event contract. Changes to event details are allowed only up to ten (10) days before the event. External entertainers or vendors not approved by the Company are prohibited for insurance reasons.'
    },
    {
      titulo: 'MEDIA RELEASE AUTHORIZATION',
      texto: 'The Client authorizes the Company to take photos and videos of the event and use them for promotional purposes on social media, websites, or other marketing materials.'
    },
    {
      titulo: 'FORCE MAJEURE',
      texto: 'The Company is not liable for non-performance caused by events beyond its control, including natural disasters, power outages, pandemics, or government restrictions.'
    },
    {
      titulo: 'LIMITATION OF LIABILITY',
      texto: 'The Company\'s total liability shall not exceed the total amount paid by the Client. The Company shall not be liable for indirect or consequential damages.'
    },
    {
      titulo: 'GOVERNING LAW',
      texto: 'This Agreement shall be governed by the laws of the State of Florida. Any disputes shall be resolved in Miami-Dade County courts.'
    },
    {
      titulo: 'Non-Refundable and No Chargeback Agreement',
      texto: 'The Client agrees and accepts that all payments made to Revolution Party Venues are final and non-refundable, under any circumstances, including event cancellation, postponement, or dissatisfaction with services. For payments made with credit cards, the cardholder further agrees not to dispute, cancel, or request any chargeback through the issuing bank or credit card company for any reason related to this transaction. Any disputes will be handled directly with the company according to the signed event agreement.'
    }
  ];

  terminos.forEach((termino, index) => {
    if (doc.y > 700) {
      doc.addPage();
      dibujarFondoMorado(792);
      doc.y = 50;
    }

    doc.fontSize(tamanosTexto.normal)
      .fillColor(colores.dorado)
      .font(fuentes.bold)
      .text(`${index + 1}. ${termino.titulo}`, { width: 512 })
      .moveDown(0.3);

    doc.fontSize(tamanosTexto.pequeno)
      .fillColor(colores.textoClaro)
      .font(fuentes.normal)
      .text(termino.texto, { width: 512, lineGap: 2 })
      .moveDown(0.8);
  });

  doc.moveDown(1);

  // Acceptance and Signature
  doc.fontSize(tamanosTexto.seccion)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text('ACCEPTANCE AND SIGNATURE', { align: 'center' })
    .moveDown(0.5);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('**By signing below or confirming via email, the Client agrees to all terms and conditions of this Agreement.**', 
      { align: 'center', width: 512 })
    .moveDown(1);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.dorado)
    .font(fuentes.bold)
    .text('REQUIRED FIELDS:', { width: 512 })
    .moveDown(0.5);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('CLIENT NAME: ________________________________', { width: 512 })
    .moveDown(1);

  // Tabla de firmas
  const yFirmas = doc.y;
  doc.strokeColor(colores.dorado)
    .lineWidth(1)
    .moveTo(50, yFirmas)
    .lineTo(562, yFirmas)
    .stroke();

  doc.moveDown(0.5);

  // Columnas de firmas
  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('__________________________________________', 50, doc.y, { width: 240 })
    .text('__________________________________________', 322, doc.y, { width: 240 });

  doc.moveDown(0.3);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('Client Signature', 50, doc.y, { width: 240 })
    .text('Company representative', 322, doc.y, { width: 240 });

  doc.moveDown(0.5);

  doc.fontSize(tamanosTexto.normal)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('__________________________________________', 50, doc.y, { width: 240 })
    .text('__________________________________________', 322, doc.y, { width: 240 });

  doc.moveDown(0.3);

  doc.fontSize(tamanosTexto.pequeno)
    .fillColor(colores.textoClaro)
    .font(fuentes.normal)
    .text('Date of signature', 50, doc.y, { width: 240 })
    .text('Date', 322, doc.y, { width: 240 });

  return doc;
}

module.exports = { generarFacturaProforma };
