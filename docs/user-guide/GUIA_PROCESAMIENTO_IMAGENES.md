# 📸 Guía de Procesamiento de Imágenes

## Estructura de Carpetas

Las imágenes originales están en:
```
backend/imagenes-originales/
  ├── Cakes/          → Se convierte a: torta
  ├── Bar/            → Se convierte a: bar
  ├── Comida/         → Se convierte a: menu
  └── Decoracion/     → Se convierte a: decoracion
```

## Pasos para Procesar las Imágenes

### 1. Ejecutar el Script de Conversión

```bash
cd backend
node scripts/convertir-imagenes.js
```

Este script:
- ✅ Lee todas las imágenes de `imagenes-originales/`
- ✅ Genera 3 tamaños: thumbnails (300px), medium (800px), large (1200px)
- ✅ Optimiza las imágenes en formato WebP
- ✅ Guarda los resultados en `public/fotos/servicios/`
- ✅ Crea un archivo `imagenes-resultados.json` con la información

### 2. Aplicar Cambios al Schema de Prisma

```bash
cd backend
npx prisma db push
```

Esto actualiza la base de datos para incluir el campo `nombre_archivo`.

### 3. Insertar las Fotos en la Base de Datos

```bash
cd backend
node scripts/insertar-fotos-bd.js
```

Este script:
- ✅ Lee el archivo `imagenes-resultados.json`
- ✅ Inserta todas las fotos en la tabla `fotos_servicios`
- ✅ Genera nombres y descripciones automáticamente
- ✅ Evita duplicados

## Estructura de Salida

Después de la conversión, las imágenes estarán en:

```
backend/public/fotos/servicios/
  ├── torta/
  │   ├── thumbnails/    (300x300px)
  │   ├── medium/        (800x800px)
  │   └── large/         (1200x1200px)
  ├── bar/
  │   ├── thumbnails/
  │   ├── medium/
  │   └── large/
  ├── menu/
  │   ├── thumbnails/
  │   ├── medium/
  │   └── large/
  └── decoracion/
      ├── thumbnails/
      ├── medium/
      └── large/
```

## Uso en el Frontend

Las imágenes se sirven automáticamente desde:
- **Thumbnails**: Para galerías y listas
- **Medium**: Para vistas ampliadas (por defecto)
- **Large**: Para vista completa (opcional)

URLs de ejemplo:
- `/fotos/servicios/torta/medium/cake_blanco_2pisos.webp`
- `/fotos/servicios/bar/thumbnails/bar_vodka.webp`

## Notas Importantes

1. **Formato**: Todas las imágenes se convierten a WebP (mejor compresión)
2. **Calidad**: 85% (balance entre calidad y tamaño)
3. **Aspect Ratio**: Se mantiene el aspect ratio original
4. **Sin Ampliación**: Las imágenes pequeñas no se amplían artificialmente
5. **Móvil**: Los tamaños están optimizados para web y móvil

## Verificación

Después de procesar, verifica:
1. ✅ Las carpetas se crearon correctamente
2. ✅ Las imágenes están en formato WebP
3. ✅ Los 3 tamaños existen para cada imagen
4. ✅ El archivo `imagenes-resultados.json` se generó
5. ✅ Las fotos se insertaron en la base de datos

## Solución de Problemas

### Error: "sharp no está instalado"
```bash
cd backend
npm install sharp --save
```

### Error: "Directorio no encontrado"
Verifica que las carpetas estén en `backend/imagenes-originales/` con los nombres exactos:
- `Cakes` (con C mayúscula)
- `Bar` (con B mayúscula)
- `Comida` (con C mayúscula)
- `Decoracion` (con D mayúscula)

### Error: "Campo nombre_archivo no existe"
Ejecuta:
```bash
cd backend
npx prisma db push
```


## Estructura de Carpetas

Las imágenes originales están en:
```
backend/imagenes-originales/
  ├── Cakes/          → Se convierte a: torta
  ├── Bar/            → Se convierte a: bar
  ├── Comida/         → Se convierte a: menu
  └── Decoracion/     → Se convierte a: decoracion
```

## Pasos para Procesar las Imágenes

### 1. Ejecutar el Script de Conversión

```bash
cd backend
node scripts/convertir-imagenes.js
```

Este script:
- ✅ Lee todas las imágenes de `imagenes-originales/`
- ✅ Genera 3 tamaños: thumbnails (300px), medium (800px), large (1200px)
- ✅ Optimiza las imágenes en formato WebP
- ✅ Guarda los resultados en `public/fotos/servicios/`
- ✅ Crea un archivo `imagenes-resultados.json` con la información

### 2. Aplicar Cambios al Schema de Prisma

```bash
cd backend
npx prisma db push
```

Esto actualiza la base de datos para incluir el campo `nombre_archivo`.

### 3. Insertar las Fotos en la Base de Datos

```bash
cd backend
node scripts/insertar-fotos-bd.js
```

Este script:
- ✅ Lee el archivo `imagenes-resultados.json`
- ✅ Inserta todas las fotos en la tabla `fotos_servicios`
- ✅ Genera nombres y descripciones automáticamente
- ✅ Evita duplicados

## Estructura de Salida

Después de la conversión, las imágenes estarán en:

```
backend/public/fotos/servicios/
  ├── torta/
  │   ├── thumbnails/    (300x300px)
  │   ├── medium/        (800x800px)
  │   └── large/         (1200x1200px)
  ├── bar/
  │   ├── thumbnails/
  │   ├── medium/
  │   └── large/
  ├── menu/
  │   ├── thumbnails/
  │   ├── medium/
  │   └── large/
  └── decoracion/
      ├── thumbnails/
      ├── medium/
      └── large/
```

## Uso en el Frontend

Las imágenes se sirven automáticamente desde:
- **Thumbnails**: Para galerías y listas
- **Medium**: Para vistas ampliadas (por defecto)
- **Large**: Para vista completa (opcional)

URLs de ejemplo:
- `/fotos/servicios/torta/medium/cake_blanco_2pisos.webp`
- `/fotos/servicios/bar/thumbnails/bar_vodka.webp`

## Notas Importantes

1. **Formato**: Todas las imágenes se convierten a WebP (mejor compresión)
2. **Calidad**: 85% (balance entre calidad y tamaño)
3. **Aspect Ratio**: Se mantiene el aspect ratio original
4. **Sin Ampliación**: Las imágenes pequeñas no se amplían artificialmente
5. **Móvil**: Los tamaños están optimizados para web y móvil

## Verificación

Después de procesar, verifica:
1. ✅ Las carpetas se crearon correctamente
2. ✅ Las imágenes están en formato WebP
3. ✅ Los 3 tamaños existen para cada imagen
4. ✅ El archivo `imagenes-resultados.json` se generó
5. ✅ Las fotos se insertaron en la base de datos

## Solución de Problemas

### Error: "sharp no está instalado"
```bash
cd backend
npm install sharp --save
```

### Error: "Directorio no encontrado"
Verifica que las carpetas estén en `backend/imagenes-originales/` con los nombres exactos:
- `Cakes` (con C mayúscula)
- `Bar` (con B mayúscula)
- `Comida` (con C mayúscula)
- `Decoracion` (con D mayúscula)

### Error: "Campo nombre_archivo no existe"
Ejecuta:
```bash
cd backend
npx prisma db push
```


## Estructura de Carpetas

Las imágenes originales están en:
```
backend/imagenes-originales/
  ├── Cakes/          → Se convierte a: torta
  ├── Bar/            → Se convierte a: bar
  ├── Comida/         → Se convierte a: menu
  └── Decoracion/     → Se convierte a: decoracion
```

## Pasos para Procesar las Imágenes

### 1. Ejecutar el Script de Conversión

```bash
cd backend
node scripts/convertir-imagenes.js
```

Este script:
- ✅ Lee todas las imágenes de `imagenes-originales/`
- ✅ Genera 3 tamaños: thumbnails (300px), medium (800px), large (1200px)
- ✅ Optimiza las imágenes en formato WebP
- ✅ Guarda los resultados en `public/fotos/servicios/`
- ✅ Crea un archivo `imagenes-resultados.json` con la información

### 2. Aplicar Cambios al Schema de Prisma

```bash
cd backend
npx prisma db push
```

Esto actualiza la base de datos para incluir el campo `nombre_archivo`.

### 3. Insertar las Fotos en la Base de Datos

```bash
cd backend
node scripts/insertar-fotos-bd.js
```

Este script:
- ✅ Lee el archivo `imagenes-resultados.json`
- ✅ Inserta todas las fotos en la tabla `fotos_servicios`
- ✅ Genera nombres y descripciones automáticamente
- ✅ Evita duplicados

## Estructura de Salida

Después de la conversión, las imágenes estarán en:

```
backend/public/fotos/servicios/
  ├── torta/
  │   ├── thumbnails/    (300x300px)
  │   ├── medium/        (800x800px)
  │   └── large/         (1200x1200px)
  ├── bar/
  │   ├── thumbnails/
  │   ├── medium/
  │   └── large/
  ├── menu/
  │   ├── thumbnails/
  │   ├── medium/
  │   └── large/
  └── decoracion/
      ├── thumbnails/
      ├── medium/
      └── large/
```

## Uso en el Frontend

Las imágenes se sirven automáticamente desde:
- **Thumbnails**: Para galerías y listas
- **Medium**: Para vistas ampliadas (por defecto)
- **Large**: Para vista completa (opcional)

URLs de ejemplo:
- `/fotos/servicios/torta/medium/cake_blanco_2pisos.webp`
- `/fotos/servicios/bar/thumbnails/bar_vodka.webp`

## Notas Importantes

1. **Formato**: Todas las imágenes se convierten a WebP (mejor compresión)
2. **Calidad**: 85% (balance entre calidad y tamaño)
3. **Aspect Ratio**: Se mantiene el aspect ratio original
4. **Sin Ampliación**: Las imágenes pequeñas no se amplían artificialmente
5. **Móvil**: Los tamaños están optimizados para web y móvil

## Verificación

Después de procesar, verifica:
1. ✅ Las carpetas se crearon correctamente
2. ✅ Las imágenes están en formato WebP
3. ✅ Los 3 tamaños existen para cada imagen
4. ✅ El archivo `imagenes-resultados.json` se generó
5. ✅ Las fotos se insertaron en la base de datos

## Solución de Problemas

### Error: "sharp no está instalado"
```bash
cd backend
npm install sharp --save
```

### Error: "Directorio no encontrado"
Verifica que las carpetas estén en `backend/imagenes-originales/` con los nombres exactos:
- `Cakes` (con C mayúscula)
- `Bar` (con B mayúscula)
- `Comida` (con C mayúscula)
- `Decoracion` (con D mayúscula)

### Error: "Campo nombre_archivo no existe"
Ejecuta:
```bash
cd backend
npx prisma db push
```













