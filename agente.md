# 🤖 Guía para Agentes IA - DiamondSistem

Este documento proporciona información completa sobre el estado actual del proyecto DiamondSistem para que cualquier agente de IA pueda continuar el desarrollo de forma efectiva.

---

## 📊 Estado General del Proyecto

**Última actualización:** 14 de Diciembre 2025  
**Estado:** Producción (90% completo)  
**Versión:** 2.0

---

## 🏗️ Arquitectura del Sistema

### Estructura de Frontends (Separados)

```
frontend-vendedor/      # Panel del vendedor (React + Vite)
frontend-cliente/       # Portal del cliente (React + Vite)
frontend-gerente/       # Panel del gerente (React + Vite)
frontend-manager/       # Panel del manager (React + Vite)
frontend-administrador/ # Panel del administrador (React + Vite)
shared/                 # Componentes y utilidades compartidos
```

### Backend

```
backend/
├── src/
│   ├── routes/         # Endpoints de la API
│   ├── services/       # Lógica de negocio
│   ├── middleware/     # Autenticación, validación, errores
│   ├── utils/          # Utilidades (OAuth, encriptación, etc.)
│   └── config/         # Configuración (DB, etc.)
├── prisma/
│   └── schema.prisma   # Modelo de base de datos
```

### Base de Datos

- **Motor:** PostgreSQL
- **ORM:** Prisma
- **Tablas principales:** usuarios, clientes, contratos, ofertas, pagos, leaks, etc.

---

## ✅ Funcionalidades Implementadas

### 1. Sistema Core (100% Completo)

- ✅ **Autenticación JWT** - Login/logout en todos los frontends
- ✅ **Gestión de Clientes** - CRUD completo
- ✅ **Gestión de Ofertas** - Crear, editar, aceptar, rechazar
- ✅ **Gestión de Contratos** - Crear desde ofertas, seguimiento
- ✅ **Sistema de Pagos** - Registrar pagos, historial, estados
- ✅ **Cálculo de Precios** - Automático con temporadas y paquetes
- ✅ **Generación de PDFs** - Ofertas y contratos
- ✅ **Chat en tiempo real** - Entre vendedor y cliente
- ✅ **Gestión de Mesas** - Organización de invitados
- ✅ **Playlist Musical** - Favoritas, prohibidas, sugeridas
- ✅ **Ajustes del Evento** - 6 secciones (Torta, Decoración, Menú, etc.)
- ✅ **Sistema de Inventario** - Gestión de salones y recursos
- ✅ **Sistema de Comisiones** - Cálculo automático
- ✅ **Integración Google Calendar** - Sincronización de eventos

---

## 🔍 Cómo Continuar el Desarrollo

### Para Agregar Nuevas Funcionalidades

1. **Backend:**
   - Agregar endpoint en `backend/src/routes/`
   - Crear servicio si es necesario en `backend/src/services/`

2. **Frontend:**
   - Crear/actualizar componente en `frontend-vendedor/src/components/`
   - Agregar método en servicios correspondientes
   - Usar React Query para data fetching

3. **Base de Datos:**
   - Actualizar `backend/prisma/schema.prisma` si se necesitan nuevos campos
   - Ejecutar `npx prisma db push` en Railway

---

## 📚 Documentación Adicional

- **README.md** - Información general del proyecto
- **docs/** - Documentación completa del sistema

---

## 🎯 Resumen Ejecutivo

**Estado Actual:**
- ✅ Sistema core 100% funcional
- ✅ Todas las funcionalidades principales implementadas

---

**Última actualización:** 14 de Diciembre 2025  
**Mantenido por:** Equipo de desarrollo DiamondSistem
