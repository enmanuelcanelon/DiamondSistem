-- Script más agresivo para eliminar TODOS los clientes de prueba
-- Este script eliminará todos los clientes excepto los que tienen datos reales importantes
-- 
-- ⚠️ ADVERTENCIA: Este script eliminará permanentemente los datos
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/eliminar_todos_clientes_prueba.sql'

-- PASO 1: Ver TODOS los clientes actuales
SELECT 
    '=== CLIENTES ACTUALES ===' AS info;
    
SELECT 
    id,
    nombre_completo,
    email,
    telefono,
    fecha_registro,
    vendedor_id
FROM clientes
ORDER BY id;

-- PASO 2: Ver contratos de cada cliente
SELECT 
    '=== CONTRATOS POR CLIENTE ===' AS info;
    
SELECT 
    c.id AS cliente_id,
    c.nombre_completo,
    c.email,
    COUNT(ct.id) AS cantidad_contratos,
    STRING_AGG(ct.codigo_contrato, ', ') AS codigos_contratos
FROM clientes c
LEFT JOIN contratos ct ON ct.cliente_id = c.id
GROUP BY c.id, c.nombre_completo, c.email
ORDER BY c.id;

-- PASO 3: OPCIÓN 1 - Eliminar TODOS los clientes (si estás seguro de que todos son de prueba)
-- Descomenta las siguientes líneas si quieres eliminar TODOS los clientes:

/*
-- Eliminar en orden inverso de dependencias
DELETE FROM playlist_canciones WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM mensajes WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM invitados WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM mesas WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM versiones_contratos_pdf WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM ajustes_evento WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM solicitudes_cliente;
DELETE FROM pagos WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM contratos_servicios WHERE contrato_id IN (SELECT id FROM contratos);
DELETE FROM eventos;
DELETE FROM contratos;
DELETE FROM ofertas_servicios_adicionales;
DELETE FROM ofertas;
DELETE FROM clientes;
*/

-- PASO 4: OPCIÓN 2 - Eliminar clientes específicos por ID
-- Si quieres eliminar solo clientes específicos, descomenta y ajusta los IDs:

/*
-- Ejemplo: Eliminar cliente con ID 4 (ajusta según lo que veas en el paso 1)
DELETE FROM playlist_canciones WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM mensajes WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM invitados WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM mesas WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM versiones_contratos_pdf WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM ajustes_evento WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM solicitudes_cliente WHERE cliente_id = 4;
DELETE FROM pagos WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM contratos_servicios WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);
DELETE FROM eventos WHERE cliente_id = 4;
DELETE FROM contratos WHERE cliente_id = 4;
DELETE FROM ofertas_servicios_adicionales WHERE oferta_id IN (SELECT id FROM ofertas WHERE cliente_id = 4);
DELETE FROM ofertas WHERE cliente_id = 4;
DELETE FROM clientes WHERE id = 4;
*/

-- PASO 5: OPCIÓN 3 - Eliminar por nombre o email específico
-- Si quieres eliminar por nombre o email, descomenta y ajusta:

/*
-- Ejemplo: Eliminar cliente con nombre "sadasd" o email específico
DELETE FROM playlist_canciones 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes 
        WHERE LOWER(nombre_completo) = 'sadasd' 
           OR email = 'email@ejemplo.com'
    )
);
-- Repite el mismo patrón para las demás tablas...
DELETE FROM clientes 
WHERE LOWER(nombre_completo) = 'sadasd' 
   OR email = 'email@ejemplo.com';
*/

-- PASO 6: Verificar después de eliminar
SELECT 
    '=== DESPUÉS DE ELIMINAR ===' AS info;
    
SELECT 
    'Clientes restantes' AS tipo,
    COUNT(*) AS cantidad
FROM clientes
UNION ALL
SELECT 
    'Contratos restantes',
    COUNT(*)
FROM contratos
UNION ALL
SELECT 
    'Ofertas restantes',
    COUNT(*)
FROM ofertas;

