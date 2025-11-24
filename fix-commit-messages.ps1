# Script para corregir la codificación de mensajes de commit
# Este script reescribe el historial de git para corregir caracteres mal codificados

Write-Host "================================================"
Write-Host "Corrector de mensajes de commit - Codificación UTF-8"
Write-Host "================================================"
Write-Host ""

# Verificar que estamos en un repositorio git
if (-not (Test-Path .git)) {
    Write-Host "ERROR: No estás en un repositorio git."
    exit 1
}

# Verificar número de commits
$commitCount = git rev-list --count HEAD
Write-Host "Commits encontrados: $commitCount"
Write-Host ""

# Crear script temporal para el filtro (usando formato compatible)
$filterScriptContent = @'
$msg = $input
# Correcciones de codificación UTF-8
$msg = $msg -replace 'ActualizaciÃ³n', 'Actualización'
$msg = $msg -replace 'diseÃ±o', 'diseño'
$msg = $msg -replace 'cÃ³digo', 'código'
$msg = $msg -replace 'pÃ¡ginas', 'páginas'
$msg = $msg -replace 'estÃ¡ticos', 'estáticos'
$msg = $msg -replace 'salÃ³n', 'salón'
$msg = $msg -replace 'salÃ³nes', 'salones'
$msg = $msg -replace 'tÃ­tulos', 'títulos'
$msg = $msg -replace 'mÃºltiples', 'múltiples'
$msg = $msg -replace 'ConsolidaciÃ³n', 'Consolidación'
$msg = $msg -replace 'OptimizaciÃ³n', 'Optimización'
$msg = $msg -replace 'EliminaciÃ³n', 'Eliminación'
$msg = $msg -replace 'correcciÃ³n', 'corrección'
$msg = $msg -replace 'cachÃ©', 'caché'
$msg = $msg -replace 'pÃ¡gina', 'página'
$msg = $msg -replace 'reorganizaciÃ³n', 'reorganización'
$msg = $msg -replace 'alineaciÃ³n', 'alineación'
$msg = $msg -replace 'hacÃ­a', 'hacía'
Write-Output $msg
'@

$filterScriptPath = Join-Path $env:TEMP "git-msg-filter-$(Get-Random).ps1"
$filterScriptContent | Out-File -FilePath $filterScriptPath -Encoding UTF8 -NoNewline

Write-Host "ADVERTENCIA IMPORTANTE:"
Write-Host "Este script reescribirá TODO el historial de git ($commitCount commits)."
Write-Host "Esto cambiará los hashes de todos los commits."
Write-Host "Se requerirá un FORCE PUSH a GitHub."
Write-Host ""
Write-Host "Si hay otros colaboradores, deberán hacer:"
Write-Host "  git fetch origin"
Write-Host "  git reset --hard origin/main"
Write-Host ""
Write-Host "¿Deseas continuar? (S/N)"
$response = Read-Host

if ($response -ne 'S' -and $response -ne 's' -and $response -ne 'Y' -and $response -ne 'y') {
    Write-Host "Operación cancelada."
    Remove-Item $filterScriptPath -ErrorAction SilentlyContinue
    exit 0
}

Write-Host ""
Write-Host "Procesando commits..."
Write-Host "Esto puede tardar varios minutos..."
Write-Host ""

# Configurar encoding para git
$env:LANG = "C.UTF-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Usar git filter-branch con el script de PowerShell
# En Windows, necesitamos usar la ruta completa y escapar correctamente
$fullPath = (Resolve-Path $filterScriptPath).Path
$filterCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$fullPath`""

Write-Host "Ejecutando git filter-branch..."
Write-Host "Script de filtro: $fullPath"
Write-Host ""

try {
    git filter-branch -f --msg-filter $filterCommand -- --all 2>&1 | Tee-Object -Variable output
    
    $exitCode = $LASTEXITCODE
    
    # Limpiar script temporal
    Remove-Item $filterScriptPath -ErrorAction SilentlyContinue
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "================================================"
        Write-Host "¡Proceso completado exitosamente!"
        Write-Host "================================================"
        Write-Host ""
        Write-Host "Los mensajes de commit han sido corregidos."
        Write-Host ""
        Write-Host "PRÓXIMOS PASOS:"
        Write-Host "1. Verifica los cambios con: git log --oneline -10"
        Write-Host "2. Si todo está bien, haz force push:"
        Write-Host "   git push --force origin main"
        Write-Host ""
        Write-Host "ADVERTENCIA: El force push sobrescribirá el historial en GitHub."
        Write-Host "Asegúrate de que nadie más esté trabajando en el repositorio."
    } else {
        Write-Host ""
        Write-Host "ERROR: El proceso falló con código de salida $exitCode"
        Write-Host "Revisa los mensajes de error arriba."
        Write-Host ""
        Write-Host "Si el error persiste, puedes intentar:"
        Write-Host "1. Instalar git-filter-repo (más moderno y confiable)"
        Write-Host "2. O usar git rebase interactivo manualmente"
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Excepción durante la ejecución:"
    Write-Host $_.Exception.Message
    Remove-Item $filterScriptPath -ErrorAction SilentlyContinue
}
