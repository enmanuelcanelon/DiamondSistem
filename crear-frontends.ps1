# Script para crear los frontends restantes (cliente, manager, gerente)
# Basado en la estructura de frontend-vendedor

Write-Host "🚀 Creando frontends restantes..." -ForegroundColor Cyan

# Configuración de cada frontend
$frontends = @(
    @{ name = "frontend-cliente"; port = 5174; title = "Cliente" },
    @{ name = "frontend-manager"; port = 5175; title = "Manager" },
    @{ name = "frontend-gerente"; port = 5176; title = "Gerente" }
)

foreach ($frontend in $frontends) {
    $name = $frontend.name
    $port = $frontend.port
    $title = $frontend.title
    
    Write-Host "`n📦 Creando $name (Puerto $port)..." -ForegroundColor Yellow
    
    # Crear estructura de carpetas
    New-Item -ItemType Directory -Path "$name\src\pages" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\src\components" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\src\utils" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\public" -Force | Out-Null
    
    # Copiar package.json y modificar
    Copy-Item -Path "frontend-vendedor\package.json" -Destination "$name\package.json" -Force
    (Get-Content "$name\package.json") -replace '"name": "frontend-vendedor"', "`"name`": `"$name`"" | Set-Content "$name\package.json"
    
    # Copiar vite.config.js y modificar puerto
    Copy-Item -Path "frontend-vendedor\vite.config.js" -Destination "$name\vite.config.js" -Force
    (Get-Content "$name\vite.config.js") -replace "port: 5173", "port: $port" | Set-Content "$name\vite.config.js"
    
    # Copiar otros archivos de configuración
    Copy-Item -Path "frontend-vendedor\index.html" -Destination "$name\index.html" -Force
    (Get-Content "$name\index.html") -replace "Panel de Vendedor", "Panel de $title" | Set-Content "$name\index.html"
    (Get-Content "$name\index.html") -replace "DiamondSistem - Vendedor", "DiamondSistem - $title" | Set-Content "$name\index.html"
    
    Copy-Item -Path "frontend-vendedor\tailwind.config.js" -Destination "$name\tailwind.config.js" -Force
    Copy-Item -Path "frontend-vendedor\postcss.config.js" -Destination "$name\postcss.config.js" -Force
    Copy-Item -Path "frontend-vendedor\.gitignore" -Destination "$name\.gitignore" -Force
    
    # Copiar main.jsx
    Copy-Item -Path "frontend-vendedor\src\main.jsx" -Destination "$name\src\main.jsx" -Force
    
    # Copiar utils
    if (Test-Path "frontend-vendedor\src\utils") {
        Copy-Item -Path "frontend-vendedor\src\utils\*" -Destination "$name\src\utils\" -Recurse -Force
    }
    
    # Copiar public
    if (Test-Path "frontend-vendedor\public") {
        Copy-Item -Path "frontend-vendedor\public\*" -Destination "$name\public\" -Recurse -Force
    }
    
    Write-Host "✅ $name creado" -ForegroundColor Green
}

Write-Host "`n✨ Proceso completado!" -ForegroundColor Cyan
Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Copiar páginas específicas de cada rol"
Write-Host "   2. Crear App.jsx con rutas específicas"
Write-Host "   3. Ejecutar script de actualización de imports"

# Basado en la estructura de frontend-vendedor

Write-Host "🚀 Creando frontends restantes..." -ForegroundColor Cyan

# Configuración de cada frontend
$frontends = @(
    @{ name = "frontend-cliente"; port = 5174; title = "Cliente" },
    @{ name = "frontend-manager"; port = 5175; title = "Manager" },
    @{ name = "frontend-gerente"; port = 5176; title = "Gerente" }
)

foreach ($frontend in $frontends) {
    $name = $frontend.name
    $port = $frontend.port
    $title = $frontend.title
    
    Write-Host "`n📦 Creando $name (Puerto $port)..." -ForegroundColor Yellow
    
    # Crear estructura de carpetas
    New-Item -ItemType Directory -Path "$name\src\pages" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\src\components" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\src\utils" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\public" -Force | Out-Null
    
    # Copiar package.json y modificar
    Copy-Item -Path "frontend-vendedor\package.json" -Destination "$name\package.json" -Force
    (Get-Content "$name\package.json") -replace '"name": "frontend-vendedor"', "`"name`": `"$name`"" | Set-Content "$name\package.json"
    
    # Copiar vite.config.js y modificar puerto
    Copy-Item -Path "frontend-vendedor\vite.config.js" -Destination "$name\vite.config.js" -Force
    (Get-Content "$name\vite.config.js") -replace "port: 5173", "port: $port" | Set-Content "$name\vite.config.js"
    
    # Copiar otros archivos de configuración
    Copy-Item -Path "frontend-vendedor\index.html" -Destination "$name\index.html" -Force
    (Get-Content "$name\index.html") -replace "Panel de Vendedor", "Panel de $title" | Set-Content "$name\index.html"
    (Get-Content "$name\index.html") -replace "DiamondSistem - Vendedor", "DiamondSistem - $title" | Set-Content "$name\index.html"
    
    Copy-Item -Path "frontend-vendedor\tailwind.config.js" -Destination "$name\tailwind.config.js" -Force
    Copy-Item -Path "frontend-vendedor\postcss.config.js" -Destination "$name\postcss.config.js" -Force
    Copy-Item -Path "frontend-vendedor\.gitignore" -Destination "$name\.gitignore" -Force
    
    # Copiar main.jsx
    Copy-Item -Path "frontend-vendedor\src\main.jsx" -Destination "$name\src\main.jsx" -Force
    
    # Copiar utils
    if (Test-Path "frontend-vendedor\src\utils") {
        Copy-Item -Path "frontend-vendedor\src\utils\*" -Destination "$name\src\utils\" -Recurse -Force
    }
    
    # Copiar public
    if (Test-Path "frontend-vendedor\public") {
        Copy-Item -Path "frontend-vendedor\public\*" -Destination "$name\public\" -Recurse -Force
    }
    
    Write-Host "✅ $name creado" -ForegroundColor Green
}

Write-Host "`n✨ Proceso completado!" -ForegroundColor Cyan
Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Copiar páginas específicas de cada rol"
Write-Host "   2. Crear App.jsx con rutas específicas"
Write-Host "   3. Ejecutar script de actualización de imports"

# Basado en la estructura de frontend-vendedor

Write-Host "🚀 Creando frontends restantes..." -ForegroundColor Cyan

# Configuración de cada frontend
$frontends = @(
    @{ name = "frontend-cliente"; port = 5174; title = "Cliente" },
    @{ name = "frontend-manager"; port = 5175; title = "Manager" },
    @{ name = "frontend-gerente"; port = 5176; title = "Gerente" }
)

foreach ($frontend in $frontends) {
    $name = $frontend.name
    $port = $frontend.port
    $title = $frontend.title
    
    Write-Host "`n📦 Creando $name (Puerto $port)..." -ForegroundColor Yellow
    
    # Crear estructura de carpetas
    New-Item -ItemType Directory -Path "$name\src\pages" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\src\components" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\src\utils" -Force | Out-Null
    New-Item -ItemType Directory -Path "$name\public" -Force | Out-Null
    
    # Copiar package.json y modificar
    Copy-Item -Path "frontend-vendedor\package.json" -Destination "$name\package.json" -Force
    (Get-Content "$name\package.json") -replace '"name": "frontend-vendedor"', "`"name`": `"$name`"" | Set-Content "$name\package.json"
    
    # Copiar vite.config.js y modificar puerto
    Copy-Item -Path "frontend-vendedor\vite.config.js" -Destination "$name\vite.config.js" -Force
    (Get-Content "$name\vite.config.js") -replace "port: 5173", "port: $port" | Set-Content "$name\vite.config.js"
    
    # Copiar otros archivos de configuración
    Copy-Item -Path "frontend-vendedor\index.html" -Destination "$name\index.html" -Force
    (Get-Content "$name\index.html") -replace "Panel de Vendedor", "Panel de $title" | Set-Content "$name\index.html"
    (Get-Content "$name\index.html") -replace "DiamondSistem - Vendedor", "DiamondSistem - $title" | Set-Content "$name\index.html"
    
    Copy-Item -Path "frontend-vendedor\tailwind.config.js" -Destination "$name\tailwind.config.js" -Force
    Copy-Item -Path "frontend-vendedor\postcss.config.js" -Destination "$name\postcss.config.js" -Force
    Copy-Item -Path "frontend-vendedor\.gitignore" -Destination "$name\.gitignore" -Force
    
    # Copiar main.jsx
    Copy-Item -Path "frontend-vendedor\src\main.jsx" -Destination "$name\src\main.jsx" -Force
    
    # Copiar utils
    if (Test-Path "frontend-vendedor\src\utils") {
        Copy-Item -Path "frontend-vendedor\src\utils\*" -Destination "$name\src\utils\" -Recurse -Force
    }
    
    # Copiar public
    if (Test-Path "frontend-vendedor\public") {
        Copy-Item -Path "frontend-vendedor\public\*" -Destination "$name\public\" -Recurse -Force
    }
    
    Write-Host "✅ $name creado" -ForegroundColor Green
}

Write-Host "`n✨ Proceso completado!" -ForegroundColor Cyan
Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Copiar páginas específicas de cada rol"
Write-Host "   2. Crear App.jsx con rutas específicas"
Write-Host "   3. Ejecutar script de actualización de imports"













