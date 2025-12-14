# 📧 Configuración del Sistema de Emails

## 🚀 Opción 1: Configuración Automática (RECOMENDADA)

### Paso 1: Ejecutar el script de configuración

```bash
cd backend
node setup-email-test.js
```

Esto creará automáticamente:
- ✅ Una cuenta de email de prueba en Ethereal
- ✅ Configuración en el archivo `.env`
- ✅ Email de prueba para verificar que funciona

### Paso 2: Reiniciar el servidor

```bash
npm run dev
```

### Paso 3: Ver los emails enviados

Los emails NO se envían realmente, pero puedes verlos en:
🔗 https://ethereal.email/messages

Login con las credenciales que te mostró el script.

---

## 🔧 Opción 2: Configuración Manual

### Para Desarrollo (Ethereal - Gratis):

1. Ve a https://ethereal.email/create
2. Crea una cuenta de prueba
3. Copia las credenciales a tu `.env`:

```env
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=tu-usuario@ethereal.email
EMAIL_PASS=tu-contraseña
FRONTEND_URL=http://localhost:5173
```

### Para Producción (Gmail):

1. **Habilitar verificación en 2 pasos** en tu cuenta de Gmail
2. **Crear contraseña de aplicación:**
   - Ve a: https://myaccount.google.com/security
   - Busca "Contraseñas de aplicaciones"
   - Genera una contraseña para "Correo"
   
3. **Configurar en `.env`:**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña-de-aplicación-generada
FRONTEND_URL=http://localhost:5173
```

### Para Producción (Proton Mail):

⚠️ **Nota**: Proton Mail tiene limitaciones con SMTP externo.

1. **Proton Mail Bridge** (solo para cuentas Plus/Visionary):
   - Descarga: https://proton.me/mail/bridge
   - Instala y configura
   - Usa `localhost:1025` como host

2. **O usa Gmail/SendGrid** para emails automáticos

---

## 🧪 Probar la Configuración

### Desde el Backend:

```bash
cd backend
node -e "require('./src/services/emailService').verificarConfiguracion()"
```

### Desde el Frontend:

1. Login como vendedor
2. Ve a detalles de un contrato
3. Click en "Enviar por Email"
4. Verifica el resultado

---

## ❌ Solución de Problemas

### Error: "connect ETIMEDOUT"

**Problema**: No puede conectar al servidor SMTP.

**Soluciones**:
1. Verifica que el puerto no esté bloqueado por firewall
2. Usa el script de configuración automática
3. Prueba con Gmail en lugar de Proton Mail

### Error: "Invalid login"

**Problema**: Credenciales incorrectas.

**Soluciones**:
1. Verifica usuario y contraseña en `.env`
2. Si usas Gmail, usa contraseña de aplicación (no tu contraseña normal)
3. Regenera las credenciales con el script

### Error: "Cannot destructure property"

**Problema**: El backend no recibe los datos correctamente.

**Solución**: Ya está arreglado en la última versión.

---

## 📊 Estado de Configuración

| Proveedor | Facilidad | Recomendado | Notas |
|-----------|-----------|-------------|-------|
| **Ethereal** | ⭐⭐⭐⭐⭐ | ✅ **Desarrollo** | Gratis, fácil, no envía emails reales |
| **Gmail** | ⭐⭐⭐⭐ | ✅ **Producción** | Confiable, requiere contraseña de app |
| **SendGrid** | ⭐⭐⭐ | ✅ **Producción** | Profesional, API key |
| **Proton Mail** | ⭐ | ❌ No recomendado | Requiere Bridge (solo Plus) |

---

## 🎯 Recomendación Final

### Para AHORA (Desarrollo):
```bash
cd backend
node setup-email-test.js
npm run dev
```

### Para PRODUCCIÓN:
Usa Gmail con contraseña de aplicación o SendGrid.

---

## ✅ Verificación Rápida

1. ¿El servidor inicia sin errores? ✓
2. ¿El botón "Enviar por Email" funciona? ✓
3. ¿Ves el email en Ethereal? ✓

Si respondiste "SÍ" a todo, ¡estás listo! 🎉

---

**Última actualización**: Noviembre 2025

