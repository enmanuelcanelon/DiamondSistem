# 🚀 Instrucciones: Frontends Separados

## ✅ Estado: Separación Completada

Se han creado **4 frontends independientes** más una carpeta `shared/` con código común.

---

## 📁 Estructura Creada

```
DiamondSistem/
├── shared/                    # ✅ Componentes y utilidades compartidas
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # ✅ Puerto 5173
├── frontend-cliente/          # ✅ Puerto 5174
├── frontend-manager/          # ✅ Puerto 5175
└── frontend-gerente/          # ✅ Puerto 5176
```

---

## 🚀 Cómo Ejecutar

### Opción 1: Ejecutar Individualmente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Vendedor:**
```bash
cd frontend-vendedor
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5173`

**Terminal 3 - Frontend Cliente:**
```bash
cd frontend-cliente
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5174`

**Terminal 4 - Frontend Manager:**
```bash
cd frontend-manager
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5175`

**Terminal 5 - Frontend Gerente:**
```bash
cd frontend-gerente
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5176`

---

## 🔧 Configuración

### Backend CORS
El backend ya está configurado para aceptar conexiones de todos los puertos:
- ✅ `http://localhost:5173` (Vendedor)
- ✅ `http://localhost:5174` (Cliente)
- ✅ `http://localhost:5175` (Manager)
- ✅ `http://localhost:5176` (Gerente)

### Variables de Entorno
Cada frontend tiene su propio `.env` (o usa el de `shared/`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📝 Próximos Pasos

1. **Instalar dependencias en cada frontend:**
   ```bash
   cd frontend-vendedor && npm install
   cd ../frontend-cliente && npm install
   cd ../frontend-manager && npm install
   cd ../frontend-gerente && npm install
   ```

2. **Probar cada frontend:**
   - Vendedor: `http://localhost:5173` → Login con `ADMIN001` / `Admin123!`
   - Cliente: `http://localhost:5174` → Login con código de acceso
   - Manager: `http://localhost:5175` → Login con credenciales de manager
   - Gerente: `http://localhost:5176` → Login con credenciales de gerente

3. **Verificar que todo funciona:**
   - Cada frontend carga correctamente
   - Las rutas funcionan
   - La conexión al backend es exitosa
   - No hay errores en la consola

---

## ⚠️ Notas Importantes

- El frontend original (`frontend/`) **se mantiene intacto** como respaldo
- Todos los frontends comparten la carpeta `shared/`
- Cada frontend tiene su propio `node_modules` (debe instalar dependencias)
- Los imports usan `@shared/` para acceder a código compartido

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@shared/...'"
**Solución:** Verifica que `vite.config.js` tenga el alias configurado:
```javascript
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared/src'),
  },
}
```

### Error: "CORS bloqueado"
**Solución:** Verifica que el backend esté corriendo y que `CORS_ORIGINS` incluya el puerto correcto.

### Error: "Module not found"
**Solución:** Ejecuta `npm install` en el frontend correspondiente.

---

**✨ Separación completada exitosamente!**


## ✅ Estado: Separación Completada

Se han creado **4 frontends independientes** más una carpeta `shared/` con código común.

---

## 📁 Estructura Creada

```
DiamondSistem/
├── shared/                    # ✅ Componentes y utilidades compartidas
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # ✅ Puerto 5173
├── frontend-cliente/          # ✅ Puerto 5174
├── frontend-manager/          # ✅ Puerto 5175
└── frontend-gerente/          # ✅ Puerto 5176
```

---

## 🚀 Cómo Ejecutar

### Opción 1: Ejecutar Individualmente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Vendedor:**
```bash
cd frontend-vendedor
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5173`

**Terminal 3 - Frontend Cliente:**
```bash
cd frontend-cliente
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5174`

**Terminal 4 - Frontend Manager:**
```bash
cd frontend-manager
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5175`

**Terminal 5 - Frontend Gerente:**
```bash
cd frontend-gerente
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5176`

---

## 🔧 Configuración

### Backend CORS
El backend ya está configurado para aceptar conexiones de todos los puertos:
- ✅ `http://localhost:5173` (Vendedor)
- ✅ `http://localhost:5174` (Cliente)
- ✅ `http://localhost:5175` (Manager)
- ✅ `http://localhost:5176` (Gerente)

### Variables de Entorno
Cada frontend tiene su propio `.env` (o usa el de `shared/`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📝 Próximos Pasos

1. **Instalar dependencias en cada frontend:**
   ```bash
   cd frontend-vendedor && npm install
   cd ../frontend-cliente && npm install
   cd ../frontend-manager && npm install
   cd ../frontend-gerente && npm install
   ```

2. **Probar cada frontend:**
   - Vendedor: `http://localhost:5173` → Login con `ADMIN001` / `Admin123!`
   - Cliente: `http://localhost:5174` → Login con código de acceso
   - Manager: `http://localhost:5175` → Login con credenciales de manager
   - Gerente: `http://localhost:5176` → Login con credenciales de gerente

3. **Verificar que todo funciona:**
   - Cada frontend carga correctamente
   - Las rutas funcionan
   - La conexión al backend es exitosa
   - No hay errores en la consola

---

## ⚠️ Notas Importantes

- El frontend original (`frontend/`) **se mantiene intacto** como respaldo
- Todos los frontends comparten la carpeta `shared/`
- Cada frontend tiene su propio `node_modules` (debe instalar dependencias)
- Los imports usan `@shared/` para acceder a código compartido

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@shared/...'"
**Solución:** Verifica que `vite.config.js` tenga el alias configurado:
```javascript
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared/src'),
  },
}
```

### Error: "CORS bloqueado"
**Solución:** Verifica que el backend esté corriendo y que `CORS_ORIGINS` incluya el puerto correcto.

### Error: "Module not found"
**Solución:** Ejecuta `npm install` en el frontend correspondiente.

---

**✨ Separación completada exitosamente!**


## ✅ Estado: Separación Completada

Se han creado **4 frontends independientes** más una carpeta `shared/` con código común.

---

## 📁 Estructura Creada

```
DiamondSistem/
├── shared/                    # ✅ Componentes y utilidades compartidas
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # ✅ Puerto 5173
├── frontend-cliente/          # ✅ Puerto 5174
├── frontend-manager/          # ✅ Puerto 5175
└── frontend-gerente/          # ✅ Puerto 5176
```

---

## 🚀 Cómo Ejecutar

### Opción 1: Ejecutar Individualmente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Vendedor:**
```bash
cd frontend-vendedor
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5173`

**Terminal 3 - Frontend Cliente:**
```bash
cd frontend-cliente
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5174`

**Terminal 4 - Frontend Manager:**
```bash
cd frontend-manager
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5175`

**Terminal 5 - Frontend Gerente:**
```bash
cd frontend-gerente
npm install  # Solo la primera vez
npm run dev
```
Abre: `http://localhost:5176`

---

## 🔧 Configuración

### Backend CORS
El backend ya está configurado para aceptar conexiones de todos los puertos:
- ✅ `http://localhost:5173` (Vendedor)
- ✅ `http://localhost:5174` (Cliente)
- ✅ `http://localhost:5175` (Manager)
- ✅ `http://localhost:5176` (Gerente)

### Variables de Entorno
Cada frontend tiene su propio `.env` (o usa el de `shared/`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📝 Próximos Pasos

1. **Instalar dependencias en cada frontend:**
   ```bash
   cd frontend-vendedor && npm install
   cd ../frontend-cliente && npm install
   cd ../frontend-manager && npm install
   cd ../frontend-gerente && npm install
   ```

2. **Probar cada frontend:**
   - Vendedor: `http://localhost:5173` → Login con `ADMIN001` / `Admin123!`
   - Cliente: `http://localhost:5174` → Login con código de acceso
   - Manager: `http://localhost:5175` → Login con credenciales de manager
   - Gerente: `http://localhost:5176` → Login con credenciales de gerente

3. **Verificar que todo funciona:**
   - Cada frontend carga correctamente
   - Las rutas funcionan
   - La conexión al backend es exitosa
   - No hay errores en la consola

---

## ⚠️ Notas Importantes

- El frontend original (`frontend/`) **se mantiene intacto** como respaldo
- Todos los frontends comparten la carpeta `shared/`
- Cada frontend tiene su propio `node_modules` (debe instalar dependencias)
- Los imports usan `@shared/` para acceder a código compartido

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@shared/...'"
**Solución:** Verifica que `vite.config.js` tenga el alias configurado:
```javascript
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared/src'),
  },
}
```

### Error: "CORS bloqueado"
**Solución:** Verifica que el backend esté corriendo y que `CORS_ORIGINS` incluya el puerto correcto.

### Error: "Module not found"
**Solución:** Ejecuta `npm install` en el frontend correspondiente.

---

**✨ Separación completada exitosamente!**













