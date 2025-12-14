# 🧪 Guía de Prueba - Optimizaciones Implementadas

## 📋 Pasos para Probar las Optimizaciones

### 1. Verificar Usuario de PostgreSQL

Primero, verifica cuál es tu usuario de PostgreSQL:

**Opción A: Desde psql**
```bash
psql -U postgres
# O si tienes otro usuario:
psql -U tu_usuario
```

**Opción B: Desde el script de prueba**
```bash
cd backend
node scripts/probar-optimizaciones.js
```

---

### 2. Actualizar el archivo `.env`

Abre `backend/.env` y verifica/actualiza el `DATABASE_URL`:

**Si tu usuario es `postgres` (estándar):**
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

**Si tu usuario es diferente (ej: `usuario`):**
```env
DATABASE_URL="postgresql://usuario:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

**⚠️ IMPORTANTE:**
- Reemplaza `root` por tu contraseña real de PostgreSQL
- El usuario más común es `postgres` (estándar de PostgreSQL)

---

### 3. Ejecutar Script de Prueba

```bash
cd backend
node scripts/probar-optimizaciones.js
```

**✅ Deberías ver:**
```
🧪 ============================================
🧪 PRUEBA DE OPTIMIZACIONES - DiamondSistem
🧪 ============================================

1️⃣ Verificando conexión a la base de datos...
   ✅ Conexión establecida correctamente

2️⃣ Verificando configuración del pool de conexiones...
   ✅ Pool de conexiones configurado correctamente
   📊 Parámetros encontrados:
      - connection_limit: 10
      - pool_timeout: 20 segundos

3️⃣ Verificando usuario de PostgreSQL...
   📝 Usuario detectado: postgres
   ✅ Usuario correcto (postgres es el estándar)

4️⃣ Probando rendimiento de queries...
   ✅ Query completada en 45ms
   📊 Vendedores encontrados: 3
   ✅ Query rápida (optimización funcionando)

5️⃣ Verificando conexiones activas en PostgreSQL...
   📊 Conexiones activas: 1
   ✅ Número de conexiones dentro del límite (≤10)

📋 ============================================
📋 RESUMEN DE PRUEBAS
📋 ============================================
✅ Conexión a base de datos: OK
✅ Pool de conexiones: Configurado
✅ Rendimiento de queries: Óptimo

✨ Pruebas completadas exitosamente
```

---

### 4. Probar en el Frontend (StaleTime)

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Inicia el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Abre el navegador:**
   - Ve a `http://localhost:5173`
   - Abre DevTools (F12) → Pestaña **Network**

4. **Prueba de navegación:**
   - Entra a "Ofertas" → Observa la petición en Network
   - Ve a "Contratos" → Observa otra petición
   - **Vuelve a "Ofertas"** → **NO debería haber nueva petición** (usa caché)

5. **Espera 5 minutos y vuelve a "Ofertas":**
   - Ahora SÍ debería hacer nueva petición (datos "viejos")

---

### 5. Verificar Pool de Conexiones en Tiempo Real

**Desde PostgreSQL:**
```sql
-- Conectarse a PostgreSQL
psql -U postgres -d diamondsistem

-- Ver conexiones activas
SELECT 
    count(*) as total_conexiones,
    state,
    datname
FROM pg_stat_activity 
WHERE datname = 'diamondsistem'
GROUP BY state, datname;

-- Ver todas las conexiones
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE datname = 'diamondsistem';
```

**Resultado esperado:**
- Máximo 10 conexiones activas (según `connection_limit=10`)
- La mayoría en estado `idle` (esperando)
- Solo 1-2 en estado `active` (ejecutando queries)

---

## 🔍 Verificación de Problemas Comunes

### ❌ Error: "password authentication failed"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
1. Verifica tu usuario de PostgreSQL:
   ```bash
   psql -U postgres -l
   ```
2. Actualiza el `.env` con el usuario y contraseña correctos

---

### ❌ Error: "database does not exist"

**Causa:** La base de datos `diamondsistem` no existe

**Solución:**
```sql
CREATE DATABASE diamondsistem;
```

---

### ⚠️ Advertencia: "Pool de conexiones no configurado"

**Causa:** El `DATABASE_URL` no tiene los parámetros del pool

**Solución:**
Agrega `&connection_limit=10&pool_timeout=20` al final de tu `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

---

### ⚠️ Query lenta (>1 segundo)

**Causa:** Falta de índices o query compleja

**Solución:**
1. Revisa los logs del backend para ver qué query es lenta
2. Verifica que los índices estén creados:
   ```sql
   \d+ contratos  -- Ver índices de la tabla contratos
   ```
3. Si falta un índice, créalo o ejecuta `npx prisma db push`

---

## ✅ Checklist de Verificación

- [ ] Script de prueba ejecutado sin errores
- [ ] Pool de conexiones configurado (`connection_limit` y `pool_timeout` presentes)
- [ ] Usuario de PostgreSQL correcto (preferiblemente `postgres`)
- [ ] Queries rápidas (< 1 segundo)
- [ ] Frontend usa caché (no hace peticiones innecesarias)
- [ ] Conexiones activas ≤ 10

---

## 📊 Métricas Esperadas

| Métrica | Valor Esperado | Estado |
|---------|----------------|--------|
| Tiempo de query simple | < 100ms | ✅ |
| Conexiones activas máximas | ≤ 10 | ✅ |
| Peticiones duplicadas (frontend) | 0 (con caché) | ✅ |
| Queries lentas detectadas | 0 | ✅ |

---

## 🎯 Próximos Pasos

Si todas las pruebas pasan:
1. ✅ Optimizaciones funcionando correctamente
2. ✅ Sistema listo para producción
3. ✅ Puedes continuar con el desarrollo

Si hay problemas:
1. Revisa los errores específicos
2. Consulta la sección "Verificación de Problemas Comunes"
3. Ejecuta el script de prueba nuevamente después de corregir

---

**✨ ¡Listo para probar!**


## 📋 Pasos para Probar las Optimizaciones

### 1. Verificar Usuario de PostgreSQL

Primero, verifica cuál es tu usuario de PostgreSQL:

**Opción A: Desde psql**
```bash
psql -U postgres
# O si tienes otro usuario:
psql -U tu_usuario
```

**Opción B: Desde el script de prueba**
```bash
cd backend
node scripts/probar-optimizaciones.js
```

---

### 2. Actualizar el archivo `.env`

Abre `backend/.env` y verifica/actualiza el `DATABASE_URL`:

**Si tu usuario es `postgres` (estándar):**
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

**Si tu usuario es diferente (ej: `usuario`):**
```env
DATABASE_URL="postgresql://usuario:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

**⚠️ IMPORTANTE:**
- Reemplaza `root` por tu contraseña real de PostgreSQL
- El usuario más común es `postgres` (estándar de PostgreSQL)

---

### 3. Ejecutar Script de Prueba

```bash
cd backend
node scripts/probar-optimizaciones.js
```

**✅ Deberías ver:**
```
🧪 ============================================
🧪 PRUEBA DE OPTIMIZACIONES - DiamondSistem
🧪 ============================================

1️⃣ Verificando conexión a la base de datos...
   ✅ Conexión establecida correctamente

2️⃣ Verificando configuración del pool de conexiones...
   ✅ Pool de conexiones configurado correctamente
   📊 Parámetros encontrados:
      - connection_limit: 10
      - pool_timeout: 20 segundos

3️⃣ Verificando usuario de PostgreSQL...
   📝 Usuario detectado: postgres
   ✅ Usuario correcto (postgres es el estándar)

4️⃣ Probando rendimiento de queries...
   ✅ Query completada en 45ms
   📊 Vendedores encontrados: 3
   ✅ Query rápida (optimización funcionando)

5️⃣ Verificando conexiones activas en PostgreSQL...
   📊 Conexiones activas: 1
   ✅ Número de conexiones dentro del límite (≤10)

📋 ============================================
📋 RESUMEN DE PRUEBAS
📋 ============================================
✅ Conexión a base de datos: OK
✅ Pool de conexiones: Configurado
✅ Rendimiento de queries: Óptimo

✨ Pruebas completadas exitosamente
```

---

### 4. Probar en el Frontend (StaleTime)

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Inicia el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Abre el navegador:**
   - Ve a `http://localhost:5173`
   - Abre DevTools (F12) → Pestaña **Network**

4. **Prueba de navegación:**
   - Entra a "Ofertas" → Observa la petición en Network
   - Ve a "Contratos" → Observa otra petición
   - **Vuelve a "Ofertas"** → **NO debería haber nueva petición** (usa caché)

5. **Espera 5 minutos y vuelve a "Ofertas":**
   - Ahora SÍ debería hacer nueva petición (datos "viejos")

---

### 5. Verificar Pool de Conexiones en Tiempo Real

**Desde PostgreSQL:**
```sql
-- Conectarse a PostgreSQL
psql -U postgres -d diamondsistem

-- Ver conexiones activas
SELECT 
    count(*) as total_conexiones,
    state,
    datname
FROM pg_stat_activity 
WHERE datname = 'diamondsistem'
GROUP BY state, datname;

-- Ver todas las conexiones
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE datname = 'diamondsistem';
```

**Resultado esperado:**
- Máximo 10 conexiones activas (según `connection_limit=10`)
- La mayoría en estado `idle` (esperando)
- Solo 1-2 en estado `active` (ejecutando queries)

---

## 🔍 Verificación de Problemas Comunes

### ❌ Error: "password authentication failed"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
1. Verifica tu usuario de PostgreSQL:
   ```bash
   psql -U postgres -l
   ```
2. Actualiza el `.env` con el usuario y contraseña correctos

---

### ❌ Error: "database does not exist"

**Causa:** La base de datos `diamondsistem` no existe

**Solución:**
```sql
CREATE DATABASE diamondsistem;
```

---

### ⚠️ Advertencia: "Pool de conexiones no configurado"

**Causa:** El `DATABASE_URL` no tiene los parámetros del pool

**Solución:**
Agrega `&connection_limit=10&pool_timeout=20` al final de tu `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

---

### ⚠️ Query lenta (>1 segundo)

**Causa:** Falta de índices o query compleja

**Solución:**
1. Revisa los logs del backend para ver qué query es lenta
2. Verifica que los índices estén creados:
   ```sql
   \d+ contratos  -- Ver índices de la tabla contratos
   ```
3. Si falta un índice, créalo o ejecuta `npx prisma db push`

---

## ✅ Checklist de Verificación

- [ ] Script de prueba ejecutado sin errores
- [ ] Pool de conexiones configurado (`connection_limit` y `pool_timeout` presentes)
- [ ] Usuario de PostgreSQL correcto (preferiblemente `postgres`)
- [ ] Queries rápidas (< 1 segundo)
- [ ] Frontend usa caché (no hace peticiones innecesarias)
- [ ] Conexiones activas ≤ 10

---

## 📊 Métricas Esperadas

| Métrica | Valor Esperado | Estado |
|---------|----------------|--------|
| Tiempo de query simple | < 100ms | ✅ |
| Conexiones activas máximas | ≤ 10 | ✅ |
| Peticiones duplicadas (frontend) | 0 (con caché) | ✅ |
| Queries lentas detectadas | 0 | ✅ |

---

## 🎯 Próximos Pasos

Si todas las pruebas pasan:
1. ✅ Optimizaciones funcionando correctamente
2. ✅ Sistema listo para producción
3. ✅ Puedes continuar con el desarrollo

Si hay problemas:
1. Revisa los errores específicos
2. Consulta la sección "Verificación de Problemas Comunes"
3. Ejecuta el script de prueba nuevamente después de corregir

---

**✨ ¡Listo para probar!**


## 📋 Pasos para Probar las Optimizaciones

### 1. Verificar Usuario de PostgreSQL

Primero, verifica cuál es tu usuario de PostgreSQL:

**Opción A: Desde psql**
```bash
psql -U postgres
# O si tienes otro usuario:
psql -U tu_usuario
```

**Opción B: Desde el script de prueba**
```bash
cd backend
node scripts/probar-optimizaciones.js
```

---

### 2. Actualizar el archivo `.env`

Abre `backend/.env` y verifica/actualiza el `DATABASE_URL`:

**Si tu usuario es `postgres` (estándar):**
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

**Si tu usuario es diferente (ej: `usuario`):**
```env
DATABASE_URL="postgresql://usuario:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

**⚠️ IMPORTANTE:**
- Reemplaza `root` por tu contraseña real de PostgreSQL
- El usuario más común es `postgres` (estándar de PostgreSQL)

---

### 3. Ejecutar Script de Prueba

```bash
cd backend
node scripts/probar-optimizaciones.js
```

**✅ Deberías ver:**
```
🧪 ============================================
🧪 PRUEBA DE OPTIMIZACIONES - DiamondSistem
🧪 ============================================

1️⃣ Verificando conexión a la base de datos...
   ✅ Conexión establecida correctamente

2️⃣ Verificando configuración del pool de conexiones...
   ✅ Pool de conexiones configurado correctamente
   📊 Parámetros encontrados:
      - connection_limit: 10
      - pool_timeout: 20 segundos

3️⃣ Verificando usuario de PostgreSQL...
   📝 Usuario detectado: postgres
   ✅ Usuario correcto (postgres es el estándar)

4️⃣ Probando rendimiento de queries...
   ✅ Query completada en 45ms
   📊 Vendedores encontrados: 3
   ✅ Query rápida (optimización funcionando)

5️⃣ Verificando conexiones activas en PostgreSQL...
   📊 Conexiones activas: 1
   ✅ Número de conexiones dentro del límite (≤10)

📋 ============================================
📋 RESUMEN DE PRUEBAS
📋 ============================================
✅ Conexión a base de datos: OK
✅ Pool de conexiones: Configurado
✅ Rendimiento de queries: Óptimo

✨ Pruebas completadas exitosamente
```

---

### 4. Probar en el Frontend (StaleTime)

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Inicia el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Abre el navegador:**
   - Ve a `http://localhost:5173`
   - Abre DevTools (F12) → Pestaña **Network**

4. **Prueba de navegación:**
   - Entra a "Ofertas" → Observa la petición en Network
   - Ve a "Contratos" → Observa otra petición
   - **Vuelve a "Ofertas"** → **NO debería haber nueva petición** (usa caché)

5. **Espera 5 minutos y vuelve a "Ofertas":**
   - Ahora SÍ debería hacer nueva petición (datos "viejos")

---

### 5. Verificar Pool de Conexiones en Tiempo Real

**Desde PostgreSQL:**
```sql
-- Conectarse a PostgreSQL
psql -U postgres -d diamondsistem

-- Ver conexiones activas
SELECT 
    count(*) as total_conexiones,
    state,
    datname
FROM pg_stat_activity 
WHERE datname = 'diamondsistem'
GROUP BY state, datname;

-- Ver todas las conexiones
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE datname = 'diamondsistem';
```

**Resultado esperado:**
- Máximo 10 conexiones activas (según `connection_limit=10`)
- La mayoría en estado `idle` (esperando)
- Solo 1-2 en estado `active` (ejecutando queries)

---

## 🔍 Verificación de Problemas Comunes

### ❌ Error: "password authentication failed"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
1. Verifica tu usuario de PostgreSQL:
   ```bash
   psql -U postgres -l
   ```
2. Actualiza el `.env` con el usuario y contraseña correctos

---

### ❌ Error: "database does not exist"

**Causa:** La base de datos `diamondsistem` no existe

**Solución:**
```sql
CREATE DATABASE diamondsistem;
```

---

### ⚠️ Advertencia: "Pool de conexiones no configurado"

**Causa:** El `DATABASE_URL` no tiene los parámetros del pool

**Solución:**
Agrega `&connection_limit=10&pool_timeout=20` al final de tu `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/diamondsistem?schema=public&connection_limit=10&pool_timeout=20"
```

---

### ⚠️ Query lenta (>1 segundo)

**Causa:** Falta de índices o query compleja

**Solución:**
1. Revisa los logs del backend para ver qué query es lenta
2. Verifica que los índices estén creados:
   ```sql
   \d+ contratos  -- Ver índices de la tabla contratos
   ```
3. Si falta un índice, créalo o ejecuta `npx prisma db push`

---

## ✅ Checklist de Verificación

- [ ] Script de prueba ejecutado sin errores
- [ ] Pool de conexiones configurado (`connection_limit` y `pool_timeout` presentes)
- [ ] Usuario de PostgreSQL correcto (preferiblemente `postgres`)
- [ ] Queries rápidas (< 1 segundo)
- [ ] Frontend usa caché (no hace peticiones innecesarias)
- [ ] Conexiones activas ≤ 10

---

## 📊 Métricas Esperadas

| Métrica | Valor Esperado | Estado |
|---------|----------------|--------|
| Tiempo de query simple | < 100ms | ✅ |
| Conexiones activas máximas | ≤ 10 | ✅ |
| Peticiones duplicadas (frontend) | 0 (con caché) | ✅ |
| Queries lentas detectadas | 0 | ✅ |

---

## 🎯 Próximos Pasos

Si todas las pruebas pasan:
1. ✅ Optimizaciones funcionando correctamente
2. ✅ Sistema listo para producción
3. ✅ Puedes continuar con el desarrollo

Si hay problemas:
1. Revisa los errores específicos
2. Consulta la sección "Verificación de Problemas Comunes"
3. Ejecuta el script de prueba nuevamente después de corregir

---

**✨ ¡Listo para probar!**













