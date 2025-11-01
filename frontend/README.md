# 🎨 DiamondSistem - Frontend

Sistema de gestión de contratos para eventos - Aplicación del vendedor

## 🚀 Características

- ✅ **Sistema de Autenticación** - Login seguro con JWT
- 📊 **Dashboard Interactivo** - Estadísticas y métricas en tiempo real
- 👥 **Gestión de Clientes** - CRUD completo de clientes
- 💰 **Calculadora de Precios** - Cálculo automático con paquetes, temporadas y servicios
- 📝 **Gestión de Ofertas** - Creación y seguimiento de propuestas
- 📄 **Gestión de Contratos** - Control de contratos y pagos
- 💳 **Registro de Pagos** - Sistema completo de pagos con historial

## 🛠️ Tecnologías

- **React 19** - Framework principal
- **Vite** - Build tool ultra-rápido
- **React Router** - Navegación y rutas
- **TanStack Query** - Gestión de estado del servidor
- **Zustand** - Estado global de la aplicación
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos y diseño responsivo
- **Lucide React** - Iconos modernos

## 📋 Requisitos

- Node.js 18 o superior
- Backend de DiamondSistem corriendo en `http://localhost:5000`

## 🚀 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crea un archivo `.env` en la raíz del directorio frontend:
```env
VITE_API_URL=http://localhost:5000/api
```

3. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📱 Credenciales de Prueba

Para probar la aplicación, usa estas credenciales:

```
Código de Vendedor: ADMIN001
Contraseña: Admin123!
```

## 🎯 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   └── Layout.jsx     # Layout principal con sidebar
│   ├── config/            # Configuración
│   │   └── api.js         # Configuración de Axios
│   ├── pages/             # Páginas de la aplicación
│   │   ├── Login.jsx           # Página de inicio de sesión
│   │   ├── Dashboard.jsx       # Dashboard principal
│   │   ├── Clientes.jsx        # Lista de clientes
│   │   ├── CrearCliente.jsx    # Formulario de cliente
│   │   ├── Ofertas.jsx         # Lista de ofertas
│   │   ├── CrearOferta.jsx     # Formulario de oferta con calculadora
│   │   ├── Contratos.jsx       # Lista de contratos
│   │   └── DetalleContrato.jsx # Detalle y pagos de contrato
│   ├── store/             # Estado global
│   │   └── useAuthStore.js     # Store de autenticación
│   ├── App.jsx            # Componente raíz con rutas
│   ├── main.jsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── public/                # Archivos estáticos
├── .env                   # Variables de entorno (no versionado)
├── index.html             # HTML principal
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
├── postcss.config.js      # Configuración de PostCSS
└── package.json           # Dependencias y scripts
```

## 🔐 Sistema de Autenticación

El sistema utiliza JWT almacenado en `localStorage`. Los tokens se agregan automáticamente a todas las peticiones mediante interceptores de Axios.

### Flujo de Autenticación:
1. Usuario ingresa código de vendedor y contraseña
2. Backend valida y retorna JWT
3. Token se guarda en localStorage
4. Todas las peticiones posteriores incluyen el token
5. Si el token expira, se redirige a login automáticamente

## 📊 Módulos Principales

### 1. Dashboard
- Estadísticas de ventas y comisiones
- Resumen de clientes, ofertas y contratos
- Acciones rápidas
- Métricas en tiempo real

### 2. Clientes
- Lista de todos los clientes
- Búsqueda y filtros
- Crear nuevo cliente con formulario completo
- Ver contratos por cliente

### 3. Ofertas
- Lista de ofertas con estados (pendiente, aceptada, rechazada)
- **Calculadora de Precios Interactiva:**
  - Selección de paquete
  - Ajuste por temporada
  - Servicios adicionales dinámicos
  - Descuentos
  - Cálculo automático de IVA (7%) y servicio (18%)
  - Vista previa en tiempo real
- Filtros por estado
- Conversión a contrato

### 4. Contratos
- Lista de contratos activos
- Estados: activo, completado, cancelado
- Estados de pago: pendiente, parcial, pagado
- Barra de progreso de pagos
- Acceso rápido a detalles

### 5. Detalle de Contrato
- Información completa del evento
- Detalles de paquete y servicios
- Resumen financiero
- **Sistema de Pagos:**
  - Registro de nuevos pagos
  - Historial completo
  - Validación de montos
  - Métodos de pago múltiples
- Código de acceso para cliente
- Descarga de PDF (próximamente)

## 🎨 Diseño UI/UX

### Características de Diseño:
- **Responsivo** - Funciona en móviles, tablets y desktop
- **Sidebar Colapsable** - Navegación adaptable
- **Tema Moderno** - Paleta de colores profesional
- **Animaciones Suaves** - Transiciones fluidas
- **Estados de Carga** - Skeleton loaders
- **Feedback Visual** - Mensajes de éxito/error claros

### Paleta de Colores:
- **Primary:** Indigo (#6366f1)
- **Success:** Green (#10b981)
- **Warning:** Yellow (#f59e0b)
- **Error:** Red (#ef4444)

## 🔌 API Integration

Todos los endpoints del backend están integrados:

```javascript
// Autenticación
POST /api/auth/login/vendedor

// Clientes
GET /api/clientes
POST /api/clientes
GET /api/clientes/:id

// Ofertas
GET /api/ofertas
POST /api/ofertas
POST /api/ofertas/calcular-precio

// Contratos
GET /api/contratos
GET /api/contratos/:id

// Pagos
GET /api/pagos/contrato/:id
POST /api/pagos

// Catálogos
GET /api/paquetes
GET /api/servicios
GET /api/temporadas
```

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Compila para producción
npm run preview      # Vista previa de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## 🚀 Despliegue

### Build de Producción:
```bash
npm run build
```

Esto genera una carpeta `dist/` con los archivos optimizados listos para desplegar.

### Variables de Entorno de Producción:
```env
VITE_API_URL=https://api.tudominio.com/api
```

### Plataformas Recomendadas:
- **Vercel** - Despliegue automático con Git
- **Netlify** - CI/CD integrado
- **AWS S3 + CloudFront** - Alta disponibilidad
- **Nginx** - Servidor tradicional

## 🧪 Testing

Para probar la aplicación completa:

1. **Asegúrate que el backend está corriendo:**
```bash
# En otra terminal
cd ../backend
npm run dev
```

2. **Inicia el frontend:**
```bash
npm run dev
```

3. **Flujo de prueba completo:**
   - Login con credenciales de prueba
   - Crear un nuevo cliente
   - Crear una oferta con calculadora
   - Ver la oferta y aceptarla
   - Crear contrato desde oferta
   - Registrar pagos en el contrato
   - Verificar estadísticas en dashboard

## 🔧 Solución de Problemas

### Error: "Cannot connect to backend"
- Verifica que el backend esté corriendo en `http://localhost:5000`
- Revisa la variable `VITE_API_URL` en `.env`
- Verifica que no haya errores de CORS

### Error: "Token expired"
- Cierra sesión y vuelve a iniciar sesión
- El token JWT expira después de 7 días

### Error de permisos
- Verifica que estés usando un usuario vendedor válido
- Revisa que la base de datos tenga los datos seed

## 📝 Próximas Características

- [ ] Generación de PDF de contratos
- [ ] Envío de ofertas por email
- [ ] Sistema de notificaciones
- [ ] Chat con clientes
- [ ] Calendario de eventos
- [ ] Reportes y analytics
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)

## 📄 Licencia

Todos los derechos reservados © 2025 DiamondSistem

---

**¡Disfruta usando DiamondSistem! 🎉💎**
