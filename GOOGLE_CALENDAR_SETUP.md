# Configuración de Google Calendar con OAuth 2.0

Esta guía explica cómo configurar la integración con Google Calendar usando OAuth 2.0. Cada vendedor puede conectar su propia cuenta de Google Calendar de forma segura.

## Requisitos Previos

1. Acceso a [Google Cloud Console](https://console.cloud.google.com/)
2. Un proyecto de Google Cloud (o crear uno nuevo)
3. Habilitar la API de Google Calendar

## Pasos de Configuración

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID** (lo necesitarás más adelante)

### 2. Habilitar Google Calendar API

1. En el menú lateral, ve a **"APIs & Services"** > **"Library"**
2. Busca **"Google Calendar API"**
3. Haz clic en **"Enable"**

### 3. Crear Credenciales OAuth 2.0

1. Ve a **"APIs & Services"** > **"Credentials"**
2. Haz clic en **"Create Credentials"** > **"OAuth client ID"**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - Tipo de usuario: **External** (o Internal si tienes Google Workspace)
   - Completa la información requerida (nombre de la app, email de soporte, etc.)
   - Agrega los **scopes** necesarios:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events.readonly`
   - Agrega usuarios de prueba (tus vendedores) si la app está en modo "Testing"
   - Guarda y continúa

4. Crea el **OAuth Client ID**:
   - Tipo de aplicación: **Web application**
   - Nombre: "DiamondSistem Calendar Integration" (o el que prefieras)
   - **Authorized redirect URIs**: Agrega:
     - `http://localhost:5000/api/google-calendar/auth/callback` (desarrollo)
     - `https://tu-dominio.com/api/google-calendar/auth/callback` (producción)
   - Haz clic en **"Create"**

5. **Copia las credenciales**:
   - **Client ID**: Algo como `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**: Una cadena secreta

### 4. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env` en el backend:

```env
# Google Calendar OAuth 2.0
GOOGLE_OAUTH_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/google-calendar/auth/callback

# Clave de encriptación para tokens (genera una nueva con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=tu-clave-de-encriptacion-de-64-caracteres-hexadecimales

# URL del frontend (para redirección después de OAuth)
FRONTEND_URL=http://localhost:5173
```

**Importante:**
- `ENCRYPTION_KEY`: Genera una clave segura de 64 caracteres hexadecimales. Puedes usar:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Nunca compartas** tu `ENCRYPTION_KEY` ni `GOOGLE_OAUTH_CLIENT_SECRET`
- En producción, usa variables de entorno seguras (no las pongas en el código)

### 5. Ejemplo de Archivo .env Completo

```env
# Configuración general
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://usuario:password@localhost:5432/diamondsistem

# Google Calendar OAuth 2.0
GOOGLE_OAUTH_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/google-calendar/auth/callback

# Encriptación
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Frontend
FRONTEND_URL=http://localhost:5173
```

## Uso en la Aplicación

### Para Vendedores

1. Inicia sesión en la aplicación
2. Ve a **Configuración** (en el menú lateral)
3. Haz clic en **"Conectar con Google Calendar"**
4. Serás redirigido a Google para autorizar el acceso
5. Selecciona la cuenta de Google que quieres conectar
6. Acepta los permisos solicitados
7. Serás redirigido de vuelta a la aplicación con tu calendario conectado

### Para Managers

Los managers pueden ver todos los calendarios de todos los vendedores en la vista de calendario.

## Funcionalidades

### Vendedor

- **Ver su propio calendario**: Los vendedores solo ven sus propios eventos y leaks/citas
- **Verificar disponibilidad**: Al crear una oferta, el sistema verifica si hay eventos en Google Calendar sin mostrar detalles
- **Sincronización automática**: Los eventos se sincronizan automáticamente

### Manager

- **Ver todos los calendarios**: Los managers pueden ver eventos de todos los vendedores
- **Vista consolidada**: Todos los eventos aparecen en una sola vista

## Seguridad

- **Tokens encriptados**: Los tokens de acceso y refresh se almacenan encriptados en la base de datos
- **Refresh automático**: Los tokens se renuevan automáticamente cuando expiran
- **Permisos limitados**: Solo se solicitan permisos de lectura (`readonly`)
- **Aislamiento por vendedor**: Cada vendedor solo puede ver su propio calendario

## Solución de Problemas

### Error: "Google OAuth no configurado"

- Verifica que todas las variables de entorno estén configuradas en `.env`
- Asegúrate de que `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` sean correctos
- Reinicia el servidor backend después de cambiar el `.env`

### Error: "redirect_uri_mismatch"

- Verifica que la URI de redirección en Google Cloud Console coincida exactamente con `GOOGLE_OAUTH_REDIRECT_URI`
- Asegúrate de incluir `http://` o `https://` según corresponda
- No incluyas una barra final (`/`) a menos que esté en ambas configuraciones

### Error: "access_denied"

- El usuario canceló la autorización
- Intenta conectarlo nuevamente desde Configuración

### Error: "invalid_grant"

- El token de refresh expiró o fue revocado
- El vendedor debe desconectar y volver a conectar su cuenta

### No aparecen eventos de Google Calendar

1. **Verifica la conexión**:
   - Ve a Configuración
   - Verifica que el estado muestre "Conectado"
   - Si no está conectado, haz clic en "Conectar con Google Calendar"

2. **Verifica los permisos**:
   - Asegúrate de que el vendedor haya aceptado todos los permisos
   - Si es necesario, desconecta y vuelve a conectar

3. **Revisa los logs del backend**:
   - Busca mensajes de error relacionados con Google Calendar
   - Verifica que los tokens sean válidos

### El token expira frecuentemente

- Los tokens se renuevan automáticamente cuando están por expirar
- Si hay problemas, verifica que `ENCRYPTION_KEY` sea correcta
- El sistema intenta refrescar el token 5 minutos antes de que expire

## Notas Importantes

- **Cada vendedor debe conectar su propia cuenta**: No hay un calendario compartido
- **Los tokens se almacenan de forma segura**: Encriptados en la base de datos
- **Solo lectura**: La aplicación solo lee eventos, no los modifica
- **Privacidad**: Los vendedores no pueden ver los eventos de otros vendedores
- **Managers**: Los managers pueden ver todos los calendarios para coordinación

## Migración desde iCal Público

Si anteriormente usabas el sistema de iCal público:

1. Los vendedores ahora deben conectar sus propias cuentas
2. Ya no necesitas `GOOGLE_CALENDAR_ID` en el `.env`
3. Cada vendedor tiene su propio calendario privado
4. Los managers pueden ver todos los calendarios

## Producción

Para producción:

1. Cambia `GOOGLE_OAUTH_REDIRECT_URI` a tu dominio de producción
2. Agrega el dominio de producción en Google Cloud Console (Authorized redirect URIs)
3. Cambia `FRONTEND_URL` a tu dominio de producción
4. Asegúrate de que `ENCRYPTION_KEY` sea una clave segura y única
5. Considera usar un servicio de gestión de secretos (AWS Secrets Manager, Azure Key Vault, etc.)
