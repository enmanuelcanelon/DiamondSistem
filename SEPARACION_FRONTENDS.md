# 🚀 Separación de Frontends - Guía de Implementación

## 📋 Plan de Separación

Este documento describe el proceso de separación del frontend monolítico en 4 aplicaciones independientes.

### Estructura Objetivo

```
DiamondSistem/
├── shared/                    # Componentes y utilidades compartidas
│   └── src/
│       ├── components/        # Chat, ErrorBoundary, ImagenSeleccion
│       ├── config/            # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # Puerto 5173
├── frontend-cliente/          # Puerto 5174
├── frontend-manager/          # Puerto 5175
└── frontend-gerente/          # Puerto 5176
```

---

## ⚠️ IMPORTANTE: Estado Actual

**El frontend original (`frontend/`) se mantiene intacto** hasta que todos los frontends separados estén funcionando correctamente.

---

## 📝 Pasos de Implementación

### Fase 1: Crear Estructura Base ✅
- [x] Crear carpeta `shared/`
- [x] Copiar archivos compartidos

### Fase 2: Crear Frontend Vendedor
- [ ] Crear `frontend-vendedor/`
- [ ] Copiar solo páginas de vendedor
- [ ] Configurar puerto 5173
- [ ] Probar funcionamiento

### Fase 3: Crear Frontend Cliente
- [ ] Crear `frontend-cliente/`
- [ ] Copiar solo páginas de cliente
- [ ] Configurar puerto 5174
- [ ] Probar funcionamiento

### Fase 4: Crear Frontend Manager
- [ ] Crear `frontend-manager/`
- [ ] Copiar solo páginas de manager
- [ ] Configurar puerto 5175
- [ ] Probar funcionamiento

### Fase 5: Crear Frontend Gerente
- [ ] Crear `frontend-gerente/`
- [ ] Copiar solo páginas de gerente
- [ ] Configurar puerto 5176
- [ ] Probar funcionamiento

### Fase 6: Actualizar Backend
- [ ] Actualizar CORS para permitir todos los puertos
- [ ] Probar conexión desde cada frontend

### Fase 7: Scripts de Desarrollo
- [ ] Crear script para ejecutar todos los frontends
- [ ] Documentar comandos

---

## 🔧 Configuración de Cada Frontend

### package.json
Cada frontend tendrá su propio `package.json` con las mismas dependencias.

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cambiar según el frontend
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
})
```

### .env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📚 Referencias a Shared

En cada frontend, importar desde shared así:

```javascript
// ❌ Antes
import api from './config/api';

// ✅ Después
import api from '@shared/config/api';
// O
import api from '../../shared/src/config/api';
```

---

## 🎯 Beneficios Esperados

1. **Seguridad**: Cada app solo tiene su código
2. **Performance**: Bundles más pequeños
3. **Escalabilidad**: Despliegue independiente
4. **Mantenibilidad**: Código más organizado

---

**Estado**: En progreso...


## 📋 Plan de Separación

Este documento describe el proceso de separación del frontend monolítico en 4 aplicaciones independientes.

### Estructura Objetivo

```
DiamondSistem/
├── shared/                    # Componentes y utilidades compartidas
│   └── src/
│       ├── components/        # Chat, ErrorBoundary, ImagenSeleccion
│       ├── config/            # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # Puerto 5173
├── frontend-cliente/          # Puerto 5174
├── frontend-manager/          # Puerto 5175
└── frontend-gerente/          # Puerto 5176
```

---

## ⚠️ IMPORTANTE: Estado Actual

**El frontend original (`frontend/`) se mantiene intacto** hasta que todos los frontends separados estén funcionando correctamente.

---

## 📝 Pasos de Implementación

### Fase 1: Crear Estructura Base ✅
- [x] Crear carpeta `shared/`
- [x] Copiar archivos compartidos

### Fase 2: Crear Frontend Vendedor
- [ ] Crear `frontend-vendedor/`
- [ ] Copiar solo páginas de vendedor
- [ ] Configurar puerto 5173
- [ ] Probar funcionamiento

### Fase 3: Crear Frontend Cliente
- [ ] Crear `frontend-cliente/`
- [ ] Copiar solo páginas de cliente
- [ ] Configurar puerto 5174
- [ ] Probar funcionamiento

### Fase 4: Crear Frontend Manager
- [ ] Crear `frontend-manager/`
- [ ] Copiar solo páginas de manager
- [ ] Configurar puerto 5175
- [ ] Probar funcionamiento

### Fase 5: Crear Frontend Gerente
- [ ] Crear `frontend-gerente/`
- [ ] Copiar solo páginas de gerente
- [ ] Configurar puerto 5176
- [ ] Probar funcionamiento

### Fase 6: Actualizar Backend
- [ ] Actualizar CORS para permitir todos los puertos
- [ ] Probar conexión desde cada frontend

### Fase 7: Scripts de Desarrollo
- [ ] Crear script para ejecutar todos los frontends
- [ ] Documentar comandos

---

## 🔧 Configuración de Cada Frontend

### package.json
Cada frontend tendrá su propio `package.json` con las mismas dependencias.

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cambiar según el frontend
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
})
```

### .env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📚 Referencias a Shared

En cada frontend, importar desde shared así:

```javascript
// ❌ Antes
import api from './config/api';

// ✅ Después
import api from '@shared/config/api';
// O
import api from '../../shared/src/config/api';
```

---

## 🎯 Beneficios Esperados

1. **Seguridad**: Cada app solo tiene su código
2. **Performance**: Bundles más pequeños
3. **Escalabilidad**: Despliegue independiente
4. **Mantenibilidad**: Código más organizado

---

**Estado**: En progreso...


## 📋 Plan de Separación

Este documento describe el proceso de separación del frontend monolítico en 4 aplicaciones independientes.

### Estructura Objetivo

```
DiamondSistem/
├── shared/                    # Componentes y utilidades compartidas
│   └── src/
│       ├── components/        # Chat, ErrorBoundary, ImagenSeleccion
│       ├── config/            # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # Puerto 5173
├── frontend-cliente/          # Puerto 5174
├── frontend-manager/          # Puerto 5175
└── frontend-gerente/          # Puerto 5176
```

---

## ⚠️ IMPORTANTE: Estado Actual

**El frontend original (`frontend/`) se mantiene intacto** hasta que todos los frontends separados estén funcionando correctamente.

---

## 📝 Pasos de Implementación

### Fase 1: Crear Estructura Base ✅
- [x] Crear carpeta `shared/`
- [x] Copiar archivos compartidos

### Fase 2: Crear Frontend Vendedor
- [ ] Crear `frontend-vendedor/`
- [ ] Copiar solo páginas de vendedor
- [ ] Configurar puerto 5173
- [ ] Probar funcionamiento

### Fase 3: Crear Frontend Cliente
- [ ] Crear `frontend-cliente/`
- [ ] Copiar solo páginas de cliente
- [ ] Configurar puerto 5174
- [ ] Probar funcionamiento

### Fase 4: Crear Frontend Manager
- [ ] Crear `frontend-manager/`
- [ ] Copiar solo páginas de manager
- [ ] Configurar puerto 5175
- [ ] Probar funcionamiento

### Fase 5: Crear Frontend Gerente
- [ ] Crear `frontend-gerente/`
- [ ] Copiar solo páginas de gerente
- [ ] Configurar puerto 5176
- [ ] Probar funcionamiento

### Fase 6: Actualizar Backend
- [ ] Actualizar CORS para permitir todos los puertos
- [ ] Probar conexión desde cada frontend

### Fase 7: Scripts de Desarrollo
- [ ] Crear script para ejecutar todos los frontends
- [ ] Documentar comandos

---

## 🔧 Configuración de Cada Frontend

### package.json
Cada frontend tendrá su propio `package.json` con las mismas dependencias.

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cambiar según el frontend
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
})
```

### .env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📚 Referencias a Shared

En cada frontend, importar desde shared así:

```javascript
// ❌ Antes
import api from './config/api';

// ✅ Después
import api from '@shared/config/api';
// O
import api from '../../shared/src/config/api';
```

---

## 🎯 Beneficios Esperados

1. **Seguridad**: Cada app solo tiene su código
2. **Performance**: Bundles más pequeños
3. **Escalabilidad**: Despliegue independiente
4. **Mantenibilidad**: Código más organizado

---

**Estado**: En progreso...













