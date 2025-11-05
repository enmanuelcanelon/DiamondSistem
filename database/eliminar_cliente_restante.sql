-- Script para eliminar el cliente restante y todos sus datos
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/eliminar_cliente_restante.sql'

-- PASO 1: Ver qué cliente quedó
SELECT 
    '=== CLIENTE RESTANTE ===' AS info;
    
SELECT 
    id,
    nombre_completo,
    email,
    telefono,
    fecha_registro,
    vendedor_id
FROM clientes
ORDER BY id;

-- PASO 2: Ver contratos de ese cliente
SELECT 
    '=== CONTRATOS DEL CLIENTE ===' AS info;
    
SELECT 
    ct.id,
    ct.codigo_contrato,
    ct.fecha_evento,
    ct.estado,
    ct.total_contrato
FROM contratos ct
JOIN clientes c ON ct.cliente_id = c.id
ORDER BY ct.id;

-- PASO 3: Eliminar TODOS los datos relacionados con TODOS los clientes
-- (Ya que solo queda 1 cliente y parece ser de prueba)

-- 3.1. Eliminar playlist_canciones
DELETE FROM playlist_canciones 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.2. Eliminar mensajes
DELETE FROM mensajes 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.3. Eliminar invitados
DELETE FROM invitados 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.4. Eliminar mesas
DELETE FROM mesas 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.5. Eliminar versiones_contratos_pdf
DELETE FROM versiones_contratos_pdf 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.6. Eliminar ajustes_evento
DELETE FROM ajustes_evento 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.7. Eliminar solicitudes_cliente
DELETE FROM solicitudes_cliente;

-- 3.8. Eliminar pagos
DELETE FROM pagos 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.9. Eliminar contratos_servicios
DELETE FROM contratos_servicios 
WHERE contrato_id IN (SELECT id FROM contratos);

-- 3.10. Eliminar eventos
DELETE FROM eventos;

-- 3.11. Eliminar contratos
DELETE FROM contratos;

-- 3.12. Eliminar ofertas_servicios_adicionales
DELETE FROM ofertas_servicios_adicionales 
WHERE oferta_id IN (SELECT id FROM ofertas);

-- 3.13. Eliminar ofertas
DELETE FROM ofertas;

-- 3.14. Finalmente, eliminar TODOS los clientes
DELETE FROM clientes;

-- PASO 4: Verificar que todo se eliminó
SELECT 
    '=== VERIFICACIÓN FINAL ===' AS info;
    
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
FROM ofertas
UNION ALL
SELECT 
    'Eventos restantes',
    COUNT(*)
FROM eventos
UNION ALL
SELECT 
    'Pagos restantes',
    COUNT(*)
FROM pagos
UNION ALL
SELECT 
    'Invitados restantes',
    COUNT(*)
FROM invitados
UNION ALL
SELECT 
    'Mesas restantes',
    COUNT(*)
FROM mesas;

-- Mostrar resumen
DO $$
BEGIN
    RAISE NOTICE '✅ Limpieza completa finalizada';
    RAISE NOTICE 'Clientes restantes: %', (SELECT COUNT(*) FROM clientes);
    RAISE NOTICE 'Contratos restantes: %', (SELECT COUNT(*) FROM contratos);
    RAISE NOTICE 'Ofertas restantes: %', (SELECT COUNT(*) FROM ofertas);
END $$;

