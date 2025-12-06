const PDFDocument = require('pdfkit');

const CONFIG_VISUAL = {
  colores: {
    texto: '#000000',
    textoClaro: '#FFFFFF',
    fondoOscuro: '#1E40AF',
    borde: '#CCCCCC',
  },
  fuentes: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
  },
  tamanosTexto: {
    titulo: 20,
    subtitulo: 14,
    normal: 10,
    pequeno: 8,
  },
  layout: {
    margenSuperior: 40,
    margenInferior: 40,
    margenIzquierdo: 50,
    margenDerecho: 50,
    anchoUtil: 512,
    espacioEntreCampos: 15,
  },
};

/**
 * Obtiene todos los servicios del contrato (paquete + adicionales)
 */
function obtenerServiciosContrato(contrato) {
  const servicios = [];
  
  // Servicios del paquete
  if (contrato?.paquetes?.paquetes_servicios) {
    contrato.paquetes.paquetes_servicios.forEach(ps => {
      if (ps.servicios) {
        servicios.push({
          nombre: ps.servicios.nombre?.toLowerCase() || '',
          categoria: ps.servicios.categoria?.toLowerCase() || ''
        });
      }
    });
  }
  
  // Servicios adicionales del contrato
  if (contrato?.contratos_servicios) {
    contrato.contratos_servicios.forEach(cs => {
      if (cs.servicios) {
        servicios.push({
          nombre: cs.servicios.nombre?.toLowerCase() || '',
          categoria: cs.servicios.categoria?.toLowerCase() || ''
        });
      }
    });
  }
  
  return servicios;
}

/**
 * Verifica si un servicio está contratado
 */
function tieneServicio(servicios, nombresBuscar, contrato) {
  const nombrePaquete = contrato?.paquetes?.nombre?.toLowerCase() || '';
  const esPaquetePersonalizado = nombrePaquete.includes('personalizado');
  
  // Si NO es paquete personalizado, todos los paquetes incluyen estos servicios
  if (!esPaquetePersonalizado) {
    return true;
  }
  
  // Si es personalizado, verificar si el servicio está en los servicios del contrato
  return servicios.some(servicio => {
    const nombre = servicio.nombre;
    return nombresBuscar.some(buscar => nombre.includes(buscar.toLowerCase()));
  });
}

/**
 * Mapea servicios a categorías del formulario
 */
function mapearServiciosPaquete(servicios, contrato) {
  const todosServicios = servicios.map(s => s.nombre);
  
  return {
    // Paquete / Decoración
    pantalla: todosServicios.some(n => n.includes('pantalla') || n.includes('led') || n.includes('tv')),
    dj: todosServicios.some(n => n.includes('dj') || n.includes('disc jockey')),
    colores: todosServicios.some(n => n.includes('color') || n.includes('iluminación') || n.includes('luces')),
    stage: todosServicios.some(n => n.includes('stage') || n.includes('escenario')),
    runners: todosServicios.some(n => n.includes('runner') || n.includes('corredor')),
    chargers: todosServicios.some(n => n.includes('charger') || n.includes('cargador')),
    servilletas: todosServicios.some(n => n.includes('servilleta')),
    centro_mesa: todosServicios.some(n => n.includes('centro') && n.includes('mesa')),
    mesa_regalos: todosServicios.some(n => n.includes('mesa') && n.includes('regalo')),
    limosina: todosServicios.some(n => n.includes('limosina') || n.includes('limousine')),
    photobooth: todosServicios.some(n => n.includes('photobooth') || n.includes('foto booth')),
    hora_loca: todosServicios.some(n => n.includes('hora loca')),
    mapping: todosServicios.some(n => n.includes('mapping') || n.includes('proyección')),
    humo: todosServicios.some(n => n.includes('humo') || n.includes('smoke')),
    chispas: todosServicios.some(n => n.includes('chispa') || n.includes('spark')),
    maestro_ceremonia: todosServicios.some(n => n.includes('maestro') || n.includes('ceremonia') || n.includes('coordinador')),
    fotos_video: todosServicios.some(n => n.includes('foto') || n.includes('video') || n.includes('fotografía')),
    
    // Catering
    mini_postres: todosServicios.some(n => n.includes('mini') && (n.includes('dulce') || n.includes('postre'))),
    appetizers: todosServicios.some(n => n.includes('pasapalo') || n.includes('appetizer') || n.includes('finger food')),
    mesa_quesos: todosServicios.some(n => n.includes('queso') || n.includes('cheese')),
    comida: todosServicios.some(n => n.includes('comida') || n.includes('menu') || n.includes('catering') || n.includes('proteina') || n.includes('plato')),
    
    // Bar
    licores: todosServicios.some(n => n.includes('licor') || n.includes('liquor') || n.includes('bar abierto') || n.includes('open bar')),
    vinos: todosServicios.some(n => n.includes('vino') || n.includes('wine')),
    cocteles_sin_alcohol: todosServicios.some(n => (n.includes('coctel') || n.includes('cocktail')) && (n.includes('sin alcohol') || n.includes('mocktail') || n.includes('virgin'))),
    sodas_agua_jugos: todosServicios.some(n => n.includes('soda') || n.includes('agua') || n.includes('jugo') || n.includes('refresco') || n.includes('bebida')),
  };
}

/**
 * Genera PDF de ajustes del evento en formato "INFORMATIVO DE EVENTOS"
 */
function generarPDFAjustesEvento(ajustes, contrato) {
  const config = CONFIG_VISUAL;
  const { colores, tamanosTexto, fuentes, layout } = config;

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: layout.margenSuperior,
      bottom: layout.margenInferior,
      left: layout.margenIzquierdo,
      right: layout.margenDerecho
    }
  });

  // Obtener servicios del contrato
  const servicios = obtenerServiciosContrato(contrato);
  const serviciosMapeados = mapearServiciosPaquete(servicios, contrato);

  // Título principal
  doc.fontSize(tamanosTexto.titulo)
    .font(fuentes.bold)
    .fillColor(colores.texto)
    .text('INFORMATIVO DE EVENTOS', { align: 'center', y: 30 });

  let yPos = 70;

  // Función para agregar campo con formato label: valor
  const agregarCampo = (label, valor, x = 50, anchoLabel = 180) => {
    if (doc.y > 700) {
      doc.addPage();
      doc.y = 50;
      yPos = 50;
    }
    
    doc.fontSize(tamanosTexto.normal)
      .font(fuentes.bold)
      .fillColor(colores.texto)
      .text(label, x, yPos, { width: anchoLabel });
    
    const valorTexto = valor || '_________________';
    doc.fontSize(tamanosTexto.normal)
      .font(fuentes.normal)
      .fillColor(colores.texto)
      .text(valorTexto, x + anchoLabel + 10, yPos, { width: layout.anchoUtil - anchoLabel - 60 });
    
    yPos += layout.espacioEntreCampos;
    doc.y = yPos;
  };

  // Función para agregar sección
  const agregarSeccion = (titulo) => {
    if (doc.y > 700) {
      doc.addPage();
      doc.y = 50;
      yPos = 50;
    }
    doc.moveDown(1);
    yPos = doc.y;
    doc.fontSize(tamanosTexto.subtitulo)
      .font(fuentes.bold)
      .fillColor(colores.texto)
      .text(titulo, { underline: true });
    doc.moveDown(0.5);
    yPos = doc.y;
  };

  // ============================================
  // 1. INFORMATIVO DE EVENTOS
  // ============================================
  agregarSeccion('1. INFORMATIVO DE EVENTOS');
  
  const clienteNombre = contrato?.clientes?.nombre_completo || '';
  
  // Formatear fecha del evento correctamente (evitar problemas de timezone)
  let fechaEvento = '';
  if (contrato?.fecha_evento) {
    try {
      // Convertir a string si es objeto Date
      let fechaStr = contrato.fecha_evento;
      if (fechaStr instanceof Date) {
        fechaStr = fechaStr.toISOString();
      } else {
        fechaStr = String(fechaStr);
      }
      
      if (fechaStr.includes('T')) {
        const [datePart] = fechaStr.split('T');
        const [year, month, day] = datePart.split('-');
        fechaEvento = `${day}/${month}/${year}`;
      } else if (fechaStr.includes('-')) {
        const [year, month, day] = fechaStr.split('-');
        fechaEvento = `${day}/${month}/${year}`;
      } else {
        fechaEvento = fechaStr;
      }
    } catch (e) {
      fechaEvento = '';
    }
  }
  
  // Tipo de evento: buscar en ofertas primero, luego en contrato, luego en clientes
  const tipoEvento = contrato?.ofertas?.tipo_evento || contrato?.tipo_evento || contrato?.clientes?.tipo_evento || '';
  const homenajeado = contrato?.homenajeado || ajustes?.invitado_honor || '';
  const cantidadInvitados = contrato?.cantidad_invitados || 0;
  const cantidadAdultos = cantidadInvitados - (ajustes?.cantidad_teenagers || 0);
  const cantidadTeens = ajustes?.cantidad_teenagers || 0;
  const contacto = contrato?.clientes?.telefono || contrato?.clientes?.email || '';
  const salon = contrato?.salones?.nombre || contrato?.lugar_salon || '';
  
  // Formatear horas correctamente
  const formatearHora = (hora) => {
    if (!hora) return '';
    try {
      let horaStr = hora;
      if (hora instanceof Date) {
        horaStr = hora.toISOString();
      } else {
        horaStr = String(hora);
      }
      
      let hour = 0;
      let minute = '00';
      
      // Si es un DateTime ISO completo (ej: "1970-01-01T20:00:00.000Z")
      if (horaStr.includes('T')) {
        const timePart = horaStr.split('T')[1];
        if (timePart) {
          const parts = timePart.split(':');
          hour = parseInt(parts[0] || '0', 10);
          minute = (parts[1] || '00').substring(0, 2);
        }
      }
      // Si es solo hora (ej: "20:00:00")
      else if (horaStr.includes(':')) {
        const parts = horaStr.split(':');
        hour = parseInt(parts[0] || '0', 10);
        minute = (parts[1] || '00').substring(0, 2);
      }
      else {
        return horaStr;
      }
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
      return '';
    }
  };
  
  const horaInicio = formatearHora(contrato?.hora_inicio);
  const horaFin = formatearHora(contrato?.hora_fin);
  
  // Vendedor: buscar en vendedores o usuarios
  const vendedor = contrato?.vendedores?.nombre_completo || contrato?.usuarios?.nombre_completo || '';
  const tematica = ajustes?.tematica || '';
  const colorVestido = ajustes?.vestido_nina || '';
  
  // Verificar si es XV años o Sweet 16 para mostrar color del vestido
  const tipoEventoLower = (tipoEvento || '').toLowerCase();
  const esQuinceOSweet16 = tipoEventoLower.includes('quince') || 
                           tipoEventoLower.includes('xv') || 
                           tipoEventoLower.includes('15') ||
                           tipoEventoLower.includes('sweet 16') ||
                           tipoEventoLower.includes('sweet16');

  agregarCampo('NOMBRE:', clienteNombre);
  agregarCampo('FECHA:', fechaEvento);
  agregarCampo('EVENTO:', tipoEvento);
  agregarCampo('NOMBRE HOMENAJEADA:', homenajeado);
  agregarCampo('CANTIDAD INVITADOS:', cantidadInvitados.toString());
  agregarCampo('NRO DE ADULTOS:', cantidadAdultos.toString());
  agregarCampo('NRO DE TEENS:', cantidadTeens.toString());
  agregarCampo('CONTACTO:', contacto);
  agregarCampo('SALON:', salon);
  agregarCampo('HORA DE INICIO:', horaInicio);
  agregarCampo('HORA DE TERMINA:', horaFin);
  agregarCampo('VENDEDOR:', vendedor);
  agregarCampo('TEMATICA:', tematica);
  // Solo mostrar color del vestido para XV años o Sweet 16
  if (esQuinceOSweet16) {
    agregarCampo('COLOR DEL VESTIDO:', colorVestido);
  }

  // ============================================
  // 2. PAQUETE (Solo muestra servicios contratados)
  // ============================================
  agregarSeccion('2. PAQUETE');
  
  // Solo mostrar servicios que el evento realmente tiene (sin "Si", solo el label)
  if (serviciosMapeados.pantalla) {
    agregarCampo('PANTALLA:', 'Incluido');
  }
  if (serviciosMapeados.dj) {
    agregarCampo('DJ:', 'Incluido');
  }
  if (serviciosMapeados.colores) {
    agregarCampo('COLORES:', 'Incluido');
  }
  if (serviciosMapeados.stage) {
    agregarCampo('STAGE:', ajustes?.stage_tipo || 'Incluido');
  }
  if (serviciosMapeados.runners) {
    agregarCampo('RUNNERS:', ajustes?.runner_tipo || 'Incluido');
  }
  if (serviciosMapeados.chargers) {
    agregarCampo('CHARGERS:', 'Incluido');
  }
  if (serviciosMapeados.servilletas) {
    let servilletasTexto = 'Incluido';
    if (ajustes?.servilletas && Array.isArray(ajustes.servilletas) && ajustes.servilletas.length > 0) {
      servilletasTexto = ajustes.servilletas.map(s => s.color).join(', ');
    }
    agregarCampo('SERVILLETAS:', servilletasTexto);
  }
  if (serviciosMapeados.centro_mesa) {
    agregarCampo('CENTRO DE MESA:', ajustes?.centro_mesa_1 || 'Incluido');
  }
  if (serviciosMapeados.mesa_regalos) {
    agregarCampo('MESA DE REGALOS:', 'Incluido');
  }
  if (serviciosMapeados.limosina) {
    let limosinaTexto = 'Incluido';
    if (ajustes?.hora_limosina) {
      limosinaTexto = typeof ajustes.hora_limosina === 'string' 
        ? ajustes.hora_limosina 
        : new Date(`2000-01-01T${ajustes.hora_limosina}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    agregarCampo('LIMOSINA:', limosinaTexto);
  }
  if (serviciosMapeados.photobooth) {
    agregarCampo('PHOTOBOOTH:', contrato?.photobooth_tipo || 'Incluido');
  }
  if (serviciosMapeados.hora_loca) {
    agregarCampo('HORA LOCA:', 'Incluido');
  }
  if (serviciosMapeados.mapping) {
    agregarCampo('MAPPING:', 'Incluido');
  }
  if (serviciosMapeados.humo) {
    agregarCampo('HUMO:', 'Incluido');
  }
  if (serviciosMapeados.chispas) {
    agregarCampo('CHISPAS:', 'Incluido');
  }
  if (serviciosMapeados.maestro_ceremonia) {
    agregarCampo('MAESTRO DE CEREMONIA:', 'Incluido');
  }
  if (serviciosMapeados.fotos_video) {
    agregarCampo('FOTOS Y VIDEO:', 'Incluido');
  }

  // ============================================
  // 3. CATERING
  // ============================================
  agregarSeccion('3. CATERING');
  
  const disenoTorta = ajustes?.diseno_torta || ajustes?.diseno_otro || '';
  const saborTorta = ajustes?.sabor_torta || ajustes?.sabor_otro || '';
  const pisosTorta = ajustes?.pisos_torta ? `${ajustes.pisos_torta} pisos` : '';
  const tortaTexto = [disenoTorta, saborTorta, pisosTorta].filter(Boolean).join(' - ') || '';
  
  agregarCampo('CAKE:', tortaTexto);
  
  // Mini postres - solo si está incluido
  if (serviciosMapeados.mini_postres) {
    agregarCampo('MESA DE MINIPOSTRES:', 'Incluido');
  }
  
  // Appetizers - solo si está incluido
  if (serviciosMapeados.appetizers) {
    agregarCampo('APPETIZERS:', 'Incluido');
  }
  
  // Mesa de quesos - solo si está incluido
  if (serviciosMapeados.mesa_quesos) {
    agregarCampo('MESA DE QUESOS:', 'Incluido');
  }
  
  // Catering / Comida
  if (serviciosMapeados.comida) {
    agregarCampo('CATERING:', 'Incluido');
  }
  agregarCampo('  ENSALADA:', ajustes?.entrada || 'Cesar');
  agregarCampo('  PROTEINA:', ajustes?.plato_principal || '');
  agregarCampo('  SIDE:', ajustes?.acompanamientos || ajustes?.acompanamiento_seleccionado || '');
  agregarCampo('  PAN Y MANTEQUILLA:', 'Incluido');

  // ============================================
  // 4. BAR
  // ============================================
  agregarSeccion('4. BAR');
  
  // Licores - solo si está incluido
  if (serviciosMapeados.licores) {
    agregarCampo('LICORES:', ajustes?.bebidas_incluidas || 'Incluido');
  }
  
  // Vinos - solo si está incluido
  if (serviciosMapeados.vinos) {
    agregarCampo('VINOS:', 'Incluido');
  }
  
  // Cocteles sin alcohol - solo si está incluido
  if (serviciosMapeados.cocteles_sin_alcohol) {
    agregarCampo('COCKTELES SIN ALCOHOL:', 'Incluido');
  }
  
  // Sodas, agua y jugos - siempre incluido
  agregarCampo('SODAS, AGUA Y JUGOS:', 'Incluido');
  
  // Sidra y/o Champaña - solo mostrar lo que tiene el evento
  const seleccionSidraChampana = contrato?.ofertas?.seleccion_sidra_champana || contrato?.seleccion_sidra_champana || '';
  if (seleccionSidraChampana) {
    const seleccion = seleccionSidraChampana.toLowerCase();
    if (seleccion.includes('champana') || seleccion.includes('champaña') || seleccion === 'champagne') {
      agregarCampo('CHAMPANA:', 'Incluido');
    }
    if (seleccion.includes('sidra') || seleccion === 'cider') {
      agregarCampo('SIDRA:', 'Incluido');
    }
    // Si tiene ambos
    if (seleccion === 'ambos' || seleccion === 'both') {
      agregarCampo('CHAMPANA:', 'Incluido');
      agregarCampo('SIDRA:', 'Incluido');
    }
  }
  
  if (ajustes?.notas_menu) {
    agregarCampo('OBSERVACIONES BAR:', ajustes.notas_menu);
  }

  // ============================================
  // 5. MESAS
  // ============================================
  agregarSeccion('5. MESAS');
  
  agregarCampo('ENUMERAR MESAS:', '');
  agregarCampo('SEATING CHART:', '');
  agregarCampo('OBSERVACIONES:', '');

  // ============================================
  // 6. LA CLIENTE LLEVA
  // ============================================
  agregarSeccion('6. LA CLIENTE LLEVA');
  
  doc.moveDown(0.3);
  for (let i = 0; i < 5; i++) {
    doc.fontSize(tamanosTexto.normal)
      .font(fuentes.normal)
      .fillColor(colores.texto)
      .text('___________________________________________________________', 50, doc.y);
    doc.moveDown(0.5);
  }

  // ============================================
  // 7. PROTOCOLO
  // ============================================
  agregarSeccion('7. PROTOCOLO');
  
  if (ajustes?.protocolo) {
    try {
      const protocolo = typeof ajustes.protocolo === 'string' 
        ? JSON.parse(ajustes.protocolo)
        : ajustes.protocolo;
      
      agregarCampo('Hora de Apertura:', protocolo.hora_apertura || '');
      agregarCampo('Anuncio de Padres:', protocolo.hora_anuncio_padres || '');
      if (protocolo.nombres_padres) {
        agregarCampo('Nombres de Padres:', protocolo.nombres_padres);
      }
      agregarCampo('Anuncio del Homenajeado:', protocolo.hora_anuncio_homenajeado || '');
      if (protocolo.nombre_homenajeado) {
        agregarCampo('Nombre del Homenajeado:', protocolo.nombre_homenajeado);
      }
      if (protocolo.cambio_zapatilla) agregarCampo('Cambio de Zapatilla:', 'Incluido');
      if (protocolo.baile_papa) agregarCampo('Baile con Papa:', 'Incluido');
      if (protocolo.baile_mama) agregarCampo('Baile con Mama:', 'Incluido');
      if (protocolo.ceremonia_velas) agregarCampo('Ceremonia de Velas:', 'Incluido');
      if (protocolo.brindis) agregarCampo('Brindis:', 'Incluido');
      agregarCampo('Hora de Cena:', protocolo.hora_cena || '');
      agregarCampo('Hora Loca:', protocolo.hora_loca || '');
      agregarCampo('Hora de Fin:', protocolo.hora_fin || '');
    } catch (e) {
      // Si hay error, dejar líneas en blanco
      for (let i = 0; i < 10; i++) {
        doc.fontSize(tamanosTexto.normal)
          .font(fuentes.normal)
          .fillColor(colores.texto)
          .text('___________________________________________________________', 50, doc.y);
        doc.moveDown(0.5);
      }
    }
  } else {
    // Líneas en blanco para protocolo
    for (let i = 0; i < 10; i++) {
      doc.fontSize(tamanosTexto.normal)
        .font(fuentes.normal)
        .fillColor(colores.texto)
        .text('___________________________________________________________', 50, doc.y);
      doc.moveDown(0.5);
    }
  }

  // Pie de página
  const pageRange = doc.bufferedPageRange();
  const startPage = pageRange.start;
  const totalPages = pageRange.count;
  
  for (let i = startPage; i < startPage + totalPages; i++) {
    doc.switchToPage(i);
    const numeroPagina = i - startPage + 1;
    doc.fontSize(tamanosTexto.pequeno)
      .font(fuentes.normal)
      .fillColor(colores.texto)
      .text(
        `Página ${numeroPagina} de ${totalPages} | DiamondSistem - Informativo de Eventos`,
        50,
        doc.page.height - 30,
        { align: 'center', width: layout.anchoUtil }
      );
  }

  return doc;
}

module.exports = {
  generarPDFAjustesEvento
};
