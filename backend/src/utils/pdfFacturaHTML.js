const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Genera una Factura Proforma usando HTML + Puppeteer
 * @param {Object} datos - Datos de la oferta o contrato
 * @param {String} tipo - 'oferta' o 'contrato'
 * @returns {Buffer} - PDF como buffer
 */
async function generarFacturaProformaHTML(datos, tipo = 'oferta') {
  // Leer el template HTML
  const templatePath = path.join(__dirname, '../templates/pdf-factura.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Organizar servicios por categoría
  const serviciosOrganizados = organizarServiciosPorCategoria(datos);

  // Preparar datos para reemplazar en el template
  const nombrePaquete = datos.paquetes?.nombre || 'Deluxe Package';
  const nombrePaqueteLimpio = nombrePaquete.includes('Diamond') 
    ? 'Diamond' 
    : nombrePaquete.split(' ')[0] || 'Diamond';

  const nombreCliente = datos.clientes?.nombre_completo || 'N/A';
  const nombreVendedor = datos.vendedores?.nombre_completo || datos.vendedor?.nombre_completo || 'N/A';
  const tipoEvento = datos.clientes?.tipo_evento || 'Event';
  const fechaEvento = new Date(datos.fecha_evento);
  const horaInicio = formatearHora(datos.hora_inicio);
  const horaFin = formatearHora(datos.hora_fin);
  const cantidadInvitados = datos.cantidad_invitados || 0;
  const emailCliente = datos.clientes?.email || '';
  const telefonoCliente = datos.clientes?.telefono || '';

  // Calcular precios
  const precioPaquete = parseFloat(datos.subtotal || datos.precio_base || datos.precio_paquete_base || 0);
  const ajusteTemporada = parseFloat(datos.ajuste_temporada || datos.ajuste_temporada_custom || 0);
  const precioTemporada = precioPaquete + ajusteTemporada;
  const descuento = parseFloat(datos.descuento || 0);
  const precioEspecial = precioTemporada - descuento;
  const impuesto = parseFloat(datos.impuesto_monto || 0);
  const serviceFee = parseFloat(datos.tarifa_servicio_monto || 0);
  const total = parseFloat(datos.total_final || 0);
  
  // Obtener primer pago
  const primerPago = datos.pagos && datos.pagos.length > 0 
    ? parseFloat(datos.pagos[0].monto || 0) 
    : 0;
  const fechaPrimerPago = datos.pagos && datos.pagos.length > 0 && datos.pagos[0].fecha_pago
    ? new Date(datos.pagos[0].fecha_pago).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const totalRestante = total - primerPago;

  // Formatear servicios para cada sección
  const formatServicios = (servicios, defaultText) => {
    if (!servicios || servicios.length === 0) {
      return defaultText;
    }
    return servicios.map(s => {
      const desc = s.servicios?.descripcion || s.descripcion || s.servicios?.nombre || s.nombre || '';
      return desc;
    }).join('. ') || defaultText;
  };

  // Reemplazar placeholders en el HTML
  const replacements = {
    '{{PACKAGE_NAME}}': nombrePaqueteLimpio,
    '{{VENUE_SERVICES}}': formatServicios(serviciosOrganizados.venue, 'Elegant table setting with beautiful centerpieces, runners, charger plates napkins and rings.'),
    '{{CAKE_SERVICES}}': formatServicios(serviciosOrganizados.cake, 'Cake decorated with buttercream.'),
    '{{DECORATION_SERVICES}}': formatServicios(serviciosOrganizados.decoration, 'Stage Decor. Uplighting throughout venue. Centerpieces. Formal table setting (runners, chargers, cloth napkins, glassware).'),
    '{{SPECIALS_SERVICES}}': formatServicios(serviciosOrganizados.specials, ''),
    '{{BAR_SERVICES}}': formatServicios(serviciosOrganizados.barService, 'Premium selection of liquors (whiskey, rum, vodka and wines), cocktails and soft drinks.'),
    '{{CATERING_SERVICES}}': formatServicios(serviciosOrganizados.catering, 'Gourmet dinner served. Cheese Table. Appetizers.'),
    '{{SERVICE_COORD_SERVICES}}': formatServicios(serviciosOrganizados.serviceCoord, 'Full set up & break down. Event Coordinator. Waiters & Bartender. Event planning & coordination are included.'),
    '{{CLIENT_NAME}}': nombreCliente,
    '{{VENDEDOR_NAME}}': nombreVendedor,
    '{{EVENT_TYPE}}': tipoEvento,
    '{{EVENT_DATE}}': fechaEvento.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    '{{EVENT_TIME}}': `${horaInicio} to ${horaFin}`,
    '{{GUEST_COUNT}}': cantidadInvitados.toString(),
    '{{CLIENT_EMAIL}}': emailCliente,
    '{{CLIENT_PHONE}}': telefonoCliente,
    '{{PACKAGE_PRICE}}': formatearMoneda(precioPaquete),
    '{{TEMP_PRICE}}': formatearMoneda(precioEspecial),
    '{{TAX_AMOUNT}}': formatearMoneda(impuesto),
    '{{SERVICE_FEE}}': formatearMoneda(serviceFee),
    '{{TOTAL_TO_PAY}}': formatearMoneda(total),
    '{{FIRST_PAYMENT_DATE}}': fechaPrimerPago,
    '{{FIRST_PAYMENT_AMOUNT}}': formatearMoneda(primerPago),
    '{{TOTAL_REMAINING}}': formatearMoneda(totalRestante)
  };

  Object.keys(replacements).forEach(key => {
    html = html.replace(new RegExp(key, 'g'), replacements[key]);
  });

  // Generar PDF con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

/**
 * Organiza servicios por categoría (misma función que antes)
 */
function organizarServiciosPorCategoria(datos) {
  const serviciosAdicionales = datos.ofertas_servicios_adicionales || datos.contratos_servicios || [];
  const serviciosPaquete = datos.paquetes?.paquetes_servicios || [];

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

/**
 * Formatea hora
 */
function formatearHora(hora) {
  if (!hora) return '8:00PM';
  
  try {
    const fecha = new Date(hora);
    const horas = fecha.getHours();
    const minutos = fecha.getMinutes();
    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
    return `${horas12}:${minutos.toString().padStart(2, '0')}${periodo}`;
  } catch (e) {
    return '8:00PM';
  }
}

module.exports = { generarFacturaProformaHTML };


