# 🔐 Sistema de Pagos Seguros

## 📋 Descripción General

Sistema robusto para el registro y gestión de pagos con confirmación paso a paso y capacidad de revertir errores, garantizando la integridad de los datos financieros.

---

## ✨ Características Principales

### 1. Registro de Pagos con Confirmación

#### **Modal de Confirmación Completo**
- ✅ Resumen detallado del pago antes de confirmar
- ✅ Visualización del impacto en el contrato
- ✅ Dos checkboxes de confirmación obligatorios
- ✅ Alertas si el monto excede el saldo pendiente
- ✅ Validaciones en tiempo real

#### **Información Mostrada:**
- Monto exacto del pago
- Método de pago seleccionado
- Tipo de tarjeta (si aplica)
- Número de referencia
- Notas adicionales
- Estado actual del contrato (total, pagado, saldo)
- **Nuevo saldo proyectado** después del pago

#### **Validaciones:**
- Monto debe ser mayor a 0
- Advertencia si el monto excede el saldo pendiente
- Ambos checkboxes deben estar marcados
- No se puede cerrar el modal mientras se procesa

---

### 2. Anulación de Pagos

#### **Modal de Anulación**
- ⚠️ Información completa del pago a anular
- ⚠️ Impacto visual del cambio en el contrato
- ⚠️ Campo obligatorio para motivo de anulación
- ⚠️ Checkbox de confirmación final
- ⚠️ Advertencias claras sobre las consecuencias

#### **Proceso de Anulación:**
1. Click en botón "Anular" en un pago activo
2. Se abre modal con información del pago
3. Escribir motivo obligatorio de la anulación
4. Marcar checkbox de confirmación
5. Sistema revierte automáticamente:
   - ❌ Marca el pago como "anulado"
   - ➖ Resta el monto del total pagado
   - ➕ Aumenta el saldo pendiente
   - 📝 Registra el motivo en las notas
   - 🔄 Actualiza el estado de pago del contrato

---

## 🎨 Interfaz de Usuario

### **Indicadores Visuales**

#### Pagos Activos:
- ✅ Fondo gris claro (`bg-gray-50`)
- ✅ Icono verde de tarjeta
- ✅ Botón rojo "Anular" visible
- ✅ Información completa del pago

#### Pagos Anulados:
- ❌ Fondo rojo claro (`bg-red-50`)
- ❌ Borde rojo destacado
- ❌ Icono rojo de tarjeta
- ❌ Badge "ANULADO" prominente
- ❌ Monto con tachado (`line-through`)
- ❌ Sin botón de anular

### **Modales**

#### Modal de Confirmación:
- 🟠 Header naranja/ámbar con icono de advertencia
- 📊 Resumen del pago en tarjeta destacada
- 💙 Estado del contrato en tarjeta azul
- 🔴 Alerta roja si hay exceso de monto
- ⚠️ Checkboxes amarillos de confirmación
- 💡 Nota informativa sobre anulación

#### Modal de Anulación:
- 🔴 Header rojo/rosa con icono de prohibición
- 📋 Información del pago en tarjeta roja
- 🟠 Impacto del contrato en tarjeta naranja
- ⚠️ Advertencias claras y destacadas
- 📝 Campo de texto para motivo
- ✔️ Checkbox de confirmación final

---

## 🔧 Implementación Técnica

### **Backend**

#### Endpoint de Anulación
```javascript
PUT /api/pagos/:id/anular
```

**Request Body:**
```json
{
  "motivo": "Descripción del motivo de anulación"
}
```

**Validaciones:**
- ✅ Pago debe existir
- ✅ Pago no debe estar ya anulado
- ✅ Usuario debe ser vendedor autenticado

**Proceso (Transacción Atómica):**
1. Marcar pago con `estado = 'anulado'`
2. Agregar motivo a las notas del pago
3. Calcular nuevo total pagado (restar monto anulado)
4. Calcular nuevo saldo pendiente
5. Actualizar estado de pago del contrato:
   - "completado" si saldo ≤ 0
   - "parcial" si hay pagos pero aún hay saldo
   - "pendiente" si no hay pagos activos
6. Todo se ejecuta en transacción para garantizar integridad

**Response:**
```json
{
  "success": true,
  "message": "Pago anulado exitosamente",
  "pago": { /* datos del pago anulado */ }
}
```

---

### **Frontend**

#### Componentes Nuevos:

1. **`ModalConfirmacionPago.jsx`**
   - Props: `isOpen`, `onClose`, `datosPago`, `contrato`, `onConfirm`, `loading`
   - Estados internos: `confirmacion1`, `confirmacion2`
   - Cálculos: `saldoPendienteActual`, `nuevoSaldoPendiente`

2. **`ModalAnularPago.jsx`**
   - Props: `isOpen`, `onClose`, `pago`, `contrato`, `onConfirm`, `loading`
   - Estados internos: `motivo`, `confirmacion`
   - Cálculos: `nuevoSaldoPendiente` después de anular

#### Actualizaciones en `DetalleContrato.jsx`:

**Estados Nuevos:**
```javascript
const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
const [modalAnularOpen, setModalAnularOpen] = useState(false);
const [pagoAAnular, setPagoAAnular] = useState(null);
```

**Mutations:**
```javascript
// Mutation de pago existente actualizada con modal
const mutationPago = useMutation({
  onSuccess: () => {
    setModalConfirmacionOpen(false);
    toast.success('✅ Pago registrado exitosamente');
  }
});

// Nueva mutation para anular
const mutationAnularPago = useMutation({
  mutationFn: async ({ pagoId, motivo }) => {
    return await api.put(`/pagos/${pagoId}/anular`, { motivo });
  },
  onSuccess: () => {
    toast.success('✅ Pago anulado exitosamente');
  }
});
```

**Handlers:**
```javascript
// Abre modal en lugar de enviar directamente
const handlePagoSubmit = (e) => {
  e.preventDefault();
  if (!formPago.monto || parseFloat(formPago.monto) <= 0) {
    toast.error('Por favor ingresa un monto válido');
    return;
  }
  setModalConfirmacionOpen(true);
};

// Confirma y envía el pago
const handleConfirmarPago = () => {
  mutationPago.mutate(dataToSubmit);
};

// Abre modal de anulación
const handleAbrirModalAnular = (pago) => {
  setPagoAAnular(pago);
  setModalAnularOpen(true);
};

// Confirma y anula el pago
const handleConfirmarAnulacion = (pagoId, motivo) => {
  mutationAnularPago.mutate({ pagoId, motivo });
};
```

---

## 📊 Base de Datos

### **Tabla: pagos**

```sql
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos(id),
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    tipo_tarjeta VARCHAR(50),
    recargo_tarjeta DECIMAL(10,2) DEFAULT 0.00,
    monto_total DECIMAL(10,2) NOT NULL,
    numero_referencia VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'completado',  -- ✨ CLAVE: 'completado' o 'anulado'
    notas TEXT,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER REFERENCES vendedores(id)
);
```

**Estados del Pago:**
- `completado`: Pago válido y activo
- `anulado`: Pago revertido (no se cuenta en totales)

---

## 🛡️ Seguridad y Validaciones

### **Prevención de Errores:**

1. **Validación de Monto:**
   - No permite montos ≤ 0
   - Alerta visual si excede el saldo

2. **Confirmación Doble:**
   - Dos checkboxes obligatorios para registrar
   - Un checkbox obligatorio para anular

3. **Motivo Obligatorio:**
   - Campo de texto requerido para anular
   - Se registra en las notas del pago

4. **Transacciones Atómicas:**
   - Todo se ejecuta en una transacción
   - Si algo falla, nada se aplica

5. **Auditoría Completa:**
   - Se registra quién hizo el pago
   - Se registra fecha y hora
   - Se guarda el motivo de anulación
   - Todo queda en el historial

### **Integridad de Datos:**

✅ **Garantías:**
- No se pueden eliminar pagos, solo anular
- Los pagos anulados permanecen en el historial
- Los totales del contrato siempre son consistentes
- Estado de pago se actualiza automáticamente
- No hay valores negativos inconsistentes

---

## 🚀 Flujos de Trabajo

### **Flujo 1: Registro de Pago Normal**

```
1. Vendedor llena formulario de pago
2. Click en "Registrar Pago"
3. ✅ Se abre modal de confirmación
4. Vendedor revisa todos los datos
5. Lee y marca checkbox 1 (monto y método correctos)
6. Lee y marca checkbox 2 (entiende que puede anular)
7. Click en "Confirmar y Registrar Pago"
8. ✅ Loading mientras se procesa
9. ✅ Toast de éxito
10. ✅ Modal se cierra
11. ✅ Formulario se resetea
12. ✅ Datos se refrescan automáticamente
```

### **Flujo 2: Anulación de Pago por Error**

```
1. Vendedor detecta error en pago registrado
2. Click en botón "Anular" junto al pago
3. ⚠️ Se abre modal de anulación
4. Vendedor revisa información del pago
5. Ve el impacto que tendrá en el contrato
6. Escribe motivo detallado de la anulación
7. Marca checkbox de confirmación
8. Click en "Confirmar Anulación"
9. ⚠️ Loading mientras se procesa
10. ✅ Toast de éxito
11. ✅ Modal se cierra
12. ✅ Pago aparece tachado con badge "ANULADO"
13. ✅ Totales del contrato actualizados
14. ✅ Saldo pendiente aumentado correctamente
```

### **Flujo 3: Corrección de Error**

```
Escenario: Se registró $500 pero debía ser $600

1. Vendedor anula el pago de $500 con motivo "Monto incorrecto"
2. Sistema revierte el pago automáticamente
3. Vendedor registra nuevo pago de $600 (con confirmación)
4. Historial muestra:
   - Pago de $500 ANULADO
   - Pago de $600 activo
5. Totales correctos en el contrato
```

---

## 📈 Beneficios del Sistema

### **Para el Vendedor:**
- ✅ Mayor confianza al registrar pagos
- ✅ Visibilidad completa antes de confirmar
- ✅ Capacidad de corregir errores sin ayuda técnica
- ✅ Auditoría clara de todos los cambios

### **Para el Cliente:**
- ✅ Mayor precisión en registros financieros
- ✅ Transparencia total en pagos
- ✅ Historial completo visible

### **Para el Sistema:**
- ✅ Integridad de datos garantizada
- ✅ Auditoría completa de operaciones
- ✅ Prevención de errores humanos
- ✅ Facilita reconciliaciones financieras

---

## 🔍 Casos de Uso Comunes

### **Caso 1: Pago Duplicado**
**Problema:** Cliente pagó $1000 dos veces por error
**Solución:**
1. Anular uno de los pagos con motivo "Pago duplicado"
2. Sistema revierte automáticamente
3. Saldo queda correcto

### **Caso 2: Monto Incorrecto**
**Problema:** Se registró $800 pero debía ser $850
**Solución:**
1. Anular pago de $800 con motivo "Monto incorrecto - debía ser $850"
2. Registrar nuevo pago de $850
3. Historial muestra ambas operaciones

### **Caso 3: Método de Pago Equivocado**
**Problema:** Se registró como "Efectivo" pero fue "Transferencia"
**Solución:**
1. Anular pago con motivo "Error en método de pago"
2. Registrar nuevo pago con método correcto
3. Auditoría completa del cambio

---

## 🎯 Mejores Prácticas

### **Al Registrar Pagos:**
1. ✅ Verificar dos veces el monto antes de continuar
2. ✅ Incluir número de referencia cuando aplique
3. ✅ Leer cuidadosamente el modal de confirmación
4. ✅ Revisar el nuevo saldo proyectado
5. ✅ Agregar notas relevantes

### **Al Anular Pagos:**
1. ✅ Escribir motivo claro y descriptivo
2. ✅ Verificar que se está anulando el pago correcto
3. ✅ Revisar el impacto en los totales
4. ✅ Registrar el pago correcto inmediatamente después

### **Auditoría:**
1. ✅ Revisar historial completo regularmente
2. ✅ Verificar que pagos anulados tienen motivo
3. ✅ Cruzar referencias con registros bancarios
4. ✅ Mantener documentación externa de cambios importantes

---

## 📚 Referencias Técnicas

### **Archivos Relacionados:**

**Backend:**
- `backend/src/routes/pagos.routes.js` - Endpoint de anulación
- `database/schema.sql` - Tabla `pagos` con campo `estado`

**Frontend:**
- `frontend/src/components/ModalConfirmacionPago.jsx` - Modal de confirmación
- `frontend/src/components/ModalAnularPago.jsx` - Modal de anulación
- `frontend/src/pages/DetalleContrato.jsx` - Integración completa

**Dependencias:**
- `react-hot-toast` - Notificaciones
- `lucide-react` - Iconos
- `@tanstack/react-query` - Gestión de estado

---

## ✅ Checklist de Verificación

Al probar el sistema, verificar:

- [ ] Modal de confirmación se abre al intentar registrar pago
- [ ] No se puede confirmar sin marcar ambos checkboxes
- [ ] Se valida que el monto sea mayor a 0
- [ ] Se muestra alerta si el monto excede el saldo
- [ ] Cálculos de nuevo saldo son correctos
- [ ] Toast de éxito aparece después de registrar
- [ ] Formulario se resetea después de éxito
- [ ] Botón "Anular" solo aparece en pagos activos
- [ ] Modal de anulación muestra información correcta
- [ ] No se puede anular sin escribir motivo
- [ ] No se puede anular sin marcar checkbox
- [ ] Pago anulado aparece tachado con badge
- [ ] Totales del contrato se actualizan correctamente
- [ ] Pagos anulados no tienen botón "Anular"
- [ ] Historial muestra todos los pagos (activos y anulados)

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
**Estado:** ✅ Implementado y Probado



