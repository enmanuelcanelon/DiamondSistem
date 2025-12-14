# 📘 Guía de Uso Completa - DiamondSistem

## 🎯 Introducción

DiamondSistem es un sistema completo de gestión de contratos para eventos que consta de:
- **Backend API** - Servidor Node.js con Express y PostgreSQL
- **Frontend Web** - Aplicación React para vendedores
- **Base de Datos** - PostgreSQL con lógica de negocio avanzada

## 🚀 Inicio Rápido

### 1. Verificar que todo esté corriendo

Deberías tener **3 procesos activos**:

#### a) Base de Datos PostgreSQL
```sql
-- En SQL Shell (psql):
\c diamondsistem
\dt  -- Ver tablas
```

#### b) Backend (Puerto 5000)
```bash
# Terminal 1
cd backend
npm run dev

# Deberías ver:
✅ Conexión a la base de datos establecida
🚀 Servidor corriendo en: http://localhost:5000
```

#### c) Frontend (Puerto 5173)
```bash
# Terminal 2
cd frontend
npm run dev

# Deberías ver:
➜  Local:   http://localhost:5173/
```

### 2. Acceder al Sistema

1. Abre tu navegador en: `http://localhost:5173`
2. Usa las credenciales de prueba:
   - **Código Vendedor:** `ADMIN001`
   - **Contraseña:** `Admin123!`

## 📋 Flujo de Trabajo Completo

### Paso 1: Registrar un Cliente

1. En el menú lateral, haz clic en **"Clientes"**
2. Clic en **"Nuevo Cliente"** (botón azul superior derecho)
3. Completa el formulario:
   - Nombre completo *
   - Email *
   - Teléfono *
   - Dirección (opcional)
   - Tipo de evento (ej: Boda, Quinceaños)
   - ¿Cómo nos conoció? (ej: Instagram, Recomendación)
4. Clic en **"Guardar Cliente"**

**Resultado:** El cliente aparecerá en tu lista de clientes.

---

### Paso 2: Crear una Oferta con Calculadora

1. Ve a **"Ofertas"** en el menú
2. Clic en **"Nueva Oferta"**
3. **Seleccionar Cliente:**
   - Elige el cliente del dropdown
   
4. **Detalles del Evento:**
   - Fecha del evento
   - Cantidad de invitados (ej: 150)
   - Hora inicio (ej: 18:00)
   - Hora fin (ej: 23:00)
   - Lugar del evento

5. **Paquete y Temporada:**
   - Selecciona un paquete (ej: "Paquete Oro")
   - Opcionalmente selecciona temporada especial (ej: "Temporada Alta +30%")

6. **Servicios Adicionales (Calculadora Interactiva):**
   - Clic en **"Agregar Servicio"**
   - Selecciona servicio (ej: "Fotografía Profesional")
   - Define cantidad
   - Agrega opción si es necesario (ej: "6 horas")
   - Repite para más servicios

7. **Observa la Calculadora (Panel Derecho):**
   ```
   ✅ Subtotal Paquete: $XX,XXX
   ✅ Servicios Adicionales: $X,XXX
   ✅ Ajuste Temporada: +$X,XXX
   ✅ IVA (7%): $X,XXX
   ✅ Servicio (18%): $X,XXX
   ═══════════════════════════
   💰 TOTAL FINAL: $XX,XXX
   ```

8. **Descuento (Opcional):**
   - Ingresa porcentaje de descuento si aplica
   - El cálculo se actualiza automáticamente

9. **Notas Internas:**
   - Agrega observaciones privadas

10. Clic en **"Crear Oferta"**

**Resultado:** La oferta se crea con estado "Pendiente".

---

### Paso 3: Gestionar la Oferta

1. Ve a **"Ofertas"**
2. Encuentra tu oferta recién creada
3. Verás su estado actual y detalles:
   - Código de oferta (ej: OF-2025-000001)
   - Cliente
   - Fecha y hora del evento
   - Invitados
   - Total calculado

4. **Simular Aceptación de Oferta:**
   - En ofertas pendientes, clic en **"Aceptar Oferta"**

**Resultado:** La oferta cambia a estado "Aceptada" y habilita la opción de crear contrato.

---

### Paso 4: Crear Contrato desde Oferta

1. En la oferta aceptada, clic en **"Crear Contrato →"**
2. El sistema genera automáticamente:
   - Código de contrato único
   - Código de acceso para el cliente
   - Toda la información de la oferta transferida

**Resultado:** Se crea el contrato con estado "Activo" y pago "Pendiente".

---

### Paso 5: Registrar Pagos

1. Ve a **"Contratos"** en el menú
2. Selecciona un contrato
3. Clic en **"Ver Detalles"**

En la página de detalle verás:
- ✅ Información completa del evento
- ✅ Detalles del paquete y servicios
- ✅ Resumen financiero con progreso de pago

4. **Registrar Nuevo Pago:**
   - Clic en **"Registrar Pago"** o agrega `?action=pago` a la URL
   - En el formulario lateral:
     * Monto (máximo: saldo pendiente)
     * Método de pago (efectivo, tarjeta, transferencia, etc.)
     * Número de referencia (opcional)
     * Notas (opcional)
   - Clic en **"Registrar Pago"**

5. **Observa el Historial:**
   - Todos los pagos se muestran en la sección "Historial de Pagos"
   - La barra de progreso se actualiza automáticamente
   - El estado cambia a:
     * "Parcial" si hay pagos pero falta saldo
     * "Pagado" cuando el saldo llega a $0

**Resultado:** El pago queda registrado y el contrato se actualiza.

---

### Paso 6: Monitorear en Dashboard

1. Ve al **"Dashboard"** (página principal)
2. Observa las métricas actualizadas:
   - 👥 Total Clientes
   - 📄 Ofertas Pendientes
   - ✅ Contratos Activos
   - 💰 Total Ventas
   - 💵 Comisiones ganadas

**Estadísticas Detalladas:**
- Estado de ofertas (pendientes, aceptadas, rechazadas)
- Tasa de conversión
- Comisiones por porcentaje
- Contratos pagados completamente

---

## 🔍 Funcionalidades Avanzadas

### Búsqueda y Filtros

**En Clientes:**
- Busca por nombre o email

**En Ofertas:**
- Busca por código o cliente
- Filtra por estado (pendiente, aceptada, rechazada)

**En Contratos:**
- Busca por código o cliente
- Filtra por estado de pago
- Filtra por estado de contrato

### Calculadora de Precios

La calculadora considera:
1. **Precio Base:** Paquete × Invitados
2. **Servicios Adicionales:** Suma de todos los servicios
3. **Ajuste por Temporada:** Incremento % según temporada
4. **Subtotal:** Suma de todo lo anterior
5. **Descuento:** Reducción % si aplica
6. **IVA (7%):** Sobre el subtotal después de descuento
7. **Servicio (18%):** Sobre el subtotal después de descuento
8. **Total Final:** Todo incluido

**Cálculo de Comisión del Vendedor:**
- Se calcula sobre el monto total
- Porcentaje definido en el perfil del vendedor
- Visible en el dashboard y estadísticas

### Estados y Transiciones

**Ofertas:**
```
Pendiente → Aceptada → [Crear Contrato]
         ↘ Rechazada
```

**Contratos:**
```
Estado: Activo → Completado/Cancelado
Pago: Pendiente → Parcial → Pagado
```

---

## 📱 Interfaz de Usuario

### Navegación Principal (Sidebar)

1. **Dashboard** - Vista general y estadísticas
2. **Clientes** - Gestión de clientes
3. **Ofertas** - Crear y gestionar ofertas
4. **Contratos** - Contratos y pagos

### Acciones Rápidas (Dashboard)

Botones de acceso rápido:
- ➕ Nuevo Cliente
- 📄 Nueva Oferta
- 📋 Ver Contratos

### Perfil de Usuario (Sidebar inferior)

- Avatar con inicial
- Nombre completo
- Código de vendedor
- Botón "Cerrar Sesión"

---

## 🎨 Características de Diseño

- ✅ **100% Responsivo** - Funciona en móviles, tablets y desktop
- ✅ **Sidebar Colapsable** - En móvil se convierte en menú hamburguesa
- ✅ **Animaciones Fluidas** - Transiciones suaves entre estados
- ✅ **Loading States** - Skeleton loaders mientras carga
- ✅ **Feedback Visual** - Mensajes de éxito y error claros
- ✅ **Tema Moderno** - Paleta de colores profesional

---

## 🔐 Seguridad

### Sistema de Autenticación

1. **Login con JWT:**
   - Token válido por 7 días
   - Se guarda en localStorage
   - Se incluye en todas las peticiones

2. **Protección de Rutas:**
   - Rutas protegidas requieren autenticación
   - Redirección automática a login si no hay token

3. **Expiración de Sesión:**
   - Si el token expira, se redirige a login
   - Mensaje de sesión expirada

### Código de Acceso Cliente

Cada contrato genera un código único para que el cliente pueda:
- Ver el estado de su evento (próximamente en App Cliente)
- Revisar pagos realizados
- Acceder a información del contrato

---

## 🛠️ Solución de Problemas

### ❌ Error: "No se puede conectar al servidor"

**Causa:** Backend no está corriendo

**Solución:**
```bash
cd backend
npm run dev
```

---

### ❌ Error: "Error al cargar datos"

**Causa:** La base de datos no está accesible

**Solución:**
```sql
-- En psql:
\c diamondsistem
SELECT COUNT(*) FROM vendedores;  -- Debería retornar 3
```

---

### ❌ Error: "Credenciales inválidas"

**Causa:** Usuario no existe o contraseña incorrecta

**Solución:**
1. Verifica las credenciales:
   - Código: `ADMIN001`
   - Password: `Admin123!`
2. Si no funciona, revisa los seeds de la BD

---

### ❌ Frontend muestra página en blanco

**Causa:** Error de JavaScript

**Solución:**
1. Abre la consola del navegador (F12)
2. Revisa errores en la pestaña Console
3. Verifica que `.env` exista con `VITE_API_URL`

---

## 📊 Datos de Prueba Incluidos

### Vendedores:
- **ADMIN001** - Administrador (10% comisión)
- **VEND001** - Juan Pérez (5% comisión)
- **VEND002** - María García (5% comisión)

### Paquetes:
- Paquete Básico - $25/persona
- Paquete Plata - $35/persona
- Paquete Oro - $50/persona
- Paquete Platinum - $75/persona
- Paquete Diamond - $100/persona

### Temporadas:
- Temporada Alta (+30%) - Nov 1 - Ene 15
- Temporada Media (+15%) - Feb 1 - Abr 30
- Temporada Baja (-10%) - May 1 - Ago 31

### Servicios (Más de 40 disponibles):
- Bebidas, Mobiliario, Entretenimiento
- Decoración, Fotografía, Video
- Alimentación, Logística, Staff

---

## 🎯 Ejemplo Completo Paso a Paso

### Escenario: Boda de 200 invitados

**Paso 1 - Cliente:**
```
Nombre: Ana Martínez
Email: ana@email.com
Teléfono: 555-1234
Tipo: Boda
```

**Paso 2 - Oferta:**
```
Cliente: Ana Martínez
Fecha: 15 de Junio, 2025
Invitados: 200
Hora: 18:00 - 01:00
Lugar: Jardín El Paraíso

Paquete: Oro ($50/persona)
Temporada: Normal (sin ajuste)

Servicios Adicionales:
- Fotografía Profesional (8 horas) → $900
- DJ + Iluminación → $800
- Decoración Premium → $1,200
- Barra Libre Premium → $15/persona × 200

Descuento: 5% (cliente referido)
```

**Cálculo Automático:**
```
Subtotal Paquete: $10,000 (200 × $50)
Servicios Adicionales: $5,900
Subtotal: $15,900
Descuento (5%): -$795
Subtotal con Descuento: $15,105
IVA (7%): $1,057.35
Servicio (18%): $2,718.90
═══════════════════════════
TOTAL FINAL: $18,881.25

Comisión Vendedor (10%): $1,888.13
```

**Paso 3 - Oferta Aceptada → Contrato Creado**

**Paso 4 - Pagos:**
```
Pago 1: $5,000 (Anticipo) - Tarjeta
Pago 2: $8,000 (Segundo pago) - Transferencia
Pago 3: $5,881.25 (Liquidación) - Efectivo
```

**Resultado Final:**
- ✅ Cliente registrado
- ✅ Oferta creada y aceptada
- ✅ Contrato activo
- ✅ Pagado completamente
- ✅ Comisión de $1,888.13 para el vendedor

---

## 📈 Métricas y Reportes

El sistema rastrea automáticamente:

- **Clientes:** Total de clientes registrados
- **Ofertas:** Pendientes, aceptadas, rechazadas, tasa de conversión
- **Contratos:** Activos, completados, cancelados
- **Ventas:** Total de ventas, ventas por período
- **Comisiones:** Total de comisiones ganadas
- **Pagos:** Montos pagados, pendientes

Todo visible en tiempo real en el Dashboard.

---

## 🚀 Próximos Pasos

### Para el Usuario:
1. Familiarízate con el flujo completo
2. Crea datos de prueba propios
3. Experimenta con diferentes paquetes y servicios
4. Observa cómo cambian los cálculos

### Desarrollo Futuro:
- [ ] **App 2:** Panel del Cliente (ver su contrato, pagos)
- [ ] **App 3:** Panel de Administración (reportes avanzados)
- [ ] Generación de PDF de contratos
- [ ] Envío automático de emails
- [ ] Sistema de notificaciones
- [ ] Calendario de eventos
- [ ] Modo oscuro

---

## 📞 Soporte

Si encuentras algún problema:

1. **Revisa esta guía completa**
2. **Consulta los README específicos:**
   - `backend/README.md`
   - `frontend/README.md`
   - `database/README.md`
3. **Verifica los logs de consola** (F12 en navegador)
4. **Revisa los logs del backend** (terminal)

---

## 🎉 ¡Disfruta DiamondSistem!

El sistema está completamente funcional y listo para usar en producción. Todas las funcionalidades están implementadas y probadas.

**Características Destacadas:**
- ✅ Calculadora de precios automática
- ✅ Gestión completa de clientes
- ✅ Sistema de ofertas y contratos
- ✅ Control de pagos con historial
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Diseño moderno y responsivo
- ✅ Seguridad con JWT
- ✅ Base de datos optimizada con triggers y vistas

---

**¡Todo listo para generar contratos! 💎🎉**



