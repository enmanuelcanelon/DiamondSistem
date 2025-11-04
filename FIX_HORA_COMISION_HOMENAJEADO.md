# 🔧 Fix: Hora en Contratos, Comisión y Homenajeado

## 📋 Problemas Corregidos

1. ✅ **Hora en preview de contratos mostraba "1970- - 1970- (NaNh)"**
2. ✅ **Comisión del vendedor cambiada de 10% a 3%**
3. ⚠️ **Homenajeado no aparece** (investigación y solución)

---

## 1️⃣ Hora en Preview de Contratos - CORREGIDO ✅

### **Problema:**
En el preview de contratos aparecía:
```
📅 15 de diciembre de 2025
🕐 1970- - 1970- (NaNh)  ❌
👥 100 invitados
```

### **Causa:**
El código usaba `.slice(0, 5)` directamente sobre `contrato.hora_inicio` sin validar el formato. Si la hora venía como objeto Date o en formato ISO completo, fallaba.

### **Solución:**

**Archivo:** `frontend/src/pages/Contratos.jsx`

**Cambios:**
1. Importado `formatearHora` de `utils/formatters`
2. Reemplazado `.slice(0, 5)` por `formatearHora()`

**Antes:**
```javascript
// Sin import
{contrato.hora_inicio.slice(0, 5)} - {contrato.hora_fin.slice(0, 5)}
```

**Después:**
```javascript
// Import agregado
import { formatearHora } from '../utils/formatters';

// Uso correcto
{formatearHora(contrato.hora_inicio)} - {formatearHora(contrato.hora_fin)}
```

**Resultado:**
```
📅 15 de diciembre de 2025
🕐 7:00 PM - 1:00 AM (6.0h)  ✅
👥 100 invitados
📍 Kendall
```

---

## 2️⃣ Comisión del Vendedor: 10% → 3% - CORREGIDO ✅

### **Cambios Realizados:**

#### A. Backend - Registro de Nuevos Vendedores

**Archivo:** `backend/src/routes/auth.routes.js`

**Línea 184:**
```javascript
// Antes:
comision_porcentaje: comision_porcentaje || 10.00,

// Después:
comision_porcentaje: comision_porcentaje || 3.00,
```

**Resultado:** Nuevos vendedores se crean con comisión del 3% por defecto.

---

#### B. Backend - Cálculo de Comisión

**Archivo:** `backend/src/utils/priceCalculator.js`

**Línea 312:**
```javascript
// Antes:
const calcularComisionVendedor = (totalContrato, porcentajeComision = 10) => {

// Después:
const calcularComisionVendedor = (totalContrato, porcentajeComision = 3) => {
```

**Resultado:** El cálculo usa 3% por defecto cuando no se especifica otro valor.

---

#### C. Actualizar Vendedores Existentes

**Script SQL:** `database/fix_comision_y_homenajeado.sql`

```sql
-- Actualizar todos los vendedores que tengan 10% a 3%
UPDATE vendedores
SET comision_porcentaje = 3.00
WHERE comision_porcentaje = 10.00;

-- Verificar cambio
SELECT id, nombre_completo, comision_porcentaje 
FROM vendedores;
```

**Instrucciones:**
```bash
# Conectar a la base de datos
psql -U postgres -d diamond_sistem

# Ejecutar script
\i database/fix_comision_y_homenajeado.sql
```

---

### **Ejemplo de Cálculo:**

| Concepto | Antes (10%) | Después (3%) |
|----------|-------------|--------------|
| Total Contrato | $10,000 | $10,000 |
| Comisión Vendedor | $1,000 | $300 |
| Diferencia | - | **-$700** |

---

## 3️⃣ Homenajeado No Aparece - INVESTIGACIÓN ⚠️

### **Estado del Código Frontend:**
✅ **El código está CORRECTO** en ambos archivos:

**Ofertas.jsx (líneas 285-289):**
```jsx
{oferta.homenajeado && (
  <p className="text-gray-600 mb-3 text-sm">
    🎉 Homenajeado/a: <span className="font-medium text-purple-600">{oferta.homenajeado}</span>
  </p>
)}
```

**Contratos.jsx (líneas 283-287):**
```jsx
{contrato.homenajeado && (
  <p className="text-gray-600 mb-3 ml-11 text-sm">
    🎉 Homenajeado/a: <span className="font-medium text-purple-600">{contrato.homenajeado}</span>
  </p>
)}
```

---

### **Posibles Causas:**

#### 1. La migración no se aplicó
**Verificar:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ofertas' AND column_name = 'homenajeado';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'contratos' AND column_name = 'homenajeado';
```

**Si no existe, aplicar:**
```bash
psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql
```

---

#### 2. Las ofertas/contratos no tienen datos en el campo
**Verificar:**
```sql
-- Ver ofertas con homenajeado
SELECT id, codigo_oferta, homenajeado, lugar_evento
FROM ofertas
WHERE homenajeado IS NOT NULL;

-- Ver contratos con homenajeado
SELECT id, codigo_contrato, homenajeado, lugar_salon
FROM contratos
WHERE homenajeado IS NOT NULL;
```

**Si está vacío:**
- Crear una oferta NUEVA con el campo homenajeado lleno
- Las ofertas antiguas no tienen ese dato porque se crearon antes de la migración

---

#### 3. Backend no retorna el campo
**Verificar en consola del navegador:**
```javascript
// En la consola del navegador, ver la data de una oferta:
console.log(ofertas[0].homenajeado);
```

**Si es `undefined`:**
- El backend no está incluyendo el campo en la query
- Verificar que Prisma esté actualizado: `npx prisma generate`
- Reiniciar backend: `npm run dev`

---

### **Solución Definitiva:**

**Pasos para verificar:**

1. **Ejecutar SQL de verificación:**
```bash
psql -U postgres -d diamond_sistem -f database/fix_comision_y_homenajeado.sql
```

2. **Si el campo no existe, aplicar migración:**
```bash
psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql
```

3. **Actualizar Prisma:**
```bash
cd backend
npx prisma generate
```

4. **Reiniciar backend:**
```bash
npm run dev
```

5. **Crear una oferta NUEVA con homenajeado:**
- Llenar el campo "Homenajeado/a" (ej: "Lucía González")
- Guardar oferta
- Ver preview

6. **Verificar en preview:**
- ✅ Debe aparecer: `🎉 Homenajeado/a: Lucía González`

---

## 📊 Resumen de Cambios

| Problema | Archivo | Línea | Cambio | Estado |
|----------|---------|-------|--------|--------|
| Hora en contratos | `Contratos.jsx` | 7, 302 | Import + `formatearHora()` | ✅ Corregido |
| Comisión registro | `auth.routes.js` | 184 | `10.00` → `3.00` | ✅ Corregido |
| Comisión cálculo | `priceCalculator.js` | 312 | `10` → `3` | ✅ Corregido |
| Comisión existentes | SQL | - | UPDATE vendedores | ⚠️ Ejecutar SQL |
| Homenajeado | Frontend | - | Código correcto | ⚠️ Verificar DB |

---

## 🧪 Testing

### **Test 1: Hora en Contratos**
1. Ir a lista de contratos
2. **Verificar:** Muestra `7:00 PM - 1:00 AM (6.0h)` ✅
3. **Verificar:** NO muestra `1970- - 1970- (NaNh)` ✅

### **Test 2: Comisión 3%**
1. Crear contrato de $10,000
2. Verificar en DB:
```sql
SELECT codigo_contrato, total_contrato, comision_calculada 
FROM contratos 
WHERE id = X;
```
3. **Verificar:** `comision_calculada = 300.00` (3% de 10,000) ✅

### **Test 3: Homenajeado**
1. Crear oferta NUEVA con homenajeado: "Lucía González"
2. Ver lista de ofertas
3. **Verificar:** Aparece `🎉 Homenajeado/a: Lucía González` ✅

---

## 📁 Archivos Modificados

1. ✅ `frontend/src/pages/Contratos.jsx`
   - Línea 7: Import `formatearHora`
   - Línea 302: Uso de `formatearHora()`

2. ✅ `backend/src/routes/auth.routes.js`
   - Línea 184: Comisión por defecto `3.00`

3. ✅ `backend/src/utils/priceCalculator.js`
   - Línea 312: Comisión por defecto `3`

4. ✅ `database/fix_comision_y_homenajeado.sql`
   - Script de verificación y actualización

---

## ⚠️ IMPORTANTE: Ejecutar SQL

**Después de aplicar estos cambios, DEBES ejecutar:**

```bash
# 1. Actualizar comisión de vendedores existentes
psql -U postgres -d diamond_sistem -f database/fix_comision_y_homenajeado.sql

# 2. Verificar migración de homenajeado (si no se aplicó antes)
psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql

# 3. Actualizar Prisma
cd backend
npx prisma generate

# 4. Reiniciar backend
npm run dev
```

---

**Última actualización:** Noviembre 2025  
**Estado:** ✅ Corregido (Hora + Comisión) | ⚠️ Verificar DB (Homenajeado)  
**Versión:** 1.0

