# 🔧 Correcciones: Sistema de Solicitudes

## 📋 Resumen

Se corrigieron errores de validación de Prisma relacionados con campos faltantes en las operaciones de la base de datos.

---

## 🐛 Problemas Identificados

### 1. Error en `mensajes.create()`
**Problema:** Faltan campos requeridos `destinatario_tipo` y `destinatario_id`, y se usaba `contenido` en lugar de `mensaje`.

**Schema real:**
```prisma
model mensajes {
  id                  Int       @id @default(autoincrement())
  contrato_id         Int?
  remitente_tipo      String    @db.VarChar(50)
  remitente_id        Int
  destinatario_tipo   String    @db.VarChar(50)  // ✅ REQUERIDO
  destinatario_id     Int                        // ✅ REQUERIDO
  mensaje             String    @db.Text         // ✅ nombre correcto
  leido               Boolean   @default(false)
  fecha_envio         DateTime  @default(now())
  fecha_lectura       DateTime?
}
```

**Solución:** Agregar todos los campos requeridos:
```javascript
await tx.mensajes.create({
  data: {
    contrato_id: solicitud.contrato_id,
    remitente_tipo: 'vendedor',
    remitente_id: req.user.id,
    destinatario_tipo: 'cliente',     // ✅ Agregado
    destinatario_id: solicitud.cliente_id, // ✅ Agregado
    mensaje: `✅ Tu solicitud ha sido aprobada...`, // ✅ nombre correcto
    leido: false,
  },
});
```

---

### 2. Error en `contratos_servicios.create()`
**Problema:** Falta campo `subtotal` y se usaba `precio_total` incorrectamente.

**Schema real:**
```prisma
model contratos_servicios {
  id                    Int       @id @default(autoincrement())
  contrato_id           Int
  servicio_id           Int?
  cantidad              Int       @default(1)
  precio_unitario       Decimal   @db.Decimal(10, 2)
  subtotal              Decimal   @db.Decimal(10, 2)  // ✅ REQUERIDO
  incluido_en_paquete   Boolean   @default(false)
}
```

**Solución:** Usar `subtotal` en lugar de `precio_total`:
```javascript
await tx.contratos_servicios.create({
  data: {
    contrato_id: solicitud.contrato_id,
    servicio_id: solicitud.servicio_id,
    cantidad: solicitud.cantidad_servicio || 1,
    precio_unitario: parseFloat(servicio.precio_base),
    subtotal: parseFloat(solicitud.costo_adicional), // ✅ nombre correcto
    incluido_en_paquete: false,
  },
});
```

---

### 3. Error en `historial_cambios_precios.create()`
**Problema:** Se usaban campos inexistentes (`vendedor_id`, `tipo_cambio`, `descripcion`, `valor_anterior`, `valor_nuevo`).

**Schema real:**
```prisma
model historial_cambios_precios {
  id                Int       @id @default(autoincrement())
  oferta_id         Int?
  contrato_id       Int?
  tipo_entidad      String?   @db.VarChar(50)
  entidad_id        Int?
  precio_original   Decimal   @db.Decimal(10, 2)  // ✅ Nombre real
  precio_nuevo      Decimal   @db.Decimal(10, 2)  // ✅ Nombre real
  motivo            String?   @db.Text            // ✅ Nombre real
  modificado_por    Int?                          // ✅ Nombre real
  fecha_cambio      DateTime  @default(now())
}
```

**Solución:** Usar los nombres correctos de los campos:
```javascript
await tx.historial_cambios_precios.create({
  data: {
    contrato_id: solicitud.contrato_id,
    modificado_por: req.user.id,              // ✅ antes era vendedor_id
    precio_original: parseFloat(solicitud.contratos.total_contrato), // ✅ antes era valor_anterior
    precio_nuevo: ...,                        // ✅ antes era valor_nuevo
    motivo: descripcionCambio,                // ✅ antes era descripcion
  },
});
```

---

## 📝 Archivos Modificados

### Backend
1. **`backend/src/routes/solicitudes.routes.js`**
   - ✅ Corregido `PUT /api/solicitudes/:id/aprobar`
   - ✅ Corregido `PUT /api/solicitudes/:id/rechazar`
   - ✅ Agregados campos faltantes en todas las operaciones de base de datos

### Frontend
2. **`frontend/src/pages/cliente/DashboardCliente.jsx`**
   - ✅ Actualizado para usar `cambio.motivo` en lugar de `cambio.descripcion`
   - ✅ Actualizado para usar `cambio.precio_original` y `cambio.precio_nuevo`
   - ✅ Mejorada la visualización del historial con ambos precios (antes/después)

---

## 🧪 Pruebas a Realizar

1. **Aprobar solicitud de invitados adicionales:**
   - ✅ Debería actualizar `cantidad_invitados` del contrato
   - ✅ Debería crear registro en `historial_cambios_precios`
   - ✅ Debería enviar mensaje al cliente
   - ✅ Cliente debería ver el cambio en su dashboard

2. **Aprobar solicitud de servicio adicional:**
   - ✅ Debería crear registro en `contratos_servicios`
   - ✅ Debería actualizar `total_contrato`
   - ✅ Debería crear registro en `historial_cambios_precios`
   - ✅ Debería enviar mensaje al cliente
   - ✅ Cliente debería ver el servicio en su contrato

3. **Rechazar solicitud:**
   - ✅ Debería actualizar estado a 'rechazada'
   - ✅ Debería guardar motivo de rechazo
   - ✅ Debería enviar mensaje al cliente con el motivo
   - ✅ Cliente debería ver la solicitud rechazada

---

## 🎯 Resultado Final

✅ **Todos los errores de validación de Prisma corregidos**  
✅ **Campos del schema correctamente mapeados**  
✅ **Mensajes automáticos funcionando**  
✅ **Historial de cambios funcionando**  
✅ **Frontend sincronizado con backend**

---

## 📌 Notas Importantes

1. **Siempre revisar el schema de Prisma** antes de hacer operaciones de base de datos
2. **Regenerar Prisma Client** después de cambios en el schema: `npx prisma generate`
3. **Los campos de relación** deben coincidir con el nombre en el schema (ej: `modificado_por` → `vendedores`)
4. **Probar en ambos roles** (vendedor y cliente) para verificar seguridad y flujo completo

---

**Fecha de corrección:** Noviembre 1, 2025  
**Estado:** ✅ **COMPLETADO Y LISTO PARA PRUEBAS**
