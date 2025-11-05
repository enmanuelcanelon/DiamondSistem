# Guía de Instalación y Configuración - DiamondSistem (Mac)

Esta guía te ayudará a configurar y ejecutar DiamondSistem en una Mac para hacer pruebas con múltiples dispositivos simultáneamente.

## 📋 Requisitos Previos

1. **Homebrew** (gestor de paquetes para Mac)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Node.js** (versión 18 o superior)
   ```bash
   brew install node@18
   ```

3. **PostgreSQL** (base de datos)
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

4. **Git** (si no está instalado)
   ```bash
   brew install git
   ```

## 🚀 Instalación Paso a Paso

### Paso 1: Clonar el Repositorio

```bash
cd ~/Desktop
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

### Paso 2: Configurar PostgreSQL

1. **Crear la base de datos:**
   ```bash
   psql postgres
   ```

2. **Dentro de psql, ejecutar:**
   ```sql
   CREATE DATABASE diamondsistem;
   CREATE USER diamondsistem WITH PASSWORD 'tu_password_aqui';
   GRANT ALL PRIVILEGES ON DATABASE diamondsistem TO diamondsistem;
   \q
   ```

3. **Configurar la conexión:**
   - Edita el archivo `backend/.env`:
   ```env
   DATABASE_URL="postgresql://diamondsistem:tu_password_aqui@localhost:5432/diamondsistem?schema=public"
   PORT=5000
   JWT_SECRET=tu_jwt_secret_aqui
   ```

### Paso 3: Configurar Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

El backend debería estar corriendo en `http://localhost:5000`

### Paso 4: Configurar Frontend

**Terminal 1 (Backend):** Ya debería estar corriendo.

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

El frontend debería estar corriendo en `http://localhost:5173`

## 🌐 Configuración para Múltiples Dispositivos

Para acceder desde otros dispositivos en la misma red WiFi:

### Opción 1: Usar la IP Local de tu Mac

1. **Obtener la IP de tu Mac:**
   ```bash
   ipconfig getifaddr en0
   ```
   O en algunos casos:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Configurar el backend para aceptar conexiones externas:**
   - Edita `backend/src/server.js` y asegúrate de que el servidor escuche en `0.0.0.0`:
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
   });
   ```

3. **Configurar CORS en el backend:**
   - Asegúrate de que `backend/src/server.js` tenga CORS configurado para aceptar conexiones de cualquier origen en desarrollo:
   ```javascript
   const cors = require('cors');
   app.use(cors({
     origin: '*', // En producción, cambiar a dominios específicos
     credentials: true
   }));
   ```

4. **Configurar el frontend para usar la IP del Mac:**
   - Edita `frontend/src/config/api.js` y cambia la URL base:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://TU_IP_MAC:5000/api';
   ```
   O crea un archivo `.env` en `frontend/`:
   ```env
   VITE_API_URL=http://TU_IP_MAC:5000/api
   ```

### Ejemplo de Configuración

Si tu Mac tiene la IP `192.168.1.100`:

- **Backend:** `http://192.168.1.100:5000`
- **Frontend:** `http://192.168.1.100:5173`

**Acceso desde otros dispositivos:**
- Dispositivo 1: `http://192.168.1.100:5173`
- Dispositivo 2: `http://192.168.1.100:5173`
- Ambos usarán el mismo backend en `http://192.168.1.100:5000`

## 🔧 Solución de Problemas

### Error: "Cannot find module"
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port already in use"
```bash
# Encontrar y matar el proceso que usa el puerto
lsof -ti:5000 | xargs kill -9  # Para puerto 5000
lsof -ti:5173 | xargs kill -9  # Para puerto 5173
```

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL está corriendo
brew services list | grep postgresql

# Reiniciar PostgreSQL
brew services restart postgresql@14
```

### Error de Prisma
```bash
cd backend
npx prisma generate
npx prisma db push
```

### No puedo acceder desde otros dispositivos

1. **Verificar firewall de Mac:**
   - Sistema > Preferencias del Sistema > Seguridad y Privacidad > Firewall
   - Asegúrate de permitir Node.js

2. **Verificar que estás en la misma red WiFi**

3. **Verificar que el backend escucha en 0.0.0.0:**
   ```bash
   # En backend/src/server.js debe estar:
   app.listen(PORT, '0.0.0.0', ...)
   ```

## 📝 Comandos Útiles

### Iniciar el sistema completo:
```bash
# Terminal 1 - Backend
cd ~/Desktop/DiamondSistem/backend
npm run dev

# Terminal 2 - Frontend
cd ~/Desktop/DiamondSistem/frontend
npm run dev
```

### Actualizar después de un git pull:
```bash
cd ~/Desktop/DiamondSistem
git pull origin main

# Backend
cd backend
npm install
npx prisma generate
npx prisma db push

# Frontend
cd ../frontend
npm install
```

### Ver logs del backend:
```bash
cd ~/Desktop/DiamondSistem/backend
npm run dev
```

### Ver logs del frontend:
```bash
cd ~/Desktop/DiamondSistem/frontend
npm run dev
```

## 🔐 Seguridad en Desarrollo

⚠️ **IMPORTANTE:** Esta configuración es solo para desarrollo. En producción:
- Cambia `origin: '*'` en CORS a dominios específicos
- Usa variables de entorno para secrets
- Configura HTTPS
- Usa un servidor web profesional (Nginx, Apache)

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en las terminales
2. Verifica que todos los servicios estén corriendo
3. Asegúrate de que la base de datos esté accesible
4. Verifica que estás en la misma red WiFi

## 🎯 Pruebas con Múltiples Clientes

Para probar con 2 clientes simultáneamente:

1. **Abre el frontend en el navegador de tu Mac:**
   - `http://localhost:5173` o `http://TU_IP_MAC:5173`

2. **Abre el frontend en otro dispositivo (teléfono, tablet, otra computadora):**
   - `http://TU_IP_MAC:5173`

3. **Ambos dispositivos compartirán la misma base de datos y backend**

4. **Puedes crear cuentas de prueba diferentes para cada dispositivo**

## 📊 Base de Datos Compartida

Todos los dispositivos usarán la misma base de datos PostgreSQL en tu Mac. Esto significa que:
- Los cambios en un dispositivo se reflejan en todos
- Los datos son compartidos entre todos los clientes
- Puedes hacer pruebas reales de sincronización

