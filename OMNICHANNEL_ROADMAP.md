# 🚀 DiamondSistem - Roadmap Omnichannel

## Documento de Continuación para Implementación

Este documento contiene toda la información necesaria para continuar con la implementación del sistema Omnichannel de DiamondSistem.

---

## 📊 Estado Actual del Proyecto

### ✅ Funcionando

| Servicio | Estado | Notas |
|----------|--------|-------|
| **Llamadas (Twilio Voice)** | ✅ Funciona | WebRTC desde navegador, llamadas salientes |
| **Email (Gmail)** | ✅ Parcial | Envío funciona, bandeja se ve, falta ver mensajes completos |
| **WhatsApp (Meta Cloud API)** | ✅ Parcial | Envío funciona, falta recibir mensajes y historial |
| **SMS (Twilio)** | ⏸️ Bloqueado | Requiere verificación 10DLC o Toll-Free |

### 🔧 Configuración Actual (Variables en Railway)

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
WHATSAPP_PHONE_NUMBER_ID=938639675994194
WHATSAPP_BUSINESS_ACCOUNT_ID=713642941430059
WHATSAPP_VERIFY_TOKEN=diamondsistem_webhook_2024

# Google OAuth (Gmail + Calendar)
GOOGLE_OAUTH_CLIENT_ID=***
GOOGLE_OAUTH_CLIENT_SECRET=***
GOOGLE_OAUTH_REDIRECT_URI=https://diamondsistem-production.up.railway.app/api/google-calendar/auth/callback

# Frontend
FRONTEND_URL=https://diamondsistem-vendedor.vercel.app

# Backend
BACKEND_URL=https://diamondsistem-production.up.railway.app
```

---

## 📁 Estructura de Archivos Relevantes

### Backend (Node.js + Express + Prisma)

```
backend/
├── src/
│   ├── routes/
│   │   └── comunicaciones.routes.js    # Endpoints de comunicación
│   ├── services/
│   │   ├── twilioService.js            # Llamadas y SMS
│   │   ├── whatsappService.js          # WhatsApp Meta API
│   │   └── gmailService.js             # Gmail API
│   ├── utils/
│   │   ├── googleCalendarOAuth.js      # OAuth para Google
│   │   └── encryption.js               # Encriptar/desencriptar tokens
│   └── middleware/
│       └── errorHandler.js             # Manejo de errores
├── prisma/
│   └── schema.prisma                   # Modelo de base de datos
```

### Frontend (React + Vite)

```
frontend-vendedor/
├── src/
│   ├── components/
│   │   ├── comunicaciones/
│   │   │   ├── WhatsAppPanel.jsx       # Panel de WhatsApp
│   │   │   ├── LlamadasPanel.jsx       # Panel de llamadas
│   │   │   ├── SMSPanel.jsx            # Panel de SMS
│   │   │   ├── EmailPanel.jsx          # Panel de email
│   │   │   ├── HistorialPanel.jsx      # Historial de comunicaciones
│   │   │   └── index.js                # Exports
│   │   └── PanelComunicaciones.jsx     # Panel principal con tabs
│   ├── pages/
│   │   └── Comunicaciones.jsx          # Página de comunicaciones
│   └── services/
│       └── comunicacionesService.js    # API calls al backend
```

### Modelo de Base de Datos (Prisma)

```prisma
model comunicaciones {
  id              Int       @id @default(autoincrement())
  lead_id         Int?
  cliente_id      Int?
  contrato_id     Int?
  usuario_id      Int
  canal           String    @db.VarChar(20)  // "voz", "sms", "whatsapp", "email"
  direccion       String    @db.VarChar(10)  // "entrante", "saliente"
  destinatario    String    @db.VarChar(255)
  contenido       String?   @db.Text
  estado          String    @default("enviado") @db.VarChar(50)
  sid_externo     String?   @db.VarChar(100) // Twilio/Meta Message SID
  duracion_seg    Int?      // Para llamadas
  fecha_creacion  DateTime  @default(now())

  // Relaciones
  leaks           leaks?    @relation(fields: [lead_id], references: [id])
  clientes        clientes? @relation(fields: [cliente_id], references: [id])
  contratos       contratos? @relation(fields: [contrato_id], references: [id])
  usuarios        usuarios  @relation("comunicaciones_usuario", fields: [usuario_id], references: [id])
}
```

---

## 🎯 TAREA 1: Email - Ver Mensajes Completos y Enviados

### Problema Actual
- La bandeja de entrada se muestra pero al hacer clic en un email no se ve el contenido completo
- No hay carpeta de "Enviados"

### Archivos a Modificar

1. **Backend** - `backend/src/services/gmailService.js`
   - La función `obtenerEmail(usuarioId, emailId)` existe (líneas 177-263)
   - Verifica que esté retornando el `body` correctamente

2. **Backend** - `backend/src/routes/comunicaciones.routes.js`
   - El endpoint `GET /email/:emailId` existe (líneas 494-520)
   - Verifica que funcione correctamente

3. **Frontend** - `frontend-vendedor/src/components/comunicaciones/EmailPanel.jsx`
   - La función `renderRead()` (líneas 370-414) muestra el email
   - El problema está en cómo se obtiene el contenido del email seleccionado
   - Actualmente usa `emailSeleccionado.cuerpo || emailSeleccionado.body || emailSeleccionado.snippet`
   - Necesita llamar al endpoint `/email/:emailId` para obtener el contenido completo

### Solución Propuesta

```jsx
// En EmailPanel.jsx, agregar query para obtener email completo
const { data: emailCompleto } = useQuery({
  queryKey: ['email-detalle', emailSeleccionado?.id],
  queryFn: () => comunicacionesService.obtenerEmail(emailSeleccionado.id),
  enabled: !!emailSeleccionado?.id && vista === VIEWS.READ
});
```

### Para Mensajes Enviados
- Modificar la query de bandeja para incluir carpeta "SENT"
- O crear un tab separado para "Enviados"

---

## 🎯 TAREA 2: Historial de Comunicaciones

### Problema Actual
- Las comunicaciones no se están guardando en la tabla `comunicaciones`
- El panel de historial no muestra datos

### Archivos a Verificar

1. **Backend** - `backend/src/routes/comunicaciones.routes.js`
   - Los endpoints de envío (WhatsApp, SMS, Email) deben guardar en `prisma.comunicaciones.create()`
   - Verificar que esto esté funcionando

2. **Backend** - Endpoint de historial:
   ```javascript
   // GET /api/comunicaciones/historial/:id
   // GET /api/comunicaciones/mis-comunicaciones
   ```

3. **Frontend** - `frontend-vendedor/src/components/comunicaciones/HistorialPanel.jsx`
   - Verifica que esté llamando al endpoint correcto
   - Verifica que esté procesando los datos correctamente

### Base de Datos
- La tabla `comunicaciones` ya existe en el schema
- Ejecutar en Railway: verificar que la tabla exista con `prisma db push`

---

## 🎯 TAREA 3: WhatsApp con UI de Chat

### Problema Actual
- Solo hay un formulario para enviar mensajes
- No hay historial de conversaciones
- No se reciben mensajes entrantes

### Lo que se necesita implementar

#### 3.1 Webhooks para Recibir Mensajes

**Backend** - Crear/verificar webhook en `comunicaciones.routes.js`:

```javascript
// POST /api/comunicaciones/webhook/whatsapp
router.post('/webhook/whatsapp', async (req, res) => {
  // Verificar firma de Meta
  // Procesar mensaje entrante
  // Guardar en tabla comunicaciones
  // Responder 200 OK
});

// GET /api/comunicaciones/webhook/whatsapp (verificación)
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

**Configurar en Meta**:
1. Ve a Meta Developer Console → tu app → WhatsApp → Configuration
2. Webhook URL: `https://diamondsistem-production.up.railway.app/api/comunicaciones/webhook/whatsapp`
3. Verify Token: `diamondsistem_webhook_2024`
4. Suscribirse a: `messages`

#### 3.2 UI de Chat (Frontend)

Crear nuevo componente `WhatsAppChat.jsx`:

```jsx
// Estructura sugerida
- Lista de conversaciones (contactos)
- Panel de chat (mensajes)
- Input para enviar mensaje
- Actualización en tiempo real (polling o WebSocket)
```

#### 3.3 Endpoints Necesarios

```javascript
// Obtener conversaciones del vendedor
GET /api/comunicaciones/whatsapp/conversaciones

// Obtener mensajes de una conversación
GET /api/comunicaciones/whatsapp/conversacion/:telefono

// Enviar mensaje (ya existe)
POST /api/comunicaciones/whatsapp/enviar
```

---

## 🎯 TAREA 4: Integración Meta Lead Ads

### Objetivo
Recibir leads automáticamente de campañas de Facebook/Instagram

### Lo que se necesita

#### 4.1 Configurar Webhook en Meta

1. Meta Developer Console → tu app → Webhooks
2. Suscribirse al objeto `leadgen`
3. URL: `https://diamondsistem-production.up.railway.app/api/leads/webhook/meta`

#### 4.2 Backend - Endpoint para Leads

```javascript
// POST /api/leads/webhook/meta
router.post('/webhook/meta', async (req, res) => {
  const { entry } = req.body;
  
  for (const e of entry) {
    for (const change of e.changes) {
      if (change.field === 'leadgen') {
        const leadId = change.value.leadgen_id;
        // Obtener datos del lead de Meta API
        // Guardar en tabla leaks
        // Asignar a vendedor
      }
    }
  }
  
  res.sendStatus(200);
});
```

#### 4.3 Obtener Datos del Lead

```javascript
// Usar Graph API para obtener datos del lead
const response = await fetch(
  `https://graph.facebook.com/v18.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`
);
const leadData = await response.json();
// leadData contiene: nombre, email, teléfono, etc.
```

---

## ⚠️ Problemas Conocidos

### SMS - Error 10DLC

El número de Twilio no está registrado para A2P 10DLC. Opciones:

1. **Registrar 10DLC** (proceso largo):
   - Twilio Console → Messaging → Trust Hub → US A2P 10DLC
   - Requiere verificación de negocio

2. **Toll-Free Number** (más rápido):
   - Comprar número 1-800/1-888 en Twilio
   - Completar verificación Toll-Free (1-5 días)

### WhatsApp - Token Temporal

El token de Meta expira cada 60 minutos. Para producción:

1. Crear un **System User** en Meta Business Suite
2. Generar un **Permanent Access Token**
3. Actualizar en Railway

---

## 📝 Orden de Implementación Recomendado

1. ✅ **Email - Mensajes Completos** (2-3 horas)
   - Arreglar fetch de email completo en frontend
   - Agregar tab de "Enviados"

2. ✅ **Historial de Comunicaciones** (2-3 horas)
   - Verificar que se guarden las comunicaciones
   - Arreglar panel de historial

3. ⏳ **WhatsApp Chat UI** (6-8 horas)
   - Configurar webhooks en Meta
   - Crear endpoint para recibir mensajes
   - Crear UI de chat tipo WhatsApp

4. ⏳ **Meta Lead Ads** (4-6 horas)
   - Configurar webhook de leadgen
   - Crear endpoint para procesar leads
   - Auto-asignar a vendedores

---

## 🔗 URLs Importantes

- **Backend (Railway)**: https://diamondsistem-production.up.railway.app
- **Frontend (Vercel)**: https://diamondsistem-vendedor.vercel.app
- **Railway Dashboard**: https://railway.app/project/9832f3ec-6688-4d85-b51c-664e75cb359e
- **Meta Developer Console**: https://developers.facebook.com/apps/1564768244949143
- **Twilio Console**: https://console.twilio.com
- **Google Cloud Console**: https://console.cloud.google.com

---

## 🚀 Cómo Empezar

Para continuar en un nuevo chat, di:

```
Lee el archivo OMNICHANNEL_ROADMAP.md y comienza con la TAREA 1: 
Email - Ver Mensajes Completos y Enviados
```

---

*Documento creado: 14 de Diciembre 2025*
*Proyecto: DiamondSistem - Sistema de Gestión de Eventos*
