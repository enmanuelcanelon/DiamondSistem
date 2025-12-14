# 🚂 Guía Completa: Despliegue en Railway + Vercel

**Sistema DiamondSistem - Guía Paso a Paso para Producción**

---

## 📋 Tabla de Contenidos

1. [Resumen de la Arquitectura](#resumen-de-la-arquitectura)
2. [Requisitos Previos](#requisitos-previos)
3. [Parte 1: Desplegar Backend en Railway](#parte-1-desplegar-backend-en-railway)
4. [Parte 2: Desplegar Frontends en Vercel](#parte-2-desplegar-frontends-en-vercel)
5. [Parte 3: Conectar Todo](#parte-3-conectar-todo)
6. [Verificación Final](#verificación-final)
7. [Mantenimiento y Actualizaciones](#mantenimiento-y-actualizaciones)
8. [Solución de Problemas](#solución-de-problemas)

---

## 🏗️ Resumen de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                  ARQUITECTURA DE PRODUCCIÓN                 │
└─────────────────────────────────────────────────────────────┘

VERCEL (5 Frontends)                    RAILWAY (Backend + DB)
┌───────────────────┐                   ┌──────────────────┐
│ vendedor.vercel   │◄──────────────────┤                  │
│ cliente.vercel    │                   │  Backend API     │
│ manager.vercel    │◄────── HTTPS ────►│  (Node.js)       │
│ gerente.vercel    │                   │  Port 5000       │
│ inventario.vercel │◄──────────────────┤                  │
└───────────────────┘                   └────────┬─────────┘
                                                 │
                                        ┌────────▼─────────┐
                                        │  PostgreSQL DB   │
                                        │  (Railway)       │
                                        └──────────────────┘
```

**Ventajas de esta arquitectura:**
- ✅ Backend y DB en Railway (optimizado para APIs)
- ✅ Frontends en Vercel (CDN global, super rápido)
- ✅ Costos optimizados
- ✅ Fácil de mantener y escalar

---

## 📦 Requisitos Previos

### 1. Cuentas Necesarias

**Railway** (para Backend + Database):
- 🌐 Crear cuenta en: https://railway.app/
- 💳 Método de pago (después del trial)
- 💰 Costo estimado: $5-10/mes

**Vercel** (para Frontends):
- 🌐 Crear cuenta en: https://vercel.com/
- 🆓 Plan gratuito suficiente
- 💰 Costo: $0 (hasta 100GB bandwidth/mes)

**GitHub** (para despliegue automático):
- 🌐 Tu repositorio debe estar en GitHub
- ✅ Ya lo tienes en: https://github.com/IamEac/DiamondSistem

### 2. Herramientas Locales

```bash
# Node.js instalado
node --version  # v18 o superior

# Git configurado
git --version

# Repositorio actualizado
cd DiamondSistem
git status
git add .
git commit -m "feat: Configuración para deployment Railway + Vercel"
git push
```

### 3. Generar Secretos Seguros

Abre una terminal y genera estos valores:

```bash
# JWT Secret (para Access Tokens)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copia el resultado, ejemplo: dK9mP2vN8xR4tY6wQ3zA1bC5eF7gH0jI...

# JWT Refresh Secret (para Refresh Tokens)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copia el resultado (debe ser DIFERENTE al anterior)

# Encryption Key (para Google Calendar OAuth)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copia el resultado, ejemplo: 4f2a8b3c9d1e6f0a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
```

**⚠️ IMPORTANTE:** Guarda estos valores en un lugar seguro (Notepad, notas, etc). Los necesitarás en los próximos pasos.

---

## 🚂 Parte 1: Desplegar Backend en Railway

### Paso 1.1: Crear Proyecto en Railway

1. **Ir a Railway**: https://railway.app/
2. **Login** con tu cuenta (GitHub recomendado)
3. **Click** en "New Project"
4. **Seleccionar**: "Deploy from GitHub repo"
5. **Autorizar** Railway para acceder a GitHub
6. **Seleccionar** el repositorio: `IamEac/DiamondSistem`
7. **Click** en "Deploy Now"

Railway detectará automáticamente que es un proyecto Node.js.

### Paso 1.2: Agregar Base de Datos PostgreSQL

1. En tu proyecto de Railway, **click** en "+ New"
2. **Seleccionar**: "Database" → "Add PostgreSQL"
3. Railway creará una base de datos automáticamente
4. **Espera** unos segundos a que se provisione

### Paso 1.3: Configurar Variables de Entorno

1. **Click** en el servicio "diamondsistem-backend" (o el nombre que tenga)
2. **Click** en la pestaña "Variables"
3. **Click** en "+ New Variable"
4. **Agregar** las siguientes variables una por una:

```env
# ====================================
# VARIABLES OBLIGATORIAS
# ====================================

# Base de datos (Railway la genera automáticamente)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (usa los que generaste antes)
JWT_SECRET=TU_JWT_SECRET_AQUI
JWT_REFRESH_SECRET=TU_JWT_REFRESH_SECRET_AQUI
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption Key (usa el que generaste antes)
ENCRYPTION_KEY=TU_ENCRYPTION_KEY_64_CARACTERES_HEX

# Servidor
PORT=5000
NODE_ENV=production

# CORS (temporalmente usa esto, lo actualizaremos después)
CORS_ORIGINS=https://vercel.app

# ====================================
# VARIABLES OPCIONALES
# ====================================

# Logging
LOG_LEVEL=info

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# App Info
APP_NAME=DiamondSistem
APP_VERSION=3.2.0

# Email (opcional - configúralo si quieres envío de emails)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=tu-email@gmail.com
# EMAIL_PASSWORD=tu-app-password
# EMAIL_FROM=DiamondSistem <noreply@diamondsistem.com>

# Google Calendar (opcional - solo si usas sincronización)
# GOOGLE_OAUTH_CLIENT_ID=tu-client-id.apps.googleusercontent.com
# GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret
# GOOGLE_OAUTH_REDIRECT_URI=https://tu-backend.up.railway.app/api/google-calendar/auth/callback
# GOOGLE_CALENDAR_CITAS_ID=tu-calendario-id@group.calendar.google.com
```

**⚠️ IMPORTANTE:**
- `DATABASE_URL` debe ser exactamente: `${{Postgres.DATABASE_URL}}`
- Railway reemplazará automáticamente con la URL real de tu base de datos
- NO pongas comillas alrededor de los valores

### Paso 1.4: Configurar Build y Start

1. **Click** en la pestaña "Settings"
2. **Scroll down** hasta "Build & Deploy"
3. **Configurar**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma db push --accept-data-loss && npm start`

### Paso 1.5: Desplegar

1. **Click** en la pestaña "Deployments"
2. Railway comenzará a desplegar automáticamente
3. **Espera** 2-5 minutos mientras se construye
4. Si hay errores, revisa los logs en la pestaña "Logs"

### Paso 1.6: Obtener URL del Backend

1. **Click** en la pestaña "Settings"
2. **Scroll down** hasta "Domains"
3. **Click** en "Generate Domain"
4. Railway generará una URL como: `diamondsistem-production.up.railway.app`
5. **Copia esta URL** (la necesitarás para los frontends)

### Paso 1.7: Verificar que el Backend Funciona

Abre en tu navegador:
```
https://tu-backend.up.railway.app/
```

Deberías ver un mensaje como:
```json
{
  "message": "DiamondSistem API v3.2.0",
  "status": "running"
}
```

Si ves esto, **¡Backend desplegado exitosamente!** ✅

---

## 🌐 Parte 2: Desplegar Frontends en Vercel

Vamos a desplegar **5 frontends** (uno por cada rol).

### Paso 2.1: Instalar Vercel CLI (Opcional)

```bash
npm install -g vercel
```

### Paso 2.2: Desplegar Frontend Vendedor

**Opción A: Desde la Web de Vercel (Recomendado para principiantes)**

1. **Ir a**: https://vercel.com/
2. **Login** con tu cuenta (GitHub recomendado)
3. **Click** en "Add New..." → "Project"
4. **Import** tu repositorio: `IamEac/DiamondSistem`
5. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend-vendedor`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. **Environment Variables** (Click en "Add"):
   ```
   VITE_API_URL=https://tu-backend.up.railway.app/api
   ```
   ⚠️ **IMPORTANTE**: Reemplaza `tu-backend.up.railway.app` con la URL real que copiaste en el Paso 1.6

7. **Click** en "Deploy"
8. **Espera** 2-3 minutos
9. **Copia la URL** que Vercel te da (ejemplo: `frontend-vendedor-xxx.vercel.app`)

**Opción B: Desde la Terminal**

```bash
cd frontend-vendedor

# Login a Vercel
vercel login

# Desplegar
vercel --prod

# Cuando pregunte por variables, agregar:
# VITE_API_URL=https://tu-backend.up.railway.app/api
```

### Paso 2.3: Desplegar Otros 4 Frontends

Repite el **Paso 2.2** para cada frontend:

1. **Frontend Cliente**: Root Directory = `frontend-cliente`
2. **Frontend Manager**: Root Directory = `frontend-manager`
3. **Frontend Gerente**: Root Directory = `frontend-gerente`
4. **Frontend Administrador**: Root Directory = `frontend-administrador`

**En cada uno**, asegúrate de:
- ✅ Configurar la variable `VITE_API_URL` con la URL de tu backend Railway
- ✅ Root Directory correcto
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`

### Paso 2.4: Guardar URLs de Todos los Frontends

Una vez desplegados, tendrás 5 URLs como estas:

```
https://vendedor-diamondsistem.vercel.app
https://cliente-diamondsistem.vercel.app
https://manager-diamondsistem.vercel.app
https://gerente-diamondsistem.vercel.app
https://inventario-diamondsistem.vercel.app
```

**Copia todas estas URLs**, las necesitarás en el siguiente paso.

---

## 🔗 Parte 3: Conectar Todo

### Paso 3.1: Actualizar CORS en Railway

1. **Volver a Railway**: https://railway.app/
2. **Click** en tu proyecto → servicio backend
3. **Click** en "Variables"
4. **Buscar** la variable `CORS_ORIGINS`
5. **Editar** y reemplazar con tus URLs de Vercel:

```env
CORS_ORIGINS=https://vendedor-diamondsistem.vercel.app,https://cliente-diamondsistem.vercel.app,https://manager-diamondsistem.vercel.app,https://gerente-diamondsistem.vercel.app,https://inventario-diamondsistem.vercel.app
```

**⚠️ IMPORTANTE:**
- Usa las URLs REALES que Vercel te dio
- NO dejes espacios después de las comas
- NO pongas `/` al final de las URLs

6. **Click** en "Update Variables"
7. Railway re-desplegará automáticamente (espera 1-2 minutos)

### Paso 3.2: Actualizar FRONTEND_URL (Opcional)

Si quieres, también actualiza:

```env
FRONTEND_URL=https://vendedor-diamondsistem.vercel.app
```

### Paso 3.3: Verificar Conexión

1. **Abre** cualquier frontend en tu navegador
2. **Intenta hacer login** con un usuario de prueba
3. Si funciona, **¡todo está conectado!** ✅

---

## ✅ Verificación Final

### Checklist de Verificación

```
Backend en Railway:
✅ Base de datos PostgreSQL creada
✅ Todas las variables de entorno configuradas
✅ Backend desplegado sin errores
✅ URL del backend accesible
✅ Endpoint /api responde correctamente

Frontends en Vercel:
✅ 5 frontends desplegados
✅ Variable VITE_API_URL configurada en cada uno
✅ Builds exitosos sin errores
✅ URLs de Vercel funcionando

Conexión:
✅ CORS_ORIGINS actualizado en Railway
✅ Frontends pueden hacer requests al backend
✅ Login funciona desde los frontends
✅ No hay errores CORS en la consola del navegador
```

### Probar Funcionalidades Clave

1. **Login Vendedor**:
   - URL: `https://vendedor-diamondsistem.vercel.app`
   - Código: `PRUEBA001`
   - Password: `prueba123`

2. **Crear una oferta** desde el frontend vendedor

3. **Login Cliente** con código de acceso generado

4. **Verificar** que todo funciona

---

## 🔄 Mantenimiento y Actualizaciones

### Actualizar el Backend

```bash
# 1. Hacer cambios en tu código local
# 2. Commit y push
git add .
git commit -m "feat: Nueva funcionalidad"
git push

# Railway detectará el push y re-desplegará automáticamente
```

### Actualizar Frontends

```bash
# 1. Hacer cambios en tu código local
# 2. Commit y push
git add .
git commit -m "feat: Actualizar frontend"
git push

# Vercel detectará el push y re-desplegará automáticamente
```

### Ver Logs en Railway

1. **Dashboard** de Railway
2. **Click** en tu servicio backend
3. **Click** en pestaña "Logs"
4. Ver logs en tiempo real

### Ver Logs en Vercel

1. **Dashboard** de Vercel
2. **Click** en tu proyecto
3. **Click** en "Deployments"
4. **Click** en el deployment
5. **Click** en "View Function Logs"

---

## 🆘 Solución de Problemas

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa**: Las URLs de los frontends no están en `CORS_ORIGINS`

**Solución**:
1. Ir a Railway → Variables
2. Actualizar `CORS_ORIGINS` con las URLs correctas de Vercel
3. Esperar que se re-despliegue

### Error: "Cannot connect to database"

**Causa**: `DATABASE_URL` mal configurada

**Solución**:
1. Verificar que `DATABASE_URL=${{Postgres.DATABASE_URL}}`
2. Verificar que el servicio PostgreSQL está corriendo en Railway
3. Re-desplegar el backend

### Error: "Module not found" en Build

**Causa**: Dependencias no instaladas o Root Directory incorrecto

**Solución Vercel**:
1. Verificar que Root Directory es correcto (ej: `frontend-vendedor`)
2. Verificar que Install Command es `npm install`
3. Re-desplegar

**Solución Railway**:
1. Verificar que Root Directory es `backend`
2. Verificar Build Command: `npm install && npx prisma generate`
3. Re-desplegar

### Error: "Environment variable VITE_API_URL is not defined"

**Causa**: Variable de entorno no configurada en Vercel

**Solución**:
1. Ir a Vercel → tu proyecto → Settings → Environment Variables
2. Agregar: `VITE_API_URL=https://tu-backend.up.railway.app/api`
3. Re-desplegar

### Backend responde pero frontends no cargan datos

**Causa**: URL del backend incorrecta en frontends

**Solución**:
1. Abrir Developer Tools (F12) → Console
2. Ver si hay errores de red (Network tab)
3. Verificar que `VITE_API_URL` termina en `/api`
4. Verificar que NO tiene `/` al final después de `/api`

### Error 500 en Railway

**Causa**: Error en el código backend

**Solución**:
1. Ver logs en Railway → pestaña "Logs"
2. Buscar el error específico
3. Corregir en local
4. Push a GitHub
5. Railway re-desplegará automáticamente

---

## 💰 Costos Estimados

### Railway
- **Base de Datos PostgreSQL**: ~$5/mes
- **Backend (1 servicio)**: ~$5/mes
- **Total**: ~$10/mes

### Vercel
- **5 Frontends**: $0/mes (plan gratuito)
- Límite: 100GB bandwidth/mes (suficiente para empezar)

### Total Estimado: ~$10/mes

---

## 🎯 Próximos Pasos

1. **Configurar dominio personalizado** (opcional):
   - Railway: Settings → Domains → Add Custom Domain
   - Vercel: Settings → Domains → Add Domain

2. **Configurar SSL** (automático en Railway y Vercel)

3. **Configurar backups de base de datos** en Railway

4. **Monitorear uso** para optimizar costos

5. **Configurar CI/CD avanzado** (opcional)

---

## 📞 Soporte

Si tienes problemas:

1. **Revisar logs** en Railway y Vercel
2. **Consultar esta guía** nuevamente
3. **Verificar variables de entorno**
4. **Verificar que el código está actualizado en GitHub**

---

## ✨ ¡Felicidades!

Si llegaste hasta aquí y todo funciona, **¡tu aplicación está en producción!** 🎉

**URLs importantes** (guárdalas):
- Backend: `https://tu-backend.up.railway.app`
- Vendedor: `https://vendedor-xxx.vercel.app`
- Cliente: `https://cliente-xxx.vercel.app`
- Manager: `https://manager-xxx.vercel.app`
- Gerente: `https://gerente-xxx.vercel.app`
- Inventario: `https://inventario-xxx.vercel.app`

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0
**Autor**: DiamondSistem Team
