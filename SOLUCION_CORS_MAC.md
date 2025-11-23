# 🔧 Solución de CORS en Mac - DiamondSistem

## Problema

Error: `Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login/vendedor' from origin 'http://localhost:5173' has been blocked by CORS policy`

## Solución Paso a Paso

### Paso 1: Verificar que el Backend está Corriendo

Abre una terminal y ejecuta:

```bash
cd ~/Desktop/DiamondSistem/backend
npm run dev
```

Deberías ver:
```
✅ Conexión a la base de datos establecida
🚀 Servidor corriendo en: http://localhost:5000
```

**Si no ves esto, el backend no está corriendo. Debe estar corriendo ANTES de abrir el frontend.**

---

### Paso 2: Verificar Configuración de `.env`

Edita `backend/.env` y asegúrate de tener:

```env
# Entorno DEBE ser development
NODE_ENV=development

# CORS Origins - TODOS los puertos de frontends
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177

# Base de Datos (Supabase o Local)
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres?connection_limit=10&pool_timeout=20"

# Resto de configuración...
PORT=5000
JWT_SECRET=tu_secreto_muy_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d
```

**Importante:** 
- `NODE_ENV=development` es CRÍTICO para que CORS funcione
- `CORS_ORIGINS` debe incluir TODOS los puertos de frontends separados por comas

---

### Paso 3: Reiniciar el Backend

Después de modificar `.env`:

1. Detén el backend (Ctrl+C en la terminal donde corre)
2. Vuelve a iniciarlo:
```bash
cd ~/Desktop/DiamondSistem/backend
npm run dev
```

---

### Paso 4: Verificar que el Backend Responde

Abre otra terminal y prueba:

```bash
curl http://localhost:5000/health
```

Deberías ver una respuesta JSON. Si no funciona, el backend no está corriendo correctamente.

---

### Paso 5: Verificar Logs del Backend

Cuando intentas hacer login desde el frontend, deberías ver en los logs del backend:

```
POST /api/auth/login/vendedor - 200 - XXms
```

Si ves errores de CORS en los logs, significa que la configuración no está correcta.

---

## Solución Rápida: Verificar Todo

Ejecuta estos comandos en orden:

```bash
# 1. Ir al backend
cd ~/Desktop/DiamondSistem/backend

# 2. Verificar que .env existe y tiene NODE_ENV=development
cat .env | grep NODE_ENV

# 3. Verificar que CORS_ORIGINS está configurado
cat .env | grep CORS_ORIGINS

# 4. Si falta algo, edita .env
nano .env
# o
code .env

# 5. Reiniciar backend
npm run dev
```

---

## Problemas Comunes

### El backend no inicia
- Verifica que PostgreSQL/Supabase esté accesible
- Verifica que `DATABASE_URL` sea correcta
- Ejecuta `npx prisma generate` si hay errores de Prisma

### CORS sigue fallando
- Asegúrate de que `NODE_ENV=development` esté en `.env`
- Verifica que `CORS_ORIGINS` incluya `http://localhost:5173`
- Reinicia el backend después de cambiar `.env`

### El frontend no puede conectar
- Verifica que el backend esté corriendo en el puerto 5000
- Verifica que `VITE_API_URL=http://localhost:5000/api` esté en `frontend-vendedor/.env`
- Abre http://localhost:5000/health en el navegador para verificar que el backend responde

---

## Orden Correcto de Inicio

1. **Primero:** Backend (`cd backend && npm run dev`)
2. **Segundo:** Frontend (`cd frontend-vendedor && npm run dev`)

El backend DEBE estar corriendo antes de abrir el frontend.

---

## Verificar que Todo Funciona

1. Backend corriendo → http://localhost:5000/health debe responder
2. Frontend corriendo → http://localhost:5173 debe abrir
3. Login funciona → Usa PRUEBA001 / prueba123

Si todo esto funciona, CORS está configurado correctamente.

