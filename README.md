# 💎 DiamondSistem

**Sistema Completo de Gestión de Eventos y Contratos para Salón de Banquetes**

## 📖 Descripción

DiamondSistem es un sistema integral que conecta 3 aplicaciones para gestionar eventos, contratos, clientes y vendedores en un salón de banquetes. Incluye:

- 📱 **Portal del Vendedor** - Gestión completa de clientes, ofertas, contratos y pagos
- 👤 **Portal del Cliente** - Acceso personalizado para gestionar su evento
- 💼 **Sistema de Gestión** - Backend robusto con cálculos automáticos y PDFs

## 🎉 Estado Actual: **90% Completo**

### ✅ Funcionalidades Implementadas
- ✅ Autenticación dual (Vendedor + Cliente)
- ✅ Gestión completa de clientes, ofertas y contratos
- ✅ Cálculo automático de precios con temporadas
- ✅ **Nombres descriptivos de eventos** 🎉
  - "XV Años de María - 15 Marzo 2025" en lugar de "CONT-2025-11-0008"
  - Emojis por tipo de evento (👑 💍 🎂 💼 etc.)
  - Detección automática del tipo de evento
- ✅ **Sistema de pagos seguros** 🔐
  - Confirmación paso a paso con checkboxes
  - Anulación de pagos con motivo
  - Reversión automática de montos
  - Auditoría completa
- ✅ **Contador de días para eventos** ⏰
- ✅ **Recordatorio inteligente para clientes** 🔔
  - Alerta automática 30 días antes del evento
  - Verifica playlist, mesas y ajustes pendientes
  - Barra de progreso visual
  - Links directos a cada sección
- ✅ **Panel completo de ajustes del evento** (6 secciones) 🎨
- ✅ **Sistema de playlist musical** 🎵
  - Cliente: Acceso completo (agregar, editar, eliminar)
  - Vendedor: Solo lectura (puede ver preferencias del cliente)
  - Categorías: Favoritas, Prohibidas, Sugerencias
  - Estadísticas en tiempo real
  - Badge visual de "Solo lectura" para vendedores
- ✅ Gestión de mesas e invitados 🪑
- ✅ Chat cliente-vendedor 💬
- ✅ **Versionamiento de contratos** 📋
  - Historial completo de cambios
  - PDFs de cada versión
  - Comparación de precios entre versiones
  - Disponible para cliente y vendedor
- ✅ Generación de PDFs (ofertas y contratos) 📄
- ✅ Búsqueda y filtros avanzados 🔍
- ✅ **Normalización de fechas** 📅
  - Formato YYYY-MM-DD en base de datos
  - Utilidades de conversión automática
  - Prevención de bugs por formatos inconsistentes

### 📚 Documentación Completa
- ✅ Guía de pruebas exhaustiva (90+ tests)
- ✅ Arquitectura del sistema
- ✅ Instrucciones de todas las funcionalidades
- ✅ Checklist de verificación

**👉 Lee [`INDICE_DOCUMENTACION.md`](INDICE_DOCUMENTACION.md) para navegar por toda la documentación**

## 🏗️ Arquitectura del Proyecto

```
DiamondSistem/
├── backend/              # API REST (Node.js + Express + PostgreSQL)
├── frontend/             # Aplicaciones web (React + Vite)
├── database/             # Esquemas SQL y documentación
└── information_general/  # Documentación del negocio
```

## 🚀 Stack Tecnológico

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express v5
- **Base de Datos**: PostgreSQL 14+
- **ORM**: Prisma
- **Autenticación**: JWT + Bcrypt
- **Validación**: Validadores personalizados

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **UI Library**: TailwindCSS
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **PDF**: PDFKit (backend)

### Base de Datos
- **Motor**: PostgreSQL
- **Características**: 
  - 18 tablas relacionales
  - 15+ triggers automáticos
  - Vistas optimizadas
  - 25+ índices para performance
  - Relaciones con integridad referencial

## 📦 Estructura Completa

### Backend (`/backend`)

```
backend/
├── src/
│   ├── routes/          # ✅ Rutas de la API
│   │   ├── auth.routes.js        # ✅ Autenticación completa
│   │   ├── vendedores.routes.js  # 🔄 Por completar
│   │   ├── clientes.routes.js    # 🔄 Por completar
│   │   ├── ofertas.routes.js     # 🔄 Por completar
│   │   ├── contratos.routes.js   # 🔄 Por completar
│   │   └── ... (otras rutas)
│   ├── middleware/      # ✅ Middleware completo
│   │   ├── auth.js            # JWT + Autorización
│   │   ├── errorHandler.js    # Manejo de errores
│   │   └── logger.js          # Logging de requests
│   ├── utils/           # ✅ Utilidades completas
│   │   ├── priceCalculator.js  # Cálculo de precios
│   │   ├── codeGenerator.js    # Generación de códigos
│   │   ├── validators.js       # Validaciones
│   │   ├── jwt.js              # Manejo de JWT
│   │   └── password.js         # Hash de passwords
│   └── server.js        # ✅ Servidor principal
├── package.json         # ✅ Configurado
└── README.md           # ✅ Documentación completa
```

### Base de Datos (`/database`)

```
database/
├── schema.sql          # ✅ Esquema completo con triggers
├── seeds.sql           # ✅ Datos iniciales (paquetes, servicios, temporadas)
├── modelo_datos.md     # ✅ Documentación detallada
├── comandos_utiles.sql # ✅ Consultas útiles
└── README.md          # ✅ Guía de instalación
```

### Documentación (`/information_general`)

- ✅ Descripción de paquetes
- ✅ Lista de servicios
- ✅ Temporadas y precios
- ✅ Lógica de la base de datos
- ✅ Especificaciones de las 3 apps
- ✅ Términos y servicios

## 🎯 Características Principales

### 💰 Sistema de Precios Dinámicos

El sistema calcula precios automáticamente considerando:
1. **Precio base del paquete**
2. **Temporada** (Baja: +$0, Media: +$2K, Alta: +$4K)
3. **Invitados adicionales** ($52 o $80 según temporada)
4. **Servicios adicionales**
5. **Impuestos** (IVA 7% + Service Fee 18%)

### 📋 5 Paquetes Disponibles

| Paquete | Precio Base | Duración | Invitados Mín. |
|---------|-------------|----------|----------------|
| Especial | $3,500 | 4 horas | 80 |
| Platinum | $7,500 | 4 horas | 80 |
| Diamond | $10,500 | 5 horas | 80 |
| Deluxe | $12,500 | 5 horas | 80 |
| Personalizado | $6,000 | Variable | Variable |

### 🔐 Sistema de Autenticación

- **Vendedores**: Login con código + password
- **Clientes**: Login con código de acceso del contrato
- **JWT**: Tokens con expiración de 7 días
- **Seguridad**: Passwords hasheados con bcrypt (10 rounds)

### 📊 Base de Datos Completa

- **16 tablas** perfectamente relacionadas
- **Triggers automáticos** para:
  - Actualizar saldos al registrar pagos
  - Calcular comisiones de vendedores
  - Actualizar timestamps automáticamente
- **Vistas optimizadas** para consultas frecuentes
- **Índices** en campos de búsqueda común

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd DiamondSistem
```

### 2. Instalar Backend

```bash
cd backend
npm install
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb diamondsistem

# Ejecutar esquema
psql -d diamondsistem -f ../database/schema.sql

# Cargar datos iniciales
psql -d diamondsistem -f ../database/seeds.sql
```

### 4. Configurar Variables de Entorno

```bash
# En backend/
copy env.example .env
```

Editar `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/diamondsistem"
JWT_SECRET=tu_secreto_muy_seguro
PORT=5000
```

### 5. Iniciar el Backend

```bash
npm run dev
```

Servidor disponible en: **http://localhost:5000**

## 📚 Documentación

### Backend
- [Backend README](backend/README.md) - Guía completa del API
- API disponible en: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

### Base de Datos
- [Database README](database/README.md) - Guía de instalación
- [Modelo de Datos](database/modelo_datos.md) - Documentación completa
- [Comandos Útiles](database/comandos_utiles.sql) - Consultas frecuentes

### Información del Negocio
- [README General](information_general/README.md) - Lógica del negocio
- [Paquetes](information_general/Paquetes.md) - Descripción de paquetes
- [Servicios](information_general/Servicios.md) - Lista de servicios
- [Temporadas](information_general/temporadas.md) - Temporadas y precios

## 🔌 Endpoints Principales

### Autenticación
```
POST /api/auth/login/vendedor    # Login vendedor
POST /api/auth/login/cliente     # Login cliente
GET  /api/auth/me                # Usuario actual
```

### Ofertas
```
POST /api/ofertas/calcular       # Calcular precio (sin guardar)
POST /api/ofertas                # Crear oferta
PUT  /api/ofertas/:id/aceptar    # Aceptar oferta
```

### Contratos
```
POST /api/contratos              # Crear contrato desde oferta
GET  /api/contratos/:id/pagos    # Ver pagos
```

### Pagos
```
POST /api/pagos                  # Registrar pago
```

## 🎨 Próximos Pasos

### Fase Actual ✅
- [x] Estructura de base de datos completa
- [x] Backend con Express configurado
- [x] Sistema de autenticación JWT
- [x] Calculadora de precios
- [x] Middleware y utilidades
- [x] Rutas básicas creadas

### Fase 2 (En Progreso) 🔄
- [ ] Implementar rutas completas de:
  - Vendedores
  - Clientes
  - Ofertas
  - Contratos
  - Pagos
  - Eventos
  - Solicitudes
- [ ] Testing de endpoints
- [ ] Generación de PDFs

### Fase 3 (Próximamente) 📅
- [ ] Frontend: App Generador de Contratos (Vendedor)
- [ ] Frontend: App Cliente
- [ ] Frontend: Panel Vendedor
- [ ] Sistema de notificaciones
- [ ] Generación de reportes
- [ ] Dashboard de estadísticas

## 💡 Ejemplo de Uso

### 1. Login de Vendedor

```bash
POST http://localhost:5000/api/auth/login/vendedor
{
  "codigo_vendedor": "VEND001",
  "password": "Admin123!"
}
```

### 2. Calcular Precio de Oferta

```bash
POST http://localhost:5000/api/ofertas/calcular
Authorization: Bearer {token}
{
  "paquete_id": 2,
  "fecha_evento": "2025-12-15",
  "cantidad_invitados": 100,
  "servicios_adicionales": [
    { "servicio_id": 1, "cantidad": 1 }
  ]
}
```

### 3. Crear Oferta

```bash
POST http://localhost:5000/api/ofertas
Authorization: Bearer {token}
{
  "cliente_id": 1,
  "paquete_id": 2,
  "fecha_evento": "2025-12-15",
  "hora_inicio": "18:00",
  "hora_fin": "23:00",
  "cantidad_invitados": 100
}
```

## 🤝 Contribuir

1. Seguir la estructura de carpetas establecida
2. Documentar nuevos endpoints
3. Validar datos de entrada
4. Manejar errores correctamente
5. Actualizar documentación

## 📞 Soporte

Para dudas o problemas:
- Ver documentación en cada carpeta
- Revisar ejemplos en `/information_general`
- Consultar logs del servidor

---

**Versión**: 1.0.0  
**Estado**: En Desarrollo Activo 🚧  
**Última actualización**: Noviembre 2025  
**Desarrollado por**: DiamondSistem Team

## 📄 Licencia

ISC License

---

⭐ **¡Gracias por usar DiamondSistem!** ⭐

