# 🚀 INICIO RÁPIDO - DiamondSistem

## ✅ Sistema Completado al 100%

**DiamondSistem** - Sistema de Gestión de Contratos para Eventos  
**Fecha:** 01 de Noviembre 2025  
**Estado:** 🟢 Producción Ready

---

## 📋 Pre-requisitos Verificados

- ✅ PostgreSQL instalado y corriendo
- ✅ Base de datos `diamondsistem` creada
- ✅ Node.js instalado
- ✅ Dependencias instaladas en backend y frontend

---

## 🚀 INICIAR EL SISTEMA (3 Pasos)

### Paso 1: Verificar Base de Datos
```bash
# Abrir SQL Shell (psql)
# Conectarse a la base de datos
\c diamondsistem

# Verificar que las tablas existan
\dt
```

### Paso 2: Iniciar Backend (Terminal 1)
```bash
cd C:\Users\eac\Desktop\DiamondSistem\backend
npm run dev
```

**✅ Deberías ver:**
```
✅ Conexión a la base de datos establecida
🚀 Servidor corriendo en: http://localhost:5000
```

### Paso 3: Iniciar Frontend (Terminal 2)
```bash
cd C:\Users\eac\Desktop\DiamondSistem\frontend
npm run dev
```

**✅ Deberías ver:**
```
➜  Local:   http://localhost:5173/
```

---

## 🌐 URLs del Sistema

### Frontend (Aplicación Principal)
```
🎨 http://localhost:5173
```

### Backend API
```
🔧 http://localhost:5000
📊 http://localhost:5000/health
📚 http://localhost:5000/
```

---

## 🔐 CREDENCIALES DE ACCESO

### Para Vendedores:
```
Código: ADMIN001
Password: Admin123!
```

```
Código: VEND001
Password: Admin123!
```

```
Código: VEND002
Password: Admin123!
```

---

## 📱 FLUJO DE TRABAJO BÁSICO

### 1️⃣ Login
- Abre `http://localhost:5173`
- Ingresa: `ADMIN001` / `Admin123!`
- Clic en "Iniciar Sesión"

### 2️⃣ Crear Cliente
- Menú: **Clientes** → **Nuevo Cliente**
- Completa el formulario
- Guarda

### 3️⃣ Crear Oferta
- Menú: **Ofertas** → **Nueva Oferta**
- Selecciona cliente
- Completa detalles del evento
- Elige paquete
- Agrega servicios adicionales
- **Observa la calculadora en tiempo real** (panel derecho)
- Crea la oferta

### 4️⃣ Aceptar Oferta
- Ve a **Ofertas**
- Busca tu oferta
- Clic en **"Aceptar Oferta"**

### 5️⃣ Crear Contrato
- En la oferta aceptada
- Clic en **"Crear Contrato"**

### 6️⃣ Registrar Pagos
- Ve a **Contratos**
- Selecciona un contrato
- Clic en **"Ver Detalles"**
- Clic en **"Registrar Pago"**
- Completa el formulario
- Registra el pago

### 7️⃣ Ver Estadísticas
- Ve al **Dashboard**
- Observa todas tus métricas actualizadas

---

## 🎯 CARACTERÍSTICAS PRINCIPALES

### ✅ Sistema de Autenticación
- Login seguro con JWT
- Sesión persistente (7 días)
- Protección de rutas

### ✅ Gestión de Clientes
- Crear, listar, buscar
- Tipos de evento
- Tracking de fuente

### ✅ Calculadora de Precios Inteligente
- Paquetes base
- Ajuste por temporada
- Servicios adicionales
- Descuentos
- IVA 7% + Servicio 18%
- **Cálculo en tiempo real**

### ✅ Gestión de Ofertas
- Estados: pendiente, aceptada, rechazada
- Filtros y búsqueda
- Conversión a contrato

### ✅ Gestión de Contratos
- Códigos únicos
- Estados: activo, completado, cancelado
- Progreso de pago visual
- Código de acceso para cliente

### ✅ Sistema de Pagos
- Múltiples métodos
- Historial completo
- Actualización automática de saldos
- Estados: pendiente, parcial, pagado

### ✅ Dashboard con Estadísticas
- Total de clientes
- Ofertas pendientes
- Contratos activos
- Total de ventas
- Comisiones ganadas
- Tasa de conversión

---

## 📊 DATOS DE PRUEBA INCLUIDOS

### Paquetes (5)
- Básico: $25/persona
- Plata: $35/persona
- Oro: $50/persona
- Platinum: $75/persona
- Diamond: $100/persona

### Servicios (40+)
- Bebidas (8 tipos)
- Mobiliario (4 tipos)
- Entretenimiento (5 tipos)
- Decoración (4 tipos)
- Fotografía/Video (3 tipos)
- Alimentación (3 tipos)
- Logística (5 tipos)
- Personal (9 tipos)

### Temporadas (3)
- Alta: +30% (Nov-Ene)
- Media: +15% (Feb-Abr)
- Baja: -10% (May-Ago)

---

## 🎨 INTERFAZ DE USUARIO

### Diseño Responsivo
- ✅ Desktop (1920px+)
- ✅ Laptop (1024px+)
- ✅ Tablet (768px+)
- ✅ Móvil (320px+)

### Navegación
- **Sidebar** en desktop (siempre visible)
- **Menú hamburguesa** en móvil (colapsable)

### Temas
- Colores: Indigo/Azul (profesional)
- Animaciones suaves
- Feedback visual claro

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### ❌ "Cannot connect to backend"
**Solución:** Verifica que el backend esté corriendo en puerto 5000

### ❌ "Error de autenticación"
**Solución:** Revisa las credenciales (ADMIN001 / Admin123!)

### ❌ "Base de datos no conectada"
**Solución:** Verifica PostgreSQL y la conexión en backend/.env

### ❌ Página en blanco
**Solución:**
1. Abre DevTools (F12)
2. Ve a Console
3. Revisa los errores
4. Verifica que frontend/.env exista con VITE_API_URL

---

## 📚 DOCUMENTACIÓN COMPLETA

### Documentos Principales:
- `README.md` - Visión general del proyecto
- `GUIA_USO_COMPLETA.md` - Guía detallada paso a paso
- `RESUMEN_PROGRESO.md` - Estado del proyecto

### Backend:
- `backend/README.md` - Documentación API
- `backend/PRUEBAS_COMPLETAS.md` - Tests realizados
- `backend/EJEMPLOS_USO.md` - Scripts de prueba

### Frontend:
- `frontend/README.md` - Documentación del frontend

### Base de Datos:
- `database/README.md` - Guía de la BD
- `database/modelo_datos.md` - Estructura completa

---

## 🎯 EJEMPLO RÁPIDO

### Crear una oferta para boda de 150 invitados:

1. **Cliente:** María González
2. **Paquete:** Oro ($50/persona)
3. **Invitados:** 150
4. **Servicios:**
   - Fotografía: $900
   - DJ: $800
5. **Cálculo automático:**
   - Paquete: $7,500
   - Servicios: $1,700
   - Subtotal: $9,200
   - IVA (7%): $644
   - Servicio (18%): $1,656
   - **Total: $11,500**

---

## 🚀 ESTADO DEL PROYECTO

```
Base de Datos:  ████████████████████  100% ✅
Backend:        ████████████████████  100% ✅
Frontend:       ████████████████████  100% ✅
Documentación:  ████████████████████  100% ✅
```

**Sistema:** 🟢 COMPLETAMENTE FUNCIONAL

---

## 🎉 ¡LISTO PARA USAR!

El sistema DiamondSistem está **100% completado** y listo para producción.

### ¿Qué puedes hacer ahora?

1. ✅ Crear clientes reales
2. ✅ Generar ofertas profesionales
3. ✅ Gestionar contratos
4. ✅ Rastrear pagos
5. ✅ Ver estadísticas en tiempo real

### Próximas Apps (Opcionales):
- **App 2:** Panel del Cliente
- **App 3:** Panel Administrativo

---

**¡Disfruta usando DiamondSistem! 💎🎉**

---

## 📞 SOPORTE

Si tienes dudas:
1. Revisa la `GUIA_USO_COMPLETA.md`
2. Consulta los README específicos
3. Verifica los logs en consola

---

**Desarrollado:** 01 de Noviembre 2025  
**Versión:** 1.0.0  
**Estado:** Producción Ready ✅



