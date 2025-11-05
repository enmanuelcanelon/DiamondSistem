-- Script para eliminar clientes de prueba y toda su información relacionada
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/limpiar_datos_prueba.sql'
-- 
-- ⚠️ ADVERTENCIA: Este script eliminará permanentemente los datos de prueba
-- Asegúrate de hacer un backup antes de ejecutar

-- Paso 1: Ver qué clientes se van a eliminar (para confirmar)
SELECT 
    id,
    nombre_completo,
    email,
    telefono,
    fecha_registro
FROM clientes
WHERE 
    LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
    OR LOWER(email) LIKE '%test%'
    OR LOWER(email) LIKE '%prueba%'
    OR nombre_completo ~ '^[0-9]+$'  -- Nombres que son solo números
ORDER BY id;

-- Paso 2: Identificar IDs de clientes a eliminar
-- Guardamos los IDs en una tabla temporal para referencia
DO $$
DECLARE
    cliente_ids INTEGER[];
BEGIN
    -- Obtener IDs de clientes de prueba
    SELECT ARRAY_AGG(id) INTO cliente_ids
    FROM clientes
    WHERE 
        LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
        OR LOWER(email) LIKE '%test%'
        OR LOWER(email) LIKE '%prueba%'
        OR nombre_completo ~ '^[0-9]+$';
    
    -- Mostrar información de lo que se va a eliminar
    RAISE NOTICE 'Clientes a eliminar: %', cliente_ids;
    RAISE NOTICE 'Contratos relacionados: %', (SELECT COUNT(*) FROM contratos WHERE cliente_id = ANY(cliente_ids));
    RAISE NOTICE 'Ofertas relacionadas: %', (SELECT COUNT(*) FROM ofertas WHERE cliente_id = ANY(cliente_ids));
END $$;

-- Paso 3: Eliminar en orden inverso de dependencias (de más específico a menos específico)

-- 3.1. Eliminar playlist_canciones (relacionadas con contratos)
DELETE FROM playlist_canciones 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.2. Eliminar mensajes (relacionados con contratos)
DELETE FROM mensajes 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.3. Eliminar invitados (relacionados con contratos)
DELETE FROM invitados 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.4. Eliminar mesas (relacionadas con contratos)
DELETE FROM mesas 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.5. Eliminar versiones_contratos_pdf (relacionadas con contratos)
DELETE FROM versiones_contratos_pdf 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.6. Eliminar ajustes_evento (relacionados con contratos)
DELETE FROM ajustes_evento 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.7. Eliminar solicitudes_cliente (relacionadas con contratos y clientes)
DELETE FROM solicitudes_cliente 
WHERE cliente_id IN (
    SELECT id FROM clientes
    WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
       OR LOWER(email) LIKE '%test%'
       OR LOWER(email) LIKE '%prueba%'
       OR nombre_completo ~ '^[0-9]+$'
);

-- 3.8. Eliminar pagos (relacionados con contratos)
DELETE FROM pagos 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.9. Eliminar contratos_servicios (relacionados con contratos - CASCADE debería hacerlo, pero por seguridad)
DELETE FROM contratos_servicios 
WHERE contrato_id IN (
    SELECT id FROM contratos 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.10. Eliminar eventos (relacionados con contratos)
DELETE FROM eventos 
WHERE cliente_id IN (
    SELECT id FROM clientes
    WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
       OR LOWER(email) LIKE '%test%'
       OR LOWER(email) LIKE '%prueba%'
       OR nombre_completo ~ '^[0-9]+$'
);

-- 3.11. Eliminar contratos (relacionados con clientes)
DELETE FROM contratos 
WHERE cliente_id IN (
    SELECT id FROM clientes
    WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
       OR LOWER(email) LIKE '%test%'
       OR LOWER(email) LIKE '%prueba%'
       OR nombre_completo ~ '^[0-9]+$'
);

-- 3.12. Eliminar ofertas_servicios_adicionales (relacionadas con ofertas)
DELETE FROM ofertas_servicios_adicionales 
WHERE oferta_id IN (
    SELECT id FROM ofertas 
    WHERE cliente_id IN (
        SELECT id FROM clientes
        WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
           OR LOWER(email) LIKE '%test%'
           OR LOWER(email) LIKE '%prueba%'
           OR nombre_completo ~ '^[0-9]+$'
    )
);

-- 3.13. Eliminar ofertas (relacionadas con clientes)
DELETE FROM ofertas 
WHERE cliente_id IN (
    SELECT id FROM clientes
    WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
       OR LOWER(email) LIKE '%test%'
       OR LOWER(email) LIKE '%prueba%'
       OR nombre_completo ~ '^[0-9]+$'
);

-- 3.14. Finalmente, eliminar clientes de prueba
DELETE FROM clientes
WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
   OR LOWER(email) LIKE '%test%'
   OR LOWER(email) LIKE '%prueba%'
   OR nombre_completo ~ '^[0-9]+$';

-- Paso 4: Verificar que se eliminaron correctamente
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
FROM pagos;

-- Mostrar resumen
DO $$
BEGIN
    RAISE NOTICE '✅ Limpieza completada';
    RAISE NOTICE 'Clientes restantes: %', (SELECT COUNT(*) FROM clientes);
    RAISE NOTICE 'Contratos restantes: %', (SELECT COUNT(*) FROM contratos);
    RAISE NOTICE 'Ofertas restantes: %', (SELECT COUNT(*) FROM ofertas);
END $$;
