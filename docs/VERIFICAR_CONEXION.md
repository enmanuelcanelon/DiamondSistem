# 🔍 Verificación de Conexión Mac ↔ Windows

## Paso 1: Verificar que el Backend está corriendo en Windows

**En Windows, abre una terminal y ejecuta:**

```cmd
cd C:\Users\eac\Desktop\DiamondSistem\backend
npm run dev
```

**Debes ver algo como:**
```
✅ Conexión a la base de datos establecida
🌐 Servidor local: http://localhost:5000
🌐 Servidor red:   http://10.0.0.156:5000
```

**Si no ves esto, el backend NO está corriendo.**

## Paso 2: Probar conexión desde Mac

**En la terminal del Mac, ejecuta:**

```bash
curl http://10.0.0.156:5000/health
```

**Si funciona:** Verás un JSON con información del servidor.

**Si NO funciona:** Verás un error. Esto significa que:
- El backend no está corriendo en Windows
- O el firewall está bloqueando
- O la IP cambió
- O no están en la misma red WiFi

## Paso 3: Verificar la IP de Windows

**En Windows, ejecuta:**

```cmd
ipconfig | findstr IPv4
```

**Busca la IP del adaptador Wi-Fi.** Si es diferente a `10.0.0.156`, actualiza el `.env` en Mac.

## Paso 4: Verificar archivo .env en Mac

**En Mac, ejecuta:**

```bash
cd ~/Desktop/DiamondSistem/frontend
cat .env
```

**Debe mostrar EXACTAMENTE:**
```
VITE_API_URL=http://10.0.0.156:5000/api
```

**Si está mal o no existe, créalo:**

```bash
echo "VITE_API_URL=http://10.0.0.156:5000/api" > .env
cat .env
```

## Paso 5: Reiniciar frontend en Mac

**Después de verificar/corregir el .env:**

```bash
cd ~/Desktop/DiamondSistem/frontend
# Detén el servidor si está corriendo (Ctrl+C)
npm run dev
```

## Paso 6: Verificar en el navegador

1. Abre `http://localhost:5173` en Mac
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña "Network"
4. Haz clic en una de las peticiones fallidas
5. Mira la pestaña "Headers"
6. Verifica la URL de la petición:
   - ✅ Debe ser: `http://10.0.0.156:5000/api/auth/login/vendedor`
   - ❌ NO debe ser: `http://localhost:5000/api/...`
   - ❌ NO debe ser: `10.0.0.156:5000/api/...` (sin http://)

## Solución Rápida Completa

**En Mac, ejecuta estos comandos uno por uno:**

```bash
# 1. Ir a la carpeta del frontend
cd ~/Desktop/DiamondSistem/frontend

# 2. Crear/sobrescribir el archivo .env
echo "VITE_API_URL=http://10.0.0.156:5000/api" > .env

# 3. Verificar que se creó correctamente
cat .env

# 4. Probar conexión al backend
curl http://10.0.0.156:5000/health

# 5. Si curl funciona, reiniciar el frontend
npm run dev
```

