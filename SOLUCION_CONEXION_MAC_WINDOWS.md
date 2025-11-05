# 🔧 Solución de Problemas: Conexión Mac ↔ Windows

## Error: `ERR_ADDRESS_UNREACHABLE`

Este error indica que la URL está mal formada o que no se puede alcanzar el servidor.

### Paso 1: Verificar el archivo `.env` en Mac

En la terminal del Mac, ejecuta:

```bash
cd ~/Desktop/DiamondSistem/frontend
cat .env
```

**Debe mostrar EXACTAMENTE:**
```
VITE_API_URL=http://10.0.0.156:5000/api
```

**Si está mal, corrígelo:**
```bash
nano .env
```

**Contenido correcto:**
```env
VITE_API_URL=http://10.0.0.156:5000/api
```

**Verifica:**
- ✅ Empieza con `http://` (no `http:/` ni solo `http`)
- ✅ No tiene espacios
- ✅ Tiene `:5000` (dos puntos antes del puerto)
- ✅ Termina con `/api`

### Paso 2: Reiniciar el servidor frontend en Mac

Después de corregir el `.env`:

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia
npm run dev
```

### Paso 3: Verificar que el Backend está corriendo en Windows

En Windows, verifica que el backend esté corriendo:

```cmd
cd C:\Users\eac\Desktop\DiamondSistem\backend
npm run dev
```

Deberías ver:
```
🌐 Servidor local: http://localhost:5000
🌐 Servidor red:   http://10.0.0.156:5000
✅ Conexión a la base de datos establecida
```

### Paso 4: Probar conexión desde Mac

En la terminal del Mac, prueba:

```bash
curl http://10.0.0.156:5000/health
```

**Si funciona:** Debería responder con un JSON.

**Si no funciona:**
- Verifica que Windows y Mac estén en la misma red WiFi
- Verifica que el firewall de Windows permite el puerto 5000
- Verifica que la IP de Windows sigue siendo `10.0.0.156` (puede cambiar)

### Paso 5: Verificar IP de Windows

Si la IP cambió, actualiza el `.env` en Mac:

En Windows, ejecuta:
```cmd
ipconfig
```

Busca la IPv4 del adaptador Wi-Fi (ejemplo: `10.0.0.156`)

Luego en Mac, actualiza el `.env`:
```bash
cd ~/Desktop/DiamondSistem/frontend
nano .env
```

Cambia la IP si es necesario:
```env
VITE_API_URL=http://NUEVA_IP:5000/api
```

### Paso 6: Verificar en la consola del navegador

1. Abre el navegador en Mac
2. Ve a `http://localhost:5173`
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña "Network" o "Red"
5. Intenta hacer login
6. Verifica que la URL de la petición sea:
   - ✅ `http://10.0.0.156:5000/api/auth/login/vendedor`
   - ❌ NO `10.0.0.156/5000/api/...` (falta `http://`)
   - ❌ NO `http://localhost:5000/api/...` (está usando localhost)

## Checklist de Verificación

- [ ] Archivo `.env` en Mac tiene `VITE_API_URL=http://10.0.0.156:5000/api`
- [ ] El archivo `.env` empieza con `http://` (no solo `http` o `http:/`)
- [ ] Backend corriendo en Windows
- [ ] Backend muestra "Servidor red: http://10.0.0.156:5000"
- [ ] Firewall de Windows permite puerto 5000
- [ ] Windows y Mac en la misma red WiFi
- [ ] IP de Windows es `10.0.0.156` (verificar con `ipconfig`)
- [ ] `curl http://10.0.0.156:5000/health` funciona desde Mac
- [ ] Frontend reiniciado después de cambiar `.env`

## Solución Rápida

Si nada funciona, prueba esto:

1. **En Windows, verifica la IP:**
   ```cmd
   ipconfig | findstr IPv4
   ```

2. **En Mac, crea/actualiza `.env`:**
   ```bash
   cd ~/Desktop/DiamondSistem/frontend
   echo "VITE_API_URL=http://IP_DE_WINDOWS:5000/api" > .env
   # Reemplaza IP_DE_WINDOWS con la IP real
   ```

3. **Reinicia frontend en Mac:**
   ```bash
   npm run dev
   ```

4. **Prueba la conexión:**
   ```bash
   curl http://IP_DE_WINDOWS:5000/health
   ```

