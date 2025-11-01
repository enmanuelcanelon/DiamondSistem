-- ============================================
-- CORRECCIÓN DE ENCODING UTF-8
-- Actualizar servicios con problemas de encoding
-- ============================================

-- Corregir "Decoración Plus"
UPDATE servicios 
SET nombre = 'Decoración Plus'
WHERE nombre LIKE '%Decoraci%n Plus%';

-- Corregir "Número Lumínico"
UPDATE servicios 
SET nombre = 'Número Lumínico'
WHERE nombre LIKE '%N%mero Lum%nico%';

-- Corregir "Máquina de Humo"
UPDATE servicios 
SET nombre = 'Máquina de Humo'
WHERE nombre LIKE '%M%quina de Humo%';

-- Corregir "Máquina de Chispas"
UPDATE servicios 
SET nombre = 'Máquina de Chispas'
WHERE nombre LIKE '%M%quina de Chispas%';

-- Corregir "Champaña"
UPDATE servicios 
SET nombre = 'Champaña'
WHERE nombre LIKE '%Champ%a%' AND nombre NOT LIKE 'Champaña';

-- Verificar los cambios
SELECT id, nombre, categoria 
FROM servicios 
WHERE nombre IN (
    'Decoración Plus',
    'Número Lumínico',
    'Máquina de Humo',
    'Máquina de Chispas',
    'Champaña'
)
ORDER BY nombre;

