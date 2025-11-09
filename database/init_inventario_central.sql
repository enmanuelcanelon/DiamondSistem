-- ============================================
-- Script para inicializar inventario_central
-- ============================================
-- Este script inicializa el inventario central con 100 unidades de cada item
-- IMPORTANTE: Ejecutar primero seeds_inventario.sql

BEGIN;

-- Insertar inventario central para todos los items activos
INSERT INTO inventario_central (item_id, cantidad_actual, cantidad_minima, fecha_actualizacion)
SELECT 
    id,
    100.00,  -- Cantidad inicial: 100 unidades
    20.00,   -- Cantidad mínima para alerta: 20 unidades
    NOW()
FROM inventario_items
WHERE activo = true
ON CONFLICT (item_id) DO NOTHING;

COMMIT;

