-- Script para reiniciar a 0 las estadísticas de ventas y comisiones de los vendedores
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/reiniciar_estadisticas_vendedores.sql'

-- PASO 1: Ver estadísticas actuales de los vendedores
SELECT 
    '=== ESTADÍSTICAS ACTUALES ===' AS info;
    
SELECT 
    id,
    nombre_completo,
    codigo_vendedor,
    email,
    total_ventas,
    total_comisiones,
    comision_porcentaje
FROM vendedores
ORDER BY id;

-- PASO 2: Reiniciar total_ventas y total_comisiones a 0 para TODOS los vendedores
UPDATE vendedores
SET 
    total_ventas = 0.00,
    total_comisiones = 0.00,
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE total_ventas > 0 OR total_comisiones > 0;

-- PASO 3: Verificar que se actualizaron correctamente
SELECT 
    '=== ESTADÍSTICAS DESPUÉS DE REINICIO ===' AS info;
    
SELECT 
    id,
    nombre_completo,
    codigo_vendedor,
    total_ventas,
    total_comisiones,
    comision_porcentaje
FROM vendedores
ORDER BY id;

-- Mostrar resumen
DO $$
BEGIN
    RAISE NOTICE '✅ Estadísticas reiniciadas exitosamente';
    RAISE NOTICE 'Vendedores actualizados: %', (SELECT COUNT(*) FROM vendedores WHERE total_ventas = 0 AND total_comisiones = 0);
    RAISE NOTICE 'Total ventas acumulado: %', (SELECT SUM(total_ventas) FROM vendedores);
    RAISE NOTICE 'Total comisiones acumulado: %', (SELECT SUM(total_comisiones) FROM vendedores);
END $$;

