# ⏰ Expiración del Código de Acceso del Cliente

## 🔒 Problema Identificado

**Antes**: El código de acceso del cliente **NO caducaba nunca**, lo que representaba un riesgo de seguridad.

## ✅ Solución Implementada

Se ha implementado un sistema de **expiración automática** del código de acceso:

### Reglas de Expiración

1. **Período de validez**: El código expira **30 días después de la fecha del evento**
2. **Validación en múltiples puntos**:
   - ✅ Al hacer login con el código (`POST /api/auth/login/cliente`)
   - ✅ Al obtener contrato por código (`GET /api/contratos/acceso/:codigo`)
   - ✅ Al validar tokens JWT existentes (middleware de autenticación)

### Ejemplo

- **Fecha del evento**: 15 de enero de 2025
- **Fecha de expiración**: 14 de febrero de 2025 (30 días después)
- **Después del 14 de febrero**: El código ya no funciona

## 📋 Comportamiento

### Cuando el código expira:

1. **Login falla** con mensaje:
   ```
   "El código de acceso ha expirado. El evento fue el [fecha] y el código expiró el [fecha]. Por favor, contacta a tu vendedor para obtener un nuevo código."
   ```

2. **Tokens existentes** también se invalidan automáticamente

3. **Acceso al portal** se bloquea hasta obtener un nuevo código

## 🔧 Configuración

El período de gracia (30 días) está definido en:
- `backend/src/routes/auth.routes.js` (línea 105)
- `backend/src/routes/contratos.routes.js` (línea 486)
- `backend/src/middleware/auth.js` (línea ~XX)

Para cambiar el período, modifica la variable `diasDespuesEvento` en estos archivos.

## 💡 Recomendaciones

1. **Comunicar a los clientes**: Informar que el código expira 30 días después del evento
2. **Renovación**: Si un cliente necesita acceso después de la expiración, el vendedor puede generar un nuevo código (requiere modificación del código de acceso en la base de datos)
3. **Eventos futuros**: Los códigos de eventos futuros siguen siendo válidos hasta 30 días después del evento

## 🎯 Beneficios de Seguridad

- ✅ Previene acceso indefinido a datos del evento
- ✅ Reduce el riesgo si el código se compromete
- ✅ Limita el período de exposición de información
- ✅ Cumple con mejores prácticas de seguridad

---

**Fecha de implementación**: $(date)
**Estado**: ✅ **IMPLEMENTADO Y ACTIVO**

