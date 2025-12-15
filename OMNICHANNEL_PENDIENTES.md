# DiamondSistem - Sistema Omnichannel - Tareas Pendientes

## Resumen del Proyecto

DiamondSistem es un CRM para gestión de eventos (Party Venue) con un módulo de comunicaciones omnichannel que permite a los vendedores comunicarse con clientes a través de múltiples canales.

---

## Estado Actual (Diciembre 2024)

### ✅ Funcionando

| Servicio | Estado | Notas |
|----------|--------|-------|
| **Llamadas (Twilio)** | ✅ Funciona | WebRTC, llamadas salientes funcionan |
| **Email (Gmail)** | ✅ Parcial | Envío funciona, bandeja se ve, falta ver mensajes completos |
| **WhatsApp (Meta)** | ✅ Parcial | Envío funciona, falta historial y recepción |
| **SMS (Twilio)** | ❌ Bloqueado | Requiere verificación 10DLC o Toll-Free |

### Configuración Actual

**Variables de entorno en Railway:**
```
# Twilio (Llamadas y SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1305...
TWILIO_API_KEY_SID=SK...
TWILIO_API_KEY_SECRET=...
TWILIO_TWIML_APP_SID=AP...

# WhatsApp (Meta)
WHATSAPP_ACCESS_TOKEN=EAAW... (¡Expira cada 60 min si es temporal!)
WHATSAPP_PHONE_NUMBER_ID=938639675994194
WHATSAPP_VERIFY_TOKEN=diamondsistem_webhook_2024
WHATSAPP_BUSINESS_ACCOUNT_ID=713642941430059

# Google OAuth (Gmail + Calendar)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://diamondsistem-production.up.railway.app/api/google-calendar/auth/callback

# URLs
FRONTEND_URL=https://diamondsistem-vendedor.vercel.app
BACKEND_URL=https://diamondsistem-production.up.railway.app
```

### Archivos Principales del Módulo de Comunicaciones

```
backend/
├── src/
│   ├── services/
│   │   ├── twilioService.js      # Llamadas y SMS
│   │   ├── whatsappService.js    # WhatsApp Meta API
│   │   └── gmailService.js       # Gmail API
│   ├── routes/
│   │   └── comunicaciones.routes.js  # Endpoints API
│   └── utils/
│       ├── googleCalendarOAuth.js    # OAuth Google
│       └── encryption.js             # Encriptar tokens

frontend-vendedor/
├── src/
│   ├── components/
│   │   ├── PanelComunicaciones.jsx   # Panel principal
│   │   └── comunicaciones/
│   │       ├── WhatsAppPanel.jsx     # UI WhatsApp
│   │       ├── LlamadasPanel.jsx     # UI Llamadas
│   │       ├── SMSPanel.jsx          # UI SMS
│   │       ├── EmailPanel.jsx        # UI Email
│   │       └── HistorialPanel.jsx    # UI Historial
│   ├── services/
│   │   └── comunicacionesService.js  # API calls
│   └── pages/
│       └── Comunicaciones.jsx        # Página principal
```

### Base de Datos (Prisma)

```prisma
model comunicaciones {
  id              Int       @id @default(autoincrement())
  lead_id         Int?
  cliente_id      Int?
  contrato_id     Int?
  usuario_id      Int       // Vendedor
  canal           String    // "voz", "sms", "whatsapp", "email"
  direccion       String    // "entrante", "saliente"
  destinatario    String
  contenido       String?
  estado          String    @default("enviado")
  sid_externo     String?   // Twilio/Meta Message SID
  duracion_seg    Int?      // Para llamadas
  fecha_creacion  DateTime  @default(now())
  
  // Relaciones
  leaks           leaks?
  clientes        clientes?
  contratos       contratos?
  usuarios        usuarios
}
```

---

## TAREA 1: Email - Ver Mensajes Completos y Enviados

### Problema Actual
- La bandeja de entrada se ve pero al hacer clic en un email no se muestra el contenido completo
- No hay carpeta de "Enviados"

### Archivos a Modificar

#### Backend: `backend/src/services/gmailService.js`
- La función `obtenerEmail(usuarioId, emailId)` ya existe (línea ~177)
- Necesita verificar que retorna el `body` correctamente

#### Backend: `backend/src/routes/comunicaciones.routes.js`
- El endpoint `GET /api/comunicaciones/email/:emailId` ya existe (línea ~494)
- Agregar endpoint para obtener emails enviados:
```javascript
// GET /api/comunicaciones/email/enviados
// Query: q = 'in:sent'
```

#### Frontend: `frontend-vendedor/src/components/comunicaciones/EmailPanel.jsx`
- Línea ~370: `renderRead()` - verificar que muestra `emailSeleccionado.body`
- Agregar pestaña "Enviados" junto a "Bandeja de entrada"
- Query para enviados: `comunicacionesService.obtenerBandeja(20, 'in:sent')`

### Pasos de Implementación

1. **Verificar endpoint de email individual:**
```javascript
// En comunicaciones.routes.js, verificar que existe:
router.get('/email/:emailId', authenticate, requireVendedor, async (req, res, next) => {
  const { emailId } = req.params;
  const email = await gmailService.obtenerEmail(req.user.id, emailId);
  res.json({ success: true, data: email });
});
```

2. **Agregar endpoint de enviados (si no existe):**
```javascript
router.get('/email/enviados', authenticate, requireVendedor, async (req, res, next) => {
  const emails = await gmailService.obtenerBandeja(req.user.id, 20, 'in:sent');
  res.json({ success: true, data: emails });
});
```

3. **Frontend - Agregar tabs Inbox/Enviados:**
```jsx
// En EmailPanel.jsx
const [carpeta, setCarpeta] = useState('inbox'); // 'inbox' | 'sent'

// Query condicional
const query = carpeta === 'sent' ? 'in:sent' : 'in:inbox';
```

4. **Frontend - Cargar email completo al hacer clic:**
```jsx
// Agregar query para obtener email individual
const { data: emailCompleto } = useQuery({
  queryKey: ['email-detalle', emailSeleccionado?.id],
  queryFn: () => comunicacionesService.obtenerEmail(emailSeleccionado.id),
  enabled: !!emailSeleccionado?.id
});
```

---

## TAREA 2: Guardar Historial de Comunicaciones

### Problema Actual
- Las comunicaciones se envían pero no se guardan en la BD
- No hay historial visible

### Lo que ya existe
- Tabla `comunicaciones` en Prisma ✅
- Los endpoints intentan guardar pero pueden fallar silenciosamente

### Archivos a Verificar/Modificar

#### Backend: Verificar que se guarda en cada envío

1. **WhatsApp** (`comunicaciones.routes.js` línea ~46):
```javascript
// Después de enviar mensaje exitosamente:
await prisma.comunicaciones.create({
  data: {
    usuario_id: req.user.id,
    lead_id: leadId || null,
    cliente_id: clienteId || null,
    canal: 'whatsapp',
    direccion: 'saliente',
    destinatario: telefono,
    contenido: mensaje,
    estado: 'enviado',
    sid_externo: resultado.messageId
  }
});
```

2. **Email** (`comunicaciones.routes.js` línea ~540):
```javascript
// Después de enviar email exitosamente:
await prisma.comunicaciones.create({
  data: {
    usuario_id: req.user.id,
    canal: 'email',
    direccion: 'saliente',
    destinatario: destinatario,
    contenido: `Asunto: ${asunto}`,
    estado: 'enviado',
    sid_externo: resultado.messageId
  }
});
```

3. **Llamadas** - Ya debería estar guardando (verificar)

4. **SMS** - Ya debería estar guardando (verificar)

### Frontend: Mostrar Historial

El componente `HistorialPanel.jsx` ya existe. Verificar que:
- Llama a `GET /api/comunicaciones/historial/:id` o `/api/comunicaciones/mis-comunicaciones`
- Muestra los registros correctamente

---

## TAREA 3: WhatsApp con UI de Chat y Webhooks

### Problema Actual
- Solo se pueden enviar mensajes, no recibir
- No hay historial de conversaciones
- No hay UI tipo chat

### Implementación Necesaria

#### Paso 1: Configurar Webhook en Meta

1. En Meta Developer Console → WhatsApp → Configuración:
   - Callback URL: `https://diamondsistem-production.up.railway.app/api/comunicaciones/webhook/whatsapp`
   - Verify Token: `diamondsistem_webhook_2024`
   - Suscribirse a: `messages`, `message_status`

2. El endpoint de webhook ya existe en `comunicaciones.routes.js` (buscar `/webhook/whatsapp`)

#### Paso 2: Procesar Mensajes Entrantes

```javascript
// En el webhook handler, guardar mensajes entrantes:
router.post('/webhook/whatsapp', async (req, res) => {
  // Responder inmediatamente a Meta
  res.status(200).send('OK');
  
  try {
    const { entry } = req.body;
    for (const e of entry) {
      for (const change of e.changes) {
        if (change.value.messages) {
          for (const msg of change.value.messages) {
            // Buscar lead/cliente por teléfono
            const telefono = msg.from;
            const lead = await prisma.leaks.findFirst({
              where: { telefono: { contains: telefono.slice(-10) } }
            });
            
            // Guardar mensaje entrante
            await prisma.comunicaciones.create({
              data: {
                usuario_id: lead?.usuario_id || 1,
                lead_id: lead?.id,
                canal: 'whatsapp',
                direccion: 'entrante',
                destinatario: telefono,
                contenido: msg.text?.body || '[Media]',
                estado: 'recibido',
                sid_externo: msg.id
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error procesando webhook WhatsApp:', error);
  }
});
```

#### Paso 3: Nueva UI de Chat

Crear nuevo componente `WhatsAppChat.jsx`:

```jsx
// Estructura básica:
// - Lista de conversaciones (agrupadas por teléfono)
// - Vista de chat con mensajes
// - Input para enviar nuevo mensaje

const WhatsAppChat = () => {
  const [conversacionActiva, setConversacionActiva] = useState(null);
  
  // Obtener conversaciones agrupadas
  const { data: conversaciones } = useQuery({
    queryKey: ['whatsapp-conversaciones'],
    queryFn: () => api.get('/comunicaciones/whatsapp/conversaciones')
  });
  
  // Obtener mensajes de conversación activa
  const { data: mensajes } = useQuery({
    queryKey: ['whatsapp-mensajes', conversacionActiva],
    queryFn: () => api.get(`/comunicaciones/whatsapp/mensajes/${conversacionActiva}`),
    enabled: !!conversacionActiva
  });
  
  return (
    <div className="flex h-full">
      {/* Lista de conversaciones */}
      <div className="w-1/3 border-r">
        {conversaciones?.map(conv => (
          <ConversacionItem 
            key={conv.telefono}
            conversacion={conv}
            onClick={() => setConversacionActiva(conv.telefono)}
          />
        ))}
      </div>
      
      {/* Chat activo */}
      <div className="w-2/3 flex flex-col">
        <ChatHeader conversacion={conversacionActiva} />
        <ChatMessages mensajes={mensajes} />
        <ChatInput onSend={handleEnviar} />
      </div>
    </div>
  );
};
```

#### Paso 4: Endpoints necesarios

```javascript
// GET /api/comunicaciones/whatsapp/conversaciones
// Retorna lista de conversaciones agrupadas por teléfono

// GET /api/comunicaciones/whatsapp/mensajes/:telefono
// Retorna todos los mensajes con ese teléfono (entrantes y salientes)
```

---

## TAREA 4: Integración Meta Lead Ads

### Objetivo
Recibir leads automáticamente de campañas de Meta (Facebook/Instagram Ads) directamente en el sistema.

### Pasos de Implementación

#### Paso 1: Configurar Webhook en Meta Business

1. En Meta Developer Console → tu app → Webhooks
2. Agregar webhook para "leadgen":
   - URL: `https://diamondsistem-production.up.railway.app/api/leads/webhook/meta`
   - Verify Token: `diamondsistem_leads_2024`

#### Paso 2: Crear endpoint de webhook

```javascript
// backend/src/routes/leads.routes.js (nuevo archivo o agregar a existente)

router.get('/webhook/meta', (req, res) => {
  // Verificación de Meta
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.META_LEADS_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook/meta', async (req, res) => {
  res.status(200).send('OK');
  
  try {
    const { entry } = req.body;
    
    for (const e of entry) {
      for (const change of e.changes) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value.leadgen_id;
          const formId = change.value.form_id;
          
          // Obtener datos del lead de Meta
          const leadData = await obtenerLeadDeMeta(leadgenId);
          
          // Crear lead en el sistema
          await prisma.leaks.create({
            data: {
              nombre_completo: leadData.nombre,
              email: leadData.email,
              telefono: leadData.telefono,
              fuente: 'META_LEAD_ADS',
              estado: 'nuevo',
              fecha_recepcion: new Date(),
              // Asignar a vendedor según rotación o reglas
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error procesando lead de Meta:', error);
  }
});

// Función para obtener datos del lead
async function obtenerLeadDeMeta(leadgenId) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${process.env.META_ACCESS_TOKEN}`
  );
  const data = await response.json();
  
  // Parsear campos del formulario
  const campos = {};
  for (const field of data.field_data) {
    campos[field.name] = field.values[0];
  }
  
  return {
    nombre: campos.full_name || campos.first_name,
    email: campos.email,
    telefono: campos.phone_number
  };
}
```

#### Paso 3: Permisos necesarios en Meta

En Meta Developer Console, necesitas:
- `leads_retrieval` - Para leer datos de leads
- `pages_read_engagement` - Para acceder a la página

---

## Notas Importantes

### Token de WhatsApp
⚠️ El token temporal de Meta expira cada **60 minutos**. Para producción:

1. Ve a Meta Business Suite → Configuración del sistema → Usuarios del sistema
2. Crea un "System User" con permisos de WhatsApp
3. Genera un token permanente para ese System User
4. Actualiza `WHATSAPP_ACCESS_TOKEN` en Railway

### SMS (10DLC)
Para que SMS funcione en USA, necesitas:
1. Registrar tu marca en Twilio Trust Hub
2. Crear una campaña 10DLC
3. O comprar un número Toll-Free y verificarlo

### Arquitectura de URLs

```
Frontend (Vercel): https://diamondsistem-vendedor.vercel.app
Backend (Railway): https://diamondsistem-production.up.railway.app
Base de Datos: PostgreSQL en Railway
```

---

## Orden de Prioridad Sugerido

1. **Email completo** (1-2 horas) - Más rápido
2. **Historial de comunicaciones** (2-3 horas) - Importante para seguimiento
3. **WhatsApp Chat UI** (4-6 horas) - Mejora significativa de UX
4. **Meta Lead Ads** (3-4 horas) - Automatización de leads

---

## Comandos Útiles

```bash
# Desarrollo local
cd backend && npm run dev
cd frontend-vendedor && npm run dev

# Ver logs de Railway
railway logs

# Sincronizar BD
cd backend && npx prisma db push

# Ver BD local
cd backend && npx prisma studio
```

---

*Documento creado: Diciembre 2024*
*Última actualización: Estado del proyecto después de configurar Twilio, WhatsApp y Gmail*
