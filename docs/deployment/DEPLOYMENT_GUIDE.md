# 🚀 Guía de Deployment - DiamondSistem

## Backend en Railway ✅

El backend ya está deployado en Railway.

**Variables de entorno configuradas:**
- ✅ `DATABASE_URL`
- ✅ `ENCRYPTION_KEY`
- ✅ `JWT_SECRET`
- ✅ `NODE_ENV=production`

---

## Frontends en Vercel

Tienes 5 frontends que deployar en Vercel:

1. `frontend-vendedor` → Panel de vendedores
2. `frontend-cliente` → Portal de clientes
3. `frontend-manager` → Panel de managers
4. `frontend-gerente` → Panel de gerentes
5. `frontend-administrador` → Panel administrativo

---

## 📝 Pasos para deployar cada frontend

### 1. Obtener URL del backend

Ve a Railway → Tu servicio Backend → **Settings → Domains**

Copia la URL (ejemplo: `https://diamondsistem-backend-production.up.railway.app`)

### 2. Deployar en Vercel (Interfaz Web)

Para **cada frontend**, repite estos pasos:

#### A. Crear nuevo proyecto

1. Ve a [vercel.com](https://vercel.com)
2. Click **"Add New..." → Project**
3. Importa tu repo: **IamEac/DiamondSistem**

#### B. Configurar el proyecto

**Para frontend-vendedor:**
```
Project Name: diamondsistem-vendedor
Framework: Vite
Root Directory: frontend-vendedor
Build Command: npm run build (auto-detectado)
Output Directory: dist (auto-detectado)
Install Command: npm install (auto-detectado)
```

**Variables de entorno:**
```bash
VITE_API_URL = https://TU-BACKEND-RAILWAY.up.railway.app/api
```

⚠️ **IMPORTANTE:**
- Reemplaza `TU-BACKEND-RAILWAY.up.railway.app` con tu URL real
- NO incluyas barra diagonal `/` al final
- La URL DEBE terminar en `/api`

#### C. Deploy

Click **"Deploy"** y espera 2-3 minutos.

#### D. Repetir para los otros frontends

**frontend-cliente:**
```
Project Name: diamondsistem-cliente
Root Directory: frontend-cliente
Variable: VITE_API_URL = https://TU-BACKEND-RAILWAY.up.railway.app/api
```

**frontend-manager:**
```
Project Name: diamondsistem-manager
Root Directory: frontend-manager
Variable: VITE_API_URL = https://TU-BACKEND-RAILWAY.up.railway.app/api
```

**frontend-gerente:**
```
Project Name: diamondsistem-gerente
Root Directory: frontend-gerente
Variable: VITE_API_URL = https://TU-BACKEND-RAILWAY.up.railway.app/api
```

**frontend-administrador:**
```
Project Name: diamondsistem-administrador
Root Directory: frontend-administrador
Variable: VITE_API_URL = https://TU-BACKEND-RAILWAY.up.railway.app/api
```

---

## 3. Actualizar CORS en Railway Backend

Una vez que tengas las URLs de Vercel, debes configurar CORS en Railway:

1. Ve a Railway → Backend → **Variables**
2. Agrega la variable `CORS_ORIGINS`:

```bash
CORS_ORIGINS = https://diamondsistem-vendedor.vercel.app,https://diamondsistem-cliente.vercel.app,https://diamondsistem-manager.vercel.app,https://diamondsistem-gerente.vercel.app,https://diamondsistem-administrador.vercel.app
```

⚠️ **IMPORTANTE:**
- Reemplaza con tus URLs reales de Vercel
- Sin espacios después de las comas
- Sin barras diagonales al final

---

## 🎯 URLs finales

Una vez deployado, tendrás:

**Backend:**
- 🔧 API: `https://tu-backend.up.railway.app`
- 🔍 Health: `https://tu-backend.up.railway.app/health`

**Frontends:**
- 👔 Vendedores: `https://diamondsistem-vendedor.vercel.app`
- 👤 Clientes: `https://diamondsistem-cliente.vercel.app`
- 🎯 Managers: `https://diamondsistem-manager.vercel.app`
- 📊 Gerentes: `https://diamondsistem-gerente.vercel.app`
- ⚙️ Administrador: `https://diamondsistem-administrador.vercel.app`

---

## 🔍 Verificar deployment

1. **Backend Health Check:**
   ```bash
   curl https://tu-backend.up.railway.app/health
   ```
   Debe responder: `{"status":"healthy","database":"connected",...}`

2. **Frontends:**
   - Abre cada URL en el navegador
   - Verifica que cargue sin errores 404
   - Intenta hacer login (debe conectar con la API)

---

## ⚠️ Troubleshooting

### Error: CORS bloqueado
- Verifica que agregaste `CORS_ORIGINS` en Railway
- Asegúrate de NO incluir `/` al final de las URLs

### Error: Cannot connect to API
- Verifica que `VITE_API_URL` termine en `/api`
- Verifica que el backend esté corriendo en Railway

### Error 404 en rutas
- Los archivos `vercel.json` ya tienen la configuración de rewrites
- Si persiste, verifica que `vercel.json` exista en cada frontend

---

## 📚 Recursos adicionales

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vite Docs](https://vitejs.dev)

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo.
