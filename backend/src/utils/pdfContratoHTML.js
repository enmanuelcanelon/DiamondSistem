const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Genera un PDF de contrato usando HTML + Puppeteer
 * @param {Object} contrato - Datos del contrato con relaciones
 * @returns {Buffer} - PDF como buffer
 */
async function generarContratoHTML(contrato) {
  // Detectar compañía primero para saber qué template usar
  const salon = contrato.salones || null;
  const lugarSalon = contrato.lugar_salon || '';
  const nombreSalon = (salon?.nombre || lugarSalon || '').toLowerCase();
  let esRevolution = false;
  
  if (nombreSalon) {
    if ((nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) || nombreSalon.includes('kendall')) {
      esRevolution = true;
    }
  }

  // Leer el template HTML según la compañía
  const templatePath = esRevolution 
    ? path.join(__dirname, '../templates/pdf-contrato.html')
    : path.join(__dirname, '../templates/pdf-contrato-diamond.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Organizar servicios por categoría (usar la misma función de ofertas)
  const { organizarServiciosPorCategoria } = require('./pdfFacturaHTML');
  
  // Adaptar estructura del contrato para la función de categorización
  // La función espera paquetes_servicios y ofertas_servicios_adicionales o contratos_servicios
  const datosParaCategorizar = {
    paquetes: contrato.paquetes,
    contratos_servicios: contrato.contratos_servicios || []
  };
  
  const serviciosOrganizados = organizarServiciosPorCategoria(datosParaCategorizar);

  // Separar servicios del paquete y adicionales
  const serviciosPaquete = {
    venue: serviciosOrganizados.venue.filter(s => s.esPaquete === true),
    cake: serviciosOrganizados.cake.filter(s => s.esPaquete === true),
    decoration: serviciosOrganizados.decoration.filter(s => s.esPaquete === true),
    specials: serviciosOrganizados.specials.filter(s => s.esPaquete === true),
    barService: serviciosOrganizados.barService.filter(s => s.esPaquete === true),
    catering: serviciosOrganizados.catering.filter(s => s.esPaquete === true),
    serviceCoord: serviciosOrganizados.serviceCoord.filter(s => s.esPaquete === true)
  };

  // Filtrar servicios adicionales
  // Un servicio es adicional si:
  // 1. NO está en el paquete, O
  // 2. Está en el paquete PERO también está en contratos_servicios con precio/cantidad diferente (servicio extra agregado)
  const serviciosPaqueteIds = new Set();
  const serviciosPaqueteMap = new Map(); // Mapa para comparar precios y cantidades
  
  if (contrato.paquetes?.paquetes_servicios) {
    contrato.paquetes.paquetes_servicios.forEach(ps => {
      if (ps.servicios?.id) {
        serviciosPaqueteIds.add(ps.servicios.id);
        // Guardar información del servicio en el paquete para comparar
        serviciosPaqueteMap.set(ps.servicios.id, {
          cantidad: 1, // Los servicios del paquete generalmente son cantidad 1
          precio: 0 // Los servicios del paquete no tienen precio individual
        });
      }
    });
  }

  // Obtener servicios adicionales filtrados
  const serviciosAdicionalesFiltrados = (contrato.contratos_servicios || []).filter(cs => {
    const servicioId = cs.servicios?.id || cs.servicio_id;
    const nombreServicio = cs.servicios?.nombre || '';
    const precioUnitario = parseFloat(cs.precio_unitario || 0);
    
    if (!servicioId) return false;
    
    // Si NO está en el paquete, es adicional (solo si tiene precio > 0)
    if (!serviciosPaqueteIds.has(servicioId)) {
      return precioUnitario > 0;
    }
    
    // Si está en el paquete, solo es adicional si tiene precio > 0 (servicio extra agregado)
    // Los servicios del paquete con precio 0 NO deben mostrarse como adicionales
    const esServicioExtra = precioUnitario > 0;
    
    // Debug: Log para servicios que podrían ser "Photobooth Print" o "Hora Extra"
    if (nombreServicio.toLowerCase().includes('photobooth') || nombreServicio.toLowerCase().includes('hora extra') || nombreServicio.toLowerCase().includes('horaextra')) {
      console.log('DEBUG - Servicio potencial:', {
        nombre: nombreServicio,
        id: servicioId,
        enPaquete: serviciosPaqueteIds.has(servicioId),
        esAdicional: !serviciosPaqueteIds.has(servicioId),
        esServicioExtra: esServicioExtra,
        cantidad: cs.cantidad || 1,
        precio: precioUnitario
      });
    }
    
    return esServicioExtra;
  });
  
  console.log('Total servicios adicionales filtrados:', serviciosAdicionalesFiltrados.length);

  // Crear un mapa de servicios adicionales con sus datos de contrato (cantidad, precio, subtotal)
  const serviciosAdicionalesMap = new Map();
  serviciosAdicionalesFiltrados.forEach(cs => {
    const servicioId = cs.servicios?.id || cs.servicio_id;
    if (servicioId) {
      serviciosAdicionalesMap.set(servicioId, {
        servicio: cs.servicios,
        cantidad: cs.cantidad || 1,
        precio_unitario: parseFloat(cs.precio_unitario || 0),
        subtotal: parseFloat(cs.subtotal || cs.precio_unitario * (cs.cantidad || 1))
      });
    }
  });

  // Organizar servicios adicionales por categoría usando los servicios filtrados
  const serviciosAdicionalesOrganizados = {
    venue: [],
    cake: [],
    decoration: [],
    specials: [],
    barService: [],
    catering: [],
    serviceCoord: []
  };

  // Categorizar servicios adicionales
  serviciosAdicionalesFiltrados.forEach(cs => {
    const servicio = cs.servicios || {};
    const categoria = (servicio.categoria || '').toLowerCase();
    const nombre = (servicio.nombre || '').toLowerCase();
    const nombreNormalizado = nombre.replace(/[()]/g, '').trim();
    
    // Debug: Log para verificar servicios adicionales
    console.log('Servicio adicional encontrado:', {
      id: servicio.id,
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      cantidad: cs.cantidad,
      precio_unitario: cs.precio_unitario
    });
    
    const servicioConDatos = {
      ...servicio,
      cantidad: cs.cantidad || 1,
      precio_unitario: parseFloat(cs.precio_unitario || 0),
      subtotal: parseFloat(cs.subtotal || cs.precio_unitario * (cs.cantidad || 1))
    };

    if (nombre.includes('cake') || nombre.includes('torta')) {
      serviciosAdicionalesOrganizados.cake.push(servicioConDatos);
    } else if (categoria.includes('decoración') || categoria.includes('decoration') || nombre.includes('decoración') || nombre.includes('decoration')) {
      serviciosAdicionalesOrganizados.decoration.push(servicioConDatos);
    } else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor') || nombre.includes('bar') || nombre.includes('bebida') || nombre.includes('champaña') || nombre.includes('champagne')) {
      serviciosAdicionalesOrganizados.barService.push(servicioConDatos);
    } else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food') || nombre.includes('comida') || nombre.includes('catering') || nombre.includes('pasapalos') || nombre.includes('dulces') || nombre.includes('mini dulces') || nombre.includes('pasapalo')) {
      serviciosAdicionalesOrganizados.catering.push(servicioConDatos);
    } else {
      // Detectar servicios especiales (photobooth, hora extra, animador, etc.)
      const esPhotobooth = nombre.includes('photobooth') || nombreNormalizado.includes('photobooth') || 
                           nombre.includes('photo booth') || nombreNormalizado.includes('photo booth') ||
                           nombre.includes('print') || nombreNormalizado.includes('print') ||
                           categoria.includes('photobooth');
      
      const esHoraExtra = nombre.includes('hora extra') || nombreNormalizado.includes('hora extra') ||
                          nombre.includes('hora adicional') || nombreNormalizado.includes('hora adicional') ||
                          nombre.includes('horaextra') || nombreNormalizado.includes('horaextra') ||
                          nombre.includes('horaadicion') || nombreNormalizado.includes('horaadicion') ||
                          categoria.includes('hora extra') || categoria.includes('hora adicional');
      
      const esEspecial = categoria.includes('fotografía') || categoria.includes('fotografia') || 
                         categoria.includes('video') || categoria.includes('equipo') || 
                         categoria.includes('hora loca') || categoria.includes('animación') || 
                         categoria.includes('animacion') || esPhotobooth || esHoraExtra ||
                         nombre.includes('hora loca') || nombreNormalizado.includes('hora loca') || 
                         nombre.includes('animador') || nombre.includes('maestro') || 
                         nombre.includes('ceremonia') || nombre.includes('mc') || 
                         nombre.includes('foto') || nombre.includes('fotografia') || 
                         nombre.includes('fotografo') || nombre.includes('video');
      
      if (esEspecial) {
        serviciosAdicionalesOrganizados.specials.push(servicioConDatos);
        console.log('Servicio categorizado como SPECIALS:', servicio.nombre);
      } else if (categoria.includes('coordinación') || categoria.includes('coordinacion') || categoria.includes('coordinador') || categoria.includes('mesero') || categoria.includes('bartender') || nombre.includes('coordinador') || nombre.includes('mesero') || nombre.includes('bartender')) {
        serviciosAdicionalesOrganizados.serviceCoord.push(servicioConDatos);
      } else if (categoria.includes('venue') || nombre.includes('venue') || nombre.includes('salón') || nombre.includes('salon')) {
        serviciosAdicionalesOrganizados.venue.push(servicioConDatos);
      } else {
        serviciosAdicionalesOrganizados.specials.push(servicioConDatos);
      }
    }
  });

  const serviciosAdicionales = serviciosAdicionalesOrganizados;

  // Función para generar HTML de servicios por categoría
  // Si esPaquete es true, usa el formato elegante de 3 columnas con barra lateral
  // Si esPaquete es false, usa el formato de tarjetas para servicios adicionales
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

    // Si es paquete, usar formato de 3 columnas
    if (esPaquete) {
      // Organizar categorías en 3 columnas
      const col1 = ['venue', 'barService', 'cake'];
      const col2 = ['catering', 'serviceCoord'];
      const col3 = ['decoration', 'specials'];
      
      let htmlCol1 = '<div class="package-col">';
      let htmlCol2 = '<div class="package-col">';
      let htmlCol3 = '<div class="package-col">';

      // Función auxiliar para generar HTML de una categoría
      const generarCategoriaHTML = (cat, servicios) => {
        if (servicios.length > 0 || cat.default) {
          const items = servicios.length > 0
            ? servicios.map(s => s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').filter(t => t)
            : (cat.default ? [cat.default] : []);
          
          if (items.length > 0) {
            let html = `
              <div class="package-info-block">
                <h3>${cat.titulo}</h3>`;
            
            // Si solo hay un item y es un default simple, usar <p>, sino usar lista
            if (items.length === 1 && items[0].indexOf('.') === -1 && items[0].length < 100) {
              html += `<p>${items[0]}</p>`;
            } else {
              html += `<ul>`;
              items.forEach(item => {
                // Si el item contiene puntos, dividirlo en múltiples items
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
        }
        return '';
      };

      // Columna 1
      col1.forEach(key => {
        const cat = categorias.find(c => c.key === key);
        if (cat) {
          const servicios = serviciosPorCategoria[cat.key] || [];
          htmlCol1 += generarCategoriaHTML(cat, servicios);
        }
      });
      htmlCol1 += '</div>';

      // Columna 2
      col2.forEach(key => {
        const cat = categorias.find(c => c.key === key);
        if (cat) {
          const servicios = serviciosPorCategoria[cat.key] || [];
          htmlCol2 += generarCategoriaHTML(cat, servicios);
        }
      });
      htmlCol2 += '</div>';

      // Columna 3
      col3.forEach(key => {
        const cat = categorias.find(c => c.key === key);
        if (cat) {
          const servicios = serviciosPorCategoria[cat.key] || [];
          htmlCol3 += generarCategoriaHTML(cat, servicios);
        }
      });
      htmlCol3 += '</div>';

      return htmlCol1 + htmlCol2 + htmlCol3;
    } else {
      // Formato antiguo para servicios adicionales
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
    }
  };

  // Generar HTML de servicios adicionales en formato elegante (mismo estilo que paquete)
  // IMPORTANTE: Solo mostrar servicios que realmente son adicionales/extras, NO usar defaults del paquete
  const generarHTMLServiciosAdicionales = () => {
    if (!serviciosAdicionalesFiltrados || serviciosAdicionalesFiltrados.length === 0) {
      return '';
    }

    // Organizar servicios adicionales por categoría
    const serviciosAdicionalesPorCategoria = {
      venue: [],
      cake: [],
      decoration: [],
      specials: [],
      barService: [],
      catering: [],
      serviceCoord: []
    };

    serviciosAdicionalesFiltrados.forEach(cs => {
      const servicio = cs.servicios || {};
      const categoria = servicio.categoria?.toLowerCase() || '';
      const nombre = servicio.nombre?.toLowerCase() || '';
      const cantidad = cs.cantidad || 1;
      
      // Formatear descripción con cantidad si es mayor a 1
      let descripcion = servicio.descripcion || servicio.nombre || '';
      if (cantidad > 1) {
        descripcion = `${servicio.nombre || descripcion} (x${cantidad})`;
      }
      
      const servicioFormateado = {
        ...servicio,
        descripcion: descripcion,
        nombre: servicio.nombre || '',
        cantidad: cantidad,
        precio_unitario: parseFloat(cs.precio_unitario || 0),
        subtotal: parseFloat(cs.subtotal || cs.precio_unitario * cantidad)
      };

      // Categorizar igual que en organizarServiciosPorCategoria
      if (nombre.includes('cake') || nombre.includes('torta')) {
        serviciosAdicionalesPorCategoria.cake.push(servicioFormateado);
      } else if (categoria.includes('decoración') || categoria.includes('decoration') || nombre.includes('decoración') || nombre.includes('decoration')) {
        serviciosAdicionalesPorCategoria.decoration.push(servicioFormateado);
      } else if (categoria.includes('bar') || nombre.includes('bar') || nombre.includes('bebida') || nombre.includes('cocktail') || nombre.includes('sidra') || nombre.includes('champaña') || nombre.includes('champagne')) {
        serviciosAdicionalesPorCategoria.barService.push(servicioFormateado);
      } else if (categoria.includes('catering') || nombre.includes('catering') || nombre.includes('comida') || nombre.includes('dinner') || nombre.includes('cheese') || nombre.includes('pasapalo') || nombre.includes('pasapalos')) {
        serviciosAdicionalesPorCategoria.catering.push(servicioFormateado);
      } else if (categoria.includes('servicio') || categoria.includes('coordin') || nombre.includes('mesero') || nombre.includes('waiter') || nombre.includes('coordinator') || nombre.includes('animador') || nombre.includes('profesional')) {
        serviciosAdicionalesPorCategoria.serviceCoord.push(servicioFormateado);
      } else if (nombre.includes('venue') || nombre.includes('salón') || nombre.includes('lounge') || nombre.includes('furniture')) {
        serviciosAdicionalesPorCategoria.venue.push(servicioFormateado);
      } else {
        // SPECIALS: incluye photobooth, hora extra, fotografía, dulces, etc.
        serviciosAdicionalesPorCategoria.specials.push(servicioFormateado);
      }
    });

    // Generar HTML usando el formato de 3 columnas pero SIN defaults (solo servicios reales)
    const categorias = [
      { key: 'venue', titulo: 'VENUE' },
      { key: 'cake', titulo: 'CAKE' },
      { key: 'specials', titulo: 'SPECIALS' },
      { key: 'decoration', titulo: 'DECORATION' },
      { key: 'barService', titulo: 'BAR SERVICE' },
      { key: 'catering', titulo: 'CATERING' },
      { key: 'serviceCoord', titulo: 'SERVICE COORD & DESIGN' }
    ];

    // Organizar categorías en 3 columnas
    const col1 = ['venue', 'barService', 'cake'];
    const col2 = ['catering', 'serviceCoord'];
    const col3 = ['decoration', 'specials'];
    
    let htmlCol1 = '<div class="package-col">';
    let htmlCol2 = '<div class="package-col">';
    let htmlCol3 = '<div class="package-col">';

    // Función auxiliar para generar HTML de una categoría (SIN defaults)
    const generarCategoriaHTML = (cat, servicios) => {
      // Solo mostrar si hay servicios reales, NO usar defaults
      if (servicios.length > 0) {
        const items = servicios.map(s => s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').filter(t => t);
        
        if (items.length > 0) {
          let html = `
            <div class="package-info-block">
              <h3>${cat.titulo}</h3>`;
          
          // Si solo hay un item simple, usar <p>, sino usar lista
          if (items.length === 1 && items[0].indexOf('.') === -1 && items[0].length < 100) {
            html += `<p>${items[0]}</p>`;
          } else {
            html += `<ul>`;
            items.forEach(item => {
              // Si el item contiene puntos, dividirlo en múltiples items
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
      }
      return '';
    };

    // Columna 1
    col1.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const servicios = serviciosAdicionalesPorCategoria[cat.key] || [];
        htmlCol1 += generarCategoriaHTML(cat, servicios);
      }
    });
    htmlCol1 += '</div>';

    // Columna 2
    col2.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const servicios = serviciosAdicionalesPorCategoria[cat.key] || [];
        htmlCol2 += generarCategoriaHTML(cat, servicios);
      }
    });
    htmlCol2 += '</div>';

    // Columna 3
    col3.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const servicios = serviciosAdicionalesPorCategoria[cat.key] || [];
        htmlCol3 += generarCategoriaHTML(cat, servicios);
      }
    });
    htmlCol3 += '</div>';

    return htmlCol1 + htmlCol2 + htmlCol3;
  };

  // Función auxiliar para calcular total de servicios adicionales (mantener para desglose)
  const calcularTotalServiciosAdicionales = () => {
    if (!serviciosAdicionalesFiltrados || serviciosAdicionalesFiltrados.length === 0) {
      return 0;
    }
    
    let total = 0;
    serviciosAdicionalesFiltrados.forEach(cs => {
      const precioUnitario = parseFloat(cs.precio_unitario || 0);
      const cantidad = cs.cantidad || 1;
      const subtotal = parseFloat(cs.subtotal || precioUnitario * cantidad);
      total += subtotal;
    });
    
    return total;
  };

  // Calcular el total de servicios adicionales desde los servicios filtrados
  const totalServiciosAdicionalesCalculado = serviciosAdicionalesFiltrados.reduce((total, cs) => {
    const precioUnitario = parseFloat(cs.precio_unitario || 0);
    const cantidad = cs.cantidad || 1;
    const subtotal = parseFloat(cs.subtotal || precioUnitario * cantidad);
    return total + subtotal;
  }, 0);
  
  console.log(`Total servicios adicionales calculado desde contratos_servicios: $${totalServiciosAdicionalesCalculado.toFixed(2)}`);

  const htmlServiciosPaquete = generarHTMLServicios(serviciosPaquete, true);
  const htmlServiciosAdicionales = generarHTMLServiciosAdicionales();

  // Preparar datos para reemplazar en el template
  const nombreCliente = contrato.clientes?.nombre_completo || 'N/A';
  const nombreClientePrimero = nombreCliente.split(' ')[0] || nombreCliente;
  const nombreVendedor = contrato.vendedores?.nombre_completo || 'N/A';
  const telefonoVendedor = '+1 (786) 332-7065';
  const emailVendedor = 'diamondvenueatdoral@gmail.com';
  const homenajeado = contrato.homenajeado || '';
  const tipoEvento = contrato.clientes?.tipo_evento || 'Evento';
  const fechaEvento = new Date(contrato.fecha_evento);
  const horaInicio = formatearHora(contrato.hora_inicio);
  const horaFin = formatearHora(contrato.hora_fin);
  const cantidadInvitados = contrato.cantidad_invitados || 0;
  const emailCliente = contrato.clientes?.email || '';
  const telefonoCliente = contrato.clientes?.telefono || '';

  // Obtener información del salón y detectar compañía (usar variables ya declaradas)
  let direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
  let logoPath = '';
  let nombreCompania = 'Diamond Venue';
  
  console.log('DEBUG - Detección de salón:', { 
    salonNombre: salon?.nombre, 
    lugarSalon: lugarSalon,
    nombreSalon: nombreSalon 
  });
  
  if (nombreSalon) {
    if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      direccionSalon = 'Salón Doral<br>8726 NW 26th St<br>Doral, FL 33172';
      esRevolution = true;
      nombreCompania = 'Revolution Party Venues';
      logoPath = path.join(__dirname, '../templates/assets/Logorevolution.png');
      console.log('✓ Detectado como Revolution (Doral)');
    } else if (nombreSalon.includes('kendall')) {
      direccionSalon = 'Salón Kendall<br>14271 Southwest 120th Street<br>Kendall, Miami, FL 33186';
      esRevolution = true;
      nombreCompania = 'Revolution Party Venues';
      logoPath = path.join(__dirname, '../templates/assets/Logorevolution.png');
      console.log('✓ Detectado como Revolution (Kendall)');
    } else if (nombreSalon.includes('diamond')) {
      direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
      esRevolution = false;
      nombreCompania = 'Diamond Venue';
      console.log('✓ Detectado como Diamond');
    }
  } else {
    console.log('⚠ No se pudo detectar el salón - usando Diamond por defecto');
  }

  // Obtener datos del desglose desde la oferta relacionada
  const oferta = contrato.ofertas;
  let precioPaquete = 0;
  let ajusteTemporada = 0;
  let subtotalServicios = 0;
  let descuento = 0;
  let impuestoPorcentaje = 7;
  let impuestoMonto = 0;
  let tarifaServicioPorcentaje = 18;
  let tarifaServicioMonto = 0;
  let totalFinal = parseFloat(contrato.total_contrato || 0);

  if (oferta) {
    precioPaquete = parseFloat(oferta.precio_paquete_base || oferta.precio_base_ajustado || 0);
    ajusteTemporada = parseFloat(oferta.ajuste_temporada_custom || oferta.ajuste_temporada || 0);
    // Usar el total calculado de servicios adicionales del contrato en lugar del de la oferta
    subtotalServicios = totalServiciosAdicionalesCalculado;
    descuento = parseFloat(oferta.descuento || 0);
    impuestoPorcentaje = parseFloat(oferta.impuesto_porcentaje || 7);
    impuestoMonto = parseFloat(oferta.impuesto_monto || 0);
    tarifaServicioPorcentaje = parseFloat(oferta.tarifa_servicio_porcentaje || 18);
    tarifaServicioMonto = parseFloat(oferta.tarifa_servicio_monto || 0);
    totalFinal = parseFloat(oferta.total_final || contrato.total_contrato || 0);
  } else {
    // Si no hay oferta, usar el total calculado
    subtotalServicios = totalServiciosAdicionalesCalculado;
  }

  const subtotalBase = precioPaquete + ajusteTemporada + subtotalServicios - descuento;
  const totalContrato = parseFloat(contrato.total_contrato || 0);
  const totalPagado = parseFloat(contrato.total_pagado || 0);
  const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);

  // Generar HTML del desglose de inversión en formato serio y profesional
  let investmentBreakdown = '';
  investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Precio del Paquete</td><td class="info-table-value">$${precioPaquete.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;
  if (ajusteTemporada !== 0) {
    investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Ajuste de Temporada</td><td class="info-table-value">$${ajusteTemporada.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;
  }
  if (subtotalServicios > 0) {
    investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Servicios Adicionales/Extras</td><td class="info-table-value">$${subtotalServicios.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;
  }
  if (descuento > 0) {
    investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Descuento</td><td class="info-table-value">-$${descuento.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;
  }
  investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Subtotal</td><td class="info-table-value">$${subtotalBase.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;
  investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Impuesto (${impuestoPorcentaje}%)</td><td class="info-table-value">$${impuestoMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;
  investmentBreakdown += `<tr class="info-table-row"><td class="info-table-label">Tarifa de Servicio (${tarifaServicioPorcentaje}%)</td><td class="info-table-value">$${tarifaServicioMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td></tr>`;

  // Generar acuerdo de pago en formato serio y profesional
  let paymentAgreement = '';
  if (contrato.tipo_pago === 'unico') {
    paymentAgreement = `
      <table class="info-table" style="margin-top: 20px;">
        <tr class="info-table-row">
          <td class="info-table-label" style="font-weight: 700;">Modalidad de Pago</td>
          <td class="info-table-value">PAGO ÚNICO</td>
        </tr>
        <tr class="info-table-row">
          <td class="info-table-label" style="font-weight: 700;">Condiciones</td>
          <td class="info-table-value">El pago total debe realizarse de una sola vez antes del evento. El pago completo debe estar liquidado al menos quince (15) días hábiles antes de la fecha del evento.</td>
        </tr>
      </table>`;
  } else if (contrato.plan_pagos) {
    const plan = typeof contrato.plan_pagos === 'string' ? JSON.parse(contrato.plan_pagos) : contrato.plan_pagos;
    if (plan) {
      paymentAgreement = `
        <table class="info-table" style="margin-top: 20px;">
          <tr class="info-table-row">
            <td class="info-table-label" style="font-weight: 700;">Modalidad de Pago</td>
            <td class="info-table-value">FINANCIAMIENTO EN ${contrato.meses_financiamiento || plan.pagos?.length || 'N/A'} CUOTAS</td>
          </tr>`;
      
      if (plan.depositoReserva) {
        paymentAgreement += `
          <tr class="info-table-row">
            <td class="info-table-label">Depósito de Reserva</td>
            <td class="info-table-value">$${plan.depositoReserva.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (No reembolsable)</td>
          </tr>`;
      }
      if (plan.segundoPago || plan.pagoInicial) {
        const segundoPago = plan.segundoPago || plan.pagoInicial || 0;
        paymentAgreement += `
          <tr class="info-table-row">
            <td class="info-table-label">Segundo Pago</td>
            <td class="info-table-value">$${segundoPago.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (10 días después de la reserva)</td>
          </tr>`;
      }
      if (plan.pagos && plan.pagos.length > 0) {
        plan.pagos.forEach((pago, index) => {
          // Intentar obtener la fecha de diferentes campos posibles
          let fechaVencimiento = 'Por definir';
          if (pago.fechaVencimiento) {
            fechaVencimiento = new Date(pago.fechaVencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          } else if (pago.fecha_estimada) {
            fechaVencimiento = new Date(pago.fecha_estimada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          } else if (pago.fecha_vencimiento) {
            fechaVencimiento = new Date(pago.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }
          const metodo = pago.metodo || 'Efectivo/Zelle';
          paymentAgreement += `
            <tr class="info-table-row">
              <td class="info-table-label">Cuota #${index + 1}</td>
              <td class="info-table-value">$${pago.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} - Fecha: ${fechaVencimiento} - Método: ${metodo}</td>
            </tr>`;
        });
      }
      paymentAgreement += `
          <tr class="info-table-row">
            <td class="info-table-label" style="font-weight: 700; color: #000000;">IMPORTANTE</td>
            <td class="info-table-value" style="font-weight: 600;">El pago completo debe estar liquidado al menos quince (15) días hábiles antes del evento. Todos los pagos son no reembolsables.</td>
          </tr>
        </table>`;
    }
  }

  // Generar historial de pagos
  let paymentHistory = '';
  if (contrato.pagos && contrato.pagos.length > 0) {
    paymentHistory = '<div class="section-title-corporate" style="margin-top: 40px;">Pagos Realizados</div><table class="info-table">';
    contrato.pagos.forEach((pago) => {
      const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const monto = (parseFloat(pago.monto) || 0).toFixed(2);
      const metodo = pago.metodo_pago || 'N/A';
      const estadoPago = (pago.estado || 'completado').toUpperCase();
      paymentHistory += `<tr class="info-table-row"><td class="info-table-label">${fechaPago}</td><td class="info-table-value">$${monto} - ${metodo} - ${estadoPago}</td></tr>`;
    });
    paymentHistory += '</table>';
  }

  // Generar términos y condiciones (compacto para que quepa en una página)
  const termsAndConditions = `
    <div class="terms-content">
      <div class="terms-intro">
        <p><strong>ACUERDO DE SERVICIO DE SALÓN DE BANQUETES</strong></p>
        <p><strong>TÉRMINOS Y CONDICIONES DEL CONTRATO</strong></p>
        <p>Este Acuerdo de Servicio de Salón de Banquetes ("Acuerdo") se celebra entre el Cliente identificado arriba y Diamond Venue at Doral ("El Salón"). Al firmar este contrato, ambas partes acuerdan cumplir con los siguientes términos y condiciones:</p>
      </div>
      
      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 1: SERVICIOS INCLUIDOS</div>
        <div class="terms-article-content">El Salón proporcionará los servicios especificados en este contrato, incluyendo el paquete seleccionado y los servicios adicionales contratados, de acuerdo con las especificaciones y términos establecidos.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 2: PAGOS Y DEPÓSITOS</div>
        <div class="terms-article-content">El Cliente se compromete a realizar los pagos según el plan de pagos acordado. Todos los depósitos son no reembolsables. El pago completo debe estar liquidado al menos quince (15) días hábiles antes del evento.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 3: CANCELACIONES Y REEMBOLSOS</div>
        <div class="terms-article-content">En caso de cancelación por parte del Cliente, todos los depósitos y pagos realizados son no reembolsables. El Salón se reserva el derecho de retener todos los pagos recibidos como compensación por los servicios reservados.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 4: CAMBIOS Y MODIFICACIONES</div>
        <div class="terms-article-content">Cualquier cambio o modificación al contrato debe ser acordado por escrito por ambas partes. Los cambios pueden estar sujetos a cargos adicionales según la naturaleza de la modificación.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 5: RESPONSABILIDADES DEL CLIENTE</div>
        <div class="terms-article-content">El Cliente es responsable de proporcionar información precisa sobre el número de invitados, preferencias alimentarias y cualquier requisito especial con al menos treinta (30) días de anticipación al evento.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 6: RESPONSABILIDADES DEL SALÓN</div>
        <div class="terms-article-content">El Salón se compromete a proporcionar los servicios acordados de manera profesional y de acuerdo con los estándares de calidad establecidos. El Salón no será responsable por retrasos o interrupciones causadas por circunstancias fuera de su control.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 7: DAÑOS Y RESPONSABILIDAD</div>
        <div class="terms-article-content">El Cliente será responsable de cualquier daño a las instalaciones, equipos o propiedad del Salón causado por el Cliente, sus invitados o proveedores. El Cliente debe proporcionar un seguro de responsabilidad civil si se requiere.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 8: HORARIOS Y DURACIÓN</div>
        <div class="terms-article-content">El evento se llevará a cabo en la fecha, hora y duración especificadas en este contrato. Cualquier extensión del tiempo acordado estará sujeta a cargos adicionales.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 9: PROHIBICIONES</div>
        <div class="terms-article-content">Está estrictamente prohibido fumar en áreas no designadas, traer bebidas alcohólicas externas sin autorización, y cualquier comportamiento que pueda poner en peligro la seguridad de los invitados o el personal.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 10: FUERZA MAYOR</div>
        <div class="terms-article-content">Ninguna de las partes será responsable por el incumplimiento de sus obligaciones debido a causas de fuerza mayor, incluyendo pero no limitado a desastres naturales, pandemias, o regulaciones gubernamentales.</div>
      </div>

      <div class="terms-article">
        <div class="terms-article-title">ARTÍCULO 11: LEY APLICABLE Y JURISDICCIÓN</div>
        <div class="terms-article-content">Este contrato se rige por las leyes del Estado de Florida. Cualquier disputa será resuelta en los tribunales competentes del Condado de Miami-Dade, Florida.</div>
      </div>

      <div class="terms-conclusion">
        Las partes declaran haber leído, comprendido y aceptado todos los términos y condiciones establecidos en este contrato.
      </div>
    </div>
  `;

  // Determinar número de páginas (ahora Términos y Firmas están en la misma página)
  const tieneServiciosAdicionales = serviciosAdicionalesFiltrados && serviciosAdicionalesFiltrados.length > 0;
  const totalPages = tieneServiciosAdicionales ? 5 : 4;
  const page3Number = tieneServiciosAdicionales ? 3 : 4;
  const page4Number = tieneServiciosAdicionales ? 4 : 3;
  const page5Number = tieneServiciosAdicionales ? 5 : 4;

  // Convertir logo a base64 si existe y generar HTML del logo
  let logoHTML = `<div style="font-size: 18px; font-weight: 100; color: #FFFFFF; letter-spacing: 2px;">${nombreCompania}</div>`;
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      logoHTML = `<img src="${logoBase64}" alt="${nombreCompania}" class="cover-logo" style="max-width: 180px; height: auto; opacity: 0.9; mix-blend-mode: screen;">`;
      console.log('Logo cargado correctamente:', logoPath);
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
      // Usar formato más compatible para Puppeteer - reemplazar completamente el patrón
      fondoStyle = `background-image: url("${fondoBase64}");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 1;
            display: block;`;
      console.log('Fondo cargado correctamente. Tamaño base64:', fondoBase64.length, 'caracteres');
    } catch (error) {
      console.error('Error al cargar fondo:', error);
    }
  } else {
    console.log('Fondo no encontrado o no es Revolution. Path:', fondoPath, 'esRevolution:', esRevolution);
  }

  // Cargar fondo general para package-card (servicios, términos, etc.)
  let packageCardBackground = '';
  
  if (esRevolution) {
    // Fondo para Revolution
    const fondoGeneralPath = path.join(__dirname, '../templates/assets/fondoRevolutionGeneral.png');
    if (fs.existsSync(fondoGeneralPath)) {
      try {
        const fondoGeneralBuffer = fs.readFileSync(fondoGeneralPath);
        const fondoGeneralBase64 = `data:image/png;base64,${fondoGeneralBuffer.toString('base64')}`;
        packageCardBackground = `background-image: url("${fondoGeneralBase64}");
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              opacity: 1;`;
        console.log('Fondo general cargado correctamente para package-card (Revolution)');
      } catch (error) {
        console.error('Error al cargar fondo general:', error);
        packageCardBackground = '';
      }
    }
  } else {
    // Fondo para Diamond
    const fondoDiamondPath = path.join(__dirname, '../../../fondoDiamond.png');
    if (fs.existsSync(fondoDiamondPath)) {
      try {
        const fondoDiamondBuffer = fs.readFileSync(fondoDiamondPath);
        const fondoDiamondBase64 = `data:image/png;base64,${fondoDiamondBuffer.toString('base64')}`;
        packageCardBackground = `background-image: url("${fondoDiamondBase64}");
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              opacity: 1;`;
        console.log('Fondo Diamond cargado correctamente para contratos');
      } catch (error) {
        console.error('Error al cargar fondo Diamond:', error);
        packageCardBackground = '';
      }
    } else {
      console.log('Fondo Diamond no encontrado en:', fondoDiamondPath);
    }
  }

  // Generar HTML para homenajeado en la portada
  const homenajeadoCover = homenajeado ? `<strong>Homenajeado/a:</strong> ${homenajeado}<br>` : '';

  // Reemplazos en el template
  const replacements = {
    '{{CONTRACT_CODE}}': contrato.codigo_contrato || 'N/A',
    '{{CLIENT_NAME}}': nombreCliente,
    '{{VENDEDOR_NAME}}': nombreVendedor,
    '{{VENDEDOR_PHONE}}': telefonoVendedor,
    '{{VENDEDOR_EMAIL}}': emailVendedor,
    '{{HOMENAJEADO_ROW}}': homenajeado ? `<tr class="info-table-row"><td class="info-table-label">Homenajeado/a</td><td class="info-table-value">${homenajeado}</td></tr>` : '',
    '{{HOMENAJEADO_COVER}}': homenajeadoCover,
    '{{EVENT_TYPE}}': tipoEvento,
    '{{EVENT_DATE}}': fechaEvento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    '{{EVENT_TIME}}': `${horaInicio} - ${horaFin}`,
    '{{GUEST_COUNT}}': cantidadInvitados,
    '{{CLIENT_EMAIL}}': emailCliente,
    '{{CLIENT_PHONE}}': telefonoCliente,
    '{{SALON_DIRECCION}}': direccionSalon,
    '{{PACKAGE_NAME}}': contrato.paquetes?.nombre || 'No especificado',
    '{{LOGO_HTML}}': logoHTML,
    '{{FONDO_STYLE}}': fondoStyle,
    '{{HAS_BACKGROUND_CLASS}}': hasBackground ? 'has-background' : '',
    '{{NOMBRE_COMPANIA}}': nombreCompania,
    '{{ES_REVOLUTION}}': esRevolution ? 'true' : 'false',
    '{{PACKAGE_CARD_BACKGROUND}}': packageCardBackground,
    '{{SERVICIOS_PAQUETE}}': htmlServiciosPaquete,
    '{{PAGE_3_SERVICIOS_ADICIONALES}}': tieneServiciosAdicionales ? `
      <div class="page page-3">
        <div class="page-content" style="padding: 0; height: 100%;">
          <div class="package-card" style="display: block;">
            <div style="padding: 30px 50px 25px 50px; text-align: left;">
              <h2 style="font-size: 3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; color: #ffffff; font-family: 'Poppins', sans-serif; margin: 0; line-height: 1.2;">Extras del Evento</h2>
            </div>
            <div class="package-content" style="width: 100%; padding: 0 50px 50px 50px; grid-template-columns: 1fr 1fr 1fr; gap: 45px;">
              ${htmlServiciosAdicionales}
            </div>
          </div>
        </div>
      </div>
    ` : '',
    '{{TOTAL_PAGES}}': totalPages,
    '{{PAGE_4_NUMBER}}': page4Number,
    '{{PAGE_5_NUMBER}}': page5Number,
    '{{INVESTMENT_BREAKDOWN}}': investmentBreakdown,
    '{{TOTAL_TO_PAY}}': `$${totalFinal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
    '{{TOTAL_CONTRACT}}': `$${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
    '{{TOTAL_PAID}}': `$${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
    '{{BALANCE_DUE}}': `$${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
    '{{PAYMENT_AGREEMENT}}': paymentAgreement,
    '{{PAYMENT_HISTORY}}': paymentHistory,
    '{{TERMS_AND_CONDITIONS}}': termsAndConditions,
    '{{VENDOR_FULL_NAME}}': nombreVendedor,
    '{{CLIENT_FULL_NAME}}': nombreCliente,
    '{{CLIENT_NAME_FIRST}}': nombreClientePrimero,
    '{{CURRENT_DATE}}': new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  };

  // Aplicar reemplazos
  Object.keys(replacements).forEach(key => {
    html = html.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), replacements[key]);
  });

  // Generar PDF con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
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
 * Formatea hora
 */
function formatearHora(hora) {
  if (!hora) return 'Por definir';
  if (hora instanceof Date) {
    return hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  if (typeof hora === 'string') {
    return hora;
  }
  return 'Por definir';
}

module.exports = {
  generarContratoHTML
};

