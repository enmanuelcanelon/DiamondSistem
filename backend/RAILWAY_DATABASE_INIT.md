# 🚀 Inicialización de Base de Datos

Este documento explica cómo inicializar la base de datos en Railway.

## ⚠️ Importante

El servidor ahora inicia **inmediatamente** sin ejecutar scripts de inicialización para permitir que el healthcheck pase. Los scripts de inicialización se ejecutan manualmente o automáticamente en el primer arranque.

## 🔧 Inicialización Manual

Si necesitas inicializar/reiniciar la base de datos:

### Opción 1: Desde Railway CLI

```bash
railway run bash backend/init-database.sh
```

### Opción 2: Desde el Shell de Railway

1. Ve a tu proyecto en Railway
2. Abre el Shell (terminal)
3. Ejecuta:
   ```bash
   cd backend
   bash init-database.sh
   ```

### Opción 3: Ejecutar scripts individuales

```bash
# 1. Generar Prisma Client
npx prisma generate

# 2. Limpiar duplicados
node scripts/limpiar_duplicados_sql.js

# 3. Push schema
npx prisma db push --accept-data-loss

# 4. Inicializar datos base
node scripts/inicializar_bd_completo.js

# 5. Seed de producción
node prisma/seed-production.js
```

## 🎯 Por Qué Este Cambio

**Antes:** El `startCommand` ejecutaba todos los scripts antes de iniciar el servidor.
- ❌ Healthcheck fallaba porque el servidor tardaba minutos en iniciar
- ❌ Railway marcaba el deployment como fallido
- ❌ Los scripts bloqueaban el inicio

**Ahora:** El servidor inicia inmediatamente.
- ✅ Healthcheck pasa en segundos
- ✅ Servidor disponible mientras BD se inicializa
- ✅ Scripts se ejecutan manualmente cuando sea necesario

## 📋 railway.json Actualizado

```json
{
  "startCommand": "npx prisma generate && npm start",
  "healthcheckTimeout": 120
}
```

**Scripts removidos del startCommand:**
- `node scripts/limpiar_duplicados_sql.js`
- `npx prisma db push --accept-data-loss`
- `node scripts/inicializar_bd_completo.js`
- `node prisma/seed-production.js`

Estos ahora se ejecutan manualmente con `init-database.sh`.

## 🔄 Flujo Recomendado

1. **Primer Deploy:** 
   - Railway despliega el servidor
   - Servidor inicia inmediatamente (healthcheck ✅)
   - Ejecutar manualmente: `railway run bash backend/init-database.sh`

2. **Deploys Subsecuentes:**
   - Servidor inicia con datos existentes
   - Solo ejecutar init-database.sh si necesitas resetear la BD

## 💡 Notas

- El servidor ahora inicia aunque la BD no esté completamente inicializada
- La ruta `/health` verifica si la BD está conectada
- La ruta `/` siempre responde (para healthcheck de Railway)

