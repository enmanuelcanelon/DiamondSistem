# Script para crear frontend-cliente basado en frontend-vendedor

Write-Host "🚀 Creando frontend-cliente..." -ForegroundColor Cyan

# Crear estructura
New-Item -ItemType Directory -Path "frontend-cliente\src\pages" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\src\components" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\src\utils" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\public" -Force | Out-Null

# Copiar archivos base
Copy-Item -Path "frontend-vendedor\package.json" -Destination "frontend-cliente\package.json" -Force
$pkg = Get-Content "frontend-cliente\package.json" -Raw
$pkg = $pkg -replace '"name": "frontend-vendedor"', '"name": "frontend-cliente"'
Set-Content -Path "frontend-cliente\package.json" -Value $pkg -NoNewline

Copy-Item -Path "frontend-vendedor\vite.config.js" -Destination "frontend-cliente\vite.config.js" -Force
$vite = Get-Content "frontend-cliente\vite.config.js" -Raw
$vite = $vite -replace "port: 5173", "port: 5174"
Set-Content -Path "frontend-cliente\vite.config.js" -Value $vite -NoNewline

Copy-Item -Path "frontend-vendedor\index.html" -Destination "frontend-cliente\index.html" -Force
$html = Get-Content "frontend-cliente\index.html" -Raw
$html = $html -replace "Panel de Vendedor", "Panel de Cliente"
$html = $html -replace "DiamondSistem - Vendedor", "DiamondSistem - Cliente"
Set-Content -Path "frontend-cliente\index.html" -Value $html -NoNewline

Copy-Item -Path "frontend-vendedor\tailwind.config.js" -Destination "frontend-cliente\tailwind.config.js" -Force
Copy-Item -Path "frontend-vendedor\postcss.config.js" -Destination "frontend-cliente\postcss.config.js" -Force
Copy-Item -Path "frontend-vendedor\.gitignore" -Destination "frontend-cliente\.gitignore" -Force
Copy-Item -Path "frontend-vendedor\src\main.jsx" -Destination "frontend-cliente\src\main.jsx" -Force

if (Test-Path "frontend-vendedor\src\utils") {
    Copy-Item -Path "frontend-vendedor\src\utils\*" -Destination "frontend-cliente\src\utils\" -Recurse -Force
}
if (Test-Path "frontend-vendedor\public") {
    Copy-Item -Path "frontend-vendedor\public\*" -Destination "frontend-cliente\public\" -Recurse -Force
}

Write-Host "✅ frontend-cliente creado" -ForegroundColor Green


Write-Host "🚀 Creando frontend-cliente..." -ForegroundColor Cyan

# Crear estructura
New-Item -ItemType Directory -Path "frontend-cliente\src\pages" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\src\components" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\src\utils" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\public" -Force | Out-Null

# Copiar archivos base
Copy-Item -Path "frontend-vendedor\package.json" -Destination "frontend-cliente\package.json" -Force
$pkg = Get-Content "frontend-cliente\package.json" -Raw
$pkg = $pkg -replace '"name": "frontend-vendedor"', '"name": "frontend-cliente"'
Set-Content -Path "frontend-cliente\package.json" -Value $pkg -NoNewline

Copy-Item -Path "frontend-vendedor\vite.config.js" -Destination "frontend-cliente\vite.config.js" -Force
$vite = Get-Content "frontend-cliente\vite.config.js" -Raw
$vite = $vite -replace "port: 5173", "port: 5174"
Set-Content -Path "frontend-cliente\vite.config.js" -Value $vite -NoNewline

Copy-Item -Path "frontend-vendedor\index.html" -Destination "frontend-cliente\index.html" -Force
$html = Get-Content "frontend-cliente\index.html" -Raw
$html = $html -replace "Panel de Vendedor", "Panel de Cliente"
$html = $html -replace "DiamondSistem - Vendedor", "DiamondSistem - Cliente"
Set-Content -Path "frontend-cliente\index.html" -Value $html -NoNewline

Copy-Item -Path "frontend-vendedor\tailwind.config.js" -Destination "frontend-cliente\tailwind.config.js" -Force
Copy-Item -Path "frontend-vendedor\postcss.config.js" -Destination "frontend-cliente\postcss.config.js" -Force
Copy-Item -Path "frontend-vendedor\.gitignore" -Destination "frontend-cliente\.gitignore" -Force
Copy-Item -Path "frontend-vendedor\src\main.jsx" -Destination "frontend-cliente\src\main.jsx" -Force

if (Test-Path "frontend-vendedor\src\utils") {
    Copy-Item -Path "frontend-vendedor\src\utils\*" -Destination "frontend-cliente\src\utils\" -Recurse -Force
}
if (Test-Path "frontend-vendedor\public") {
    Copy-Item -Path "frontend-vendedor\public\*" -Destination "frontend-cliente\public\" -Recurse -Force
}

Write-Host "✅ frontend-cliente creado" -ForegroundColor Green


Write-Host "🚀 Creando frontend-cliente..." -ForegroundColor Cyan

# Crear estructura
New-Item -ItemType Directory -Path "frontend-cliente\src\pages" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\src\components" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\src\utils" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend-cliente\public" -Force | Out-Null

# Copiar archivos base
Copy-Item -Path "frontend-vendedor\package.json" -Destination "frontend-cliente\package.json" -Force
$pkg = Get-Content "frontend-cliente\package.json" -Raw
$pkg = $pkg -replace '"name": "frontend-vendedor"', '"name": "frontend-cliente"'
Set-Content -Path "frontend-cliente\package.json" -Value $pkg -NoNewline

Copy-Item -Path "frontend-vendedor\vite.config.js" -Destination "frontend-cliente\vite.config.js" -Force
$vite = Get-Content "frontend-cliente\vite.config.js" -Raw
$vite = $vite -replace "port: 5173", "port: 5174"
Set-Content -Path "frontend-cliente\vite.config.js" -Value $vite -NoNewline

Copy-Item -Path "frontend-vendedor\index.html" -Destination "frontend-cliente\index.html" -Force
$html = Get-Content "frontend-cliente\index.html" -Raw
$html = $html -replace "Panel de Vendedor", "Panel de Cliente"
$html = $html -replace "DiamondSistem - Vendedor", "DiamondSistem - Cliente"
Set-Content -Path "frontend-cliente\index.html" -Value $html -NoNewline

Copy-Item -Path "frontend-vendedor\tailwind.config.js" -Destination "frontend-cliente\tailwind.config.js" -Force
Copy-Item -Path "frontend-vendedor\postcss.config.js" -Destination "frontend-cliente\postcss.config.js" -Force
Copy-Item -Path "frontend-vendedor\.gitignore" -Destination "frontend-cliente\.gitignore" -Force
Copy-Item -Path "frontend-vendedor\src\main.jsx" -Destination "frontend-cliente\src\main.jsx" -Force

if (Test-Path "frontend-vendedor\src\utils") {
    Copy-Item -Path "frontend-vendedor\src\utils\*" -Destination "frontend-cliente\src\utils\" -Recurse -Force
}
if (Test-Path "frontend-vendedor\public") {
    Copy-Item -Path "frontend-vendedor\public\*" -Destination "frontend-cliente\public\" -Recurse -Force
}

Write-Host "✅ frontend-cliente creado" -ForegroundColor Green













