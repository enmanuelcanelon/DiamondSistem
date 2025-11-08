# Validación de Horarios para Eventos

## 📋 Reglas de Horario Implementadas

### Horarios Permitidos
- **Hora de inicio mínima**: 10:00 AM
- **Hora de fin máxima normal**: 1:00 AM (del día siguiente)
- **Hora de fin máxima con 1 hora extra**: 2:00 AM (del día siguiente)

### Restricción Legal
⚠️ **No se permite terminar después de las 2:00 AM por restricciones legales**

## ✅ Funcionalidades Implementadas

### 1. **Validación en Tiempo Real**
- Al cambiar la hora de inicio o fin, se valida automáticamente
- Los campos se marcan en rojo si hay error
- Mensaje de error aparece inmediatamente

### 2. **Restricciones Nativas del Navegador**
```html
<input type="time" min="10:00" />   <!-- Hora de inicio -->
<input type="time" max="02:00" />   <!-- Hora de fin -->
```

### 3. **Validación al Enviar**
- Verifica horarios antes de crear/editar la oferta
- Bloquea el envío si hay errores
- Scroll automático al campo con error

### 4. **Mensajes Informativos**
- ⏰ "Horario permitido: desde las 10:00 AM"
- ⏰ "Máximo: 1:00 AM (2:00 AM con 1 hora extra)"
- Mensaje de error detallado cuando se infringe la regla

## 🎨 Feedback Visual

### Campo Normal
```
┌─────────────────────┐
│  [10:00]            │  ⏰ Horario permitido: desde las 10:00 AM
└─────────────────────┘
```

### Campo con Error
```
┌─────────────────────┐
│  [08:00]            │ ⏰ Horario permitido: desde las 10:00 AM
└─────────────────────┘
  ⚠ Error de horario: La hora de inicio debe ser a partir de las 10:00 AM
```

## 📊 Ejemplos de Validación

### ✅ Horarios Válidos

1. **Evento de día completo**
   - Inicio: 10:00 AM
   - Fin: 11:00 PM
   - Estado: ✅ Válido

2. **Evento nocturno**
   - Inicio: 6:00 PM
   - Fin: 1:00 AM
   - Estado: ✅ Válido (termina al día siguiente)

3. **Evento con 1 hora extra**
   - Inicio: 7:00 PM
   - Fin: 2:00 AM
   - Estado: ✅ Válido (máximo permitido)

### ❌ Horarios Inválidos

1. **Inicio muy temprano**
   - Inicio: 8:00 AM ❌
   - Fin: 10:00 PM
   - Error: "La hora de inicio debe ser a partir de las 10:00 AM"

2. **Fin después del límite legal**
   - Inicio: 8:00 PM
   - Fin: 3:00 AM ❌
   - Error: "La hora de fin no puede ser después de las 2:00 AM (máximo legal permitido con 1 hora extra)"

## 🔧 Implementación Técnica

### Función de Validación
```javascript
const validarHorarios = (horaInicio, horaFin) => {
  // Convierte horas a minutos desde medianoche
  // Valida hora mínima de inicio (10:00 AM)
  // Valida hora máxima de fin (2:00 AM del día siguiente)
  return errorMessage || null;
};
```

### Detección de Eventos que Cruzan Medianoche
```javascript
const terminaDiaSiguiente = minutosFin < minutosInicio;
// Si la hora de fin es menor que la de inicio,
// significa que el evento termina al día siguiente
```

## 📂 Archivos Modificados

1. **`frontend/src/pages/CrearOferta.jsx`**
   - Agregado estado `errorHorario`
   - Agregada función `validarHorarios()`
   - Validación en `handleChange()`
   - Validación en `handleSubmit()`
   - Actualización visual de campos de hora
   - Mensaje de error contextual

2. **`frontend/src/pages/EditarOferta.jsx`**
   - Mismos cambios aplicados para edición de ofertas

## 🧪 Cómo Probar

1. **Prueba 1: Hora de inicio antes de 10:00 AM**
   - Ir a "Crear Oferta"
   - Seleccionar hora de inicio: 08:00 AM
   - Verificar que aparece error en rojo

2. **Prueba 2: Hora de fin después de 2:00 AM**
   - Hora inicio: 8:00 PM
   - Hora fin: 3:00 AM
   - Verificar error: "no puede ser después de las 2:00 AM"

3. **Prueba 3: Intento de envío con error**
   - Configurar horario inválido
   - Click en "Guardar Oferta"
   - Verificar que NO se envía y hace scroll al error

4. **Prueba 4: Horario válido nocturno**
   - Inicio: 7:00 PM
   - Fin: 1:00 AM
   - Verificar que acepta sin errores

## ⚠️ Notas Importantes

1. **Eventos que cruzan medianoche**: El sistema detecta automáticamente cuando un evento termina al día siguiente (hora de fin < hora de inicio)

2. **Restricción legal**: El límite de 2:00 AM es una restricción legal que NO puede ser removida por los vendedores

3. **Hora Extra**: El mensaje menciona que con 1 hora extra se puede llegar hasta las 2:00 AM, pero la validación permite cualquier horario hasta ese límite

4. **Horarios existentes**: Las ofertas/contratos ya creados NO se validan retroactivamente. La validación solo aplica a nuevas ofertas o ediciones.

---

**Fecha de implementación**: Noviembre 4, 2025  
**Estado**: ✅ Implementado y funcionando
**Afecta a**: Crear Oferta, Editar Oferta




