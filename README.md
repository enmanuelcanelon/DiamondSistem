# 💎 DiamondSistem

**Sistema Completo de Gestión de Eventos y Contratos para Salón de Banquetes**

## 📖 Descripción

DiamondSistem es un sistema integral de gestión de eventos que conecta múltiples aplicaciones para gestionar contratos, clientes, vendedores, managers y gerentes en un salón de banquetes. El sistema está diseñado con una arquitectura moderna de micro-frontends, donde cada rol tiene su propia aplicación independiente.

## 🎯 Arquitectura del Sistema

### Micro-Frontends Separados

El sistema está dividido en **4 aplicaciones frontend independientes**, cada una optimizada para su rol específico:

```
┌─────────────────────────────────────────────────────────────┐
│                    DIAMONDSISTEM                            │
│         Sistema de Gestión de Contratos para Eventos       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  FRONTENDS   │◄────►│   BACKEND    │◄────►│  DATABASE    │
│  (4 Apps)    │ HTTP │ Node/Express │ SQL  │  PostgreSQL  │
│              │      │   Port 5000   │      │   Port 5432  │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Aplicaciones Frontend

| Aplicación | Puerto | Rol | Descripción |
|------------|--------|-----|-------------|
| **frontend-vendedor** | 5173 | Vendedor | Gestión completa de clientes, ofertas, contratos y pagos |
| **frontend-cliente** | 5174 | Cliente | Portal personalizado para gestionar su evento |
| **frontend-manager** | 5175 | Manager | Checklist de servicios externos (limosina, hora loca, etc.) |
| **frontend-gerente** | 5176 | Gerente | Dashboard ejecutivo y gestión global del sistema |

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
  - 18+ tablas relacionales
  - 15+ triggers automáticos
  - Vistas optimizadas
  - 25+ índices para performance
  - Relaciones con integridad referencial
  - Connection pooling configurado

## 📦 Estructura del Proyecto

```
DiamondSistem/
├── backend/                    # API REST (Node.js + Express)
│   ├── src/
│   │   ├── routes/            # Rutas de la API
│   │   ├── middleware/         # Auth, errors, security
│   │   ├── utils/             # Utilidades (PDF, cálculos, etc.)
│   │   ├── config/             # Configuración (DB, logger)
│   │   └── server.js          # Servidor principal
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
├── shared/                    # Biblioteca compartida
│   └── src/
│       ├── components/        # Componentes compartidos
│       ├── config/            # Configuración compartida
│       ├── store/             # Estado global (auth)
│       └── utils/              # Utilidades compartidas
│
├── database/                  # Scripts SQL y documentación
│   ├── schema.sql             # Esquema completo
│   ├── seeds.sql              # Datos iniciales
│   └── migrations/            # Migraciones SQL
│
└── information_general/       # Documentación del negocio
```

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

#### Autenticación y Seguridad
- ✅ Autenticación multi-rol (Vendedor, Cliente, Manager, Gerente)
- ✅ JWT con expiración configurable
- ✅ Passwords hasheados con bcrypt
- ✅ Middleware de autorización por rol
- ✅ Rate limiting y protección CORS

#### Gestión de Contratos
- ✅ Creación de ofertas con cálculo automático de precios
- ✅ Conversión de ofertas a contratos
- ✅ Versionamiento de contratos con historial completo
- ✅ Generación de PDFs de contratos y ofertas
- ✅ Códigos de acceso únicos para clientes

#### Sistema de Pagos
- ✅ Registro de pagos con múltiples métodos
- ✅ Historial completo de pagos
- ✅ Cálculo automático de saldos pendientes
- ✅ Confirmación paso a paso con validaciones
- ✅ Anulación de pagos con auditoría

#### Portal del Cliente
- ✅ Dashboard personalizado con información del evento
- ✅ Gestión de ajustes del evento (menú, decoración, pastel, bar)
- ✅ Sistema de playlist musical (YouTube/Spotify)
- ✅ Asignación de mesas e invitados
- ✅ Chat con el vendedor
- ✅ Solicitudes de cambios al contrato
- ✅ Visualización de imágenes dinámicas según selecciones

#### Portal del Vendedor
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de clientes
- ✅ Creación y edición de ofertas
- ✅ Gestión de contratos y pagos
- ✅ Calendario mensual de eventos
- ✅ Chat con clientes
- ✅ Reportes y exportación de datos

#### Portal del Manager
- ✅ Checklist de servicios externos
- ✅ Seguimiento de limosina, hora loca, animador, chef
- ✅ Resumen de estados y progreso
- ✅ Gestión de contactos y notas

#### Portal del Gerente
- ✅ Dashboard ejecutivo con métricas globales
- ✅ Gestión de vendedores
- ✅ Visualización de todos los contratos y ofertas
- ✅ Reportes de pagos
- ✅ Calendario de eventos

#### Optimizaciones
- ✅ Connection pooling para PostgreSQL
- ✅ Paginación server-side en todas las listas
- ✅ Infinite scrolling en frontend
- ✅ React Query con staleTime configurado
- ✅ Índices compuestos en base de datos
- ✅ Transacciones atómicas para operaciones críticas
- ✅ Sanitización y validación de inputs

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js v18 o superior
- PostgreSQL 14 o superior
- npm o yarn

### 1. Clonar el Repositorio

```bash
git clone <repo-url>
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
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

### 4. Inicializar Base de Datos

```bash
# Generar Prisma Client
npx prisma generate

# Aplicar esquema a la base de datos
npx prisma db push

# (Opcional) Cargar datos iniciales
psql -U postgres -d diamondsistem -f ../database/seeds.sql
```

### 5. Instalar Frontends

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
```

O usar el script automatizado (Windows PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File instalar-todos-frontends.ps1
```

### 6. Configurar Variables de Entorno de Frontends

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

## 🏃 Ejecutar el Sistema

### Desarrollo

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```
Backend disponible en: **http://localhost:5000**

#### Terminal 2-5: Frontends

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

## 📚 Documentación Adicional

- [Arquitectura del Sistema](ARQUITECTURA_SISTEMA.md)
- [Guía de Pruebas](GUIA_PRUEBAS_SISTEMA.md)
- [Índice de Documentación](INDICE_DOCUMENTACION.md)
- [Instrucciones Frontends Separados](INSTRUCCIONES_FRONTENDS_SEPARADOS.md)
- [Optimizaciones Implementadas](OPTIMIZACIONES_IMPLEMENTADAS.md)

## 🔌 Endpoints Principales

### Autenticación
```
POST /api/auth/login/vendedor    # Login vendedor
POST /api/auth/login/cliente      # Login cliente
POST /api/auth/login/manager      # Login manager
POST /api/auth/login/gerente      # Login gerente
GET  /api/auth/me                 # Usuario actual
```

### Ofertas
```
GET  /api/ofertas                 # Listar ofertas (paginado)
POST /api/ofertas/calcular        # Calcular precio
POST /api/ofertas                 # Crear oferta
PUT  /api/ofertas/:id             # Editar oferta
PUT  /api/ofertas/:id/aceptar      # Aceptar oferta
```

### Contratos
```
GET  /api/contratos               # Listar contratos (paginado)
POST /api/contratos               # Crear contrato
GET  /api/contratos/:id           # Detalle de contrato
GET  /api/contratos/:id/pdf       # PDF del contrato
```

### Pagos
```
GET  /api/pagos                   # Listar pagos (paginado)
POST /api/pagos                   # Registrar pago
PUT  /api/pagos/:id/anular        # Anular pago
```

### Ajustes del Evento
```
GET  /api/ajustes/contrato/:id    # Obtener ajustes
PUT  /api/ajustes/contrato/:id    # Actualizar ajustes
GET  /api/ajustes/contrato/:id/pdf # PDF de ajustes
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
- Reportes y exportación

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

**Versión**: 2.0.0  
**Estado**: ✅ **Producción Ready**  
**Última actualización**: Enero 2025

### Completado ✅
- [x] Arquitectura de micro-frontends
- [x] Backend completo con todas las rutas
- [x] Base de datos optimizada
- [x] Autenticación multi-rol
- [x] Sistema de pagos
- [x] Portal del cliente
- [x] Portal del vendedor
- [x] Portal del manager
- [x] Portal del gerente
- [x] Generación de PDFs
- [x] Chat cliente-vendedor
- [x] Optimizaciones de performance

### En Desarrollo 🔄
- [ ] Emails automáticos
- [ ] Firma digital
- [ ] App móvil (Android/iOS)

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

## 📄 Licencia

ISC License

---

⭐ **¡Gracias por usar DiamondSistem!** ⭐

**Desarrollado con 💎 para gestionar eventos especiales**

- [Optimizaciones Implementadas](OPTIMIZACIONES_IMPLEMENTADAS.md)

## 🔌 Endpoints Principales

### Autenticación
```
POST /api/auth/login/vendedor    # Login vendedor
POST /api/auth/login/cliente      # Login cliente
POST /api/auth/login/manager      # Login manager
POST /api/auth/login/gerente      # Login gerente
GET  /api/auth/me                 # Usuario actual
```

### Ofertas
```
GET  /api/ofertas                 # Listar ofertas (paginado)
POST /api/ofertas/calcular        # Calcular precio
POST /api/ofertas                 # Crear oferta
PUT  /api/ofertas/:id             # Editar oferta
PUT  /api/ofertas/:id/aceptar      # Aceptar oferta
```

### Contratos
```
GET  /api/contratos               # Listar contratos (paginado)
POST /api/contratos               # Crear contrato
GET  /api/contratos/:id           # Detalle de contrato
GET  /api/contratos/:id/pdf       # PDF del contrato
```

### Pagos
```
GET  /api/pagos                   # Listar pagos (paginado)
POST /api/pagos                   # Registrar pago
PUT  /api/pagos/:id/anular        # Anular pago
```

### Ajustes del Evento
```
GET  /api/ajustes/contrato/:id    # Obtener ajustes
PUT  /api/ajustes/contrato/:id    # Actualizar ajustes
GET  /api/ajustes/contrato/:id/pdf # PDF de ajustes
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
- Reportes y exportación

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

**Versión**: 2.0.0  
**Estado**: ✅ **Producción Ready**  
**Última actualización**: Enero 2025

### Completado ✅
- [x] Arquitectura de micro-frontends
- [x] Backend completo con todas las rutas
- [x] Base de datos optimizada
- [x] Autenticación multi-rol
- [x] Sistema de pagos
- [x] Portal del cliente
- [x] Portal del vendedor
- [x] Portal del manager
- [x] Portal del gerente
- [x] Generación de PDFs
- [x] Chat cliente-vendedor
- [x] Optimizaciones de performance

### En Desarrollo 🔄
- [ ] Emails automáticos
- [ ] Firma digital
- [ ] App móvil (Android/iOS)

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

## 📄 Licencia

ISC License

---

⭐ **¡Gracias por usar DiamondSistem!** ⭐

**Desarrollado con 💎 para gestionar eventos especiales**

- [Optimizaciones Implementadas](OPTIMIZACIONES_IMPLEMENTADAS.md)

## 🔌 Endpoints Principales

### Autenticación
```
POST /api/auth/login/vendedor    # Login vendedor
POST /api/auth/login/cliente      # Login cliente
POST /api/auth/login/manager      # Login manager
POST /api/auth/login/gerente      # Login gerente
GET  /api/auth/me                 # Usuario actual
```

### Ofertas
```
GET  /api/ofertas                 # Listar ofertas (paginado)
POST /api/ofertas/calcular        # Calcular precio
POST /api/ofertas                 # Crear oferta
PUT  /api/ofertas/:id             # Editar oferta
PUT  /api/ofertas/:id/aceptar      # Aceptar oferta
```

### Contratos
```
GET  /api/contratos               # Listar contratos (paginado)
POST /api/contratos               # Crear contrato
GET  /api/contratos/:id           # Detalle de contrato
GET  /api/contratos/:id/pdf       # PDF del contrato
```

### Pagos
```
GET  /api/pagos                   # Listar pagos (paginado)
POST /api/pagos                   # Registrar pago
PUT  /api/pagos/:id/anular        # Anular pago
```

### Ajustes del Evento
```
GET  /api/ajustes/contrato/:id    # Obtener ajustes
PUT  /api/ajustes/contrato/:id    # Actualizar ajustes
GET  /api/ajustes/contrato/:id/pdf # PDF de ajustes
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
- Reportes y exportación

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

**Versión**: 2.0.0  
**Estado**: ✅ **Producción Ready**  
**Última actualización**: Enero 2025

### Completado ✅
- [x] Arquitectura de micro-frontends
- [x] Backend completo con todas las rutas
- [x] Base de datos optimizada
- [x] Autenticación multi-rol
- [x] Sistema de pagos
- [x] Portal del cliente
- [x] Portal del vendedor
- [x] Portal del manager
- [x] Portal del gerente
- [x] Generación de PDFs
- [x] Chat cliente-vendedor
- [x] Optimizaciones de performance

### En Desarrollo 🔄
- [ ] Emails automáticos
- [ ] Firma digital
- [ ] App móvil (Android/iOS)

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

## 📄 Licencia

ISC License

---

⭐ **¡Gracias por usar DiamondSistem!** ⭐

**Desarrollado con 💎 para gestionar eventos especiales**
