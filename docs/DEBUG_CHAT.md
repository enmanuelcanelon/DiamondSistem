# 🔍 Debug: Problema de Chat Cliente → Vendedor

## 🐛 Problema Reportado
La comunicación no funciona desde el cliente y no llega al vendedor.

---

## ✅ Logs Agregados

He agregado logs extensivos en el frontend y backend para diagnosticar el problema:

### Frontend (`frontend/src/components/Chat.jsx`)
- 🔄 Log cuando se obtienen mensajes
- 📤 Log cuando se envía un mensaje
- ✅ Log cuando el mensaje se envía exitosamente
- ❌ Log de errores al enviar

### Backend (`backend/src/routes/mensajes.routes.js`)
- 📥 Log cuando se obtienen mensajes de un contrato
- 📨 Log del número de mensajes encontrados
- ✅ Log de mensajes marcados como leídos
- 📩 Log cuando llega un nuevo mensaje
- ✅ Log cuando se crea exitosamente
- ❌ Log de errores

---

## 🧪 Cómo Probar y Ver los Logs

### Paso 1: Abrir la Consola del Navegador
1. **Abre el navegador** (Chrome, Firefox, Edge)
2. Presiona **F12** o **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)
3. Ve a la pestaña **Console**

### Paso 2: Login como Cliente
1. Ve a `http://localhost:5173/cliente/login`
2. Ingresa el código de acceso de tu cliente (ej: `CLI-0001-D1JC79MHFTIGR1`)
3. Ve a la sección "Comunicación"

### Paso 3: Enviar un Mensaje
1. Escribe un mensaje en el chat
2. Presiona "Enviar"
3. **OBSERVA LA CONSOLA** del navegador

### Paso 4: Ver Logs del Backend
1. **Abre la terminal** donde está corriendo el backend
2. Deberías ver logs como:
```
📩 Enviando mensaje: { contrato_id: 1, mensaje: 'Hola', destinatario_tipo: 'vendedor', destinatario_id: 1 }
✅ Mensaje creado exitosamente: 15
```

### Paso 5: Login como Vendedor
1. **Abre otra ventana del navegador** (o pestaña de incógnito)
2. Ve a `http://localhost:5173/login`
3. Login como vendedor
4. Ve a "Gestión de Eventos" → Click en "Chat" de un evento
5. **OBSERVA LA CONSOLA** del navegador

---

## 🔎 Qué Buscar en los Logs

### ✅ Si TODO funciona correctamente, verás:

**En el Cliente (consola del navegador):**
```
📤 Enviando mensaje desde frontend: { contrato_id: 1, mensaje: 'Hola', destinatario_tipo: 'vendedor', destinatario_id: 1, user_tipo: 'cliente', user_id: 1 }
✅ Respuesta del servidor: { success: true, message: 'Mensaje enviado exitosamente', mensaje: {...} }
✅ Mensaje enviado, invalidando queries...
🔄 Obteniendo mensajes del contrato: 1
📨 Mensajes recibidos: 1 mensajes
```

**En el Backend (terminal):**
```
📩 Enviando mensaje: { contrato_id: 1, mensaje: 'Hola', destinatario_tipo: 'vendedor', destinatario_id: 1, remitente_tipo: 'cliente', remitente_id: 1 }
✅ Mensaje creado exitosamente: 15
POST /api/mensajes - 201 - 10ms
```

**En el Vendedor (consola del navegador después de 5 segundos):**
```
🔄 Obteniendo mensajes del contrato: 1
📨 Mensajes recibidos: 1 mensajes
```

---

## ❌ Posibles Problemas y Soluciones

### Problema 1: "Faltan datos requeridos"
**Síntoma:** Error en el backend
```
❌ Error al enviar mensaje: Faltan datos requeridos
```

**Solución:**
- Verificar que `contratoId`, `destinatarioId`, `destinatarioTipo` se están pasando correctamente
- Revisar en la consola del navegador qué valores tiene

### Problema 2: "No tienes acceso a este contrato"
**Síntoma:** Error 403
```
❌ Error al enviar mensaje: No tienes acceso a este contrato
```

**Solución:**
- Verificar que el cliente_id del contrato coincide con el user.id del cliente
- Verificar en la base de datos: `SELECT * FROM contratos WHERE id = X;`

### Problema 3: Mensaje se envía pero no aparece
**Síntoma:** ✅ en logs pero no se ve en la interfaz

**Posibles causas:**
1. **El refetch no está funcionando:** Espera 5 segundos o recarga la página
2. **Problema con el contratoId:** Verifica que ambos (cliente y vendedor) están viendo el mismo contrato
3. **Problema con el filtrado:** Verifica que `esMio` está evaluando correctamente

### Problema 4: Vendedor no ve los mensajes
**Síntoma:** Cliente envía, pero vendedor no recibe

**Verificar:**
1. **¿El vendedor está en el chat correcto?**
   - Verifica el `contratoId` en la URL del vendedor
   - Debe ser el mismo que el del cliente

2. **¿El refetch está activado?**
   - Espera 5 segundos
   - Deberías ver en la consola del vendedor: `🔄 Obteniendo mensajes del contrato: X`

3. **¿El vendedor tiene acceso al contrato?**
   - Verifica: `SELECT vendedor_id FROM contratos WHERE id = X;`
   - Debe coincidir con el ID del vendedor logueado

---

## 🛠️ Debug Manual en la Base de Datos

### Ver todos los mensajes de un contrato:
```sql
SELECT 
  id,
  remitente_tipo,
  remitente_id,
  destinatario_tipo,
  destinatario_id,
  mensaje,
  leido,
  fecha_envio
FROM mensajes
WHERE contrato_id = 1
ORDER BY fecha_envio DESC;
```

### Ver información del contrato:
```sql
SELECT 
  id,
  codigo_contrato,
  cliente_id,
  vendedor_id
FROM contratos
WHERE id = 1;
```

### Ver información del cliente:
```sql
SELECT 
  id,
  nombre_completo,
  contrato_id
FROM clientes
WHERE id = 1;
```

---

## 📋 Checklist de Verificación

- [ ] El backend está corriendo (`npm run dev` en la carpeta `backend`)
- [ ] El frontend está corriendo (`npm run dev` en la carpeta `frontend`)
- [ ] El cliente puede hacer login correctamente
- [ ] El vendedor puede hacer login correctamente
- [ ] El cliente puede ver el chat (ruta: `/cliente/chat`)
- [ ] El vendedor puede ver el chat (ruta: `/chat/:contratoId`)
- [ ] Ambos están viendo el MISMO `contratoId`
- [ ] La consola del navegador está abierta en ambos (F12)
- [ ] La terminal del backend está visible

---

## 🚨 Si Nada Funciona

1. **Reinicia todo:**
   ```bash
   # Backend
   cd backend
   Ctrl+C
   npm run dev
   
   # Frontend (en otra terminal)
   cd frontend
   Ctrl+C
   npm run dev
   ```

2. **Limpia el caché del navegador:**
   - Presiona `Ctrl+Shift+Delete`
   - Selecciona "Caché" y "Cookies"
   - Limpia

3. **Verifica las variables de entorno:**
   ```bash
   # backend/.env
   DATABASE_URL="..."
   JWT_SECRET="..."
   PORT=5000
   ```

4. **Verifica la configuración de API:**
   ```javascript
   // frontend/src/config/api.js
   baseURL: 'http://localhost:5000/api'
   ```

---

## 📞 Información para Reportar

Si el problema persiste, copia y pega los siguientes logs:

1. **Consola del navegador (cliente):** Todo lo que aparece al enviar un mensaje
2. **Terminal del backend:** Los logs de `📩 Enviando mensaje` y `✅ Mensaje creado`
3. **Consola del navegador (vendedor):** Los logs de `🔄 Obteniendo mensajes`
4. **Resultado de la query SQL:** 
   ```sql
   SELECT * FROM mensajes WHERE contrato_id = X ORDER BY fecha_envio DESC LIMIT 5;
   ```

---

**Fecha:** Noviembre 1, 2025  
**Estado:** 🔍 **DEBUGGING EN PROGRESO**



