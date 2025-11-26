const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Genera un PDF de contrato usando HTML + Puppeteer
 * @param {Object} contrato - Datos del contrato con relaciones
 * @returns {Buffer} - PDF como buffer
 */
async function generarContratoHTML(contrato, lang = 'es') {
  // Importar traducciones
  const { t } = require('./translations');
  
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

  // Leer el template HTML de contratos (mismo diseño que ofertas pero con secciones adicionales) según la compañía
  const templatePath = esRevolution 
    ? path.join(__dirname, '../templates/pdf-contrato.html')
    : path.join(__dirname, '../templates/pdf-contrato-diamond.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Organizar servicios por categoría (usar la misma función de ofertas)
  const { organizarServiciosPorCategoria, generarFacturaProformaHTML } = require('./pdfFacturaHTML');
  
  // Adaptar estructura del contrato para la función de categorización
  // La función espera paquetes_servicios y ofertas_servicios_adicionales o contratos_servicios
  const datosParaCategorizar = {
    paquetes: contrato.paquetes,
    contratos_servicios: contrato.contratos_servicios || [],
    seleccion_sidra_champana: contrato.ofertas?.seleccion_sidra_champana || null,
    photobooth_tipo: contrato.ofertas?.photobooth_tipo || null
  };
  
  const serviciosOrganizados = organizarServiciosPorCategoria(datosParaCategorizar);

  // Preparar servicios del paquete y adicionales usando la misma estructura que ofertas
  // Separar servicios del paquete y adicionales
  const serviciosPaqueteList = Object.values(serviciosOrganizados).flat().filter(s => s.esPaquete === true);
  const serviciosAdicionalesList = Object.values(serviciosOrganizados).flat().filter(s => s.esPaquete === false);
  
  // Filtrar servicios adicionales PRIMERO (antes de usarlos)
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
    return precioUnitario > 0;
  });

  // Crear un Set de IDs de servicios adicionales filtrados (solo los que tienen precio > 0)
  const serviciosAdicionalesIds = new Set();
  serviciosAdicionalesFiltrados.forEach(cs => {
    const servicioId = cs.servicios?.id || cs.servicio_id;
    if (servicioId) {
      serviciosAdicionalesIds.add(servicioId);
    }
  });

  // Preparar estructura para generarHTMLServicios (igual que ofertas)
  const serviciosPaquete = {
    venue: serviciosOrganizados.venue.filter(s => s.esPaquete === true),
    cake: serviciosOrganizados.cake.filter(s => s.esPaquete === true),
    decoration: serviciosOrganizados.decoration.filter(s => s.esPaquete === true),
    specials: serviciosOrganizados.specials.filter(s => s.esPaquete === true),
    barService: serviciosOrganizados.barService.filter(s => s.esPaquete === true),
    catering: serviciosOrganizados.catering.filter(s => s.esPaquete === true),
    serviceCoord: serviciosOrganizados.serviceCoord.filter(s => s.esPaquete === true),
    personal: serviciosOrganizados.personal ? serviciosOrganizados.personal.filter(s => s.esPaquete === true) : []
  };

  // Filtrar servicios adicionales: solo los que están en serviciosAdicionalesIds
  const serviciosAdicionales = {
    venue: serviciosOrganizados.venue.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    cake: serviciosOrganizados.cake.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    decoration: serviciosOrganizados.decoration.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    specials: serviciosOrganizados.specials.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    barService: serviciosOrganizados.barService.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    catering: serviciosOrganizados.catering.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    serviceCoord: serviciosOrganizados.serviceCoord.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }),
    personal: serviciosOrganizados.personal ? serviciosOrganizados.personal.filter(s => {
      const servicioId = s.id || s.servicios?.id;
      return servicioId && serviciosAdicionalesIds.has(servicioId);
    }) : []
  };

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
      } else if (categoria.includes('coordinación') || categoria.includes('coordinacion') || categoria.includes('coordinador') || categoria.includes('mesero') || categoria.includes('bartender') || nombre.includes('coordinador') || nombre.includes('mesero') || nombre.includes('bartender')) {
        serviciosAdicionalesOrganizados.serviceCoord.push(servicioConDatos);
      } else if (categoria.includes('venue') || nombre.includes('venue') || nombre.includes('salón') || nombre.includes('salon')) {
        serviciosAdicionalesOrganizados.venue.push(servicioConDatos);
      } else {
        serviciosAdicionalesOrganizados.specials.push(servicioConDatos);
      }
    }
  });

  // Usar la misma función de mapeo que en pdfFacturaHTML
  // Detectar si es Kendall o Doral para el mapeo correcto
  const esKendall = nombreSalon.includes('kendall');
  
  const mapearServicioACategoria = (servicio) => {
    const nombre = (servicio.nombre || servicio.descripcion || servicio.servicios?.nombre || servicio.servicios?.descripcion || '').toLowerCase();
    const descripcion = (servicio.descripcion || servicio.servicios?.descripcion || '').toLowerCase();
    const texto = `${nombre} ${descripcion}`;
    const nombreExacto = nombre.trim();

    // Obtener nombre del salón para filtros específicos
    const nombreSalonParaFiltro = nombreSalon;
    const esKendallLocal = nombreSalonParaFiltro.includes('kendall');
    const esDoralLocal = nombreSalonParaFiltro.includes('doral') && !nombreSalonParaFiltro.includes('diamond');
    const esDiamondLocal = nombreSalonParaFiltro.includes('diamond') && !esDoralLocal;

    // BEBIDAS
    if (nombreExacto.includes('champaña') || nombreExacto.includes('champagne')) {
      if (!nombreExacto.includes('sidra') && !nombreExacto.includes('cider')) {
        return { categoria: 'bebidas', item: 'Champaña' };
      }
    }
    if ((texto.includes('champaña') || texto.includes('champagne')) && !texto.includes('sidra') && !texto.includes('cider')) {
      return { categoria: 'bebidas', item: 'Champaña' };
    }
    if (texto.includes('licor premium') || (texto.includes('premium') && (texto.includes('licor') || texto.includes('liquor')))) {
      return { categoria: 'bebidas', item: 'Licor Premium' };
    }
    if (texto.includes('licor house') || texto.includes('licor básico') || texto.includes('licor basico') || (texto.includes('licor') && (texto.includes('house') || texto.includes('básico') || texto.includes('basico')))) {
      return { categoria: 'bebidas', item: 'Licor House' };
    }
    if (texto.includes('refresco') || texto.includes('jugo') || texto.includes('agua') || texto.includes('bebida no alcohólica') || texto.includes('soft drink')) {
      return { categoria: 'bebidas', item: 'Refrescos/Jugo/Agua' };
    }
    if (nombreExacto.includes('sidra') || nombreExacto.includes('cider')) {
      if (!nombreExacto.includes('champaña') && !nombreExacto.includes('champagne')) {
        return { categoria: 'bebidas', item: 'Sidra' };
      }
    }
    if ((texto.includes('sidra') || texto.includes('cider')) && !texto.includes('champaña') && !texto.includes('champagne')) {
      return { categoria: 'bebidas', item: 'Sidra' };
    }

    // COMIDA
    if (texto.includes('cake') || texto.includes('torta') || texto.includes('vainilla') || texto.includes('marmoleado')) {
      return { categoria: 'comida', item: 'Cake (Vainilla o Marmoleado)' };
    }
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
    if (texto.includes('decoración') || texto.includes('decoracion') || texto.includes('decoration')) {
      return { categoria: 'decoracion', item: 'Decoracion House' };
    }

    // ENTRETENIMIENTO
    if (nombreExacto.includes('hora loca') || 
        texto.includes('hora loca') ||
        (nombreExacto.includes('hora') && nombreExacto.includes('loca') && !nombreExacto.includes('extra'))) {
      return { categoria: 'entretenimiento', item: 'Hora Loca' };
    }
    if (nombreExacto.includes('animador') || nombreExacto.includes('animación') || nombreExacto.includes('animacion')) {
      if (!nombreExacto.includes('hora loca') && !nombreExacto.includes('adicional')) {
        return { categoria: 'entretenimiento', item: 'Animador' };
      }
    }
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
    if (texto.includes('máquina de chispa') || texto.includes('maquina de chispa') || texto.includes('spark')) {
      if (esKendall) {
        return null;
      }
      return { categoria: 'equipos', item: 'Máquina de Chispas' };
    }
    if (texto.includes('máquina de humo') || texto.includes('maquina de humo') || texto.includes('smoke')) {
      return { categoria: 'equipos', item: 'Máquina de Humo' };
    }
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
    if ((texto.includes('foto') || texto.includes('photo')) && (texto.includes('video') || texto.includes('vídeo')) && (texto.includes('3 hora') || texto.includes('3h'))) {
      return { categoria: 'fotografia', item: 'Foto y Video 3 Horas' };
    }
    if ((texto.includes('foto') || texto.includes('photo')) && (texto.includes('video') || texto.includes('vídeo')) && (texto.includes('5 hora') || texto.includes('5h'))) {
      return { categoria: 'fotografia', item: 'Foto y Video 5 Horas' };
    }
    if (texto.includes('photobooth 360') || texto.includes('cabina 360') || (texto.includes('360') && (texto.includes('photobooth') || texto.includes('cabina') || texto.includes('fotográfica') || texto.includes('fotografica')))) {
      return { categoria: 'fotografia', item: 'Photobooth 360' };
    }
    if (texto.includes('photobooth print') || (texto.includes('photobooth') && (texto.includes('print') || texto.includes('impresión') || texto.includes('impresion'))) || (texto.includes('cabina fotográfica') && (texto.includes('impresión') || texto.includes('impresion'))) || (texto.includes('cabina fotografica') && (texto.includes('impresión') || texto.includes('impresion')))) {
      return { categoria: 'fotografia', item: 'Photobooth Print' };
    }

    // TRANSPORTE
    if (texto.includes('limosina') || texto.includes('limousine') || texto.includes('limo') ||
        nombreExacto.includes('limosina') || nombreExacto.includes('limousine') || nombreExacto.includes('limo')) {
      return { categoria: 'transporte', item: 'Limosina (15 Millas)' };
    }

    // PERSONAL
    if (texto.includes('bartender') || texto.includes('barman')) {
      return { categoria: 'personal', item: 'Bartender' };
    }
    if (texto.includes('coordinador') || texto.includes('coordinator') || texto.includes('event coordinator')) {
      return { categoria: 'personal', item: 'Coordinador de Eventos' };
    }
    if ((texto.includes('mesero') || texto.includes('waiter') || texto.includes('personal de servicio') || texto.includes('personal de atención') || texto.includes('servicio')) &&
        !texto.includes('limosina') && !texto.includes('limousine') && !texto.includes('limo')) {
      return { categoria: 'personal', item: 'Personal de Atención' };
    }

    return null;
  };

  // Función para generar HTML de servicios por categoría (nuevo diseño organizado - igual que ofertas)
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
      return { html: '', gridStyle: '' }; // Retornar HTML vacío si no hay servicios
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

  // Generar HTML de servicios adicionales en formato elegante (mismo estilo que ofertas, SIN precios)
  // IMPORTANTE: Solo mostrar servicios que realmente son adicionales/extras, NO usar defaults del paquete
  const generarHTMLServiciosAdicionales = () => {
    // Usar solo servicios adicionales filtrados (con precio > 0 y no en el paquete)
    // Convertir serviciosAdicionalesFiltrados a la estructura que espera generarHTMLServicios
    if (!serviciosAdicionalesFiltrados || serviciosAdicionalesFiltrados.length === 0) {
      return { html: '', gridStyle: '' };
    }

    // Crear estructura de servicios adicionales usando solo los filtrados
    const serviciosAdicionalesParaHTML = {
      venue: [],
      cake: [],
      decoration: [],
      specials: [],
      barService: [],
      catering: [],
      serviceCoord: [],
      personal: []
    };

    // Mapear servicios filtrados a la estructura correcta
    serviciosAdicionalesFiltrados.forEach(cs => {
      const servicio = cs.servicios || {};
      const servicioConDatos = {
        ...servicio,
        id: servicio.id || cs.servicio_id,
        esPaquete: false, // Todos son adicionales
        cantidad: cs.cantidad || 1,
        precio_unitario: parseFloat(cs.precio_unitario || 0),
        subtotal: parseFloat(cs.subtotal || cs.precio_unitario * (cs.cantidad || 1))
      };

      // Categorizar según la estructura de organizarServiciosPorCategoria
      const categoria = (servicio.categoria || '').toLowerCase();
      const nombre = (servicio.nombre || '').toLowerCase();
      
      if (nombre.includes('cake') || nombre.includes('torta')) {
        serviciosAdicionalesParaHTML.cake.push(servicioConDatos);
      } else if (categoria.includes('decoración') || categoria.includes('decoration') || nombre.includes('decoración') || nombre.includes('decoration')) {
        serviciosAdicionalesParaHTML.decoration.push(servicioConDatos);
      } else if (categoria.includes('bebida') || categoria.includes('bar') || categoria.includes('licor') || nombre.includes('bar') || nombre.includes('bebida') || nombre.includes('champaña') || nombre.includes('champagne')) {
        serviciosAdicionalesParaHTML.barService.push(servicioConDatos);
      } else if (categoria.includes('comida') || categoria.includes('catering') || categoria.includes('food') || nombre.includes('comida') || nombre.includes('catering') || nombre.includes('pasapalos') || nombre.includes('dulces') || nombre.includes('mini dulces') || nombre.includes('pasapalo')) {
        serviciosAdicionalesParaHTML.catering.push(servicioConDatos);
      } else if (categoria.includes('personal') || 
                 nombre.includes('bartender') || nombre.includes('barman') ||
                 nombre.includes('personal de atención') || nombre.includes('personal de servicio') ||
                 nombre.includes('mesero') || nombre.includes('waiter') ||
                 nombre.includes('coordinador') || nombre.includes('coordinator')) {
        serviciosAdicionalesParaHTML.personal.push(servicioConDatos);
      } else if (categoria.includes('coordinación') || categoria.includes('coordinacion') || categoria.includes('coordinador') || categoria.includes('service') || nombre.includes('waiters')) {
        serviciosAdicionalesParaHTML.serviceCoord.push(servicioConDatos);
      } else {
        serviciosAdicionalesParaHTML.specials.push(servicioConDatos);
      }
    });

    // Usar la misma función generarHTMLServicios pero con servicios adicionales filtrados
    return generarHTMLServicios(serviciosAdicionalesParaHTML, false);
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

  // Generar HTML de servicios usando la misma función que ofertas
  const serviciosPaqueteHTML = generarHTMLServicios(serviciosPaquete, true);
  const serviciosAdicionalesHTML = generarHTMLServiciosAdicionales();

  const htmlServiciosPaqueteFinal = serviciosPaqueteHTML.html;
  const gridStylePaquete = serviciosPaqueteHTML.gridStyle || 'grid-template-columns: 1fr 1fr 1fr;';

  const htmlServiciosAdicionales = serviciosAdicionalesHTML.html;
  const gridStyleExtras = serviciosAdicionalesHTML.gridStyle || 'grid-template-columns: 1fr 1fr 1fr;';

  // Preparar datos para reemplazar en el template
  const nombreCliente = contrato.clientes?.nombre_completo || 'N/A';
  const nombreClientePrimero = nombreCliente.split(' ')[0] || nombreCliente;
  const nombreVendedor = contrato.vendedores?.nombre_completo || contrato.vendedor?.nombre_completo || contrato.usuarios?.nombre_completo || 'N/A';
  const telefonoVendedor = '+1 (786) 332-7065';
  const emailVendedor = 'diamondvenueatdoral@gmail.com';
  const homenajeado = contrato.homenajeado || '';
  // Usar tipo_evento de la oferta (específico de esta oferta) en lugar del tipo_evento del cliente
  const tipoEvento = contrato.ofertas?.tipo_evento || contrato.clientes?.tipo_evento || 'Evento';
  const fechaEvento = new Date(contrato.fecha_evento);
  const horaInicio = formatearHora(contrato.hora_inicio);
  
  // Calcular horas adicionales y hora fin con extras
  const horasAdicionales = obtenerHorasAdicionales(contrato.contratos_servicios || []);
  const horaFinConExtras = calcularHoraFinConExtras(contrato.hora_fin, horasAdicionales);
  const horaFin = formatearHora(horaFinConExtras);
  const cantidadInvitados = contrato.cantidad_invitados || 0;
  const emailCliente = contrato.clientes?.email || '';
  const telefonoCliente = contrato.clientes?.telefono || '';

  // Obtener información del salón y detectar compañía (usar variables ya declaradas)
  let direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
  let logoPath = '';
  let nombreCompania = 'Diamond Venue';
  
  
  if (nombreSalon) {
    if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      direccionSalon = 'Salón Doral<br>8726 NW 26th St<br>Doral, FL 33172';
      esRevolution = true;
      nombreCompania = 'Revolution Party Venues';
      logoPath = path.join(__dirname, '../templates/assets/Logorevolution.png');
    } else if (nombreSalon.includes('kendall')) {
      direccionSalon = 'Salón Kendall<br>14271 Southwest 120th Street<br>Kendall, Miami, FL 33186';
      esRevolution = true;
      nombreCompania = 'Revolution Party Venues';
      logoPath = path.join(__dirname, '../templates/assets/Logorevolution.png');
    } else if (nombreSalon.includes('diamond')) {
      direccionSalon = 'Salón Diamond<br>4747 NW 79th Ave<br>Doral, FL 33166';
      esRevolution = false;
      nombreCompania = 'Diamond Venue';
      logoPath = path.join(__dirname, '../../../7.png');
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

  // Generar HTML del desglose de inversión en formato div (sin tablas, como ofertas)
  // Usar colores según el template (blanco para Diamond, negro para Revolution)
  const textColor = esRevolution ? '#333' : '#ffffff';
  const borderColor = esRevolution ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)';
  const fontFamily = esRevolution ? 'Montserrat' : 'Poppins';
  
  let investmentBreakdownDivs = '';
  investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
    <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Precio del Paquete</span>
    <span style="font-size: 16px; color: ${textColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${precioPaquete.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
  </div>`;
  if (ajusteTemporada !== 0) {
    investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
      <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Ajuste de Temporada</span>
      <span style="font-size: 16px; color: ${textColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${ajusteTemporada.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
    </div>`;
  }
  if (subtotalServicios > 0) {
    investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
      <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Servicios Adicionales/Extras</span>
      <span style="font-size: 16px; color: ${textColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${subtotalServicios.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
    </div>`;
  }
  if (descuento > 0) {
    const descuentoColor = esRevolution ? '#d32f2f' : '#ff6b6b';
    investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
      <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Descuento</span>
      <span style="font-size: 16px; color: ${descuentoColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">-$${descuento.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
    </div>`;
  }
  investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
    <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Subtotal</span>
    <span style="font-size: 16px; color: ${textColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${subtotalBase.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
  </div>`;
  investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
    <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Impuesto (${impuestoPorcentaje}%)</span>
    <span style="font-size: 16px; color: ${textColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${impuestoMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
  </div>`;
  investmentBreakdownDivs += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColor};">
    <span style="font-size: 15px; color: ${textColor}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Tarifa de Servicio (${tarifaServicioPorcentaje}%)</span>
    <span style="font-size: 16px; color: ${textColor}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${tarifaServicioMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
  </div>`;
  
  // Mantener también el formato de tabla para compatibilidad
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

  // Generar acuerdo de pago en formato div (sin tablas, como ofertas) - más compacto
  const borderColorAgreement = esRevolution ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)';
  const textColorAgreement = esRevolution ? '#333' : '#ffffff';
  const textColorAgreementDark = esRevolution ? '#000' : '#ffffff';
  
  let paymentAgreement = '';
  if (contrato.tipo_pago === 'unico') {
    paymentAgreement = `
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColorAgreement};">
          <span style="font-size: 13px; color: ${textColorAgreement}; font-weight: 600; font-family: '${fontFamily}', sans-serif;">Modalidad de Pago</span>
          <span style="font-size: 14px; color: ${textColorAgreementDark}; font-weight: 600; font-family: '${fontFamily}', sans-serif; text-align: right;">PAGO ÚNICO</span>
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid ${borderColorAgreement};">
          <div style="font-size: 12px; color: ${textColorAgreement}; font-weight: 400; font-family: '${fontFamily}', sans-serif; line-height: 1.5;">El pago total debe realizarse de una sola vez antes del evento. El pago completo debe estar liquidado al menos diez (10) días hábiles antes de la fecha del evento.</div>
        </div>
      </div>`;
  } else if (contrato.plan_pagos) {
    const plan = typeof contrato.plan_pagos === 'string' ? JSON.parse(contrato.plan_pagos) : contrato.plan_pagos;
    if (plan) {
      paymentAgreement = `
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColorAgreement};">
            <span style="font-size: 13px; color: ${textColorAgreement}; font-weight: 600; font-family: '${fontFamily}', sans-serif;">Modalidad de Pago</span>
            <span style="font-size: 14px; color: ${textColorAgreementDark}; font-weight: 600; font-family: '${fontFamily}', sans-serif; text-align: right;">FINANCIAMIENTO EN ${contrato.meses_financiamiento || plan.pagos?.length || 'N/A'} CUOTAS</span>
          </div>`;
      
      if (plan.depositoReserva) {
        paymentAgreement += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColorAgreement};">
            <span style="font-size: 12px; color: ${textColorAgreement}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Depósito de Reserva</span>
            <span style="font-size: 13px; color: ${textColorAgreementDark}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${plan.depositoReserva.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (No reembolsable)</span>
          </div>`;
      }
      if (plan.segundoPago || plan.pagoInicial) {
        const segundoPago = plan.segundoPago || plan.pagoInicial || 0;
        paymentAgreement += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColorAgreement};">
            <span style="font-size: 12px; color: ${textColorAgreement}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Segundo Pago</span>
            <span style="font-size: 13px; color: ${textColorAgreementDark}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${segundoPago.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (10 días después de la reserva)</span>
          </div>`;
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
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${borderColorAgreement};">
              <span style="font-size: 12px; color: ${textColorAgreement}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">Cuota #${index + 1}</span>
              <span style="font-size: 13px; color: ${textColorAgreementDark}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${pago.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} - ${fechaVencimiento} - ${metodo}</span>
            </div>`;
        });
      }
      const bgColorImportant = esRevolution ? '#fff9e6' : 'rgba(255, 249, 230, 0.2)';
      const borderColorImportant = esRevolution ? '#000' : '#ffffff';
      paymentAgreement += `
          <div style="padding: 10px; margin-top: 8px; background-color: ${bgColorImportant}; border: 2px solid ${borderColorImportant}; border-radius: 4px;">
            <div style="font-size: 13px; color: ${textColorAgreementDark}; font-weight: 700; font-family: '${fontFamily}', sans-serif; margin-bottom: 6px; text-transform: uppercase;">IMPORTANTE</div>
            <div style="font-size: 12px; color: ${textColorAgreement}; font-weight: 500; font-family: '${fontFamily}', sans-serif; line-height: 1.5;">El pago completo debe estar liquidado al menos diez (10) días hábiles antes del evento. Todos los pagos son no reembolsables.</div>
          </div>
        </div>`;
    }
  }

  // Generar historial de pagos en formato div (sin tablas) - más compacto
  const borderColorHistory = esRevolution ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)';
  const textColorHistory = esRevolution ? '#333' : '#ffffff';
  const textColorHistoryDark = esRevolution ? '#000' : '#ffffff';
  
  let paymentHistory = '';
  if (contrato.pagos && contrato.pagos.length > 0) {
    paymentHistory = `
      <div style="margin-top: 0;">
        <h3 style="font-size: 1.4rem; font-weight: 400; text-transform: uppercase; letter-spacing: 2px; color: ${textColorHistoryDark}; font-family: '${fontFamily}', sans-serif; margin-bottom: 12px;">Historial de Pagos</h3>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto;">`;
    contrato.pagos.forEach((pago) => {
      const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const monto = (parseFloat(pago.monto) || 0).toFixed(2);
      const metodo = pago.metodo_pago || 'N/A';
      const estadoPago = (pago.estado || 'completado').toUpperCase();
      paymentHistory += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid ${borderColorHistory};">
            <span style="font-size: 12px; color: ${textColorHistory}; font-weight: 400; font-family: '${fontFamily}', sans-serif;">${fechaPago}</span>
            <span style="font-size: 13px; color: ${textColorHistoryDark}; font-weight: 500; font-family: '${fontFamily}', sans-serif; text-align: right;">$${monto} - ${metodo} - ${estadoPago}</span>
          </div>`;
    });
    paymentHistory += `</div></div>`;
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
        <div class="terms-article-content">El Cliente se compromete a realizar los pagos según el plan de pagos acordado. Todos los depósitos son no reembolsables. El pago completo debe estar liquidado al menos diez (10) días hábiles antes del evento.</div>
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

  // Convertir logo a base64 si existe y generar HTML del logo (mismo tamaño que ofertas)
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

  // Cargar fondo para portada (igual que ofertas)
  let fondoStyle = `background-image: 
                radial-gradient(circle, rgba(212,175,55,0.2) 2px, transparent 2.5px),
                radial-gradient(circle, rgba(212,175,55,0.2) 2px, transparent 2.5px);
            background-size: 30px 30px;
            background-position: 0 0, 15px 15px;
            display: block;`;
  let hasBackground = false;
  
  if (esRevolution) {
    // Fondo para Revolution - img12.jpg
    const fondoPath = path.join(__dirname, '../templates/assets/img12.jpg');
    if (fs.existsSync(fondoPath)) {
    try {
      const fondoBuffer = fs.readFileSync(fondoPath);
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
  } else {
    // Fondo para Diamond - fondoDiamond.png (igual que ofertas)
    const fondoDiamondPath = path.join(__dirname, '../../../fondoDiamond.png');
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
      } catch (error) {
        console.error('Error al cargar fondo Diamond:', error);
        // Intentar ruta alternativa
        const fondoDiamondPathAlt = path.join(__dirname, '../../../../fondoDiamond.png');
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
          } catch (error) {
            console.error('Error al cargar fondo Diamond desde ruta alternativa:', error);
          }
        }
      }
    }
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
    } else {
    }
  }

  // Generar HTML para homenajeado en la portada
  const homenajeadoCover = homenajeado ? `<strong>Homenajeado/a:</strong> ${homenajeado}<br>` : '';

  // Reemplazos en el template
  const replacements = {
    '{{CONTRACT_CODE}}': contrato.codigo_contrato || 'N/A',
    '{{CLIENT_NAME}}': nombreCliente,
    '{{CLIENT_NAME_FIRST}}': nombreCliente.split(' ')[0] || nombreCliente,
    '{{VENDEDOR_NAME}}': nombreVendedor,
    '{{VENDEDOR_PHONE}}': telefonoVendedor,
    '{{VENDEDOR_EMAIL}}': emailVendedor,
    '{{HOMENAJEADO_ROW}}': homenajeado ? `<tr class="info-table-row"><td class="info-table-label">Homenajeado/a</td><td class="info-table-value">${homenajeado}</td></tr>` : '',
    '{{HOMENAJEADO_COVER}}': homenajeadoCover,
    '{{EVENT_TYPE}}': tipoEvento,
    '{{EVENT_DATE}}': fechaEvento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    '{{EVENT_TIME}}': `${horaInicio} to ${horaFin}`,
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
    '{{TEXT_EVENT_PROPOSAL}}': lang === 'en' ? 'EVENT CONTRACT FOR:' : 'CONTRATO DE EVENTO PARA:',
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
    '{{TEXT_CONTRACT_DATE}}': lang === 'en' ? 'Contract Signing Date:' : 'Fecha de Firma del Contrato:',
    '{{SERVICIOS_PAQUETE}}': htmlServiciosPaqueteFinal,
    '{{GRID_STYLE_PAQUETE}}': gridStylePaquete,
    '{{PAGE_3_SERVICIOS_ADICIONALES}}': (htmlServiciosAdicionales && htmlServiciosAdicionales.length > 0) ? `
      <div class="page page-3">
        <div class="page-content" style="padding: 0; height: 100%;">
          <div class="package-card" style="display: block;">
            <div style="padding: 40px 50px 10px 50px; text-align: left; flex-shrink: 0;">
              <h2 style="font-size: 3.0rem; font-weight: 400; text-transform: uppercase; letter-spacing: 3px; color: ${esRevolution ? '#000' : '#FFFFFF'}; font-family: 'Montserrat', sans-serif; margin: 0; line-height: 1.2;">EXTRAS</h2>
            </div>
            <div class="package-content" style="flex: 1; padding: 20px 50px 30px 50px; overflow: visible; width: 100%; max-width: 100%; box-sizing: border-box; ${gridStyleExtras}">
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
    '{{INVESTMENT_BREAKDOWN_DIVS}}': investmentBreakdownDivs,
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
 * Formatea hora (igual que en ofertas - formato 12 horas con AM/PM)
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

/**
 * Obtiene la cantidad de horas adicionales de un servicio "Hora Extra"
 * @param {Array} serviciosAdicionales - Array de servicios adicionales
 * @returns {number} Cantidad de horas adicionales
 */
function obtenerHorasAdicionales(serviciosAdicionales = []) {
  if (!serviciosAdicionales || serviciosAdicionales.length === 0) {
    return 0;
  }

  // Buscar el servicio "Hora Extra"
  const horaExtra = serviciosAdicionales.find(
    servicio => servicio.servicios?.nombre === 'Hora Extra' || 
                servicio.servicio?.nombre === 'Hora Extra' ||
                servicio.nombre === 'Hora Extra'
  );

  if (!horaExtra) {
    return 0;
  }

  // Retornar la cantidad (puede estar en diferentes propiedades)
  return horaExtra.cantidad || horaExtra.cantidad_servicio || 0;
}

/**
 * Calcula la hora fin incluyendo horas adicionales
 * @param {string|Date} horaFinOriginal - Hora fin original
 * @param {number} horasAdicionales - Cantidad de horas adicionales
 * @returns {string} Hora fin con extras en formato HH:MM
 */
function calcularHoraFinConExtras(horaFinOriginal, horasAdicionales = 0) {
  if (!horaFinOriginal) {
    return horaFinOriginal;
  }

  try {
    // Extraer hora y minutos - siempre normalizar a formato HH:MM
    let horaFinStr;
    if (horaFinOriginal instanceof Date) {
      // Para campos Time de Prisma, usar UTC
      if (horaFinOriginal.getUTCFullYear() === 1970 && horaFinOriginal.getUTCMonth() === 0 && horaFinOriginal.getUTCDate() === 1) {
        const h = horaFinOriginal.getUTCHours();
        const m = horaFinOriginal.getUTCMinutes();
        horaFinStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } else {
        const h = horaFinOriginal.getHours();
        const m = horaFinOriginal.getMinutes();
        horaFinStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    } else if (typeof horaFinOriginal === 'string') {
      if (horaFinOriginal.includes('T')) {
        const match = horaFinOriginal.match(/(\d{2}):(\d{2})/);
        if (match) {
          horaFinStr = `${match[1]}:${match[2]}`;
        } else {
          horaFinStr = horaFinOriginal.slice(0, 5);
        }
      } else {
        horaFinStr = horaFinOriginal.slice(0, 5);
      }
    } else {
      return horaFinOriginal;
    }
    
    // Si no hay horas adicionales, devolver la hora normalizada en formato HH:MM
    if (horasAdicionales === 0) {
      return horaFinStr;
    }

    const [horaFin, minutoFin] = horaFinStr.split(':').map(Number);

    // Convertir a minutos desde medianoche para facilitar el cálculo
    // Si la hora es 0-2 AM, asumimos que es del día siguiente (24-26 horas)
    let minutosDesdeMedianoche = horaFin * 60 + minutoFin;
    
    // Si es 0, 1 o 2 AM, tratarlo como 24, 25 o 26 horas
    if (horaFin <= 2) {
      minutosDesdeMedianoche = (horaFin + 24) * 60 + minutoFin;
    }

    // Sumar las horas adicionales (convertir a minutos)
    const minutosAdicionales = horasAdicionales * 60;
    const nuevaHoraEnMinutos = minutosDesdeMedianoche + minutosAdicionales;

    // Convertir de vuelta a horas y minutos
    let nuevaHora = Math.floor(nuevaHoraEnMinutos / 60);
    const nuevoMinuto = nuevaHoraEnMinutos % 60;

    // Si la hora es >= 24, convertirla al formato correcto (0-2 AM del día siguiente)
    // 24 = 0, 25 = 1, 26 = 2, etc.
    if (nuevaHora >= 24) {
      nuevaHora = nuevaHora % 24;
    }

    // Formatear la nueva hora
    const nuevaHoraFormateada = `${String(nuevaHora).padStart(2, '0')}:${String(nuevoMinuto).padStart(2, '0')}`;

    return nuevaHoraFormateada;
  } catch (error) {
    console.error('Error calculando hora fin con extras:', error);
    return horaFinOriginal;
  }
}

module.exports = {
  generarContratoHTML
};

