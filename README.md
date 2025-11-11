# 💎 DiamondSistem

**Sistema Completo de Gestión de Eventos, Contratos e Inventario para Salón de Banquetes**

## 📖 Descripción

DiamondSistem es un sistema integral de gestión de eventos que conecta múltiples aplicaciones para gestionar contratos, clientes, vendedores, managers, gerentes e inventario en un salón de banquetes. El sistema está diseñado con una arquitectura moderna de micro-frontends, donde cada rol tiene su propia aplicación independiente.

## 🎯 Arquitectura del Sistema

### Micro-Frontends Separados

El sistema está dividido en **5 aplicaciones frontend independientes**, cada una optimizada para su rol específico:

```
┌─────────────────────────────────────────────────────────────┐
│                    DIAMONDSISTEM                            │
│    Sistema de Gestión de Contratos e Inventario para Eventos│
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  FRONTENDS   │◄────►│   BACKEND    │◄────►│  DATABASE    │
│  (5 Apps)    │ HTTP │ Node/Express │ SQL  │  PostgreSQL  │
│              │      │   Port 5000   │      │   Port 5432  │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Aplicaciones Frontend

| Aplicación | Puerto | Rol | Descripción |
|------------|--------|-----|-------------|
| **frontend-vendedor** | 5173 | Vendedor | Gestión completa de clientes, ofertas, contratos y pagos |
| **frontend-cliente** | 5174 | Cliente | Portal personalizado para gestionar su evento |
| **frontend-manager** | 5175 | Manager | Checklist de servicios externos (foto/video, DJ, comida, cake, limosina, hora loca, animador, maestro de ceremonia) |
| **frontend-gerente** | 5176 | Gerente | Dashboard ejecutivo y gestión global del sistema |
| **frontend-inventario** | 5177 | Administración | Gestión de inventario, asignaciones, abastecimiento de salones, historial y pagos |

### Biblioteca Compartida

- **shared/** - Componentes, utilidades y configuración compartida entre todos los frontends

## 🚀 Stack Tecnológico

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express v5
- **Base de Datos**: PostgreSQL 14+
- **ORM**: Prisma
- **Autenticación**: JWT + Bcrypt
- **Validación**: Validadores personalizados
- **Logging**: Winston
- **Seguridad**: Helmet.js, Rate Limiting, CORS
- **Tareas Programadas**: node-cron (asignación automática de inventario)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **UI Library**: TailwindCSS
- **State Management**: Zustand + React Query
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Routing**: React Router v7

### Base de Datos
- **Motor**: PostgreSQL
- **Características**: 
  - 25+ tablas relacionales (incluyendo sistema de inventario)
  - 15+ triggers automáticos
  - Vistas optimizadas
  - 30+ índices para performance
  - Relaciones con integridad referencial
  - Connection pooling configurado

## 📦 Estructura del Proyecto

```
DiamondSistem/
├── backend/                    # API REST (Node.js + Express)
│   ├── src/
│   │   ├── routes/            # Rutas de la API
│   │   │   ├── inventario.routes.js  # Rutas de inventario
│   │   │   ├── auth.routes.js
│   │   │   ├── contratos.routes.js
│   │   │   └── ...
│   │   ├── middleware/         # Auth, errors, security
│   │   ├── utils/             # Utilidades
│   │   │   ├── inventarioCalculator.js  # Cálculo de inventario
│   │   │   └── ...
│   │   ├── jobs/              # Tareas programadas
│   │   │   └── inventarioAutoAsignacion.js
│   │   ├── config/             # Configuración (DB, logger)
│   │   └── server.js          # Servidor principal
│   ├── scripts/               # Scripts de utilidad
│   │   ├── populateInventario.js
│   │   └── abastecerSalones.js
│   ├── prisma/
│   │   └── schema.prisma      # Esquema de base de datos
│   └── package.json
│
├── frontend-vendedor/         # App para vendedores (Puerto 5173)
│   ├── src/
│   │   ├── pages/             # Páginas del vendedor
│   │   ├── components/        # Componentes específicos
│   │   └── utils/             # Utilidades específicas
│   └── vite.config.js
│
├── frontend-cliente/          # App para clientes (Puerto 5174)
│   ├── src/
│   │   ├── pages/             # Páginas del cliente
│   │   ├── components/        # Componentes específicos
│   │   └── utils/             # Utilidades específicas
│   └── vite.config.js
│
├── frontend-manager/          # App para managers (Puerto 5175)
│   ├── src/
│   │   ├── pages/             # Páginas del manager
│   │   └── components/        # Componentes específicos
│   └── vite.config.js
│
├── frontend-gerente/          # App para gerentes (Puerto 5176)
│   ├── src/
│   │   ├── pages/             # Páginas del gerente
│   │   └── components/        # Componentes específicos
│   └── vite.config.js
│
├── frontend-inventario/        # App de Administración (Puerto 5177)
│   ├── src/
│   │   ├── pages/             # Páginas de administración
│   │   │   ├── DashboardInventario.jsx  # Inventario Central
│   │   │   ├── SalonInventario.jsx      # Inventario por Salones
│   │   │   ├── MovimientosInventario.jsx # Historial
│   │   │   ├── PagosAdministracion.jsx  # Gestión de Pagos
│   │   │   └── LoginInventario.jsx
│   │   ├── components/        # Componentes específicos
│   │   └── utils/             # Utilidades específicas
│   └── vite.config.js
│
├── shared/                    # Biblioteca compartida
│   └── src/
│       ├── components/        # Componentes compartidos
│       ├── config/            # Configuración compartida
│       ├── store/             # Estado global (auth)
│       └── utils/             # Utilidades compartidas
│
├── database/                  # Scripts SQL y documentación
│   ├── schema.sql             # Esquema completo
│   ├── seeds.sql              # Datos iniciales
│   ├── seeds_inventario.sql   # Items de inventario
│   ├── init_inventario_central.sql
│   ├── create_usuario_inventario.sql
│   └── migrations/            # Migraciones SQL
│
├── SETUP_INVENTARIO.md        # Guía de setup de inventario
└── information_general/       # Documentación del negocio
```

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

#### Autenticación y Seguridad
- ✅ Autenticación multi-rol (Vendedor, Cliente, Manager, Gerente, Inventario)
- ✅ JWT con expiración configurable
- ✅ Passwords hasheados con bcrypt
- ✅ Middleware de autorización por rol
- ✅ Rate limiting y protección CORS

#### Gestión de Contratos
- ✅ Creación de ofertas con cálculo automático de precios
- ✅ Wizard paso a paso para crear/editar ofertas
- ✅ Validación de disponibilidad de salones (con buffer de 1 hora)
- ✅ Conversión de ofertas a contratos
- ✅ Versionamiento de contratos con historial completo
- ✅ Generación de PDFs de contratos y ofertas
- ✅ Códigos de acceso únicos para clientes
- ✅ Cálculo automático de comisiones de vendedores

#### Sistema de Pagos
- ✅ Registro de pagos con múltiples métodos
- ✅ Historial completo de pagos
- ✅ Cálculo automático de saldos pendientes
- ✅ Planes de pago personalizados
- ✅ Confirmación paso a paso con validaciones
- ✅ Anulación de pagos con auditoría
- ✅ Sistema de comisiones (3% dividido en 2 pagos de 1.5%)
  - Primera mitad (1.5%): Se desbloquea con $500 reserva + $500 adicionales en 10 días
  - Segunda mitad (1.5%): Se desbloquea al pagar 50% del contrato
  - Pagos parciales de comisiones (permite pagar montos menores al total)
  - Reversión de pagos de comisiones
  - Generación de PDFs de resúmenes mensuales

#### Portal del Cliente
- ✅ Dashboard personalizado con información del evento
- ✅ Gestión de ajustes del evento (menú, decoración, pastel, bar)
- ✅ Sistema de playlist musical (YouTube/Spotify)
- ✅ Asignación de mesas e invitados
- ✅ Chat con el vendedor
- ✅ Solicitudes de cambios al contrato
- ✅ Visualización de imágenes dinámicas según selecciones
- ✅ Historial de pagos y contratos

#### Portal del Vendedor
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de clientes
- ✅ Creación y edición de ofertas (wizard paso a paso)
- ✅ Gestión de contratos y pagos
- ✅ Calendario mensual de eventos
- ✅ Chat con clientes
- ✅ Reportes y exportación de datos
- ✅ Validación de disponibilidad en tiempo real

#### Portal del Manager
- ✅ Checklist de servicios externos por evento
- ✅ Gestión de 9 servicios: Foto y Video, DJ, Comida, Cake, Mini Postres, Limosina, Hora Loca, Animador, Maestro de Ceremonia
- ✅ Seguimiento de estado (Pendiente/Completado)
- ✅ Registro de fecha de contacto y fecha de pago
- ✅ Notas adicionales por servicio
- ✅ Hora de recogida para servicio de limosina
- ✅ Filtrado por salón (Diamond, Kendall, Doral) y mes
- ✅ Vista expandible de detalles del evento

#### Portal del Gerente
- ✅ Dashboard ejecutivo con métricas globales
- ✅ Gestión de vendedores
- ✅ Visualización de todos los contratos y ofertas
- ✅ Vista de trabajo de managers por salón y mes
- ✅ Seguimiento de servicios externos (pendientes/completados)
- ✅ Reportes de pagos
- ✅ **Gestión de Comisiones**: Visualización y descarga de resúmenes
  - Vista de todas las comisiones (pendientes y pagadas) por vendedor
  - Filtrado por mes y año
  - Descarga de PDFs de resúmenes de comisiones
  - Detalles de contratos que desbloquearon comisiones
  - Seguimiento de pagos parciales y completos
- ✅ Calendario de eventos

#### Sistema de Administración (App Administración)
- ✅ **Inventario Central**: Gestión completa del almacén central
  - Catálogo completo de items (bebidas, vajilla, decoración, etc.)
  - Añadir, editar y eliminar items
  - Edición de cantidades mínimas (central y por salón)
  - Descarga de PDFs de inventario (Central, Diamond, Kendall, Doral)
  - Alertas de stock bajo
  - Transferencias a salones
  - Abastecimiento masivo

- ✅ **Inventario por Salones**: Gestión por salón individual
  - Vista detallada por salón (Diamond, Kendall, Doral)
  - Filtrado por mes y año
  - Asignación de inventario a eventos
  - Devolución de inventario desde eventos
  - Retorno de inventario a central
  - Edición manual de asignaciones
  - Cancelación de asignaciones

- ✅ **Historial**: Registro completo de movimientos
  - Filtrado por salón y mes/año
  - Vista de Inventario Central (asignaciones, devoluciones, compras, modificaciones)
  - Vista por Salón (asignaciones a eventos, transferencias)
  - Agrupación por tipo de movimiento (colapsable)
  - Detalles de cada movimiento (item, cantidad, motivo, usuario, fecha)

- ✅ **Gestión de Pagos**: Administración de pagos de contratos
  - Vista de contratos por salón (Diamond, Kendall, Doral)
  - Filtrado por mes y año
  - Registro de pagos
  - Envío de contratos por email
  - Recordatorios de pago
  - Historial de pagos por contrato
  - Cálculo de saldos pendientes

- ✅ **Gestión de Comisiones**: Sistema completo de pagos de comisiones a vendedores
  - Visualización de comisiones desbloqueadas por vendedor
  - Pagos parciales de comisiones (primera y segunda mitad de 1.5% cada una)
  - Registro de pagos de comisiones con validación
  - Reversión de pagos de comisiones en caso de error
  - Filtrado por mes y año
  - Descarga de PDFs de resúmenes de comisiones por mes y vendedor
  - Vista detallada de comisiones pendientes y pagadas
  - Seguimiento de contratos que desbloquearon cada comisión

- ✅ **Funcionalidades Automáticas**:
  - Cálculo automático de inventario necesario por evento
  - Asignación automática de inventario (30 días antes del evento)
  - Tareas programadas (node-cron) para asignación automática

#### Optimizaciones
- ✅ Connection pooling para PostgreSQL
- ✅ Paginación server-side en todas las listas
- ✅ Infinite scrolling en frontend
- ✅ React Query con staleTime configurado
- ✅ Índices compuestos en base de datos
- ✅ Transacciones atómicas para operaciones críticas
- ✅ Sanitización y validación de inputs
- ✅ Debounce en búsquedas y validaciones

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js v18 o superior
- PostgreSQL 14 o superior
- npm o yarn

### 1. Clonar el Repositorio

```bash
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos
createdb diamondsistem

# O usando psql
psql -U postgres
CREATE DATABASE diamondsistem;
\q
```

### 3. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo y configurar
cp env.example .env
```

Editar `backend/.env`:
```env
# Base de Datos
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?connection_limit=10"

# JWT
JWT_SECRET=tu_secreto_muy_seguro_aqui
JWT_EXPIRES_IN=7d

# Servidor
PORT=5000
NODE_ENV=development

# CORS (en desarrollo, permite todos los frontends)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177
```

### 4. Inicializar Base de Datos

```bash
# Generar Prisma Client
npx prisma generate

# Aplicar esquema a la base de datos
npx prisma db push

# Cargar datos iniciales
psql -U postgres -d diamondsistem -f ../database/seeds.sql
```

### 5. Configurar Sistema de Inventario

Sigue la guía completa en [SETUP_INVENTARIO.md](SETUP_INVENTARIO.md) para:
- Poblar el catálogo de items
- Inicializar inventario central
- Crear usuario de inventario
- Abastecer salones

**Resumen rápido:**
```bash
# Poblar items de inventario
psql -U postgres -d diamondsistem -f database/seeds_inventario.sql

# Inicializar inventario central
psql -U postgres -d diamondsistem -f database/init_inventario_central.sql

# Crear usuario de inventario
psql -U postgres -d diamondsistem -f database/create_usuario_inventario.sql

# Abastecer salones (desde backend)
cd backend
npm run inventario:abastecer
```

### 6. Instalar Frontends

```bash
# Desde la raíz del proyecto

# Instalar dependencias de shared
cd shared
npm install
cd ..

# Instalar cada frontend
cd frontend-vendedor && npm install && cd ..
cd frontend-cliente && npm install && cd ..
cd frontend-manager && npm install && cd ..
cd frontend-gerente && npm install && cd ..
cd frontend-inventario && npm install && cd ..
```

O usar el script automatizado (Windows PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File instalar-todos-frontends.ps1
```

### 7. Configurar Variables de Entorno de Frontends

Cada frontend necesita un archivo `.env`:

**frontend-vendedor/.env:**
```env
VITE_API_URL=http://localhost:5000
```

**frontend-cliente/.env:**
```env
VITE_API_URL=http://localhost:5000
```

**frontend-manager/.env:**
```env
VITE_API_URL=http://localhost:5000
```

**frontend-gerente/.env:**
```env
VITE_API_URL=http://localhost:5000
```

**frontend-inventario/.env:**
```env
VITE_API_URL=http://localhost:5000
```

## 🏃 Ejecutar el Sistema

### Desarrollo

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```
Backend disponible en: **http://localhost:5000**

#### Terminal 2-6: Frontends

**Vendedor:**
```bash
cd frontend-vendedor
npm run dev
```
Disponible en: **http://localhost:5173**

**Cliente:**
```bash
cd frontend-cliente
npm run dev
```
Disponible en: **http://localhost:5174**

**Manager:**
```bash
cd frontend-manager
npm run dev
```
Disponible en: **http://localhost:5175**

**Gerente:**
```bash
cd frontend-gerente
npm run dev
```
Disponible en: **http://localhost:5176**

**Administración:**
```bash
cd frontend-inventario
npm run dev
```
Disponible en: **http://localhost:5177**

### Scripts Automatizados (Windows)

Para ejecutar todos los frontends a la vez:
```powershell
powershell -ExecutionPolicy Bypass -File ejecutar-todos-frontends.ps1
```

## 🔐 Credenciales de Prueba

### Vendedor
```
Código: ADMIN001
Password: Admin123!
```

### Cliente
```
Código de Acceso: [Generado automáticamente al crear contrato]
```

### Manager
```
Código: MGR001
Password: [Configurado en base de datos]
```

### Gerente
```
Código: GER001
Password: [Configurado en base de datos]
```

### Administración
```
Código: INV001
Password: Inventario123!
```

## 🔌 Endpoints Principales

### Autenticación
```
POST /api/auth/login/vendedor      # Login vendedor
POST /api/auth/login/cliente        # Login cliente
POST /api/auth/login/manager        # Login manager
POST /api/auth/login/gerente        # Login gerente
POST /api/auth/login/inventario     # Login administración
GET  /api/auth/me                   # Usuario actual
```

### Ofertas
```
GET  /api/ofertas                   # Listar ofertas (paginado)
POST /api/ofertas/calcular          # Calcular precio
POST /api/ofertas                   # Crear oferta
PUT  /api/ofertas/:id               # Editar oferta
PUT  /api/ofertas/:id/aceptar       # Aceptar oferta
GET  /api/ofertas/disponibilidad    # Verificar disponibilidad
```

### Contratos
```
GET  /api/contratos                 # Listar contratos (paginado)
POST /api/contratos                 # Crear contrato
GET  /api/contratos/:id             # Detalle de contrato
GET  /api/contratos/:id/pdf         # PDF del contrato
PUT  /api/contratos/:id             # Actualizar contrato
```

### Pagos
```
GET  /api/pagos                     # Listar pagos (paginado)
POST /api/pagos                     # Registrar pago
PUT  /api/pagos/:id/anular          # Anular pago
GET  /api/pagos/contrato/:id        # Pagos de un contrato
```

### Ajustes del Evento
```
GET  /api/ajustes/contrato/:id      # Obtener ajustes
PUT  /api/ajustes/contrato/:id      # Actualizar ajustes
GET  /api/ajustes/contrato/:id/pdf  # PDF de ajustes
```

### Inventario
```
# Inventario Central
GET  /api/inventario/central         # Listar inventario central
PUT  /api/inventario/central/:id     # Actualizar cantidad

# Inventario por Salones
GET  /api/inventario/salones         # Listar inventario por salones
GET  /api/inventario/salones/:id     # Inventario de un salón

# Asignaciones
GET  /api/inventario/asignaciones    # Listar asignaciones
GET  /api/inventario/asignaciones/:id # Detalle de asignación
POST /api/inventario/asignar/:contratoId # Asignar inventario automáticamente
PUT  /api/inventario/asignaciones/:id # Editar asignación

# Cálculos
POST /api/inventario/calcular/:contratoId # Calcular inventario necesario

# Transferencias
POST /api/inventario/transferencia   # Transferir item individual
POST /api/inventario/abastecer-salon # Abastecimiento masivo

# Alertas
GET  /api/inventario/alertas         # Alertas de stock bajo
GET  /api/inventario/contratos-alertas # Contratos que necesitan asignación
```

### Salones
```
GET  /api/salones                   # Listar salones
GET  /api/salones/:id               # Detalle de salón
```

## 🎨 Características de Diseño

### Frontend-Cliente
- Diseño minimalista y profesional
- Visualización optimizada de imágenes
- UX intuitiva y moderna
- Responsive design (móvil, tablet, desktop)

### Frontend-Vendedor
- Dashboard con métricas en tiempo real
- Interfaz de gestión completa
- Calendario interactivo
- Wizard paso a paso para ofertas
- Reportes y exportación

### Frontend-Administración
- **Central**: Dashboard con inventario central, alertas, gestión de items y PDFs
- **Salones**: Gestión por salón con asignaciones, devoluciones y retornos
- **Historial**: Registro completo de movimientos con filtros avanzados
- **Pagos**: Gestión de pagos de contratos con envío de emails y recordatorios
- **Comisiones**: Gestión completa de pagos de comisiones a vendedores
  - Visualización de comisiones desbloqueadas por vendedor
  - Registro de pagos parciales y completos
  - Reversión de pagos en caso de error
  - Descarga de PDFs de resúmenes mensuales
- Abastecimiento masivo con selección múltiple
- Cálculo y asignación automática de inventario
- Interfaz limpia y organizada

### Frontend-Gerente
- **Dashboard**: Métricas globales, estadísticas por vendedor, comisiones desbloqueadas
- **Vendedores**: Gestión completa, visualización de comisiones, eliminación de vendedores
- **Contratos**: Vista detallada de todos los contratos con filtros por salón y mes
- **Ofertas**: Visualización de ofertas, detalles, facturas proforma, ofertas del mismo día
- **Pagos**: Reportes de pagos con filtros por mes y año
- **Comisiones**: Visualización y descarga de resúmenes de comisiones
  - Vista de comisiones pendientes y pagadas por vendedor
  - Filtrado por mes y año
  - Descarga de PDFs de resúmenes completos
  - Detalles de contratos y montos
- **Calendario**: Vista mensual de eventos
- **Trabajo Managers**: Seguimiento de servicios externos por salón y mes

## 🛠️ Desarrollo

### Estructura de Aliases

Todos los frontends usan aliases consistentes:

```javascript
@shared    → ../shared/src
@components → ./src/components
@utils     → ./src/utils
```

### Convenciones de Código

- **Componentes**: PascalCase (ej: `ModalPlanPago.jsx`)
- **Utilidades**: camelCase (ej: `eventNames.js`)
- **Rutas**: kebab-case (ej: `/crear-oferta`)
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE

### Testing

```bash
# Backend
cd backend
npm test

# Frontend (cuando esté configurado)
cd frontend-vendedor
npm test
```

## 📊 Estado del Proyecto

**Versión**: 3.0.0  
**Estado**: ✅ **Producción Ready**  
**Última actualización**: Noviembre 2025

### Completado ✅
- [x] Arquitectura de micro-frontends (5 aplicaciones)
- [x] Backend completo con todas las rutas
- [x] Base de datos optimizada (25+ tablas)
- [x] Autenticación multi-rol (5 roles)
- [x] Sistema de pagos completo
- [x] Portal del cliente
- [x] Portal del vendedor
- [x] Portal del manager (checklist de servicios externos)
- [x] Portal del gerente
- [x] **Sistema de administración completo** 🆕 (Inventario, Historial, Pagos)
- [x] Generación de PDFs
- [x] Chat cliente-vendedor
- [x] Wizard paso a paso para ofertas
- [x] Validación de disponibilidad en tiempo real
- [x] Sistema de comisiones
- [x] Optimizaciones de performance

### En Desarrollo 🔄
- [ ] Emails automáticos
- [ ] Firma digital
- [ ] App móvil (Android/iOS)
- [ ] Reportes avanzados de inventario

## 📚 Documentación Adicional

- [Setup de Inventario](SETUP_INVENTARIO.md) - Guía completa para configurar el sistema de inventario
- [Arquitectura del Sistema](ARQUITECTURA_SISTEMA.md)
- [Guía de Pruebas](GUIA_PRUEBAS_SISTEMA.md)
- [Índice de Documentación](INDICE_DOCUMENTACION.md)
- [Instrucciones Frontends Separados](INSTRUCCIONES_FRONTENDS_SEPARADOS.md)
- [Optimizaciones Implementadas](OPTIMIZACIONES_IMPLEMENTADAS.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para dudas o problemas:
- Revisar la documentación en cada carpeta
- Consultar los logs del servidor
- Verificar las variables de entorno
- Revisar [SETUP_INVENTARIO.md](SETUP_INVENTARIO.md) para problemas de inventario

## 📄 Licencia

ISC License

---

⭐ **¡Gracias por usar DiamondSistem!** ⭐

**Desarrollado con 💎 para gestionar eventos especiales**
