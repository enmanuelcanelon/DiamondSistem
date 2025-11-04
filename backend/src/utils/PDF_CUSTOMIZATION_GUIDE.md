# Guía de Personalización de PDFs

## 📋 Visión General

Los archivos `pdfFactura.js` (ofertas) y `pdfContrato.js` (contratos) están estructurados para facilitar la personalización visual sin modificar la lógica de generación de datos.

## 🎨 Configuración Visual (CONFIG_VISUAL)

En ambos archivos encontrarás un objeto `CONFIG_VISUAL` al inicio que centraliza TODA la configuración visual:

### 1. Colores

```javascript
colores: {
  primario: '#1E40AF',        // Color principal del diseño (encabezados, títulos)
  secundario: '#475569',      // Color secundario/subtítulos
  texto: '#0F172A',           // Color del texto principal
  textoClaro: '#FFFFFF',      // Texto sobre fondos oscuros
  exito: '#059669',           // Para estados positivos
  advertencia: '#D97706',     // Para alertas/pendientes
  error: '#DC2626',           // Para errores/cancelaciones
  fondoClaro: '#F8FAFC',      // Fondo de cajas/secciones
  fondoOscuro: '#1E40AF',     // Fondo del encabezado
  borde: '#CBD5E1',           // Líneas y bordes
}
```

**Cómo cambiar**: Simplemente reemplaza los códigos hexadecimales (#RRGGBB) por los colores de tu diseño.

### 2. Fuentes

```javascript
fuentes: {
  normal: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
}
```

**Opciones disponibles en PDFKit**:
- Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique
- Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic
- Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique

### 3. Tamaños de Texto

```javascript
tamanosTexto: {
  titulo: 28,                 // Título principal (ej: "DIAMONDSISTEM")
  subtituloGrande: 22,        // Subtítulo de documento (ej: "PROPUESTA COMERCIAL")
  seccion: 14,                // Títulos de secciones (ej: "INFORMACIÓN DEL EVENTO")
  subseccion: 12,             // Subtítulos de secciones
  normal: 10,                 // Texto normal
  pequeno: 9,                 // Texto pequeño
  muyPequeno: 8,              // Pie de página, notas
}
```

**Cómo ajustar**: Cambia los números (en puntos) según tus preferencias.

### 4. Layout y Espaciado

```javascript
layout: {
  margenSuperior: 50,
  margenInferior: 50,
  margenIzquierdo: 50,
  margenDerecho: 50,
  anchoUtil: 512,             // 612 - 50 - 50 = 512 (ancho de página - márgenes)
  alturaEncabezado: 100,      // Altura del encabezado principal
  alturaPiePagina: 70,
  espaciadoSeccion: 1.5,      // Espaciado entre secciones (moveDown)
  espaciadoParrafo: 0.5,
  bordeRedondeado: 6,         // Radio de los bordes redondeados
}
```

### 5. Alturas de Elementos

```javascript
alturas: {
  filaTabla: 20,              // Altura de cada fila en tablas
  encabezadoTabla: 24,        // Altura del encabezado de tablas
  cajaInfo: 100,              // Altura de la caja de información
  cajaEvento: 90,             // Altura de la caja de datos del evento
}
```

## 🔧 Funciones Auxiliares Reutilizables

Todas las funciones auxiliares reciben el objeto `config` (CONFIG_VISUAL) como parámetro, lo que permite ajustar el diseño sin modificar cada función individualmente.

### Principales Funciones:

1. **dibujarEncabezado(doc, config)**: Dibuja el encabezado principal con logo y datos de contacto
2. **dibujarTituloDocumento(doc, titulo, subtitulo, config)**: Dibuja el título del documento
3. **dibujarCajaInfo(doc, x, y, ancho, alto, config, colorFondo)**: Dibuja cajas con información
4. **dibujarFilaEtiquetaValor(doc, x, y, etiqueta, valor, config)**: Dibuja una fila con etiqueta y valor
5. **dibujarEncabezadoTabla(doc, y, columnas, config)**: Dibuja el encabezado de una tabla
6. **dibujarFilaTabla(doc, y, columnas, indice, config)**: Dibuja una fila de tabla con alternancia de colores
7. **dibujarPiePagina(doc, config)**: Dibuja el pie de página
8. **dibujarTituloSeccion(doc, titulo, config)**: Dibuja un título de sección

## 🚀 Cómo Aplicar un Nuevo Diseño

### Opción 1: Cambiar Solo Colores y Fuentes (Rápido)

1. Abre `backend/src/utils/pdfFactura.js` y `backend/src/utils/pdfContrato.js`
2. Localiza el objeto `CONFIG_VISUAL` al inicio de cada archivo
3. Modifica únicamente la sección `colores`, `fuentes` y `tamanosTexto`
4. Guarda y reinicia el servidor backend

**Ejemplo**: Cambiar a un diseño verde corporativo:

```javascript
colores: {
  primario: '#047857',        // Verde oscuro
  secundario: '#374151',      // Gris oscuro
  texto: '#111827',           // Negro
  textoClaro: '#FFFFFF',      // Blanco
  exito: '#059669',           // Verde éxito
  advertencia: '#F59E0B',     // Naranja
  error: '#DC2626',           // Rojo
  fondoClaro: '#F0FDF4',      // Verde muy claro
  fondoOscuro: '#047857',     // Verde oscuro (encabezado)
  borde: '#D1D5DB',           // Gris claro
}
```

### Opción 2: Modificar Estructura (Avanzado)

Si quieres cambiar la estructura (ej: mover secciones, agregar logos, cambiar tablas):

1. Identifica la sección en la "Función Principal de Generación"
2. Las secciones están claramente marcadas con comentarios:
   ```javascript
   // ============================================
   // SECCIÓN 1: ENCABEZADO PRINCIPAL
   // ============================================
   ```
3. Modifica o reordena las secciones según necesites
4. Las funciones auxiliares te permiten reutilizar elementos comunes

## 📝 Ejemplo Práctico: Agregar un Logo

Para agregar un logo en el encabezado:

1. **Guarda tu logo** en `backend/src/assets/logo.png`
2. **Modifica la función `dibujarEncabezado`** (o `dibujarEncabezadoPrincipal`):

```javascript
function dibujarEncabezado(doc, config) {
  const { colores, tamanosTexto, fuentes, layout } = config;
  const { alturaEncabezado } = layout;

  // Fondo del encabezado
  doc.rect(0, 0, 612, alturaEncabezado)
    .fillAndStroke(colores.fondoOscuro, colores.fondoOscuro);

  // AGREGAR LOGO AQUÍ
  doc.image('backend/src/assets/logo.png', 50, 25, { width: 80 });

  // Título principal (ajustar posición Y si es necesario)
  doc.fontSize(tamanosTexto.titulo)
    .fillColor(colores.textoClaro)
    .font(fuentes.bold)
    .text('DIAMONDSISTEM', { align: 'center', y: 25 });

  // ... resto del código
}
```

## 🎯 Secciones del PDF

### pdfFactura.js (Ofertas):

1. Encabezado Principal
2. Título del Documento
3. Información del Documento y Cliente
4. Información del Evento
5. Paquete Seleccionado
6. Servicios Incluidos
7. Servicios Adicionales
8. Resumen Financiero
9. Condiciones Comerciales
10. Nota Importante
11. Pie de Página

### pdfContrato.js (Contratos):

1. Portada con Encabezado Principal
2. Título del Documento
3. Información del Contrato
4. Resumen del Evento
5. Resumen Financiero
6. Paquete Contratado (Página 2)
7. Servicios Incluidos
8. Servicios Adicionales
9. Plan de Pagos (Página 3)
10. Historial de Pagos
11. Términos y Condiciones (Páginas 4+)
12. Firmas y Aceptación
13. Pie de Página

## ⚙️ Reiniciar el Servidor

Después de modificar cualquier archivo PDF:

```bash
cd backend
npm run dev
```

O si ya está corriendo, detén con `Ctrl+C` y reinicia.

## 🐛 Solución de Problemas

**Problema**: El texto se corta o no aparece
- **Solución**: Ajusta `tamanosTexto` o los valores `width` en las llamadas a `doc.text()`

**Problema**: Las cajas se superponen
- **Solución**: Ajusta las alturas en `CONFIG_VISUAL.alturas` o agrega `doc.moveDown()` entre secciones

**Problema**: Los colores no cambian
- **Solución**: Verifica que reiniciaste el servidor backend después de guardar los cambios

**Problema**: Error al generar PDF
- **Solución**: Revisa la consola del servidor para ver el error específico. Generalmente es por sintaxis JavaScript incorrecta.

## 📞 Contacto y Soporte

Si tienes un diseño específico que quieres aplicar:
1. Proporciona una imagen de referencia o mockup
2. Especifica colores exactos (códigos hex)
3. Indica qué secciones deben cambiar o agregarse

---

**Última actualización**: Noviembre 2025

