# Corrección: Cálculo de Mini Dulces

## 🐛 Problema Identificado

El servicio **"Mini Dulces"** no se calculaba correctamente. Debía calcularse igual que **"Pasapalos"**, es decir: **precio × cantidad de invitados**.

## 🔍 Análisis

### Tipos de Cobro en el Sistema

El sistema maneja 3 tipos de cobro para servicios:

1. **`fijo`**: Se multiplica solo por la cantidad ingresada
   - Ejemplo: Hora Extra ($800 × 2 horas = $1,600)

2. **`por_unidad`**: Se multiplica solo por la cantidad ingresada
   - Mismo comportamiento que `fijo`

3. **`por_persona`**: Se multiplica por la cantidad de invitados Y la cantidad ingresada
   - Ejemplo: Pasapalos ($3 × 100 invitados × 1 = $300)

### Estado Anterior

```
Pasapalos:    tipo_cobro = 'por_persona'  ✅ Correcto
Mini Dulces:  tipo_cobro = 'por_unidad'   ❌ Incorrecto
```

**Resultado**: Mini Dulces no se multiplicaban por la cantidad de invitados.

### Estado Actual

```
Pasapalos:    tipo_cobro = 'por_persona'  ✅
Mini Dulces:  tipo_cobro = 'por_persona'  ✅
```

**Resultado**: Ambos se calculan igual: precio × invitados × cantidad.

## ✅ Solución Aplicada

Se actualizó el campo `tipo_cobro` del servicio "Mini Dulces" de `'por_unidad'` a `'por_persona'`.

```sql
UPDATE servicios 
SET tipo_cobro = 'por_persona'
WHERE nombre = 'Mini Dulces';
```

## 📊 Ejemplo de Cálculo

### Antes (Incorrecto)
- Precio: $3
- Cantidad: 1
- Invitados: 100
- **Total**: $3 × 1 = **$3** ❌

### Después (Correcto)
- Precio: $3
- Cantidad: 1
- Invitados: 100
- **Total**: $3 × 100 × 1 = **$300** ✅

## 🔧 Archivo Creado

- **`fix_mini_dulces_tipo_cobro.sql`**: Script SQL que aplica la corrección

## 📝 Código de Referencia

La lógica de cálculo se encuentra en:
- **Archivo**: `backend/src/utils/priceCalculator.js`
- **Función**: `calcularPrecioServicio()` (líneas 44-68)

```javascript
switch (servicio.tipo_cobro) {
  case 'fijo':
    subtotal = precioUnitario * cantidad;
    break;
  case 'por_persona':
    subtotal = precioUnitario * cantidadPersonas * cantidad;
    break;
  case 'por_unidad':
    subtotal = precioUnitario * cantidad;
    break;
}
```

## 🧪 Verificación

Para verificar el cambio:
1. Crea o edita una oferta
2. Agrega el servicio "Mini Dulces"
3. Verifica que el precio se multiplique por la cantidad de invitados
4. Ejemplo: 100 invitados × $3 = $300

## ⚠️ Nota Importante

Este cambio afecta **todas las ofertas nuevas** creadas a partir de ahora. Las ofertas existentes mantienen su precio calculado originalmente.

---

**Fecha de corrección**: Noviembre 4, 2025  
**Estado**: ✅ Completado y verificado

