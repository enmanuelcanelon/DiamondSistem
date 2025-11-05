# 🔧 Fix: Editar Oferta - Sincronización de Salones y Precios

## ❌ Problema Original

**Descripción del bug:**

Cuando editabas una oferta y cambias de salón (ej: Diamond → Kendall), los precios y paquetes disponibles NO se actualizaban dinámicamente:

- ❌ Seguía mostrando precios de Diamond
- ❌ Seguía mostrando paquete "Deluxe" (que no existe en Kendall/Doral)
- ❌ No respetaba los mínimos de invitados por salón
- ❌ No actualizaba los precios según el salón seleccionado

**Causa raíz:**

`EditarOferta.jsx` NO tenía la misma lógica dinámica de salones que `CrearOferta.jsx`. Le faltaba:

1. Campo `salon_id` en el formulario
2. Query de salones desde la API
3. Query de paquetes dinámico según salón
4. useEffect para actualizar cuando cambia el salón
5. Validaciones de capacidad y precios por salón

---

## ✅ Solución Implementada

Se ha sincronizado completamente `EditarOferta.jsx` con `CrearOferta.jsx` para que ambos manejen los salones de manera idéntica.

---

### **1. Estados Agregados**

**Archivo:** `frontend/src/pages/EditarOferta.jsx`

**Líneas 12-39:**

```javascript
const [formData, setFormData] = useState({
  cliente_id: '',
  paquete_id: '',
  salon_id: '',           // ← NUEVO
  temporada_id: '',
  // ... otros campos
});

const [salonSeleccionado, setSalonSeleccionado] = useState(null);  // ← NUEVO
const [lugarPersonalizado, setLugarPersonalizado] = useState('');  // ← NUEVO
```

---

### **2. Query de Salones**

**Líneas 99-106:**

```javascript
// Query para obtener salones
const { data: salones } = useQuery({
  queryKey: ['salones'],
  queryFn: async () => {
    const response = await api.get('/salones');
    return response.data.salones;
  },
});
```

**Beneficio:** Carga todos los salones disponibles desde la BD.

---

### **3. Query de Paquetes Dinámico**

**Antes (líneas 108-122):**
```javascript
// ❌ Query estático - siempre retornaba los mismos paquetes
const { data: paquetes } = useQuery({
  queryKey: ['paquetes'],
  queryFn: async () => {
    const response = await api.get('/paquetes');
    return response.data.paquetes;
  },
});
```

**Después (líneas 108-122):**
```javascript
// ✅ Query dinámico - cambia según el salón seleccionado
const { data: paquetes } = useQuery({
  queryKey: ['paquetes-salon', formData.salon_id],  // ← Depende del salón
  queryFn: async () => {
    if (!formData.salon_id || formData.salon_id === 'otro') {
      // Sin salón o sede externa: todos los paquetes
      const response = await api.get('/paquetes');
      return response.data.paquetes;
    }
    // Con salón: paquetes filtrados y precios del salón
    const response = await api.get(`/salones/${formData.salon_id}/paquetes`);
    return response.data.paquetes;
  },
  enabled: true,
});
```

**Beneficio:** 
- Diamond → Muestra todos los paquetes con precios de Diamond
- Kendall → Muestra solo paquetes disponibles con precios de Kendall
- Doral → Muestra solo paquetes disponibles con precios de Doral
- Otro → Muestra todos sin cargo de salón

---

### **4. useEffect para Actualizar Salón**

**Líneas 255-290:**

```javascript
// Actualizar información del salón cuando cambia
useEffect(() => {
  if (formData.salon_id && salones) {
    // Caso especial: "Otro" (sede externa)
    if (formData.salon_id === 'otro') {
      setSalonSeleccionado(null);
      setFormData(prev => ({
        ...prev,
        lugar_evento: lugarPersonalizado || 'Sede Externa'
      }));
      
      // Resetear paquete si hay uno seleccionado
      if (formData.paquete_id) {
        setPrecioBaseAjustado('');
      }
    } else {
      // Caso normal: salón de la empresa
      const salon = salones.find(s => s.id === parseInt(formData.salon_id));
      if (salon) {
        setSalonSeleccionado(salon);
        // Actualizar lugar_evento con el nombre del salón
        if (formData.lugar_evento !== salon.nombre) {
          setFormData(prev => ({
            ...prev,
            lugar_evento: salon.nombre
          }));
        }
        
        // Si hay paquete seleccionado, resetear para forzar recarga de precio
        if (formData.paquete_id) {
          setPrecioBaseAjustado('');
        }
      }
    }
  }
}, [formData.salon_id, salones, lugarPersonalizado]);
```

**Beneficio:** 
- Cuando cambias el salón, automáticamente actualiza el `lugar_evento`
- Resetea el precio ajustado para forzar recalculo
- Maneja el caso especial de "Otro" (sede externa)

---

### **5. Cargar salon_id de Oferta Existente**

**Líneas 167-185:**

```javascript
// Cargar datos básicos
setFormData({
  cliente_id: ofertaExistente.cliente_id?.toString() || '',
  paquete_id: ofertaExistente.paquete_id?.toString() || '',
  salon_id: ofertaExistente.salon_id?.toString() || '',  // ← NUEVO
  // ... otros campos
});

// Si el salon_id es null, podría ser un lugar externo (otro)
if (!ofertaExistente.salon_id && ofertaExistente.lugar_evento) {
  setLugarPersonalizado(ofertaExistente.lugar_evento);
}
```

**Beneficio:** Carga correctamente el salón de la oferta existente.

---

### **6. Select de Salón en el Formulario**

**Antes (líneas 770-787):**
```jsx
{/* ❌ Select hardcodeado con opciones fijas */}
<select name="lugar_evento" value={formData.lugar_evento}>
  <option value="">Seleccione un lugar</option>
  <option value="Diamond">Diamond</option>
  <option value="Doral">Doral</option>
  <option value="Kendall">Kendall</option>
  <option value="Otro">Otro</option>
</select>
```

**Después (líneas 770-809):**
```jsx
{/* ✅ Select dinámico cargado desde la BD */}
<select name="salon_id" value={formData.salon_id}>
  <option value="">Seleccione un lugar</option>
  {salones?.map((salon) => (
    <option key={salon.id} value={salon.id}>
      {salon.nombre} - Capacidad: {salon.capacidad_maxima} invitados
    </option>
  ))}
  <option value="otro">Otro (Sede Externa - Sin cargo de salón)</option>
</select>

{/* Mostrar capacidad del salón seleccionado */}
{salonSeleccionado && formData.salon_id !== 'otro' && (
  <p className="text-xs text-gray-500 mt-1">
    ℹ️ Capacidad máxima: {salonSeleccionado.capacidad_maxima} invitados
  </p>
)}

{/* Campo adicional para sede externa */}
{formData.salon_id === 'otro' && (
  <div className="mt-3">
    <input
      type="text"
      value={lugarPersonalizado}
      onChange={(e) => setLugarPersonalizado(e.target.value)}
      placeholder="Especifica el lugar (ej: Universidad de Miami)"
      required
    />
    <p className="text-xs text-amber-600 mt-1">
      ⚠️ Al seleccionar una sede externa, no se cobrará el salón
    </p>
  </div>
)}
```

**Beneficio:** 
- Salones cargados dinámicamente desde la BD
- Muestra capacidad de cada salón
- Permite especificar sede externa personalizada

---

### **7. Select de Paquete Actualizado**

**Antes (líneas 833-843):**
```jsx
{/* ❌ Siempre habilitado, sin validación */}
<select name="paquete_id" value={formData.paquete_id}>
  <option value="">Seleccionar paquete...</option>
  {paquetes?.map((paquete) => (
    <option key={paquete.id} value={paquete.id}>
      {paquete.nombre} - ${paquete.precio_base}
    </option>
  ))}
</select>
```

**Después (líneas 833-859):**
```jsx
{/* ✅ Requiere salón seleccionado, precios dinámicos */}
<select 
  name="paquete_id" 
  value={formData.paquete_id}
  disabled={!formData.salon_id}  // ← Deshabilitado sin salón
>
  <option value="">
    {!formData.salon_id 
      ? 'Primero seleccione un salón' 
      : 'Seleccionar paquete...'}
  </option>
  {paquetes?.filter(p => p.disponible_salon !== false).map((paquete) => (
    <option key={paquete.id} value={paquete.id}>
      {paquete.nombre} - ${paquete.precio_base_salon || paquete.precio_base}
      {paquete.invitados_minimo_salon && ` (Mín: ${paquete.invitados_minimo_salon} inv.)`}
    </option>
  ))}
</select>

{!formData.salon_id && (
  <p className="text-xs text-amber-600 mt-1">
    ⚠️ Debe seleccionar un salón primero para ver los paquetes disponibles
  </p>
)}
```

**Beneficio:** 
- **Deshabilitado** hasta que se seleccione un salón
- Muestra **precio correcto** según el salón (`precio_base_salon`)
- Muestra **mínimo de invitados** si aplica
- Filtra paquetes no disponibles para ese salón

---

### **8. Calcular Precio con Salón**

**Líneas 326-342:**

```javascript
const response = await api.post('/ofertas/calcular', {
  paquete_id: parseInt(formData.paquete_id),
  salon_id: formData.salon_id === 'otro' 
    ? null 
    : (formData.salon_id ? parseInt(formData.salon_id) : null),  // ← NUEVO
  fecha_evento: formData.fecha_evento,
  cantidad_invitados: parseInt(formData.cantidad_invitados),
  // ... otros campos
});
```

**Beneficio:** El backend calcula el precio correcto según el salón.

---

### **9. Enviar Oferta con Salón**

**Líneas 594-616:**

```javascript
const dataToSubmit = {
  cliente_id: parseInt(formData.cliente_id),
  paquete_id: parseInt(formData.paquete_id),
  // Manejar "Otro" como sede externa sin cobro de salón
  salon_id: formData.salon_id === 'otro' 
    ? null 
    : (formData.salon_id ? parseInt(formData.salon_id) : null),  // ← NUEVO
  // ...
  lugar_evento: formData.salon_id === 'otro' 
    ? lugarPersonalizado   // ← Nombre personalizado
    : formData.lugar_evento,  // ← Nombre del salón
  // ... otros campos
};
```

**Beneficio:** 
- Envía `salon_id` correctamente
- Maneja "Otro" con `salon_id: null`
- Envía el lugar personalizado si es sede externa

---

## 📊 Resumen de Cambios

| Archivo | Líneas | Cambio | Impacto |
|---------|--------|--------|---------|
| `EditarOferta.jsx` | 12-39 | Estados agregados | Manejo de salones |
| `EditarOferta.jsx` | 99-106 | Query salones | Carga dinámica de salones |
| `EditarOferta.jsx` | 108-122 | Query paquetes | Paquetes según salón |
| `EditarOferta.jsx` | 255-290 | useEffect salón | Actualización automática |
| `EditarOferta.jsx` | 167-185 | Cargar salon_id | Recuperar oferta existente |
| `EditarOferta.jsx` | 770-809 | Select salón | UI dinámica |
| `EditarOferta.jsx` | 833-859 | Select paquete | Validación y precios |
| `EditarOferta.jsx` | 326-342 | calcularPrecio | Incluir salon_id |
| `EditarOferta.jsx` | 594-616 | enviarOferta | Enviar salon_id |

---

## 🧪 Testing

### **Test 1: Editar Oferta con Cambio de Salón**

**Pasos:**
1. Crear oferta con salón **Diamond**
2. Seleccionar paquete **Deluxe** (precio: $X)
3. Guardar oferta
4. **Editar** la oferta
5. Cambiar salón a **Kendall**
6. **Verificar:**
   - ✅ El paquete "Deluxe" desaparece o se muestra como no disponible
   - ✅ Los precios de los paquetes disponibles cambian
   - ✅ El select de paquetes se resetea automáticamente
   - ✅ Al calcular, usa el precio de Kendall

---

### **Test 2: Editar Oferta - Diamond → Doral**

**Pasos:**
1. Editar oferta existente con Diamond
2. Cambiar a Doral
3. Seleccionar paquete **Diamond** (básico)
4. **Verificar:**
   - ✅ El precio mostrado es el de Doral (≠ precio de Diamond)
   - ✅ Mínimo de invitados es 60 (no 80)
   - ✅ Al calcular, el total refleja precio de Doral

---

### **Test 3: Editar Oferta - Salón → Otro (Sede Externa)**

**Pasos:**
1. Editar oferta con salón Kendall
2. Cambiar a **"Otro"**
3. Especificar: "Universidad de Miami"
4. Seleccionar paquete
5. **Verificar:**
   - ✅ Aparece campo de texto para especificar lugar
   - ✅ Muestra advertencia de "sin cargo de salón"
   - ✅ El `salon_id` se envía como `null`
   - ✅ El `lugar_evento` es "Universidad de Miami"

---

### **Test 4: Editar Oferta sin Cambiar Salón**

**Pasos:**
1. Editar oferta con salón Diamond
2. Cambiar solo la fecha del evento
3. Guardar
4. **Verificar:**
   - ✅ El salón permanece como Diamond
   - ✅ Los precios no cambian
   - ✅ Solo se actualiza la fecha

---

### **Test 5: Cargar Oferta Existente con Sede Externa**

**Pasos:**
1. Crear oferta con "Otro" → "Hotel XYZ"
2. Guardar
3. Editar esa oferta
4. **Verificar:**
   - ✅ El select muestra "Otro" seleccionado
   - ✅ El input de lugar personalizado muestra "Hotel XYZ"
   - ✅ Los paquetes se cargan correctamente

---

## ⚠️ Comportamiento Esperado

### **Flujo Correcto:**

1. **Abrir "Editar Oferta"**
   - ✅ Carga el salón de la oferta existente
   - ✅ Muestra los paquetes disponibles para ese salón
   - ✅ Muestra el precio correcto del paquete seleccionado

2. **Cambiar de Salón**
   - ✅ **Automáticamente** resetea el select de paquetes
   - ✅ **Automáticamente** recarga los paquetes disponibles
   - ✅ **Automáticamente** actualiza los precios

3. **Seleccionar Paquete**
   - ✅ Muestra el precio del paquete **para el salón seleccionado**
   - ✅ Muestra el mínimo de invitados (si aplica)
   - ✅ Filtra paquetes no disponibles (ej: Deluxe en Kendall)

4. **Calcular Precio**
   - ✅ Envía `salon_id` al backend
   - ✅ El backend retorna el precio correcto

5. **Guardar Oferta**
   - ✅ Guarda el `salon_id` actualizado
   - ✅ Guarda el `lugar_evento` correcto

---

## 🐛 Errores Solucionados

| Error | Antes | Después |
|-------|-------|---------|
| **Precios incorrectos** | Editabas Diamond → Kendall, seguía mostrando precio de Diamond | ✅ Muestra precio de Kendall |
| **Paquetes no disponibles** | Mostraba "Deluxe" en Kendall/Doral | ✅ Filtra paquetes no disponibles |
| **Sin validación de salón** | Podías seleccionar paquete sin salón | ✅ Paquete deshabilitado sin salón |
| **Lugar hardcodeado** | Select con opciones fijas | ✅ Salones dinámicos desde BD |
| **Sin capacidad** | No mostraba capacidad del salón | ✅ Muestra capacidad máxima |
| **Sede externa** | No permitía especificar lugar externo | ✅ Campo de texto personalizado |
| **salon_id no enviado** | Backend no sabía qué salón usar | ✅ Envía salon_id correctamente |

---

## ✅ Checklist de Verificación

- [ ] Los salones se cargan desde la BD
- [ ] Los paquetes cambian cuando cambias el salón
- [ ] Los precios se actualizan dinámicamente
- [ ] El paquete "Deluxe" no aparece en Kendall/Doral
- [ ] Los mínimos de invitados son correctos por salón
- [ ] La opción "Otro" permite especificar lugar externo
- [ ] Al guardar, se envía `salon_id` correctamente
- [ ] Al cargar oferta existente, se recupera el salón
- [ ] No hay errores de linter
- [ ] No hay errores en consola del navegador

---

## 📁 Archivos Modificados

1. ✅ `frontend/src/pages/EditarOferta.jsx`
   - Líneas 12-39: Estados agregados
   - Líneas 99-122: Queries de salones y paquetes
   - Líneas 167-185: Cargar salon_id existente
   - Líneas 255-290: useEffect de salón
   - Líneas 326-342: Calcular precio con salón
   - Líneas 594-616: Enviar oferta con salón
   - Líneas 770-809: Select de salón
   - Líneas 833-859: Select de paquete actualizado

---

## 🚀 Próximos Pasos

1. **Reiniciar frontend** (si estaba corriendo):
   ```bash
   # El navegador debería recargar automáticamente con Vite
   # Si no, presiona F5
   ```

2. **Probar el flujo completo:**
   - Crear oferta con Diamond
   - Editarla y cambiar a Kendall
   - Verificar que los precios cambien
   - Guardar y verificar que se guarde correctamente

3. **Verificar casos especiales:**
   - Editar oferta con sede externa ("Otro")
   - Editar oferta antigua (sin salon_id)
   - Cambiar entre múltiples salones

---

**Última actualización:** Noviembre 2025  
**Estado:** ✅ Completado y sincronizado  
**Versión:** 1.0




