-- ================================================================
-- ACTUALIZAR VENDEDORES DE CONTRATOS Y OFERTAS EXISTENTES
-- ================================================================

-- Paso 1: Ver los vendedores disponibles
SELECT 
    id, 
    nombre_completo, 
    codigo_vendedor,
    email
FROM vendedores 
WHERE id != 1  -- Excluir al administrador
ORDER BY id;

\echo ''
\echo 'Los vendedores disponibles se muestran arriba.'
\echo ''
\echo 'Que vendedor debe asignarse a los contratos?'
\echo '   - ID 2: Carlos Rodriguez (carlos@diamondsistem.com)'
\echo '   - ID 3: Maria Gonzalez (maria@diamondsistem.com)'
\echo ''

-- Paso 2: Actualizar OFERTAS (cambiar de Administrador al vendedor correcto)
-- IMPORTANTE: Reemplaza el "2" con el ID del vendedor que quieras asignar

\echo 'Actualizando ofertas...'
UPDATE ofertas 
SET vendedor_id = 2 
WHERE vendedor_id = 1;

\echo 'Ofertas actualizadas OK'
\echo ''

-- Paso 3: Actualizar CONTRATOS (cambiar de Administrador al vendedor correcto)
\echo 'Actualizando contratos...'
UPDATE contratos 
SET vendedor_id = 2 
WHERE vendedor_id = 1;

\echo 'Contratos actualizados OK'
\echo ''

-- Paso 4: Verificar que se actualizaron correctamente
\echo 'Verificando contratos actualizados:'
SELECT 
    COUNT(*) as total_contratos,
    v.nombre_completo as vendedor
FROM contratos c
JOIN vendedores v ON c.vendedor_id = v.id
GROUP BY v.nombre_completo, v.id
ORDER BY v.id;

\echo ''
\echo 'Verificando ofertas actualizadas:'
SELECT 
    COUNT(*) as total_ofertas,
    v.nombre_completo as vendedor
FROM ofertas o
JOIN vendedores v ON o.vendedor_id = v.id
GROUP BY v.nombre_completo, v.id
ORDER BY v.id;

\echo ''
\echo 'Actualizacion completada exitosamente!'
\echo 'Ahora todos los contratos y ofertas estan asignados a Carlos Rodriguez'
\echo 'Si quieres asignarlos a Maria Gonzalez (ID 3), edita este archivo'
\echo 'y cambia el "2" por "3" en las lineas UPDATE.'
\echo ''


