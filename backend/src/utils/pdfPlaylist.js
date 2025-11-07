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
    favorita: '#DC2626',
    prohibida: '#6B7280',
    sugerida: '#D97706',
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
 * Genera PDF de playlist musical
 */
function generarPDFPlaylist(canciones, contrato, ajustes) {
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
    .text('PLAYLIST MUSICAL', { align: 'center', y: 25 });

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

  // Estadísticas
  const favoritas = canciones.filter(c => c.categoria === 'favorita');
  const prohibidas = canciones.filter(c => c.categoria === 'prohibida');
  const sugeridas = canciones.filter(c => c.categoria === 'sugerida');

  doc.fontSize(tamanosTexto.subtitulo)
    .font(fuentes.bold)
    .fillColor(colores.primario)
    .text('ESTADÍSTICAS', { underline: true })
    .moveDown(0.5);

  doc.fontSize(tamanosTexto.normal)
    .font(fuentes.normal)
    .fillColor(colores.texto)
    .text(`Total de Canciones: ${canciones.length}`, { indent: 20 })
    .text(`⭐ Favoritas: ${favoritas.length}`, { indent: 20 })
    .text(`🚫 Prohibidas: ${prohibidas.length}`, { indent: 20 })
    .text(`💡 Sugeridas: ${sugeridas.length}`, { indent: 20 })
    .moveDown(1);

  // Playlists externas (si existen)
  if (ajustes?.playlist_urls) {
    try {
      const urls = typeof ajustes.playlist_urls === 'string' 
        ? JSON.parse(ajustes.playlist_urls)
        : ajustes.playlist_urls;
      
      if (Array.isArray(urls) && urls.length > 0) {
        doc.fontSize(tamanosTexto.subtitulo)
          .font(fuentes.bold)
          .fillColor(colores.primario)
          .text('PLAYLISTS EXTERNAS', { underline: true })
          .moveDown(0.5);
        
        urls.forEach((url, index) => {
          doc.fontSize(tamanosTexto.normal)
            .font(fuentes.normal)
            .fillColor(colores.texto)
            .text(`${index + 1}. ${url}`, { indent: 20 });
        });
        doc.moveDown(1);
      }
    } catch (e) {
      // Ignorar error de parsing
    }
  }

  // Función para agregar sección de canciones
  const agregarSeccionCanciones = (titulo, listaCanciones, color) => {
    if (listaCanciones.length === 0) return;
    
    if (doc.y > 700) {
      doc.addPage();
      doc.y = 50;
    }

    doc.fontSize(tamanosTexto.subtitulo)
      .font(fuentes.bold)
      .fillColor(color)
      .text(titulo, { underline: true })
      .moveDown(0.5);

    listaCanciones.forEach((cancion, index) => {
      doc.fontSize(tamanosTexto.seccion)
        .font(fuentes.bold)
        .fillColor(colores.texto)
        .text(`${index + 1}. ${cancion.titulo}`, { indent: 20 });
      
      if (cancion.artista) {
        doc.fontSize(tamanosTexto.normal)
          .font(fuentes.italic)
          .fillColor(colores.secundario)
          .text(`   Artista: ${cancion.artista}`, { indent: 20 });
      }
      
      if (cancion.genero) {
        doc.fontSize(tamanosTexto.pequeno)
          .font(fuentes.normal)
          .fillColor(colores.secundario)
          .text(`   Género: ${cancion.genero}`, { indent: 20 });
      }
      
      if (cancion.notas) {
        doc.fontSize(tamanosTexto.pequeno)
          .font(fuentes.italic)
          .fillColor(colores.secundario)
          .text(`   Notas: ${cancion.notas}`, { indent: 20 });
      }
      
      doc.moveDown(0.3);
    });
    
    doc.moveDown(1);
  };

  // FAVORITAS
  agregarSeccionCanciones('⭐ CANCIONES FAVORITAS (Deben Sonar)', favoritas, colores.favorita);

  // PROHIBIDAS
  agregarSeccionCanciones('🚫 CANCIONES PROHIBIDAS (No Deben Sonar)', prohibidas, colores.prohibida);

  // SUGERIDAS
  agregarSeccionCanciones('💡 CANCIONES SUGERIDAS (Opcionales)', sugeridas, colores.sugerida);

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
        `Página ${numeroPagina} de ${totalPages} | DiamondSistem - Playlist Musical`,
        50,
        doc.page.height - 30,
        { align: 'center', width: layout.anchoUtil }
      );
  }

  return doc;
}

module.exports = {
  generarPDFPlaylist
};


