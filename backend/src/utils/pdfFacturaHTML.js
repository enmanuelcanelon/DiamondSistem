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

  // Obtener información del salón y detectar compañía
  const salon = datos.salones || null;
  const lugarSalon = datos.lugar_salon || '';
  let direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166'; // Default
  let esRevolution = false;
  let nombreCompania = 'Diamond Venue';
  const nombreSalon = (salon?.nombre || lugarSalon || '').toLowerCase();
  
  if (nombreSalon) {
    if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      direccionSalon = 'Salón Doral<br>8726 NW 26th St<br>Doral, FL 33172';
      esRevolution = true;
      nombreCompania = 'Revolution Party Venues';
    } else if (nombreSalon.includes('kendall')) {
      direccionSalon = 'Salón Kendall<br>14271 Southwest 120th Street<br>Kendall, Miami, FL 33186';
      esRevolution = true;
      nombreCompania = 'Revolution Party Venues';
    } else if (nombreSalon.includes('diamond')) {
      direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
      esRevolution = false;
      nombreCompania = 'Diamond Venue';
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

  // Función para generar HTML de servicios por categoría (nuevo diseño elegante de 3 columnas)
  const generarHTMLServicios = (serviciosPorCategoria, esPaquete) => {
    const categorias = [
      { key: 'venue', titulo: 'VENUE', default: 'Elegant table setting with beautiful centerpieces, runners, charger plates napkins and rings.' },
      { key: 'cake', titulo: 'CAKE', default: 'Cake decorated with buttercream.' },
      { key: 'specials', titulo: 'SPECIALS', default: '' },
      { key: 'decoration', titulo: 'DECORATION', default: 'Stage Decor. Uplighting throughout venue. Centerpieces. Formal table setting (runners, chargers, cloth napkins, glassware).' },
      { key: 'barService', titulo: 'BAR SERVICE', default: 'Premium selection of liquors (whiskey, rum, vodka and wines), cocktails and soft drinks.' },
      { key: 'catering', titulo: 'CATERING', default: 'Gourmet dinner served. Cheese Table. Appetizers.' },
      { key: 'serviceCoord', titulo: 'SERVICE COORD & DESIGN', default: 'Full set up & break down. Event Coordinator. Waiters & Bartender. Event planning & coordination are included.' }
    ];

    // Distribuir categorías en 3 columnas
    // Para paquetes: igual que antes
    // Para extras: izquierda=barService, centro=catering+serviceCoord, derecha=specials
    const col1 = esPaquete ? ['venue', 'decoration'] : ['barService'];
    const col2 = esPaquete ? ['cake', 'barService'] : ['catering', 'serviceCoord'];
    const col3 = esPaquete ? ['specials', 'catering', 'serviceCoord'] : ['specials'];

    let htmlCol1 = '<div class="package-col">';
    let htmlCol2 = '<div class="package-col">';
    let htmlCol3 = '<div class="package-col">';

    const generarCategoriaHTML = (cat, servicios) => {
      const items = servicios.length > 0
        ? servicios.map(s => s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').filter(t => t)
        : (cat.default ? [cat.default] : []);
      
      if (items.length > 0) {
        let html = `
          <div class="package-info-block">
            <h3>${cat.titulo}</h3>`;
        
        if (items.length === 1 && items[0].indexOf('.') === -1 && items[0].length < 100) {
          html += `<p>${items[0]}</p>`;
        } else {
          html += `<ul>`;
          items.forEach(item => {
            if (item.includes('. ')) {
              const subItems = item.split('. ').filter(s => s.trim());
              subItems.forEach(subItem => {
                html += `<li>${subItem.trim()}</li>`;
              });
            } else {
              html += `<li>${item}</li>`;
            }
          });
          html += `</ul>`;
        }
        
        html += `</div>`;
        return html;
      }
      return '';
    };

    // Columna 1
    col1.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const servicios = serviciosPorCategoria[cat.key] || [];
        if (servicios.length > 0 || cat.default) {
          htmlCol1 += generarCategoriaHTML(cat, servicios);
        }
      }
    });
    htmlCol1 += '</div>';

    // Columna 2
    col2.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const servicios = serviciosPorCategoria[cat.key] || [];
        if (servicios.length > 0 || cat.default) {
          htmlCol2 += generarCategoriaHTML(cat, servicios);
        }
      }
    });
    htmlCol2 += '</div>';

    // Columna 3
    col3.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const servicios = serviciosPorCategoria[cat.key] || [];
        if (servicios.length > 0 || cat.default) {
          htmlCol3 += generarCategoriaHTML(cat, servicios);
        }
      }
    });
    htmlCol3 += '</div>';

    return htmlCol1 + htmlCol2 + htmlCol3;
  };

  // Función para procesar y reorganizar servicios adicionales según las instrucciones
  const procesarServiciosAdicionales = (servicios) => {
    const procesados = {
      venue: [...(servicios.venue || [])],
      cake: [...(servicios.cake || [])],
      decoration: [...(servicios.decoration || [])],
      specials: [...(servicios.specials || [])],
      barService: [...(servicios.barService || [])],
      catering: [...(servicios.catering || [])],
      serviceCoord: [...(servicios.serviceCoord || [])]
    };

    // Buscar y mover "Animador adicional" de specials a serviceCoord
    const animadorIndex = procesados.specials.findIndex(s => {
      const desc = (s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').toLowerCase();
      return desc.includes('animador') && desc.includes('adicional');
    });
    if (animadorIndex !== -1) {
      procesados.serviceCoord.push(procesados.specials[animadorIndex]);
      procesados.specials.splice(animadorIndex, 1);
    }

    // Buscar y mover "Paquete de 12 mini dulces" de catering a specials
    const dulcesIndex = procesados.catering.findIndex(s => {
      const desc = (s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').toLowerCase();
      return desc.includes('12 mini dulces') || desc.includes('paquete de 12');
    });
    if (dulcesIndex !== -1) {
      procesados.specials.push(procesados.catering[dulcesIndex]);
      procesados.catering.splice(dulcesIndex, 1);
    }

    // Cambiar texto de "Hora adicional de evento" a "Hora Extra (x2)"
    procesados.specials.forEach(s => {
      const desc = s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '';
      if (desc.toLowerCase().includes('hora adicional de evento') || (desc.toLowerCase().includes('hora adicional') && desc.toLowerCase().includes('máximo'))) {
        if (s.descripcion) {
          s.descripcion = 'Hora Extra (x2)';
        } else if (s.servicios) {
          if (s.servicios.descripcion) {
            s.servicios.descripcion = 'Hora Extra (x2)';
          } else if (s.servicios.nombre) {
            s.servicios.nombre = 'Hora Extra (x2)';
          }
        } else if (s.nombre) {
          s.nombre = 'Hora Extra (x2)';
        }
      }
    });

    // Reordenar SPECIALS: Profesional..., Hora Extra (x2), Cobertura..., Cabina..., Paquete de 12 mini dulces
    const ordenEspecial = [
      'profesional para dirigir',
      'hora extra',
      'cobertura completa',
      'cabina fotográfica',
      'paquete de 12'
    ];
    
    procesados.specials.sort((a, b) => {
      const descA = (a.descripcion || a.servicios?.descripcion || a.servicios?.nombre || a.nombre || '').toLowerCase();
      const descB = (b.descripcion || b.servicios?.descripcion || b.servicios?.nombre || b.nombre || '').toLowerCase();
      
      const indexA = ordenEspecial.findIndex(patron => descA.includes(patron));
      const indexB = ordenEspecial.findIndex(patron => descB.includes(patron));
      
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return procesados;
  };

  const htmlServiciosPaquete = generarHTMLServicios(serviciosPaquete, true);
  const serviciosAdicionalesProcesados = procesarServiciosAdicionales(serviciosAdicionales);
  const htmlServiciosAdicionales = generarHTMLServicios(serviciosAdicionalesProcesados, false);
  
  // Generar HTML completo de la sección de servicios adicionales si hay servicios (nuevo diseño)
  const tieneServiciosAdicionales = Object.values(serviciosAdicionalesProcesados).some(arr => arr.length > 0);
  const htmlSeccionAdicionales = tieneServiciosAdicionales
    ? `
      <div class="page page-2b">
        <div class="page-content" style="padding: 0; height: 100%;">
          <div class="package-card">
            <div style="padding: 15px 50px 10px 50px; text-align: left; flex-shrink: 0;">
              <h2 style="font-size: 2.2rem; font-weight: 400; text-transform: uppercase; letter-spacing: 3px; color: #000; font-family: 'Montserrat', sans-serif; margin: 0; line-height: 1.2;">Extras del Evento</h2>
            </div>
            <div class="package-content" style="flex: 1; padding-top: 0; overflow: hidden;">
              ${htmlServiciosAdicionales}
            </div>
          </div>
        </div>
      </div>
    `
    : '';

  // Generar fila de homenajeado si existe
  const homenajeadoRow = homenajeado
    ? `<tr class="info-table-row">
        <td class="info-table-label">Homenajeado/a</td>
        <td class="info-table-value">${homenajeado}</td>
      </tr>`
    : '';

  // Convertir logo a base64 si existe y generar HTML del logo (solo Revolution)
  let logoPath = '';
  if (esRevolution) {
    logoPath = path.join(__dirname, '../templates/assets/Logorevolution.png');
  }
  
  let logoHTML = `<div style="font-size: 18px; font-weight: 100; color: #FFFFFF; letter-spacing: 2px;">${nombreCompania}</div>`;
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      logoHTML = `<img src="${logoBase64}" alt="${nombreCompania}" class="cover-logo" style="max-width: 400px; height: auto; opacity: 1; filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4));">`;
      console.log('Logo cargado correctamente para ofertas:', logoPath);
    } catch (error) {
      console.error('Error al cargar logo:', error);
    }
  } else {
    console.log('Logo no encontrado en:', logoPath);
  }

  // Cargar fondo para Revolution (Doral/Kendall) - Portada
  const fondoPath = path.join(__dirname, '../templates/assets/img12.jpg');
  const hasBackground = esRevolution && fs.existsSync(fondoPath);
  
  let fondoStyle = `background-image: 
                radial-gradient(circle, rgba(212,175,55,0.2) 2px, transparent 2.5px),
                radial-gradient(circle, rgba(212,175,55,0.2) 2px, transparent 2.5px);
            background-size: 30px 30px;
            background-position: 0 0, 15px 15px;
            display: block;`;
  
  if (hasBackground) {
    try {
      const fondoBuffer = fs.readFileSync(fondoPath);
      const fondoBase64 = `data:image/jpeg;base64,${fondoBuffer.toString('base64')}`;
      fondoStyle = `background-image: url("${fondoBase64}");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 1;
            display: block;`;
      console.log('Fondo cargado correctamente para ofertas. Tamaño base64:', fondoBase64.length, 'caracteres');
    } catch (error) {
      console.error('Error al cargar fondo:', error);
    }
  } else {
    console.log('Fondo no encontrado o no es Revolution. Path:', fondoPath, 'esRevolution:', esRevolution);
  }

  // Cargar fondo general para package-card (solo Revolution)
  const fondoGeneralPath = path.join(__dirname, '../templates/assets/fondoRevolutionGeneral.png');
  let packageCardBackground = '';
  
  if (esRevolution && fs.existsSync(fondoGeneralPath)) {
    try {
      const fondoGeneralBuffer = fs.readFileSync(fondoGeneralPath);
      const fondoGeneralBase64 = `data:image/png;base64,${fondoGeneralBuffer.toString('base64')}`;
      packageCardBackground = `background-image: url("${fondoGeneralBase64}");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 1;`;
      console.log('Fondo general cargado correctamente para ofertas (Revolution)');
    } catch (error) {
      console.error('Error al cargar fondo general:', error);
      packageCardBackground = '';
    }
  } else {
    console.log('Fondo general no aplicado (no es Revolution o no existe)');
    packageCardBackground = '';
  }

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
    '{{TOTAL_REMAINING}}': formatearMoneda(totalRestante),
    '{{PACKAGE_CARD_BACKGROUND}}': packageCardBackground,
    '{{NOMBRE_COMPANIA}}': nombreCompania,
    '{{LOGO_HTML}}': logoHTML,
    '{{FONDO_STYLE}}': fondoStyle,
    '{{HAS_BACKGROUND_CLASS}}': hasBackground ? 'has-background' : ''
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
    
    // Configurar viewport para mejor renderizado (508.3 x 285.7 mm)
    // 508.3 mm = 1442 puntos, 285.7 mm = 810 puntos (1 mm = 2.83465 puntos)
    await page.setViewport({
      width: 1442, // 508.3 mm en puntos
      height: 810, // 285.7 mm en puntos
      deviceScaleFactor: 2 // Mejor calidad de imagen
    });
    
    // Obtener la ruta base del template para usar rutas relativas
    const templatePath = path.join(__dirname, '../templates/pdf-factura.html');
    const templateDir = path.dirname(templatePath);
    
    // Establecer el contenido HTML con la ruta base para recursos
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });
    
    // Esperar a que las imágenes se carguen completamente
    try {
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images).map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continuar aunque falle
              setTimeout(() => resolve(), 5000); // Timeout de 5 segundos
            });
          })
        );
      });
    } catch (error) {
      console.log('Error esperando imágenes:', error);
    }
    
    // Esperar un poco más para asegurar que todo se renderice
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pdfBuffer = await page.pdf({
      width: '508.3mm', // Ancho: 508.3 mm
      height: '285.7mm', // Alto: 285.7 mm
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    return pdfBuffer;
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
    const descripcion = servicio.descripcion?.toLowerCase() || '';

    if (nombre.includes('cake') || nombre.includes('torta')) {
      organizados.cake.push(servicio);
    } else if (categoria.includes('decoración') || categoria.includes('decoration') || nombre.includes('decoración') || nombre.includes('decoration')) {
      organizados.decoration.push(servicio);
    } else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor') || nombre.includes('bar') || nombre.includes('bebida') || nombre.includes('champaña') || nombre.includes('sidra')) {
      organizados.barService.push(servicio);
    } else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food') || nombre.includes('comida') || nombre.includes('catering') || nombre.includes('pasapalo') || nombre.includes('dulce')) {
      organizados.catering.push(servicio);
    } else if (categoria.includes('fotografía') || categoria.includes('video') || categoria.includes('equipo') || categoria.includes('photobooth') || categoria.includes('hora loca') || nombre.includes('photobooth') || nombre.includes('foto') || nombre.includes('video') || nombre.includes('hora loca') || nombre.includes('hora adicional')) {
      organizados.specials.push(servicio);
    } else if (categoria.includes('coordinación') || categoria.includes('coordinador') || categoria.includes('mesero') || categoria.includes('bartender') || categoria.includes('service') || nombre.includes('coordinador') || nombre.includes('mesero') || nombre.includes('bartender') || nombre.includes('personal de servicio') || nombre.includes('waiters') || descripcion.includes('coordinator') || descripcion.includes('waiters') || descripcion.includes('bartender')) {
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


