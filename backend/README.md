# 🚀 DiamondSistem - Backend API

API REST para el sistema de gestión de eventos y contratos DiamondSistem.

## 📋 Características

- ✅ Autenticación JWT para vendedores y clientes
- ✅ CRUD completo para todas las entidades
- ✅ Cálculo automático de precios con temporadas
- ✅ Sistema de ofertas y contratos
- ✅ Gestión de pagos y financiamiento
- ✅ Solicitudes de clientes con aprobación
- ✅ Sistema de mensajería
- ✅ Generación de códigos únicos
- ✅ Middleware de validación y autenticación
- ✅ Manejo centralizado de errores

## 🛠️ Tecnologías

- **Node.js** v18+
- **Express** v5
- **Prisma ORM** v6
- **PostgreSQL** 14+
- **JWT** para autenticación
- **Bcrypt** para hashing de passwords
- **CORS** habilitado

## 📦 Instalación

### 1. Clonar e instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copiar el archivo `env.example` a `.env` y configurar:

```bash
copy env.example .env
```

Editar `.env` con tus datos:

```env
PORT=5000
DATABASE_URL="postgresql://usuario:password@localhost:5432/diamondsistem"
JWT_SECRET=tu_secreto_muy_seguro_cambiar_en_produccion
```

### 3. Configurar base de datos

Opción A: Usar PostgreSQL local con los scripts SQL:

```bash
# En PostgreSQL
createdb diamondsistem
psql -d diamondsistem -f ../database/schema.sql
psql -d diamondsistem -f ../database/seeds.sql
```

Opción B: Usar Prisma (próximamente):

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Iniciar el servidor

**Desarrollo (con hot reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en: http://localhost:5000

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/      # Controladores (lógica de negocio)
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middleware personalizado
│   │   ├── auth.js      # Autenticación JWT
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── services/        # Servicios (capa de datos)
│   ├── utils/           # Utilidades
│   │   ├── jwt.js       # Manejo de JWT
│   │   ├── password.js  # Hash de passwords
│   │   ├── priceCalculator.js  # Cálculo de precios
│   │   ├── codeGenerator.js    # Generación de códigos
│   │   └── validators.js       # Validaciones
│   ├── config/          # Configuración
│   └── server.js        # Archivo principal
├── prisma/
│   ├── schema.prisma    # Esquema de Prisma
│   └── seed.js          # Datos iniciales
├── package.json
└── README.md
```

## 🔌 Endpoints Principales

### Autenticación

```
POST   /api/auth/login/vendedor     # Login de vendedor
POST   /api/auth/login/cliente      # Login de cliente
POST   /api/auth/register/vendedor  # Registro de vendedor
GET    /api/auth/me                 # Obtener usuario actual
```

### Vendedores

```
GET    /api/vendedores              # Listar vendedores
GET    /api/vendedores/:id          # Obtener vendedor
POST   /api/vendedores              # Crear vendedor
PUT    /api/vendedores/:id          # Actualizar vendedor
DELETE /api/vendedores/:id          # Eliminar vendedor
GET    /api/vendedores/:id/stats    # Estadísticas del vendedor
```

### Clientes

```
GET    /api/clientes                # Listar clientes
GET    /api/clientes/:id            # Obtener cliente
POST   /api/clientes                # Crear cliente
PUT    /api/clientes/:id            # Actualizar cliente
DELETE /api/clientes/:id            # Eliminar cliente
GET    /api/clientes/:id/contratos  # Contratos del cliente
```

### Paquetes

```
GET    /api/paquetes                # Listar paquetes
GET    /api/paquetes/:id            # Obtener paquete
GET    /api/paquetes/:id/servicios  # Servicios del paquete
POST   /api/paquetes                # Crear paquete
PUT    /api/paquetes/:id            # Actualizar paquete
```

### Servicios

```
GET    /api/servicios               # Listar servicios
GET    /api/servicios/:id           # Obtener servicio
GET    /api/servicios/categoria/:cat # Por categoría
POST   /api/servicios               # Crear servicio
PUT    /api/servicios/:id           # Actualizar servicio
```

### Ofertas

```
GET    /api/ofertas                 # Listar ofertas
GET    /api/ofertas/:id             # Obtener oferta
POST   /api/ofertas                 # Crear oferta
POST   /api/ofertas/calcular        # Calcular precio (sin guardar)
PUT    /api/ofertas/:id             # Actualizar oferta
PUT    /api/ofertas/:id/aceptar     # Aceptar oferta
PUT    /api/ofertas/:id/rechazar    # Rechazar oferta
DELETE /api/ofertas/:id             # Eliminar oferta
```

### Contratos

```
GET    /api/contratos               # Listar contratos
GET    /api/contratos/:id           # Obtener contrato
POST   /api/contratos               # Crear contrato (desde oferta)
PUT    /api/contratos/:id           # Actualizar contrato
GET    /api/contratos/:id/pagos     # Pagos del contrato
GET    /api/contratos/:id/servicios # Servicios del contrato
GET    /api/contratos/:codigo/acceso # Obtener por código de acceso
```

### Pagos

```
GET    /api/pagos                   # Listar pagos
GET    /api/pagos/:id               # Obtener pago
POST   /api/pagos                   # Registrar pago
GET    /api/pagos/contrato/:id      # Pagos de un contrato
```

### Eventos

```
GET    /api/eventos                 # Listar eventos
GET    /api/eventos/:id             # Obtener evento
PUT    /api/eventos/:id             # Actualizar detalles
PUT    /api/eventos/:id/detalles    # Actualizar detalles personalizados
```

### Solicitudes

```
GET    /api/solicitudes             # Listar solicitudes
GET    /api/solicitudes/pendientes  # Solicitudes pendientes
POST   /api/solicitudes             # Crear solicitud
PUT    /api/solicitudes/:id/aprobar # Aprobar solicitud
PUT    /api/solicitudes/:id/rechazar # Rechazar solicitud
```

### Mensajes

```
GET    /api/mensajes/contrato/:id   # Mensajes de un contrato
POST   /api/mensajes                # Enviar mensaje
PUT    /api/mensajes/:id/leer       # Marcar como leído
```

### Temporadas

```
GET    /api/temporadas              # Listar temporadas
GET    /api/temporadas/fecha/:fecha # Obtener temporada por fecha
```

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación.

### Login

```http
POST /api/auth/login/vendedor
Content-Type: application/json

{
  "codigo_vendedor": "VEND001",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nombre_completo": "Carlos Rodríguez",
    "codigo_vendedor": "VEND001",
    "email": "carlos@diamondsistem.com"
  }
}
```

### Usar el Token

Incluir el token en el header `Authorization`:

```http
GET /api/vendedores/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 💰 Cálculo de Precios

El sistema calcula precios automáticamente siguiendo esta lógica:

```javascript
// 1. Precio base del paquete
precio_base = paquete.precio_base

// 2. Ajuste por temporada
ajuste_temporada = temporada.ajuste_precio
// Baja: +$0, Media: +$2,000, Alta: +$4,000

// 3. Invitados adicionales
invitados_extra = cantidad - paquete.invitados_minimo
costo_invitados = invitados_extra * precio_por_invitado
// Baja/Media: $52, Alta: $80

// 4. Servicios adicionales
costo_servicios = suma(servicios_adicionales)

// 5. Subtotal
subtotal = precio_base + ajuste_temporada + costo_invitados + costo_servicios

// 6. Aplicar descuento
subtotal_con_descuento = subtotal - descuento

// 7. Impuestos
iva = subtotal_con_descuento * 0.07
tarifa_servicio = subtotal_con_descuento * 0.18

// 8. Total final
total = subtotal_con_descuento + iva + tarifa_servicio
```

### Ejemplo de Cálculo

```http
POST /api/ofertas/calcular
Content-Type: application/json

{
  "paquete_id": 2,
  "fecha_evento": "2025-12-15",
  "cantidad_invitados": 100,
  "servicios_adicionales": [
    { "servicio_id": 5, "cantidad": 1 }
  ],
  "descuento": 500
}
```

**Respuesta:**
```json
{
  "desglose": {
    "paquete": {
      "nombre": "Platinum",
      "precioBase": 7500,
      "ajusteTemporada": 4000,
      "total": 11500
    },
    "invitados": {
      "minimo": 80,
      "contratados": 100,
      "adicionales": 20,
      "precioUnitario": 80,
      "subtotal": 1600
    },
    "serviciosAdicionales": {
      "subtotal": 450
    },
    "subtotalBase": 13550,
    "descuento": 500,
    "subtotalConDescuento": 13050,
    "impuestos": {
      "iva": { "porcentaje": 7, "monto": 913.50 },
      "tarifaServicio": { "porcentaje": 18, "monto": 2349.00 },
      "total": 3262.50
    },
    "totalFinal": 16312.50
  }
}
```

## 🧪 Testing

```bash
# Ejecutar tests (próximamente)
npm test

# Health check
curl http://localhost:5000/health
```

## 📝 Logs

Los logs se muestran en consola en modo desarrollo con colores:
- 🟢 Verde: 2xx (Success)
- 🔵 Cyan: 3xx (Redirect)
- 🟡 Amarillo: 4xx (Client Error)
- 🔴 Rojo: 5xx (Server Error)

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar con nodemon (hot reload)
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio
npm run prisma:seed       # Poblar base de datos
```

## 🚨 Manejo de Errores

La API retorna errores en formato JSON consistente:

```json
{
  "error": "ValidationError",
  "message": "Datos inválidos",
  "details": [
    "El email no es válido",
    "El teléfono es requerido"
  ]
}
```

### Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no existe)
- `409` - Conflict (duplicado)
- `500` - Internal Server Error

## 🔒 Seguridad

- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ JWT con expiración de 7 días
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Sanitización de datos
- ✅ Headers de seguridad
- ✅ Rate limiting (próximamente)

## 📊 Base de Datos

La API se conecta a PostgreSQL. Ver `/database` para:
- `schema.sql` - Estructura de tablas
- `seeds.sql` - Datos iniciales
- `README.md` - Documentación completa

## 🤝 Contribuir

1. Seguir la estructura de carpetas
2. Documentar nuevos endpoints
3. Validar datos de entrada
4. Manejar errores correctamente
5. Usar los helpers de `utils/`

## 📞 Soporte

Para dudas o problemas:
- Ver documentación en `/database`
- Revisar logs en consola
- Verificar variables de entorno

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025  
**Desarrollado por**: DiamondSistem Team

