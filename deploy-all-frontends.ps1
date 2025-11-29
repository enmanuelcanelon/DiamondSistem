# ============================================
# Script de Deployment Automático - Frontends
# Despliega todos los frontends en Vercel (PowerShell)
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deployment de frontends en Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Vercel CLI está instalado
try {
    vercel --version | Out-Null
    Write-Host "✓ Vercel CLI detectado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI no está instalado" -ForegroundColor Yellow
    Write-Host "Instalando Vercel CLI..." -ForegroundColor Blue
    npm install -g vercel
    Write-Host "✓ Vercel CLI instalado correctamente" -ForegroundColor Green
}

Write-Host ""

# Verificar login en Vercel
Write-Host "Verificando autenticación en Vercel..." -ForegroundColor Blue
try {
    vercel whoami | Out-Null
    Write-Host "✓ Autenticado en Vercel" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No estás autenticado en Vercel" -ForegroundColor Yellow
    Write-Host "Por favor, inicia sesión:" -ForegroundColor Blue
    vercel login
}

Write-Host ""

# Obtener URL del backend
Write-Host "Por favor, ingresa la URL de tu backend en Railway:" -ForegroundColor Yellow
Write-Host "(Ejemplo: https://tu-backend.up.railway.app/api)" -ForegroundColor Blue
$BACKEND_URL = Read-Host "URL del backend"

if ([string]::IsNullOrWhiteSpace($BACKEND_URL)) {
    Write-Host "❌ Error: Debes proporcionar la URL del backend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ URL del backend: $BACKEND_URL" -ForegroundColor Green
Write-Host ""

# Array de frontends a desplegar
$frontends = @(
    @{dir="frontend-administrador"; name="diamond-sistema-administrador"},
    @{dir="frontend-cliente"; name="diamond-sistema-cliente"},
    @{dir="frontend-manager"; name="diamond-sistema-manager"},
    @{dir="frontend-gerente"; name="diamond-sistema-gerente"}
)

# Función para desplegar un frontend
function Deploy-Frontend {
    param (
        [string]$dir,
        [string]$name
    )

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "Desplegando: $name" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

    Set-Location $dir

    try {
        # Configurar variable de entorno
        Write-Host "Configurando variable de entorno VITE_API_URL..." -ForegroundColor Yellow
        echo $BACKEND_URL | vercel env add VITE_API_URL production 2>$null

        # Desplegar a producción
        Write-Host "Iniciando deployment..." -ForegroundColor Yellow
        vercel --prod --yes --name $name `
            --build-env VITE_API_URL="$BACKEND_URL" `
            --env VITE_API_URL="$BACKEND_URL"

        Write-Host "✓ $name deployado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al desplegar $name" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red

        $continue = Read-Host "¿Deseas continuar con los siguientes frontends? (s/n)"
        if ($continue -ne "s" -and $continue -ne "S") {
            Write-Host "Deployment cancelado" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    }

    Set-Location ..
}

# Desplegar cada frontend
foreach ($frontend in $frontends) {
    Deploy-Frontend -dir $frontend.dir -name $frontend.name
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 ¡Deployment completado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Tus frontends están deployados en:" -ForegroundColor Blue
Write-Host ""
Write-Host "  📦 Administrador: https://diamond-sistema-administrador.vercel.app"
Write-Host "  📦 Cliente: https://diamond-sistema-cliente.vercel.app"
Write-Host "  📦 Manager: https://diamond-sistema-manager.vercel.app"
Write-Host "  📦 Gerente: https://diamond-sistema-gerente.vercel.app"
Write-Host ""
Write-Host "💡 Tip: Verifica que todos los frontends estén funcionando correctamente" -ForegroundColor Yellow
Write-Host "💡 Recuerda actualizar la configuración CORS en tu backend" -ForegroundColor Yellow
Write-Host ""
