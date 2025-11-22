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
- **Generación de PDFs**: Puppeteer + HTML Templates

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
│   │   │   ├── pdfContratoHTML.js    # Generación PDFs contratos
│   │   │   ├── pdfFacturaHTML.js     # Generación PDFs ofertas
│   │   │   ├── inventarioCalculator.js
│   │   │   └── ...
│   │   ├── templates/         # Templates HTML para PDFs
│   │   │   ├── pdf-contrato.html
│   │   │   ├── pdf-contrato-diamond.html
│   │   │   ├── pdf-factura.html
│   │   │   └── pdf-factura-diamond.html
│   │   ├── jobs/              # Tareas programadas
│   │   │   └── inventarioAutoAsignacion.js
│   │   ├── config/             # Configuración (DB, logger)
│   │   └── server.js          # Servidor principal
│   ├── scripts/               # Scripts de utilidad
│   │   ├── limpiar_todo_completo.js  # Limpieza completa BD
│   │   ├── populateInventario.js
│   │   └── abastecerSalones.js
│   ├── prisma/
│   │   └── schema.prisma      # Esquema de base de datos
│   └── package.json
│
├── frontend-vendedor/         # App para vendedores (Puerto 5173)
├── frontend-cliente/          # App para clientes (Puerto 5174)
├── frontend-manager/          # App para managers (Puerto 5175)
├── frontend-gerente/          # App para gerentes (Puerto 5176)
├── frontend-inventario/        # App de Administración (Puerto 5177)
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
│   └── migrations/            # Migraciones SQL
│
└── README.md                  # Este archivo
```

## 🚀 Instalación y Configuración

### 📋 Requisitos Previos

#### Windows
- **Node.js** v18 o superior: [Descargar](https://nodejs.org/)
- **PostgreSQL** 14 o superior: [Descargar](https://www.postgresql.org/download/windows/)
- **Git**: [Descargar](https://git-scm.com/download/win)
- **PowerShell** (incluido en Windows 10/11)

#### Mac
- **Homebrew**: Gestor de paquetes para Mac
- **Node.js** v18 o superior
- **PostgreSQL** 14 o superior
- **Git** (generalmente incluido)

---

## 🪟 Instalación en Windows (Paso a Paso)

### Paso 1: Instalar Node.js y PostgreSQL

1. **Instalar Node.js:**
   - Descarga desde: https://nodejs.org/
   - Instala la versión LTS (recomendada)
   - Verifica la instalación:
   ```powershell
   node --version
   npm --version
   ```

2. **Instalar PostgreSQL:**
   - Descarga desde: https://www.postgresql.org/download/windows/
   - Durante la instalación, configura:
     - Usuario: `postgres`
     - Contraseña: `root` (o la que prefieras, recuerda guardarla)
     - Puerto: `5432` (por defecto)
   - Verifica la instalación:
   ```powershell
   psql --version
   ```

### Paso 2: Clonar el Repositorio

```powershell
cd Desktop
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

### Paso 3: Configurar PostgreSQL

1. **Abrir SQL Shell (psql):**
   - Busca "SQL Shell (psql)" en el menú de inicio
   - Presiona Enter para cada opción (usuario, servidor, puerto, base de datos)
   - Ingresa la contraseña que configuraste

2. **Crear la base de datos:**
   ```sql
   CREATE DATABASE diamondsistem;
   \q
   ```

### Paso 4: Configurar Backend

```powershell
cd backend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo
copy env.example .env
```

3. **Editar `backend/.env`:**
   ```env
   # Base de Datos
   DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?connection_limit=10"
   
   # JWT
   JWT_SECRET=tu_secreto_muy_seguro_aqui_cambiar_en_produccion
   JWT_EXPIRES_IN=7d
   
   # Servidor
   PORT=5000
   NODE_ENV=development
   
   # CORS (en desarrollo, permite todos los frontends)
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177
   ```

### Paso 5: Inicializar Base de Datos

```powershell
# Generar Prisma Client
npx prisma generate

# Aplicar esquema a la base de datos
npx prisma db push

# Cargar datos iniciales (paquetes, servicios, temporadas, vendedores)
psql -U postgres -d diamondsistem -f ..\database\seeds.sql
```

**Nota:** Si `psql` no está en el PATH, usa la ruta completa:
```powershell
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d diamondsistem -f ..\database\seeds.sql
```

### Paso 6: Configurar Sistema de Inventario (Opcional)

```powershell
# Poblar items de inventario
psql -U postgres -d diamondsistem -f ..\database\seeds_inventario.sql

# Inicializar inventario central
psql -U postgres -d diamondsistem -f ..\database\init_inventario_central.sql

# Crear usuario de inventario
psql -U postgres -d diamondsistem -f ..\database\create_usuario_inventario.sql
```

### Paso 7: Instalar Frontends

**Opción A: Script Automatizado (Recomendado)**
```powershell
# Desde la raíz del proyecto
powershell -ExecutionPolicy Bypass -File instalar-todos-frontends.ps1
```

**Opción B: Manual**
```powershell
# Instalar shared primero
cd shared
npm install
cd ..

# Instalar cada frontend
cd frontend-vendedor
npm install
cd ..

cd frontend-cliente
npm install
cd ..

cd frontend-manager
npm install
cd ..

cd frontend-gerente
npm install
cd ..

cd frontend-inventario
npm install
cd ..
```

### Paso 8: Configurar Variables de Entorno de Frontends

Cada frontend necesita un archivo `.env` en su carpeta:

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

---

## 🍎 Instalación en Mac (Paso a Paso)

### Paso 1: Instalar Homebrew (si no está instalado)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Paso 2: Instalar Node.js y PostgreSQL

```bash
# Instalar Node.js
brew install node@18

# Instalar PostgreSQL
brew install postgresql@14

# Iniciar PostgreSQL
brew services start postgresql@14
```

### Paso 3: Clonar el Repositorio

```bash
cd ~/Desktop
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

### Paso 4: Configurar PostgreSQL

```bash
# Crear base de datos
psql postgres
```

Dentro de psql:
```sql
CREATE DATABASE diamondsistem;
\q
```

### Paso 5: Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo
cp env.example .env
```

Editar `backend/.env`:
```env
# Base de Datos
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/diamondsistem?connection_limit=10"

# JWT
JWT_SECRET=tu_secreto_muy_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# Servidor
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177
```

### Paso 6: Inicializar Base de Datos

```bash
# Generar Prisma Client
npx prisma generate

# Aplicar esquema
npx prisma db push

# Cargar datos iniciales
psql -U postgres -d diamondsistem -f ../database/seeds.sql
```

### Paso 7: Configurar Sistema de Inventario (Opcional)

```bash
# Poblar items de inventario
psql -U postgres -d diamondsistem -f ../database/seeds_inventario.sql

# Inicializar inventario central
psql -U postgres -d diamondsistem -f ../database/init_inventario_central.sql

# Crear usuario de inventario
psql -U postgres -d diamondsistem -f ../database/create_usuario_inventario.sql
```

### Paso 8: Instalar Frontends

```bash
# Instalar shared primero
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

### Paso 9: Configurar Variables de Entorno de Frontends

Crear archivos `.env` en cada frontend (igual que en Windows).

---

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

---

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

### Administración (Inventario)
```
Código: INV001
Password: Inventario123!
```

---

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
- ✅ **Generación de PDFs profesionales** con Puppeteer
  - PDFs de contratos (Diamond y Revolution)
  - PDFs de ofertas/facturas proforma (Diamond y Revolution)
  - Templates HTML personalizados por compañía
  - Fuente Poppins para Diamond
  - Diseños elegantes y profesionales

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
- ✅ Descarga de PDFs de ofertas y contratos

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
- ✅ **Inventario por Salones**: Gestión por salón individual
- ✅ **Historial**: Registro completo de movimientos
- ✅ **Gestión de Pagos**: Administración de pagos de contratos
- ✅ **Gestión de Comisiones**: Sistema completo de pagos de comisiones

#### Generación de PDFs
- ✅ **PDFs de Contratos**:
  - Template Diamond: Fondo morado oscuro con gradiente, texto blanco, fuente Poppins
  - Template Revolution (Kendall/Doral): Fondo oscuro con imagen, texto blanco
  - Diseño profesional y elegante
  - Incluye términos y condiciones completos
  - Sección de firmas
  
- ✅ **PDFs de Ofertas/Facturas Proforma**:
  - Template Diamond: Fondo beige (#dfd9be) con imagen, texto blanco, fuente Poppins
  - Template Revolution: Fondo con imagen, texto blanco
  - Portada elegante con información del evento
  - Detalles de servicios organizados por categorías
  - Desglose completo de inversión

---

## 🆕 Cambios Recientes (Noviembre 2025)

### Generación de PDFs Mejorada
- ✅ **Templates HTML personalizados** para Diamond y Revolution
- ✅ **Fuente Poppins** implementada en PDFs de Diamond
- ✅ **Texto blanco** en PDFs para mejor legibilidad sobre fondos oscuros
- ✅ **Layout optimizado** para contratos de Revolution (página 1 ajustada)
- ✅ **Fondos personalizados** por compañía (Diamond y Revolution)

### Scripts de Utilidad
- ✅ **Script de limpieza completa**: `limpiar_todo_completo.js`
  - Elimina todos los datos (clientes, contratos, ofertas, leaks)
  - Elimina PDFs guardados en base de datos
  - Reinicia todas las secuencias de IDs a 0
  - Prepara la base de datos para empezar desde cero

### Mejoras de Layout
- ✅ **Contratos Revolution**: Página 1 ajustada para que todo quepa en una sola página
- ✅ Tamaños de fuente optimizados
- ✅ Espaciados ajustados
- ✅ Mejor organización del contenido

---

## 🛠️ Scripts Útiles

### Limpiar Base de Datos Completamente

```bash
# Windows
cd backend
node scripts\limpiar_todo_completo.js

# Mac
cd backend
node scripts/limpiar_todo_completo.js
```

Este script elimina:
- Todos los clientes
- Todos los contratos y datos relacionados
- Todas las ofertas
- Todos los leaks
- Todos los PDFs guardados
- Reinicia todos los IDs a 0

---

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
GET  /api/ofertas/:id/pdf-factura   # Descargar PDF de oferta
GET  /api/ofertas/disponibilidad    # Verificar disponibilidad
```

### Contratos
```
GET  /api/contratos                 # Listar contratos (paginado)
POST /api/contratos                 # Crear contrato
GET  /api/contratos/:id             # Detalle de contrato
GET  /api/contratos/:id/pdf-contrato # Descargar PDF del contrato
GET  /api/contratos/:id/pdf-factura  # Descargar PDF de factura proforma
PUT  /api/contratos/:id             # Actualizar contrato
```

### Pagos
```
GET  /api/pagos                     # Listar pagos (paginado)
POST /api/pagos                     # Registrar pago
PUT  /api/pagos/:id/anular          # Anular pago
GET  /api/pagos/contrato/:id        # Pagos de un contrato
```

### Inventario
```
GET  /api/inventario/central         # Listar inventario central
PUT  /api/inventario/central/:id     # Actualizar cantidad
GET  /api/inventario/salones         # Listar inventario por salones
GET  /api/inventario/asignaciones    # Listar asignaciones
POST /api/inventario/asignar/:contratoId # Asignar inventario automáticamente
```

---

## 🛠️ Solución de Problemas

### Windows

#### Error: "psql no se reconoce como comando"
**Solución:** Agrega PostgreSQL al PATH o usa la ruta completa:
```powershell
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d diamondsistem
```

#### Error: "Cannot connect to database"
**Solución:** 
1. Verifica que PostgreSQL esté corriendo
2. Verifica la contraseña en `backend/.env`
3. Verifica que la base de datos exista

#### Error: "Port already in use"
**Solución:**
```powershell
# Encontrar proceso en puerto 5000
netstat -ano | findstr :5000

# Matar proceso (reemplaza PID con el número que aparezca)
taskkill /PID [PID] /F
```

### Mac

#### Error: "Cannot find module"
**Solución:**
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Error: "Port already in use"
**Solución:**
```bash
# Encontrar y matar el proceso
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

#### Error de conexión a PostgreSQL
**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
brew services list | grep postgresql

# Reiniciar PostgreSQL
brew services restart postgresql@14
```

---

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
- [x] Portal del manager
- [x] Portal del gerente
- [x] Sistema de administración completo (Inventario, Historial, Pagos)
- [x] Generación de PDFs profesionales (contratos y ofertas)
- [x] Chat cliente-vendedor
- [x] Wizard paso a paso para ofertas
- [x] Validación de disponibilidad en tiempo real
- [x] Sistema de comisiones
- [x] Optimizaciones de performance
- [x] Scripts de limpieza y utilidad

---

## 📚 Documentación Adicional

- [Setup de Inventario](SETUP_INVENTARIO.md) - Guía completa para configurar el sistema de inventario
- [Arquitectura del Sistema](ARQUITECTURA_SISTEMA.md)
- [Guía de Pruebas](GUIA_PRUEBAS_SISTEMA.md)
- [Índice de Documentación](INDICE_DOCUMENTACION.md)
- [Instrucciones Frontends Separados](INSTRUCCIONES_FRONTENDS_SEPARADOS.md)
- [Optimizaciones Implementadas](OPTIMIZACIONES_IMPLEMENTADAS.md)
- [Guía de Instalación Mac](GUIA_INSTALACION_MAC.md)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Para dudas o problemas:
- Revisar la documentación en cada carpeta
- Consultar los logs del servidor
- Verificar las variables de entorno
- Revisar [SETUP_INVENTARIO.md](SETUP_INVENTARIO.md) para problemas de inventario

---

## 📄 Licencia

ISC License

---

⭐ **¡Gracias por usar DiamondSistem!** ⭐

**Desarrollado con 💎 para gestionar eventos especiales**
