# 🗂️ GUÍA DE LIMPIEZA Y AUDITORÍA DE BASE DE DATOS

## 📋 Scripts Disponibles

1. **`limpiar_datos_prueba.sql`** - Elimina todos los datos de prueba (clientes, ofertas, contratos)
2. **`auditoria_base_datos.sql`** - Audita la estructura completa de la BD
3. **`limpiar_elementos_no_usados.sql`** - Elimina elementos obsoletos (columnas, servicios, etc.)

---

## 🚀 PASO 1: LIMPIAR DATOS DE PRUEBA

### Propósito
Eliminar todos los clientes, ofertas y contratos de prueba manteniendo la estructura de la BD intacta.

### Cómo ejecutar

```bash
# En PowerShell (Windows)
psql -U postgres -d diamondsistem -f "C:/Users/eac/Desktop/DiamondSistem/database/limpiar_datos_prueba.sql"
```

```bash
# O en el shell de psql
\c diamondsistem
\i 'C:/Users/eac/Desktop/DiamondSistem/database/limpiar_datos_prueba.sql'
```

### Qué hace
1. ✅ Muestra resumen de datos ANTES de limpiar
2. ✅ Elimina datos en el orden correcto (respetando claves foráneas):
   - Versiones de contratos PDF
   - Ajustes de eventos
   - Playlists
   - Asignaciones de mesas
   - Solicitudes de clientes
   - Mensajes
   - Pagos
   - Servicios de contratos
   - Contratos
   - Servicios de ofertas
   - Ofertas
   - Clientes
3. ✅ Reinicia los contadores (IDs empezarán desde 1)
4. ✅ Muestra resumen DESPUÉS de limpiar
5. ✅ Verifica que no haya datos huérfanos

### Resultado esperado
```sql
✅ LIMPIEZA COMPLETADA EXITOSAMENTE
La base de datos está lista para nuevas pruebas
```

### ⚠️ IMPORTANTE
- **TODOS** los clientes, ofertas y contratos se eliminarán
- Los vendedores, paquetes, servicios, salones y temporadas **NO** se eliminan
- La estructura de la BD se mantiene intacta
- Este proceso **NO se puede deshacer** (a menos que tengas un backup)

---

## 🔍 PASO 2: AUDITAR LA BASE DE DATOS

### Propósito
Verificar la estructura completa de la BD e identificar elementos no utilizados.

### Cómo ejecutar

```bash
# En PowerShell
psql -U postgres -d diamondsistem -f "C:/Users/eac/Desktop/DiamondSistem/database/auditoria_base_datos.sql"
```

```bash
# O en el shell de psql
\i 'C:/Users/eac/Desktop/DiamondSistem/database/auditoria_base_datos.sql'
```

### Qué verifica

#### 1. **Resumen General**
- Lista de todas las tablas con su tamaño
- Total de registros por tabla

#### 2. **Relaciones y Claves Foráneas**
- Todas las relaciones entre tablas
- Restricciones de integridad referencial

#### 3. **Índices**
- Todos los índices creados
- Ayuda a identificar índices faltantes o duplicados

#### 4. **Columnas No Usadas**
- Columnas que siempre tienen valores NULL
- Candidatas para eliminación

#### 5. **Triggers**
- Triggers activos en la BD
- Verifica que estén funcionando correctamente

#### 6. **Vistas**
- Vistas SQL creadas
- Definición de cada vista

#### 7. **Funciones y Procedimientos**
- Funciones almacenadas en la BD
- Triggers y procedimientos personalizados

#### 8. **Servicios No Usados**
- Servicios que no están en ningún paquete
- Servicios que nunca se han vendido

#### 9. **Paquetes No Usados**
- Paquetes que no se han usado en ofertas/contratos

#### 10. **Temporadas No Usadas**
- Temporadas que no se han usado

#### 11. **Integridad Referencial**
- Detecta registros huérfanos
- Verifica consistencia de datos

### Resultado esperado
Un reporte completo con toda la información de la BD.

### 📊 Qué revisar

**Busca estas secciones:**

1. **COLUMNAS QUE PODRÍAN NO ESTAR EN USO**
   - Si una columna tiene 100% NULL, probablemente no se usa

2. **SERVICIOS QUE NO SE USAN**
   - Si un servicio tiene 0 en todos los campos, quizá no es necesario

3. **VERIFICACIÓN DE INTEGRIDAD**
   - Cualquier número > 0 indica un problema de integridad

---

## 🗑️ PASO 3: ELIMINAR ELEMENTOS NO USADOS (OPCIONAL)

### Propósito
Eliminar columnas, servicios, paquetes o temporadas obsoletas identificadas en la auditoría.

### ⚠️ **MUY IMPORTANTE**
- **SOLO ejecuta este script DESPUÉS de revisar la auditoría**
- Algunos comandos están comentados por seguridad
- Descomentar solo lo que estés 100% seguro de eliminar

### Cómo ejecutar

```bash
# En PowerShell
psql -U postgres -d diamondsistem -f "C:/Users/eac/Desktop/DiamondSistem/database/limpiar_elementos_no_usados.sql"
```

### Qué hace (por defecto)

1. **Elimina columnas obsoletas:**
   - `clientes.opciones_vegetarianas` (movida a ajustes_evento)
   - `clientes.opciones_veganas` (movida a ajustes_evento)
   - `clientes.restricciones_alimentarias` (movida a ajustes_evento)
   - `ajustes_evento.opciones_vegetarianas` (consolidada en restricciones_alimentarias)
   - `ajustes_evento.opciones_veganas` (consolidada en restricciones_alimentarias)
   - `ajustes_evento.bebidas_incluidas` (no se usa)
   - `ajustes_evento.tamano_torta` (reemplazada por pisos_torta)
   - `ajustes_evento.tipo_relleno` (eliminada del formulario)

### 🔓 Descomenta para eliminar (con precaución)

- **Servicios no usados**: Solo si nunca se han vendido
- **Paquetes no usados**: Solo si nunca se han ofrecido
- **Temporadas obsoletas**: Solo si ya pasaron y no se usaron

### Después de ejecutar

Si eliminaste columnas, **DEBES** regenerar Prisma:

```bash
cd C:\Users\eac\Desktop\DiamondSistem\backend

# Detener el servidor primero (Ctrl+C)

# Sincronizar el schema con la BD
npx prisma db pull

# Regenerar el cliente de Prisma
npx prisma generate

# Reiniciar el servidor
npm run dev
```

---

## 🔄 ORDEN RECOMENDADO DE EJECUCIÓN

### Para limpiar datos de prueba y empezar de nuevo:

```bash
# 1. Limpiar todos los datos de prueba
\i 'C:/Users/eac/Desktop/DiamondSistem/database/limpiar_datos_prueba.sql'

# 2. Verificar que todo está limpio
\i 'C:/Users/eac/Desktop/DiamondSistem/database/auditoria_base_datos.sql'

# 3. (Opcional) Eliminar elementos no usados
\i 'C:/Users/eac/Desktop/DiamondSistem/database/limpiar_elementos_no_usados.sql'
```

---

## 📝 COMANDOS ÚTILES ADICIONALES

### Ver tamaño de la base de datos
```sql
SELECT 
    pg_size_pretty(pg_database_size('diamondsistem')) AS tamaño_bd;
```

### Ver todas las tablas y sus registros
```sql
SELECT 
    schemaname, 
    tablename, 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamaño
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Verificar secuencias (contadores)
```sql
SELECT 
    sequencename, 
    last_value 
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;
```

### Verificar espacio en disco
```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('clientes')) AS tamaño_clientes,
    pg_size_pretty(pg_total_relation_size('contratos')) AS tamaño_contratos,
    pg_size_pretty(pg_total_relation_size('ofertas')) AS tamaño_ofertas;
```

### Backup antes de limpiar (recomendado)
```bash
# En PowerShell, crear backup
pg_dump -U postgres -d diamondsistem -f "C:/Users/eac/Desktop/backup_antes_limpiar.sql"

# Para restaurar si algo sale mal
psql -U postgres -d diamondsistem -f "C:/Users/eac/Desktop/backup_antes_limpiar.sql"
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de la limpieza, verifica:

- [ ] Todas las tablas de datos están vacías (clientes, ofertas, contratos)
- [ ] Las tablas maestras están intactas (vendedores, paquetes, servicios, salones, temporadas)
- [ ] Los contadores (secuencias) empiezan desde 1
- [ ] No hay registros huérfanos
- [ ] La estructura de la BD está intacta
- [ ] El Prisma Client está actualizado (si eliminaste columnas)
- [ ] El backend arranca sin errores
- [ ] El frontend carga correctamente

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "relation does not exist"
- Verifica que estás conectado a la BD correcta: `\c diamondsistem`
- Verifica el esquema: `\dn`

### Error: "permission denied"
- Asegúrate de estar conectado como `postgres`
- Usa: `psql -U postgres -d diamondsistem`

### Error en Prisma después de eliminar columnas
```bash
# Solución:
cd backend
npx prisma db pull
npx prisma generate
```

### Backend no arranca después de cambios
- Verifica los logs del backend
- Asegúrate de que Prisma esté actualizado
- Reinicia el servidor: `npm run dev`

---

## 📞 NOTAS FINALES

- **Haz backup** antes de ejecutar cualquier script de limpieza
- **Revisa la auditoría** antes de eliminar elementos
- **Prueba en desarrollo** antes de aplicar en producción
- **Documenta** cualquier cambio que hagas

---

**Última actualización:** 4 de noviembre de 2025

