# Script para corregir mensajes de commit usando git-filter-repo
# Este es el metodo mas moderno y confiable

Write-Host "================================================"
Write-Host "Corrector de mensajes de commit con git-filter-repo"
Write-Host "================================================"
Write-Host ""

# Cambiar al directorio del repositorio
Set-Location "C:\Users\eac\Desktop\DiamondSistem"

# Verificar que estamos en un repositorio git
if (-not (Test-Path .git)) {
    Write-Host "ERROR: No estas en un repositorio git."
    exit 1
}

# Verificar que git-filter-repo esta instalado
try {
    $null = git filter-repo --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git-filter-repo no encontrado"
    }
} catch {
    Write-Host "ERROR: git-filter-repo no esta instalado."
    Write-Host "Instalalo con: pip install git-filter-repo"
    exit 1
}

$totalCommits = [int](git rev-list --count HEAD)
Write-Host "Commits totales: $totalCommits"
Write-Host ""

# Obtener la ruta del script Python
$pythonScript = Join-Path $PWD "fix-commits-with-filter-repo.py"
if (-not (Test-Path $pythonScript)) {
    Write-Host "ERROR: No se encontro el script Python: $pythonScript"
    exit 1
}

Write-Host "ADVERTENCIA IMPORTANTE:"
Write-Host "Este script reescribira TODO el historial de git ($totalCommits commits)."
Write-Host "Esto cambiara los hashes de todos los commits."
Write-Host "Se requerira un FORCE PUSH a GitHub."
Write-Host ""
Write-Host "Si hay otros colaboradores, deberan hacer:"
Write-Host "  git fetch origin"
Write-Host "  git reset --hard origin/main"
Write-Host ""
Write-Host "Ejecutando automaticamente..."
Write-Host ""

Write-Host ""
Write-Host "Procesando commits con git-filter-repo..."
Write-Host "Esto puede tardar varios minutos..."
Write-Host ""

# Usar git-filter-repo con la API de Python directamente
$pythonPath = (Get-Command python).Source
$directScript = Join-Path $PWD "fix-commits-filter-repo-direct.py"
$fullScriptPath = (Resolve-Path $directScript).Path

Write-Host "Ejecutando script Python con git-filter-repo API..."
Write-Host ""

try {
    # Ejecutar el script Python que usa la API de git-filter-repo directamente
    & $pythonPath $fullScriptPath 2>&1 | Tee-Object -Variable output
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "================================================"
        Write-Host "Proceso completado exitosamente!"
        Write-Host "================================================"
        Write-Host ""
        Write-Host "Los mensajes de commit han sido corregidos."
        Write-Host ""
        Write-Host "VERIFICANDO los ultimos 10 commits:"
        Write-Host "================================================"
        git log --oneline -10
        Write-Host "================================================"
        Write-Host ""
        Write-Host "PROXIMOS PASOS:"
        Write-Host "1. Verifica que los mensajes se vean correctos arriba"
        Write-Host "2. Si todo esta bien, haz force push:"
        Write-Host "   git push --force origin main"
        Write-Host ""
        Write-Host "ADVERTENCIA: El force push sobrescribira el historial en GitHub."
        Write-Host "Asegurate de que nadie mas este trabajando en el repositorio."
    } else {
        Write-Host ""
        Write-Host "ERROR: El proceso fallo con codigo de salida $exitCode"
        Write-Host "Revisa los mensajes de error arriba."
        Write-Host ""
        Write-Host "Para deshacer: git reset --hard backup-before-fix"
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Excepcion durante la ejecucion:"
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Para deshacer: git reset --hard backup-before-fix"
}
