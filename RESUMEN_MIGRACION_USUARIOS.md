# ✅ Resumen de Migración: Consolidación de Usuarios

## Estado Actual

### ✅ Completado

1. **Schema Prisma**:
   - ✅ Nuevo modelo `usuarios` creado con sistema de roles
   - ✅ Relaciones actualizadas en todas las tablas principales:
     - `clientes` → `usuario_id` (nuevo campo)
     - `leaks` → `usuario_id` (nuevo campo)
     - `ofertas` → `usuario_id` (nuevo campo)
     - `contratos` → `usuario_id` (nuevo campo)
     - `pagos` → `usuario_id` (nuevo campo)
     - `solicitudes_cliente` → `usuario_id` (nuevo campo)
     - `versiones_contratos_pdf` → `usuario_id` (nuevo campo)
     - `historial_cambios_precios` → `usuario_id` (nuevo campo)
     - `checklist_servicios_externos` → `usuario_id` (nuevo campo)
     - `movimientos_inventario` → `usuarios` (actualizado)
   - ✅ Tablas antiguas mantenidas temporalmente para compatibilidad

2. **Scripts**:
   - ✅ Script de migración `migrar_usuarios.js` creado
   - ✅ Plan de migración documentado

3. **Código Backend**:
   - ✅ Función `generateUsuarioToken` agregada en `jwt.js`
   - ✅ Login de vendedor actualizado para buscar en ambas tablas (compatibilidad)

### ⏳ Pendiente

1. **Actualizar rutas de autenticación**:
   - Actualizar `/login/manager` para usar tabla `usuarios`
   - Actualizar `/login/gerente` para usar tabla `usuarios`
   - Actualizar `/login/inventario` para usar tabla `usuarios`
   - Actualizar `/auth/me` para buscar en tabla `usuarios`

2. **Actualizar rutas que usan usuarios**:
   - `vendedores.routes.js` → buscar en `usuarios` con `rol='vendedor'`
   - `gerentes.routes.js` → buscar en `usuarios` con `rol='gerente'`
   - `managers.routes.js` → buscar en `usuarios` con `rol='manager'`
   - `inventario.routes.js` → buscar en `usuarios` con `rol='inventario'`
   - Todas las rutas que usan `vendedor_id`, `manager_id`, etc.

3. **Actualizar scripts de creación**:
   - `crear_usuario_prueba.js` → crear en tabla `usuarios`
   - `crear_gerentes.js` → crear en tabla `usuarios`
   - `crear_managers.js` → crear en tabla `usuarios`
   - `crear_administradores.js` → crear en tabla `usuarios`
   - `inicializar_bd_completo.js` → usar nuevos scripts

4. **Migración de datos**:
   - Ejecutar `migrar_usuarios.js` para migrar datos existentes
   - Actualizar foreign keys en todas las tablas relacionadas

5. **Limpieza**:
   - Eliminar tablas antiguas después de verificar que todo funciona

---

## Próximos Pasos Recomendados

### Paso 1: Completar actualización de autenticación
```bash
# Actualizar todos los endpoints de login en auth.routes.js
```

### Paso 2: Ejecutar migración de datos
```bash
cd backend
node scripts/migrar_usuarios.js
```

### Paso 3: Actualizar código gradualmente
- Empezar con rutas más simples
- Probar cada cambio
- Continuar con rutas más complejas

### Paso 4: Actualizar scripts de creación
- Modificar scripts para crear en tabla `usuarios`
- Probar creación de usuarios

### Paso 5: Verificar todo funciona
- Probar login de todos los tipos de usuarios
- Probar todas las funcionalidades principales
- Verificar que las relaciones funcionan correctamente

### Paso 6: Limpieza final
- Eliminar tablas antiguas del schema
- Eliminar código deprecated

---

## Notas Importantes

⚠️ **IMPORTANTE**: 
- Las tablas antiguas se mantienen temporalmente para compatibilidad
- El código actualizado busca primero en `usuarios`, luego en tablas antiguas
- Esto permite migración gradual sin romper el sistema

🔒 **SEGURIDAD**:
- Hacer backup completo antes de ejecutar migración
- Probar en desarrollo primero
- Tener plan de rollback

📝 **CAMBIOS REALIZADOS**:
- Schema actualizado con nuevo modelo `usuarios`
- Relaciones actualizadas en todas las tablas
- Script de migración creado
- Login de vendedor actualizado (compatibilidad)

---

## Archivos Modificados

- `backend/prisma/schema.prisma` - Nuevo modelo usuarios y relaciones
- `backend/scripts/migrar_usuarios.js` - Script de migración
- `backend/src/utils/jwt.js` - Función `generateUsuarioToken`
- `backend/src/routes/auth.routes.js` - Login vendedor actualizado
- `PLAN_MIGRACION_USUARIOS.md` - Plan completo
- `ANALISIS_BASE_DATOS.md` - Análisis inicial

---

## Estado: ~60% Completado

La estructura base está lista. Falta actualizar el código del backend para usar completamente la nueva tabla `usuarios`.

