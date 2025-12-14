# 🎵 Sistema de Playlist Musical - Instrucciones

## 📋 Resumen

Se ha implementado un sistema completo de playlist musical para cada evento. Este sistema permite:

- ✅ Agregar canciones favoritas (que deben sonar)
- ✅ Marcar canciones prohibidas (que no deben sonar)
- ✅ Sugerir canciones opcionales
- ✅ Organizar por género musical
- ✅ Agregar notas especiales para cada canción
- ✅ Búsqueda y filtros avanzados
- ✅ Estadísticas visuales de la playlist

## 🚀 Pasos para Activar el Sistema

### 1. Detener el Servidor Backend (si está corriendo)

```powershell
# En la terminal del backend, presiona:
Ctrl + C
```

### 2. Ejecutar la Migración de Base de Datos

**Opción A: Desde pgAdmin 4**
1. Abre pgAdmin 4
2. Conéctate a tu servidor PostgreSQL
3. Selecciona la base de datos `diamondsistem`
4. Abre la herramienta Query Tool
5. Copia y pega el contenido del archivo: `database/migration_playlist.sql`
6. Ejecuta el script (F5 o botón Execute)

**Opción B: Desde línea de comandos**
```powershell
# Ajusta la ruta a psql según tu instalación
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d diamondsistem -f database\migration_playlist.sql
```

### 3. Regenerar Cliente de Prisma

```powershell
cd C:\Users\eac\Desktop\DiamondSistem\backend
npx prisma generate
```

### 4. Reiniciar el Servidor Backend

```powershell
# En el directorio backend
npm run dev
```

### 5. Verificar que el Frontend está corriendo

```powershell
cd C:\Users\eac\Desktop\DiamondSistem\frontend
npm run dev
```

## 📱 Cómo Usar la Funcionalidad

### Acceder a la Playlist Musical

1. **Ve a Contratos**: Navega a la página de contratos
2. **Selecciona un Contrato**: Haz clic en "Ver Detalles"
3. **Botón de Playlist**: Verás un botón morado "Playlist Musical"
4. **Haz clic**: Accederás a la interfaz de playlist

### Agregar Canciones

1. Haz clic en el botón **"Agregar Canción"**
2. Completa los campos:
   - **Título** (obligatorio): Nombre de la canción
   - **Artista** (opcional): Intérprete o banda
   - **Género Musical** (opcional): Rock, Pop, Salsa, etc.
   - **Categoría** (obligatorio):
     - ⭐ **Favorita**: Canciones que SÍ deben sonar
     - 🚫 **Prohibida**: Canciones que NO deben sonar
     - 💡 **Sugerida**: Canciones opcionales
   - **Notas adicionales** (opcional): Contexto especial (ej: "Para el primer baile")
3. Haz clic en **"Agregar Canción"**

### Ver Estadísticas

En la parte superior verás 3 tarjetas con:
- 💖 **Canciones Favoritas**: Cantidad de canciones que deben sonar
- 🚫 **Canciones Prohibidas**: Cantidad de canciones vetadas
- 💡 **Canciones Sugeridas**: Cantidad de canciones opcionales

### Buscar y Filtrar

**Búsqueda:**
- Usa la barra de búsqueda para encontrar canciones por:
  - Título
  - Artista
  - Género

**Filtro por Categoría:**
- Usa el dropdown para ver solo:
  - Todas las categorías
  - Favoritas
  - Prohibidas
  - Sugeridas

### Eliminar Canciones

1. Pasa el mouse sobre cualquier canción
2. Aparecerá un botón de **papelera roja**
3. Haz clic para eliminar
4. Confirma la acción

## 🎨 Indicadores Visuales

### Iconos por Categoría

- ❤️ **Corazón rojo relleno**: Canción favorita (debe sonar)
- 🚫 **Círculo con línea**: Canción prohibida (no debe sonar)
- 💡 **Bombilla**: Canción sugerida (opcional)

### Colores de Fondo

- **Rojo claro**: Canciones favoritas
- **Gris claro**: Canciones prohibidas
- **Amarillo claro**: Canciones sugeridas

### Etiquetas (Badges)

- **Género musical**: Badge azul (ej: "Salsa", "Rock")
- **Categoría**: Badge gris (ej: "favorita", "prohibida")

## 🎯 Casos de Uso Comunes

### Primer Baile

```
Título: Perfect
Artista: Ed Sheeran
Género: Pop
Categoría: Favorita
Notas: Para el primer baile de los novios
```

### Canciones Prohibidas

```
Título: La Macarena
Artista: Los del Río
Género: Pop Latino
Categoría: Prohibida
Notas: No queremos esta canción en nuestro evento
```

### Ambiente General

```
Título: Vivir Mi Vida
Artista: Marc Anthony
Género: Salsa
Categoría: Sugerida
Notas: Para animar el ambiente
```

## 🔐 API Endpoints (para referencia)

### Playlist
- `GET /api/playlist/contrato/:contratoId` - Obtener playlist de un contrato
- `GET /api/playlist/:id` - Obtener una canción
- `POST /api/playlist` - Crear canción(es)
- `PUT /api/playlist/:id` - Actualizar canción
- `PATCH /api/playlist/:id/reproducida` - Marcar como reproducida
- `PATCH /api/playlist/contrato/:contratoId/reordenar` - Reordenar canciones
- `DELETE /api/playlist/:id` - Eliminar canción
- `DELETE /api/playlist/contrato/:contratoId` - Eliminar todas las canciones

### Parámetros de Query
- `?categoria=favorita` - Filtrar por categoría

## 🗄️ Estructura de Base de Datos

### Tabla: `playlist_canciones`
```sql
- id (PK)
- contrato_id (FK -> contratos)
- titulo (obligatorio)
- artista (opcional)
- genero (opcional)
- categoria (favorita, prohibida, sugerida)
- notas (opcional)
- orden (para ordenamiento personalizado)
- reproducida (boolean, para marcar durante el evento)
- agregado_por (cliente, vendedor)
- fecha_creacion, fecha_actualizacion
```

## 🎵 Géneros Musicales Disponibles

El sistema incluye los siguientes géneros predefinidos:
- Rock
- Pop
- Reggaeton
- Salsa
- Merengue
- Bachata
- Electrónica
- Hip Hop
- Jazz
- Clásica
- Country
- Otro

## 🎯 Próximos Pasos (Opcionales)

Si deseas ampliar la funcionalidad, puedes:

1. **Integración con Spotify**: Conectar con la API de Spotify para autocompletar datos
2. **Reproducción en Vivo**: Sistema para que el DJ marque canciones como reproducidas
3. **Votación de Invitados**: Permitir que invitados voten por canciones
4. **Orden de Reproducción**: Drag-and-drop para ordenar canciones favoritas
5. **Exportar a PDF**: Generar documento con la playlist completa
6. **Importar desde Archivo**: Subir CSV o TXT con lista de canciones
7. **Duración Total**: Calcular duración estimada de todas las canciones favoritas

## 💡 Tips y Mejores Prácticas

### Para el Cliente

1. **Sé específico**: Incluye artista y notas cuando sea importante
2. **Usa Favoritas con moderación**: Solo para canciones realmente importantes
3. **Marca Prohibidas claramente**: Especifica por qué en las notas
4. **Sugerencias generales**: Usa "Sugerida" para el ambiente general

### Para el Vendedor/DJ

1. **Revisa Favoritas primero**: Son las más importantes para el cliente
2. **Respeta las Prohibidas**: Nunca reproduzcas estas canciones
3. **Usa Sugeridas como backup**: Para llenar momentos del evento
4. **Agrega notas del contexto**: Momento del evento donde debe sonar

## ❓ Solución de Problemas

### No puedo agregar canciones
- Verifica que el backend esté corriendo
- Asegúrate de completar el campo "Título"
- Revisa la consola del navegador (F12) para errores

### No aparecen las canciones
- Verifica que estés viendo el contrato correcto
- Revisa los filtros aplicados
- Limpia la búsqueda si está activa

### Error al eliminar canción
- Asegúrate de confirmar la eliminación
- Verifica que tengas permisos
- Revisa la conexión con el backend

## 📞 Estadísticas Útiles

El sistema te muestra en tiempo real:
- Total de canciones en la playlist
- Cantidad por categoría (Favoritas, Prohibidas, Sugeridas)
- Resultados de búsqueda filtrados
- Canciones visibles después de aplicar filtros

---

**¡Sistema de Playlist Musical listo para rockear tu evento! 🎸🎤🎶**



