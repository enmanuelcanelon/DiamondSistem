# 👥 Usuarios del Sistema - Diamond Sistem

Este documento contiene las credenciales de todos los usuarios del sistema.

## 🔐 Credenciales de Acceso

### 👤 VENDEDORES

| Código | Nombre | Email | Password | URL Login |
|--------|--------|-------|----------|-----------|
| VEN001 | Ana | ana@diamondsistem.com | `Ana2025!` | https://diamondsistem-vendedor.vercel.app |
| VEN002 | Mariel | mariel@diamondsistem.com | `Mariel2025!` | https://diamondsistem-vendedor.vercel.app |
| VEN003 | Alejandra | alejandra@diamondsistem.com | `Alejandra2025!` | https://diamondsistem-vendedor.vercel.app |
| VEN004 | Charo | charo@diamondsistem.com | `Charo2025!` | https://diamondsistem-vendedor.vercel.app |
| PRUEBA001 | Prueba | prueba@diamondsistem.com | `prueba123` | https://diamondsistem-vendedor.vercel.app |

### 👔 GERENTES

| Código | Nombre | Email | Password | URL Login |
|--------|--------|-------|----------|-----------|
| GER001 | Mario | mario@diamondsistem.com | `Mario2025!` | https://diamondsistem-gerente.vercel.app |

### 👨‍💼 MANAGERS

| Código | Nombre | Email | Password | URL Login |
|--------|--------|-------|----------|-----------|
| MGR001 | Carolina | carolina@diamondsistem.com | `Carolina2025!` | https://diamond-sistema-manager.vercel.app |

### 🔧 ADMINISTRADORES (Inventario)

| Código | Nombre | Email | Password | URL Login |
|--------|--------|-------|----------|-----------|
| ADM001 | Diana | diana@diamondsistem.com | `Diana2025!` | https://diamond-sistem-administrador.vercel.app |

---

## 🚀 Crear Usuarios en la Base de Datos

Para crear todos estos usuarios en tu base de datos de Railway, ejecuta:

```bash
node backend/scripts/crear_usuarios_sistema.js
```

### ¿Qué hace el script?

- ✅ Verifica si cada usuario ya existe
- ✅ Si existe: Actualiza su contraseña y datos
- ✅ Si NO existe: Crea el usuario nuevo
- ✅ Hash automático de contraseñas con bcrypt
- ✅ Muestra resumen de operaciones y credenciales

### Requisitos

- Backend configurado con conexión a base de datos
- Variable de entorno `DATABASE_URL` configurada
- Dependencias de Node.js instaladas (`npm install`)

---

## 📝 Modificar Usuarios

Para agregar, editar o eliminar usuarios:

1. Edita el archivo: `backend/scripts/crear_usuarios_sistema.js`
2. Modifica el objeto `USUARIOS` en la parte superior del archivo
3. Ejecuta el script nuevamente: `node backend/scripts/crear_usuarios_sistema.js`

---

## 🔒 Seguridad

**⚠️ IMPORTANTE:**

- **NO** compartas este archivo públicamente
- **NO** lo subas a repositorios públicos de GitHub
- Cambia las contraseñas después del primer login en producción
- Este archivo está incluido en `.gitignore` (si se configuró correctamente)

---

## 📱 URLs de Acceso por Rol

- **Vendedor**: https://diamondsistem-vendedor.vercel.app
- **Gerente**: https://diamondsistem-gerente.vercel.app
- **Manager**: https://diamond-sistema-manager.vercel.app
- **Administrador**: https://diamond-sistem-administrador.vercel.app

---

_Última actualización: 2025-01-29_
