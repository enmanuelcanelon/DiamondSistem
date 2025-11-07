# Script para actualizar imports en frontend-gerente
# Reemplaza imports relativos por @shared

$files = Get-ChildItem -Path "frontend-gerente\src" -Recurse -Include "*.jsx","*.js" | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content
    
    # Reemplazar imports de config/api
    $content = $content -replace "from ['""]\.\.\/config\/api['""]", "from '@shared/config/api'"
    $content = $content -replace "from ['""]\.\/config\/api['""]", "from '@shared/config/api'"
    
    # Reemplazar imports de store/useAuthStore
    $content = $content -replace "from ['""]\.\.\/store\/useAuthStore['""]", "from '@shared/store/useAuthStore'"
    $content = $content -replace "from ['""]\.\/store\/useAuthStore['""]", "from '@shared/store/useAuthStore'"
    
    # Reemplazar imports de utils/formatters
    $content = $content -replace "from ['""]\.\.\/utils\/formatters['""]", "from '@shared/utils/formatters'"
    $content = $content -replace "from ['""]\.\/utils\/formatters['""]", "from '@shared/utils/formatters'"
    
    # Reemplazar imports de utils/mapeoImagenes
    $content = $content -replace "from ['""]\.\.\/utils\/mapeoImagenes['""]", "from '@shared/utils/mapeoImagenes'"
    $content = $content -replace "from ['""]\.\/utils\/mapeoImagenes['""]", "from '@shared/utils/mapeoImagenes'"
    
    # Reemplazar imports de components/Chat
    $content = $content -replace "from ['""]\.\.\/components\/Chat['""]", "from '@shared/components/Chat'"
    $content = $content -replace "from ['""]\.\/components\/Chat['""]", "from '@shared/components/Chat'"
    
    # Reemplazar imports de components/ImagenSeleccion
    $content = $content -replace "from ['""]\.\.\/components\/ImagenSeleccion['""]", "from '@shared/components/ImagenSeleccion'"
    $content = $content -replace "from ['""]\.\/components\/ImagenSeleccion['""]", "from '@shared/components/ImagenSeleccion'"
    
    # Reemplazar imports de components/ErrorBoundary
    $content = $content -replace "from ['""]\.\.\/components\/ErrorBoundary['""]", "from '@shared/components/ErrorBoundary'"
    $content = $content -replace "from ['""]\.\/components\/ErrorBoundary['""]", "from '@shared/components/ErrorBoundary'"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ Actualizado: $($file.Name)"
    }
}

Write-Host "`n✨ Proceso completado"


