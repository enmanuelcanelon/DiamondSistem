# 🐳 Guía de Instalación con Docker - DiamondSistem

## ¿Por qué Docker?

Docker simplifica la instalación porque:
- ✅ No necesitas instalar PostgreSQL manualmente
- ✅ No necesitas configurar Node.js
- ✅ No hay problemas de CORS
- ✅ Funciona igual en Windows, Mac y Linux
- ✅ Todo está aislado y no afecta tu sistema

---

## 📋 Paso 1: Instalar Docker Desktop

### En Mac:
1. Ve a: https://www.docker.com/products/docker-desktop/
2. Descarga "Docker Desktop for Mac"
3. Abre el archivo `.dmg` descargado
4. Arrastra Docker a la carpeta Aplicaciones
5. Abre Docker desde Aplicaciones
6. Espera a que aparezca el ícono de Docker en la barra superior (puede tardar 1-2 minutos la primera vez)
7. Verifica que está corriendo: deberías ver el ícono de Docker (ballena) en la barra superior

### En Windows:
1. Ve a: https://www.docker.com/products/docker-desktop/
2. Descarga "Docker Desktop for Windows"
3. Ejecuta el instalador
4. Reinicia la computadora cuando lo pida
5. Abre Docker Desktop desde el menú de inicio
6. Verifica que está corriendo: deberías ver el ícono de Docker en la bandeja del sistema

---

## 🚀 Paso 2: Verificar Docker

Abre una terminal y ejecuta:

```bash
docker --version
```

Deberías ver algo como: `Docker version 24.x.x`

Si ves un error, significa que Docker no está instalado o no está corriendo.

---

## 📁 Paso 3: Clonar el Repositorio (si no lo tienes)

```bash
git clone https://github.com/IamEac/DiamondSistem.git
cd DiamondSistem
```

---

## 🎯 Paso 4: Iniciar Todo con Docker

**IMPORTANTE:** La primera vez puede tardar 5-10 minutos porque descarga las imágenes.

```bash
docker-compose up --build
```

### ¿Qué está pasando?

Docker está:
1. ✅ Descargando PostgreSQL (primera vez)
2. ✅ Descargando Node.js (primera vez)
3. ✅ Instalando dependencias del backend
4. ✅ Instalando dependencias de los 5 frontends
5. ✅ Configurando la base de datos
6. ✅ Iniciando todos los servicios

### ¿Cuándo está listo?

Verás mensajes como:
```
backend    | ✅ Conexión a la base de datos establecida
backend    | 🚀 Servidor corriendo en: http://localhost:5000
frontend-vendedor | ➜  Local:   http://localhost:5173/
frontend-cliente  | ➜  Local:   http://localhost:5174/
...
```

**Cuando veas todos los servicios corriendo, está listo!** 🎉

---

## 🌐 Paso 5: Acceder a las Aplicaciones

Abre tu navegador y ve a:

- **Vendedor**: http://localhost:5173
- **Cliente**: http://localhost:5174
- **Manager**: http://localhost:5175
- **Gerente**: http://localhost:5176
- **Administrador**: http://localhost:5177
- **Backend API**: http://localhost:5000

---

## 🛠️ Comandos Útiles

### Iniciar en segundo plano (sin ver los logs)
```bash
docker-compose up -d
```

### Ver todos los logs
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend-vendedor
docker-compose logs -f frontend-administrador
```

### Detener todo
```bash
docker-compose down
```

### Detener y eliminar datos (empezar desde cero)
```bash
docker-compose down -v
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
docker-compose restart frontend-vendedor
docker-compose restart frontend-administrador
```

### Reiniciar todo
```bash
docker-compose restart
```

### Ver qué servicios están corriendo
```bash
docker-compose ps
```

### Ejecutar comandos dentro del backend
```bash
# Generar Prisma Client
docker-compose exec backend npx prisma generate

# Aplicar cambios de base de datos
docker-compose exec backend npx prisma db push

# Limpiar base de datos
docker-compose exec backend node scripts/limpiar_todo_completo.js

# Abrir shell del backend
docker-compose exec backend sh
```

---

## 🔧 Solución de Problemas

### Error: "Port already in use"

**Problema:** Algo está usando los puertos 5000, 5173, etc.

**Solución:**
```bash
# Detener todo
docker-compose down

# En Windows, encontrar qué usa el puerto:
netstat -ano | findstr :5000

# En Mac, encontrar qué usa el puerto:
lsof -ti:5000

# Matar el proceso (reemplaza PID con el número)
# Windows:
taskkill /PID [PID] /F

# Mac:
kill -9 [PID]
```

### Error: "Cannot connect to database"

**Problema:** PostgreSQL no está listo todavía.

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar solo PostgreSQL
docker-compose restart postgres

# Esperar 10-15 segundos y verificar
docker-compose ps
```

### Error: "Cannot find module"

**Problema:** Las dependencias no están instaladas.

**Solución:**
```bash
# Reconstruir todo desde cero
docker-compose down
docker-compose up --build
```

### Error: "CORS policy"

**Problema:** El backend no permite el origen del frontend.

**Solución:** Ya está configurado en `docker-compose.yml`. Si persiste:
```bash
# Reiniciar backend
docker-compose restart backend
```

### Error: "Prisma Client not generated"

**Problema:** Prisma Client no está generado.

**Solución:**
```bash
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

### Todo está muy lento

**Solución:**
- En Docker Desktop, ve a Settings → Resources
- Aumenta la memoria asignada (recomendado: 4GB mínimo)
- Aumenta los CPUs (recomendado: 2 mínimo)

### Reconstruir todo desde cero

```bash
# Detener y eliminar todo (incluyendo datos)
docker-compose down -v

# Eliminar imágenes
docker system prune -a

# Reconstruir todo
docker-compose up --build
```

---

## 📝 Notas Importantes

1. **Primera vez**: La primera vez puede tardar 5-10 minutos descargando imágenes
2. **Base de datos**: Los datos se guardan en un volumen de Docker (persisten aunque reinicies)
3. **Código**: Los cambios en el código se reflejan automáticamente (hot reload)
4. **Dependencias**: Si agregas nuevas dependencias en `package.json`, reinicia:
   ```bash
   docker-compose restart backend
   # o
   docker-compose restart frontend-vendedor
   ```
5. **Variables de entorno**: Están configuradas en `docker-compose.yml`, no necesitas `.env` local

---

## 🎯 Flujo de Trabajo Diario

### Iniciar el sistema:
```bash
cd DiamondSistem
docker-compose up
```

### Trabajar normalmente...
- Los cambios en el código se reflejan automáticamente
- Los logs aparecen en la terminal

### Al terminar:
```bash
# Presiona Ctrl+C para detener
# O en otra terminal:
docker-compose down
```

---

## 🔐 Credenciales

Son las mismas que en la instalación normal:

### Vendedor
```
Código: ADMIN001
Password: Admin123!
```

### Cliente
```
Código de Acceso: [Generado automáticamente al crear contrato]
```

### Manager
```
Código: MGR001
Password: [Configurado en base de datos]
```

### Gerente
```
Código: GER001
Password: [Configurado en base de datos]
```

### Administrador
```
Código: ADMIN001
Password: [Configurado en base de datos]
```

---

## 🎉 ¡Listo!

Con Docker, ya no necesitas:
- ❌ Instalar PostgreSQL
- ❌ Instalar Node.js
- ❌ Configurar variables de entorno
- ❌ Preocuparte por CORS
- ❌ Configurar la base de datos manualmente

**Todo funciona automáticamente!** 🚀

---

## 📞 Si Tienes Problemas

1. Verifica que Docker Desktop esté corriendo
2. Revisa los logs: `docker-compose logs -f`
3. Verifica que los puertos no estén ocupados
4. Intenta reconstruir: `docker-compose up --build`
5. Si nada funciona, elimina todo y empieza de nuevo:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

---

**¡Disfruta usando DiamondSistem con Docker! 🐳💎**

