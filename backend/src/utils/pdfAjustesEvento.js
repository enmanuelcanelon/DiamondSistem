const PDFDocument = require('pdfkit');

const CONFIG_VISUAL = {
  colores: {
    primario: '#1E40AF',
    secundario: '#475569',
    texto: '#0F172A',
    textoClaro: '#FFFFFF',
    fondoClaro: '#F8FAFC',
    fondoOscuro: '#1E40AF',
    borde: '#CBD5E1',
  },
  fuentes: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  },
  tamanosTexto: {
    titulo: 24,
    subtitulo: 18,
    seccion: 14,
    normal: 10,
    pequeno: 9,
  },
  layout: {
    margenSuperior: 50,
    margenInferior: 50,
    margenIzquierdo: 50,
    margenDerecho: 50,
    anchoUtil: 512,
  },
};

/**
 * Genera PDF de ajustes del evento
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

  // Encabezado
  doc.rect(0, 0, 612, 80)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  doc.fontSize(tamanosTexto.titulo)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('AJUSTES DEL EVENTO', { align: 'center', y: 25 });

  doc.fontSize(tamanosTexto.normal)
    .font(fuentes.normal)
    .text(`Contrato: ${contrato?.codigo_contrato || 'N/A'}`, { align: 'center' })
    .text(`Cliente: ${contrato?.clientes?.nombre_completo || 'N/A'}`, { align: 'center' })
    .text(`Generado: ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, { align: 'center' });

  doc.y = 100;

  // Función auxiliar para agregar campo
  const agregarCampo = (label, valor) => {
    if (!valor) return;
    doc.fontSize(tamanosTexto.seccion)
      .font(fuentes.bold)
      .fillColor(colores.primario)
      .text(label, { continued: false });
    doc.fontSize(tamanosTexto.normal)
      .font(fuentes.normal)
      .fillColor(colores.texto)
      .text(valor, { indent: 20 })
      .moveDown(0.5);
  };

  // Función auxiliar para agregar sección
  const agregarSeccion = (titulo) => {
    if (doc.y > 700) {
      doc.addPage();
      doc.y = 50;
    }
    doc.moveDown(1);
    doc.fontSize(tamanosTexto.subtitulo)
      .font(fuentes.bold)
      .fillColor(colores.primario)
      .text(titulo, { underline: true })
      .moveDown(0.5);
  };

  // TORTA
  agregarSeccion('🎂 TORTA');
  agregarCampo('Diseño:', ajustes?.diseno_torta || ajustes?.diseno_otro || 'No especificado');
  agregarCampo('Sabor:', ajustes?.sabor_torta || ajustes?.sabor_otro || 'No especificado');
  agregarCampo('Pisos:', ajustes?.pisos_torta ? `${ajustes.pisos_torta} pisos` : 'No especificado');
  agregarCampo('Notas:', ajustes?.notas_torta || 'Sin notas adicionales');

  // DECORACIÓN
  agregarSeccion('✨ DECORACIÓN');
  agregarCampo('Tipo de Decoración:', ajustes?.tipo_decoracion ? (ajustes.tipo_decoracion === 'premium' ? '⭐ Premium' : '📦 Básica') : 'No especificado');
  agregarCampo('Estilo:', ajustes?.estilo_decoracion || ajustes?.estilo_decoracion_otro || 'No especificado');
  agregarCampo('Temática:', ajustes?.tematica || 'No especificado');
  agregarCampo('Colores Principales:', ajustes?.colores_principales || 'No especificado');
  
  if (ajustes?.tipo_decoracion) {
    agregarCampo('Cojines:', ajustes?.cojines_color || 'No especificado');
    agregarCampo('Centro de Mesa:', ajustes?.centro_mesa_1 || 'No especificado');
    agregarCampo('Base:', ajustes?.base_color || 'No especificado');
    agregarCampo('Challer:', ajustes?.challer_color || 'No especificado');
    agregarCampo('Aros:', ajustes?.aros_color || 'No especificado');
    agregarCampo('Runner:', ajustes?.runner_tipo || 'No especificado');
    
    if (ajustes?.servilletas && Array.isArray(ajustes.servilletas) && ajustes.servilletas.length > 0) {
      const servilletasTexto = ajustes.servilletas.map(s => `${s.color}`).join(', ');
      agregarCampo('Servilletas:', servilletasTexto);
    }
  }
  
  agregarCampo('Notas de Decoración:', ajustes?.notas_decoracion || 'Sin notas adicionales');

  // MENÚ
  agregarSeccion('🍽️ MENÚ');
  agregarCampo('Tipo de Servicio:', ajustes?.tipo_servicio || 'No especificado');
  agregarCampo('Entrada:', ajustes?.entrada || 'No especificado');
  agregarCampo('Plato Principal:', ajustes?.plato_principal || 'No especificado');
  agregarCampo('Acompañamientos:', ajustes?.acompanamientos || ajustes?.acompanamiento_seleccionado || 'No especificado');
  agregarCampo('Opciones Vegetarianas:', ajustes?.opciones_vegetarianas || 'No especificado');
  agregarCampo('Opciones Veganas:', ajustes?.opciones_veganas || 'No especificado');
  agregarCampo('Restricciones Alimentarias:', ajustes?.restricciones_alimentarias || 'Sin restricciones');
  agregarCampo('Bebidas Incluidas:', ajustes?.bebidas_incluidas || 'No especificado');
  
  if (ajustes?.hay_teenagers && ajustes?.cantidad_teenagers > 0) {
    agregarCampo('Teenagers/Kids - Cantidad:', ajustes.cantidad_teenagers.toString());
    agregarCampo('Tipo de Comida:', ajustes.teenagers_tipo_comida === 'pasta' ? 'Pasta' : 'Menú');
    if (ajustes.teenagers_tipo_pasta) {
      agregarCampo('Tipo de Pasta:', ajustes.teenagers_tipo_pasta);
    }
  }
  
  agregarCampo('Notas del Menú:', ajustes?.notas_menu || 'Sin notas adicionales');

  // MÚSICA Y ENTRETENIMIENTO
  agregarSeccion('🎵 MÚSICA Y ENTRETENIMIENTO');
  agregarCampo('Música Ceremonial:', ajustes?.musica_ceremonial || 'No especificado');
  agregarCampo('Primer Baile:', ajustes?.primer_baile || 'No especificado');
  agregarCampo('Baile Padre-Hija:', ajustes?.baile_padre_hija || 'No especificado');
  agregarCampo('Baile Madre-Hijo:', ajustes?.baile_madre_hijo || 'No especificado');
  agregarCampo('Canción Sorpresa:', ajustes?.cancion_sorpresa || 'No especificado');
  
  if (ajustes?.bailes_adicionales) {
    try {
      const bailes = typeof ajustes.bailes_adicionales === 'string' 
        ? JSON.parse(ajustes.bailes_adicionales)
        : ajustes.bailes_adicionales;
      if (Array.isArray(bailes) && bailes.length > 0) {
        doc.fontSize(tamanosTexto.seccion)
          .font(fuentes.bold)
          .fillColor(colores.primario)
          .text('Bailes Adicionales:', { continued: false });
        bailes.forEach((baile, index) => {
          doc.fontSize(tamanosTexto.normal)
            .font(fuentes.normal)
            .fillColor(colores.texto)
            .text(`${index + 1}. ${baile.nombre || 'Sin nombre'}${baile.con_quien ? ` - Con: ${baile.con_quien}` : ''}`, { indent: 20 });
        });
        doc.moveDown(0.5);
      }
    } catch (e) {
      // Ignorar error de parsing
    }
  }
  
  agregarCampo('Notas de Entretenimiento:', ajustes?.notas_entretenimiento || 'Sin notas adicionales');

  // BAR
  agregarSeccion('🍷 BAR Y BEBIDAS');
  agregarCampo('Bebidas Incluidas:', ajustes?.bebidas_incluidas || 'Ver contrato para detalles completos');

  // OTROS
  agregarSeccion('📋 OTROS DETALLES');
  if (ajustes?.hora_limosina) {
    const hora = typeof ajustes.hora_limosina === 'string' 
      ? ajustes.hora_limosina 
      : new Date(ajustes.hora_limosina).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    agregarCampo('Hora de Limosina:', hora);
  }
  agregarCampo('Vestido de la Niña:', ajustes?.vestido_nina || 'No especificado');
  agregarCampo('Observaciones Adicionales:', ajustes?.observaciones_adicionales || 'Sin observaciones');
  agregarCampo('Items Especiales:', ajustes?.items_especiales || 'No especificado');
  agregarCampo('Sorpresas Planeadas:', ajustes?.sorpresas_planeadas || 'No especificado');

  // PROTOCOLO (si existe)
  if (ajustes?.protocolo) {
    try {
      const protocolo = typeof ajustes.protocolo === 'string' 
        ? JSON.parse(ajustes.protocolo)
        : ajustes.protocolo;
      
      agregarSeccion('⏰ PROTOCOLO DEL EVENTO');
      agregarCampo('Hora de Apertura:', protocolo.hora_apertura || 'No especificado');
      agregarCampo('Anuncio de Padres:', protocolo.hora_anuncio_padres || 'No especificado');
      if (protocolo.nombres_padres) {
        agregarCampo('Nombres de Padres:', protocolo.nombres_padres);
      }
      agregarCampo('Anuncio del Homenajeado:', protocolo.hora_anuncio_homenajeado || 'No especificado');
      if (protocolo.nombre_homenajeado) {
        agregarCampo('Nombre del Homenajeado:', protocolo.nombre_homenajeado);
      }
      agregarCampo('Cambio de Zapatilla:', protocolo.cambio_zapatilla ? 'Sí' : 'No');
      agregarCampo('Baile con Papá:', protocolo.baile_papa ? 'Sí' : 'No');
      agregarCampo('Baile con Mamá:', protocolo.baile_mama ? 'Sí' : 'No');
      agregarCampo('Ceremonia de Velas:', protocolo.ceremonia_velas ? 'Sí' : 'No');
      agregarCampo('Brindis:', protocolo.brindis ? 'Sí' : 'No');
      agregarCampo('Hora de Cena:', protocolo.hora_cena || 'No especificado');
      agregarCampo('Hora Loca:', protocolo.hora_loca || 'No especificado');
      agregarCampo('Hora de Fin:', protocolo.hora_fin || 'No especificado');
    } catch (e) {
      // Ignorar error de parsing
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
      .fillColor(colores.secundario)
      .text(
        `Página ${numeroPagina} de ${totalPages} | DiamondSistem - Ajustes del Evento`,
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

