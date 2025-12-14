# 👁️ Ajustes del Evento - Vista Vendedor (Solo Lectura)

## 📋 Resumen

Se ha implementado la funcionalidad para que el vendedor pueda ver todos los ajustes del evento que el cliente ha configurado (torta, decoración, menú, entretenimiento, fotografía, otros). Además, se agregó la restricción de 10 días para el cliente.

---

## ✅ Lo que se implementó

### 1. **Nueva Página: AjustesEventoVendedor.jsx** (Vista Solo Lectura)

**Ubicación:** `frontend/src/pages/AjustesEventoVendedor.jsx`

**Características:**
- ✅ Vista de solo lectura para el vendedor
- ✅ Muestra todos los ajustes configurados por el cliente
- ✅ Organizad por secciones con tabs de navegación rápida
- ✅ Información del contrato y cliente en el header
- ✅ Banner informativo indicando que es solo lectura
- ✅ Botón de regreso al detalle del contrato

**Secciones mostradas:**
1. 🍰 **Torta:** Sabor, pisos, relleno, decoración
2. ✨ **Decoración:** Tema, colores, estilo, elementos especiales
3. 🍽️ **Menú:** Tipo de servicio, platos, opciones especiales, restricciones
4. 🎵 **Entretenimiento:** Música ceremonial, bailes especiales, actividades
5. 📸 **Fotografía:** Momentos a capturar, poses, ubicaciones
6. ⚙️ **Otros:** Invitados de honor, brindis, sorpresas

---

### 2. **Restricción de 10 Días para el Cliente**

**Archivo modificado:** `frontend/src/pages/cliente/AjustesEvento.jsx`

**Características:**
- ✅ Calcula automáticamente los días restantes hasta el evento
- ✅ **Banner Rojo de Bloqueo** (< 10 días): Informa que los ajustes están bloqueados
- ✅ **Banner Amarillo de Advertencia** (10-15 días): Advierte que pronto se bloquearán
- ✅ Deshabilita todos los botones de "Guardar" cuando está bloqueado
- ✅ Muestra icono de candado y texto "Bloqueado" en los botones
- ✅ Cliente puede ver todo pero no puede editar

**Lógica de Bloqueo:**
```javascript
// Calcular días hasta el evento
const diasHastaEvento = contrato?.fecha_evento 
  ? Math.floor((new Date(contrato.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24))
  : null;

// Verificar si está bloqueado (menos de 10 días)
const estaBloqueado = diasHastaEvento !== null && diasHastaEvento < 10;
```

---

## 🎨 Interfaz

### Para el Vendedor (Vista Solo Lectura)
- **Header:** Título, nombre del cliente, código de contrato, fecha del evento
- **Banner Azul:** Indica que es vista de solo lectura
- **Tabs de Navegación:** Acceso rápido a cada sección (con scroll suave)
- **Secciones:** Campos organizados en tarjetas grises de solo lectura
- **Color:** Fondo amber para el botón de acceso

### Para el Cliente (con Restricción)
- **Banner Rojo** (<10 días): Ajustes bloqueados, contactar por chat
- **Banner Amarillo** (10-15 días): Tiempo limitado, finalizar ajustes pronto
- **Botones Deshabilitados:** Icono de candado, opacidad reducida, cursor "not-allowed"
- **Días Restantes:** Contador visible en los banners

---

## 🔧 Archivos Modificados

### Frontend

1. **`frontend/src/pages/AjustesEventoVendedor.jsx`** ✨ NUEVO
   - Página completa de vista de ajustes para vendedor
   - Componentes reutilizables para mostrar campos
   - Navegación por secciones

2. **`frontend/src/pages/cliente/AjustesEvento.jsx`** ✅ MODIFICADO
   - Agregado query para obtener la fecha del evento
   - Cálculo de días restantes
   - Lógica de bloqueo
   - Banners de advertencia
   - Botones deshabilitados cuando está bloqueado
   - Todas las 6 secciones actualizadas para recibir `estaBloqueado`

3. **`frontend/src/App.jsx`** ✅ MODIFICADO
   - Import: `import AjustesEventoVendedor from './pages/AjustesEventoVendedor';`
   - Ruta: `<Route path="ajustes/:contratoId" element={<AjustesEventoVendedor />} />`

4. **`frontend/src/pages/DetalleContrato.jsx`** ✅ MODIFICADO
   - Import: `Settings` de lucide-react
   - Botón amber "Ajustes del Evento" en la barra de acciones
   - Ruta: `/ajustes/${id}`

---

## 🚀 Flujo de Uso

### Escenario 1: Vendedor Ve los Ajustes
1. Vendedor entra a un contrato específico
2. Hace clic en "Ajustes del Evento" (botón amber)
3. Ve toda la información configurada por el cliente
4. Puede navegar entre secciones usando los tabs
5. No puede hacer cambios (vista de solo lectura)

### Escenario 2: Cliente 15 Días Antes
1. Cliente entra a "Ajustes del Evento"
2. Ve banner amarillo de advertencia (Tiempo Limitado)
3. Puede editar y guardar ajustes normalmente
4. Se le recuerda que pronto se bloqueará

### Escenario 3: Cliente 9 Días Antes
1. Cliente entra a "Ajustes del Evento"
2. Ve banner rojo de bloqueo
3. Todos los botones muestran "🔒 Bloqueado"
4. No puede guardar cambios
5. Se le indica contactar al vendedor por chat

---

## 📊 Puntos de Acceso

### Para el Vendedor:
**Desde Detalle del Contrato** (`/contratos/:id`):
- Botón "Ajustes del Evento" (color amber)
- Ubicado en la barra de acciones junto a "Chat" y "Descargar PDFs"

### Para el Cliente:
**Desde el Menú Principal** (`/cliente/ajustes`):
- Siempre accesible desde el menú lateral
- Icono de `Settings`

---

## 🔒 Seguridad y Lógica

### Backend (ya existente)
- ✅ Endpoint GET `/ajustes-evento/:contratoId` para obtener ajustes
- ✅ Autenticación requerida
- ✅ Verificación de permisos (vendedor asignado o cliente propietario)

### Frontend
- ✅ Vendedor solo puede ver ajustes de sus contratos
- ✅ Cliente solo puede ver/editar sus propios ajustes
- ✅ Bloqueo en el frontend (10 días)
- ✅ Validación de permisos en cada request

---

## 🧪 Pruebas Recomendadas

### 1. **Vista del Vendedor**
- [ ] Entrar a un contrato como vendedor
- [ ] Hacer clic en "Ajustes del Evento"
- [ ] Verificar que se muestra toda la información
- [ ] Verificar que NO hay botones de edición
- [ ] Navegar entre las 6 secciones

### 2. **Cliente con Evento Lejano (>15 días)**
- [ ] Cliente entra a "Ajustes del Evento"
- [ ] NO debe ver banner de advertencia
- [ ] Puede editar y guardar normalmente

### 3. **Cliente con Evento Próximo (10-15 días)**
- [ ] Cliente entra a "Ajustes del Evento"
- [ ] Ve banner amarillo de advertencia
- [ ] Puede editar y guardar normalmente
- [ ] Banner muestra días restantes

### 4. **Cliente con Evento Inminente (<10 días)**
- [ ] Cliente entra a "Ajustes del Evento"
- [ ] Ve banner rojo de bloqueo
- [ ] Botones muestran "🔒 Bloqueado"
- [ ] No puede guardar cambios
- [ ] Se indica contactar por chat

### 5. **Seguridad**
- [ ] Vendedor A no puede ver ajustes de contrato de Vendedor B
- [ ] Cliente solo puede ver sus propios ajustes

---

## 📁 Estructura de Archivos

```
frontend/src/pages/
├── AjustesEventoVendedor.jsx  ✨ NUEVO (solo lectura)
├── DetalleContrato.jsx        ✅ MODIFICADO (botón agregado)
└── cliente/
    └── AjustesEvento.jsx       ✅ MODIFICADO (restricción 10 días)

frontend/src/
└── App.jsx                     ✅ MODIFICADO (nueva ruta)
```

---

## 🎯 Resultado Final

✅ **Vendedor puede ver todos los ajustes del evento (solo lectura)**  
✅ **Cliente bloqueado 10 días antes del evento**  
✅ **Banners informativos y de advertencia**  
✅ **Integración completa en el flujo de trabajo**  
✅ **Interfaz intuitiva y consistente**  
✅ **Seguridad y permisos correctos**  

---

## 💡 Detalles Técnicos

### Cálculo de Días Restantes
```javascript
const diasHastaEvento = contrato?.fecha_evento 
  ? Math.floor((new Date(contrato.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24))
  : null;
```

### Banners Condicionales
- **Bloqueo** (<10 días): `estaBloqueado && <BannerRojo />`
- **Advertencia** (10-15 días): `!estaBloqueado && diasHastaEvento < 15 && <BannerAmarillo />`

### Botones Deshabilitados
```javascript
disabled={guardando || estaBloqueado}

{estaBloqueado ? (
  <>
    <Lock className="w-5 h-5" />
    Bloqueado
  </>
) : (
  <>
    <Save className="w-5 h-5" />
    Guardar Cambios
  </>
)}
```

---

## 📞 Próximos Pasos

El sistema de ajustes está completamente funcional. Las tareas pendientes del proyecto son:

1. **B. Emails Automáticos** 📧
   - Confirmación de contrato
   - Recordatorios de pago
   - Confirmación de eventos
   - Notificación de mensajes

2. **C. Firma Digital** ✍️
   - Sistema de firma electrónica en contratos
   - PDF con firma integrada

3. **D. Pruebas y Refinamiento** 🧪
   - Probar todo el flujo
   - Corregir bugs (incluido el del chat)
   - Mejorar UI/UX

---

**Fecha de implementación:** Noviembre 1, 2025  
**Estado:** ✅ **COMPLETADO Y LISTO PARA USAR**  
**Próximo:** Lo que el usuario solicite 🚀



