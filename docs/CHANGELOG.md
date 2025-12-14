# 📋 Changelog - DiamondSistem

Todos los cambios notables del proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [3.2.0] - 2025-11-27

### 🔒 Seguridad
- **Refresh Tokens JWT**: Implementación completa de sistema de refresh tokens
  - Access tokens de corta duración (15 minutos)
  - Refresh tokens de larga duración (7 días)
  - Endpoints `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all`
  - Nuevos endpoints v2 para login con refresh tokens
- **Generación de códigos seguros**: Migración de `Math.random()` a `crypto.randomBytes()` en:
  - Códigos de contrato
  - Códigos de acceso de cliente
  - Códigos de vendedor
- **Validación de ENCRYPTION_KEY**: Error obligatorio en producción si no está configurada
- **Mejoras en CORS**: Validación más estricta de orígenes permitidos
- **Headers de seguridad**: Configuración mejorada de Helmet.js
  - HSTS habilitado
  - Referrer Policy estricta
  - Upgrade Insecure Requests en producción

### 🔧 Mejorado
- **Logging estructurado**: Reemplazo de ~60 `console.log` por Winston logger en:
  - auth.routes.js, ajustes.routes.js, leaks.routes.js
  - contratos.routes.js, clientes.routes.js, pagos.routes.js, salones.routes.js
  - emailService.js, emails.routes.js
  - dateFormatter.js, inventarioCalculator.js, googleSheetsService.js
  - sincronizarLeaks.js, encryption.js
  - pdfContratoHTML.js, pdfFacturaHTML.js (con función debug() condicional)
- **Índices de base de datos**: Agregado índice compuesto en `contratos_servicios` para optimizar queries

### 🗑️ Eliminado
- Archivos temporales de debug: `temp_check_*.js`

---

## [3.1.0] - 2025-01-XX

### ✨ Añadido
- Migración completa de tabla `vendedores` a `usuarios` unificada
- Sistema de roles unificado (`vendedor`, `gerente`, `manager`, `inventario`)
- Optimizaciones de rendimiento para Supabase:
  - Índices compuestos en tabla `mensajes`
  - Connection pooling optimizado para Supabase (4 conexiones)
  - Caché en memoria para endpoints de estadísticas
  - Batch queries para mensajes no leídos
  - Uso de `select` en lugar de `include` en Prisma queries
- Aumento de tamaño de fuente en PDFs de ofertas (Kendall y Doral)
- Campo "Detalles" para estados `contactado_llamar_luego` y `no_contesta_llamar_luego` en leads
- Opciones "Kids Party" y "Dulces 16" en tipo de evento
- Funcionalidad "Click Outside" para dropdowns y ventanas modales
- Buzón de mensajes en página de gestión de eventos

### 🔄 Cambiado
- **Migración de Autenticación**: Todas las rutas ahora usan tabla `usuarios` con filtro `rol`
- **Backend Routes Migradas**:
  - `auth.routes.js` - Login y registro de vendedores
  - `contratos.routes.js` - Obtención de vendedores
  - `vendedores.routes.js` - CRUD completo de vendedores
  - `googleCalendar.routes.js` - Integración con Google Calendar
  - `comisiones.routes.js` - Cálculo y reportes de comisiones
  - `gerentes.routes.js` - Gestión de vendedores por gerentes
- Reducción de `refetchInterval` en queries de React Query (30s → 2-5min)
- Eliminación de `console.log` de desarrollo en producción
- Optimización de queries N+1 en buzón de mensajes

### 🗑️ Eliminado
- Campo "Dirección" de formularios de creación/edición de clientes
- Campo "Notas del Vendedor" del modal de cambio de estado de leads
- Opción "Todos" del filtro de estado en "Mis Leads"
- Descripción de paquetes en PDFs de ofertas (solo nombre)
- Dependencia de tabla `vendedores` deprecated (mantenida temporalmente para compatibilidad)

### 🐛 Corregido
- Botón "Ver Contrato Completo" aparecía para leads sin contrato
- Hora no visible en detalles de leads (formato 12h AM/PM)
- Campo "detalles" no visible en detalles de leads
- Leads convertidos no visibles en filtros
- Calendario general visible para vendedores (ahora solo para gerentes)
- Referencias a `contratos` antes de inicialización en `GestionEventos.jsx`
- Barra gris de paquetes demasiado larga en `/contratos`

### 🔧 Mejorado
- Código más limpio y optimizado para producción
- Mejor manejo de errores y validaciones
- Performance mejorada con índices y queries optimizadas
- Documentación actualizada y limpiada

---

## [3.0.0] - 2025-11-XX

### ✨ Añadido
- Arquitectura de micro-frontends (5 aplicaciones separadas)
- Sistema completo de inventario
- Portal del cliente con chat, ajustes y solicitudes
- Portal del manager con checklist de servicios externos
- Portal del gerente con dashboard ejecutivo
- Sistema de comisiones con desbloqueo progresivo
- Generación de PDFs profesionales (contratos y ofertas)
- Chat cliente-vendedor en tiempo real
- Wizard paso a paso para creación de ofertas
- Validación de disponibilidad en tiempo real
- Sistema de planes de pago (contado/financiado)
- Asignación automática de inventario
- Historial completo de versiones de contratos

### 🔄 Cambiado
- Separación completa de frontends por rol
- Migración a React 19 y Vite 7
- Optimización de base de datos con índices
- Mejora en generación de PDFs con templates HTML

### 🐛 Corregido
- Múltiples bugs de autenticación y permisos
- Problemas de sincronización de datos
- Errores en cálculos de precios y comisiones

---

## [2.0.0] - 2024-XX-XX

### ✨ Añadido
- Sistema de pagos completo
- Portal del vendedor mejorado
- Sistema de ofertas y contratos

---

## [1.0.0] - 2024-XX-XX

### ✨ Añadido
- Versión inicial del sistema
- Autenticación básica
- Gestión de clientes y contratos básicos

---

[3.2.0]: https://github.com/IamEac/DiamondSistem/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/IamEac/DiamondSistem/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/IamEac/DiamondSistem/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/IamEac/DiamondSistem/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/IamEac/DiamondSistem/releases/tag/v1.0.0

