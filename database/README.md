# 🗄️ Base de Datos - DiamondSistem

## Descripción General

Base de datos relacional diseñada para gestionar un sistema completo de administración de eventos para salón de banquetes, incluyendo:

- ✅ Gestión de clientes y vendedores
- ✅ Creación de ofertas y contratos
- ✅ Cálculo dinámico de precios (temporadas, paquetes, servicios, taxes)
- ✅ Sistema de pagos y financiamiento
- ✅ Gestión de eventos
- ✅ Solicitudes y aprobaciones
- ✅ Sistema de mensajería
- ✅ Historial de cambios y auditoría

## 🛠️ Tecnología

- **Motor**: PostgreSQL 14+
- **ORM Recomendado**: Prisma / Sequelize
- **Triggers**: Sí (automatización de cálculos)
- **Vistas**: Sí (consultas optimizadas)
- **Índices**: Optimizados para consultas frecuentes

## 📁 Archivos

### `schema.sql`
Esquema completo de la base de datos con:
- 15 tablas principales
- Relaciones FK correctamente definidas
- Índices para optimización
- 2 vistas útiles
- 4 triggers para automatización

### `seeds.sql`
Datos iniciales del sistema:
- 3 Temporadas (Baja, Media, Alta)
- 5 Paquetes completos
- 40+ Servicios detallados
- Relaciones paquetes-servicios
- Configuración del sistema
- Vendedores de prueba

### `modelo_datos.md`
Documentación detallada del modelo de datos con diagramas y explicaciones.

## 🚀 Instalación

### Opción 1: Instalación Manual

```bash
# 1. Crear la base de datos
createdb diamondsistem

# 2. Ejecutar el esquema
psql -d diamondsistem -f schema.sql

# 3. Cargar datos iniciales
psql -d diamondsistem -f seeds.sql
```

### Opción 2: Con Docker

```bash
# 1. Levantar PostgreSQL con Docker
docker run --name diamondsistem-db \
  -e POSTGRES_DB=diamondsistem \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -p 5432:5432 \
  -d postgres:14

# 2. Ejecutar scripts
docker exec -i diamondsistem-db psql -U admin -d diamondsistem < schema.sql
docker exec -i diamondsistem-db psql -U admin -d diamondsistem < seeds.sql
```

### Opción 3: Con Prisma (Recomendado)

```bash
# Ver instrucciones en backend/prisma/README.md
```

## 📊 Modelo de Datos Principal

### Entidades Principales

```
VENDEDORES → CLIENTES → OFERTAS → CONTRATOS → EVENTOS
                            ↓          ↓
                      SERVICIOS    PAGOS
```

### Flujo de Trabajo

1. **Vendedor** crea **Cliente**
2. **Vendedor** crea **Oferta** para **Cliente**
3. **Cliente** acepta/rechaza **Oferta**
4. Si acepta → se crea **Contrato**
5. **Contrato** genera código de acceso para **Cliente**
6. **Contrato** crea **Evento**
7. **Cliente** puede solicitar cambios desde su app
8. **Vendedor** aprueba/rechaza solicitudes
9. Se registran **Pagos** contra el **Contrato**
10. Al completar pagos → **Vendedor** recibe comisión

## 📈 Cálculo de Precios

El sistema calcula precios de forma dinámica:

```sql
-- Fórmula del precio final
precio_paquete_base 
  + ajuste_temporada
  + suma_servicios_adicionales
  = SUBTOTAL
  
SUBTOTAL - descuento_negociado = SUBTOTAL_AJUSTADO

impuesto = SUBTOTAL_AJUSTADO × 7%
tarifa_servicio = SUBTOTAL_AJUSTADO × 18%

TOTAL_FINAL = SUBTOTAL_AJUSTADO + impuesto + tarifa_servicio
```

### Ejemplo Real:

```
Paquete Platinum: $7,500
Temporada Alta (Mayo): +$4,000
Servicio Extra (Hora Loca): +$450
─────────────────────────
SUBTOTAL: $11,950
IVA (7%): $836.50
Service Fee (18%): $2,151.00
─────────────────────────
TOTAL: $14,937.50
```

## 🔐 Seguridad

### Passwords
- Todos los passwords se guardan con bcrypt
- Nunca se almacenan en texto plano

### Códigos de Acceso
- Se generan automáticamente al crear contrato
- Son únicos y seguros
- Formato sugerido: `CONT-{año}-{mes}-{id}-{random}`

### Auditoría
- Tabla `historial_cambios_precios` registra negociaciones
- Campos `fecha_creacion` y `fecha_actualizacion` en tablas principales
- Triggers automáticos para actualizar timestamps

## 🎯 Triggers Automatizados

### 1. `actualizar_fecha_modificacion()`
- Actualiza `fecha_actualizacion` en clientes, contratos y eventos

### 2. `actualizar_saldo_contrato()`
- Se ejecuta al registrar un pago
- Actualiza `total_pagado` y `saldo_pendiente`
- Cambia `estado_pago` automáticamente

### 3. `calcular_comision_vendedor()`
- Se ejecuta cuando un contrato se paga completamente
- Marca `comision_pagada = TRUE`
- Actualiza estadísticas del vendedor

## 📋 Vistas Útiles

### `vista_contratos_completos`
Vista consolidada con toda la información de contratos, clientes, vendedores, paquetes y eventos.

```sql
SELECT * FROM vista_contratos_completos 
WHERE estado_pago = 'pendiente';
```

### `vista_solicitudes_pendientes`
Muestra todas las solicitudes de clientes pendientes de aprobación.

```sql
SELECT * FROM vista_solicitudes_pendientes 
ORDER BY fecha_solicitud DESC;
```

## 🔍 Consultas Útiles

### Ver todos los eventos del próximo mes
```sql
SELECT * FROM vista_contratos_completos
WHERE fecha_evento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 month'
AND estado_evento = 'en_proceso'
ORDER BY fecha_evento;
```

### Calcular ventas de un vendedor
```sql
SELECT 
    v.nombre_completo,
    v.total_ventas,
    v.total_comisiones,
    COUNT(c.id) as total_contratos
FROM vendedores v
LEFT JOIN contratos c ON v.id = c.vendedor_id
WHERE v.id = 1
GROUP BY v.id;
```

### Ver pagos pendientes
```sql
SELECT 
    codigo_contrato,
    cliente_nombre,
    total_contrato,
    total_pagado,
    saldo_pendiente,
    fecha_evento
FROM vista_contratos_completos
WHERE estado_pago != 'completado'
AND fecha_evento > CURRENT_DATE
ORDER BY fecha_evento;
```

## 🧪 Datos de Prueba

El archivo `seeds.sql` incluye:
- ✅ 3 vendedores de prueba
- ✅ 3 temporadas configuradas
- ✅ 5 paquetes completos
- ✅ 40+ servicios
- ✅ Configuración del sistema

**Credenciales de prueba:**
```
Código Vendedor: ADMIN001
Password: Admin123!
```

## 🔄 Migraciones Futuras

Para agregar nuevas funcionalidades, crear archivos de migración:
- `migrations/001_add_feature.sql`
- `migrations/002_alter_table.sql`

## 📞 Soporte

Para dudas sobre la estructura de la base de datos, consultar:
- `modelo_datos.md` - Documentación detallada
- `schema.sql` - Comentarios en el código
- Diagramas ER en carpeta `docs/`

---

**Versión**: 1.0  
**Última actualización**: Noviembre 2025  
**Autor**: DiamondSistem Development Team

