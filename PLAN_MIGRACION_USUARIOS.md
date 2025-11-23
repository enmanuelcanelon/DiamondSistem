# 📋 Plan de Migración: Consolidación de Tablas de Usuarios

## Objetivo
Consolidar las 4 tablas de usuarios (`vendedores`, `gerentes`, `managers`, `usuarios_inventario`) en una sola tabla `usuarios` con sistema de roles.

---

## Fase 1: Preparación del Schema ✅ (En progreso)

### 1.1 Crear nuevo modelo `usuarios`
- ✅ Campo `rol` con valores: 'vendedor', 'gerente', 'manager', 'inventario'
- ✅ Campos comunes: nombre, email, telefono, password_hash, activo
- ✅ Campos específicos por rol (nullable): comision_porcentaje, google_calendar_*, etc.
- ✅ Todas las relaciones necesarias

### 1.2 Mantener tablas antiguas temporalmente
- Marcar como deprecated pero mantener para migración gradual
- Las relaciones seguirán apuntando a las tablas antiguas inicialmente

---

## Fase 2: Script de Migración de Datos

### 2.1 Crear script `migrar_usuarios.js`
- Migrar datos de `vendedores` → `usuarios` (rol='vendedor')
- Migrar datos de `gerentes` → `usuarios` (rol='gerente')
- Migrar datos de `managers` → `usuarios` (rol='manager')
- Migrar datos de `usuarios_inventario` → `usuarios` (rol='inventario')
- Mapear `codigo_vendedor` → `codigo_usuario`
- Mapear `codigo_gerente` → `codigo_usuario`
- Mapear `codigo_manager` → `codigo_usuario`
- Mapear `codigo_usuario` (inventario) → `codigo_usuario`

---

## Fase 3: Actualizar Relaciones en Schema

### 3.1 Actualizar relaciones en tablas que referencian usuarios:
- `clientes.vendedor_id` → `clientes.usuario_id` (con filtro rol='vendedor')
- `leaks.vendedor_id` → `leaks.usuario_id` (con filtro rol='vendedor')
- `ofertas.vendedor_id` → `ofertas.usuario_id` (con filtro rol='vendedor')
- `contratos.vendedor_id` → `contratos.usuario_id` (con filtro rol='vendedor')
- `pagos.registrado_por` → `pagos.usuario_id` (cualquier rol)
- `solicitudes_cliente.respondido_por` → `solicitudes_cliente.usuario_id` (cualquier rol)
- `versiones_contratos_pdf.generado_por` → `versiones_contratos_pdf.usuario_id` (cualquier rol)
- `historial_cambios_precios.modificado_por` → `historial_cambios_precios.usuario_id` (cualquier rol)
- `checklist_servicios_externos.manager_id` → `checklist_servicios_externos.usuario_id` (con filtro rol='manager')
- `movimientos_inventario.usuario_id` → ya apunta a `usuarios_inventario`, cambiar a `usuarios` (con filtro rol='inventario')

---

## Fase 4: Actualizar Código del Backend

### 4.1 Autenticación (`auth.routes.js`)
- Unificar endpoints de login en uno solo: `/api/auth/login`
- Buscar usuario por `codigo_usuario` y `rol`
- Generar token con información del rol

### 4.2 Middleware (`auth.js`)
- Actualizar `authenticate` para buscar en tabla `usuarios`
- Mantener lógica de verificación de roles

### 4.3 Rutas que usan usuarios
- `vendedores.routes.js` → buscar en `usuarios` con `rol='vendedor'`
- `gerentes.routes.js` → buscar en `usuarios` con `rol='gerente'`
- `managers.routes.js` → buscar en `usuarios` con `rol='manager'`
- `inventario.routes.js` → buscar en `usuarios` con `rol='inventario'`
- Todas las rutas que usan `vendedor_id`, `manager_id`, etc.

### 4.4 Scripts de creación
- `crear_usuario_prueba.js` → crear en tabla `usuarios` con `rol='vendedor'`
- `crear_gerentes.js` → crear en tabla `usuarios` con `rol='gerente'`
- `crear_managers.js` → crear en tabla `usuarios` con `rol='manager'`
- `crear_administradores.js` → crear en tabla `usuarios` con `rol='inventario'`

---

## Fase 5: Migración de Datos en Producción

### 5.1 Ejecutar script de migración
- Verificar que todos los datos se migraron correctamente
- Verificar integridad referencial

### 5.2 Actualizar IDs en relaciones
- Actualizar todas las foreign keys para apuntar a la nueva tabla `usuarios`
- Usar los nuevos IDs de la tabla `usuarios`

---

## Fase 6: Limpieza

### 6.1 Eliminar tablas antiguas
- Eliminar `vendedores`
- Eliminar `gerentes`
- Eliminar `managers`
- Eliminar `usuarios_inventario`

### 6.2 Actualizar documentación
- Actualizar README
- Actualizar scripts de inicialización

---

## Consideraciones Importantes

1. **Backup**: Hacer backup completo antes de migrar
2. **Downtime**: Considerar downtime durante migración
3. **Rollback**: Tener plan de rollback si algo falla
4. **Testing**: Probar migración en ambiente de desarrollo primero
5. **IDs**: Los IDs cambiarán, necesitamos mapear IDs antiguos a nuevos

---

## Orden de Ejecución Recomendado

1. ✅ Crear nuevo modelo `usuarios` en schema
2. ⏳ Crear script de migración de datos
3. ⏳ Actualizar relaciones en schema
4. ⏳ Actualizar código de autenticación
5. ⏳ Actualizar todas las rutas
6. ⏳ Actualizar scripts de creación
7. ⏳ Ejecutar migración en desarrollo
8. ⏳ Probar todo el sistema
9. ⏳ Ejecutar migración en producción
10. ⏳ Eliminar tablas antiguas

