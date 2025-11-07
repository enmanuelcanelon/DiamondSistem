# Script para ejecutar todos los frontends en paralelo
# Requiere: tener npm instalado y haber ejecutado npm install en cada frontend

Write-Host "Iniciando todos los frontends..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend este corriendo
Write-Host "Asegurate de que el backend este corriendo en otra terminal:" -ForegroundColor Yellow
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""

# Iniciar cada frontend en una nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-vendedor'; Write-Host 'Frontend Vendedor (Puerto 5173)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-cliente'; Write-Host 'Frontend Cliente (Puerto 5174)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-manager'; Write-Host 'Frontend Manager (Puerto 5175)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-gerente'; Write-Host 'Frontend Gerente (Puerto 5176)' -ForegroundColor Cyan; npm run dev"

Write-Host "Todos los frontends iniciados en ventanas separadas" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "   Vendedor:  http://localhost:5173" -ForegroundColor Gray
Write-Host "   Cliente:   http://localhost:5174" -ForegroundColor Gray
Write-Host "   Manager:   http://localhost:5175" -ForegroundColor Gray
Write-Host "   Gerente:   http://localhost:5176" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener, cierra las ventanas de PowerShell" -ForegroundColor Yellow


Write-Host "Iniciando todos los frontends..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend este corriendo
Write-Host "Asegurate de que el backend este corriendo en otra terminal:" -ForegroundColor Yellow
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""

# Iniciar cada frontend en una nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-vendedor'; Write-Host 'Frontend Vendedor (Puerto 5173)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-cliente'; Write-Host 'Frontend Cliente (Puerto 5174)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-manager'; Write-Host 'Frontend Manager (Puerto 5175)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-gerente'; Write-Host 'Frontend Gerente (Puerto 5176)' -ForegroundColor Cyan; npm run dev"

Write-Host "Todos los frontends iniciados en ventanas separadas" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "   Vendedor:  http://localhost:5173" -ForegroundColor Gray
Write-Host "   Cliente:   http://localhost:5174" -ForegroundColor Gray
Write-Host "   Manager:   http://localhost:5175" -ForegroundColor Gray
Write-Host "   Gerente:   http://localhost:5176" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener, cierra las ventanas de PowerShell" -ForegroundColor Yellow


Write-Host "Iniciando todos los frontends..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend este corriendo
Write-Host "Asegurate de que el backend este corriendo en otra terminal:" -ForegroundColor Yellow
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""

# Iniciar cada frontend en una nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-vendedor'; Write-Host 'Frontend Vendedor (Puerto 5173)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-cliente'; Write-Host 'Frontend Cliente (Puerto 5174)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-manager'; Write-Host 'Frontend Manager (Puerto 5175)' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-gerente'; Write-Host 'Frontend Gerente (Puerto 5176)' -ForegroundColor Cyan; npm run dev"

Write-Host "Todos los frontends iniciados en ventanas separadas" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "   Vendedor:  http://localhost:5173" -ForegroundColor Gray
Write-Host "   Cliente:   http://localhost:5174" -ForegroundColor Gray
Write-Host "   Manager:   http://localhost:5175" -ForegroundColor Gray
Write-Host "   Gerente:   http://localhost:5176" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener, cierra las ventanas de PowerShell" -ForegroundColor Yellow
