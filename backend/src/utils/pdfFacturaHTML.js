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

  // Separar servicios del paquete y adicionales
  const separarServicios = (servicios) => {
    const delPaquete = servicios.filter(s => s.esPaquete === true);
    const adicionales = servicios.filter(s => s.esPaquete === false);
    return { delPaquete, adicionales };
  };

  // Preparar datos para reemplazar en el template
  const nombrePaquete = datos.paquetes?.nombre || 'Deluxe Package';
  const nombrePaqueteLimpio = nombrePaquete.includes('Diamond') 
    ? 'Diamond' 
    : nombrePaquete.split(' ')[0] || 'Diamond';

  const nombreCliente = datos.clientes?.nombre_completo || 'N/A';
  const nombreVendedor = datos.vendedores?.nombre_completo || datos.vendedor?.nombre_completo || 'N/A';
  const telefonoVendedor = '+1 (786) 332-7065';
  const emailVendedor = 'diamondvenueatdoral@gmail.com';
  const homenajeado = datos.homenajeado || '';
  const tipoEvento = datos.clientes?.tipo_evento || 'Event';
  const fechaEvento = new Date(datos.fecha_evento);
  const fechaCreacionOferta = datos.fecha_creacion 
    ? new Date(datos.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const horaInicio = formatearHora(datos.hora_inicio);
  const horaFin = formatearHora(datos.hora_fin);
  const cantidadInvitados = datos.cantidad_invitados || 0;
  const emailCliente = datos.clientes?.email || '';
  const telefonoCliente = datos.clientes?.telefono || '';

  // Obtener información del salón y mapear direcciones
  const salon = datos.salones || null;
  let direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166'; // Default
  
  if (salon) {
    const nombreSalon = salon.nombre || '';
    
    // Mapeo de direcciones según el nombre del salón
    if (nombreSalon.toLowerCase().includes('doral')) {
      direccionSalon = 'Salón Doral<br>8726 NW 26th St<br>Doral, FL 33172';
    } else if (nombreSalon.toLowerCase().includes('kendall')) {
      direccionSalon = 'Salón Kendall<br>14271 Southwest 120th Street<br>Kendall, Miami, FL 33186';
    } else if (nombreSalon.toLowerCase().includes('diamond')) {
      direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
    } else {
      // Si no coincide con ninguno, usar el nombre del salón
      direccionSalon = `Salón ${nombreSalon}`;
    }
  }

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

  // Separar servicios del paquete y adicionales por categoría
  const serviciosPaquete = {
    venue: serviciosOrganizados.venue.filter(s => s.esPaquete === true),
    cake: serviciosOrganizados.cake.filter(s => s.esPaquete === true),
    decoration: serviciosOrganizados.decoration.filter(s => s.esPaquete === true),
    specials: serviciosOrganizados.specials.filter(s => s.esPaquete === true),
    barService: serviciosOrganizados.barService.filter(s => s.esPaquete === true),
    catering: serviciosOrganizados.catering.filter(s => s.esPaquete === true),
    serviceCoord: serviciosOrganizados.serviceCoord.filter(s => s.esPaquete === true)
  };

  const serviciosAdicionales = {
    venue: serviciosOrganizados.venue.filter(s => s.esPaquete === false),
    cake: serviciosOrganizados.cake.filter(s => s.esPaquete === false),
    decoration: serviciosOrganizados.decoration.filter(s => s.esPaquete === false),
    specials: serviciosOrganizados.specials.filter(s => s.esPaquete === false),
    barService: serviciosOrganizados.barService.filter(s => s.esPaquete === false),
    catering: serviciosOrganizados.catering.filter(s => s.esPaquete === false),
    serviceCoord: serviciosOrganizados.serviceCoord.filter(s => s.esPaquete === false)
  };

  // Función para generar HTML de servicios por categoría
  const generarHTMLServicios = (serviciosPorCategoria, esPaquete) => {
    const categorias = [
      { key: 'venue', titulo: 'Venue', default: 'Elegant table setting with beautiful centerpieces, runners, charger plates napkins and rings.' },
      { key: 'cake', titulo: 'Cake', default: 'Cake decorated with buttercream.' },
      { key: 'specials', titulo: 'Specials', default: '' },
      { key: 'decoration', titulo: 'Decoration', default: 'Stage Decor. Uplighting throughout venue. Centerpieces. Formal table setting (runners, chargers, cloth napkins, glassware).' },
      { key: 'barService', titulo: 'Bar Service', default: 'Premium selection of liquors (whiskey, rum, vodka and wines), cocktails and soft drinks.' },
      { key: 'catering', titulo: 'Catering', default: 'Gourmet dinner served. Cheese Table. Appetizers.' },
      { key: 'serviceCoord', titulo: 'Service Coord & Design', default: 'Full set up & break down. Event Coordinator. Waiters & Bartender. Event planning & coordination are included.' }
    ];

    let html = '';
    categorias.forEach(cat => {
      const servicios = serviciosPorCategoria[cat.key] || [];
      if (servicios.length > 0 || (esPaquete && cat.default)) {
        const textos = servicios.length > 0
          ? servicios.map(s => s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').filter(t => t).join('. ')
          : cat.default;
        
        if (textos) {
          html += `
            <div class="service-card-clean">
              <div class="service-card-title-clean">${cat.titulo}</div>
              <div class="service-content-clean">${textos}</div>
            </div>`;
        }
      }
    });

    return html;
  };

  const htmlServiciosPaquete = generarHTMLServicios(serviciosPaquete, true);
  const htmlServiciosAdicionales = generarHTMLServicios(serviciosAdicionales, false);
  
  // Generar HTML completo de la sección de servicios adicionales si hay servicios
  const tieneServiciosAdicionales = Object.values(serviciosAdicionales).some(arr => arr.length > 0);
  const htmlSeccionAdicionales = tieneServiciosAdicionales
    ? `
        <div class="additional-services-section">
            <div class="section-title-corporate">Servicios Adicionales</div>
            <div class="additional-services-grid">
                ${htmlServiciosAdicionales}
            </div>
        </div>`
    : '';

  // Generar fila de homenajeado si existe
  const homenajeadoRow = homenajeado
    ? `<tr class="info-table-row">
        <td class="info-table-label">Homenajeado/a</td>
        <td class="info-table-value">${homenajeado}</td>
      </tr>`
    : '';

  // Reemplazar placeholders en el HTML
  const replacements = {
    '{{PACKAGE_NAME}}': nombrePaqueteLimpio,
    '{{SERVICIOS_PAQUETE}}': htmlServiciosPaquete,
    '{{SERVICIOS_ADICIONALES}}': htmlSeccionAdicionales,
    '{{CLIENT_NAME}}': nombreCliente,
    '{{VENDEDOR_NAME}}': nombreVendedor,
    '{{VENDEDOR_PHONE}}': telefonoVendedor,
    '{{VENDEDOR_EMAIL}}': emailVendedor,
    '{{OFFER_CREATION_DATE}}': fechaCreacionOferta,
    '{{HOMENAJEADO_ROW}}': homenajeadoRow,
    '{{EVENT_TYPE}}': tipoEvento,
    '{{EVENT_DATE}}': fechaEvento.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    '{{EVENT_TIME}}': `${horaInicio} to ${horaFin}`,
    '{{GUEST_COUNT}}': cantidadInvitados.toString(),
    '{{CLIENT_EMAIL}}': emailCliente,
    '{{CLIENT_PHONE}}': telefonoCliente,
    '{{SALON_DIRECCION}}': direccionSalon,
    '{{PACKAGE_PRICE}}': formatearMoneda(precioEspecial),
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

module.exports = { 
  generarFacturaProformaHTML,
  organizarServiciosPorCategoria
};


