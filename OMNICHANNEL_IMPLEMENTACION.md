# TAREA: Implementar Módulo Omnichannel para DiamondSistem

## CONTEXTO DEL PROYECTO

Proyecto existente: Sistema de gestión de eventos para vendedores
- Backend: Express 5 + Prisma + PostgreSQL
- Ruta del backend: `backend/`
- Backend desplegado en: `https://diamondsistem-production.up.railway.app`

## CREDENCIALES (Variables de Entorno para Railway)

```env
# ========== WHATSAPP CLOUD API (Meta) ==========
WHATSAPP_ACCESS_TOKEN=EAAWPJf9lYJcBQLkBL12RmJO2Iavqhvr8EQmRSs7v2t3s45cQAKK8R1uf0ZA5ovdpWRZB2ttzlJ8b53mmQyf0DxL1ytG4BpEGszkBZAgEPvcif18iCdmiIZCRGHOtegq9SoyHXtBRHVJiZCeL2sHbDx2OY6lJnIFWY7IWse7zhfhKRBFxS7KnP3iR0VOlDV2JvGdfq4RV0dYNwMgvpe1oeiRyX8KpmJ5ZCtZBCcpW6ZBeqTtWndg7PzkbXUtgzIdUZA5NghOYkXlZC08gD3GbfjcRZAfqwZDZD
WHATSAPP_PHONE_NUMBER_ID=938639675994194
WHATSAPP_BUSINESS_ACCOUNT_ID=713642941430059
WHATSAPP_VERIFY_TOKEN=diamondsistem_webhook_2024

# ========== TWILIO (Llamadas + SMS) ==========
TWILIO_ACCOUNT_SID=AC8eb65264246f30d70ca3491bee3378a8
TWILIO_AUTH_TOKEN=bc2ffad6a52b13b1865e942892792f49
TWILIO_PHONE_NUMBER=+13057262244
TWILIO_CALLER_ID=+17863327065
TWILIO_API_KEY_SID=SKa21ebca0e75d94dd8750f4e89127fa6d
TWILIO_API_KEY_SECRET=Q8IUPD6wHRzItNdHi1MU2PRN95QF48WP
TWILIO_TWIML_APP_SID=AP8acc440511475e429e3bb8d02207093d
```

## ARQUITECTURA

```
Frontend (React)                    Backend (Express)                    Servicios Externos
     |                                    |                                    |
     |  (1) Solicitar token Twilio  ---> |                                    |
     |                                    | (2) Generar token JWT Twilio ----> | Twilio
     |  <--- (3) Token temporal           |                                    |
     |                                    |                                    |
     |  (4) Llamada via SDK Twilio  ----------------------------> (WebRTC)    | Twilio Voice
     |                                    |                                    |
     |  (5) Enviar WhatsApp         ---> | (6) Meta Cloud API --------------> | WhatsApp
     |                                    |                                    |
     |  (7) Enviar/Recibir Email    ---> | (8) Gmail API -------------------> | Gmail
     |                                    |                                    |
     |                                    | <--- (9) Webhooks (WhatsApp, SMS)  |
```

## ARCHIVOS A CREAR

### 1. Servicio WhatsApp: `backend/src/services/whatsappService.js`

Funciones a implementar:
- `enviarMensajeTexto(telefono, mensaje)` - Enviar mensaje de texto simple
- `enviarMensajeTemplate(telefono, templateName, params)` - Enviar mensaje con template
- `verificarWebhook(mode, token, challenge)` - Verificar webhook de Meta
- `procesarWebhook(body)` - Procesar mensajes entrantes

Usar Meta Graph API v18.0:
- Endpoint: `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`
- Headers: `Authorization: Bearer {ACCESS_TOKEN}`

### 2. Servicio Twilio: `backend/src/services/twilioService.js`

Funciones a implementar:
- `generarTokenVoz(vendedorId)` - Generar Access Token para Twilio Client SDK
- `hacerLlamada(desde, hacia)` - Iniciar llamada saliente
- `enviarSMS(hacia, mensaje)` - Enviar SMS
- `generarTwiMLLlamada(hacia)` - Generar TwiML para llamada

Usar:
- `twilio` npm package
- AccessToken con VoiceGrant para llamadas desde browser
- TwiML App SID para routing de llamadas

### 3. Servicio Gmail: `backend/src/services/gmailService.js`

Funciones a implementar:
- `obtenerBandeja(usuarioId, maxResults)` - Leer emails recientes
- `obtenerEmail(usuarioId, emailId)` - Leer email específico
- `enviarEmail(usuarioId, destinatario, asunto, cuerpo)` - Enviar email
- `marcarComoLeido(usuarioId, emailId)` - Marcar email como leído

IMPORTANTE: Reusar la lógica OAuth existente en `backend/src/utils/googleCalendarOAuth.js`
- Ya existe `getOAuthClient(vendedorId)` que obtiene tokens encriptados
- Solo agregar scopes de Gmail al flujo existente

### 4. Rutas API: `backend/src/routes/comunicaciones.routes.js`

```javascript
// Endpoints principales (requieren autenticación)
POST   /api/comunicaciones/whatsapp/enviar      // Enviar WhatsApp
POST   /api/comunicaciones/voz/token            // Obtener token para llamadas
POST   /api/comunicaciones/sms/enviar           // Enviar SMS
GET    /api/comunicaciones/email/bandeja        // Leer bandeja entrada
POST   /api/comunicaciones/email/enviar         // Enviar email
GET    /api/comunicaciones/historial/:leadId    // Historial por lead

// Webhooks (SIN autenticación JWT, validados por firma/token)
GET    /api/comunicaciones/webhook/whatsapp     // Verificación Meta
POST   /api/comunicaciones/webhook/whatsapp     // Recibir mensajes WhatsApp
POST   /api/comunicaciones/webhook/voz          // TwiML + estado llamadas
POST   /api/comunicaciones/webhook/sms          // Recibir SMS
```

### 5. Modelo Prisma: agregar a `backend/prisma/schema.prisma`

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
  
  leaks           leaks?    @relation(fields: [lead_id], references: [id])
  clientes        clientes? @relation(fields: [cliente_id], references: [id])
  usuarios        usuarios  @relation(fields: [usuario_id], references: [id])
  
  @@index([lead_id])
  @@index([cliente_id])
  @@index([usuario_id])
  @@index([canal])
  @@index([fecha_creacion])
}
```

NOTA: Agregar la relación inversa en los modelos existentes:
- En `leaks`: `comunicaciones comunicaciones[]`
- En `clientes`: `comunicaciones comunicaciones[]`
- En `usuarios`: `comunicaciones comunicaciones[] @relation("comunicaciones_usuario")`

### 6. Integrar en server.js

```javascript
// Importar
const comunicacionesRoutes = require('./routes/comunicaciones.routes');

// Rate limiter específico (más permisivo para webhooks)
const comunicacionesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200
});

// Usar rutas
app.use('/api/comunicaciones', comunicacionesLimiter, comunicacionesRoutes);
```

## DEPENDENCIAS A INSTALAR

```bash
npm install twilio
```

NOTA: `googleapis` ya está instalado (se usa para Google Calendar)

## REFERENCIAS A ARCHIVOS EXISTENTES

Revisar estos archivos para entender patrones del proyecto:

1. **Autenticación OAuth Google**: `backend/src/utils/googleCalendarOAuth.js`
   - Tiene funciones para obtener/refrescar tokens
   - Usa encriptación para almacenar tokens

2. **Middleware auth**: `backend/src/middleware/auth.js`
   - `authenticate` - Verificar JWT
   - `requireVendedor` - Solo vendedores

3. **Logger**: `backend/src/utils/logger.js`
   - Usar para todos los logs

4. **Database**: `backend/src/config/database.js`
   - `getPrismaClient()` - Obtener cliente Prisma

5. **Error Handler**: `backend/src/middleware/errorHandler.js`
   - `ValidationError`, `NotFoundError`, etc.

6. **Rutas ejemplo**: `backend/src/routes/leaks.routes.js`
   - Ver patrón de rutas con autenticación

## ORDEN DE IMPLEMENTACIÓN

1. **Agregar modelo a schema.prisma** y correr migración
2. **Crear whatsappService.js** - El más importante
3. **Crear twilioService.js** - Para llamadas
4. **Crear gmailService.js** - Reusar OAuth existente
5. **Crear comunicaciones.routes.js** - Todas las rutas y webhooks
6. **Integrar en server.js**
7. **Agregar variables de entorno** a Railway
8. **Configurar webhooks** en Meta y Twilio

## WEBHOOK DE WHATSAPP - IMPORTANTE

El webhook de WhatsApp requiere verificación GET antes de poder recibir POST:

```javascript
// GET - Verificación (Meta envía esto primero)
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

// POST - Mensajes entrantes
router.post('/webhook/whatsapp', (req, res) => {
  // Procesar mensaje
  // SIEMPRE responder 200 rápido
  res.sendStatus(200);
  
  // Procesar async después
  procesarMensajeWhatsApp(req.body);
});
```

## TWIML PARA LLAMADAS

Cuando Twilio recibe una llamada desde el browser, hace POST al webhook de voz:

```javascript
router.post('/webhook/voz', (req, res) => {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  
  const numeroDestino = req.body.To;
  
  // Llamar al número con Caller ID personalizado
  twiml.dial({
    callerId: process.env.TWILIO_CALLER_ID
  }).number(numeroDestino);
  
  res.type('text/xml');
  res.send(twiml.toString());
});
```

## NOTAS FINALES

- Todos los mensajes/llamadas deben guardarse en la tabla `comunicaciones`
- El historial debe poder filtrarse por lead_id, cliente_id o contrato_id
- Los webhooks NO usan autenticación JWT, se validan por token/firma
- El token de WhatsApp expira, considerar implementar refresh

