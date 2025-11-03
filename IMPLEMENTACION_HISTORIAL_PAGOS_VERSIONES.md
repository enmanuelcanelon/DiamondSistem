# 📊 Implementación: Historial de Pagos y Versiones de Contratos

## 🎯 Resumen

Se han implementado dos funcionalidades nuevas en el sistema DiamondSistem para mejorar la transparencia y el seguimiento de contratos:

1. **Historial de Pagos para Clientes**: Los clientes ahora pueden ver todos los pagos que han realizado.
2. **Sistema de Versiones de Contratos**: Se guardan automáticamente versiones PDF del contrato cada vez que hay cambios de precio.

---

## 📋 Tabla de Contenidos

1. [Base de Datos](#base-de-datos)
2. [Backend](#backend)
3. [Frontend](#frontend)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Guía de Uso](#guía-de-uso)

---

## 🗄️ Base de Datos

### Nueva Tabla: `versiones_contratos_pdf`

```sql
CREATE TABLE versiones_contratos_pdf (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    version_numero INTEGER NOT NULL,
    total_contrato DECIMAL(10,2) NOT NULL,
    cantidad_invitados INTEGER,
    motivo_cambio TEXT,
    cambios_detalle JSONB,
    pdf_contenido BYTEA,
    generado_por INTEGER REFERENCES vendedores(id),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(contrato_id, version_numero),
    CHECK (version_numero > 0)
);
```

**Características:**
- ✅ Almacena el PDF completo en la base de datos (campo `pdf_contenido`)
- ✅ Numeración secuencial de versiones (1, 2, 3...)
- ✅ Registro del motivo del cambio y detalles en JSON
- ✅ Trigger automático para crear versión 1 al firmar un contrato
- ✅ Índices para optimizar consultas

---

## 🔧 Backend

### Archivos Creados/Modificados

#### 1. **`database/migration_versiones_contratos.sql`**
- Migración completa con tabla, triggers, funciones y vista
- Función `obtener_proximo_numero_version()` para numeración automática
- Trigger `crear_version_inicial_contrato()` para la versión 1
- Vista `vista_versiones_contratos` con información resumida

#### 2. **`backend/prisma/schema.prisma`**
- Nuevo modelo `versiones_contratos_pdf`
- Relaciones con `contratos` y `vendedores`

#### 3. **`backend/src/routes/contratos.routes.js`**
- **GET `/api/contratos/:id/versiones`**: Listar todas las versiones de un contrato
- **POST `/api/contratos/:id/versiones`**: Crear una nueva versión manualmente
- **GET `/api/contratos/:id/versiones/:version_numero/pdf`**: Descargar PDF de una versión específica

**Permisos:**
- ✅ Vendedor: Solo puede ver versiones de sus propios contratos
- ✅ Cliente: Solo puede ver versiones de su contrato

#### 4. **`backend/src/routes/solicitudes.routes.js`**
- Modificado el endpoint `PUT /:id/aprobar` para generar automáticamente una nueva versión al aprobar una solicitud
- Genera el PDF y lo guarda en la base de datos
- Registra el motivo del cambio y los detalles

---

## 🎨 Frontend

### Archivos Creados/Modificados

#### 1. **`frontend/src/pages/cliente/DashboardCliente.jsx`**

**Cambios:**
- ✅ Query para obtener historial de pagos (`/contratos/:id/pagos`)
- ✅ Nueva sección "Historial de Pagos" con:
  - Listado completo de todos los pagos
  - Información de método de pago (efectivo, transferencia, tarjeta, cheque)
  - Estado del pago (completado, anulado)
  - Detalles: monto, recargo, número de referencia, notas
  - Vendedor que registró el pago
  - Fecha y hora del pago
- ✅ Tarjeta de acceso rápido a "Versiones del Contrato"

#### 2. **`frontend/src/pages/cliente/VersionesContrato.jsx`** ⭐ NUEVO

**Componente completo para gestión de versiones:**

**Características:**
- ✅ Listado de todas las versiones del contrato
- ✅ Información detallada de cada versión:
  - Número de versión (v1, v2, v3...)
  - Fecha de generación
  - Motivo del cambio
  - Total del contrato
  - Cantidad de invitados
  - Diferencia de precio respecto a la versión anterior
  - Vendedor que generó la versión
- ✅ Botón para descargar PDF de cada versión
- ✅ Badge especial para la "Versión Actual"
- ✅ Indicadores visuales de cambios de precio (subida/bajada)
- ✅ Diseño responsive y moderno

#### 3. **`frontend/src/App.jsx`**
- Importado `VersionesContrato`
- Nueva ruta: `/cliente/versiones`

---

## 🔄 Flujo de Trabajo

### Caso 1: Creación de Contrato

```
1. Vendedor crea un contrato desde una oferta aceptada
   ↓
2. Se firma el contrato (estado: confirmado)
   ↓
3. ⚡ Trigger automático crea la Versión 1
   ↓
4. PDF se guarda en la base de datos
```

### Caso 2: Cambio en el Contrato

```
1. Cliente solicita agregar 20 invitados adicionales
   ↓
2. Vendedor aprueba la solicitud
   ↓
3. 🔄 Sistema actualiza automáticamente:
   - Cantidad de invitados en el contrato
   - Total del contrato (nuevo precio)
   - Crea entrada en historial_cambios_precios
   - ⭐ Genera y guarda Versión 2 del PDF
   - Envía mensaje al cliente
   ↓
4. Cliente puede ver y descargar ambas versiones:
   - Versión 1: Contrato original (80 invitados)
   - Versión 2: Contrato actualizado (100 invitados) ⭐ ACTUAL
```

### Caso 3: Cliente Revisa sus Pagos

```
1. Cliente ingresa al Dashboard
   ↓
2. Ve sección "Historial de Pagos"
   ↓
3. Información mostrada:
   - ✅ Pago 1: $500 - Transferencia - 15/Oct/2025
   - ✅ Pago 2: $1,000 - Tarjeta débito (+$38 recargo) - 20/Oct/2025
   - ❌ Pago 3: $200 - Efectivo - ANULADO
   ↓
4. Cliente tiene transparencia total de sus pagos
```

---

## 📱 Guía de Uso

### Para el Cliente

#### Ver Historial de Pagos

1. Ingresa al **Dashboard del Cliente**
2. Desplázate hacia abajo
3. Encuentra la sección **"Historial de Pagos"**
4. Verás todos los pagos realizados con:
   - Estado (✓ Completado o ❌ Anulado)
   - Método de pago
   - Monto y recargos
   - Fecha y hora
   - Vendedor que lo registró

#### Ver Versiones del Contrato

**Opción 1: Desde el Dashboard**
1. En la sección de **tarjetas rápidas**
2. Click en **"Versiones del Contrato"** (icono ámbar 📄)

**Opción 2: URL directa**
1. Ve a `/cliente/versiones`

**En la página de Versiones:**
- Verás todas las versiones históricas (v1, v2, v3...)
- La versión más reciente tiene badge **⭐ Versión Actual**
- Cada versión muestra:
  - Fecha de generación
  - Motivo del cambio
  - Total y cantidad de invitados
  - Diferencia con la versión anterior
- Click en **"Descargar PDF"** para obtener el contrato

### Para el Vendedor

#### Generación Automática de Versiones

Las versiones se crean automáticamente en estos casos:
1. ✅ Al firmar un contrato (Versión 1)
2. ✅ Al aprobar solicitud de invitados adicionales
3. ✅ Al aprobar solicitud de servicios adicionales

**No requiere acción manual del vendedor** 🎉

#### Crear Versión Manualmente (API)

Si necesitas crear una versión manualmente:

```bash
POST /api/contratos/:id/versiones
Authorization: Bearer {token}

Body:
{
  "motivo_cambio": "Ajuste de precio por negociación",
  "cambios_detalle": {
    "tipo": "descuento_especial",
    "porcentaje": 10
  }
}
```

#### Ver Versiones (Vendedor)

El vendedor también puede acceder a:
```
GET /api/contratos/:id/versiones
```

Para obtener todas las versiones de un contrato específico.

---

## 🎯 Beneficios

### Para el Cliente

✅ **Transparencia Total**
- Ve cada pago realizado
- Historial completo de cambios en el contrato
- Puede descargar cualquier versión anterior

✅ **Referencia Histórica**
- Si el contrato cambió de $10,000 a $12,000, puede ver exactamente por qué
- Tiene acceso a ambas versiones del PDF

✅ **Tranquilidad**
- Puede verificar los pagos anulados
- Tiene respaldo de todas las versiones del contrato

### Para el Vendedor

✅ **Automatización**
- No necesita generar manualmente PDFs actualizados
- El sistema lo hace automáticamente al aprobar cambios

✅ **Auditoría**
- Historial completo de todas las versiones
- Rastreabilidad de cada cambio

✅ **Reducción de Conflictos**
- Cliente siempre tiene acceso a la información
- Menos consultas sobre pagos y cambios

---

## 🔐 Seguridad

### Permisos y Acceso

| Endpoint | Vendedor | Cliente |
|----------|----------|---------|
| `GET /contratos/:id/versiones` | ✅ Solo sus contratos | ✅ Solo su contrato |
| `POST /contratos/:id/versiones` | ✅ Solo sus contratos | ❌ |
| `GET /contratos/:id/versiones/:version/pdf` | ✅ Solo sus contratos | ✅ Solo su contrato |
| `GET /contratos/:id/pagos` | ✅ Solo sus contratos | ✅ Solo su contrato |

**Validaciones:**
- ✅ JWT authentication requerido
- ✅ Verificación de propiedad del contrato
- ✅ No se pueden ver contratos de otros vendedores
- ✅ Clientes solo ven su propio contrato

---

## 📊 Estadísticas

### Tamaño de Archivos PDF

**Estimado por contrato:**
- PDF simple: ~50-100 KB
- PDF con muchos servicios: ~100-200 KB

**Para 100 contratos con 3 versiones cada uno:**
- Espacio total: ~15-30 MB

💡 **Recomendación:** Para escalar, considerar almacenamiento en S3/Azure Blob Storage en lugar de BYTEA.

---

## 🚀 Próximas Mejoras (Opcional)

### Sugerencias para el Futuro

1. **Notificaciones por Email**
   - Enviar email al cliente cuando se genera una nueva versión
   - Adjuntar el PDF automáticamente

2. **Comparación de Versiones**
   - Vista lado a lado de dos versiones
   - Highlight de diferencias

3. **Almacenamiento Externo**
   - Migrar PDFs a S3/Azure Blob Storage
   - Mantener URLs en la base de datos

4. **Firma Digital**
   - Permitir al cliente firmar digitalmente cada versión
   - Registro de firma con timestamp

5. **Exportar Historial**
   - Descargar todos los PDFs en un ZIP
   - Generar reporte Excel con historial de cambios

---

## 📝 Comandos de Instalación

### Ejecutar Migración

```bash
# En tu base de datos PostgreSQL
psql -U tu_usuario -d diamondsistem -f database/migration_versiones_contratos.sql

# O desde psql
\i database/migration_versiones_contratos.sql
```

### Generar Cliente Prisma

```bash
cd backend
npx prisma generate
```

### Verificar Instalación

```sql
-- Ver todas las versiones creadas
SELECT * FROM vista_versiones_contratos;

-- Contar versiones por contrato
SELECT contrato_id, codigo_contrato, COUNT(*) as total_versiones
FROM vista_versiones_contratos
GROUP BY contrato_id, codigo_contrato
ORDER BY total_versiones DESC;
```

---

## ✅ Testing

### Probar Creación de Versiones

```bash
# 1. Crear un contrato nuevo (debería crear automáticamente Versión 1)
# 2. Aprobar una solicitud de cambio (debería crear Versión 2)
# 3. Verificar en la base de datos:

SELECT 
  v.version_numero,
  v.total_contrato,
  v.motivo_cambio,
  v.fecha_generacion,
  LENGTH(v.pdf_contenido) as pdf_size_bytes
FROM versiones_contratos_pdf v
WHERE v.contrato_id = 1
ORDER BY v.version_numero;
```

### Probar Descarga de PDF

1. Ir a `/cliente/versiones`
2. Click en "Descargar PDF" de cualquier versión
3. Verificar que el PDF se descarga correctamente
4. Verificar que el nombre del archivo sea: `Contrato-{codigo}-v{numero}.pdf`

---

## 🎉 Resumen de Implementación

| Componente | Estado | Archivos |
|------------|--------|----------|
| **Base de Datos** | ✅ | 1 migración SQL |
| **Backend - Endpoints** | ✅ | 3 endpoints nuevos |
| **Backend - Auto-generación** | ✅ | 1 modificación |
| **Frontend - Historial Pagos** | ✅ | 1 sección nueva |
| **Frontend - Versiones** | ✅ | 1 página nueva |
| **Rutas** | ✅ | 1 ruta nueva |
| **Testing** | ⏳ | Pendiente |

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que la migración SQL se ejecutó correctamente
2. Verifica que Prisma está actualizado (`npx prisma generate`)
3. Revisa los logs del backend para errores en generación de PDF
4. Verifica permisos de acceso (JWT válido)

---

**Fecha de Implementación:** Noviembre 2025  
**Versión del Sistema:** 1.2.0  
**Desarrollado para:** DiamondSistem

