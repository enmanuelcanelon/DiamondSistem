# 💰 Sistema de Gestión de Comisiones

## 📋 Descripción General

Sistema completo para el cálculo, seguimiento y pago de comisiones a vendedores, con soporte para pagos parciales y generación de reportes en PDF.

---

## 🎯 Lógica de Comisiones

### Estructura de Comisiones

- **Comisión Total**: 3% del total del contrato
- **Primera Mitad**: 1.5% del total del contrato
- **Segunda Mitad**: 1.5% del total del contrato

### Condiciones de Desbloqueo

#### Primera Mitad (1.5%)
Se desbloquea cuando se cumplen **todas** estas condiciones:
1. ✅ Primer pago de reserva ≥ $500
2. ✅ Pago adicional ≥ $500 dentro de 10 días después del primer pago
3. ✅ Total pagado ≥ $1,000

#### Segunda Mitad (1.5%)
Se desbloquea cuando:
- ✅ El cliente ha pagado ≥ 50% del total del contrato

---

## 🏗️ Arquitectura

### Backend

#### Endpoints Principales

**Administración (`/api/inventario/comisiones`):**
- `GET /` - Obtener todas las comisiones desbloqueadas
- `POST /pagar` - Registrar pago de comisión (parcial o completo)
- `POST /revertir` - Revertir un pago de comisión
- `GET /resumen-pdf` - Descargar PDF de resumen mensual

**Gerente (`/api/gerentes/comisiones`):**
- `GET /` - Obtener todas las comisiones (pendientes y pagadas)
- `GET /resumen-pdf` - Descargar PDF de resumen mensual

#### Utilidades

- **`comisionCalculator.js`**: Calcula comisiones desbloqueadas basándose en pagos reales
- **`pdfComisiones.js`**: Genera PDFs profesionales de resúmenes de comisiones

### Frontend

#### App Administración (`/comisiones`)
- Visualización de comisiones por vendedor
- Registro de pagos parciales y completos
- Reversión de pagos
- Descarga de PDFs de resúmenes

#### App Gerente (`/comisiones`)
- Visualización de todas las comisiones
- Filtrado por mes y año
- Descarga de PDFs de resúmenes
- Vista detallada de contratos y montos

---

## 💳 Sistema de Pagos Parciales

### Características

1. **Pagos Parciales**: Permite pagar montos menores al total de la comisión
   - Ejemplo: Comisión de $500, se puede pagar $250 ahora y $250 después

2. **Validación de Montos**:
   - No permite pagar más del monto pendiente
   - Valida que la comisión esté desbloqueada
   - Calcula automáticamente el nuevo monto pendiente

3. **Marcado como Completado**:
   - Cuando el monto pagado ≥ monto total de la comisión
   - Se marca automáticamente como "completamente pagada"
   - Se registra la fecha de pago

### Base de Datos

```sql
-- Campos en tabla contratos
comision_primera_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00
comision_segunda_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00
comision_primera_mitad_pagada BOOLEAN DEFAULT false
comision_segunda_mitad_pagada BOOLEAN DEFAULT false
fecha_pago_comision_primera DATETIME
fecha_pago_comision_segunda DATETIME
```

---

## 📊 Flujo de Trabajo

### 1. Desbloqueo de Comisiones

```
Contrato Creado
    ↓
Cliente Paga $500+ (Reserva)
    ↓
Cliente Paga $500+ adicionales en 10 días
    ↓
✅ Primera Mitad Desbloqueada (1.5%)
    ↓
Cliente Paga 50% del contrato
    ↓
✅ Segunda Mitad Desbloqueada (1.5%)
```

### 2. Registro de Pago

```
Administración → Comisiones
    ↓
Seleccionar Vendedor
    ↓
Ver Comisiones Pendientes
    ↓
Click "Pagar"
    ↓
Ingresar Monto (puede ser parcial)
    ↓
Validar (no exceder pendiente)
    ↓
Confirmar Pago
    ↓
✅ Actualizar Base de Datos
    ↓
Si monto pagado ≥ monto total → Marcar como completada
```

### 3. Reversión de Pago

```
Administración → Comisiones
    ↓
Ver Comisiones Pagadas
    ↓
Click "Revertir"
    ↓
Confirmar Reversión
    ↓
✅ Resetear monto pagado a 0
    ↓
✅ Marcar como no pagada
    ↓
✅ Limpiar fecha de pago
```

---

## 📄 Generación de PDFs

### Contenido del PDF

1. **Resumen General**:
   - Total Desbloqueadas
   - Pendientes de Pago
   - Pagadas

2. **Por Vendedor**:
   - Información del vendedor (nombre, código)
   - Estadísticas (total, pendientes, pagadas)
   - Tabla de comisiones pendientes:
     - Contrato, Cliente, Tipo, Total Contrato
     - Monto Comisión, Monto Pagado, Pendiente
   - Tabla de comisiones pagadas:
     - Contrato, Cliente, Tipo, Total Contrato
     - Monto Comisión, Monto Pagado, Fecha Pago

### Formato

- **Tamaño**: A4
- **Estilo**: Profesional, listo para imprimir
- **Colores**: 
  - Azul para primera mitad
  - Púrpura para segunda mitad
  - Amarillo para pendientes
  - Verde para pagadas

---

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas

1. **Al Registrar Pago**:
   - ✅ Comisión debe estar desbloqueada
   - ✅ Monto debe ser > 0
   - ✅ Monto no puede exceder el pendiente
   - ✅ Usuario debe tener permisos de administración

2. **Al Revertir Pago**:
   - ✅ Debe haber un monto pagado > 0
   - ✅ Usuario debe tener permisos de administración

3. **Al Generar PDF**:
   - ✅ Mes y año deben ser válidos
   - ✅ Usuario debe estar autenticado (Administración o Gerente)

---

## 📱 Interfaz de Usuario

### App Administración

**Vista Principal:**
- Filtros por mes y año
- Botón "Descargar Resumen PDF"
- Lista de vendedores (colapsable)

**Vendedor Expandido:**
- Resumen de comisiones (total, pendientes, pagadas)
- Tabla de comisiones pendientes con botón "Pagar"
- Tabla de comisiones pagadas con botón "Revertir"

**Modal de Pago:**
- Información del contrato
- Tipo de comisión (Primera/Segunda Mitad)
- Monto total, pagado y pendiente
- Campo para ingresar monto a pagar
- Validación en tiempo real

**Modal de Reversión:**
- Información del contrato
- Tipo de comisión
- Monto total y pagado
- Confirmación de reversión

### App Gerente

**Vista Principal:**
- Filtros por mes y año
- Botón "Descargar Resumen PDF"
- Lista de vendedores (colapsable)

**Vendedor Expandido:**
- Resumen de comisiones
- Tabla de comisiones pendientes (solo lectura)
- Tabla de comisiones pagadas (solo lectura)

---

## 🧪 Casos de Uso

### Caso 1: Pago Completo de Primera Mitad

```
Comisión Primera Mitad: $500
Monto Pagado: $0
Monto Pendiente: $500

Usuario paga: $500
Resultado:
  - Monto Pagado: $500
  - Monto Pendiente: $0
  - Completamente Pagada: true
  - Fecha Pago: [fecha actual]
```

### Caso 2: Pago Parcial de Primera Mitad

```
Comisión Primera Mitad: $500
Monto Pagado: $0
Monto Pendiente: $500

Usuario paga: $250
Resultado:
  - Monto Pagado: $250
  - Monto Pendiente: $250
  - Completamente Pagada: false
  - Fecha Pago: null

Usuario paga: $250 (segundo pago)
Resultado:
  - Monto Pagado: $500
  - Monto Pendiente: $0
  - Completamente Pagada: true
  - Fecha Pago: [fecha actual]
```

### Caso 3: Reversión de Pago

```
Comisión Primera Mitad: $500
Monto Pagado: $500
Completamente Pagada: true

Usuario revierte pago
Resultado:
  - Monto Pagado: $0
  - Monto Pendiente: $500
  - Completamente Pagada: false
  - Fecha Pago: null
```

---

## 📚 Referencias Técnicas

### Archivos Clave

**Backend:**
- `backend/src/routes/comisiones.routes.js` - Rutas de gestión de comisiones
- `backend/src/routes/gerentes.routes.js` - Rutas de visualización (gerente)
- `backend/src/utils/comisionCalculator.js` - Lógica de cálculo
- `backend/src/utils/pdfComisiones.js` - Generación de PDFs

**Frontend:**
- `frontend-administrador/src/pages/ComisionesAdministracion.jsx` - Página de administración
- `frontend-gerente/src/pages/ComisionesGerente.jsx` - Página de gerente

**Base de Datos:**
- `backend/prisma/schema.prisma` - Schema con campos de pagos parciales
- `backend/migrar-pagos-parciales-comisiones.js` - Script de migración

---

## 🔄 Migraciones

### Agregar Campos de Pagos Parciales

```bash
cd backend
node migrar-pagos-parciales-comisiones.js
```

Este script:
1. Agrega `comision_primera_mitad_pagada_monto`
2. Agrega `comision_segunda_mitad_pagada_monto`
3. Inicializa valores basándose en flags booleanos existentes

---

## ✅ Checklist de Funcionalidades

- [x] Cálculo automático de comisiones desbloqueadas
- [x] Visualización de comisiones pendientes y pagadas
- [x] Registro de pagos parciales
- [x] Registro de pagos completos
- [x] Reversión de pagos
- [x] Filtrado por mes y año
- [x] Generación de PDFs de resúmenes
- [x] Vista desde Administración
- [x] Vista desde Gerente
- [x] Validaciones de seguridad
- [x] Interfaz intuitiva y profesional

---

**Última actualización**: Noviembre 2025

