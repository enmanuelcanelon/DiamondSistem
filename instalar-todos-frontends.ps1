# Script para instalar dependencias en todos los frontends

Write-Host "Instalando dependencias en todos los frontends..." -ForegroundColor Cyan
Write-Host ""

$frontends = @("frontend-vendedor", "frontend-cliente", "frontend-manager", "frontend-gerente")

foreach ($frontend in $frontends) {
    if (Test-Path $frontend) {
        Write-Host "Instalando $frontend..." -ForegroundColor Yellow
        Push-Location $frontend
        npm install
        Pop-Location
        Write-Host "$frontend instalado" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "$frontend no encontrado" -ForegroundColor Red
    }
}

Write-Host "Proceso completado!" -ForegroundColor Cyan

Write-Host "Instalando dependencias en todos los frontends..." -ForegroundColor Cyan
Write-Host ""

$frontends = @("frontend-vendedor", "frontend-cliente", "frontend-manager", "frontend-gerente")

foreach ($frontend in $frontends) {
    if (Test-Path $frontend) {
        Write-Host "Instalando $frontend..." -ForegroundColor Yellow
        Push-Location $frontend
        npm install
        Pop-Location
        Write-Host "$frontend instalado" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "$frontend no encontrado" -ForegroundColor Red
    }
}

Write-Host "Proceso completado!" -ForegroundColor Cyan

Write-Host "Instalando dependencias en todos los frontends..." -ForegroundColor Cyan
Write-Host ""

$frontends = @("frontend-vendedor", "frontend-cliente", "frontend-manager", "frontend-gerente")

foreach ($frontend in $frontends) {
    if (Test-Path $frontend) {
        Write-Host "Instalando $frontend..." -ForegroundColor Yellow
        Push-Location $frontend
        npm install
        Pop-Location
        Write-Host "$frontend instalado" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "$frontend no encontrado" -ForegroundColor Red
    }
}

Write-Host "Proceso completado!" -ForegroundColor Cyan
