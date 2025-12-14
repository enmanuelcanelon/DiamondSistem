# PROMPT PARA CLAUDE CODE - Bug de Horas en Disponibilidad de Salones

## Problema

Los eventos creados desde "crear oferta" (contratos y ofertas) están bloqueando horas incorrectas en la disponibilidad de salones. Específicamente:

1. **Evento creado**: "18:00" (6 PM hora de Miami)
2. **Se guarda en BD**: `1970-01-01T18:00:00Z` (18:00 UTC)
3. **Se bloquea incorrectamente**: 23:00 (11 PM) en lugar de 18:00 (6 PM)

El problema es que cuando el usuario ingresa "18:00" (hora local de Miami), se está guardando como `18:00 UTC` en lugar de convertirla a UTC correctamente.

## Análisis del Código Actual

### Cómo se guardan las horas (ofertas.routes.js línea 557):
```javascript
hora_inicio: new Date(`1970-01-01T${datos.hora_inicio || '18:00'}:00Z`)
```

**Problema**: El `Z` al final indica UTC, pero `datos.hora_inicio` viene como "18:00" (hora local de Miami), no como UTC.

### Cómo se leen las horas (salones.routes.js línea 534):
```javascript
if (hora.getUTCFullYear() === 1970 && hora.getUTCMonth() === 0 && hora.getUTCDate() === 1) {
  const horas = hora.getUTCHours();
  const minutos = hora.getUTCMinutes();
  horaStr = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}
```

**Problema**: `getUTCHours()` devuelve la hora en UTC, pero la hora guardada ya está en UTC (incorrectamente), causando un desfase.

## Solución Requerida

### Opción 1: Guardar sin Z (recomendado)
Cambiar cómo se guardan las horas para que NO se interpreten como UTC:

```javascript
// En ofertas.routes.js línea 557
hora_inicio: new Date(`1970-01-01T${datos.hora_inicio || '18:00'}:00`)
// Sin la Z al final - se interpretará como hora local del servidor
```

Y luego leer usando `getHours()` en lugar de `getUTCHours()`:

```javascript
// En salones.routes.js línea 534
const horas = hora.getHours(); // Hora local en lugar de UTC
const minutos = hora.getMinutes(); // Minutos locales en lugar de UTC
```

### Opción 2: Convertir correctamente a UTC al guardar
Si se quiere mantener UTC, convertir la hora local de Miami a UTC:

```javascript
// En ofertas.routes.js línea 557
const horaLocal = datos.hora_inicio || '18:00';
const [h, m] = horaLocal.split(':').map(Number);
// Crear fecha en hora local de Miami y convertir a UTC
const fechaLocal = new Date(`1970-01-01T${horaLocal}:00-05:00`); // UTC-5 para Miami
hora_inicio: fechaLocal // Se guardará como UTC correctamente
```

## Archivos a Modificar

1. **backend/src/routes/ofertas.routes.js** (líneas 557-558 y 808-809):
   - Cambiar cómo se guardan `hora_inicio` y `hora_fin`

2. **backend/src/routes/contratos.routes.js** (línea 634-635):
   - Verificar cómo se copian las horas desde la oferta al contrato

3. **backend/src/routes/salones.routes.js** (líneas 223-224, 534-535):
   - Cambiar `getUTCHours()` y `getUTCMinutes()` a `getHours()` y `getMinutes()` para campos Time de Prisma

## Consideraciones

- Los campos Time de Prisma se guardan como `DateTime @db.Time(6)` en PostgreSQL
- PostgreSQL almacena TIME sin zona horaria, pero Prisma los devuelve como Date con fecha 1970-01-01
- El servidor puede estar en cualquier zona horaria, pero las horas deben interpretarse como hora local de Miami
- Los eventos de Google Calendar ya están funcionando correctamente (usan `Intl.DateTimeFormat` con `America/New_York`)

## Testing

Después de los cambios, verificar:
1. Crear una oferta con hora "18:00" (6 PM)
2. Verificar que se bloquea 18:00 (6 PM) y no 23:00 (11 PM)
3. Verificar que funciona para todos los salones (Kendall, Doral, Diamond)
4. Verificar que los eventos de Google Calendar siguen funcionando correctamente

