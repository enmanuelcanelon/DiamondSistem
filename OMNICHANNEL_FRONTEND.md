# TAREA: Implementar UI del Módulo Omnichannel en Frontend Vendedor

## CONTEXTO

El backend del módulo Omnichannel ya está implementado y desplegado en:
- **Backend:** `https://diamondsistem-production.up.railway.app`
- **Frontend Vendedor:** `frontend-vendedor/`

### Endpoints disponibles (requieren autenticación JWT):

```javascript
// WhatsApp
POST /api/comunicaciones/whatsapp/enviar
Body: { telefono, mensaje, leadId?, clienteId?, contratoId?, templateName?, templateParams? }

// Llamadas (Twilio Voice)
POST /api/comunicaciones/voz/token
Response: { token, identity, expiresIn }

POST /api/comunicaciones/voz/llamar
Body: { hacia, leadId?, clienteId?, contratoId? }

// SMS
POST /api/comunicaciones/sms/enviar
Body: { telefono, mensaje, leadId?, clienteId?, contratoId? }

// Email (requiere OAuth de Google conectado)
GET  /api/comunicaciones/email/bandeja?maxResults=20&q=
GET  /api/comunicaciones/email/:emailId
POST /api/comunicaciones/email/enviar
Body: { destinatario, asunto, cuerpo, cc?, bcc?, leadId?, clienteId?, contratoId? }
POST /api/comunicaciones/email/:emailId/marcar-leido
POST /api/comunicaciones/email/:emailId/responder
Body: { cuerpo, leadId?, clienteId?, contratoId? }

// Historial
GET /api/comunicaciones/historial/:leadId
GET /api/comunicaciones/historial/cliente/:clienteId
GET /api/comunicaciones/historial/contrato/:contratoId
GET /api/comunicaciones/mis-comunicaciones?canal=&direccion=&desde=&hasta=&limit=50

// Estadísticas
GET /api/comunicaciones/stats

// Estado de servicios
GET /api/comunicaciones/servicios/estado
```

---

## COMPONENTES A CREAR

### 1. Servicio de API: `frontend-vendedor/src/services/comunicacionesService.js`

```javascript
// Crear servicio con todas las funciones para llamar a los endpoints
// Usar el patrón existente en otros services del proyecto
```

### 2. Panel de Comunicaciones: `frontend-vendedor/src/components/PanelComunicaciones.jsx`

Panel principal con tabs para:
- 📱 WhatsApp
- 📞 Llamadas
- 💬 SMS  
- 📧 Email
- 📋 Historial

### 3. Componente de WhatsApp: `frontend-vendedor/src/components/comunicaciones/WhatsAppPanel.jsx`

- Input para número de teléfono (auto-rellenar si viene de lead/cliente)
- Textarea para mensaje
- Botón de enviar
- Lista de mensajes enviados/recibidos

### 4. Componente de Llamadas: `frontend-vendedor/src/components/comunicaciones/LlamadasPanel.jsx`

- Usar Twilio Client SDK para llamadas desde el navegador
- Botón de llamar con estado (conectando, en llamada, finalizada)
- Mostrar duración de la llamada
- Historial de llamadas

```javascript
// Instalar: npm install @twilio/voice-sdk
import { Device } from '@twilio/voice-sdk';

// Obtener token del backend
const { token } = await fetch('/api/comunicaciones/voz/token', { method: 'POST' });

// Inicializar device
const device = new Device(token);
await device.register();

// Hacer llamada
const call = await device.connect({ params: { To: '+1234567890' } });
```

### 5. Componente de SMS: `frontend-vendedor/src/components/comunicaciones/SMSPanel.jsx`

- Similar a WhatsApp pero más simple
- Input para número
- Textarea para mensaje (máx 160 caracteres)
- Contador de caracteres

### 6. Componente de Email: `frontend-vendedor/src/components/comunicaciones/EmailPanel.jsx`

- Bandeja de entrada (lista de emails)
- Visor de email individual
- Composer para nuevo email
- Responder a email

### 7. Componente de Historial: `frontend-vendedor/src/components/comunicaciones/HistorialPanel.jsx`

- Timeline de todas las comunicaciones
- Filtros por canal (whatsapp, sms, voz, email)
- Filtros por dirección (entrante, saliente)
- Búsqueda por fecha

---

## INTEGRACIÓN EN PÁGINAS EXISTENTES

### En la página de detalle de Lead (`LeadDetalle.jsx` o similar):

Agregar botones de acción rápida:
```jsx
<div className="flex gap-2">
  <Button onClick={() => llamar(lead.telefono)}>
    <PhoneIcon /> Llamar
  </Button>
  <Button onClick={() => enviarWhatsApp(lead.telefono)}>
    <WhatsAppIcon /> WhatsApp
  </Button>
  <Button onClick={() => enviarSMS(lead.telefono)}>
    <MessageIcon /> SMS
  </Button>
  <Button onClick={() => enviarEmail(lead.email)}>
    <EmailIcon /> Email
  </Button>
</div>

{/* Historial de comunicaciones del lead */}
<HistorialComunicaciones leadId={lead.id} />
```

### En la página de detalle de Cliente:

Similar a leads, pero usando `clienteId`.

### En la página de detalle de Contrato:

Similar, pero usando `contratoId`.

---

## MODALES/DIALOGS SUGERIDOS

### Modal de Enviar WhatsApp:
```jsx
<Dialog open={showWhatsApp} onClose={...}>
  <DialogTitle>Enviar WhatsApp a {nombre}</DialogTitle>
  <DialogContent>
    <TextField label="Teléfono" value={telefono} />
    <TextField label="Mensaje" multiline rows={4} />
  </DialogContent>
  <DialogActions>
    <Button onClick={enviar}>Enviar</Button>
  </DialogActions>
</Dialog>
```

### Modal de Llamada en Progreso:
```jsx
<Dialog open={enLlamada}>
  <DialogContent className="text-center">
    <Avatar>{iniciales}</Avatar>
    <h3>{nombre}</h3>
    <p>{estado}</p> {/* "Conectando...", "En llamada", "00:45" */}
    <Button color="error" onClick={colgar}>
      <PhoneOffIcon /> Colgar
    </Button>
  </DialogContent>
</Dialog>
```

---

## DEPENDENCIAS A INSTALAR

```bash
cd frontend-vendedor
npm install @twilio/voice-sdk
```

---

## ICONOS SUGERIDOS (si usan lucide-react o similar)

```jsx
import { 
  Phone, 
  PhoneOff, 
  MessageSquare, 
  Mail, 
  Send,
  History,
  CheckCheck, // mensaje leído
  Check, // mensaje enviado
  Clock, // mensaje pendiente
} from 'lucide-react';
```

---

## NOTAS IMPORTANTES

1. **Autenticación:** Todos los endpoints requieren el header `Authorization: Bearer <token>`

2. **WhatsApp:** Solo funciona con números que hayan interactuado primero con el negocio (limitación de Meta para evitar spam)

3. **Email:** Requiere que el vendedor haya conectado su cuenta de Google (OAuth). Si no está conectado, mostrar botón para conectar.

4. **Llamadas desde navegador:** Requiere permisos de micrófono. Manejar el caso cuando el usuario deniega el permiso.

5. **Historial:** Las comunicaciones se guardan automáticamente en la base de datos. El historial se puede ver por lead, cliente o contrato.

---

## EJEMPLO DE USO DEL SERVICIO

```javascript
// comunicacionesService.js
import api from './api'; // tu instancia de axios configurada

export const comunicacionesService = {
  // WhatsApp
  enviarWhatsApp: (telefono, mensaje, leadId = null) => 
    api.post('/comunicaciones/whatsapp/enviar', { telefono, mensaje, leadId }),

  // Llamadas
  obtenerTokenVoz: () => 
    api.post('/comunicaciones/voz/token'),

  // SMS
  enviarSMS: (telefono, mensaje, leadId = null) => 
    api.post('/comunicaciones/sms/enviar', { telefono, mensaje, leadId }),

  // Email
  obtenerBandeja: (maxResults = 20) => 
    api.get(`/comunicaciones/email/bandeja?maxResults=${maxResults}`),
  
  enviarEmail: (destinatario, asunto, cuerpo, leadId = null) => 
    api.post('/comunicaciones/email/enviar', { destinatario, asunto, cuerpo, leadId }),

  // Historial
  obtenerHistorialLead: (leadId) => 
    api.get(`/comunicaciones/historial/${leadId}`),

  obtenerHistorialCliente: (clienteId) => 
    api.get(`/comunicaciones/historial/cliente/${clienteId}`),

  // Stats
  obtenerEstadisticas: () => 
    api.get('/comunicaciones/stats'),

  // Estado de servicios
  verificarServicios: () => 
    api.get('/comunicaciones/servicios/estado'),
};
```

---

## DISEÑO UI SUGERIDO

Seguir el estilo existente del proyecto. Usar los mismos componentes de UI (probablemente Tailwind + shadcn/ui o similar).

Colores sugeridos para cada canal:
- 📱 WhatsApp: `#25D366` (verde WhatsApp)
- 📞 Llamadas: `#3B82F6` (azul)
- 💬 SMS: `#8B5CF6` (púrpura)
- 📧 Email: `#EF4444` (rojo Gmail)

