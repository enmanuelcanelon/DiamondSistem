const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Genera una Factura Proforma usando HTML + Puppeteer
 * @param {Object} datos - Datos de la oferta o contrato
 * @param {String} tipo - 'oferta' o 'contrato'
 * @returns {Buffer} - PDF como buffer
 */
async function generarFacturaProformaHTML(datos, tipo = 'oferta', lang = 'es') {
  // Importar traducciones
  const { t } = require('./translations');
  
  // Leer el template HTML (se determinará cuál usar después de detectar la compañía)

  // Organizar servicios por categoría
  const serviciosOrganizados = organizarServiciosPorCategoria(datos);

  // Separar servicios del paquete y adicionales
  const separarServicios = (servicios) => {
    const delPaquete = servicios.filter(s => s.esPaquete === true);
    const adicionales = servicios.filter(s => s.esPaquete === false);
    return { delPaquete, adicionales };
  };

  // Preparar datos para reemplazar en el template
  // Usar el nombre real del paquete sin modificaciones
  const nombrePaquete = datos.paquetes?.nombre || 'Deluxe Package';
  const nombrePaqueteLimpio = nombrePaquete;
  
  // Obtener primer nombre del cliente para Diamond
  const nombreClienteCompleto = datos.clientes?.nombre_completo || 'N/A';
  const nombreClientePrimero = nombreClienteCompleto.split(' ')[0] || nombreClienteCompleto;

  const nombreCliente = datos.clientes?.nombre_completo || 'N/A';
  const nombreVendedor = datos.vendedores?.nombre_completo || datos.vendedor?.nombre_completo || datos.usuarios?.nombre_completo || 'N/A';
  // Obtener teléfono del vendedor - asegurar que no sea undefined, vacío o 0000000000
  const telefonoVendedorRaw = datos.vendedores?.telefono || datos.vendedor?.telefono || datos.usuarios?.telefono;
  const telefonoVendedor = (telefonoVendedorRaw && telefonoVendedorRaw.trim() !== '' && telefonoVendedorRaw !== '0000000000') 
    ? telefonoVendedorRaw 
    : '+1 (786) 332-7065';
  const emailVendedor = datos.vendedores?.email || datos.vendedor?.email || datos.usuarios?.email || 'diamondvenueatdoral@gmail.com';
  const homenajeado = datos.homenajeado || '';
  // IMPORTANTE: Usar el tipo de evento de la oferta específica (datos.tipo_evento)
  // NO usar el del cliente para que cada oferta sea independiente
  // El campo tipo_evento debe estar directamente en el objeto datos (oferta)
  const tipoEvento = datos.tipo_evento || (datos.clientes && datos.clientes.tipo_evento) || 'Event';
  
  
  if (!datos.tipo_evento) {
    console.warn('⚠️ Oferta sin tipo_evento. ID:', datos.id || 'N/A', 'Usando:', datos.clientes?.tipo_evento || 'Event');
  }
  const fechaEvento = new Date(datos.fecha_evento);
  const fechaCreacionOferta = datos.fecha_creacion 
    ? new Date(datos.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  // Debug temporal para ver qué formato tienen las horas
  console.log('🔍 Debug horas PDF:', {
    hora_inicio_raw: datos.hora_inicio,
    hora_inicio_type: typeof datos.hora_inicio,
    hora_inicio_isDate: datos.hora_inicio instanceof Date,
    hora_fin_raw: datos.hora_fin,
    hora_fin_type: typeof datos.hora_fin,
    hora_fin_isDate: datos.hora_fin instanceof Date,
    hora_fin_UTC: datos.hora_fin instanceof Date ? datos.hora_fin.getUTCHours() : 'N/A',
    hora_fin_local: datos.hora_fin instanceof Date ? datos.hora_fin.getHours() : 'N/A'
  });
  
  const horaInicio = formatearHora(datos.hora_inicio);
  const horaFin = formatearHora(datos.hora_fin);
  
  console.log('🔍 Horas formateadas:', { horaInicio, horaFin });
  const cantidadInvitados = datos.cantidad_invitados || 0;
  const emailCliente = datos.clientes?.email || '';
  // Obtener teléfono del cliente - asegurar que no sea undefined, vacío o 0000000000
  const telefonoClienteRaw = datos.clientes?.telefono;
  const telefonoCliente = (telefonoClienteRaw && telefonoClienteRaw.trim() !== '' && telefonoClienteRaw !== '0000000000') 
    ? telefonoClienteRaw 
    : '';

  // Obtener información del salón y detectar compañía
  const salon = datos.salones || null;
  const lugarSalon = datos.lugar_salon || '';
  let direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166'; // Default
  let esRevolution = false;
  let esDiamond = false;
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
      esDiamond = true;
      nombreCompania = 'Diamond Venue';
    }
  }

  // Leer el template HTML según la compañía
  const templatePath = esRevolution 
    ? path.join(__dirname, '../templates/pdf-factura.html')
    : path.join(__dirname, '../templates/pdf-factura-diamond.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Calcular precios
  const precioPaquete = parseFloat(datos.precio_paquete_base || datos.precio_base || 0);
  const ajusteTemporada = parseFloat(datos.ajuste_temporada || datos.ajuste_temporada_custom || 0);
  const precioTemporada = precioPaquete + ajusteTemporada;
  const descuento = parseFloat(datos.descuento || 0);
  
  // Obtener subtotal base (incluye paquete + servicios adicionales + invitados adicionales)
  const subtotalBase = parseFloat(datos.subtotal || 0);
  const subtotalConDescuento = subtotalBase - descuento;
  
  // Obtener total final y porcentajes
  const total = parseFloat(datos.total_final || 0);
  const impuestoPorcentaje = parseFloat(datos.impuesto_porcentaje || 7);
  const serviceFeePorcentaje = parseFloat(datos.tarifa_servicio_porcentaje || 18);
  
  // Recalcular impuestos y tarifa de servicio basándose en el subtotal con descuento
  // para asegurar que la suma coincida con el total
  let impuesto, serviceFee, precioEspecial;
  
  if (total > 0 && subtotalConDescuento > 0) {
    // Calcular impuestos basándose en el subtotal con descuento
    impuesto = (subtotalConDescuento * impuestoPorcentaje) / 100;
    serviceFee = (subtotalConDescuento * serviceFeePorcentaje) / 100;
    
    // Verificar que la suma coincida con el total
    const sumaCalculada = subtotalConDescuento + impuesto + serviceFee;
    const diferencia = Math.abs(total - sumaCalculada);
    
    // Si hay diferencia, ajustar para que coincida exactamente con el total
    if (diferencia > 0.01) {
      // Ajustar proporcionalmente los impuestos para que la suma sea exacta
      const factorAjuste = (total - subtotalConDescuento) / (impuesto + serviceFee);
      impuesto = impuesto * factorAjuste;
      serviceFee = serviceFee * factorAjuste;
    }
    
    // El precio especial mostrado será el subtotal con descuento
    precioEspecial = subtotalConDescuento;
  } else {
    // Fallback: usar valores de la base de datos
    precioEspecial = precioTemporada - descuento;
    impuesto = parseFloat(datos.impuesto_monto || 0);
    serviceFee = parseFloat(datos.tarifa_servicio_monto || 0);
  }
  
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

  // Obtener nombre del salón para filtrar equipos
  const nombreSalonParaFiltro = (salon?.nombre || lugarSalon || '').toLowerCase();
  const esKendall = nombreSalonParaFiltro.includes('kendall');
  const esDoral = nombreSalonParaFiltro.includes('doral') && !nombreSalonParaFiltro.includes('diamond');

  // Función para mapear servicios a las nuevas categorías organizadas
  const mapearServicioACategoria = (servicio) => {
    const nombre = (servicio.nombre || servicio.descripcion || servicio.servicios?.nombre || servicio.servicios?.descripcion || '').toLowerCase();
    const descripcion = (servicio.descripcion || servicio.servicios?.descripcion || '').toLowerCase();
    const texto = `${nombre} ${descripcion}`;
    
    // Obtener nombre del salón para filtros específicos
    const nombreSalonParaFiltro = (salon?.nombre || lugarSalon || '').toLowerCase();
    const esKendallLocal = nombreSalonParaFiltro.includes('kendall');
    const esDoralLocal = nombreSalonParaFiltro.includes('doral') && !nombreSalonParaFiltro.includes('diamond');
    const esDiamondLocal = nombreSalonParaFiltro.includes('diamond') && !esDoralLocal;

    // BEBIDAS - Champaña debe detectarse ANTES que sidra y de forma más específica
    // Priorizar detección por nombre exacto primero
    const nombreExacto = nombre.trim();
    if (nombreExacto.includes('champaña') || nombreExacto.includes('champagne')) {
      // Si el nombre contiene champaña, es champaña (a menos que también diga sidra explícitamente)
      if (!nombreExacto.includes('sidra') && !nombreExacto.includes('cider')) {
        return { categoria: 'bebidas', item: 'Champaña' };
      }
    }
    // Luego verificar en el texto completo, pero excluyendo sidra
    if ((texto.includes('champaña') || texto.includes('champagne')) && !texto.includes('sidra') && !texto.includes('cider')) {
      return { categoria: 'bebidas', item: 'Champaña' };
    }
    // Licor Premium debe detectarse ANTES que "premium" genérico
    if (texto.includes('licor premium') || (texto.includes('premium') && (texto.includes('licor') || texto.includes('liquor')))) {
      return { categoria: 'bebidas', item: 'Licor Premium' };
    }
    // Licor House/Básico
    if (texto.includes('licor house') || texto.includes('licor básico') || texto.includes('licor basico') || (texto.includes('licor') && (texto.includes('house') || texto.includes('básico') || texto.includes('basico')))) {
      return { categoria: 'bebidas', item: 'Licor House' };
    }
    if (texto.includes('refresco') || texto.includes('jugo') || texto.includes('agua') || texto.includes('bebida no alcohólica') || texto.includes('soft drink')) {
      return { categoria: 'bebidas', item: 'Refrescos/Jugo/Agua' };
    }
    // Sidra debe detectarse DESPUÉS de champaña para evitar conflictos
    // Priorizar detección por nombre exacto primero
    if (nombreExacto.includes('sidra') || nombreExacto.includes('cider')) {
      // Si el nombre contiene sidra, es sidra (a menos que también diga champaña explícitamente)
      if (!nombreExacto.includes('champaña') && !nombreExacto.includes('champagne')) {
        return { categoria: 'bebidas', item: 'Sidra' };
      }
    }
    // Luego verificar en el texto completo, pero excluyendo champaña
    if ((texto.includes('sidra') || texto.includes('cider')) && !texto.includes('champaña') && !texto.includes('champagne')) {
      return { categoria: 'bebidas', item: 'Sidra' };
    }

    // COMIDA
    if (texto.includes('cake') || texto.includes('torta') || texto.includes('vainilla') || texto.includes('marmoleado')) {
      return { categoria: 'comida', item: 'Cake (Vainilla o Marmoleado)' };
    }
    // Detectar menú/comida con múltiples variantes incluyendo "primer", "segundo", "plato", "escoger"
    if (texto.includes('menu') || texto.includes('menú') || 
        texto.includes('ensalada') || texto.includes('proteína') || texto.includes('proteina') || 
        texto.includes('acompañante') || texto.includes('acompanante') ||
        (texto.includes('primer') && texto.includes('segundo')) ||
        (texto.includes('primer') && texto.includes('plato')) ||
        (texto.includes('segundo') && texto.includes('plato')) ||
        (texto.includes('comida') && (texto.includes('primer') || texto.includes('segundo') || texto.includes('plato') || texto.includes('escoger')))) {
      return { categoria: 'comida', item: 'Menu : Entrada y Proteína (2 acompañantes)' };
    }
    if (texto.includes('mesa de queso') || texto.includes('cheese table') || texto.includes('quesos variados')) {
      return { categoria: 'comida', item: 'Mesa de Quesos & Carnes frias' };
    }
    if (texto.includes('mini dulce') || texto.includes('12 mini dulce') || texto.includes('paquete de 12')) {
      return { categoria: 'comida', item: 'Mini Dulces' };
    }
    if (texto.includes('pasapalo') || texto.includes('appetizer')) {
      return { categoria: 'comida', item: 'Pasapalos' };
    }
    if (texto.includes('utensilio') || texto.includes('plato') || texto.includes('cubierto') || texto.includes('vaso') || texto.includes('servilleta')) {
      return { categoria: 'comida', item: 'Utensilios' };
    }

    // DECORACIÓN
    // Detectar variantes específicas primero - Lounge Set + Cocktail
    // IMPORTANTE: Solo permitir en Diamond, NO en Doral ni Kendall
    if (texto.includes('lounge set') || 
        (texto.includes('lounge') && texto.includes('cocktail')) ||
        (texto.includes('lounge') && texto.includes('set')) ||
        (texto.includes('cocktail') && (texto.includes('lounge') || texto.includes('set')))) {
      // Solo incluir si es Diamond, excluir en Doral y Kendall
      if (esKendallLocal || esDoralLocal) {
        return null; // No incluir en Kendall ni Doral
      }
      return { categoria: 'decoracion', item: 'Lounge Set + Cocktail' };
    }
    if (texto.includes('decoración house') || texto.includes('decoracion house') || texto.includes('decoración básico') || texto.includes('decoracion basico') || texto.includes('table setting') || texto.includes('centerpiece') || texto.includes('runner') || texto.includes('charger')) {
      return { categoria: 'decoracion', item: 'Decoracion House' };
    }
    if (texto.includes('decoración plus') || texto.includes('decoracion plus') || texto.includes('decoración premium') || texto.includes('decoracion premium')) {
      return { categoria: 'decoracion', item: 'Decoración Plus' };
    }
    if (texto.includes('número lumínico') || texto.includes('numero luminico') || texto.includes('número iluminado') || texto.includes('numero iluminado') || texto.includes('number')) {
      return { categoria: 'decoracion', item: 'Número Lumínico' };
    }
    // Detección genérica de decoración (debe ir después de las específicas)
    // Si solo dice "decoración" sin especificar, mostrar como "Decoración House"
    if (texto.includes('decoración') || texto.includes('decoracion') || texto.includes('decoration')) {
      return { categoria: 'decoracion', item: 'Decoracion House' };
    }

    // ENTRETENIMIENTO
    // Hora Loca debe detectarse PRIMERO y de forma muy específica para no confundirse con animador
    if (nombreExacto.includes('hora loca') || 
        texto.includes('hora loca') ||
        (nombreExacto.includes('hora') && nombreExacto.includes('loca') && !nombreExacto.includes('extra'))) {
      return { categoria: 'entretenimiento', item: 'Hora Loca' };
    }
    // Animador - solo si NO es hora loca
    // Detectar por nombre exacto primero (más específico)
    if (nombreExacto.includes('animador') || nombreExacto.includes('animación') || nombreExacto.includes('animacion')) {
      // Si el nombre contiene animador, es animador (a menos que también diga hora loca o adicional explícitamente)
      if (!nombreExacto.includes('hora loca') && !nombreExacto.includes('adicional')) {
        return { categoria: 'entretenimiento', item: 'Animador' };
      }
    }
    // Luego verificar en el texto completo, pero excluyendo hora loca y adicional
    if ((texto.includes('animador') || texto.includes('animación') || texto.includes('animacion')) &&
        !texto.includes('hora loca') && !nombreExacto.includes('hora loca') &&
        !texto.includes('adicional')) {
      return { categoria: 'entretenimiento', item: 'Animador' };
    }
    if (texto.includes('dj') || texto.includes('disc jockey')) {
      return { categoria: 'entretenimiento', item: 'DJ Profesional' };
    }
    if (texto.includes('maestro de ceremonia') || texto.includes('mc') || texto.includes('master of ceremony')) {
      return { categoria: 'entretenimiento', item: 'Maestro de Ceremonia' };
    }

    // EQUIPOS
    // Luces Stage - detectar múltiples variantes
    if (texto.includes('luce stage') || texto.includes('luces stage') || texto.includes('luz stage') || 
        texto.includes('stage lighting') || texto.includes('stage light') || 
        texto.includes('iluminación stage') || texto.includes('iluminacion stage') ||
        texto.includes('iluminación del stage') || texto.includes('iluminacion del stage') ||
        (texto.includes('stage') && (texto.includes('luz') || texto.includes('luce') || texto.includes('luces') || texto.includes('lighting') || texto.includes('iluminación') || texto.includes('iluminacion')))) {
      return { categoria: 'equipos', item: 'Luces Stage' };
    }
    if (texto.includes('mapping') || texto.includes('proyección mapping') || texto.includes('proyeccion mapping')) {
      return { categoria: 'equipos', item: 'Mapping' };
    }
    // Máquina de Chispas - NO permitida en Kendall, solo en Doral
    if (texto.includes('máquina de chispa') || texto.includes('maquina de chispa') || texto.includes('spark')) {
      // Si es Kendall, no mostrar máquina de chispas
      if (esKendall) {
        return null; // No incluir en Kendall
      }
      return { categoria: 'equipos', item: 'Máquina de Chispas' };
    }
    // Máquina de Humo - permitida en todos los salones
    if (texto.includes('máquina de humo') || texto.includes('maquina de humo') || texto.includes('smoke')) {
      return { categoria: 'equipos', item: 'Máquina de Humo' };
    }
    // Pantalla - diferente según el salón
    if (texto.includes('pantalla') || texto.includes('led') || texto.includes('tv') || texto.includes('screen')) {
      // En Kendall y Diamond es "Pantalla LED", en Doral (Revolution) es "Pantalla TV"
      const esDiamond = !esRevolution;
      if (esKendall || esDiamond) {
        return { categoria: 'equipos', item: 'Pantalla LED' };
      } else {
        return { categoria: 'equipos', item: 'Pantalla TV' };
      }
    }

    // EXTRAS
    if (texto.includes('hora extra') || texto.includes('hora adicional')) {
      return { categoria: 'extras', item: 'Hora Extra' };
    }

    // FOTOGRAFÍA
    // Foto y Video debe detectarse ANTES que photobooth
    if ((texto.includes('foto') || texto.includes('photo')) && (texto.includes('video') || texto.includes('vídeo')) && (texto.includes('3 hora') || texto.includes('3h'))) {
      return { categoria: 'fotografia', item: 'Foto y Video 3 Horas' };
    }
    if ((texto.includes('foto') || texto.includes('photo')) && (texto.includes('video') || texto.includes('vídeo')) && (texto.includes('5 hora') || texto.includes('5h'))) {
      return { categoria: 'fotografia', item: 'Foto y Video 5 Horas' };
    }
    // Photobooth 360 debe detectarse ANTES que photobooth genérico
    if (texto.includes('photobooth 360') || texto.includes('cabina 360') || (texto.includes('360') && (texto.includes('photobooth') || texto.includes('cabina') || texto.includes('fotográfica') || texto.includes('fotografica')))) {
      return { categoria: 'fotografia', item: 'Photobooth 360' };
    }
    // Photobooth Print
    if (texto.includes('photobooth print') || (texto.includes('photobooth') && (texto.includes('print') || texto.includes('impresión') || texto.includes('impresion'))) || (texto.includes('cabina fotográfica') && (texto.includes('impresión') || texto.includes('impresion'))) || (texto.includes('cabina fotografica') && (texto.includes('impresión') || texto.includes('impresion')))) {
      return { categoria: 'fotografia', item: 'Photobooth Print' };
    }

    // TRANSPORTE - Debe detectarse ANTES de PERSONAL para evitar conflictos
    // Detectar limosina de forma más específica
    if (texto.includes('limosina') || texto.includes('limousine') || texto.includes('limo') ||
        nombreExacto.includes('limosina') || nombreExacto.includes('limousine') || nombreExacto.includes('limo')) {
      return { categoria: 'transporte', item: 'Limosina (15 Millas)' };
    }

    // PERSONAL
    // IMPORTANTE: El orden de detección es crucial
    // 1. Bartender - debe detectarse PRIMERO y de forma muy específica
    if (nombreExacto.includes('bartender') || nombreExacto.includes('barman') || 
        (texto.includes('bartender') && !texto.includes('coordinador')) || 
        (texto.includes('barman') && !texto.includes('coordinador'))) {
      return { categoria: 'personal', item: 'Bartender' };
    }
    // 2. Personal de Atención - debe detectarse ANTES que Coordinador para evitar conflictos
    // Detectar "personal de atención" o "personal de servicio" de forma específica
    if ((nombreExacto.includes('personal de atención') || nombreExacto.includes('personal de servicio')) &&
        !texto.includes('limosina') && !texto.includes('limousine') && !texto.includes('limo') &&
        !texto.includes('bartender') && !texto.includes('barman') && 
        !texto.includes('coordinador') && !texto.includes('coordinator')) {
      return { categoria: 'personal', item: 'Personal de Atención' };
    }
    // También detectar variantes como "mesero" o "waiter" si no es coordinador ni bartender
    if ((texto.includes('mesero') || texto.includes('waiter') || 
         texto.includes('personal atención') || 
         (texto.includes('servicio') && texto.includes('personal') && !texto.includes('coordinador'))) &&
        !texto.includes('limosina') && !texto.includes('limousine') && !texto.includes('limo') &&
        !texto.includes('bartender') && !texto.includes('barman') && 
        !texto.includes('coordinador') && !texto.includes('coordinator')) {
      return { categoria: 'personal', item: 'Personal de Atención' };
    }
    // 3. Coordinador de Eventos - debe detectarse DESPUÉS de los anteriores
    if (texto.includes('coordinador') || texto.includes('coordinator') || texto.includes('event coordinator')) {
      return { categoria: 'personal', item: 'Coordinador de Eventos' };
    }

    return null; // Si no coincide con ninguna categoría, no se muestra
  };

  // Función para generar HTML de servicios por categoría (nuevo diseño organizado)
  // Retorna un objeto con el HTML y el estilo del grid
  const generarHTMLServicios = (serviciosPorCategoria, esPaquete) => {
    // Reorganizar servicios según las nuevas categorías
    // Usar objetos en lugar de arrays para contar cantidades
    const serviciosOrganizados = {
      bebidas: {},
      comida: {},
      decoracion: {},
      entretenimiento: {},
      equipos: {},
      extras: {},
      fotografia: {},
      personal: {},
      transporte: {}
    };

    // Procesar todos los servicios y mapearlos a las nuevas categorías
    // IMPORTANTE: Solo procesar servicios que corresponden (esPaquete debe coincidir)
    Object.values(serviciosPorCategoria).flat().forEach(servicio => {
      // Verificar que el servicio corresponde al tipo (paquete o extra)
      const servicioEsPaquete = servicio.esPaquete === true;

      // EXCEPCIÓN: "Hora Extra" siempre debe aparecer en EXTRAS, nunca en PAQUETE
      const nombreServicio = (servicio.nombre || servicio.servicios?.nombre || '').toLowerCase();
      const esHoraExtra = nombreServicio.includes('hora extra') || nombreServicio.includes('hora adicional');

      if (esHoraExtra) {
        // Si es Hora Extra y estamos generando PAQUETE, saltarla (no mostrar en paquete)
        if (esPaquete) return;
        // Si es Hora Extra y estamos generando EXTRAS, siempre incluirla
        // (continuar procesando)
      } else {
        // Para otros servicios, aplicar la lógica normal
        if (esPaquete && !servicioEsPaquete) return; // Si es paquete, solo servicios del paquete
        if (!esPaquete && servicioEsPaquete) return; // Si es extra, solo servicios adicionales
      }

      const mapeo = mapearServicioACategoria(servicio);
      if (mapeo) {
        // Contar servicios duplicados para mostrar cantidad
        // Usar un objeto para contar en lugar de un array simple
        if (!serviciosOrganizados[mapeo.categoria]) {
          serviciosOrganizados[mapeo.categoria] = {};
        }
        // Usar la cantidad real del servicio si existe, de lo contrario incrementar en 1
        const cantidadServicio = servicio.cantidad || 1;
        if (!serviciosOrganizados[mapeo.categoria][mapeo.item]) {
          serviciosOrganizados[mapeo.categoria][mapeo.item] = 0;
        }
        serviciosOrganizados[mapeo.categoria][mapeo.item] += cantidadServicio;
      }
    });

    // Verificar si hay servicios organizados (si no hay, retornar HTML vacío)
    // Ahora serviciosOrganizados contiene objetos con cantidades, no arrays
    const tieneServicios = Object.values(serviciosOrganizados).some(items => {
      if (typeof items === 'object' && items !== null && !Array.isArray(items)) {
        return Object.keys(items).length > 0;
      }
      return false;
    });
    if (!tieneServicios) {
      return ''; // Retornar HTML vacío si no hay servicios
    }

    // Definir categorías con sus títulos
    const categorias = [
      { key: 'bebidas', titulo: 'BEBIDAS' },
      { key: 'comida', titulo: 'COMIDA' },
      { key: 'decoracion', titulo: 'DECORACIÓN' },
      { key: 'entretenimiento', titulo: 'ENTRETENIMIENTO' },
      { key: 'equipos', titulo: 'EQUIPOS' },
      { key: 'extras', titulo: 'EXTRAS' },
      { key: 'fotografia', titulo: 'FOTOGRAFÍA' },
      { key: 'personal', titulo: 'PERSONAL' },
      { key: 'transporte', titulo: 'TRANSPORTE' }
    ];

    // Distribuir en 3 columnas (solo las que tienen servicios)
    // Ahora serviciosOrganizados contiene objetos con cantidades, no arrays
    const categoriasConServicios = categorias.filter(cat => {
      const items = serviciosOrganizados[cat.key];
      return items && typeof items === 'object' && !Array.isArray(items) && Object.keys(items).length > 0;
    });
    
    // Función helper para verificar si una categoría tiene servicios
    const tieneServiciosEnCategoria = (key) => {
      const items = serviciosOrganizados[key];
      return items && typeof items === 'object' && !Array.isArray(items) && Object.keys(items).length > 0;
    };
    
    // Organizar columnas para usar esquinas primero
    // Columna 1 (izquierda): bebidas, decoracion, equipos, transporte
    const col1 = ['bebidas', 'decoracion', 'equipos', 'transporte'].filter(key => 
      tieneServiciosEnCategoria(key)
    );
    // Columna 2 (centro): comida, entretenimiento, fotografia
    const col2 = ['comida', 'entretenimiento', 'fotografia'].filter(key => 
      tieneServiciosEnCategoria(key)
    );
    // Columna 3 (derecha): extras, personal
    const col3 = ['extras', 'personal'].filter(key => 
      tieneServiciosEnCategoria(key)
    );

    // Determinar cuántas columnas tienen contenido
    const columnasConContenido = [col1.length > 0, col2.length > 0, col3.length > 0].filter(Boolean).length;
    
    // Función helper para generar HTML de categoría
    // items ahora es un objeto con cantidades: { "Photobooth 360": 2, "Hora Loca": 2 }
    const generarCategoriaHTML = (cat, items) => {
      const itemsArray = Object.entries(items || {});
      if (itemsArray.length > 0) {
        let html = `
          <div class="package-info-block">
            <h3>${cat.titulo}</h3>
            <ul>`;
        
          itemsArray.forEach(([item, cantidad]) => {
            // Mostrar cantidad solo si es mayor a 1, usando formato (número)
            const itemConCantidad = cantidad > 1 ? `${item} (${cantidad})` : item;
            html += `<li>${itemConCantidad}</li>`;
          });
        
        html += `</ul></div>`;
        return html;
      }
      return '';
    };

    // Determinar qué columnas tienen contenido
    const tieneCol1 = col1.length > 0;
    const tieneCol2 = col2.length > 0;
    const tieneCol3 = col3.length > 0;
    
    // Construir HTML de columnas sin justify-self para que el grid las distribuya equitativamente
    let htmlCol1 = '<div class="package-col">';
    let htmlCol2 = '<div class="package-col">';
    let htmlCol3 = '<div class="package-col">';

    // Columna 1
    col1.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const items = serviciosOrganizados[cat.key] || {};
        htmlCol1 += generarCategoriaHTML(cat, items);
      }
    });
    htmlCol1 += '</div>';

    // Columna 2
    col2.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const items = serviciosOrganizados[cat.key] || {};
        htmlCol2 += generarCategoriaHTML(cat, items);
      }
    });
    htmlCol2 += '</div>';

    // Columna 3
    col3.forEach(key => {
      const cat = categorias.find(c => c.key === key);
      if (cat) {
        const items = serviciosOrganizados[cat.key] || {};
        htmlCol3 += generarCategoriaHTML(cat, items);
      }
    });
    htmlCol3 += '</div>';

    // Determinar el estilo del grid según el número de columnas
    // Reorganizar el orden de las columnas para que siempre empiecen desde la izquierda
    let htmlFinal = '';
    let gridStyle = '';
    
    if (columnasConContenido === 1) {
      // Si solo hay 1 columna, usar solo esa columna y centrarla
      if (tieneCol1) htmlFinal = htmlCol1;
      else if (tieneCol2) htmlFinal = htmlCol2;
      else if (tieneCol3) htmlFinal = htmlCol3;
      gridStyle = 'grid-template-columns: 1fr; max-width: 100%;';
    } else if (columnasConContenido === 2) {
      // Si hay 2 columnas, usar solo 2 columnas para distribuir mejor el espacio
      if (tieneCol1 && tieneCol2) {
        htmlFinal = htmlCol1 + htmlCol2;
        gridStyle = 'grid-template-columns: 1fr 1fr; max-width: 100%;';
      } else if (tieneCol1 && tieneCol3) {
        htmlFinal = htmlCol1 + htmlCol3;
        gridStyle = 'grid-template-columns: 1fr 1fr; max-width: 100%;';
      } else if (tieneCol2 && tieneCol3) {
        // Cuando solo hay col2 y col3, usar solo 2 columnas
        htmlFinal = htmlCol2 + htmlCol3;
        gridStyle = 'grid-template-columns: 1fr 1fr; max-width: 100%;';
      }
    } else {
      // Si hay 3 columnas, usar todas normalmente
      htmlFinal = htmlCol1 + htmlCol2 + htmlCol3;
      gridStyle = 'grid-template-columns: 1fr 1fr 1fr; max-width: 100%;';
    }

    return {
      html: htmlFinal,
      gridStyle: gridStyle
    };
  };

  // Función para procesar y reorganizar servicios adicionales según las instrucciones
  const procesarServiciosAdicionales = (servicios) => {
    // Asegurar que servicios no sea undefined o null
    if (!servicios || typeof servicios !== 'object') {
      return {
        venue: [],
        cake: [],
        decoration: [],
        specials: [],
        barService: [],
        catering: [],
        serviceCoord: []
      };
    }
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
    // IMPORTANTE: Solo mover si dice "adicional" explícitamente, no todos los animadores
    const animadorIndex = procesados.specials.findIndex(s => {
      const desc = (s.descripcion || s.servicios?.descripcion || s.servicios?.nombre || s.nombre || '').toLowerCase();
      // Solo mover si dice "animador" Y "adicional" juntos
      return desc.includes('animador') && desc.includes('adicional') && !desc.includes('hora loca');
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

  // Procesar servicios adicionales primero
  // Asegurar que serviciosAdicionales no sea undefined
  const serviciosAdicionalesProcesados = procesarServiciosAdicionales(serviciosAdicionales || {});

  // DEBUG: Ver qué hay en servicios adicionales
  console.log('🔍 DEBUG EXTRAS:');
  console.log('serviciosAdicionales:', Object.keys(serviciosAdicionales).map(k => `${k}: ${serviciosAdicionales[k]?.length || 0}`));
  console.log('serviciosAdicionalesProcesados:', Object.keys(serviciosAdicionalesProcesados).map(k => `${k}: ${serviciosAdicionalesProcesados[k]?.length || 0}`));

  // NOTA: La lógica de Sidra/Champaña ahora se maneja en organizarServiciosPorCategoria usando seleccion_sidra_champana
  // Ya no necesitamos mover servicios entre paquete y extras aquí
  // Los servicios del paquete ya fueron procesados correctamente en organizarServiciosPorCategoria

  // Regenerar HTML del paquete y extras con servicios procesados
  const serviciosPaqueteHTML = generarHTMLServicios(serviciosPaquete, true);
  const serviciosAdicionalesHTML = generarHTMLServicios(serviciosAdicionalesProcesados, false);

  const htmlServiciosPaqueteFinal = serviciosPaqueteHTML.html;
  const gridStylePaquete = serviciosPaqueteHTML.gridStyle || 'grid-template-columns: 1fr 1fr 1fr;';

  const htmlServiciosAdicionales = serviciosAdicionalesHTML.html;
  const gridStyleExtras = serviciosAdicionalesHTML.gridStyle || 'grid-template-columns: 1fr 1fr 1fr;';

  console.log('htmlServiciosAdicionales length:', htmlServiciosAdicionales?.length || 0);

  // Verificar si el paquete tiene servicios (si no tiene, no mostrar la sección de paquete)
  // Los servicios del paquete ya fueron procesados en organizarServiciosPorCategoria
  // Nota: serviciosOrganizados ahora contiene objetos con cantidades, no arrays con objetos
  // La verificación de servicios del paquete se hace en generarHTMLServicios
  const tieneServiciosPaquete = serviciosPaqueteHTML && serviciosPaqueteHTML.html && serviciosPaqueteHTML.html.length > 0;

  // Generar HTML completo de la sección de servicios adicionales si hay servicios (nuevo diseño)
  // serviciosAdicionalesProcesados contiene objetos con arrays de servicios
  const tieneServiciosAdicionales = serviciosAdicionalesProcesados && Object.values(serviciosAdicionalesProcesados).some(arr => Array.isArray(arr) && arr.length > 0);
  console.log('tieneServiciosAdicionales:', tieneServiciosAdicionales);
  const htmlSeccionAdicionales = tieneServiciosAdicionales
    ? `
    <div class="page page-2">
        <div class="page-content" style="padding: 0; height: 100%;">
            <div class="package-card">
                <div style="padding: 40px 50px 10px 50px; text-align: left; flex-shrink: 0;">
                    <h2 style="font-size: 3.0rem; font-weight: 400; text-transform: uppercase; letter-spacing: 3px; color: ${esRevolution ? '#000' : '#FFFFFF'}; font-family: 'Montserrat', sans-serif; margin: 0; line-height: 1.2;">${t(lang, 'extras')}</h2>
                </div>
                <div class="package-content" style="flex: 1; padding: 20px 50px 30px 50px; overflow: visible; width: 100%; max-width: 100%; box-sizing: border-box; ${gridStyleExtras}">
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

  // Convertir logo a base64 si existe y generar HTML del logo
  let logoPath = '';
  if (esRevolution) {
    logoPath = path.join(__dirname, '../templates/assets/Logorevolution.png');
  } else if (esDiamond) {
    logoPath = path.join(__dirname, '../../../7.png');
  }

  let logoHTML = `<div style="font-size: 18px; font-weight: 100; color: #FFFFFF; letter-spacing: 2px;">${nombreCompania}</div>`;
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      logoHTML = `<img src="${logoBase64}" alt="${nombreCompania}" class="cover-logo" style="max-width: 400px; height: auto; opacity: 1; filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4));">`;
    } catch (error) {
      console.error('Error al cargar logo:', error);
    }
  }

  // Cargar fondo para portada/header
  // Determinar qué template se está usando para cargar el fondo correcto
  const usaTemplateDiamond = !esRevolution; // Si no es Revolution, usa template Diamond
  
  let fondoStyle = `background-image:
                radial-gradient(circle, rgba(212,175,55,0.2) 2px, transparent 2.5px),
                radial-gradient(circle, rgba(212,175,55,0.2) 2px, transparent 2.5px);
            background-size: 30px 30px;
            background-position: 0 0, 15px 15px;
            display: block;`;
  let hasBackground = false;

  if (esRevolution) {
    // Fondo para Revolution - img12.jpg
    const fondoRevolutionPath = path.join(__dirname, '../templates/assets/img12.jpg');
    if (fs.existsSync(fondoRevolutionPath)) {
      try {
        const fondoBuffer = fs.readFileSync(fondoRevolutionPath);
        const fondoBase64 = `data:image/jpeg;base64,${fondoBuffer.toString('base64')}`;
        fondoStyle = `background-image: url("${fondoBase64}");
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              opacity: 1;
              display: block;`;
        hasBackground = true;
      } catch (error) {
        console.error('Error al cargar fondo Revolution:', error);
      }
    }
  } else if (usaTemplateDiamond) {
    // Fondo para Diamond - fondoDiamond.png (siempre que se use template Diamond)
    const fondoDiamondPath = path.join(__dirname, '../../../fondoDiamond.png');
    console.log('🔍 Intentando cargar fondo Diamond desde:', fondoDiamondPath);
    console.log('🔍 Ruta absoluta:', path.resolve(fondoDiamondPath));
    console.log('🔍 Existe archivo:', fs.existsSync(fondoDiamondPath));
    
    if (fs.existsSync(fondoDiamondPath)) {
      try {
        const fondoBuffer = fs.readFileSync(fondoDiamondPath);
        const fondoBase64 = `data:image/png;base64,${fondoBuffer.toString('base64')}`;
        fondoStyle = `background-image: url("${fondoBase64}");
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              opacity: 1;
              display: block;`;
        hasBackground = true;
        console.log('✅ Fondo Diamond cargado correctamente');
      } catch (error) {
        console.error('❌ Error al cargar fondo Diamond:', error);
      }
    } else {
      console.warn('⚠️ Archivo fondoDiamond.png no encontrado en:', fondoDiamondPath);
      // Intentar ruta alternativa desde la raíz del proyecto
      const fondoDiamondPathAlt = path.join(__dirname, '../../../../fondoDiamond.png');
      console.log('🔍 Intentando ruta alternativa:', fondoDiamondPathAlt);
      if (fs.existsSync(fondoDiamondPathAlt)) {
        try {
          const fondoBuffer = fs.readFileSync(fondoDiamondPathAlt);
          const fondoBase64 = `data:image/png;base64,${fondoBuffer.toString('base64')}`;
          fondoStyle = `background-image: url("${fondoBase64}");
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                opacity: 1;
                display: block;`;
          hasBackground = true;
          console.log('✅ Fondo Diamond cargado desde ruta alternativa');
        } catch (error) {
          console.error('❌ Error al cargar fondo Diamond desde ruta alternativa:', error);
        }
      }
    }
  }

  // Cargar fondo general para package-card
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
      } catch (error) {
        console.error('Error al cargar fondo Diamond:', error);
        packageCardBackground = '';
      }
    }
  }

  // Si el paquete no tiene servicios (paquete personalizado), no mostrar la sección de paquete
  const htmlSeccionPaquete = tieneServiciosPaquete 
    ? `
    <div class="page page-2">
        <div class="page-content" style="padding: 0; height: 100%;">
            <div class="package-card">
                <div style="padding: 75px 50px 15px 50px; text-align: left; flex-shrink: 0;">
                    <h2 style="font-size: 3.0rem; font-weight: 400; text-transform: uppercase; letter-spacing: 3px; color: ${esRevolution ? '#000' : '#FFFFFF'}; font-family: 'Montserrat', sans-serif; margin: 0; line-height: 1.2;">${t(lang, 'package')} ${nombrePaqueteLimpio}</h2>
                </div>
                <div class="package-content" style="flex: 1; padding-top: 20px; overflow: hidden; ${gridStylePaquete}">
                    ${htmlServiciosPaqueteFinal}
                </div>
            </div>
        </div>
    </div>
    `
    : ''; // Si no hay servicios, no mostrar nada

  // Reemplazar placeholders en el HTML
  const replacements = {
    '{{PACKAGE_NAME}}': nombrePaqueteLimpio,
    '{{SECCION_PAQUETE}}': htmlSeccionPaquete,
    '{{SERVICIOS_ADICIONALES}}': htmlSeccionAdicionales,
    '{{CLIENT_NAME}}': nombreCliente,
    '{{CLIENT_NAME_FIRST}}': nombreClientePrimero,
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
    '{{DESCUENTO_ROW}}': descuento > 0 
      ? `<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.1);">
          <span style="font-size: 18px; color: #333; font-weight: 400; font-family: 'Montserrat', sans-serif;">Descuento</span>
          <span style="font-size: 19px; color: #d32f2f; font-weight: 500; font-family: 'Montserrat', sans-serif; text-align: right;">-${formatearMoneda(descuento)}</span>
        </div>`
      : '',
    '{{TAX_AMOUNT}}': formatearMoneda(impuesto),
    '{{SERVICE_FEE_PERCENTAGE}}': serviceFeePorcentaje.toFixed(0),
    '{{SERVICE_FEE}}': formatearMoneda(serviceFee),
    '{{TOTAL_TO_PAY}}': formatearMoneda(total),
    '{{FIRST_PAYMENT_DATE}}': fechaPrimerPago,
    '{{FIRST_PAYMENT_AMOUNT}}': formatearMoneda(primerPago),
    '{{TOTAL_REMAINING}}': formatearMoneda(totalRestante),
    '\\/\\*PACKAGE_CARD_BACKGROUND_PLACEHOLDER\\*\\/': packageCardBackground,
    '{{NOMBRE_COMPANIA}}': nombreCompania,
    '{{LOGO_HTML}}': logoHTML,
    '\\/\\*FONDO_STYLE_PLACEHOLDER\\*\\/': fondoStyle, // Fondo para Revolution y Diamond (ya se cargó según la compañía)
    '{{HAS_BACKGROUND_CLASS}}': hasBackground ? 'has-background' : '',
    // Traducciones
    '{{TEXT_INVERSION_TERMINOS}}': t(lang, 'investment'),
    '{{TEXT_DESGLOSE}}': t(lang, 'breakdown'),
    '{{TEXT_PRECIO_PAQUETE}}': t(lang, 'packagePrice'),
    '{{TEXT_IMPUESTO}}': t(lang, 'tax'),
    '{{TEXT_TARIFA_SERVICIO}}': t(lang, 'serviceFee'),
    '{{TEXT_TOTAL_PAGAR}}': t(lang, 'totalToPay'),
    '{{TEXT_EVENT_PROPOSAL}}': lang === 'en' ? 'EVENT PROPOSAL FOR:' : 'PROPUESTA DE EVENTO PARA:',
    '{{TEXT_PACKAGE}}': lang === 'en' ? 'PACKAGE' : 'PAQUETE',
    '{{TEXT_EVENT_DETAILS}}': lang === 'en' ? 'Event Details' : 'Detalles del Evento',
    '{{TEXT_NAME}}': lang === 'en' ? 'Name:' : 'Nombre:',
    '{{TEXT_LOCATION}}': lang === 'en' ? 'Location:' : 'Ubicación:',
    '{{TEXT_DATE}}': lang === 'en' ? 'Date:' : 'Fecha:',
    '{{TEXT_TIME}}': lang === 'en' ? 'Time:' : 'Hora:',
    '{{TEXT_GUESTS}}': lang === 'en' ? 'Number of Guests:' : 'Número de Invitados:',
    '{{TEXT_SALES_REP}}': lang === 'en' ? 'Sales Representative:' : 'Representante de Ventas:',
    '{{TEXT_EMAIL}}': lang === 'en' ? 'Email:' : 'Correo:',
    '{{TEXT_PHONE}}': lang === 'en' ? 'Phone number:' : 'Teléfono:',
    '{{TEXT_OFFER_DATE}}': lang === 'en' ? 'Offer Creation Date:' : 'Fecha de Creación de Oferta:',
    '{{TEXT_NOTA_IMPORTANTE}}': lang === 'en' ? 'IMPORTANT NOTE:' : 'NOTA IMPORTANTE:',
    '{{TEXT_VALID_24H}}': lang === 'en' ? 'THIS OFFER IS VALID FOR 24 HOURS AFTER BEING RECEIVED' : 'ESTA OFERTA ES VALIDA POR 24 HORAS DESPUES DE SER RECIBIDA'
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
      // Error silencioso al esperar imágenes
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

  // Extraer todos los servicios disponibles de los servicios adicionales para buscar IDs correctos
  const todosServiciosDisponibles = serviciosAdicionales.map(os => os.servicios || os);

  // Obtener la selección de Sidra/Champaña de la oferta
  const seleccionSidraChampana = datos.seleccion_sidra_champana || null;
  
  // Obtener la selección de Photobooth de la oferta
  // Puede venir como string o como objeto con nombre
  let seleccionPhotobooth = datos.photobooth_tipo || null;
  if (seleccionPhotobooth && typeof seleccionPhotobooth === 'object') {
    seleccionPhotobooth = seleccionPhotobooth.nombre || seleccionPhotobooth.value || null;
  }
  
  // Si photobooth_tipo es null, intentar inferir la selección basándose en los servicios del paquete y adicionales
  // Estrategia: Si ambos Photobooth están en el paquete, el que NO está en extras es el seleccionado
  if (!seleccionPhotobooth) {
    // Obtener nombres de servicios del paquete
    const serviciosPaqueteNombres = serviciosPaquete.map(ps => {
      const servicio = ps.servicios || ps;
      return (servicio.nombre || '').toLowerCase();
    });
    
    // Obtener nombres de servicios adicionales
    const serviciosAdicionalesNombres = (serviciosAdicionales || []).map(os => {
      const servicio = os.servicios || os;
      return (servicio.nombre || '').toLowerCase();
    });
    
    // Verificar qué Photobooth están en el paquete
    const tienePhotobooth360EnPaquete = serviciosPaqueteNombres.some(nombre => 
      nombre.includes('photobooth 360') || nombre.includes('cabina 360') || 
      (nombre.includes('360') && (nombre.includes('photobooth') || nombre.includes('cabina')))
    );
    const tienePhotoboothPrintEnPaquete = serviciosPaqueteNombres.some(nombre => 
      nombre.includes('photobooth print') || 
      (nombre.includes('photobooth') && (nombre.includes('print') || nombre.includes('impresión') || nombre.includes('impresion'))) ||
      (nombre.includes('cabina') && (nombre.includes('impresión') || nombre.includes('impresion')))
    );
    
    // Verificar qué Photobooth están en extras
    const tienePhotobooth360EnExtras = serviciosAdicionalesNombres.some(nombre => 
      nombre.includes('photobooth 360') || nombre.includes('cabina 360') || 
      (nombre.includes('360') && (nombre.includes('photobooth') || nombre.includes('cabina')))
    );
    const tienePhotoboothPrintEnExtras = serviciosAdicionalesNombres.some(nombre => 
      nombre.includes('photobooth print') || 
      (nombre.includes('photobooth') && (nombre.includes('print') || nombre.includes('impresión') || nombre.includes('impresion'))) ||
      (nombre.includes('cabina') && (nombre.includes('impresión') || nombre.includes('impresion')))
    );
    
    // Si ambos están en el paquete, el que NO está en extras es el seleccionado
    if (tienePhotobooth360EnPaquete && tienePhotoboothPrintEnPaquete) {
      if (!tienePhotobooth360EnExtras && tienePhotoboothPrintEnExtras) {
        seleccionPhotobooth = 'Photobooth 360';
      } else if (tienePhotobooth360EnExtras && !tienePhotoboothPrintEnExtras) {
        seleccionPhotobooth = 'Photobooth Print';
      } else if (!tienePhotobooth360EnExtras && !tienePhotoboothPrintEnExtras) {
        // Ambos están en el paquete y ninguno en extras - usar el orden de aparición en el paquete
        // El primero que aparece en paquetes_servicios es el seleccionado por defecto
        const photobooth360Index = serviciosPaquete.findIndex(ps => {
          const nombre = (ps.servicios?.nombre || '').toLowerCase();
          return nombre.includes('photobooth 360') || nombre.includes('cabina 360') || 
                 (nombre.includes('360') && (nombre.includes('photobooth') || nombre.includes('cabina')));
        });
        const photoboothPrintIndex = serviciosPaquete.findIndex(ps => {
          const nombre = (ps.servicios?.nombre || '').toLowerCase();
          return nombre.includes('photobooth print') || 
                 (nombre.includes('photobooth') && (nombre.includes('print') || nombre.includes('impresión') || nombre.includes('impresion'))) ||
                 (nombre.includes('cabina') && (nombre.includes('impresión') || nombre.includes('impresion')));
        });
        
        // Usar el que aparece primero en el paquete (índice menor)
        if (photobooth360Index !== -1 && photoboothPrintIndex !== -1) {
          if (photobooth360Index < photoboothPrintIndex) {
            seleccionPhotobooth = 'Photobooth 360';
          } else {
            seleccionPhotobooth = 'Photobooth Print';
          }
        } else if (photobooth360Index !== -1) {
          seleccionPhotobooth = 'Photobooth 360';
        } else if (photoboothPrintIndex !== -1) {
          seleccionPhotobooth = 'Photobooth Print';
        }
      }
    }
    // Si solo uno está en el paquete, ese es el seleccionado
    else if (tienePhotobooth360EnPaquete && !tienePhotoboothPrintEnPaquete) {
      seleccionPhotobooth = 'Photobooth 360';
    }
    else if (tienePhotoboothPrintEnPaquete && !tienePhotobooth360EnPaquete) {
      seleccionPhotobooth = 'Photobooth Print';
    }
  }

  // Servicios del paquete - Aplicar selección de Sidra/Champaña y Photobooth PRIMERO
  const serviciosPaqueteList = serviciosPaquete
    .map(ps => {
      const nombreServicio = (ps.servicios?.nombre || '').toLowerCase();
      const esSidra = nombreServicio.includes('sidra') || nombreServicio.includes('cider');
      const esChampana = nombreServicio.includes('champaña') || nombreServicio.includes('champagne');
      const esPhotobooth360 = nombreServicio.includes('photobooth 360') || nombreServicio.includes('cabina 360') || (nombreServicio.includes('360') && (nombreServicio.includes('photobooth') || nombreServicio.includes('cabina')));
      const esPhotoboothPrint = nombreServicio.includes('photobooth print') || (nombreServicio.includes('photobooth') && (nombreServicio.includes('print') || nombreServicio.includes('impresión') || nombreServicio.includes('impresion'))) || (nombreServicio.includes('cabina') && (nombreServicio.includes('impresión') || nombreServicio.includes('impresion')));
      
      // Si hay una selección de Sidra/Champaña, aplicar el reemplazo
      if (seleccionSidraChampana) {
        // Si el servicio coincide con la selección, mantenerlo (caso más común)
        if ((esSidra && seleccionSidraChampana === 'Sidra') || 
            (esChampana && seleccionSidraChampana === 'Champaña')) {
          return {
      ...ps.servicios,
      categoria: ps.servicios?.categoria,
      esPaquete: true,
      descripcion: ps.servicios?.descripcion || ps.servicios?.nombre
          };
        }
        
        // Si se seleccionó Champaña y el paquete tiene Sidra, reemplazar Sidra con Champaña
        if (esSidra && seleccionSidraChampana === 'Champaña') {
          // Buscar el servicio de Champaña en todos los servicios disponibles
          const champanaServicio = todosServiciosDisponibles.find(servicio => {
            const nombre = (servicio.nombre || '').toLowerCase();
            return (nombre.includes('champaña') || nombre.includes('champagne')) && servicio.id !== ps.servicios?.id;
          });
          
          if (champanaServicio) {
            // Usar el servicio de Champaña con su ID real
            return {
              ...champanaServicio,
              categoria: champanaServicio?.categoria || ps.servicios?.categoria,
              esPaquete: true,
              descripcion: champanaServicio?.descripcion || champanaServicio?.nombre || 'Champaña'
            };
          } else {
            // Si no se encuentra, crear un objeto temporal pero con un ID null
            // para que no interfiera con el filtrado de servicios adicionales
            const servicioTemporal = {
              ...ps.servicios,
              id: null, // NO usar el mismo ID de Sidra para evitar conflictos
              nombre: 'Champaña',
              categoria: ps.servicios?.categoria || 'barService',
              esPaquete: true,
              descripcion: 'Champaña',
              // Asegurar que el servicio tenga todos los campos necesarios
              servicios: {
                ...ps.servicios,
                id: null, // NO usar el mismo ID
                nombre: 'Champaña',
                descripcion: 'Champaña'
              }
            };
            return servicioTemporal;
          }
        }
        
        // Si se seleccionó Sidra y el paquete tiene Champaña, reemplazar
        if (esChampana && seleccionSidraChampana === 'Sidra') {
          // Buscar el servicio de Sidra en todos los servicios disponibles (primero en adicionales, luego en todos)
          const sidraServicio = todosServiciosDisponibles.find(servicio => {
            const nombre = (servicio.nombre || '').toLowerCase();
            return (nombre.includes('sidra') || nombre.includes('cider')) && servicio.id !== ps.servicios?.id;
          });
          
          if (sidraServicio) {
            // Usar el servicio de Sidra con su ID real
            return {
              ...sidraServicio,
              categoria: sidraServicio?.categoria || ps.servicios?.categoria,
              esPaquete: true,
              descripcion: sidraServicio?.descripcion || sidraServicio?.nombre || 'Sidra'
            };
          } else {
            // Si no se encuentra, crear un objeto temporal pero con un ID diferente o null
            // para que no interfiera con el filtrado de servicios adicionales
            const servicioTemporal = {
              ...ps.servicios,
              id: null, // NO usar el mismo ID de Champaña para evitar conflictos
              nombre: 'Sidra',
              categoria: ps.servicios?.categoria || 'barService',
              esPaquete: true,
              descripcion: 'Sidra',
              // Asegurar que el servicio tenga todos los campos necesarios
              servicios: {
                ...ps.servicios,
                id: null, // NO usar el mismo ID
                nombre: 'Sidra',
                descripcion: 'Sidra'
              }
            };
            return servicioTemporal;
          }
        }
      }
      
      // Si hay una selección de Photobooth, aplicar el reemplazo
      if (seleccionPhotobooth) {
        // Normalizar la selección para comparar
        const seleccionNormalizada = seleccionPhotobooth.toLowerCase();
        const esSeleccion360 = seleccionNormalizada.includes('360');
        const esSeleccionPrint = seleccionNormalizada.includes('print') || seleccionNormalizada.includes('impresión') || seleccionNormalizada.includes('impresion');
        
        // Si el servicio coincide con la selección, mantenerlo (caso más común)
        if ((esPhotobooth360 && esSeleccion360) || 
            (esPhotoboothPrint && esSeleccionPrint)) {
          return {
            ...ps.servicios,
            categoria: ps.servicios?.categoria,
            esPaquete: true,
            descripcion: ps.servicios?.descripcion || ps.servicios?.nombre
          };
        }
        
        // Si se seleccionó Photobooth 360 y el paquete tiene Photobooth Print, reemplazar
        if (esPhotoboothPrint && esSeleccion360) {
          // Buscar el servicio de Photobooth 360 en todos los servicios disponibles
          const photobooth360Servicio = todosServiciosDisponibles.find(servicio => {
            const nombre = (servicio.nombre || '').toLowerCase();
            return (nombre.includes('photobooth 360') || nombre.includes('cabina 360') || (nombre.includes('360') && (nombre.includes('photobooth') || nombre.includes('cabina')))) && servicio.id !== ps.servicios?.id;
          });
          
          if (photobooth360Servicio) {
            // Usar el servicio de Photobooth 360 con su ID real
            return {
              ...photobooth360Servicio,
              categoria: photobooth360Servicio?.categoria || ps.servicios?.categoria,
              esPaquete: true,
              descripcion: photobooth360Servicio?.descripcion || photobooth360Servicio?.nombre || 'Photobooth 360'
            };
          } else {
            // Si no se encuentra, crear un objeto temporal
            const servicioTemporal = {
              ...ps.servicios,
              id: null,
              nombre: 'Photobooth 360',
              categoria: ps.servicios?.categoria || 'fotografia',
              esPaquete: true,
              descripcion: 'Photobooth 360',
              servicios: {
                ...ps.servicios,
                id: null,
                nombre: 'Photobooth 360',
                descripcion: 'Photobooth 360'
              }
            };
            return servicioTemporal;
          }
        }
        
        // Si se seleccionó Photobooth Print y el paquete tiene Photobooth 360, reemplazar
        if (esPhotobooth360 && esSeleccionPrint) {
          // Buscar el servicio de Photobooth Print en todos los servicios disponibles
          const photoboothPrintServicio = todosServiciosDisponibles.find(servicio => {
            const nombre = (servicio.nombre || '').toLowerCase();
            return (nombre.includes('photobooth print') || (nombre.includes('photobooth') && (nombre.includes('print') || nombre.includes('impresión') || nombre.includes('impresion'))) || (nombre.includes('cabina') && (nombre.includes('impresión') || nombre.includes('impresion')))) && servicio.id !== ps.servicios?.id;
          });
          
          if (photoboothPrintServicio) {
            // Usar el servicio de Photobooth Print con su ID real
            return {
              ...photoboothPrintServicio,
              categoria: photoboothPrintServicio?.categoria || ps.servicios?.categoria,
              esPaquete: true,
              descripcion: photoboothPrintServicio?.descripcion || photoboothPrintServicio?.nombre || 'Photobooth Print'
            };
          } else {
            // Si no se encuentra, crear un objeto temporal
            const servicioTemporal = {
              ...ps.servicios,
              id: null,
              nombre: 'Photobooth Print',
              categoria: ps.servicios?.categoria || 'fotografia',
              esPaquete: true,
              descripcion: 'Photobooth Print',
              servicios: {
                ...ps.servicios,
                id: null,
                nombre: 'Photobooth Print',
                descripcion: 'Photobooth Print'
              }
            };
            return servicioTemporal;
          }
        }
      }
      
      // Si no hay selección o el servicio no es Sidra/Champaña/Photobooth, mantenerlo tal cual
      return {
        ...ps.servicios,
        categoria: ps.servicios?.categoria,
        esPaquete: true,
        descripcion: ps.servicios?.descripcion || ps.servicios?.nombre
      };
    })
    .filter(ps => {
      const nombreServicio = (ps.nombre || '').toLowerCase();
      
      // Filtrar: si hay selección de Sidra/Champaña, excluir el servicio que NO fue seleccionado
      if (seleccionSidraChampana) {
        const esSidra = nombreServicio.includes('sidra') || nombreServicio.includes('cider');
        const esChampana = nombreServicio.includes('champaña') || nombreServicio.includes('champagne');
        
        // Si es Sidra pero se seleccionó Champaña, excluir (ya fue reemplazado arriba, pero por si acaso)
        if (esSidra && seleccionSidraChampana === 'Champaña') {
          return false;
        }
        // Si es Champaña pero se seleccionó Sidra, excluir (ya fue reemplazado arriba, pero por si acaso)
        if (esChampana && seleccionSidraChampana === 'Sidra') {
          return false;
        }
      }
      
      // Filtrar: si hay selección de Photobooth, excluir el Photobooth que NO fue seleccionado
      if (seleccionPhotobooth) {
        const esPhotobooth360 = nombreServicio.includes('photobooth 360') || nombreServicio.includes('cabina 360') || (nombreServicio.includes('360') && (nombreServicio.includes('photobooth') || nombreServicio.includes('cabina')));
        const esPhotoboothPrint = nombreServicio.includes('photobooth print') || (nombreServicio.includes('photobooth') && (nombreServicio.includes('print') || nombreServicio.includes('impresión') || nombreServicio.includes('impresion'))) || (nombreServicio.includes('cabina') && (nombreServicio.includes('impresión') || nombreServicio.includes('impresion')));
        
        // Normalizar la selección para comparar
        const seleccionNormalizada = String(seleccionPhotobooth).toLowerCase();
        const esSeleccion360 = seleccionNormalizada.includes('360');
        const esSeleccionPrint = seleccionNormalizada.includes('print') || seleccionNormalizada.includes('impresión') || seleccionNormalizada.includes('impresion');
        
        // Si es Photobooth 360 pero se seleccionó Print, excluir
        if (esPhotobooth360 && esSeleccionPrint) {
          return false;
        }
        // Si es Photobooth Print pero se seleccionó 360, excluir
        if (esPhotoboothPrint && esSeleccion360) {
          return false;
        }
      }
      
      return true;
    })
    // Eliminar duplicados de Photobooth - solo mantener uno del tipo seleccionado
    .filter((ps, index, array) => {
      const nombreServicio = (ps.nombre || '').toLowerCase();
      const esPhotobooth360 = nombreServicio.includes('photobooth 360') || nombreServicio.includes('cabina 360') || (nombreServicio.includes('360') && (nombreServicio.includes('photobooth') || nombreServicio.includes('cabina')));
      const esPhotoboothPrint = nombreServicio.includes('photobooth print') || (nombreServicio.includes('photobooth') && (nombreServicio.includes('print') || nombreServicio.includes('impresión') || nombreServicio.includes('impresion'))) || (nombreServicio.includes('cabina') && (nombreServicio.includes('impresión') || nombreServicio.includes('impresion')));
      
      // Si es un Photobooth, verificar si ya hay uno antes en el array
      if (esPhotobooth360 || esPhotoboothPrint) {
        // Buscar si hay otro Photobooth del mismo tipo antes de este en el array
        const yaExiste = array.slice(0, index).some(otroPs => {
          const otroNombre = (otroPs.nombre || '').toLowerCase();
          const otroEs360 = otroNombre.includes('photobooth 360') || otroNombre.includes('cabina 360') || (otroNombre.includes('360') && (otroNombre.includes('photobooth') || otroNombre.includes('cabina')));
          const otroEsPrint = otroNombre.includes('photobooth print') || (otroNombre.includes('photobooth') && (otroNombre.includes('print') || otroNombre.includes('impresión') || otroNombre.includes('impresion'))) || (otroNombre.includes('cabina') && (otroNombre.includes('impresión') || otroNombre.includes('impresion')));
          
          // Si ambos son del mismo tipo (ambos 360 o ambos Print), es un duplicado
          return (esPhotobooth360 && otroEs360) || (esPhotoboothPrint && otroEsPrint);
        });
        
        if (yaExiste) {
          return false; // Excluir este duplicado
        }
      }
      
      return true;
    });

  // Crear un Set con los IDs de servicios que están REALMENTE en el paquete (después de aplicar la selección)
  const serviciosPaqueteIds = new Set();
  serviciosPaqueteList.forEach(ps => {
    if (ps.id) {
      serviciosPaqueteIds.add(ps.id);
    }
  });
  

  // Servicios adicionales: solo los que NO están en el paquete
  // EXCEPCIÓN: Servicios de personal (Bartender, Personal de Atención, Coordinador) pueden aparecer en extras aunque estén en el paquete
  // porque pueden ser servicios adicionales (más personal, más bartenders, etc.)
  // EXCEPCIÓN: "Hora Extra" siempre debe aparecer en EXTRAS, nunca en PAQUETE, incluso si está en el paquete
  const serviciosAdicionalesFiltrados = serviciosAdicionales
    .filter(os => {
      const servicio = os.servicios || os;
      const servicioId = servicio.id;
      const nombreServicio = (servicio.nombre || '').toLowerCase();
      const descripcionServicio = (servicio.descripcion || '').toLowerCase();
      const textoCompleto = `${nombreServicio} ${descripcionServicio}`;
      
      // Verificar si es "Hora Extra" - siempre debe aparecer en extras
      const esHoraExtra = nombreServicio.includes('hora extra') || 
                          nombreServicio.includes('hora adicional') ||
                          descripcionServicio.includes('hora extra') ||
                          descripcionServicio.includes('hora adicional') ||
                          textoCompleto.includes('hora extra') ||
                          textoCompleto.includes('hora adicional');
      
      // Verificar si es un servicio de personal
      const esServicioPersonal = nombreServicio.includes('bartender') || 
                                  nombreServicio.includes('barman') ||
                                  nombreServicio.includes('personal de atención') ||
                                  nombreServicio.includes('personal de servicio') ||
                                  nombreServicio.includes('mesero') ||
                                  nombreServicio.includes('waiter') ||
                                  nombreServicio.includes('coordinador') ||
                                  nombreServicio.includes('coordinator') ||
                                  textoCompleto.includes('bartender') ||
                                  textoCompleto.includes('personal de atención') ||
                                  textoCompleto.includes('personal de servicio') ||
                                  textoCompleto.includes('coordinador');
      
      // Solo incluir si NO está en el paquete (después de aplicar la selección)
      // EXCEPCIÓN: Si es "Hora Extra", siempre permitirlo (debe aparecer en extras)
      // EXCEPCIÓN: Si es servicio de personal, permitirlo aunque esté en el paquete (puede ser adicional)
      const estaEnPaquete = servicioId && serviciosPaqueteIds.has(servicioId);
      return servicioId && (!estaEnPaquete || esHoraExtra || esServicioPersonal);
    })
    .map(os => {
      const servicio = os.servicios || os;
      // Asegurar que el servicio tenga nombre y descripción
      const nombre = servicio.nombre || servicio.descripcion || 'Servicio';
      const descripcion = servicio.descripcion || servicio.nombre || 'Servicio';
      // Preservar la cantidad del servicio adicional (viene de ofertas_servicios_adicionales.cantidad)
      const cantidad = os.cantidad || 1; // Si no hay cantidad, asumir 1
      
      return {
        ...servicio,
        nombre: nombre, // Asegurar que siempre tenga nombre
        categoria: servicio?.categoria,
        esPaquete: false,
        descripcion: descripcion,
        cantidad: cantidad // Preservar la cantidad real
      };
    });

  const todosServicios = [
    ...serviciosPaqueteList,
    ...serviciosAdicionalesFiltrados
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
    } else if (categoria.includes('decoración') || categoria.includes('decoration') || 
               nombre.includes('decoración') || nombre.includes('decoration') ||
               descripcion.includes('decoración') || descripcion.includes('decoration')) {
      organizados.decoration.push(servicio);
    } else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor') || nombre.includes('bar') || nombre.includes('bebida') || nombre.includes('champaña') || nombre.includes('sidra')) {
      organizados.barService.push(servicio);
    } else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food') || 
               nombre.includes('comida') || nombre.includes('catering') || nombre.includes('pasapalo') || 
               nombre.includes('dulce') || nombre.includes('menu') || nombre.includes('menú') ||
               nombre.includes('ensalada') || nombre.includes('proteína') || nombre.includes('proteina') ||
               nombre.includes('acompañante') || descripcion.includes('menu') || descripcion.includes('menú') ||
               descripcion.includes('ensalada') || descripcion.includes('proteína') || descripcion.includes('proteina') ||
               descripcion.includes('acompañante')) {
      organizados.catering.push(servicio);
    } else if (categoria.includes('entretenimiento') || categoria.includes('entertainment') ||
               nombre.includes('hora loca') || nombre.includes('animador') || nombre.includes('animación') ||
               nombre.includes('animacion') || nombre.includes('dj') || nombre.includes('disc jockey') ||
               nombre.includes('maestro de ceremonia') || nombre.includes('mc') ||
               descripcion.includes('hora loca') || descripcion.includes('animador') || descripcion.includes('animación') ||
               descripcion.includes('animacion') || descripcion.includes('dj') || descripcion.includes('disc jockey') ||
               descripcion.includes('maestro de ceremonia') || descripcion.includes('mc')) {
      organizados.specials.push(servicio); // Los servicios de entretenimiento van a specials para ser procesados después
    } else if (categoria.includes('fotografía') || categoria.includes('video') || categoria.includes('photobooth') || nombre.includes('photobooth') || nombre.includes('foto') || nombre.includes('video')) {
      organizados.specials.push(servicio);
    } else if (categoria.includes('equipo') || categoria.includes('equipment') || 
               nombre.includes('luce stage') || nombre.includes('luces stage') || nombre.includes('stage lighting') ||
               nombre.includes('mapping') || nombre.includes('máquina de chispa') || nombre.includes('máquina de humo') ||
               nombre.includes('pantalla') || nombre.includes('led') || nombre.includes('tv') ||
               descripcion.includes('luce stage') || descripcion.includes('luces stage') || descripcion.includes('stage lighting') ||
               descripcion.includes('mapping') || descripcion.includes('máquina de chispa') || descripcion.includes('máquina de humo')) {
      organizados.specials.push(servicio); // Los equipos van a specials para ser procesados después
    } else if (categoria.includes('coordinación') || categoria.includes('coordinador') || categoria.includes('mesero') || categoria.includes('bartender') || categoria.includes('service') || nombre.includes('coordinador') || nombre.includes('mesero') || nombre.includes('bartender') || nombre.includes('personal de servicio') || nombre.includes('waiters') || descripcion.includes('coordinator') || descripcion.includes('waiters') || descripcion.includes('bartender')) {
      organizados.serviceCoord.push(servicio);
    } else if (categoria.includes('transporte') || categoria.includes('transport') ||
               nombre.includes('limosina') || nombre.includes('limousine') || nombre.includes('limo') ||
               descripcion.includes('limosina') || descripcion.includes('limousine') || descripcion.includes('limo')) {
      organizados.specials.push(servicio); // Los servicios de transporte van a specials para ser procesados después
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
 * Maneja tanto objetos Date como strings de hora (HH:MM:SS)
 */
function formatearHora(hora) {
  if (!hora) return '8:00PM';
  
  try {
    let horas, minutos;
    
    // Si es un string de hora (formato HH:MM:SS o HH:MM)
    if (typeof hora === 'string' && hora.includes(':')) {
      const partes = hora.split(':');
      horas = parseInt(partes[0], 10);
      minutos = parseInt(partes[1] || '0', 10);
    } 
    // Si es un objeto Date - usar UTC para evitar problemas de zona horaria
    else if (hora instanceof Date) {
      // IMPORTANTE: Para campos Time de Prisma, siempre usar UTC
      // Prisma devuelve Time como Date con fecha 1970-01-01
      // Si usamos getHours() en lugar de getUTCHours(), la zona horaria local puede cambiar la hora
      // CRÍTICO: Usar getUTCFullYear() porque en UTC-5, getFullYear() puede devolver 1969 para 1970-01-01T00:00:00.000Z
      if (hora.getUTCFullYear() === 1970 && hora.getUTCMonth() === 0 && hora.getUTCDate() === 1) {
        // Es un campo Time de Prisma, usar UTC siempre
        horas = hora.getUTCHours();
        minutos = hora.getUTCMinutes();
      } else {
        // Para otras fechas, usar hora local
        horas = hora.getHours();
        minutos = hora.getMinutes();
      }
    }
    // Si es un objeto con métodos getHours/getMinutes (como objetos Time de Prisma)
    else if (typeof hora === 'object' && hora !== null) {
      // Intentar convertir a Date primero
      const fecha = new Date(hora);
      if (!isNaN(fecha.getTime())) {
        // CRÍTICO: Usar getUTCFullYear() porque en UTC-5, getFullYear() puede devolver 1969
        if (fecha.getUTCFullYear() === 1970 && fecha.getUTCMonth() === 0 && fecha.getUTCDate() === 1) {
          horas = fecha.getUTCHours();
          minutos = fecha.getUTCMinutes();
        } else {
          horas = fecha.getHours();
          minutos = fecha.getMinutes();
        }
      } else if (typeof hora.getHours === 'function') {
        // Si tiene método getHours pero no es Date válido, intentar usar directamente
        // Pero primero verificar si es un objeto Time de Prisma (fecha 1970-01-01)
        // CRÍTICO: Usar getUTCFullYear() porque en UTC-5, getFullYear() puede devolver 1969
        if (typeof hora.getUTCFullYear === 'function' && hora.getUTCFullYear() === 1970) {
          if (typeof hora.getUTCHours === 'function') {
            horas = hora.getUTCHours();
            minutos = hora.getUTCMinutes();
          } else {
            horas = hora.getHours();
            minutos = hora.getMinutes();
          }
        } else {
          horas = hora.getHours();
          minutos = hora.getMinutes();
        }
      } else {
        // Intentar parsear como string o número
        const fecha = new Date(hora);
        if (isNaN(fecha.getTime())) {
          return '8:00PM';
        }
        if (fecha.getFullYear() === 1970 && fecha.getMonth() === 0 && fecha.getDate() === 1) {
          horas = fecha.getUTCHours();
          minutos = fecha.getUTCMinutes();
        } else {
          horas = fecha.getHours();
          minutos = fecha.getMinutes();
        }
      }
    }
    // Intentar parsear como Date
    else {
      const fecha = new Date(hora);
      if (isNaN(fecha.getTime())) {
        return '8:00PM';
      }
      // Si es una fecha de 1970-01-01, usar UTC siempre para evitar problemas de zona horaria
      if (fecha.getFullYear() === 1970 && fecha.getMonth() === 0 && fecha.getDate() === 1) {
        horas = fecha.getUTCHours();
        minutos = fecha.getUTCMinutes();
      } else {
        horas = fecha.getHours();
        minutos = fecha.getMinutes();
      }
    }
    
    // Asegurar que las horas estén en el rango 0-23
    // Si por alguna razón se obtiene un valor fuera de rango, ajustarlo
    if (horas < 0 || horas > 23) {
      horas = horas % 24;
      if (horas < 0) horas += 24;
    }
    
    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
    return `${horas12}:${minutos.toString().padStart(2, '0')}${periodo}`;
  } catch (e) {
    console.error('Error formateando hora:', e, 'Hora recibida:', hora, 'Tipo:', typeof hora);
    return '8:00PM';
  }
}

module.exports = { 
  generarFacturaProformaHTML,
  organizarServiciosPorCategoria
};


