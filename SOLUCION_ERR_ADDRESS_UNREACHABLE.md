# 🔧 Solución: ERR_ADDRESS_UNREACHABLE desde Navegador

## Problema
- ✅ `curl` funciona desde la terminal del Mac
- ❌ `fetch` desde el navegador no funciona
- ❌ El frontend no puede conectarse

Esto indica que el problema es específico del navegador o de cómo el navegador maneja las conexiones de red.

## Posibles Causas

1. **Firewall de Windows bloqueando navegadores específicamente**
2. **Configuración de red del Mac bloqueando navegadores**
3. **Restricciones de seguridad del navegador**
4. **Problema con la red local (WiFi)**

## Soluciones

### Solución 1: Verificar que estás en la misma red WiFi

**En Windows:**
```cmd
ipconfig | findstr IPv4
```

**En Mac:**
```bash
ifconfig | grep "inet "
```

Ambos deben estar en el mismo rango de red (ej: `10.0.0.x`)

### Solución 2: Probar con otro navegador en Mac

Prueba con:
- Safari
- Firefox
- Chrome en modo incógnito

### Solución 3: Verificar firewall de Windows más a fondo

El firewall puede estar bloqueando conexiones desde navegadores específicamente. 

**En Windows PowerShell (como Administrador):**

```powershell
# Ver reglas de firewall relacionadas
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Diamond*" -or $_.DisplayName -like "*Node*"}

# Crear regla más permisiva para desarrollo
New-NetFirewallRule -DisplayName "Node.js Development" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

### Solución 4: Deshabilitar temporalmente el firewall (SOLO PARA PRUEBAS)

**⚠️ ADVERTENCIA:** Solo haz esto temporalmente para probar, luego reactívalo.

```powershell
# Deshabilitar temporalmente
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Probar desde el navegador

# REACTIVAR después de la prueba
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

### Solución 5: Verificar configuración de red en Mac

```bash
# Verificar configuración de red
networksetup -listallnetworkservices

# Verificar configuración del WiFi
networksetup -getinfo "Wi-Fi"
```

### Solución 6: Usar localhost con proxy (Alternativa)

Si nada funciona, puedes usar un proxy local en Mac:

```bash
# Instalar localtunnel (alternativa)
npm install -g localtunnel

# En Windows, exponer el puerto 5000
# (Esto requiere instalación en Windows)
```

## Solución Recomendada: Verificar Reglas de Firewall

El problema más probable es que el firewall de Windows esté bloqueando conexiones desde navegadores. 

**Verifica en Windows:**

1. Abre "Firewall de Windows Defender con seguridad avanzada"
2. Ve a "Reglas de entrada"
3. Busca "DiamondSistem Backend"
4. Haz doble clic en la regla
5. Ve a la pestaña "Programas y servicios"
6. Asegúrate de que esté configurada para "Todos los programas" o "Cualquier programa"

## Verificación Final

Después de aplicar las soluciones:

1. **Desde Mac terminal:**
   ```bash
   curl http://10.0.0.156:5000/health
   ```

2. **Desde Mac navegador:**
   - Abre `http://10.0.0.156:5000/health` directamente
   - Debería mostrar un JSON

3. **Desde el frontend:**
   - Intenta hacer login nuevamente

