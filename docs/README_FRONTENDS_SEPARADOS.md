# 🎯 Frontends Separados - DiamondSistem

## ✅ Separación Completada

El frontend monolítico ha sido separado en **4 aplicaciones independientes** para mejorar seguridad, performance y escalabilidad.

---

## 📁 Estructura

```
DiamondSistem/
├── shared/                    # Código compartido
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # Puerto 5173
├── frontend-cliente/          # Puerto 5174
├── frontend-manager/          # Puerto 5175
└── frontend-gerente/          # Puerto 5176
```

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
# Automático (recomendado)
powershell -ExecutionPolicy Bypass -File "instalar-todos-frontends.ps1"

# O manualmente en cada frontend
cd frontend-vendedor && npm install
cd ../frontend-cliente && npm install
cd ../frontend-manager && npm install
cd ../frontend-gerente && npm install
```

### 2. Iniciar Backend

```bash
cd backend
npm run dev
```

### 3. Iniciar Frontends

```bash
# Opción A: Script automático (abre 4 ventanas)
powershell -ExecutionPolicy Bypass -File "ejecutar-todos-frontends.ps1"

# Opción B: Manual (4 terminales)
cd frontend-vendedor && npm run dev  # Puerto 5173
cd frontend-cliente && npm run dev   # Puerto 5174
cd frontend-manager && npm run dev   # Puerto 5175
cd frontend-gerente && npm run dev   # Puerto 5176
```

---

## 🌐 URLs

| Rol | URL | Credenciales |
|-----|-----|--------------|
| Vendedor | http://localhost:5173 | ADMIN001 / Admin123! |
| Cliente | http://localhost:5174 | Código de acceso del contrato |
| Manager | http://localhost:5175 | Credenciales de manager |
| Gerente | http://localhost:5176 | Credenciales de gerente |

---

## ✨ Beneficios

- ✅ **Seguridad**: Cada app solo tiene su código
- ✅ **Performance**: Bundles más pequeños
- ✅ **Escalabilidad**: Despliegue independiente
- ✅ **Mantenibilidad**: Código más organizado

---

## 📚 Documentación

- `SEPARACION_COMPLETADA.md` - Resumen completo
- `INSTRUCCIONES_FRONTENDS_SEPARADOS.md` - Guía detallada
- `GUIA_FRONTENDS_SEPARADOS.md` - Guía de uso

---

**✨ Listo para usar!**


## ✅ Separación Completada

El frontend monolítico ha sido separado en **4 aplicaciones independientes** para mejorar seguridad, performance y escalabilidad.

---

## 📁 Estructura

```
DiamondSistem/
├── shared/                    # Código compartido
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # Puerto 5173
├── frontend-cliente/          # Puerto 5174
├── frontend-manager/          # Puerto 5175
└── frontend-gerente/          # Puerto 5176
```

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
# Automático (recomendado)
powershell -ExecutionPolicy Bypass -File "instalar-todos-frontends.ps1"

# O manualmente en cada frontend
cd frontend-vendedor && npm install
cd ../frontend-cliente && npm install
cd ../frontend-manager && npm install
cd ../frontend-gerente && npm install
```

### 2. Iniciar Backend

```bash
cd backend
npm run dev
```

### 3. Iniciar Frontends

```bash
# Opción A: Script automático (abre 4 ventanas)
powershell -ExecutionPolicy Bypass -File "ejecutar-todos-frontends.ps1"

# Opción B: Manual (4 terminales)
cd frontend-vendedor && npm run dev  # Puerto 5173
cd frontend-cliente && npm run dev   # Puerto 5174
cd frontend-manager && npm run dev   # Puerto 5175
cd frontend-gerente && npm run dev   # Puerto 5176
```

---

## 🌐 URLs

| Rol | URL | Credenciales |
|-----|-----|--------------|
| Vendedor | http://localhost:5173 | ADMIN001 / Admin123! |
| Cliente | http://localhost:5174 | Código de acceso del contrato |
| Manager | http://localhost:5175 | Credenciales de manager |
| Gerente | http://localhost:5176 | Credenciales de gerente |

---

## ✨ Beneficios

- ✅ **Seguridad**: Cada app solo tiene su código
- ✅ **Performance**: Bundles más pequeños
- ✅ **Escalabilidad**: Despliegue independiente
- ✅ **Mantenibilidad**: Código más organizado

---

## 📚 Documentación

- `SEPARACION_COMPLETADA.md` - Resumen completo
- `INSTRUCCIONES_FRONTENDS_SEPARADOS.md` - Guía detallada
- `GUIA_FRONTENDS_SEPARADOS.md` - Guía de uso

---

**✨ Listo para usar!**


## ✅ Separación Completada

El frontend monolítico ha sido separado en **4 aplicaciones independientes** para mejorar seguridad, performance y escalabilidad.

---

## 📁 Estructura

```
DiamondSistem/
├── shared/                    # Código compartido
│   └── src/
│       ├── components/        # ErrorBoundary, Chat, ImagenSeleccion
│       ├── config/           # api.js
│       ├── store/             # useAuthStore.js
│       └── utils/             # formatters.js, mapeoImagenes.js
│
├── frontend-vendedor/         # Puerto 5173
├── frontend-cliente/          # Puerto 5174
├── frontend-manager/          # Puerto 5175
└── frontend-gerente/          # Puerto 5176
```

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
# Automático (recomendado)
powershell -ExecutionPolicy Bypass -File "instalar-todos-frontends.ps1"

# O manualmente en cada frontend
cd frontend-vendedor && npm install
cd ../frontend-cliente && npm install
cd ../frontend-manager && npm install
cd ../frontend-gerente && npm install
```

### 2. Iniciar Backend

```bash
cd backend
npm run dev
```

### 3. Iniciar Frontends

```bash
# Opción A: Script automático (abre 4 ventanas)
powershell -ExecutionPolicy Bypass -File "ejecutar-todos-frontends.ps1"

# Opción B: Manual (4 terminales)
cd frontend-vendedor && npm run dev  # Puerto 5173
cd frontend-cliente && npm run dev   # Puerto 5174
cd frontend-manager && npm run dev   # Puerto 5175
cd frontend-gerente && npm run dev   # Puerto 5176
```

---

## 🌐 URLs

| Rol | URL | Credenciales |
|-----|-----|--------------|
| Vendedor | http://localhost:5173 | ADMIN001 / Admin123! |
| Cliente | http://localhost:5174 | Código de acceso del contrato |
| Manager | http://localhost:5175 | Credenciales de manager |
| Gerente | http://localhost:5176 | Credenciales de gerente |

---

## ✨ Beneficios

- ✅ **Seguridad**: Cada app solo tiene su código
- ✅ **Performance**: Bundles más pequeños
- ✅ **Escalabilidad**: Despliegue independiente
- ✅ **Mantenibilidad**: Código más organizado

---

## 📚 Documentación

- `SEPARACION_COMPLETADA.md` - Resumen completo
- `INSTRUCCIONES_FRONTENDS_SEPARADOS.md` - Guía detallada
- `GUIA_FRONTENDS_SEPARADOS.md` - Guía de uso

---

**✨ Listo para usar!**













