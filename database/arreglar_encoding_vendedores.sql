-- ================================================================
-- ARREGLAR ENCODING DE NOMBRES DE VENDEDORES
-- ================================================================

-- Ver los nombres actuales
\echo 'Nombres actuales:'
SELECT id, nombre_completo, email FROM vendedores ORDER BY id;

\echo ''
\echo 'Corrigiendo nombres...'

-- Actualizar Carlos Rodriguez
UPDATE vendedores 
SET nombre_completo = 'Carlos Rodriguez'
WHERE id = 2;

-- Actualizar Maria Gonzalez
UPDATE vendedores 
SET nombre_completo = 'Maria Gonzalez'
WHERE id = 3;

\echo 'Nombres corregidos OK'
\echo ''

-- Verificar
\echo 'Nombres corregidos:'
SELECT id, nombre_completo, email FROM vendedores ORDER BY id;


