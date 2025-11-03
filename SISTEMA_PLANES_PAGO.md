# Sistema de Planes de Pago para Contratos

## 📋 Descripción General

Sistema completo de planes de pago personalizados que permite a los vendedores ofrecer opciones de pago flexibles al momento de crear contratos desde ofertas aceptadas. El sistema incluye:

- **Pago Único**: Pago completo del contrato de una sola vez
- **Pago en Plazos**: División del pago en cuotas mensuales (2-12 meses)

## 🎯 Características Implementadas

### 1. Modal Interactivo de Selección de Plan de Pago

**Archivo**: `frontend/src/components/ModalPlanPago.jsx`

#### Características:
- ✅ Interfaz moderna con diseño visual atractivo
- ✅ Selección entre pago único y pago en plazos
- ✅ Slider para seleccionar número de plazos (2-12 meses)
- ✅ Generación automática del plan de pagos
- ✅ Vista previa detallada del plan antes de confirmar

#### Estructura del Plan de Pagos:
```javascript
{
  depositoReserva: 500,      // No reembolsable
  pagoInicial: 1000,          // Dentro de 10 días
  pagos: [
    {
      numero: 1,
      monto: 1000,
      descripcion: "Pago mensual 1 de 6"
    }
    // ... más pagos mensuales
  ],
  totalPagos: 8000
}
```

#### Reglas de Cálculo:
1. **Depósito de Reserva**: $500 (no reembolsable)
2. **Pago Inicial**: $1,000 dentro de 10 días
3. **Pagos Mensuales**: Mínimo $500/mes
4. **Distribución**: El saldo restante se divide en cuotas iguales
5. **Último Pago**: Ajusta el monto para completar el total exacto

---

### 2. Actualización de Base de Datos

**Archivo**: `database/migration_plan_pagos.sql`

#### Campos Agregados a `contratos`:
```sql
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(20) DEFAULT 'unico',
ADD COLUMN IF NOT EXISTS numero_plazos INTEGER,
ADD COLUMN IF NOT EXISTS plan_pagos JSONB;
```

- `tipo_pago`: 'unico' o 'plazos'
- `numero_plazos`: Número de meses (2-12)
- `plan_pagos`: JSON con el detalle completo del plan

#### Para Ejecutar:
```bash
psql -U postgres -d diamondsistem -f "database/migration_plan_pagos.sql"
```

---

### 3. Actualización del Schema Prisma

**Archivo**: `backend/prisma/schema.prisma`

```prisma
model contratos {
  // ... campos existentes ...
  tipo_pago               String    @db.VarChar(50)
  meses_financiamiento    Int       @default(1)
  pago_mensual            Decimal?  @db.Decimal(10, 2)
  plan_pagos              Json?     // ✨ NUEVO CAMPO
  // ... más campos ...
}
```

#### Para Regenerar Prisma Client:
```bash
cd backend
npx prisma generate
```

---

### 4. Integración en Flujo de Ofertas

**Archivo**: `frontend/src/pages/Ofertas.jsx`

#### Cambios Realizados:
1. ✅ Importación del modal `ModalPlanPago`
2. ✅ Estados para controlar el modal y la oferta seleccionada
3. ✅ Modificación de `crearContratoMutation` para enviar datos del plan
4. ✅ Función `handleCrearContrato` actualizada para abrir el modal
5. ✅ Función `handleConfirmarPlanPago` para procesar la selección
6. ✅ Renderizado del modal en el JSX

#### Flujo de Usuario:
1. Usuario acepta una oferta → Estado cambia a "aceptada"
2. Botón "Crear Contrato" se muestra
3. Click en "Crear Contrato" → Modal de plan de pago se abre
4. Usuario selecciona tipo de pago y plazos (si aplica)
5. Usuario confirma → Contrato se crea con el plan seleccionado

---

### 5. Backend - Creación de Contratos

**Archivo**: `backend/src/routes/contratos.routes.js`

#### Modificaciones:

**a) Recepción de Datos**:
```javascript
const {
  oferta_id,
  tipo_pago,
  meses_financiamiento,
  nombre_evento,
  numero_plazos,    // ✨ NUEVO
  plan_pagos        // ✨ NUEVO
} = req.body;
```

**b) Validación de Tipo de Pago**:
```javascript
if (!tipo_pago || !['unico', 'financiado', 'plazos'].includes(tipo_pago)) {
  throw new ValidationError('Tipo de pago inválido');
}
```

**c) Almacenamiento en Base de Datos**:
```javascript
const nuevoContrato = await prisma.contratos.create({
  data: {
    // ... otros campos ...
    tipo_pago,
    meses_financiamiento: (tipo_pago === 'financiado' || tipo_pago === 'plazos') 
      ? parseInt(meses_financiamiento) 
      : 1,
    plan_pagos: plan_pagos || null,  // ✨ NUEVO
    // ... más campos ...
  }
});
```

---

### 6. PDF del Contrato con Plan de Pagos

**Archivo**: `backend/src/utils/pdfContrato.js`

#### Mejoras Implementadas:

**a) Sección de Plan de Pagos Detallada**:
```javascript
// Para Pago Único
if (contrato.tipo_pago === 'unico') {
  doc.text('Tipo de Pago: Pago Único', { indent: 20 });
}

// Para Pago en Plazos
else if (contrato.plan_pagos && contrato.tipo_pago === 'plazos') {
  // Muestra:
  // - Depósito de reserva ($500)
  // - Pago inicial ($1,000 en 10 días)
  // - Lista de pagos mensuales
  // - Advertencia de pago completo 15 días antes del evento
}
```

**b) Términos y Condiciones Actualizados**:
Se actualizaron los 10 términos para reflejar exactamente el contenido del archivo `information_general/terminos&servicios.md`:

1. RESERVATION, DEPOSIT, AND PAYMENT TERMS
2. EVENT CANCELLATION POLICY
3. THIRD-PARTY SERVICES
4. CLIENT RESPONSIBILITY FOR DAMAGES
5. DECORATION AND SUPPLIES POLICY
6. EVENT SCHEDULE AND ACCESS
7. MEDIA RELEASE AUTHORIZATION
8. FORCE MAJEURE
9. LIMITATION OF LIABILITY
10. GOVERNING LAW

---

## 🧪 Cómo Probar

### Paso 1: Migración de Base de Datos
```bash
psql -U postgres -d diamondsistem -f "database/migration_plan_pagos.sql"
```

### Paso 2: Regenerar Prisma (Opcional)
```bash
cd backend
npx prisma generate
```

### Paso 3: Reiniciar Servidor Backend
```bash
cd backend
npm run dev
```

### Paso 4: Reiniciar Frontend
```bash
cd frontend
npm run dev
```

### Paso 5: Probar el Flujo

1. **Login como Vendedor**:
   - Usuario: `admin@diamondsistem.com`
   - Contraseña: (la que tengas configurada)

2. **Crear o Usar Cliente Existente**

3. **Crear una Oferta** desde `Crear Oferta`:
   - Selecciona cliente
   - Selecciona paquete y servicios
   - Guarda la oferta

4. **Aceptar la Oferta**:
   - Ve a "Ofertas"
   - Click en "Aceptar Oferta" para la oferta recién creada

5. **Crear Contrato con Plan de Pago**:
   - Click en "Crear Contrato →"
   - ✨ **NUEVO MODAL** aparecerá
   - Selecciona "Pago Único" o "Pago en Plazos"
   - Si eliges plazos, mueve el slider para seleccionar meses (2-12)
   - Observa la vista previa del plan generado
   - Click en "Confirmar y Crear Contrato"

6. **Verificar el Contrato**:
   - Ve a "Contratos"
   - Click en el contrato recién creado
   - Click en "Descargar PDF"
   - ✨ **VERIFICAR**: El PDF debe mostrar el plan de pagos detallado

---

## 📊 Ejemplo de Plan de Pagos Generado

### Contrato de $8,000 en 6 Plazos:

```
📋 Plan de Pagos Detallado

Pagos Iniciales Obligatorios:
  🏦 Depósito de Reserva (No reembolsable): $500
  💳 Pago Inicial (Dentro de 10 días): $1,000

📅 Pagos Mensuales:
  • Pago mensual 1 de 6: $1,083
  • Pago mensual 2 de 6: $1,083
  • Pago mensual 3 de 6: $1,083
  • Pago mensual 4 de 6: $1,083
  • Pago mensual 5 de 6: $1,083
  • Pago mensual 6 de 6: $1,085

⚠ IMPORTANTE: El pago completo debe estar al menos 15 días hábiles antes del evento.
```

---

## 🔐 Validaciones Implementadas

1. ✅ Tipo de pago debe ser 'unico', 'financiado' o 'plazos'
2. ✅ Si es plazos, meses_financiamiento debe ser >= 1
3. ✅ Plazos mínimos: 2 meses
4. ✅ Plazos máximos: 12 meses
5. ✅ Pagos mensuales mínimos: $500
6. ✅ Último pago ajusta automáticamente para completar el total

---

## 📁 Archivos Modificados

### Frontend:
1. ✅ `frontend/src/components/ModalPlanPago.jsx` (NUEVO)
2. ✅ `frontend/src/pages/Ofertas.jsx`

### Backend:
3. ✅ `backend/prisma/schema.prisma`
4. ✅ `backend/src/routes/contratos.routes.js`
5. ✅ `backend/src/utils/pdfContrato.js`

### Database:
6. ✅ `database/migration_plan_pagos.sql` (NUEVO)

### Documentación:
7. ✅ `SISTEMA_PLANES_PAGO.md` (ESTE ARCHIVO)

---

## 🚀 Próximos Pasos Sugeridos

1. **Sistema de Recordatorios de Pago**:
   - Emails automáticos para pagos pendientes
   - Notificaciones in-app

2. **Dashboard de Pagos para Clientes**:
   - Ver calendario de pagos
   - Estado de cada cuota
   - Próximos pagos pendientes

3. **Reportes Financieros**:
   - Total de contratos por tipo de pago
   - Proyección de ingresos mensuales
   - Análisis de cumplimiento de pagos

4. **Opciones de Pago Online**:
   - Integración con pasarelas de pago
   - Pago automático de cuotas
   - Recordatorios de cuotas vencidas

---

## ⚠️ Notas Importantes

### Términos de Pago Oficiales:
- Depósito: **$500** (no reembolsable)
- Pago inicial: **$1,000** (10 días después)
- Pagos mensuales: Mínimo **$500**
- Pago completo: **15 días hábiles antes del evento**
- Visa/MasterCard: Hasta **30 días antes** con cargo de **3.8%**
- American Express: **NO aceptado**
- **Todos los pagos son NO REEMBOLSABLES**

### Migración de Datos:
Los contratos existentes mantendrán su funcionamiento normal ya que:
- `plan_pagos` es opcional (puede ser `NULL`)
- El PDF tiene fallback para contratos sin plan_pagos
- `tipo_pago` ya existía en la base de datos

---

## ✅ Estado de Implementación

| Componente | Estado | Notas |
|------------|--------|-------|
| Modal Frontend | ✅ Completo | Diseño moderno con preview |
| Integración Ofertas | ✅ Completo | Flujo completo implementado |
| Backend API | ✅ Completo | Validaciones incluidas |
| Base de Datos | ⏳ Pendiente | Migración lista para ejecutar |
| Schema Prisma | ✅ Completo | Campo agregado |
| PDF Contrato | ✅ Completo | Plan detallado + términos actualizados |
| Pruebas | ⏳ Pendiente | Requiere migración DB |

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que la migración de base de datos se haya ejecutado
2. Asegúrate de que Prisma Client esté regenerado
3. Revisa los logs del backend para errores
4. Verifica la consola del navegador para errores frontend

---

**Creado**: Noviembre 2025  
**Versión**: 1.0.0  
**Sistema**: DiamondSistem - Event Management Platform

