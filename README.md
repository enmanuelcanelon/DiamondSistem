# DiamondSistem 🎉

Sistema de Gestión de Eventos y Contratos

## 📚 Documentación

La documentación completa del proyecto está organizada en la carpeta [`docs/`](./docs/):

### 📖 Guías de Usuario
- [Inicio Rápido](./docs/INICIO_RAPIDO.md)

- [Portal Cliente](./docs/PORTAL_CLIENTE_INSTRUCCIONES.md)


### ⚙️ Configuración
- [Usuarios del Sistema](./docs/USUARIOS_SISTEMA.md)
- [Sistema de Pagos](./docs/SISTEMA_PAGOS_RESUMEN.md)
- [Sistema de Comisiones](./docs/SISTEMA_COMISIONES.md)
- [Configuración de Emails](./docs/CONFIGURACION_EMAILS.md)

### 📱 Omnichannel
- [Guía para Agentes IA](./agente.md) - Estado completo del proyecto y tareas pendientes

### 📁 Estructura del Proyecto

```
DiamondSistem/
├── backend/           # API REST (Node.js + Express + Prisma)
├── frontend-cliente/  # Portal del cliente
├── frontend-gerente/  # Panel del gerente
├── frontend-manager/  # Panel del manager
├── frontend-vendedor/ # Panel del vendedor
├── frontend-administrador/ # Panel del administrador
├── shared/            # Componentes y utilidades compartidos
├── database/          # Scripts y configuración de base de datos
└── docs/              # 📚 Documentación organizada
    ├── user-guide/    # Guías para usuarios finales
    ├── development/   # Documentación técnica
    ├── deployment/    # Guías de deployment
    └── archive/       # Documentación histórica
```

## 🚀 Inicio Rápido

1. **Instalación**: Consulta [Inicio Rápido](./docs/INICIO_RAPIDO.md)

## 📋 Características Principales

- ✅ Gestión completa de contratos y eventos
- ✅ Sistema de pagos y comisiones
- ✅ Portal cliente intuitivo
- ✅ Panel administrativo completo
- ✅ Integración con Google Calendar
- ✅ Sistema de inventario automático
- ✅ Chat en tiempo real
- ✅ Generación automática de PDFs
- ✅ **Sistema Omnichannel de Comunicaciones**
  - 📧 Email completo con Gmail API (Recibidos/Enviados)
  - 💬 WhatsApp Business API con UI de chat
  - 📞 Llamadas vía Twilio (WebRTC)
  - 📱 SMS vía Twilio
  - 📊 Historial unificado de comunicaciones

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS
- **Base de datos**: PostgreSQL
- **Deployment**: Railway, Docker
- **Autenticación**: JWT
- **Comunicación**: WebSockets
- **Omnichannel**: 
  - WhatsApp Business API (Meta Cloud API)
  - Twilio (Llamadas y SMS)
  - Gmail API (Email)

## 📞 Soporte

Para soporte técnico o preguntas, consulta la documentación en [`docs/`](./docs/) o contacta al equipo de desarrollo.

---

**DiamondSistem** - Gestiona tus eventos con estilo y profesionalismo 🎊
