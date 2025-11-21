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
  const fechaEvento = contrato?.fecha_evento 
    ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const tipoEvento = contrato?.clientes?.tipo_evento || '';
  const homenajeado = contrato?.homenajeado || ajustes?.invitado_honor || '';
  const cantidadInvitados = contrato?.cantidad_invitados || 0;
  const cantidadAdultos = cantidadInvitados - (ajustes?.cantidad_teenagers || 0);
  const cantidadTeens = ajustes?.cantidad_teenagers || 0;
  const contacto = contrato?.clientes?.telefono || contrato?.clientes?.email || '';
  const salon = contrato?.salones?.nombre || contrato?.lugar_salon || '';
  const horaInicio = contrato?.hora_inicio 
    ? new Date(`2000-01-01T${contrato.hora_inicio}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';
  const horaFin = contrato?.hora_fin 
    ? new Date(`2000-01-01T${contrato.hora_fin}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';
  const vendedor = contrato?.vendedores?.nombre_completo || '';
  const tematica = ajustes?.tematica || '';
  const colorVestido = ajustes?.vestido_nina || '';

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
  agregarCampo('FINAL REALIZADO POR:', '');
  agregarCampo('TEMATICA:', tematica);
  agregarCampo('COLOR DEL VESTIDO:', colorVestido);

  // ============================================
  // 2. PAQUETE
  // ============================================
  agregarSeccion('2. PAQUETE');
  
  agregarCampo('PANTALLA:', serviciosMapeados.pantalla ? '✓' : '');
  agregarCampo('DJ:', serviciosMapeados.dj ? '✓' : '');
  agregarCampo('COLORES:', serviciosMapeados.colores ? '✓' : '');
  agregarCampo('STAGE:', serviciosMapeados.stage ? '✓' : '');
  agregarCampo('RUNNERS:', serviciosMapeados.runners ? (ajustes?.runner_tipo || '✓') : '');
  agregarCampo('CHARGERS:', serviciosMapeados.chargers ? '✓' : '');
  
  let servilletasTexto = '';
  if (serviciosMapeados.servilletas && ajustes?.servilletas && Array.isArray(ajustes.servilletas) && ajustes.servilletas.length > 0) {
    servilletasTexto = ajustes.servilletas.map(s => s.color).join(', ');
  } else if (serviciosMapeados.servilletas) {
    servilletasTexto = '✓';
  }
  agregarCampo('SERVILLETAS:', servilletasTexto);
  
  agregarCampo('CENTRO DE MESA:', serviciosMapeados.centro_mesa ? (ajustes?.centro_mesa_1 || '✓') : '');
  agregarCampo('MESA DE REGALOS:', serviciosMapeados.mesa_regalos ? '✓' : '');
  
  let limosinaTexto = '';
  if (serviciosMapeados.limosina) {
    if (ajustes?.hora_limosina) {
      const hora = typeof ajustes.hora_limosina === 'string' 
        ? ajustes.hora_limosina 
        : new Date(`2000-01-01T${ajustes.hora_limosina}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      limosinaTexto = hora;
    } else {
      limosinaTexto = '✓';
    }
  }
  agregarCampo('LIMOSINA:', limosinaTexto);
  
  agregarCampo('PHOTOBOOTH:', serviciosMapeados.photobooth ? (contrato?.photobooth_tipo || '✓') : '');
  agregarCampo('HORA LOCA:', serviciosMapeados.hora_loca ? '✓' : '');
  agregarCampo('MAPPING:', serviciosMapeados.mapping ? '✓' : '');
  agregarCampo('HUMO:', serviciosMapeados.humo ? '✓' : '');
  agregarCampo('CHISPAS:', serviciosMapeados.chispas ? '✓' : '');
  agregarCampo('MAESTRO DE CEREMONIA:', serviciosMapeados.maestro_ceremonia ? '✓' : '');
  agregarCampo('FOTOS Y VIDEO:', serviciosMapeados.fotos_video ? '✓' : '');

  // ============================================
  // 3. CATERING
  // ============================================
  agregarSeccion('3. CATERING');
  
  const disenoTorta = ajustes?.diseno_torta || ajustes?.diseno_otro || '';
  const saborTorta = ajustes?.sabor_torta || ajustes?.sabor_otro || '';
  const pisosTorta = ajustes?.pisos_torta ? `${ajustes.pisos_torta} pisos` : '';
  const tortaTexto = [disenoTorta, saborTorta, pisosTorta].filter(Boolean).join(' - ') || '';
  
  agregarCampo('CAKE:', tortaTexto);
  agregarCampo('MESA DE MINIPOSTRES:', '');
  agregarCampo('APPETIZERS:', '');
  agregarCampo('MESA DE QUESOS:', '');
  agregarCampo('CATERING:', '');
  agregarCampo('  ENSALADA:', ajustes?.entrada || '');
  agregarCampo('  PROTEINA:', ajustes?.plato_principal || '');
  agregarCampo('  SIDE:', ajustes?.acompanamientos || ajustes?.acompanamiento_seleccionado || '');
  agregarCampo('  SIDE:', '');
  agregarCampo('  PAN Y MANTEQUILLA:', '✓');

  // ============================================
  // 4. BAR
  // ============================================
  agregarSeccion('4. BAR');
  
  agregarCampo('LICORES:', ajustes?.bebidas_incluidas || '');
  agregarCampo('VINOS:', '');
  agregarCampo('COCKTELES SIN ALCOHOL:', '');
  agregarCampo('SODAS, AGUA Y JUGOS:', '✓');
  agregarCampo('CHAMPAÑA:', '');
  agregarCampo('SIDRA:', '');
  agregarCampo('OBSERVACIONES BAR:', ajustes?.notas_menu || '');

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
      agregarCampo('Cambio de Zapatilla:', protocolo.cambio_zapatilla ? 'Sí' : 'No');
      agregarCampo('Baile con Papá:', protocolo.baile_papa ? 'Sí' : 'No');
      agregarCampo('Baile con Mamá:', protocolo.baile_mama ? 'Sí' : 'No');
      agregarCampo('Ceremonia de Velas:', protocolo.ceremonia_velas ? 'Sí' : 'No');
      agregarCampo('Brindis:', protocolo.brindis ? 'Sí' : 'No');
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
