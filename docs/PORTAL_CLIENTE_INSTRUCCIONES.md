# 👥 Portal del Cliente - Instrucciones

## 📋 Resumen

Se ha implementado un **Portal del Cliente** completo que permite a los clientes acceder a toda la información de su evento usando un código único de acceso. Este portal incluye:

- 🔐 Autenticación con código de acceso único
- 📊 Dashboard con información completa del evento
- 🎵 Gestión de Playlist Musical
- 🪑 Asignación de Mesas e Invitados
- 💰 Estado de pagos en tiempo real
- 📋 Visualización de servicios contratados
- 📞 Información de contacto del vendedor

## 🌟 Características Principales

### 1. **Acceso Seguro**
- Cada cliente recibe un código único de acceso
- El código se genera automáticamente al crear el contrato
- No requiere crear contraseña ni registrarse

### 2. **Dashboard Completo**
- Información del evento (fecha, hora, lugar, invitados)
- Estado de pagos con barra de progreso visual
- Estadísticas de playlist y mesas
- Detalles del paquete contratado
- Servicios adicionales
- Información del vendedor asignado

### 3. **Gestión de Playlist**
- Agregar canciones favoritas (que deben sonar)
- Marcar canciones prohibidas (que NO deben sonar)
- Sugerir canciones opcionales
- Búsqueda y filtros

### 4. **Asignación de Mesas**
- Ver y gestionar mesas del evento
- Agregar invitados
- Asignar invitados a mesas
- Ver capacidad y distribución

## 🚀 Cómo Funciona

### Para el Vendedor

#### 1. **Creación del Código de Acceso**

El código se genera automáticamente cuando:
- Se crea un contrato desde una oferta aceptada
- El campo `codigo_acceso_cliente` se genera con formato único

**Ejemplo de código**: `ACC-2024-12345-ABCD`

#### 2. **Compartir Código con el Cliente**

El vendedor debe:
1. Copiar el código de acceso del contrato
2. Enviarlo al cliente por email, WhatsApp, o SMS
3. Indicar la URL del portal: `https://tudominio.com/cliente/login`

**Plantilla de mensaje sugerida:**
```
¡Hola [Nombre del Cliente]! 👋

Ya puedes acceder a toda la información de tu evento especial.

🔑 Tu código de acceso es: [CÓDIGO]

🌐 Accede aquí: https://tudominio.com/cliente/login

Podrás:
✅ Ver detalles de tu evento
✅ Gestionar tu playlist musical  
✅ Organizar mesas e invitados
✅ Ver estado de pagos

¡Nos vemos pronto! 🎉
```

### Para el Cliente

#### 1. **Acceder al Portal**

1. Ir a: `https://tudominio.com/cliente/login`
2. Ingresar el código de acceso proporcionado
3. Click en "Acceder a mi Evento"

#### 2. **Navegar por el Portal**

El cliente verá un menú lateral con:
- 🏠 **Mi Evento**: Dashboard principal
- 🎵 **Playlist**: Gestión de música
- 🪑 **Mesas**: Distribución de invitados
- ⚙️ **Ajustes**: Personalizar detalles (próximamente)

#### 3. **Ver Información del Evento**

En el dashboard el cliente puede ver:
- Fecha, hora y lugar del evento
- Cantidad de invitados
- Paquete contratado y servicios incluidos
- Servicios adicionales
- Estado de pago con progreso visual
- Información de contacto del vendedor

#### 4. **Gestionar Playlist**

El cliente puede:
1. Click en "Playlist" en el menú
2. Agregar canciones con el botón "Agregar Canción"
3. Marcar canciones como:
   - ⭐ **Favoritas**: Deben sonar en el evento
   - 🚫 **Prohibidas**: NO deben sonar
   - 💡 **Sugeridas**: Opcionales
4. Buscar y filtrar canciones
5. Ver estadísticas de su playlist

#### 5. **Gestionar Mesas**

El cliente puede:
1. Click en "Mesas" en el menú
2. Crear mesas con capacidad personalizada
3. Agregar invitados a la lista
4. Asignar invitados a mesas usando dropdown
5. Ver estado de ocupación de cada mesa

#### 6. **Cerrar Sesión**

Click en el botón "Salir" en la esquina superior derecha

## 🎨 Diseño y UX

### Colores y Branding
- **Gradient principal**: Purple 600 → Pink 600
- **Colores secundarios**: Indigo, Green para acciones positivas
- **Estilo**: Moderno, limpio, amigable

### Iconografía
- 📅 **Calendar**: Evento principal
- 🎵 **Music**: Playlist
- 🪑 **Users/Table**: Mesas e invitados
- 💰 **Dollar**: Pagos
- ⚙️ **Settings**: Ajustes

### Responsividad
- ✅ Desktop: Layout con sidebar
- ✅ Tablet: Sidebar colapsable
- ✅ Mobile: Navegación optimizada

## 🔐 Seguridad

### Autenticación
- JWT con información del cliente y contrato
- Token expira después de sesión
- No se guardan passwords (solo código de acceso)

### Permisos
- Clientes solo pueden ver SU contrato
- No pueden acceder a datos de otros clientes
- Solo lectura/escritura de su playlist y mesas
- No pueden modificar datos financieros

### Validaciones
- Código de acceso debe existir en BD
- Contrato debe estar en estado "activo"
- Verificación de pertenencia en cada request

## 📊 Endpoints API (Cliente)

### Autenticación
```
POST /api/auth/login/cliente
Body: { codigo_acceso: "ACC-2024-..." }
Response: { token, user, contrato, evento }
```

### Dashboard
```
GET /api/contratos/:id
- Información completa del contrato

GET /api/playlist/contrato/:contratoId
- Estadísticas de playlist

GET /api/mesas/contrato/:contratoId
- Mesas configuradas

GET /api/invitados/contrato/:contratoId
- Lista de invitados
```

## 🎯 Flujo Completo (Caso de Uso)

### Ejemplo: Cliente "María y Juan - Boda"

1. **Vendedor Carlos crea oferta** → Oferta aceptada → Genera contrato
2. **Sistema genera código**: `ACC-2024-00123-XYZW`
3. **Carlos envía código a María** por WhatsApp
4. **María accede al portal**:
   - Ingresa su código
   - Ve información de su boda
   - Total: $15,000 | Pagado: $7,500 | Pendiente: $7,500
5. **María gestiona su playlist**:
   - Agrega "Perfect" de Ed Sheeran como favorita (primer baile)
   - Marca "La Macarena" como prohibida
   - Agrega 20 canciones sugeridas de Salsa
6. **María configura mesas**:
   - Crea 15 mesas de 10 personas
   - Agrega 150 invitados
   - Asigna cada invitado a su mesa
   - Mesa 1: Familia de la novia
   - Mesa 2: Familia del novio
   - etc.
7. **María cierra sesión** satisfecha con la organización

## 🔄 Sincronización con Vendedor

### Datos Compartidos
- **Playlist**: El vendedor puede ver y gestionar la playlist del cliente
- **Mesas**: El vendedor puede ver la distribución de mesas
- **Pagos**: Solo lectura para el cliente, gestión para vendedor

### Actualizaciones en Tiempo Real
- Los cambios del cliente se reflejan inmediatamente para el vendedor
- Los cambios del vendedor se reflejan para el cliente al recargar
- (Opcional) Implementar WebSockets para actualizaciones en vivo

## 🚧 Próximas Mejoras

### Fase 1 (Inmediata)
- [✅] Login con código de acceso
- [✅] Dashboard completo
- [✅] Playlist musical
- [✅] Asignación de mesas

### Fase 2 (Siguiente)
- [ ] Panel de ajustes del evento
- [ ] Selección de sabores de torta
- [ ] Opciones de decoración
- [ ] Menú personalizable

### Fase 3 (Futura)
- [ ] Chat con vendedor
- [ ] Notificaciones push
- [ ] Compartir acceso con familiares
- [ ] Timeline del evento
- [ ] Galería de fotos/videos

## 💡 Tips y Mejores Prácticas

### Para Vendedores

1. **Enviar código inmediatamente**: Después de crear el contrato
2. **Incluir instrucciones**: Explicar cómo usar el portal
3. **Seguimiento**: Verificar que el cliente haya accedido
4. **Asistencia**: Estar disponible para dudas

### Para Clientes

1. **Guardar el código**: En un lugar seguro
2. **Explorar todas las secciones**: Familiarizarse con el portal
3. **Actualizar regularmente**: Playlist y mesas según avanza la planificación
4. **Consultar al vendedor**: Para cualquier cambio mayor

## ❓ Solución de Problemas

### Código de acceso no funciona
- Verificar que esté escrito correctamente (mayúsculas/minúsculas)
- Contactar al vendedor para confirmar el código
- Verificar que el contrato esté activo

### No puedo ver mi información
- Refrescar la página (F5)
- Cerrar sesión y volver a entrar
- Verificar conexión a internet
- Contactar soporte técnico

### No puedo agregar canciones/invitados
- Verificar que el backend esté funcionando
- Revisar la consola del navegador (F12)
- Intentar desde otro navegador
- Contactar al vendedor

## 📱 Acceso desde Móvil

El portal es completamente responsivo y funciona en:
- ✅ iPhone / iOS Safari
- ✅ Android / Chrome
- ✅ Tablets
- ✅ Desktop (Windows, Mac, Linux)

**Recomendación**: Agregar a pantalla de inicio para acceso rápido

## 🎉 Beneficios del Portal

### Para el Cliente
- ✅ Acceso 24/7 a información del evento
- ✅ Control total de playlist y distribución
- ✅ Transparencia en pagos
- ✅ Reduce estrés y organización

### Para el Vendedor
- ✅ Menos llamadas/mensajes de consulta
- ✅ Cliente más involucrado y satisfecho
- ✅ Información centralizada
- ✅ Mejor experiencia de servicio

### Para el Negocio
- ✅ Diferenciación competitiva
- ✅ Clientes más felices
- ✅ Procesos más eficientes
- ✅ Mejor reputación

---

**¡Portal del Cliente listo para ofrecer una experiencia excepcional! 🎊**



