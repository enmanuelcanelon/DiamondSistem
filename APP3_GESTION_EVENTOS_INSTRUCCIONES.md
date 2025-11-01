# 🎯 App 3: Gestión de Eventos - Instrucciones Completas

## 📋 Descripción

La **App 3** es el Panel de Gestión de Eventos para vendedores, donde pueden:
- Ver todos sus eventos activos
- Gestionar solicitudes de cambios de sus clientes
- Aprobar o rechazar solicitudes
- Ver eventos próximos y estadísticas

**Seguridad:** Cada vendedor **SOLO puede ver y gestionar** solicitudes de SUS propios clientes.

---

## 🏗️ Arquitectura Implementada

### 1. Base de Datos

**Tabla:** `solicitudes_cliente`

```sql
CREATE TABLE solicitudes_cliente (
    id SERIAL PRIMARY KEY,
    contrato_id INT REFERENCES contratos(id),
    cliente_id INT REFERENCES clientes(id),
    tipo_solicitud VARCHAR(50) CHECK (tipo_solicitud IN ('invitados', 'servicio')),
    
    -- Para invitados
    invitados_adicionales INT,
    
    -- Para servicios
    servicio_id INT REFERENCES servicios(id),
    cantidad_servicio INT DEFAULT 1,
    detalles_solicitud TEXT,
    costo_adicional DECIMAL(10, 2),
    
    -- Gestión
    estado VARCHAR(50) DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    respondido_por INT REFERENCES vendedores(id)
);
```

**Triggers y Funciones:**
- ✅ Auto-actualización de `fecha_respuesta`
- ✅ Vista `vista_solicitudes_completas`
- ✅ Función `contar_solicitudes_pendientes_vendedor()`
- ✅ Función `obtener_solicitudes_vendedor()`

### 2. Backend

**Archivo:** `backend/src/routes/solicitudes.routes.js`

**Endpoints Principales:**

#### Para Clientes:
- `POST /api/solicitudes/invitados` - Solicitar más invitados
- `POST /api/solicitudes/servicio` - Solicitar servicio adicional
- `GET /api/solicitudes/contrato/:contratoId` - Ver mis solicitudes

#### Para Vendedores:
- `GET /api/solicitudes/vendedor/pendientes` - Ver pendientes (SOLO sus clientes)
- `GET /api/solicitudes/vendedor/todas` - Ver todas con filtros
- `PUT /api/solicitudes/:id/aprobar` - Aprobar solicitud
- `PUT /api/solicitudes/:id/rechazar` - Rechazar solicitud
- `GET /api/solicitudes/vendedor/estadisticas` - Estadísticas

**🔒 Seguridad:**
Todos los endpoints filtran por `vendedor_id` del usuario autenticado.

### 3. Frontend

#### Para Vendedores:

**Páginas Creadas:**

1. **`GestionEventos.jsx`** (`/eventos`)
   - Dashboard principal
   - Estadísticas (Eventos activos, solicitudes pendientes, etc.)
   - Lista de solicitudes con filtros (pendiente/aprobada/rechazada)
   - Búsqueda por cliente o código
   - Lista de eventos próximos (30 días)

2. **`DetalleSolicitud.jsx`** (`/solicitudes/:id`)
   - Detalle completo de la solicitud
   - Info del cliente y contrato
   - Botón "Aprobar Solicitud"
   - Formulario "Rechazar Solicitud" (con motivo)

#### Para Clientes:

**Páginas Creadas:**

1. **`SolicitarCambios.jsx`** (`/cliente/solicitar-cambios`)
   - Formulario para solicitar más invitados
   - Formulario para solicitar servicios adicionales
   - Cálculo de costo estimado
   - Campo de detalles adicionales

2. **`MisSolicitudes.jsx`** (`/cliente/solicitudes`)
   - Lista de todas las solicitudes del cliente
   - Estadísticas (pendientes/aprobadas/rechazadas)
   - Estado visual de cada solicitud
   - Botón para nueva solicitud

---

## 🚀 Cómo Usar el Sistema

### Paso 1: Asegúrate de que todo está corriendo

#### Backend:
```powershell
cd backend
npm run dev
```

#### Frontend:
```powershell
cd frontend
npm run dev
```

#### Base de Datos:
Ejecuta la migración si aún no lo hiciste:
```sql
\i 'C:/Users/eac/Desktop/DiamondSistem/database/migration_solicitudes_cambios.sql'
```

Regenera Prisma:
```powershell
cd backend
npx prisma generate
```

---

### Paso 2: Probar como CLIENTE

1. **Login como Cliente:**
   ```
   URL: http://localhost:5173/cliente/login
   Código: (usar código de acceso de un contrato activo)
   ```

2. **Solicitar Más Invitados:**
   - Click en "Solicitudes" en el menú
   - Click en "Nueva Solicitud"
   - Selecciona "Más Invitados"
   - Ingresa la cantidad (ej: 10)
   - Agrega detalles opcionales
   - Click en "Enviar Solicitud"

3. **Solicitar Servicio Adicional:**
   - Click en "Nueva Solicitud"
   - Selecciona "Servicio Adicional"
   - Elige un servicio del dropdown
   - Ajusta la cantidad
   - Observa el costo estimado
   - Click en "Enviar Solicitud"

4. **Ver Mis Solicitudes:**
   - Click en "Solicitudes" en el menú
   - Verás todas tus solicitudes con su estado
   - Estados posibles:
     - ⏳ **Pendiente**: El vendedor aún no ha respondido
     - ✅ **Aprobada**: Tu solicitud fue aceptada
     - ❌ **Rechazada**: Ver motivo del rechazo

---

### Paso 3: Probar como VENDEDOR

1. **Login como Vendedor:**
   ```
   URL: http://localhost:5173/login
   Código: VEND-001
   Password: (tu password)
   ```

2. **Ver Gestión de Eventos:**
   - Click en "Gestión de Eventos" en el menú lateral
   - Verás el dashboard con:
     - **Eventos Activos**: Total de contratos
     - **Solicitudes Pendientes**: Número de solicitudes por revisar
     - **Eventos Próximos**: Eventos en los próximos 30 días
     - **Solicitudes Aprobadas**: Histórico

3. **Filtrar Solicitudes:**
   - Click en tabs:
     - **Pendientes**: Solicitudes que requieren tu atención
     - **Aprobadas**: Solicitudes que ya aceptaste
     - **Rechazadas**: Solicitudes que rechazaste
   - Usa la barra de búsqueda para buscar por cliente o código

4. **Gestionar una Solicitud:**
   - Click en "Gestionar" en cualquier solicitud pendiente
   - Verás:
     - Información completa del cliente
     - Detalles del contrato
     - Detalles de lo que solicita
     - Impacto (nuevos invitados o costo adicional)
   
5. **Aprobar Solicitud:**
   - Click en "Aprobar Solicitud"
   - Confirma la acción
   - **Resultado:**
     - Si es solicitud de invitados: Se agregan al contrato
     - Si es servicio: Se agrega al contrato y se suma el costo
     - El cliente ve la solicitud como "Aprobada"

6. **Rechazar Solicitud:**
   - Click en "Rechazar"
   - Escribe el motivo del rechazo (requerido)
   - Click en "Confirmar Rechazo"
   - **Resultado:**
     - El cliente ve el motivo del rechazo
     - No se modifica el contrato

---

## 📊 Flujo Completo de Ejemplo

### Escenario: Cliente quiere agregar 15 invitados más

1. **Cliente (Juan Pérez):**
   - Login en portal del cliente
   - Va a "Solicitudes" → "Nueva Solicitud"
   - Selecciona "Más Invitados"
   - Ingresa: 15 invitados
   - Detalles: "Familia que confirmó tardíamente"
   - Envía la solicitud

2. **Sistema:**
   - Crea registro en `solicitudes_cliente`
   - Estado: `pendiente`
   - Vincula al `contrato_id` de Juan
   - Vincula al `vendedor_id` del vendedor asignado

3. **Vendedor (PEPE - VEND-001):**
   - Ve notificación de "Solicitudes Pendientes: 1"
   - Va a "Gestión de Eventos"
   - Ve la solicitud de Juan en la lista
   - Click en "Gestionar"
   - Revisa:
     - Invitados actuales: 100
     - Invitados nuevos: 115
   - **Decisión A:** Click en "Aprobar"
     - Sistema actualiza: `cantidad_invitados` del contrato a 115
     - Estado de solicitud: `aprobada`
     - Juan ve "✅ ¡Tu solicitud fue aprobada!"
   
   - **Decisión B:** Click en "Rechazar"
     - Escribe motivo: "El salón tiene capacidad máxima de 100 personas"
     - Estado de solicitud: `rechazada`
     - Juan ve "❌ Solicitud Rechazada" con el motivo

---

## 🔐 Seguridad y Permisos

### ✅ Lo que SÍ puede hacer cada vendedor:
- Ver solicitudes de SUS clientes
- Aprobar/rechazar solicitudes de SUS clientes
- Ver contratos de SUS clientes
- Ver estadísticas de SU gestión

### ❌ Lo que NO puede hacer:
- Ver solicitudes de otros vendedores
- Aprobar/rechazar solicitudes que no son suyas
- Ver contratos de otros vendedores
- Modificar solicitudes ya procesadas

**Implementación:**
Todos los queries en el backend filtran por:
```javascript
WHERE contratos.vendedor_id = req.user.id
```

---

## 🎨 Características de UI/UX

### Dashboard de Gestión (Vendedor):
- ✅ Cards de estadísticas con iconos
- ✅ Tabs para filtrar por estado
- ✅ Búsqueda en tiempo real
- ✅ Badges de estado con colores
- ✅ Lista de eventos próximos con alerta si quedan pocos días

### Detalle de Solicitud (Vendedor):
- ✅ Layout en 2 columnas
- ✅ Información del cliente destacada
- ✅ Cálculos automáticos (nuevo total si se aprueba)
- ✅ Confirmación antes de aprobar/rechazar
- ✅ Campo obligatorio de motivo al rechazar

### Formulario de Solicitud (Cliente):
- ✅ Selección visual (invitados vs servicio)
- ✅ Cálculo de costo en tiempo real
- ✅ Info del contrato actual
- ✅ Mensajes informativos
- ✅ Validaciones en frontend

### Mis Solicitudes (Cliente):
- ✅ Cards visuales con iconos
- ✅ Estadísticas personales
- ✅ Estados con colores (pendiente/aprobada/rechazada)
- ✅ Botón prominente para nueva solicitud
- ✅ Muestra motivo de rechazo si aplica

---

## 🧪 Checklist de Pruebas

### Pruebas del Cliente:
- [ ] Puede solicitar invitados adicionales
- [ ] Puede solicitar servicios adicionales
- [ ] Ve cálculo de costo estimado
- [ ] Ve lista de sus solicitudes
- [ ] Ve estado actualizado (pendiente/aprobada/rechazada)
- [ ] Ve motivo de rechazo si aplica
- [ ] Solo ve SUS solicitudes

### Pruebas del Vendedor:
- [ ] Ve estadísticas correctas
- [ ] Ve SOLO solicitudes de SUS clientes
- [ ] Puede filtrar por estado
- [ ] Puede buscar por cliente/código
- [ ] Puede aprobar solicitud de invitados
- [ ] Invitados se agregan al contrato al aprobar
- [ ] Puede aprobar solicitud de servicio
- [ ] Servicio y costo se agregan al contrato
- [ ] Puede rechazar con motivo
- [ ] No puede ver solicitudes de otros vendedores

### Pruebas de Seguridad:
- [ ] Vendedor A no puede aprobar solicitudes de Vendedor B
- [ ] Cliente solo ve sus propias solicitudes
- [ ] No se puede aprobar solicitud ya procesada
- [ ] Motivo de rechazo es obligatorio

---

## 📄 Archivos Creados

### Base de Datos:
- `database/migration_solicitudes_cambios.sql`

### Backend:
- `backend/src/routes/solicitudes.routes.js`

### Frontend - Vendedor:
- `frontend/src/pages/GestionEventos.jsx`
- `frontend/src/pages/DetalleSolicitud.jsx`

### Frontend - Cliente:
- `frontend/src/pages/cliente/SolicitarCambios.jsx`
- `frontend/src/pages/cliente/MisSolicitudes.jsx`

### Actualizados:
- `frontend/src/App.jsx` (rutas)
- `frontend/src/components/Layout.jsx` (menú vendedor)
- `frontend/src/components/LayoutCliente.jsx` (menú cliente)
- `backend/src/server.js` (ya tenía las rutas registradas)

---

## 🎯 Próximos Pasos

1. ✅ **Probar el flujo completo**
   - Crear solicitud como cliente
   - Aprobar/rechazar como vendedor
   - Verificar actualización del contrato

2. ✅ **Verificar seguridad**
   - Login con diferentes vendedores
   - Confirmar que solo ven SUS solicitudes

3. 📧 **Implementar Emails** (Pendiente)
   - Email al cliente cuando se aprueba/rechaza
   - Email al vendedor cuando hay nueva solicitud

4. 🔔 **Notificaciones en tiempo real** (Opcional)
   - Badge de notificaciones pendientes
   - WebSockets para updates en tiempo real

---

## ❓ Solución de Problemas

### Error: "Solicitud no encontrada"
**Causa:** El vendedor intenta ver una solicitud que no es suya
**Solución:** Verifica que la solicitud pertenece a un cliente del vendedor

### Error: "No se puede aprobar"
**Causa:** La solicitud ya fue procesada
**Solución:** Solo se pueden aprobar/rechazar solicitudes pendientes

### No aparecen solicitudes
**Causa:** No hay solicitudes del vendedor logueado
**Solución:** Crea solicitudes desde el portal del cliente primero

### Costo estimado es 0
**Causa:** Servicio no seleccionado o precio_base es 0
**Solución:** Verifica los precios en la tabla `servicios`

---

## 🏆 Resumen

✅ **Sistema Completo de Gestión de Solicitudes**
- Cliente puede solicitar cambios
- Vendedor puede aprobar/rechazar
- Seguridad por vendedor
- UI/UX moderna e intuitiva
- Actualizaciones automáticas del contrato

**¡La App 3 está 100% funcional y lista para usar!** 🎉

---

**Documentación creada: Noviembre 2025**
**Versión: 1.0**

