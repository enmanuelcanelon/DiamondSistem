# 🤖 Guía para Agentes IA - DiamondSistem

Este documento proporciona información completa sobre el estado actual del proyecto DiamondSistem para que cualquier agente de IA pueda continuar el desarrollo de forma efectiva.

---

## 📊 Estado General del Proyecto

**Última actualización:** 14 de Diciembre 2025  
**Estado:** Producción (90% completo)  
**Versión:** 2.0 con Sistema Omnichannel

---

## 🏗️ Arquitectura del Sistema

### Estructura de Frontends (Separados)

```
frontend-vendedor/      # Panel del vendedor (React + Vite)
frontend-cliente/       # Portal del cliente (React + Vite)
frontend-gerente/       # Panel del gerente (React + Vite)
frontend-manager/       # Panel del manager (React + Vite)
frontend-administrador/ # Panel del administrador (React + Vite)
shared/                 # Componentes y utilidades compartidos
```

### Backend

```
backend/
├── src/
│   ├── routes/         # Endpoints de la API
│   ├── services/       # Lógica de negocio
│   ├── middleware/     # Autenticación, validación, errores
│   ├── utils/          # Utilidades (OAuth, encriptación, etc.)
│   └── config/         # Configuración (DB, etc.)
├── prisma/
│   └── schema.prisma   # Modelo de base de datos
```

### Base de Datos

- **Motor:** PostgreSQL
- **ORM:** Prisma
- **Tablas principales:** usuarios, clientes, contratos, ofertas, pagos, comunicaciones, leaks, etc.

---

## ✅ Funcionalidades Implementadas

### 1. Sistema Core (100% Completo)

- ✅ **Autenticación JWT** - Login/logout en todos los frontends
- ✅ **Gestión de Clientes** - CRUD completo
- ✅ **Gestión de Ofertas** - Crear, editar, aceptar, rechazar
- ✅ **Gestión de Contratos** - Crear desde ofertas, seguimiento
- ✅ **Sistema de Pagos** - Registrar pagos, historial, estados
- ✅ **Cálculo de Precios** - Automático con temporadas y paquetes
- ✅ **Generación de PDFs** - Ofertas y contratos
- ✅ **Chat en tiempo real** - Entre vendedor y cliente
- ✅ **Gestión de Mesas** - Organización de invitados
- ✅ **Playlist Musical** - Favoritas, prohibidas, sugeridas
- ✅ **Ajustes del Evento** - 6 secciones (Torta, Decoración, Menú, etc.)
- ✅ **Sistema de Inventario** - Gestión de salones y recursos
- ✅ **Sistema de Comisiones** - Cálculo automático
- ✅ **Integración Google Calendar** - Sincronización de eventos

### 2. Sistema Omnichannel (Implementado - Diciembre 2025)

#### ✅ TAREA 1: Email - Completada

**Backend:**
- `backend/src/services/gmailService.js` - Soporte para carpetas (inbox/sent)
- `backend/src/routes/comunicaciones.routes.js` - Endpoints de email

**Frontend:**
- `frontend-vendedor/src/components/comunicaciones/EmailPanel.jsx` - **Rediseño completo**
  - Sidebar con carpetas (Recibidos, Enviados, Destacados)
  - Vista de lectura con contenido completo
  - Query para obtener email completo al seleccionar
  - Tabs para alternar entre carpetas
  - Diseño estilo Gmail/Outlook moderno

**Funcionalidades:**
- ✅ Ver bandeja de entrada
- ✅ Ver carpeta de enviados
- ✅ Leer emails completos (con HTML)
- ✅ Enviar emails
- ✅ Responder emails
- ✅ Marcar como leído/no leído

#### ✅ TAREA 2: Historial de Comunicaciones - Completada

**Backend:**
- Endpoints ya existían en `comunicaciones.routes.js`:
  - `GET /api/comunicaciones/historial/:leadId`
  - `GET /api/comunicaciones/historial/cliente/:clienteId`
  - `GET /api/comunicaciones/mis-comunicaciones`

**Frontend:**
- `frontend-vendedor/src/components/comunicaciones/HistorialPanel.jsx` - **Rediseño completo**
  - Cards de estadísticas (Total, Hoy, WhatsApp, Llamadas)
  - Sistema de filtros mejorado (canal, dirección, fechas)
  - Búsqueda en tiempo real
  - Agrupación por fecha (Hoy, Ayer, Esta semana, Mes)
  - Timeline visual con iconos por canal
  - Información completa de cada comunicación

**Funcionalidades:**
- ✅ Ver todas las comunicaciones del vendedor
- ✅ Filtrar por canal (WhatsApp, SMS, Llamadas, Email)
- ✅ Filtrar por dirección (Entrante/Saliente)
- ✅ Filtrar por fechas
- ✅ Estadísticas visuales
- ✅ Búsqueda de comunicaciones

#### ✅ TAREA 3: WhatsApp con UI de Chat - Completada (Pendiente Configuración)

**Backend:**
- `backend/src/routes/comunicaciones.routes.js` - Nuevos endpoints:
  - `GET /api/comunicaciones/whatsapp/conversaciones` - Lista de conversaciones
  - `GET /api/comunicaciones/whatsapp/conversacion/:telefono` - Mensajes de una conversación
  - `POST /api/comunicaciones/whatsapp/enviar` - Enviar mensaje (ya existía)
  - `GET/POST /api/comunicaciones/webhook/whatsapp` - Webhooks de Meta

**Frontend:**
- `frontend-vendedor/src/components/comunicaciones/WhatsAppPanel.jsx` - **UI de Chat completa**
  - Panel izquierdo: Lista de conversaciones con avatares
  - Panel derecho: Chat estilo WhatsApp Web
  - Burbujas de mensaje (verde para enviados, blanco para recibidos)
  - Iconos de estado (✓ enviado, ✓✓ entregado, ✓✓ azul leído)
  - Separadores por fecha
  - Polling en tiempo real (30s conversaciones, 10s mensajes)
  - Responsive (móvil y desktop)

**Funcionalidades:**
- ✅ Ver lista de conversaciones
- ✅ Abrir chat de una conversación
- ✅ Ver historial de mensajes
- ✅ Enviar mensajes
- ✅ Actualización en tiempo real
- ⏳ **PENDIENTE:** Configurar número real en Meta Business Suite

**Servicios:**
- `backend/src/services/whatsappService.js` - Integración con Meta Cloud API
- `frontend-vendedor/src/services/comunicacionesService.js` - Métodos para API

### 3. Comunicaciones - Estado Actual

| Canal | Estado | Notas |
|-------|--------|-------|
| **Email (Gmail)** | ✅ Funciona | Envío, recepción, bandeja completa |
| **WhatsApp** | ⚠️ Parcial | UI completa, falta configurar número real |
| **Llamadas (Twilio)** | ✅ Funciona | WebRTC desde navegador |
| **SMS (Twilio)** | ⏸️ Bloqueado | Requiere verificación 10DLC o Toll-Free |

---

## ⏳ Funcionalidades Pendientes

### 1. WhatsApp - Configuración de Número Real

**Problema Actual:**
- El sistema usa número de prueba: `15551761111`
- No se puede agregar números reales a cuenta de prueba
- El número `+1 786-332-7065` está en otra cuenta sin acceso
- El número `+1 954-466-7108` está en GoHighLevel

**Solución Necesaria:**
1. Obtener acceso a cuenta "Revolution Party Venue" en Meta Business Suite
2. O crear nueva cuenta de WhatsApp Business (no de prueba)
3. Agregar número real (+1 512-337-4935 o +1 786-332-7065)
4. Obtener Phone Number ID
5. Actualizar variable en Railway: `WHATSAPP_PHONE_NUMBER_ID`

**Archivos Involucrados:**
- `backend/src/services/whatsappService.js` - Usa `WHATSAPP_PHONE_NUMBER_ID`
- Variables de entorno en Railway

### 2. WhatsApp - Webhooks para Mensajes Entrantes

**Estado:**
- ✅ Endpoints de webhook creados (`GET/POST /api/comunicaciones/webhook/whatsapp`)
- ⏳ Pendiente configurar en Meta Developer Console

**Configuración Necesaria:**
1. Meta Developer Console → App "Ws-Revolution" → WhatsApp → Configuration
2. Webhook URL: `https://diamondsistem-production.up.railway.app/api/comunicaciones/webhook/whatsapp`
3. Verify Token: `diamondsistem_webhook_2024`
4. Suscribirse a: `messages`

### 3. SMS - Verificación 10DLC

**Problema:**
- Twilio requiere verificación A2P 10DLC para SMS
- El número actual no está verificado

**Opciones:**
1. Registrar 10DLC (proceso largo, requiere verificación de negocio)
2. Comprar número Toll-Free (1-800/1-888) - más rápido (1-5 días)

### 4. Email - Mejoras Opcionales

- ⏳ Descargar adjuntos
- ⏳ Enviar adjuntos
- ⏳ Búsqueda avanzada
- ⏳ Etiquetas personalizadas

---

## 📁 Archivos Clave del Sistema Omnichannel

### Backend

```
backend/src/
├── routes/
│   └── comunicaciones.routes.js    # Todos los endpoints de comunicaciones
├── services/
│   ├── whatsappService.js          # Integración Meta WhatsApp API
│   ├── twilioService.js            # Llamadas y SMS
│   └── gmailService.js             # Gmail API (email)
└── utils/
    ├── googleCalendarOAuth.js      # OAuth para Google (reutilizado para Gmail)
    └── encryption.js                # Encriptar tokens OAuth
```

### Frontend

```
frontend-vendedor/src/
├── components/
│   └── comunicaciones/
│       ├── EmailPanel.jsx          # Panel de email (rediseñado)
│       ├── WhatsAppPanel.jsx       # UI de chat WhatsApp (nuevo)
│       ├── HistorialPanel.jsx      # Historial de comunicaciones (rediseñado)
│       ├── LlamadasPanel.jsx       # Panel de llamadas
│       └── SMSPanel.jsx            # Panel de SMS
└── services/
    └── comunicacionesService.js    # Métodos para API de comunicaciones
```

### Base de Datos

**Tabla `comunicaciones`:**
```prisma
model comunicaciones {
  id              Int       @id @default(autoincrement())
  lead_id         Int?
  cliente_id      Int?
  contrato_id     Int?
  usuario_id      Int
  canal           String    // "voz", "sms", "whatsapp", "email"
  direccion       String    // "entrante", "saliente"
  destinatario    String
  contenido       String?
  estado          String
  sid_externo     String?   // ID externo (Twilio/Meta)
  duracion_seg    Int?      // Para llamadas
  fecha_creacion  DateTime  @default(now())
}
```

---

## 🔧 Variables de Entorno Necesarias

### Railway (Backend)

```env
# Twilio (Llamadas y SMS)
TWILIO_ACCOUNT_SID=AC8eb65264246f30d70ca3491bee3378a8
TWILIO_AUTH_TOKEN=***
TWILIO_PHONE_NUMBER=+13057262244
TWILIO_API_KEY_SID=SKa21ebca0e75d94dd8750f4e89127fa6d
TWILIO_API_KEY_SECRET=***
TWILIO_TWIML_APP_SID=AP8acc440511475e429e3bb8d02207093d

# WhatsApp (Meta Cloud API)
WHATSAPP_ACCESS_TOKEN=EAAWPJf9IYJcBQ... (token temporal, expira cada 60 min)
WHATSAPP_PHONE_NUMBER_ID=938639675994194 (número de prueba - CAMBIAR)
WHATSAPP_BUSINESS_ACCOUNT_ID=713642941430059
WHATSAPP_VERIFY_TOKEN=diamondsistem_webhook_2024

# Google OAuth (Gmail + Calendar)
GOOGLE_OAUTH_CLIENT_ID=905347216518-2qdics7eioppeabk19pbdehk77jl5biu.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
GOOGLE_OAUTH_REDIRECT_URI=https://diamondsistem-production.up.railway.app/api/google-calendar/auth/callback

# URLs
FRONTEND_URL=https://diamondsistem-vendedor.vercel.app
BACKEND_URL=https://diamondsistem-production.up.railway.app
```

---

## 🚀 URLs Importantes

- **Backend (Railway)**: https://diamondsistem-production.up.railway.app
- **Frontend Vendedor (Vercel)**: https://diamondsistem-vendedor.vercel.app
- **Railway Dashboard**: https://railway.app/project/9832f3ec-6688-4d85-b51c-664e75cb359e
- **Meta Developer Console**: https://developers.facebook.com/apps/1564768244949143
- **Twilio Console**: https://console.twilio.com
- **Google Cloud Console**: https://console.cloud.google.com

---

## 📝 Tareas Pendientes Prioritarias

### 🔴 Alta Prioridad

1. **Configurar número real de WhatsApp**
   - Obtener acceso a cuenta "Revolution Party Venue" o crear nueva
   - Agregar número +1 512-337-4935 o +1 786-332-7065
   - Obtener Phone Number ID
   - Actualizar `WHATSAPP_PHONE_NUMBER_ID` en Railway

2. **Configurar webhook de WhatsApp en Meta**
   - URL: `https://diamondsistem-production.up.railway.app/api/comunicaciones/webhook/whatsapp`
   - Token: `diamondsistem_webhook_2024`
   - Suscribirse a `messages`

3. **Obtener Access Token permanente de WhatsApp**
   - Actualmente usa token temporal (expira cada 60 min)
   - Crear System User en Meta Business Suite
   - Generar Permanent Access Token
   - Actualizar en Railway

### 🟡 Media Prioridad

4. **Verificar SMS con Twilio**
   - Decidir entre 10DLC o Toll-Free
   - Completar verificación
   - Probar envío de SMS

5. **Mejorar Email**
   - Soporte para adjuntos
   - Búsqueda avanzada
   - Etiquetas personalizadas

### 🟢 Baja Prioridad

6. **Optimizaciones**
   - WebSockets en lugar de polling para WhatsApp
   - Cache de conversaciones
   - Notificaciones push

---

## 🐛 Problemas Conocidos

### WhatsApp

1. **Token temporal expira cada 60 minutos**
   - **Solución:** Crear System User y generar token permanente

2. **Número de prueba no permite números reales**
   - **Solución:** Usar cuenta de producción o crear nueva cuenta

3. **Estado "Sin conexión" en números**
   - **Causa:** Número está en WhatsApp Business App móvil o en otra cuenta
   - **Solución:** Desconectar de app móvil o obtener acceso a cuenta

### Email

1. **Enviados no muestra correctamente**
   - **Estado:** Backend modificado, verificar después del deploy
   - **Solución:** Usar `labelIds: ['SENT']` en lugar de query

### SMS

1. **Error 10DLC al enviar SMS**
   - **Causa:** Número no verificado para A2P 10DLC
   - **Solución:** Verificar negocio en Twilio o usar Toll-Free

---

## 🔍 Cómo Continuar el Desarrollo

### Para Implementar WhatsApp Real

1. **Leer:** `OMNICHANNEL_ROADMAP.md` (si existe) o este archivo
2. **Verificar:** Estado actual en Meta Business Suite
3. **Configurar:** Número real siguiendo pasos en sección "Tareas Pendientes"
4. **Probar:** Enviar mensaje de prueba
5. **Verificar:** Que llegue al destinatario

### Para Agregar Nuevas Funcionalidades

1. **Backend:**
   - Agregar endpoint en `backend/src/routes/comunicaciones.routes.js`
   - Crear servicio si es necesario en `backend/src/services/`
   - Guardar en tabla `comunicaciones` si aplica

2. **Frontend:**
   - Crear/actualizar componente en `frontend-vendedor/src/components/comunicaciones/`
   - Agregar método en `frontend-vendedor/src/services/comunicacionesService.js`
   - Usar React Query para data fetching

3. **Base de Datos:**
   - Actualizar `backend/prisma/schema.prisma` si se necesitan nuevos campos
   - Ejecutar `npx prisma db push` en Railway

---

## 📚 Documentación Adicional

- **README.md** - Información general del proyecto
- **docs/** - Documentación completa del sistema
- **OMNICHANNEL_ROADMAP.md** - Roadmap específico de Omnichannel (si existe)
- **OMNICHANNEL_PENDIENTES.md** - Lista de tareas pendientes (si existe)

---

## 🎯 Resumen Ejecutivo

**Estado Actual:**
- ✅ Sistema core 100% funcional
- ✅ Email completo implementado
- ✅ Historial de comunicaciones completo
- ✅ WhatsApp UI completa (pendiente número real)
- ⏳ WhatsApp configuración pendiente
- ⏳ SMS bloqueado por verificación

**Próximo Paso Crítico:**
Configurar número real de WhatsApp en Meta Business Suite y actualizar variables de entorno.

**Tiempo Estimado para Completar:**
- WhatsApp real: 2-4 horas (depende de acceso a Meta)
- SMS verificación: 1-5 días (proceso de Twilio)
- Mejoras opcionales: 4-8 horas

---

**Última actualización:** 14 de Diciembre 2025  
**Mantenido por:** Equipo de desarrollo DiamondSistem
