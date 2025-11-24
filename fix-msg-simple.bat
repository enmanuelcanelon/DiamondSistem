@echo off
REM Script simple para corregir mensajes de commit
REM Lee desde stdin usando PowerShell

powershell -Command "$input = [Console]::In.ReadToEnd(); $input = $input -replace 'ActualizaciÃ³n', 'Actualización'; $input = $input -replace 'diseÃ±o', 'diseño'; $input = $input -replace 'cÃ³digo', 'código'; $input = $input -replace 'pÃ¡ginas', 'páginas'; $input = $input -replace 'estÃ¡ticos', 'estáticos'; $input = $input -replace 'salÃ³n', 'salón'; $input = $input -replace 'salÃ³nes', 'salones'; $input = $input -replace 'tÃ­tulos', 'títulos'; $input = $input -replace 'mÃºltiples', 'múltiples'; $input = $input -replace 'ConsolidaciÃ³n', 'Consolidación'; $input = $input -replace 'OptimizaciÃ³n', 'Optimización'; $input = $input -replace 'EliminaciÃ³n', 'Eliminación'; $input = $input -replace 'correcciÃ³n', 'corrección'; $input = $input -replace 'cachÃ©', 'caché'; $input = $input -replace 'pÃ¡gina', 'página'; $input = $input -replace 'reorganizaciÃ³n', 'reorganización'; $input = $input -replace 'alineaciÃ³n', 'alineación'; $input = $input -replace 'hacÃ­a', 'hacía'; [Console]::Out.Write($input)"

