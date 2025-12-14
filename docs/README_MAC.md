# 🍎 DiamondSistem - Instrucciones Rápidas para Mac

## ⚡ Opción Rápida: Solo Frontend (Backend en Windows)

Si el backend y la base de datos están corriendo en Windows en la misma red:

1. **Clonar y configurar frontend:**
   ```bash
   cd ~/Desktop
   git clone https://github.com/IamEac/DiamondSistem.git
   cd DiamondSistem/frontend
   npm install
   ```

2. **Configurar .env:**
   Crea `frontend/.env` con:
   ```env
   VITE_API_URL=http://IP_DE_WINDOWS:5000/api
   ```
   (Obtén la IP de Windows con `ipconfig`)

3. **Ejecutar:**
   ```bash
   npm run dev
   ```

4. **Acceder:** `http://localhost:5173`

**Ver guía completa:** `GUIA_MAC_SOLO_FRONTEND.md`

---

## Inicio Rápido (Completo - Backend + Frontend en Mac)

### 1. Clonar y Configurar
```bash
cd ~/Desktop
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

### 2. Instalar Dependencias
```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend (en otra terminal)
cd ../frontend
npm install
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos
psql postgres
CREATE DATABASE diamondsistem;
\q
```

Editar `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/diamondsistem?schema=public"
PORT=5000
JWT_SECRET=tu_secret_aqui
NODE_ENV=development
```

### 4. Inicializar Base de Datos
```bash
cd backend
npx prisma db push
```

### 5. Ejecutar

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Acceder

- **Local:** `http://localhost:5173`
- **Desde otros dispositivos:** `http://TU_IP_MAC:5173`

Para obtener tu IP:
```bash
ipconfig getifaddr en0
```

## 🔧 Configuración para Múltiples Dispositivos

El backend ya está configurado para aceptar conexiones de la red local. Solo necesitas:

1. **Configurar el frontend** para usar la IP de tu Mac:
   - Crea `frontend/.env`:
   ```env
   VITE_API_URL=http://TU_IP_MAC:5000/api
   ```
   - Reemplaza `TU_IP_MAC` con tu IP real (ej: `192.168.1.100`)

2. **Acceder desde otros dispositivos:**
   - Abre `http://TU_IP_MAC:5173` en cualquier dispositivo en la misma red WiFi

## 📝 Comandos Útiles

```bash
# Actualizar desde GitHub
git pull origin main
cd backend && npm install && npx prisma generate && npx prisma db push
cd ../frontend && npm install

# Reiniciar servicios
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## ⚠️ Solución de Problemas

**Puerto en uso:**
```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**PostgreSQL no corre:**
```bash
brew services start postgresql@14
```

**Error de Prisma:**
```bash
cd backend
npx prisma generate
npx prisma db push
```

