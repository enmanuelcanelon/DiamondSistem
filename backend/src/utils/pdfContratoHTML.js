const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Genera un PDF de contrato usando HTML + Puppeteer
 * @param {Object} contrato - Datos del contrato con relaciones
 * @returns {Buffer} - PDF como buffer
 */
async function generarContratoHTML(contrato) {
  // Leer el template HTML
  const templatePath = path.join(__dirname, '../templates/pdf-contrato.html');
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

  // Función para generar HTML de servicios por categoría (formato como ofertas)
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

  // Generar HTML de servicios adicionales en formato de tabla profesional
  // Usar directamente serviciosAdicionalesFiltrados para asegurar que TODOS se muestren
  const generarHTMLServiciosAdicionales = () => {
    if (!serviciosAdicionalesFiltrados || serviciosAdicionalesFiltrados.length === 0) {
      return '';
    }

    let html = '';
    let totalAdicionales = 0;

    console.log(`=== DEBUG: Total servicios adicionales filtrados: ${serviciosAdicionalesFiltrados.length} ===`);
    
    // Ordenar servicios para mostrar primero los más importantes
    const serviciosOrdenados = [...serviciosAdicionalesFiltrados].sort((a, b) => {
      const nombreA = (a.servicios?.nombre || '').toLowerCase();
      const nombreB = (b.servicios?.nombre || '').toLowerCase();
      
      // Priorizar servicios importantes
      if (nombreA.includes('hora extra') || nombreA.includes('horaextra')) return -1;
      if (nombreB.includes('hora extra') || nombreB.includes('horaextra')) return 1;
      if (nombreA.includes('photobooth') || nombreA.includes('print')) return -1;
      if (nombreB.includes('photobooth') || nombreB.includes('print')) return 1;
      
      return nombreA.localeCompare(nombreB);
    });
    
    serviciosOrdenados.forEach(cs => {
      const servicio = cs.servicios || {};
      const nombre = servicio.nombre || 'Servicio';
      const descripcion = servicio.descripcion || '';
      const cantidad = cs.cantidad || 1;
      const precioUnitario = parseFloat(cs.precio_unitario || 0);
      const subtotal = parseFloat(cs.subtotal || precioUnitario * cantidad);
      totalAdicionales += subtotal;
      
      console.log(`✓ Agregando: ${nombre} | Cantidad: ${cantidad} | Precio: $${precioUnitario} | Subtotal: $${subtotal}`);
      
      // Formato: Nombre - Descripción (si existe y es diferente)
      let descripcionCompleta = nombre;
      if (descripcion && descripcion.trim() && descripcion !== nombre) {
        descripcionCompleta += `: ${descripcion}`;
      }
      
      // Agregar cantidad si es mayor a 1
      if (cantidad > 1) {
        descripcionCompleta += ` (x${cantidad})`;
      }
      
      html += `
        <tr style="border-bottom: 1px solid #E0E0E0;">
          <td style="padding: 12px 15px; font-size: 13px; color: #2C2C2C; font-weight: 400; width: 50%;">${descripcionCompleta}</td>
          <td style="padding: 12px 15px; font-size: 13px; color: #2C2C2C; font-weight: 400; text-align: right; width: 25%;">$${precioUnitario.toFixed(2)} c/u</td>
          <td style="padding: 12px 15px; font-size: 13px; color: #2C2C2C; font-weight: 600; text-align: right; width: 25%;">$${subtotal.toFixed(2)}</td>
        </tr>`;
    });
    
    console.log(`=== TOTAL CALCULADO: $${totalAdicionales.toFixed(2)} ===`);

    return `
      <table class="info-table" style="margin-top: 20px; width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #000000; background-color: #F8F9FA;">
            <td style="padding: 12px 15px; font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.8px; width: 50%;">Descripción</td>
            <td style="padding: 12px 15px; font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.8px; text-align: right; width: 25%;">Precio Unitario</td>
            <td style="padding: 12px 15px; font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.8px; text-align: right; width: 25%;">Subtotal</td>
          </tr>
        </thead>
        <tbody>
          ${html}
          <tr style="border-top: 2px solid #000000;">
            <td style="padding: 12px 15px; font-size: 13px; font-weight: 700; color: #000000; padding-top: 15px;">TOTAL SERVICIOS ADICIONALES</td>
            <td colspan="2" style="padding: 12px 15px; font-size: 13px; font-weight: 700; color: #000000; text-align: right; padding-top: 15px;">$${totalAdicionales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>`;
  };

  // Calcular el total de servicios adicionales desde los servicios filtrados (igual que en la tabla)
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

  // Obtener información del salón
  const salon = contrato.salones || null;
  let direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
  
  if (salon) {
    const nombreSalon = salon.nombre || '';
    if (nombreSalon.toLowerCase().includes('doral')) {
      direccionSalon = 'Salón Doral<br>8726 NW 26th St<br>Doral, FL 33172';
    } else if (nombreSalon.toLowerCase().includes('kendall')) {
      direccionSalon = 'Salón Kendall<br>14271 Southwest 120th Street<br>Kendall, Miami, FL 33186';
    } else if (nombreSalon.toLowerCase().includes('diamond')) {
      direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
    }
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

  // Determinar número de páginas
  const tieneServiciosAdicionales = serviciosAdicionalesFiltrados && serviciosAdicionalesFiltrados.length > 0;
  const totalPages = tieneServiciosAdicionales ? 6 : 5;
  const page3Number = tieneServiciosAdicionales ? 3 : 4;
  const page4Number = tieneServiciosAdicionales ? 4 : 3;
  const page5Number = tieneServiciosAdicionales ? 5 : 4;
  const page6Number = tieneServiciosAdicionales ? 6 : 5;

  // Reemplazos en el template
  const replacements = {
    '{{CONTRACT_CODE}}': contrato.codigo_contrato || 'N/A',
    '{{CLIENT_NAME}}': nombreCliente,
    '{{VENDEDOR_NAME}}': nombreVendedor,
    '{{VENDEDOR_PHONE}}': telefonoVendedor,
    '{{VENDEDOR_EMAIL}}': emailVendedor,
    '{{HOMENAJEADO_ROW}}': homenajeado ? `<tr class="info-table-row"><td class="info-table-label">Homenajeado/a</td><td class="info-table-value">${homenajeado}</td></tr>` : '',
    '{{EVENT_TYPE}}': tipoEvento,
    '{{EVENT_DATE}}': fechaEvento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    '{{EVENT_TIME}}': `${horaInicio} - ${horaFin}`,
    '{{GUEST_COUNT}}': cantidadInvitados,
    '{{CLIENT_EMAIL}}': emailCliente,
    '{{CLIENT_PHONE}}': telefonoCliente,
    '{{SALON_DIRECCION}}': direccionSalon,
    '{{PACKAGE_NAME}}': contrato.paquetes?.nombre || 'No especificado',
    '{{SERVICIOS_PAQUETE}}': htmlServiciosPaquete,
    '{{PAGE_3_SERVICIOS_ADICIONALES}}': tieneServiciosAdicionales ? `
      <div class="page page-3">
        <div class="corporate-header">
          <div class="corporate-header-top">
            <div class="document-title">Servicios Adicionales</div>
            <div class="document-number">Página 3 de ${totalPages}</div>
          </div>
          <div class="header-divider"></div>
        </div>
        <div class="page-content">
          <div class="section-title-corporate">Servicios Adicionales Extras</div>
          ${htmlServiciosAdicionales}
        </div>
      </div>
    ` : '',
    '{{TOTAL_PAGES}}': totalPages,
    '{{PAGE_4_NUMBER}}': page4Number,
    '{{PAGE_5_NUMBER}}': page5Number,
    '{{PAGE_6_NUMBER}}': page6Number,
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
    '{{CURRENT_DATE}}': new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  };

  // Aplicar reemplazos
  Object.keys(replacements).forEach(key => {
    html = html.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), replacements[key]);
  });

  // Generar PDF con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
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

