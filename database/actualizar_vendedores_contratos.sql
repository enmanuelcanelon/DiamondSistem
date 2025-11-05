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

ECHO '\n📋 Los vendedores disponibles se muestran arriba.\n';
ECHO '❓ ¿Qué vendedor debe asignarse a los contratos?\n';
ECHO '   - ID 2: Carlos Rodríguez (carlos@diamondsistem.com)\n';
ECHO '   - ID 3: María González (maria@diamondsistem.com)\n';

-- Paso 2: Actualizar OFERTAS (cambiar de Administrador al vendedor correcto)
-- ⚠️ IMPORTANTE: Reemplaza el "2" con el ID del vendedor que quieras asignar

\echo '\n🔄 Actualizando ofertas...'
UPDATE ofertas 
SET vendedor_id = 2 
WHERE vendedor_id = 1;

\echo '✅ Ofertas actualizadas'

-- Paso 3: Actualizar CONTRATOS (cambiar de Administrador al vendedor correcto)
\echo '\n🔄 Actualizando contratos...'
UPDATE contratos 
SET vendedor_id = 2 
WHERE vendedor_id = 1;

\echo '✅ Contratos actualizados'

-- Paso 4: Verificar que se actualizaron correctamente
\echo '\n📊 Verificando contratos actualizados:'
SELECT 
    COUNT(*) as total_contratos,
    v.nombre_completo as vendedor
FROM contratos c
JOIN vendedores v ON c.vendedor_id = v.id
GROUP BY v.nombre_completo, v.id
ORDER BY v.id;

\echo '\n📊 Verificando ofertas actualizadas:'
SELECT 
    COUNT(*) as total_ofertas,
    v.nombre_completo as vendedor
FROM ofertas o
JOIN vendedores v ON o.vendedor_id = v.id
GROUP BY v.nombre_completo, v.id
ORDER BY v.id;

\echo '\n✅ Actualización completada exitosamente!'
\echo '💡 Ahora todos los contratos y ofertas están asignados a Carlos Rodríguez'
\echo '   Si quieres asignarlos a María González (ID 3), edita este archivo'
\echo '   y cambia el "2" por "3" en las líneas UPDATE.'


