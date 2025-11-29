# Guía de Deployment - Frontends en Vercel

## Resumen

Esta guía te ayudará a desplegar los 4 frontends restantes en Vercel:
- ✅ frontend-vendedor (ya deployado)
- 🔄 frontend-administrador
- 🔄 frontend-cliente
- 🔄 frontend-manager
- 🔄 frontend-gerente

## Pre-requisitos

1. Cuenta en Vercel (https://vercel.com)
2. Repositorio GitHub conectado a Vercel
3. URL del backend en Railway (ejemplo: `https://tu-backend.up.railway.app/api`)

---

## Opción 1: Deployment desde la Web UI de Vercel (Recomendado)

### 1. Frontend Administrador

#### Paso 1: Importar Proyecto
1. Ve a https://vercel.com/new
2. Selecciona tu repositorio: `IamEac/DiamondSistem`
3. Click en **Import**

#### Paso 2: Configurar Proyecto
- **Project Name**: `diamond-sistema-administrador` (o el nombre que prefieras)
- **Framework Preset**: Vite
- **Root Directory**: `frontend-administrador`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Paso 3: Variables de Entorno
Click en **Environment Variables** y agrega:

| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

**IMPORTANTE**: Reemplaza `tu-backend.up.railway.app` con tu URL real de Railway.

#### Paso 4: Deploy
- Click en **Deploy**
- Espera a que termine el build (2-3 minutos)
- Vercel te dará una URL como: `https://diamond-sistema-administrador.vercel.app`

---

### 2. Frontend Cliente

#### Paso 1: Importar Proyecto
1. Ve a https://vercel.com/new
2. Selecciona tu repositorio: `IamEac/DiamondSistem`
3. Click en **Import**

#### Paso 2: Configurar Proyecto
- **Project Name**: `diamond-sistema-cliente`
- **Framework Preset**: Vite
- **Root Directory**: `frontend-cliente`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Paso 3: Variables de Entorno
| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

#### Paso 4: Deploy
- Click en **Deploy**
- URL resultante: `https://diamond-sistema-cliente.vercel.app`

---

### 3. Frontend Manager

#### Paso 1: Importar Proyecto
1. Ve a https://vercel.com/new
2. Selecciona tu repositorio: `IamEac/DiamondSistem`
3. Click en **Import**

#### Paso 2: Configurar Proyecto
- **Project Name**: `diamond-sistema-manager`
- **Framework Preset**: Vite
- **Root Directory**: `frontend-manager`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Paso 3: Variables de Entorno
| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

#### Paso 4: Deploy
- Click en **Deploy**
- URL resultante: `https://diamond-sistema-manager.vercel.app`

---

### 4. Frontend Gerente

#### Paso 1: Importar Proyecto
1. Ve a https://vercel.com/new
2. Selecciona tu repositorio: `IamEac/DiamondSistem`
3. Click en **Import**

#### Paso 2: Configurar Proyecto
- **Project Name**: `diamond-sistema-gerente`
- **Framework Preset**: Vite
- **Root Directory**: `frontend-gerente`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Paso 3: Variables de Entorno
| Nombre | Valor |
|--------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

#### Paso 4: Deploy
- Click en **Deploy**
- URL resultante: `https://diamond-sistema-gerente.vercel.app`

---

## Opción 2: Deployment con Vercel CLI

Si prefieres usar la línea de comandos:

### Instalación de Vercel CLI
```bash
npm install -g vercel
```

### Login
```bash
vercel login
```

### Deploy cada frontend

#### Frontend Administrador
```bash
cd frontend-administrador
vercel --prod
```

#### Frontend Cliente
```bash
cd ../frontend-cliente
vercel --prod
```

#### Frontend Manager
```bash
cd ../frontend-manager
vercel --prod
```

#### Frontend Gerente
```bash
cd ../frontend-gerente
vercel --prod
```

**Nota**: Durante el proceso, Vercel te preguntará:
- Set up and deploy? → Yes
- Which scope? → Selecciona tu cuenta
- Link to existing project? → No
- What's your project's name? → (nombre sugerido arriba)
- In which directory is your code located? → `./`
- Want to override settings? → Yes
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Development Command: `npm run dev`

Después de cada deploy, configura las variables de entorno:
```bash
vercel env add VITE_API_URL
```

---

## Verificación Post-Deployment

Para cada frontend deployado, verifica:

1. **Build exitoso**: El deployment debe mostrar "Ready" en Vercel
2. **Acceso a la URL**: Abre la URL y verifica que la aplicación cargue
3. **Conexión con Backend**:
   - Abre las DevTools del navegador (F12)
   - Ve a la pestaña Network
   - Intenta hacer login o cualquier acción
   - Verifica que las peticiones vayan a tu backend en Railway

4. **Variables de Entorno**:
   - En Vercel, ve a Settings > Environment Variables
   - Verifica que `VITE_API_URL` esté configurada correctamente

---

## Configuración CORS en Railway

Asegúrate de que tu backend en Railway permita los orígenes de Vercel:

En el archivo de configuración CORS del backend, agrega:
```javascript
const allowedOrigins = [
  'https://diamond-sistema-vendedor.vercel.app',
  'https://diamond-sistema-administrador.vercel.app',
  'https://diamond-sistema-cliente.vercel.app',
  'https://diamond-sistema-manager.vercel.app',
  'https://diamond-sistema-gerente.vercel.app',
  // ... tus otros orígenes
];
```

---

## Troubleshooting

### Error: "VITE_API_URL is undefined"
- Ve a Vercel → Settings → Environment Variables
- Agrega `VITE_API_URL` con tu URL de Railway
- Redeploy el proyecto

### Error: "CORS policy"
- Verifica que tu backend tenga configurado CORS
- Agrega la URL de Vercel a los orígenes permitidos
- Redeploy el backend en Railway

### Build fails
- Verifica que `Root Directory` esté configurado correctamente
- Revisa los logs de build en Vercel
- Asegúrate de que `vercel.json` exista en cada carpeta

---

## URLs Finales

Después del deployment, tendrás 5 URLs:

1. **Vendedor**: https://diamond-sistema-vendedor.vercel.app
2. **Administrador**: https://diamond-sistema-administrador.vercel.app
3. **Cliente**: https://diamond-sistema-cliente.vercel.app
4. **Manager**: https://diamond-sistema-manager.vercel.app
5. **Gerente**: https://diamond-sistema-gerente.vercel.app

---

## Siguiente Paso: Configurar Dominios Personalizados (Opcional)

Si quieres usar dominios personalizados:

1. Ve a cada proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio (ejemplo: `vendedor.diamondsistema.com`)
4. Sigue las instrucciones de Vercel para configurar DNS

---

¡Listo! Ahora tienes todos tus frontends desplegados en Vercel.
