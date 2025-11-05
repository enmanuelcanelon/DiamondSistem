-- Script para eliminar el cliente "sadasdsdfsdf" y todos sus datos relacionados
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/eliminar_cliente_sadasd.sql'

-- PASO 1: Verificar qué se va a eliminar
SELECT 
    '=== CLIENTE A ELIMINAR ===' AS info;
    
SELECT 
    id,
    nombre_completo,
    email,
    telefono,
    fecha_registro
FROM clientes
WHERE id = 4 OR LOWER(nombre_completo) LIKE '%sadasd%';

SELECT 
    '=== CONTRATOS A ELIMINAR ===' AS info;
    
SELECT 
    id,
    codigo_contrato,
    fecha_evento,
    estado,
    total_contrato
FROM contratos
WHERE cliente_id = 4;

SELECT 
    '=== OFERTAS A ELIMINAR ===' AS info;
    
SELECT 
    id,
    codigo_oferta,
    fecha_evento,
    estado,
    total_final
FROM ofertas
WHERE cliente_id = 4;

-- PASO 2: Eliminar todos los datos relacionados

-- 2.1. Eliminar playlist_canciones
DELETE FROM playlist_canciones 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.2. Eliminar mensajes
DELETE FROM mensajes 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.3. Eliminar invitados
DELETE FROM invitados 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.4. Eliminar mesas
DELETE FROM mesas 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.5. Eliminar versiones_contratos_pdf
DELETE FROM versiones_contratos_pdf 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.6. Eliminar ajustes_evento
DELETE FROM ajustes_evento 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.7. Eliminar solicitudes_cliente
DELETE FROM solicitudes_cliente 
WHERE cliente_id = 4;

-- 2.8. Eliminar pagos
DELETE FROM pagos 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.9. Eliminar contratos_servicios
DELETE FROM contratos_servicios 
WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = 4);

-- 2.10. Eliminar eventos
DELETE FROM eventos 
WHERE cliente_id = 4;

-- 2.11. Eliminar contratos
DELETE FROM contratos 
WHERE cliente_id = 4;

-- 2.12. Eliminar ofertas_servicios_adicionales
DELETE FROM ofertas_servicios_adicionales 
WHERE oferta_id IN (SELECT id FROM ofertas WHERE cliente_id = 4);

-- 2.13. Eliminar ofertas
DELETE FROM ofertas 
WHERE cliente_id = 4;

-- 2.14. Finalmente, eliminar el cliente
DELETE FROM clientes 
WHERE id = 4 OR LOWER(nombre_completo) LIKE '%sadasd%';

-- PASO 3: Verificar que se eliminó correctamente
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
    RAISE NOTICE '✅ Cliente eliminado exitosamente';
    RAISE NOTICE 'Clientes restantes: %', (SELECT COUNT(*) FROM clientes);
    RAISE NOTICE 'Contratos restantes: %', (SELECT COUNT(*) FROM contratos);
    RAISE NOTICE 'Ofertas restantes: %', (SELECT COUNT(*) FROM ofertas);
END $$;

