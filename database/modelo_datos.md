# 📊 Modelo de Datos - DiamondSistem

## Diagrama Entidad-Relación (Simplificado)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ VENDEDORES  │────┬───→│  CLIENTES   │────┬───→│   OFERTAS   │
└─────────────┘    │    └─────────────┘    │    └─────────────┘
                   │                       │           │
                   │                       │           ↓
                   │                       │    ┌─────────────┐
                   │                       └───→│  CONTRATOS  │
                   │                            └─────────────┘
                   │                                   │
                   │                                   ├───→┌──────────┐
                   │                                   │    │  PAGOS   │
                   │                                   │    └──────────┘
                   │                                   │
                   │                                   ├───→┌──────────┐
                   │                                   │    │ EVENTOS  │
                   │                                   │    └──────────┘
                   │                                   │
                   │                                   └───→┌──────────────────┐
                   │                                        │ SOLICITUDES_     │
                   └───────────────────────────────────────→│ CLIENTE          │
                                                            └──────────────────┘

┌─────────────┐    ┌──────────────────────┐    ┌─────────────┐
│  PAQUETES   │←───│ PAQUETES_SERVICIOS   │───→│  SERVICIOS  │
└─────────────┘    └──────────────────────┘    └─────────────┘
      ↑                                                ↑
      │                                                │
      └────────────────┬───────────────────────────────┘
                       │
              ┌────────────────────┐
              │ OFERTAS_SERVICIOS_ │
              │ ADICIONALES        │
              └────────────────────┘
```

## 📋 Tablas Principales

### 1️⃣ VENDEDORES
Gestiona los vendedores del sistema con acceso y comisiones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único del vendedor |
| `nombre_completo` | VARCHAR(255) | Nombre completo |
| `codigo_vendedor` | VARCHAR(50) | Código único de acceso (ej: VEND001) |
| `email` | VARCHAR(255) | Email único |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `password_hash` | VARCHAR(255) | Password hasheado con bcrypt |
| `comision_porcentaje` | DECIMAL(5,2) | % de comisión (default: 10%) |
| `total_ventas` | DECIMAL(10,2) | Total acumulado de ventas |
| `total_comisiones` | DECIMAL(10,2) | Total acumulado de comisiones |
| `activo` | BOOLEAN | Estado activo/inactivo |

**Relaciones:**
- Un vendedor tiene muchos clientes
- Un vendedor crea muchas ofertas
- Un vendedor gestiona muchos contratos

---

### 2️⃣ CLIENTES
Información de clientes potenciales y actuales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único del cliente |
| `nombre_completo` | VARCHAR(255) | Nombre completo |
| `email` | VARCHAR(255) | Email de contacto |
| `telefono` | VARCHAR(20) | Teléfono principal |
| `direccion` | TEXT | Dirección completa |
| `como_nos_conocio` | VARCHAR(255) | Canal de adquisición |
| `tipo_evento` | VARCHAR(100) | Tipo: Boda, Quinceaños, etc. |
| `vendedor_id` | INTEGER | FK a vendedores |

**Relaciones:**
- Un cliente pertenece a un vendedor
- Un cliente puede tener muchas ofertas
- Un cliente puede tener muchos contratos

---

### 3️⃣ TEMPORADAS
Define las temporadas y su impacto en precios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `nombre` | VARCHAR(50) | Baja, Media, Alta |
| `meses` | VARCHAR(255) | Meses separados por comas |
| `ajuste_precio` | DECIMAL(10,2) | 0, 2000, 4000 |
| `descripcion` | TEXT | Descripción de la temporada |

**Datos:**
- **Baja**: enero, febrero, agosto, septiembre → +$0
- **Media**: marzo, abril, julio, octubre → +$2,000
- **Alta**: noviembre, diciembre, mayo, junio → +$4,000

---

### 4️⃣ PAQUETES
Los 5 paquetes de eventos disponibles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `nombre` | VARCHAR(100) | Especial, Platinum, Diamond, Deluxe, Personalizado |
| `precio_base` | DECIMAL(10,2) | Precio base del paquete |
| `duracion_horas` | INTEGER | Duración en horas |
| `invitados_minimo` | INTEGER | Cantidad mínima de invitados |
| `dias_disponibles` | VARCHAR(100) | Días de la semana disponibles |
| `horario_inicio` | TIME | Hora de inicio (default: 10:00) |
| `horario_fin_base` | TIME | Hora fin normal (01:00) |
| `horario_fin_maximo` | TIME | Hora fin con extra (02:00) |
| `es_personalizable` | BOOLEAN | Si permite personalización total |

**Paquetes Disponibles:**
1. **Especial** - $3,500 (4h, Lun-Vie)
2. **Platinum** - $7,500 (4h, Lun-Lun)
3. **Diamond** - $10,500 (5h, Lun-Lun)
4. **Deluxe** - $12,500 (5h, Lun-Lun)
5. **Personalizado** - $6,000 (Variable)

---

### 5️⃣ SERVICIOS
Todos los servicios disponibles con precios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `nombre` | VARCHAR(255) | Nombre del servicio |
| `descripcion` | TEXT | Descripción detallada |
| `precio_base` | DECIMAL(10,2) | Precio base |
| `tipo_cobro` | VARCHAR(50) | fijo, por_persona, por_unidad |
| `categoria` | VARCHAR(100) | Entretenimiento, Comida, Decoración, etc. |
| `requiere_seleccion` | BOOLEAN | Si el cliente debe elegir opciones |
| `opciones_disponibles` | TEXT | JSON con opciones disponibles |

**Categorías:**
- Entretenimiento (DJ, Hora Loca, Maestro de Ceremonia)
- Bebidas (Licores, Refrescos, Champaña, Sidra)
- Decoración (Básica, Plus, Números Lumínicos)
- Equipos (Mapping, Luces, Máquinas)
- Fotografía (Foto/Video, Photobooth)
- Comida (Platos, Mesa de Quesos, Pasapalos)
- Personal (Coordinador, Meseros, Bartenders)
- Transporte (Limosina)
- Extras (Hora Extra, Personas Adicionales)

---

### 6️⃣ PAQUETES_SERVICIOS
Relación muchos a muchos entre paquetes y servicios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `paquete_id` | INTEGER | FK a paquetes |
| `servicio_id` | INTEGER | FK a servicios |
| `cantidad` | INTEGER | Cantidad incluida |
| `incluido_gratis` | BOOLEAN | Si está en precio base |
| `notas` | TEXT | Notas adicionales |

**Lógica:**
- Define qué servicios vienen incluidos en cada paquete
- Paquete "Personalizado" no tiene servicios por defecto

---

### 7️⃣ OFERTAS
Propuestas comerciales creadas por vendedores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `codigo_oferta` | VARCHAR(50) | Código único (ej: OF-2025-001) |
| `cliente_id` | INTEGER | FK a clientes |
| `vendedor_id` | INTEGER | FK a vendedores |
| `paquete_id` | INTEGER | FK a paquetes |
| `fecha_evento` | DATE | Fecha del evento |
| `hora_inicio` / `hora_fin` | TIME | Horario del evento |
| `cantidad_invitados` | INTEGER | Número de invitados |
| `temporada_id` | INTEGER | FK a temporadas |
| `precio_paquete_base` | DECIMAL | Precio base del paquete |
| `ajuste_temporada` | DECIMAL | Ajuste por temporada |
| `subtotal_servicios` | DECIMAL | Suma de servicios extra |
| `subtotal` | DECIMAL | Subtotal antes de impuestos |
| `descuento` | DECIMAL | Descuento negociado |
| `impuesto_porcentaje` / `impuesto_monto` | DECIMAL | IVA 7% |
| `tarifa_servicio_porcentaje` / `tarifa_servicio_monto` | DECIMAL | Service Fee 18% |
| `total_final` | DECIMAL | Total con impuestos |
| `estado` | VARCHAR(50) | pendiente, aceptada, rechazada |
| `motivo_rechazo` | TEXT | Si fue rechazada |

**Estados:**
- `pendiente` - Esperando respuesta del cliente
- `aceptada` - Cliente aceptó, se puede crear contrato
- `rechazada` - Cliente rechazó la oferta

**Flujo:**
1. Vendedor crea oferta con cálculos automáticos
2. Se genera PDF de factura proforma
3. Cliente revisa y responde
4. Si acepta → pasa a contrato

---

### 8️⃣ OFERTAS_SERVICIOS_ADICIONALES
Servicios adicionales agregados a una oferta específica.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `oferta_id` | INTEGER | FK a ofertas |
| `servicio_id` | INTEGER | FK a servicios |
| `cantidad` | INTEGER | Cantidad solicitada |
| `precio_unitario` | DECIMAL | Precio negociado |
| `precio_original` | DECIMAL | Precio sin negociar |
| `subtotal` | DECIMAL | Total del servicio |

**Lógica:**
- Solo servicios NO incluidos en el paquete
- Permite negociar precios (registro en historial)

---

### 9️⃣ CONTRATOS
Contratos firmados que generan eventos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `codigo_contrato` | VARCHAR(50) | Código único (ej: CONT-2025-001) |
| `oferta_id` | INTEGER | FK a oferta origen |
| `cliente_id` | INTEGER | FK a clientes |
| `vendedor_id` | INTEGER | FK a vendedores |
| `paquete_id` | INTEGER | FK a paquetes |
| `fecha_evento` | DATE | Fecha del evento |
| `total_contrato` | DECIMAL | Total del contrato |
| `tipo_pago` | VARCHAR(50) | unico, financiado |
| `meses_financiamiento` | INTEGER | Meses si es financiado |
| `pago_mensual` | DECIMAL | Cuota mensual |
| `total_pagado` | DECIMAL | Total pagado hasta ahora |
| `saldo_pendiente` | DECIMAL | Saldo restante |
| `estado_pago` | VARCHAR(50) | pendiente, parcial, completado |
| `codigo_acceso_cliente` | VARCHAR(100) | Código para app cliente |
| `estado` | VARCHAR(50) | activo, finalizado, cancelado |
| `comision_calculada` | DECIMAL | Comisión del vendedor |
| `comision_pagada` | BOOLEAN | Si ya se pagó comisión |

**Políticas de Pago:**
- Depósito inicial: $500 (no reembolsable)
- Segundo pago: $1,000 en 10 días
- Pagos mensuales: Mínimo $500
- Pago completo: 15 días antes del evento
- Tarjetas: Solo hasta 30 días antes (+3.8%)

**Estados de Pago:**
- `pendiente` - Sin pagos o solo depósito
- `parcial` - Pagos parciales realizados
- `completado` - Pagado en su totalidad

---

### 🔟 CONTRATOS_SERVICIOS
Servicios incluidos en el contrato.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `contrato_id` | INTEGER | FK a contratos |
| `servicio_id` | INTEGER | FK a servicios |
| `cantidad` | INTEGER | Cantidad contratada |
| `precio_unitario` | DECIMAL | Precio acordado |
| `subtotal` | DECIMAL | Total del servicio |
| `incluido_en_paquete` | BOOLEAN | Si venía en el paquete |

**Lógica:**
- Copia de servicios de la oferta
- Puede actualizarse si cliente agrega más

---

### 1️⃣1️⃣ PAGOS
Registro de todos los pagos realizados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `contrato_id` | INTEGER | FK a contratos |
| `monto` | DECIMAL | Monto del pago |
| `metodo_pago` | VARCHAR(50) | Efectivo, Transferencia, Tarjeta |
| `tipo_tarjeta` | VARCHAR(50) | Visa, MasterCard |
| `recargo_tarjeta` | DECIMAL | 3.8% si es tarjeta |
| `monto_total` | DECIMAL | Monto + recargo |
| `numero_referencia` | VARCHAR(100) | Referencia del pago |
| `estado` | VARCHAR(50) | completado, pendiente, fallido |
| `fecha_pago` | TIMESTAMP | Fecha del pago |
| `registrado_por` | INTEGER | FK a vendedor que registró |

**Trigger Automático:**
Al insertar un pago, se actualiza automáticamente:
- `total_pagado` en contratos
- `saldo_pendiente` en contratos
- `estado_pago` en contratos

---

### 1️⃣2️⃣ EVENTOS
Eventos asociados a contratos firmados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `contrato_id` | INTEGER | FK a contratos (único) |
| `cliente_id` | INTEGER | FK a clientes |
| `nombre_evento` | VARCHAR(255) | Nombre del evento |
| `fecha_evento` | DATE | Fecha programada |
| `cantidad_invitados_confirmados` | INTEGER | Invitados finales |
| `estado` | VARCHAR(50) | en_proceso, finalizado, cancelado |
| `detalles_comida` | TEXT | JSON con selección |
| `detalles_bebidas` | TEXT | JSON con selección |
| `detalles_decoracion` | TEXT | JSON con opciones |
| `detalles_musica` | TEXT | Preferencias |
| `seating_chart` | TEXT | JSON distribución mesas |
| `instrucciones_especiales` | TEXT | Notas especiales |

**Lógica:**
- Se crea automáticamente al firmar contrato
- Cliente puede actualizar detalles desde su app
- Vendedor puede ver todo desde su panel

---

### 1️⃣3️⃣ SOLICITUDES_CLIENTE
Solicitudes de cambios por parte de clientes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `contrato_id` | INTEGER | FK a contratos |
| `cliente_id` | INTEGER | FK a clientes |
| `tipo_solicitud` | VARCHAR(50) | Tipo de solicitud |
| `invitados_adicionales` | INTEGER | Si agrega invitados |
| `servicio_id` | INTEGER | Si agrega servicio |
| `cantidad_servicio` | INTEGER | Cantidad del servicio |
| `detalles_solicitud` | TEXT | Descripción |
| `costo_adicional` | DECIMAL | Costo calculado |
| `estado` | VARCHAR(50) | pendiente, aprobada, rechazada |
| `motivo_rechazo` | TEXT | Si fue rechazada |
| `respondido_por` | INTEGER | FK a vendedor |

**Tipos de Solicitud:**
- `agregar_invitados` - Más invitados al evento
- `agregar_servicio` - Servicio adicional
- `modificar_detalles` - Cambios en configuración

**Flujo:**
1. Cliente solicita desde su app
2. Queda pendiente de aprobación
3. Vendedor revisa y aprueba/rechaza
4. Si aprueba → se actualiza contrato automáticamente
5. Se genera nuevo PDF con cambios

---

### 1️⃣4️⃣ MENSAJES
Sistema de chat entre clientes y vendedores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `contrato_id` | INTEGER | FK a contratos |
| `remitente_tipo` | VARCHAR(50) | cliente, vendedor |
| `remitente_id` | INTEGER | ID del remitente |
| `destinatario_tipo` | VARCHAR(50) | cliente, vendedor |
| `destinatario_id` | INTEGER | ID del destinatario |
| `mensaje` | TEXT | Contenido del mensaje |
| `leido` | BOOLEAN | Si fue leído |
| `fecha_envio` / `fecha_lectura` | TIMESTAMP | Timestamps |

---

### 1️⃣5️⃣ CONFIGURACION_SISTEMA
Configuración global del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `clave` | VARCHAR(100) | Clave única de configuración |
| `valor` | TEXT | Valor de la configuración |
| `tipo` | VARCHAR(50) | porcentaje, monto, texto, json |
| `descripcion` | TEXT | Descripción |

**Configuraciones:**
- `impuesto_iva` → 7.00%
- `tarifa_servicio` → 18.00%
- `deposito_inicial` → $500
- `pago_segundo` → $1,000
- `recargo_tarjeta` → 3.8%
- `comision_vendedor_default` → 10%

---

### 1️⃣6️⃣ HISTORIAL_CAMBIOS_PRECIOS
Auditoría de cambios de precios en negociaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `oferta_id` | INTEGER | FK a ofertas (opcional) |
| `contrato_id` | INTEGER | FK a contratos (opcional) |
| `tipo_entidad` | VARCHAR(50) | servicio, paquete, descuento |
| `entidad_id` | INTEGER | ID de la entidad modificada |
| `precio_original` | DECIMAL | Precio original |
| `precio_nuevo` | DECIMAL | Precio negociado |
| `motivo` | TEXT | Razón del cambio |
| `modificado_por` | INTEGER | FK a vendedor |
| `fecha_cambio` | TIMESTAMP | Fecha del cambio |

**Propósito:**
- Registro de todas las negociaciones
- Auditoría de descuentos
- Análisis de flexibilidad de precios

---

## 🔄 Relaciones Clave

### Vendedor → Cliente → Oferta → Contrato
```
1 Vendedor : N Clientes
1 Cliente : N Ofertas
1 Oferta : 1 Contrato (si acepta)
1 Contrato : 1 Evento
1 Contrato : N Pagos
```

### Paquetes ↔ Servicios
```
N Paquetes : N Servicios (muchos a muchos)
Tabla intermedia: paquetes_servicios
```

### Contrato → Solicitudes
```
1 Contrato : N Solicitudes_Cliente
1 Vendedor aprueba/rechaza N Solicitudes
```

---

## 🎯 Reglas de Negocio Implementadas

### 1. Cálculo Automático de Precios
- Precio base + temporada + servicios adicionales
- IVA 7% + Service Fee 18%
- Todo calculado automáticamente

### 2. Sistema de Pagos
- Trigger actualiza automáticamente saldos
- Cambia estado de pago cuando está completo
- Calcula y marca comisiones de vendedores

### 3. Actualización de Timestamps
- Triggers automáticos en clientes, contratos, eventos
- Auditoría completa de cambios

### 4. Comisiones de Vendedores
- Se marcan cuando el pago está completado
- Se actualizan estadísticas del vendedor
- Solo se pagan si el contrato está pagado

### 5. Validaciones
- Códigos únicos para vendedores, ofertas, contratos
- Emails únicos para vendedores
- FK constraints para integridad referencial

---

## 📊 Estadísticas y Reportes

### Dashboard Vendedor
```sql
-- Mis contratos activos
SELECT * FROM vista_contratos_completos
WHERE vendedor_id = {id} AND estado_contrato = 'activo';

-- Mis comisiones
SELECT SUM(comision_calculada) as total_comisiones
FROM contratos
WHERE vendedor_id = {id} AND estado_pago = 'completado';
```

### Dashboard Administrador
```sql
-- Eventos del mes
SELECT COUNT(*) FROM eventos
WHERE fecha_evento BETWEEN '2025-11-01' AND '2025-11-30';

-- Ingresos del mes
SELECT SUM(total_contrato) FROM contratos
WHERE estado_pago = 'completado'
AND fecha_firma BETWEEN '2025-11-01' AND '2025-11-30';
```

---

**Documentación completa del modelo de datos v1.0**  
**Última actualización**: Noviembre 2025

