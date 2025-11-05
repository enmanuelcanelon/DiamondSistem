# 🔧 Fix: Preview Contratos + Sede Externa Solo Paquete Personalizado

## 📋 Problemas Resueltos

1. ✅ **Añadir salón en preview de contratos** (como en ofertas): "📍 Diamond"
2. ✅ **Verificar que aparezca homenajeado** en preview
3. ✅ **Sede externa solo permite "Paquete Personalizado"**

---

## 1️⃣ Preview de Contratos - Salón Visible

### **Estado Actual:**

**Archivo:** `frontend/src/pages/Contratos.jsx`

**Líneas 330-336:**

```jsx
{(contrato.lugar_salon || contrato.salones?.nombre) && (
  <div className="flex items-center gap-2">
    <span className="text-indigo-600 font-medium">
      📍 {contrato.lugar_salon || contrato.salones?.nombre}
    </span>
  </div>
)}
```

**Vista:**
```
CONT-2025-11-0001
Cliente: María González
🎉 Homenajeado/a: Lucía González

📅 15 de diciembre de 2025
🕐 7:00 PM - 1:00 AM (6.0h)
👥 100 invitados
📍 Diamond  ← YA ESTÁ IMPLEMENTADO
```

### **Backend Verificado:**

**Archivo:** `backend/src/routes/contratos.routes.js`

**Líneas 76-81:**

```javascript
salones: {
  select: {
    id: true,
    nombre: true
  }
}
```

**✅ El backend ya incluye la relación con salones.**

---

## 2️⃣ Preview de Contratos - Homenajeado Visible

### **Estado Actual:**

**Archivo:** `frontend/src/pages/Contratos.jsx`

**Líneas 284-288:**

```jsx
{contrato.homenajeado && (
  <p className="text-gray-600 mb-3 ml-11 text-sm">
    🎉 Homenajeado/a: <span className="font-medium text-purple-600">{contrato.homenajeado}</span>
  </p>
)}
```

**✅ El código ya está implementado.**

### **Posible Problema:**

Si no se ve el homenajeado, es porque:

1. **La columna no existe en la BD:**
   ```bash
   psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql
   ```

2. **Los contratos existentes no tienen datos:**
   - Los contratos creados **antes** de la migración no tendrán homenajeado
   - Solo los **nuevos** contratos lo tendrán

3. **El backend no está actualizado:**
   ```bash
   cd backend
   npx prisma generate
   npm run dev
   ```

---

## 3️⃣ Sede Externa → Solo Paquete Personalizado

### **Problema Original:**

Cuando seleccionabas **"Otro (Sede Externa)"**, seguían apareciendo todos los paquetes (Diamond, Deluxe, etc.), pero solo debería aparecer el **Paquete Personalizado**.

---

### **Solución Implementada:**

**Archivos Modificados:**
- `frontend/src/pages/CrearOferta.jsx` (líneas 947-959)
- `frontend/src/pages/EditarOferta.jsx` (líneas 849-861)

**Código:**

```jsx
{paquetes?.filter(p => {
  // Si es sede externa (otro), solo mostrar paquete personalizado
  if (formData.salon_id === 'otro') {
    return p.nombre?.toLowerCase().includes('personalizado');
  }
  // Si es salón de la empresa, filtrar los disponibles
  return p.disponible_salon !== false;
}).map((paquete) => (
  <option key={paquete.id} value={paquete.id}>
    {paquete.nombre} - ${paquete.precio_base_salon || paquete.precio_base} 
    {paquete.invitados_minimo_salon && ` (Mín: ${paquete.invitados_minimo_salon} inv.)`}
  </option>
))}
```

---

### **Mensaje Informativo Agregado:**

**Líneas 966-970 (CrearOferta) y 868-872 (EditarOferta):**

```jsx
{formData.salon_id === 'otro' && (
  <p className="text-xs text-blue-600 mt-1">
    ℹ️ Para sedes externas, solo está disponible el <strong>Paquete Personalizado</strong>
  </p>
)}
```

**Vista en el formulario:**

```
Lugar del Evento *
[ Otro (Sede Externa - Sin cargo de salón) ]

┌─────────────────────────────────────────────────────┐
│ Universidad de Miami                                │
└─────────────────────────────────────────────────────┘
⚠️ Importante: Al seleccionar una sede externa, no se cobrará el salón.

Paquete *
[ Paquete Personalizado - $X ]  ← SOLO ESTE APARECE

ℹ️ Para sedes externas, solo está disponible el Paquete Personalizado
```

---

## 📊 Resumen de Cambios

| Archivo | Líneas | Cambio | Estado |
|---------|--------|--------|--------|
| `Contratos.jsx` | 330-336 | Preview salón | ✅ Ya implementado |
| `Contratos.jsx` | 284-288 | Preview homenajeado | ✅ Ya implementado |
| `contratos.routes.js` | 76-81 | Include salones | ✅ Ya implementado |
| `CrearOferta.jsx` | 947-959 | Filtro paquete personalizado | ✅ Agregado |
| `CrearOferta.jsx` | 966-970 | Mensaje informativo | ✅ Agregado |
| `EditarOferta.jsx` | 849-861 | Filtro paquete personalizado | ✅ Agregado |
| `EditarOferta.jsx` | 868-872 | Mensaje informativo | ✅ Agregado |

---

## 🧪 Testing

### **Test 1: Preview de Contratos - Salón**

**Pasos:**
1. Ir a la lista de **Contratos**
2. Buscar un contrato con salón (ej: Diamond)
3. **Verificar:**
   - ✅ Aparece `📍 Diamond`
   - ✅ Aparece junto con fecha, hora, invitados

**Si no aparece:**
```sql
-- Verificar en la BD
SELECT id, codigo_contrato, salon_id, lugar_salon 
FROM contratos 
WHERE id = X;
```
- Si `salon_id` es NULL pero `lugar_salon` tiene valor → Contratos antiguos, funcionará con `lugar_salon`
- Si ambos son NULL → Contrato antiguo sin salón asignado

---

### **Test 2: Preview de Contratos - Homenajeado**

**Pasos:**
1. Crear una **oferta NUEVA** con homenajeado: "Lucía González"
2. Crear el contrato desde esa oferta
3. Ir a la lista de **Contratos**
4. **Verificar:**
   - ✅ Aparece `🎉 Homenajeado/a: Lucía González`

**Si no aparece:**
```sql
-- Verificar si el campo existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'contratos' AND column_name = 'homenajeado';

-- Verificar datos del contrato
SELECT id, codigo_contrato, homenajeado 
FROM contratos 
WHERE id = X;
```

**Solución:**
```bash
# Si el campo no existe:
psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql

# Regenerar Prisma
cd backend
npx prisma generate
npm run dev
```

---

### **Test 3: Sede Externa → Solo Paquete Personalizado**

**Pasos:**
1. Ir a **Crear Oferta**
2. En "Lugar del Evento", seleccionar **"Otro (Sede Externa)"**
3. Escribir: "Universidad de Miami"
4. Ir al select de **Paquete**
5. **Verificar:**
   - ✅ Solo aparece "Paquete Personalizado"
   - ✅ NO aparece "Diamond", "Deluxe", etc.
   - ✅ Aparece mensaje: "ℹ️ Para sedes externas, solo está disponible el Paquete Personalizado"

**Caso especial:**
Si el paquete personalizado **no existe** en la BD:
```sql
-- Verificar paquetes personalizados
SELECT id, nombre, precio_base 
FROM paquetes 
WHERE LOWER(nombre) LIKE '%personalizado%';
```

**Si no existe, crear:**
```sql
INSERT INTO paquetes (nombre, descripcion, precio_base, precio_base_persona, tipo, duracion_horas, invitados_minimo, activo)
VALUES (
  'Paquete Personalizado',
  'Paquete totalmente personalizado según las necesidades del cliente',
  0,
  0,
  'personalizado',
  4,
  1,
  true
);
```

---

### **Test 4: Editar Oferta - Cambiar a Sede Externa**

**Pasos:**
1. Editar una oferta existente con salón **Diamond**
2. Cambiar "Lugar del Evento" a **"Otro"**
3. Especificar: "Hotel Marriott"
4. Ir al select de **Paquete**
5. **Verificar:**
   - ✅ El paquete "Diamond" desaparece
   - ✅ Solo aparece "Paquete Personalizado"
   - ✅ Aparece el mensaje informativo

---

### **Test 5: Guardar Oferta con Sede Externa**

**Pasos:**
1. Crear oferta con **"Otro"** → "Hotel XYZ"
2. Seleccionar **"Paquete Personalizado"**
3. Guardar oferta
4. **Verificar en BD:**
   ```sql
   SELECT id, codigo_oferta, salon_id, lugar_evento, paquete_id
   FROM ofertas
   WHERE id = X;
   ```
5. **Verificar:**
   - ✅ `salon_id` = NULL
   - ✅ `lugar_evento` = "Hotel XYZ"
   - ✅ `paquete_id` = ID del paquete personalizado

---

## ⚠️ Troubleshooting

### **Problema 1: No aparece salón en preview de contratos**

**Verificar:**

1. **Backend incluye salones:**
   ```bash
   # Verificar en contratos.routes.js líneas 76-81
   grep -A 5 "salones:" backend/src/routes/contratos.routes.js
   ```

2. **Frontend muestra salón:**
   ```bash
   # Verificar en Contratos.jsx líneas 330-336
   grep -A 5 "contrato.salones?.nombre" frontend/src/pages/Contratos.jsx
   ```

3. **Datos en la BD:**
   ```bash
   psql -U postgres -d diamond_sistem -f database/verificar_preview_contratos.sql
   ```

---

### **Problema 2: No aparece homenajeado**

**Solución:**

1. **Verificar campo existe:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'contratos' AND column_name = 'homenajeado';
   ```

2. **Si no existe, aplicar migración:**
   ```bash
   psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql
   ```

3. **Regenerar Prisma:**
   ```bash
   cd backend
   npx prisma generate
   npm run dev
   ```

4. **Crear contrato NUEVO con homenajeado:**
   - Los contratos antiguos no tendrán este campo
   - Solo los nuevos lo tendrán

---

### **Problema 3: Aparecen todos los paquetes con sede externa**

**Verificar:**

1. **Código de filtro:**
   ```bash
   # Verificar líneas 947-959 en CrearOferta.jsx
   grep -A 10 "formData.salon_id === 'otro'" frontend/src/pages/CrearOferta.jsx
   ```

2. **Paquete personalizado existe:**
   ```sql
   SELECT id, nombre FROM paquetes WHERE LOWER(nombre) LIKE '%personalizado%';
   ```

3. **Refrescar navegador:**
   - Ctrl + Shift + R (hard refresh)
   - O ventana privada

---

## 📁 Archivos Modificados

1. ✅ `frontend/src/pages/CrearOferta.jsx`
   - Líneas 947-959: Filtro paquete personalizado
   - Líneas 966-970: Mensaje informativo

2. ✅ `frontend/src/pages/EditarOferta.jsx`
   - Líneas 849-861: Filtro paquete personalizado
   - Líneas 868-872: Mensaje informativo

3. ✅ `database/verificar_preview_contratos.sql`
   - Script de verificación de datos

4. ✅ `FIX_PREVIEW_Y_SEDE_EXTERNA.md`
   - Este documento

---

## ✅ Checklist Final

- [ ] Salón aparece en preview de contratos (`📍 Diamond`)
- [ ] Homenajeado aparece en preview de contratos (`🎉 Homenajeado/a: X`)
- [ ] Al seleccionar "Otro" (sede externa), solo aparece "Paquete Personalizado"
- [ ] Aparece mensaje informativo al seleccionar sede externa
- [ ] Al guardar con sede externa, `salon_id` = NULL en BD
- [ ] Contratos nuevos se crean correctamente con homenajeado
- [ ] No hay errores en consola del navegador
- [ ] No hay errores de linter

---

## 🚀 Aplicar Cambios

1. **Refrescar navegador:**
   ```
   F5 (o Ctrl + Shift + R para hard refresh)
   ```

2. **Si homenajeado no aparece, aplicar migración:**
   ```bash
   psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql
   cd backend
   npx prisma generate
   npm run dev
   ```

3. **Verificar datos en BD:**
   ```bash
   psql -U postgres -d diamond_sistem -f database/verificar_preview_contratos.sql
   ```

---

**Última actualización:** Noviembre 2025  
**Estado:** ✅ Completado  
**Versión:** 1.0




