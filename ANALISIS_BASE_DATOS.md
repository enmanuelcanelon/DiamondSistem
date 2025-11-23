# 📊 Análisis de Base de Datos - DiamondSistem

## Resumen
- **Total de tablas**: 34
- **Estado general**: Estructura funcional pero con oportunidades de optimización

---

## ✅ Tablas Bien Diseñadas (Mantener)

### 1. **Tablas Core**
- `clientes` - ✅ Bien estructurada
- `ofertas` - ✅ Bien estructurada
- `contratos` - ✅ Bien estructurada (pero tiene campos deprecated)
- `pagos` - ✅ Bien estructurada
- `eventos` - ✅ Bien estructurada

### 2. **Tablas de Configuración**
- `temporadas` - ✅ Bien estructurada
- `salones` - ✅ Bien estructurada
- `paquetes` - ✅ Bien estructurada
- `servicios` - ✅ Bien estructurada
- `configuracion_sistema` - ✅ Bien estructurada

### 3. **Tablas de Relaciones Many-to-Many** (Necesarias)
- `paquetes_salones` - ✅ Necesaria (precios por salón)
- `paquetes_servicios` - ✅ Necesaria (servicios incluidos en paquetes)
- `contratos_servicios` - ✅ Necesaria (servicios adicionales en contratos)
- `ofertas_servicios_adicionales` - ✅ Necesaria (servicios adicionales en ofertas)

### 4. **Tablas de Gestión de Eventos**
- `mesas` - ✅ Bien estructurada
- `invitados` - ✅ Bien estructurada
- `playlist_canciones` - ✅ Bien estructurada
- `solicitudes_cliente` - ✅ Bien estructurada
- `mensajes` - ✅ Bien estructurada

### 5. **Tablas de Inventario** (Bien estructuradas)
- `inventario_items` - ✅ Bien estructurada
- `inventario_central` - ✅ Bien estructurada
- `inventario_salones` - ✅ Bien estructurada
- `asignaciones_inventario` - ✅ Bien estructurada
- `movimientos_inventario` - ✅ Bien estructurada

---

## ⚠️ Problemas Identificados

### 1. **Múltiples Tablas de Usuarios** (REDUNDANTE)
**Problema**: 4 tablas separadas para tipos de usuarios similares:
- `vendedores`
- `gerentes`
- `managers`
- `usuarios_inventario`

**Impacto**:
- Código duplicado
- Dificulta agregar nuevos tipos de usuarios
- Queries más complejas cuando necesitas todos los usuarios

**Solución Recomendada**:
```prisma
// Tabla única con roles
model usuarios {
  id                  Int       @id @default(autoincrement())
  nombre_completo     String    @db.VarChar(255)
  codigo_usuario      String    @unique @db.VarChar(50)
  email               String    @unique @db.VarChar(255)
  telefono            String?   @db.VarChar(20)
  password_hash       String    @db.VarChar(255)
  rol                 String    @db.VarChar(50) // 'vendedor', 'gerente', 'manager', 'inventario'
  // Campos específicos por rol (nullable)
  comision_porcentaje Decimal?  @db.Decimal(5, 2) // Solo para vendedores
  // Google Calendar (solo para vendedores)
  google_calendar_id          String?   @db.VarChar(255)
  google_access_token         String?   @db.Text
  google_refresh_token        String?   @db.Text
  google_token_expires_at     DateTime? @db.Timestamp(6)
  google_calendar_sync_enabled Boolean?  @default(false)
  activo              Boolean?  @default(true)
  fecha_registro      DateTime? @default(now()) @db.Timestamp(6)
  fecha_actualizacion DateTime? @default(now()) @db.Timestamp(6)
  
  // Relaciones
  clientes                clientes[]
  ofertas                 ofertas[]
  contratos               contratos[]
  // ... etc
}
```

**Beneficios**:
- Una sola tabla para autenticación
- Más fácil agregar nuevos roles
- Queries más simples
- Menos código duplicado

**Migración**: Requiere refactorizar código pero es factible

---

### 2. **Campos Deprecated en `contratos`** (LIMPIAR)
**Problema**: Campos marcados como deprecated pero aún en uso:
- `comision_calculada` (deprecated) - **Usado en**: `backend/src/routes/contratos.routes.js:425`
- `comision_pagada` (deprecated) - **No se usa actualmente** ✅

**Ubicación del código**:
- `backend/src/routes/contratos.routes.js` línea 393-425: Se mantiene para "compatibilidad"

**Solución**: 
1. Verificar que ningún código dependa de estos campos
2. Eliminar después de migrar completamente a:
   - `comision_total_calculada`
   - `comision_primera_mitad_pagada`
   - `comision_segunda_mitad_pagada`

---

### 3. **Tabla `historial_cambios_precios`** (PODRÍA OPTIMIZARSE)
**Problema**: Tabla genérica que puede ser confusa:
- `tipo_entidad` y `entidad_id` son genéricos
- Puede ser difícil de consultar

**Solución Opcional**: Separar en tablas específicas:
- `historial_cambios_ofertas`
- `historial_cambios_contratos`

O mantener como está si funciona bien.

---

### 4. **Tabla `versiones_contratos_pdf`** (PODRÍA OPTIMIZARSE)
**Problema**: Almacena PDFs como `Bytes?` en la base de datos
- Puede hacer la BD muy pesada
- Consultas más lentas

**Solución Recomendada**:
- Guardar PDFs en almacenamiento (S3, Google Cloud Storage, etc.)
- Guardar solo la URL en la BD
- O usar un campo `ruta_archivo` en lugar de `pdf_contenido`

---

### 5. **Tabla `ajustes_evento`** (MUY GRANDE)
**Problema**: 70+ campos en una sola tabla
- Puede ser difícil de mantener
- Muchos campos nullable

**Análisis**: 
- Está bien si todos los campos son necesarios
- Considerar normalización si hay grupos lógicos:
  - `ajustes_torta`
  - `ajustes_decoracion`
  - `ajustes_menu`
  - `ajustes_entretenimiento`

**Recomendación**: Mantener como está si funciona bien, pero documentar bien.

---

### 6. **Tabla `leaks`** (BIEN PERO PODRÍA MEJORAR)
**Problema**: Campo `motivo_rechazo` deprecated pero aún existe
- **Nota**: Este campo está deprecated pero no se usa actualmente en el código ✅

**Solución**: Eliminar campo `motivo_rechazo` de la tabla `leaks` (ya se migró a `motivo_no_interesado`)

---

### 7. **Tabla `solicitudes_cliente`** (CAMPO CORRECTO)
**Nota**: Esta tabla usa `motivo_rechazo` correctamente (no es deprecated aquí)
- El campo `motivo_rechazo` en `solicitudes_cliente` es válido y necesario
- Solo el campo `motivo_rechazo` en `leaks` está deprecated

---

## 📈 Recomendaciones de Optimización

### Prioridad ALTA

1. **Consolidar tablas de usuarios** ⭐⭐⭐
   - Impacto: Alto
   - Esfuerzo: Medio-Alto
   - Beneficio: Código más limpio, más fácil de mantener

2. **Eliminar campos deprecated** ⭐⭐⭐
   - Impacto: Medio
   - Esfuerzo: Bajo
   - Beneficio: Código más limpio

### Prioridad MEDIA

3. **Optimizar almacenamiento de PDFs** ⭐⭐
   - Impacto: Alto (rendimiento)
   - Esfuerzo: Medio
   - Beneficio: BD más rápida, menos espacio

4. **Limpiar campos deprecated en leaks** ⭐⭐
   - Impacto: Bajo
   - Esfuerzo: Bajo
   - Beneficio: Código más limpio

### Prioridad BAJA

5. **Considerar normalización de `ajustes_evento`** ⭐
   - Impacto: Bajo
   - Esfuerzo: Alto
   - Beneficio: Depende del uso

---

## 📊 Estadísticas

### Por Tipo de Tabla:
- **Usuarios**: 4 tablas (podrían ser 1)
- **Core Business**: 5 tablas ✅
- **Configuración**: 5 tablas ✅
- **Relaciones Many-to-Many**: 4 tablas ✅
- **Gestión de Eventos**: 5 tablas ✅
- **Inventario**: 5 tablas ✅
- **Auditoría/Historial**: 2 tablas ✅
- **Otros**: 4 tablas ✅

### Índices:
- ✅ Bien indexadas las tablas principales
- ✅ Índices en campos frecuentemente consultados

---

## 🎯 Conclusión

**Estado General**: ✅ **BUENO**

La base de datos está bien estructurada en general. Los principales problemas son:

1. **Redundancia en tablas de usuarios** - Puede mejorarse
2. **Campos deprecated** - Deben eliminarse
3. **Almacenamiento de PDFs** - Puede optimizarse

**Recomendación**: 
- Priorizar consolidar tablas de usuarios si planeas agregar más tipos
- Eliminar campos deprecated gradualmente
- Optimizar almacenamiento de PDFs si la BD crece mucho

¿Quieres que implemente alguna de estas optimizaciones?

