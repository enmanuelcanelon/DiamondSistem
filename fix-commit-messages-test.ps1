# Script de PRUEBA para corregir la codificación de mensajes de commit
# Procesa todos los commits pero verifica solo los últimos 10

Write-Host "================================================"
Write-Host "PRUEBA: Corrector de mensajes de commit"
Write-Host "================================================"
Write-Host ""

# Verificar que estamos en un repositorio git
if (-not (Test-Path .git)) {
    Write-Host "ERROR: No estás en un repositorio git."
    exit 1
}

$totalCommits = [int](git rev-list --count HEAD)
$testRange = 10

Write-Host "Commits totales: $totalCommits"
Write-Host "NOTA: Se procesarán TODOS los commits, pero verificaremos solo los últimos $testRange"
Write-Host ""

# Crear script temporal para el filtro
# Leer desde stdin correctamente usando StreamReader
$filterScriptContent = @'
# Leer todo el input desde stdin usando StreamReader para mejor compatibilidad
$inputStream = [System.Console]::OpenStandardInput()
$reader = New-Object System.IO.StreamReader($inputStream, [System.Text.Encoding]::UTF8)
$msg = $reader.ReadToEnd()
$reader.Close()
$inputStream.Close()

# Correcciones de codificación UTF-8
# Nota: Los caracteres pueden estar en diferentes codificaciones, probamos múltiples variantes
$msg = $msg -replace 'Actualizaci[Ã\xC3][³\xB3]n', 'Actualización'
$msg = $msg -replace 'dise[Ã\xC3][±\xB1]o', 'diseño'
$msg = $msg -replace 'c[Ã\xC3][³\xB3]digo', 'código'
$msg = $msg -replace 'p[Ã\xC3][¡\xA1]ginas', 'páginas'
$msg = $msg -replace 'est[Ã\xC3][¡\xA1]ticos', 'estáticos'
$msg = $msg -replace 'sal[Ã\xC3][³\xB3]n', 'salón'
$msg = $msg -replace 'sal[Ã\xC3][³\xB3]nes', 'salones'
$msg = $msg -replace 't[Ã\xC3][­\xAD]tulos', 'títulos'
$msg = $msg -replace 'm[Ã\xC3][º\xBA]ltiples', 'múltiples'
$msg = $msg -replace 'Consolidaci[Ã\xC3][³\xB3]n', 'Consolidación'
$msg = $msg -replace 'Optimizaci[Ã\xC3][³\xB3]n', 'Optimización'
$msg = $msg -replace 'Eliminaci[Ã\xC3][³\xB3]n', 'Eliminación'
$msg = $msg -replace 'correcci[Ã\xC3][³\xB3]n', 'corrección'
$msg = $msg -replace 'cach[Ã\xC3][©\xA9]', 'caché'
$msg = $msg -replace 'p[Ã\xC3][¡\xA1]gina', 'página'
$msg = $msg -replace 'reorganizaci[Ã\xC3][³\xB3]n', 'reorganización'
$msg = $msg -replace 'alineaci[Ã\xC3][³\xB3]n', 'alineación'
$msg = $msg -replace 'hac[Ã\xC3][­\xAD]a', 'hacía'

# También intentar reemplazos directos por si acaso
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

[System.Console]::Out.Write($msg)
'@

# Crear script en el directorio actual (más confiable que TEMP)
$filterScriptPath = Join-Path $PWD "git-msg-filter-temp.ps1"
$filterScriptContent | Out-File -FilePath $filterScriptPath -Encoding UTF8

# Verificar que el archivo se creó
if (-not (Test-Path $filterScriptPath)) {
    Write-Host "ERROR: No se pudo crear el script temporal en: $filterScriptPath"
    exit 1
}
Write-Host "Script temporal creado en: $filterScriptPath"

Write-Host "ADVERTENCIA:"
Write-Host "Este script reescribirá TODOS los commits ($totalCommits commits)."
Write-Host "Esto cambiará los hashes de todos los commits."
Write-Host "Después verificaremos solo los últimos $testRange para confirmar que funcionó."
Write-Host ""
Write-Host "Ejecutando prueba..."
Write-Host ""

# Configurar encoding para git
$env:LANG = "C.UTF-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Usar git filter-branch
# Usar ruta absoluta con formato correcto para Windows
$fullPath = (Resolve-Path $filterScriptPath).Path.Replace('\', '/')
$filterCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$fullPath`""
Write-Host "Comando de filtro: $filterCommand"
Write-Host "Ruta del script: $fullPath"

Write-Host "Ejecutando git filter-branch (esto puede tardar varios minutos)..."
Write-Host ""

try {
    git filter-branch -f --msg-filter $filterCommand -- --all 2>&1 | Tee-Object -Variable output
    
    $exitCode = $LASTEXITCODE
    
    # Limpiar script temporal (al final, después de verificar)
    # No limpiar todavía, lo haremos después de verificar
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "================================================"
        Write-Host "¡Proceso completado!"
        Write-Host "================================================"
        Write-Host ""
        Write-Host "Todos los commits han sido procesados."
        Write-Host ""
        Write-Host "VERIFICANDO los últimos $testRange commits:"
        Write-Host "================================================"
        git log --oneline -$testRange
        Write-Host "================================================"
        Write-Host ""
        Write-Host "¿Los mensajes se ven correctos? (S/N)"
        Write-Host "Si ves caracteres como 'Actualización', 'diseño', 'código' correctamente, entonces funcionó."
        Write-Host ""
        Write-Host "Si todo se ve bien:"
        Write-Host "  git push --force origin main"
        Write-Host ""
        Write-Host "Si algo salió mal, puedes deshacer:"
        Write-Host "  git reset --hard backup-before-fix"
    } else {
        Write-Host ""
        Write-Host "ERROR: El proceso falló con código de salida $exitCode"
        Write-Host "Revisa los mensajes de error arriba."
        Write-Host ""
        Write-Host "Para deshacer: git reset --hard backup-before-fix"
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Excepción durante la ejecución:"
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Para deshacer: git reset --hard backup-before-fix"
} finally {
    # Limpiar script temporal
    if (Test-Path $filterScriptPath) {
        Remove-Item $filterScriptPath -ErrorAction SilentlyContinue
        Write-Host "Script temporal eliminado."
    }
}
