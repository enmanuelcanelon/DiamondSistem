# 🗄️ Guía de Configuración con Supabase - DiamondSistem

## ¿Por qué Supabase?

Supabase te permite:
- ✅ Trabajar desde cualquier lugar con internet
- ✅ Misma base de datos en todos tus ordenadores
- ✅ Backups automáticos
- ✅ Panel de administración web
- ✅ Gratis hasta cierto límite

---

## 📋 Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea una cuenta (gratis)
3. Click en "New Project"
4. Configura:
   - **Project Name**: `diamondsistem`
   - **Database Password**: `[Elige una contraseña segura]`
   - **Region**: `[La más cercana a ti]`
   - **Plan**: `Free`
5. Espera 2-3 minutos mientras se crea el proyecto

---

## 🔗 Paso 2: Obtener Connection String

1. En tu proyecto de Supabase, ve a **Settings** → **Database**
2. Busca la sección **Connection string**
3. Selecciona **URI** (no "Connection pooling")
4. Copia la URL completa

Se verá así:
```
postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

---

## ⚙️ Paso 3: Configurar Backend

1. Edita `backend/.env`
2. Reemplaza la línea `DATABASE_URL` con tu connection string de Supabase:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres?connection_limit=10&pool_timeout=20"
```

**Importante:** Agrega `?connection_limit=10&pool_timeout=20` al final para optimizar las conexiones.

---

## 🗃️ Paso 4: Aplicar Esquema y Datos Iniciales

Desde la carpeta `backend`, ejecuta:

```bash
# Generar Prisma Client
npx prisma generate

# Crear todas las tablas en Supabase
npx prisma db push

# Cargar datos iniciales (paquetes, servicios, temporadas, etc.)
node scripts/ejecutar_seeds.js
```

**Nota:** La primera vez puede tardar 1-2 minutos porque está creando todas las tablas.

---

## ✅ Paso 5: Verificar que Funciona

1. Inicia el backend:
```bash
cd backend
npm run dev
```

2. Deberías ver:
```
✅ Conexión a la base de datos establecida
🚀 Servidor corriendo en: http://localhost:5000
```

3. Prueba hacer login en el frontend con:
   - Código: `ADMIN001`
   - Password: `Admin123!`

---

## 🔄 Usar en Otro Ordenador

Cuando quieras usar el proyecto en otro ordenador:

1. Clona el repositorio:
```bash
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

2. Configura el backend:
```bash
cd backend
npm install
copy env.example .env
```

3. Edita `backend/.env` y pon la misma `DATABASE_URL` de Supabase:
```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres?connection_limit=10&pool_timeout=20"
```

4. Genera Prisma Client:
```bash
npx prisma generate
```

5. ¡Listo! Ya puedes usar la misma base de datos desde cualquier ordenador.

---

## 🔐 Seguridad

### Proteger tu Connection String

- ✅ **NUNCA** subas el archivo `.env` a GitHub (ya está en `.gitignore`)
- ✅ **NUNCA** compartas tu contraseña de Supabase
- ✅ Si alguien más necesita acceso, créale un usuario separado en Supabase

### Cambiar Contraseña

Si necesitas cambiar la contraseña de Supabase:
1. Ve a Settings → Database
2. Click en "Reset database password"
3. Actualiza `DATABASE_URL` en `backend/.env` con la nueva contraseña

---

## 📊 Ver Datos en Supabase

1. Ve a tu proyecto en https://supabase.com
2. Click en **Table Editor** en el menú lateral
3. Verás todas las tablas y puedes ver/editar datos directamente

---

## 🚨 Solución de Problemas

### Error: "Connection refused"
- Verifica que tu contraseña en `.env` sea correcta
- Verifica que la URL de Supabase sea correcta
- Asegúrate de tener conexión a internet

### Error: "Too many connections"
- Reduce `connection_limit` en `DATABASE_URL` (ej: `connection_limit=5`)
- El plan gratuito de Supabase tiene límites

### Error: "relation does not exist"
- Ejecuta `npx prisma db push` para crear las tablas
- Verifica que el esquema de Prisma esté actualizado

### Los datos no aparecen
- Verifica que ejecutaste `node scripts/ejecutar_seeds.js`
- Revisa en Supabase → Table Editor si los datos están ahí

---

## 💡 Ventajas de Supabase vs Local

| Característica | PostgreSQL Local | Supabase |
|----------------|------------------|----------|
| Acceso desde cualquier lugar | ❌ Solo en red local | ✅ Desde cualquier lugar |
| Backups automáticos | ❌ Manual | ✅ Automáticos |
| Panel web | ❌ No | ✅ Sí |
| Múltiples ordenadores | ❌ Complejo | ✅ Fácil |
| Requiere servidor siempre encendido | ✅ Sí | ❌ No |
| Gratis | ✅ Sí | ✅ Sí (con límites) |

---

## 📝 Notas Importantes

1. **Plan Gratuito de Supabase:**
   - 500 MB de base de datos
   - 2 GB de transferencia/mes
   - Suficiente para desarrollo y pruebas pequeñas

2. **Si necesitas más:**
   - Puedes actualizar a un plan de pago
   - O usar otro servicio (Railway, Render, Neon)

3. **Backend sigue siendo local:**
   - El backend corre en tu ordenador (`localhost:5000`)
   - Solo la base de datos está en Supabase
   - Si quieres que el backend también sea accesible desde otros lugares, necesitas desplegarlo (Railway, Render, etc.)

---

## 🎉 ¡Listo!

Ahora puedes trabajar desde cualquier ordenador y todos usarán la misma base de datos en Supabase.

**Recuerda:** Guarda tu connection string en un lugar seguro (password manager) para poder configurarlo en otros ordenadores.

