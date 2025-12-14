# 🔥 Configurar Firewall de Windows para DiamondSistem

Esta guía te ayudará a configurar el firewall de Windows para que otros dispositivos en la red puedan conectarse al backend.

## ⚡ Método Rápido (PowerShell como Administrador)

1. **Abrir PowerShell como Administrador:**
   - Busca "PowerShell" en el menú de inicio
   - Clic derecho > "Ejecutar como administrador"

2. **Ejecutar estos comandos:**
   ```powershell
   # Permitir puerto 5000 (Backend)
   New-NetFirewallRule -DisplayName "DiamondSistem Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

   # Permitir puerto 5173 (Frontend, opcional)
   New-NetFirewallRule -DisplayName "DiamondSistem Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```

3. **Verificar que funcionó:**
   ```powershell
   Get-NetFirewallRule -DisplayName "DiamondSistem*"
   ```

## 🖱️ Método Manual (Interfaz Gráfica)

### Paso 1: Abrir Configuración de Firewall

1. Presiona `Windows + R`
2. Escribe `wf.msc` y presiona Enter
3. O busca "Firewall de Windows Defender con seguridad avanzada"

### Paso 2: Crear Regla para el Backend (Puerto 5000)

1. En el panel izquierdo, haz clic en **"Reglas de entrada"**
2. En el panel derecho, haz clic en **"Nueva regla..."**
3. Selecciona **"Puerto"** > **Siguiente**
4. Selecciona **"TCP"**
5. Selecciona **"Puertos locales específicos"** y escribe: `5000`
6. Haz clic en **Siguiente**
7. Selecciona **"Permitir la conexión"** > **Siguiente**
8. Marca todas las casillas (Dominio, Privada, Pública) > **Siguiente**
9. Nombre: `DiamondSistem Backend`
10. Descripción: `Permite conexiones al backend de DiamondSistem en el puerto 5000`
11. Haz clic en **Finalizar**

### Paso 3: Crear Regla para el Frontend (Puerto 5173) - Opcional

Repite el proceso anterior pero:
- Puerto: `5173`
- Nombre: `DiamondSistem Frontend`

## 🔍 Verificar la Configuración

### Verificar que las reglas están activas:

```powershell
Get-NetFirewallRule -DisplayName "DiamondSistem*" | Format-Table DisplayName, Enabled, Direction, Action
```

### Probar la conexión desde otro dispositivo:

Desde el Mac o cualquier dispositivo en la red:

```bash
# Reemplaza IP_DE_WINDOWS con tu IP real
curl http://IP_DE_WINDOWS:5000/health
```

Debería responder con un JSON.

## 📝 Obtener la IP de Windows

En PowerShell o CMD:

```cmd
ipconfig
```

Busca la dirección IPv4 (ejemplo: `192.168.1.50`)

O más específico:

```cmd
ipconfig | findstr IPv4
```

## ⚠️ Solución de Problemas

### Error: "Connection Refused"

1. **Verificar que el backend está corriendo:**
   ```cmd
   netstat -ano | findstr :5000
   ```

2. **Verificar que el firewall permite la conexión:**
   ```powershell
   Get-NetFirewallRule -DisplayName "DiamondSistem*" | Where-Object {$_.Enabled -eq $true}
   ```

3. **Verificar que el backend escucha en 0.0.0.0:**
   - En `backend/src/server.js` debe estar:
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
   ```

### Error: "Timeout"

1. **Verificar que estás en la misma red WiFi**
2. **Verificar que Windows permite conexiones de red privada:**
   - Configuración > Red e Internet > Estado > Propiedades del perfil de red
   - Asegúrate de que esté en "Privada" (no "Pública")

### El Firewall Bloquea Todo

Si el firewall está bloqueando todo:

1. **Temporalmente desactivar el firewall (solo para pruebas):**
   ```powershell
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
   ```

2. **Reactivar después:**
   ```powershell
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
   ```

⚠️ **ADVERTENCIA:** Solo desactiva el firewall temporalmente para pruebas. No lo dejes desactivado permanentemente.

## 🔐 Seguridad

- Las reglas creadas solo permiten conexiones en tu red local
- En producción, considera usar reglas más restrictivas
- Si usas un router, también verifica su configuración de firewall

## ✅ Verificación Final

Después de configurar el firewall:

1. **Backend corriendo en Windows:**
   ```cmd
   cd backend
   npm run dev
   ```

2. **Desde Mac, probar conexión:**
   ```bash
   curl http://IP_DE_WINDOWS:5000/health
   ```

3. **Si funciona, configurar frontend en Mac:**
   - Crear `frontend/.env` con:
   ```env
   VITE_API_URL=http://IP_DE_WINDOWS:5000/api
   ```

4. **Ejecutar frontend en Mac:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Acceder desde Mac:**
   - `http://localhost:5173`

¡Listo! Ahora puedes usar el frontend en Mac mientras el backend corre en Windows.

