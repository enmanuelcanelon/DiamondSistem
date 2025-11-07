# 🚀 Guía: Frontends Separados - DiamondSistem

## 📋 Estado Actual

### ✅ Completado
- [x] Carpeta `shared/` creada con componentes y utilidades compartidas
- [x] `frontend-vendedor/` creado y configurado (puerto 5173)
- [x] Script de actualización de imports creado
- [x] CORS del backend actualizado para permitir todos los puertos

### ⏳ En Progreso
- [ ] Completar copia de todos los componentes a `frontend-vendedor/`
- [ ] Probar `frontend-vendedor/` funcionando
- [ ] Crear `frontend-cliente/` (puerto 5174)
- [ ] Crear `frontend-manager/` (puerto 5175)
- [ ] Crear `frontend-gerente/` (puerto 5176)

---

## 🏗️ Estructura Creada

```
DiamondSistem/
├── shared/                    # ✅ CREADO
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # ✅ EN PROGRESO (Puerto 5173)
│   ├── src/
│   │   ├── pages/            # Solo páginas de vendedor
│   │   └── components/       # Layout, Modales, etc.
│   ├── package.json
│   └── vite.config.js
│
├── frontend-cliente/          # ⏳ PENDIENTE (Puerto 5174)
├── frontend-manager/          # ⏳ PENDIENTE (Puerto 5175)
└── frontend-gerente/           # ⏳ PENDIENTE (Puerto 5176)
```

---

## 🔧 Cómo Usar

### 1. Instalar Dependencias del Frontend Vendedor

```bash
cd frontend-vendedor
npm install
```

### 2. Ejecutar Frontend Vendedor

```bash
cd frontend-vendedor
npm run dev
```

Debería estar disponible en: `http://localhost:5173`

### 3. Verificar que Funciona

1. Abre `http://localhost:5173`
2. Deberías ver la página de login
3. Ingresa credenciales: `ADMIN001` / `Admin123!`
4. Deberías acceder al dashboard

---

## 📝 Próximos Pasos

1. **Completar frontend-vendedor:**
   - Verificar que todos los componentes estén copiados
   - Probar todas las funcionalidades
   - Corregir cualquier error de imports

2. **Crear frontend-cliente:**
   - Copiar estructura de `frontend-vendedor/`
   - Cambiar puerto a 5174
   - Copiar solo páginas de cliente
   - Actualizar App.jsx con rutas de cliente

3. **Crear frontend-manager y frontend-gerente:**
   - Similar proceso

4. **Actualizar .env del backend:**
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
   ```

---

## ⚠️ Notas Importantes

- El frontend original (`frontend/`) se mantiene intacto
- Todos los frontends comparten la carpeta `shared/`
- Cada frontend tiene su propio `package.json` y `node_modules`
- El backend ya está configurado para aceptar todos los puertos

---

**Estado**: En progreso - Frontend Vendedor casi completo


## 📋 Estado Actual

### ✅ Completado
- [x] Carpeta `shared/` creada con componentes y utilidades compartidas
- [x] `frontend-vendedor/` creado y configurado (puerto 5173)
- [x] Script de actualización de imports creado
- [x] CORS del backend actualizado para permitir todos los puertos

### ⏳ En Progreso
- [ ] Completar copia de todos los componentes a `frontend-vendedor/`
- [ ] Probar `frontend-vendedor/` funcionando
- [ ] Crear `frontend-cliente/` (puerto 5174)
- [ ] Crear `frontend-manager/` (puerto 5175)
- [ ] Crear `frontend-gerente/` (puerto 5176)

---

## 🏗️ Estructura Creada

```
DiamondSistem/
├── shared/                    # ✅ CREADO
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # ✅ EN PROGRESO (Puerto 5173)
│   ├── src/
│   │   ├── pages/            # Solo páginas de vendedor
│   │   └── components/       # Layout, Modales, etc.
│   ├── package.json
│   └── vite.config.js
│
├── frontend-cliente/          # ⏳ PENDIENTE (Puerto 5174)
├── frontend-manager/          # ⏳ PENDIENTE (Puerto 5175)
└── frontend-gerente/           # ⏳ PENDIENTE (Puerto 5176)
```

---

## 🔧 Cómo Usar

### 1. Instalar Dependencias del Frontend Vendedor

```bash
cd frontend-vendedor
npm install
```

### 2. Ejecutar Frontend Vendedor

```bash
cd frontend-vendedor
npm run dev
```

Debería estar disponible en: `http://localhost:5173`

### 3. Verificar que Funciona

1. Abre `http://localhost:5173`
2. Deberías ver la página de login
3. Ingresa credenciales: `ADMIN001` / `Admin123!`
4. Deberías acceder al dashboard

---

## 📝 Próximos Pasos

1. **Completar frontend-vendedor:**
   - Verificar que todos los componentes estén copiados
   - Probar todas las funcionalidades
   - Corregir cualquier error de imports

2. **Crear frontend-cliente:**
   - Copiar estructura de `frontend-vendedor/`
   - Cambiar puerto a 5174
   - Copiar solo páginas de cliente
   - Actualizar App.jsx con rutas de cliente

3. **Crear frontend-manager y frontend-gerente:**
   - Similar proceso

4. **Actualizar .env del backend:**
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
   ```

---

## ⚠️ Notas Importantes

- El frontend original (`frontend/`) se mantiene intacto
- Todos los frontends comparten la carpeta `shared/`
- Cada frontend tiene su propio `package.json` y `node_modules`
- El backend ya está configurado para aceptar todos los puertos

---

**Estado**: En progreso - Frontend Vendedor casi completo


## 📋 Estado Actual

### ✅ Completado
- [x] Carpeta `shared/` creada con componentes y utilidades compartidas
- [x] `frontend-vendedor/` creado y configurado (puerto 5173)
- [x] Script de actualización de imports creado
- [x] CORS del backend actualizado para permitir todos los puertos

### ⏳ En Progreso
- [ ] Completar copia de todos los componentes a `frontend-vendedor/`
- [ ] Probar `frontend-vendedor/` funcionando
- [ ] Crear `frontend-cliente/` (puerto 5174)
- [ ] Crear `frontend-manager/` (puerto 5175)
- [ ] Crear `frontend-gerente/` (puerto 5176)

---

## 🏗️ Estructura Creada

```
DiamondSistem/
├── shared/                    # ✅ CREADO
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # ✅ EN PROGRESO (Puerto 5173)
│   ├── src/
│   │   ├── pages/            # Solo páginas de vendedor
│   │   └── components/       # Layout, Modales, etc.
│   ├── package.json
│   └── vite.config.js
│
├── frontend-cliente/          # ⏳ PENDIENTE (Puerto 5174)
├── frontend-manager/          # ⏳ PENDIENTE (Puerto 5175)
└── frontend-gerente/           # ⏳ PENDIENTE (Puerto 5176)
```

---

## 🔧 Cómo Usar

### 1. Instalar Dependencias del Frontend Vendedor

```bash
cd frontend-vendedor
npm install
```

### 2. Ejecutar Frontend Vendedor

```bash
cd frontend-vendedor
npm run dev
```

Debería estar disponible en: `http://localhost:5173`

### 3. Verificar que Funciona

1. Abre `http://localhost:5173`
2. Deberías ver la página de login
3. Ingresa credenciales: `ADMIN001` / `Admin123!`
4. Deberías acceder al dashboard

---

## 📝 Próximos Pasos

1. **Completar frontend-vendedor:**
   - Verificar que todos los componentes estén copiados
   - Probar todas las funcionalidades
   - Corregir cualquier error de imports

2. **Crear frontend-cliente:**
   - Copiar estructura de `frontend-vendedor/`
   - Cambiar puerto a 5174
   - Copiar solo páginas de cliente
   - Actualizar App.jsx con rutas de cliente

3. **Crear frontend-manager y frontend-gerente:**
   - Similar proceso

4. **Actualizar .env del backend:**
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
   ```

---

## ⚠️ Notas Importantes

- El frontend original (`frontend/`) se mantiene intacto
- Todos los frontends comparten la carpeta `shared/`
- Cada frontend tiene su propio `package.json` y `node_modules`
- El backend ya está configurado para aceptar todos los puertos

---

**Estado**: En progreso - Frontend Vendedor casi completo













