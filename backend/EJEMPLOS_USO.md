# 📚 EJEMPLOS DE USO - DiamondSistem API

## 🚀 GUÍA RÁPIDA PARA USAR LA API

### Prerequisitos
- Backend corriendo en `http://localhost:5000`
- Credenciales de vendedor: `ADMIN001` / `Admin123!`

---

## 📋 FLUJO COMPLETO: CREAR UNA VENTA

### PASO 1: Login del Vendedor

```bash
curl -X POST http://localhost:5000/api/auth/login/vendedor \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_vendedor": "ADMIN001",
    "password": "Admin123!"
  }'
```

**PowerShell:**
```powershell
$body = @{
    codigo_vendedor = "ADMIN001"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login/vendedor" `
  -Method POST -Body $body -ContentType "application/json"

$token = $response.token
```

---

### PASO 2: Crear Cliente

```powershell
$headers = @{Authorization = "Bearer $token"}
$clienteBody = @{
    nombre_completo = "María García"
    email = "maria.garcia@example.com"
    telefono = "3059876543"
    direccion = "123 Main St, Miami, FL"
    tipo_evento = "Quinceaños"
    como_nos_conocio = "Facebook"
} | ConvertTo-Json

$cliente = Invoke-RestMethod -Uri "http://localhost:5000/api/clientes" `
  -Method POST -Headers $headers -Body $clienteBody -ContentType "application/json"

$clienteId = $cliente.cliente.id
```

---

### PASO 3: Ver Paquetes Disponibles

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/paquetes"
```

---

### PASO 4: Calcular Precio (Preview)

```powershell
$calculoBody = @{
    paquete_id = 3
    fecha_evento = "2025-06-20"
    cantidad_invitados = 120
    servicios_adicionales = @(
        @{servicio_id = 9; cantidad = 1}
    )
    descuento = 500
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:5000/api/ofertas/calcular" `
  -Method POST -Headers $headers -Body $calculoBody -ContentType "application/json"
```

---

### PASO 5: Crear Oferta

```powershell
$ofertaBody = @{
    cliente_id = $clienteId
    paquete_id = 3
    fecha_evento = "2025-06-20"
    hora_inicio = "19:00"
    hora_fin = "01:00"
    cantidad_invitados = 120
    servicios_adicionales = @(
        @{servicio_id = 9; cantidad = 1}
    )
    descuento = 500
} | ConvertTo-Json -Depth 3

$oferta = Invoke-RestMethod -Uri "http://localhost:5000/api/ofertas" `
  -Method POST -Headers $headers -Body $ofertaBody -ContentType "application/json"

$ofertaId = $oferta.oferta.id
```

---

### PASO 6: Aceptar Oferta

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/ofertas/$ofertaId/aceptar" `
  -Method PUT -Headers $headers
```

---

### PASO 7: Crear Contrato

```powershell
$contratoBody = @{
    oferta_id = $ofertaId
    tipo_pago = "financiado"
    meses_financiamiento = 6
    nombre_evento = "Quinceaños de María"
} | ConvertTo-Json

$contrato = Invoke-RestMethod -Uri "http://localhost:5000/api/contratos" `
  -Method POST -Headers $headers -Body $contratoBody -ContentType "application/json"

$contratoId = $contrato.contrato.id
$codigoAcceso = $contrato.codigo_acceso
```

---

### PASO 8: Registrar Pagos

```powershell
# Depósito inicial
$pagoBody = @{
    contrato_id = $contratoId
    monto = 500
    metodo_pago = "Efectivo"
    notas = "Depósito inicial"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/pagos" `
  -Method POST -Headers $headers -Body $pagoBody -ContentType "application/json"
```

---

## 🔐 LOGIN DE CLIENTE

```powershell
$loginClienteBody = @{
    codigo_acceso = $codigoAcceso
} | ConvertTo-Json

$clienteResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login/cliente" `
  -Method POST -Body $loginClienteBody -ContentType "application/json"

$clienteToken = $clienteResponse.token
```

---

## 📊 CONSULTAS ÚTILES

### Ver Estadísticas de Vendedor

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/vendedores/1/stats" `
  -Headers $headers
```

### Ver Contratos del Vendedor

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/vendedores/1/contratos" `
  -Headers $headers
```

### Ver Pagos de un Contrato

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/contratos/$contratoId/pagos" `
  -Headers $headers
```

### Ver Eventos Próximos

```powershell
$fechaHoy = (Get-Date).ToString("yyyy-MM-dd")
$fecha30Dias = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")

Invoke-RestMethod -Uri "http://localhost:5000/api/eventos?fecha_desde=$fechaHoy&fecha_hasta=$fecha30Dias" `
  -Headers $headers
```

### Ver Solicitudes Pendientes

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/solicitudes/pendientes" `
  -Headers $headers
```

---

## 🧪 SCRIPT COMPLETO DE PRUEBA

```powershell
# Script completo para probar el flujo
Write-Host "=== PRUEBA COMPLETA DE DIAMONDSISTEM API ===" -ForegroundColor Green

# 1. Login
Write-Host "`n1. Login..." -ForegroundColor Cyan
$loginBody = @{codigo_vendedor="ADMIN001";password="Admin123!"} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login/vendedor" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{Authorization="Bearer $token"}
Write-Host "   Token obtenido ✓" -ForegroundColor Green

# 2. Crear Cliente
Write-Host "`n2. Creando cliente..." -ForegroundColor Cyan
$clienteBody = @{
    nombre_completo="Test User"
    email="test@example.com"
    telefono="1234567890"
    tipo_evento="Boda"
} | ConvertTo-Json
$cliente = Invoke-RestMethod -Uri "http://localhost:5000/api/clientes" -Method POST -Headers $headers -Body $clienteBody -ContentType "application/json"
Write-Host "   Cliente creado: $($cliente.cliente.nombre_completo) ✓" -ForegroundColor Green

# 3. Calcular Precio
Write-Host "`n3. Calculando precio..." -ForegroundColor Cyan
$calculoBody = @{
    paquete_id=2
    fecha_evento="2025-12-20"
    cantidad_invitados=90
    servicios_adicionales=@()
    descuento=0
} | ConvertTo-Json -Depth 3
$calculo = Invoke-RestMethod -Uri "http://localhost:5000/api/ofertas/calcular" -Method POST -Headers $headers -Body $calculoBody -ContentType "application/json"
Write-Host "   Total calculado: `$$($calculo.calculo.resumen.total) ✓" -ForegroundColor Green

# 4. Crear Oferta
Write-Host "`n4. Creando oferta..." -ForegroundColor Cyan
$ofertaBody = @{
    cliente_id=$cliente.cliente.id
    paquete_id=2
    fecha_evento="2025-12-20"
    hora_inicio="18:00"
    hora_fin="23:00"
    cantidad_invitados=90
} | ConvertTo-Json -Depth 3
$oferta = Invoke-RestMethod -Uri "http://localhost:5000/api/ofertas" -Method POST -Headers $headers -Body $ofertaBody -ContentType "application/json"
Write-Host "   Oferta creada: $($oferta.oferta.codigo_oferta) ✓" -ForegroundColor Green

# 5. Aceptar Oferta
Write-Host "`n5. Aceptando oferta..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:5000/api/ofertas/$($oferta.oferta.id)/aceptar" -Method PUT -Headers $headers
Write-Host "   Oferta aceptada ✓" -ForegroundColor Green

# 6. Crear Contrato
Write-Host "`n6. Creando contrato..." -ForegroundColor Cyan
$contratoBody = @{
    oferta_id=$oferta.oferta.id
    tipo_pago="financiado"
    meses_financiamiento=12
} | ConvertTo-Json
$contrato = Invoke-RestMethod -Uri "http://localhost:5000/api/contratos" -Method POST -Headers $headers -Body $contratoBody -ContentType "application/json"
Write-Host "   Contrato creado: $($contrato.contrato.codigo_contrato) ✓" -ForegroundColor Green
Write-Host "   Código de acceso cliente: $($contrato.codigo_acceso) ✓" -ForegroundColor Yellow

# 7. Registrar Pago
Write-Host "`n7. Registrando pago..." -ForegroundColor Cyan
$pagoBody = @{
    contrato_id=$contrato.contrato.id
    monto=500
    metodo_pago="Efectivo"
} | ConvertTo-Json
$pago = Invoke-RestMethod -Uri "http://localhost:5000/api/pagos" -Method POST -Headers $headers -Body $pagoBody -ContentType "application/json"
Write-Host "   Pago registrado: `$$($pago.pago.monto_total) ✓" -ForegroundColor Green
Write-Host "   Saldo pendiente: `$$($pago.contrato_actualizado.saldo_pendiente) ✓" -ForegroundColor Green

Write-Host "`n=== PRUEBA COMPLETADA EXITOSAMENTE ===" -ForegroundColor Green
Write-Host "`nDatos importantes:" -ForegroundColor Yellow
Write-Host "- Contrato: $($contrato.contrato.codigo_contrato)"
Write-Host "- Código Cliente: $($contrato.codigo_acceso)"
Write-Host "- Total: `$$($contrato.contrato.total_contrato)"
Write-Host "- Pagado: `$$($pago.contrato_actualizado.total_pagado)"
Write-Host "- Pendiente: `$$($pago.contrato_actualizado.saldo_pendiente)"
```

---

## 🔍 TROUBLESHOOTING

### Error: "Token inválido"
- Verifica que estés usando el header `Authorization: Bearer {token}`
- El token expira en 7 días

### Error: "Datos inválidos"
- Revisa que los campos requeridos estén presentes
- Verifica los formatos (email, teléfono, fechas)

### Error: "Database connection"
- Verifica que PostgreSQL esté corriendo
- Revisa el `.env` con las credenciales correctas

---

**¡La API está lista para usar!** 🚀

