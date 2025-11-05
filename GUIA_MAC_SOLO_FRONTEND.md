# 🍎 Mac - Solo Frontend (Backend en Windows)

Esta configuración permite que el Mac solo ejecute el frontend, mientras el backend y la base de datos corren en Windows en la misma red.

## 📋 Requisitos en Mac

1. **Node.js** (versión 18 o superior)
   ```bash
   # Instalar con Homebrew
   brew install node@18
   ```

2. **Git** (si no está instalado)
   ```bash
   brew install git
   ```

**NO necesitas PostgreSQL en Mac** - La base de datos está en Windows.

## 🚀 Instalación en Mac

### Paso 1: Clonar el Repositorio

```bash
cd ~/Desktop
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

### Paso 2: Instalar Solo el Frontend

```bash
cd frontend
npm install
```

### Paso 3: Obtener la IP de Windows

**En Windows**, abre PowerShell o CMD y ejecuta:
```cmd
ipconfig
```

Busca la dirección IPv4 (ejemplo: `192.168.1.50`)

### Paso 4: Configurar el Frontend para Conectarse a Windows

Crea un archivo `.env` en la carpeta `frontend/`:

```bash
cd frontend
nano .env
```

O usando cualquier editor de texto, crea `frontend/.env` con:

```env
VITE_API_URL=http://IP_DE_WINDOWS:5000/api
```

**Ejemplo:**
```env
VITE_API_URL=http://192.168.1.50:5000/api
```

⚠️ **IMPORTANTE:** Reemplaza `IP_DE_WINDOWS` con la IP real de tu computadora Windows.

### Paso 5: Ejecutar el Frontend

```bash
npm run dev
```

El frontend debería estar disponible en:
- **Local Mac:** `http://localhost:5173`
- **Desde otros dispositivos:** `http://IP_DEL_MAC:5173`

## 🔧 Configuración en Windows (Servidor Principal)

### 1. Verificar que el Backend Escucha en la Red

Asegúrate de que `backend/src/server.js` tenga:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

### 2. Verificar Firewall de Windows

1. Abre **Configuración de Windows** > **Red e Internet** > **Firewall de Windows**
2. Haz clic en **Configuración avanzada**
3. Clic en **Reglas de entrada** > **Nueva regla**
4. Selecciona **Puerto** > **Siguiente**
5. TCP, puerto específico: **5000** > **Siguiente**
6. Permitir la conexión > **Siguiente**
7. Marca todas las opciones > **Siguiente**
8. Nombre: "DiamondSistem Backend" > **Finalizar**

Repite el proceso para el puerto **5173** (frontend) si quieres acceder desde otros dispositivos.

### 3. Obtener la IP de Windows

En PowerShell o CMD:
```cmd
ipconfig
```

Busca tu dirección IPv4 (ejemplo: `192.168.1.50`)

### 4. Verificar que el Backend Está Accesible

Desde el Mac, puedes probar:
```bash
curl http://IP_DE_WINDOWS:5000/health
```

Debería responder con un JSON.

## 📱 Uso con Múltiples Dispositivos

### Escenario 1: Mac y Windows en la Misma Red

- **Windows:** Backend + Base de datos corriendo
- **Mac:** Frontend corriendo
- **Acceso desde Mac:** `http://localhost:5173` (usa el frontend local que se conecta al backend de Windows)
- **Acceso desde otros dispositivos:** `http://IP_DEL_MAC:5173` (también se conecta al backend de Windows)

### Escenario 2: Solo Windows como Servidor

- **Windows:** Backend + Base de datos corriendo
- **Mac:** Solo clona el repo y configura el `.env` para apuntar a Windows
- **Acceso desde cualquier dispositivo:** `http://IP_DE_WINDOWS:5173` (si también ejecutas el frontend en Windows)

### Escenario 3: Frontend en Cada Dispositivo

- **Windows:** Backend + Base de datos (puerto 5000)
- **Mac:** Frontend (puerto 5173) - se conecta a Windows
- **Tablet/Teléfono:** Abre el navegador y va a `http://IP_DEL_MAC:5173`

## 🔍 Verificar la Conexión

### Desde Mac

1. **Verificar que el backend está accesible:**
   ```bash
   curl http://IP_DE_WINDOWS:5000/health
   ```

2. **Verificar que el frontend se conecta:**
   - Abre el navegador en Mac
   - Ve a `http://localhost:5173`
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Network" o "Red"
   - Intenta hacer login o cualquier acción
   - Verifica que las peticiones van a `http://IP_DE_WINDOWS:5000/api/...`

## ⚠️ Solución de Problemas

### Error: "Network Error" o "CORS Error"

1. **Verificar que el backend en Windows está corriendo:**
   ```cmd
   # En Windows, verifica que el puerto 5000 está en uso
   netstat -ano | findstr :5000
   ```

2. **Verificar CORS en Windows:**
   - Asegúrate de que `backend/src/server.js` tenga CORS configurado para desarrollo
   - Debería tener `origin: '*'` en desarrollo

3. **Verificar firewall de Windows:**
   - Asegúrate de que el puerto 5000 está permitido

### Error: "Connection Refused"

1. **Verificar IP de Windows:**
   ```cmd
   ipconfig
   ```
   Asegúrate de usar la IP correcta

2. **Verificar que el backend escucha en 0.0.0.0:**
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
   ```

3. **Verificar que estás en la misma red WiFi**

### No Puedo Acceder desde el Mac

1. **Verificar conectividad de red:**
   ```bash
   ping IP_DE_WINDOWS
   ```

2. **Verificar que Windows permite conexiones:**
   - Firewall de Windows
   - Antivirus (puede bloquear conexiones)

3. **Verificar que el backend está corriendo:**
   - En Windows, verifica los logs del servidor

## 📝 Comandos Útiles

### En Mac (Solo Frontend)

```bash
# Actualizar código
cd ~/Desktop/DiamondSistem
git pull origin main

# Actualizar dependencias
cd frontend
npm install

# Ejecutar
npm run dev
```

### En Windows (Backend + Base de Datos)

```bash
# Actualizar código
cd C:\Users\eac\Desktop\DiamondSistem
git pull origin main

# Actualizar dependencias backend
cd backend
npm install
npx prisma generate
npx prisma db push

# Ejecutar backend
npm run dev
```

## 🎯 Resumen de la Arquitectura

```
┌─────────────────┐
│   Windows PC    │
│                 │
│  ┌───────────┐  │
│  │ PostgreSQL │  │
│  └─────┬──────┘  │
│        │         │
│  ┌─────▼──────┐  │
│  │  Backend   │  │ ← Puerto 5000
│  │  (Node.js) │  │
│  └────────────┘  │
└────────┬─────────┘
         │
         │ Red Local (WiFi)
         │
┌────────▼─────────┐
│   Mac / Tablet   │
│                  │
│  ┌─────────────┐ │
│  │  Frontend   │ │ ← Puerto 5173
│  │  (React)    │ │
│  └─────────────┘ │
└──────────────────┘
```

## ✅ Ventajas de Esta Configuración

1. **Una sola base de datos:** Todos los dispositivos comparten los mismos datos
2. **Más simple:** No necesitas instalar PostgreSQL en cada dispositivo
3. **Centralizado:** El backend y la base de datos están en un solo lugar
4. **Escalable:** Puedes agregar más dispositivos frontend fácilmente

## 🔐 Seguridad

⚠️ **IMPORTANTE:** Esta configuración es solo para desarrollo en red local.

En producción:
- Usa HTTPS
- Configura CORS correctamente
- Usa autenticación robusta
- Considera usar un servidor web profesional (Nginx, Apache)

