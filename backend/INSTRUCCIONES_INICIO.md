# 🚀 INSTRUCCIONES PARA INICIAR EL SERVIDOR

## ✅ Pre-requisitos Completados

- ✅ Base de datos PostgreSQL creada (`diamondsistem`)
- ✅ Esquema y datos cargados correctamente
- ✅ Dependencias de npm instaladas

---

## 📝 PASO 1: Configurar el archivo .env

### 1. Copiar el archivo de ejemplo

Abre PowerShell en la carpeta `backend` y ejecuta:

```powershell
cd C:\Users\eac\Desktop\DiamondSistem\backend
Copy-Item env.example .env
```

### 2. Editar el archivo .env

Abre el archivo `.env` con tu editor favorito y **MODIFICA LA CONTRASEÑA**:

```env
# Puerto del servidor
PORT=5000

# Base de datos PostgreSQL
# ⚠️ CAMBIAR 'TU_CONTRASEÑA' POR TU CONTRASEÑA REAL DE POSTGRESQL
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/diamondsistem?schema=public"

# JWT Secret (puedes dejarlo así)
JWT_SECRET=diamondsistem_secreto_super_seguro_2025

# JWT Expiration
JWT_EXPIRES_IN=7d

# Bcrypt Salt Rounds
BCRYPT_SALT_ROUNDS=10

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Entorno
NODE_ENV=development

# Configuración de la aplicación
APP_NAME=DiamondSistem
APP_VERSION=1.0.0

# URL del frontend
FRONTEND_URL=http://localhost:5173

# Logs
LOG_LEVEL=debug
```

**⚠️ IMPORTANTE:** Cambia `TU_CONTRASEÑA` por tu contraseña real de PostgreSQL.

Por ejemplo, si tu contraseña es `12345`:
```env
DATABASE_URL="postgresql://postgres:12345@localhost:5432/diamondsistem?schema=public"
```

---

## 🚀 PASO 2: Iniciar el Servidor

En PowerShell (en la carpeta `backend`), ejecuta:

```powershell
npm run dev
```

### ✅ Deberías ver:

```
✅ Conexión a la base de datos establecida

🚀 ============================================
   DiamondSistem API v1.0.0
   ============================================
   🌐 Servidor corriendo en: http://localhost:5000
   📊 Health check: http://localhost:5000/health
   📚 API Docs: http://localhost:5000/
   🔧 Entorno: development
   ============================================
```

---

## 🧪 PASO 3: Probar que Funciona

### Opción 1: En el navegador

Abre tu navegador y ve a:

1. **http://localhost:5000** 
   - Verás un JSON con la lista de endpoints

2. **http://localhost:5000/health**
   - Deberías ver: `{"status":"healthy","database":"connected",...}`

### Opción 2: Con PowerShell (probar login)

```powershell
$body = @{
    codigo_vendedor = "ADMIN001"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login/vendedor" -Method POST -Body $body -ContentType "application/json"
```

Deberías recibir un token JWT y los datos del vendedor.

---

## 📚 ENDPOINTS DISPONIBLES

### Autenticación
- `POST /api/auth/login/vendedor` - Login de vendedor
- `POST /api/auth/login/cliente` - Login de cliente
- `POST /api/auth/register/vendedor` - Registrar vendedor
- `GET /api/auth/me` - Usuario actual

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/:id` - Ver cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Paquetes
- `GET /api/paquetes` - Listar paquetes
- `GET /api/paquetes/:id` - Ver paquete
- `GET /api/paquetes/:id/servicios` - Servicios del paquete

### Servicios
- `GET /api/servicios` - Listar servicios
- `GET /api/servicios/categorias/list` - Lista de categorías
- `GET /api/servicios/categoria/:categoria` - Por categoría

### Temporadas
- `GET /api/temporadas` - Listar temporadas
- `GET /api/temporadas/fecha/:fecha` - Por fecha

### Ofertas
- `POST /api/ofertas/calcular` - Calcular precio (preview)
- `POST /api/ofertas` - Crear oferta
- `GET /api/ofertas` - Listar ofertas
- `GET /api/ofertas/:id` - Ver oferta
- `PUT /api/ofertas/:id/aceptar` - Aceptar oferta
- `PUT /api/ofertas/:id/rechazar` - Rechazar oferta

### Contratos
- `POST /api/contratos` - Crear contrato (desde oferta)
- `GET /api/contratos` - Listar contratos
- `GET /api/contratos/:id` - Ver contrato
- `GET /api/contratos/:id/pagos` - Pagos del contrato
- `GET /api/contratos/:id/servicios` - Servicios del contrato

### Pagos
- `POST /api/pagos` - Registrar pago
- `GET /api/pagos` - Listar pagos
- `GET /api/pagos/contrato/:id` - Pagos de un contrato

### Eventos
- `GET /api/eventos` - Listar eventos
- `GET /api/eventos/:id` - Ver evento
- `PUT /api/eventos/:id` - Actualizar detalles

### Solicitudes
- `GET /api/solicitudes/pendientes` - Solicitudes pendientes
- `POST /api/solicitudes` - Crear solicitud
- `PUT /api/solicitudes/:id/aprobar` - Aprobar
- `PUT /api/solicitudes/:id/rechazar` - Rechazar

### Mensajes
- `GET /api/mensajes/contrato/:id` - Mensajes del contrato
- `POST /api/mensajes` - Enviar mensaje

### Vendedores
- `GET /api/vendedores/:id/stats` - Estadísticas del vendedor
- `GET /api/vendedores/:id/clientes` - Clientes del vendedor
- `GET /api/vendedores/:id/contratos` - Contratos del vendedor

---

## 🔐 CREDENCIALES DE PRUEBA

**Vendedores:**
- Código: `ADMIN001` / Password: `Admin123!`
- Código: `VEND001` / Password: `Admin123!`
- Código: `VEND002` / Password: `Admin123!`

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Probar todos los endpoints** con Postman o Thunder Client
2. ✅ **Crear clientes de prueba**
3. ✅ **Crear ofertas de prueba**
4. ✅ **Empezar con el frontend**

---

## ❌ Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica la contraseña en el archivo `.env`
- Asegúrate de que la base de datos `diamondsistem` existe

### Error: "Port 5000 already in use"
- Cambia el puerto en `.env` a `PORT=5001` o cualquier otro

### Error: "jwt is not defined" o similar
- Verifica que todas las dependencias estén instaladas: `npm install`

---

**¡El backend está 100% listo para usar!** 🎉

