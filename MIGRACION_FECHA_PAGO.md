# Migración: Agregar columna fecha_pago

La columna `fecha_pago` existe en el schema de Prisma pero falta en la base de datos.

## Solución Rápida

Ejecuta este SQL directamente en tu base de datos PostgreSQL:

```sql
ALTER TABLE checklist_servicios_externos 
ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP(6);
```

## Opciones para ejecutar:

### Opción 1: Usando psql
```bash
psql -U tu_usuario -d tu_base_de_datos -c "ALTER TABLE checklist_servicios_externos ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP(6);"
```

### Opción 2: Usando pgAdmin o DBeaver
1. Abre tu herramienta de administración de PostgreSQL
2. Conéctate a la base de datos
3. Ejecuta el SQL de arriba

### Opción 3: Desde Node.js (si tienes acceso)
```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$executeRaw\`ALTER TABLE checklist_servicios_externos ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP(6);\`.then(() => { console.log('✅ Columna agregada'); p.\$disconnect(); }).catch(e => { console.error('❌ Error:', e.message); p.\$disconnect(); });"
```

Una vez ejecutado el SQL, reinicia el servidor backend y el error debería desaparecer.

