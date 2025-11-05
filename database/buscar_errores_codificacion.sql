-- ============================================
-- BUSCAR TODOS LOS ERRORES DE CODIFICACIÓN
-- ============================================

-- Buscar caracteres problemáticos en paquetes
SELECT 
    id, 
    nombre, 
    descripcion 
FROM paquetes 
WHERE descripcion LIKE '%Ã%'
ORDER BY nombre;

-- Buscar en servicios
SELECT 
    id, 
    nombre, 
    descripcion 
FROM servicios 
WHERE descripcion LIKE '%Ã%'
ORDER BY nombre;

-- Buscar en temporadas
SELECT 
    id, 
    nombre, 
    descripcion 
FROM temporadas 
WHERE descripcion LIKE '%Ã%'
ORDER BY nombre;




