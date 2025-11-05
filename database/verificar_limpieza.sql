-- Script para verificar que la limpieza se hizo correctamente
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/verificar_limpieza.sql'

-- Verificar que no quedan clientes de prueba
SELECT 
    'Clientes de prueba encontrados' AS tipo,
    COUNT(*) AS cantidad
FROM clientes
WHERE 
    LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')
    OR LOWER(email) LIKE '%test%'
    OR LOWER(email) LIKE '%prueba%'
    OR nombre_completo ~ '^[0-9]+$';

-- Verificar que no quedan contratos huérfanos (sin cliente)
SELECT 
    'Contratos sin cliente' AS tipo,
    COUNT(*) AS cantidad
FROM contratos
WHERE cliente_id IS NULL OR cliente_id NOT IN (SELECT id FROM clientes);

-- Verificar que no quedan ofertas huérfanas (sin cliente)
SELECT 
    'Ofertas sin cliente' AS tipo,
    COUNT(*) AS cantidad
FROM ofertas
WHERE cliente_id IS NULL OR cliente_id NOT IN (SELECT id FROM clientes);

-- Verificar que no quedan eventos huérfanos (sin cliente)
SELECT 
    'Eventos sin cliente' AS tipo,
    COUNT(*) AS cantidad
FROM eventos
WHERE cliente_id IS NULL OR cliente_id NOT IN (SELECT id FROM clientes);

-- Verificar que no quedan pagos huérfanos (sin contrato)
SELECT 
    'Pagos sin contrato' AS tipo,
    COUNT(*) AS cantidad
FROM pagos
WHERE contrato_id IS NULL OR contrato_id NOT IN (SELECT id FROM contratos);

-- Verificar que no quedan invitados huérfanos (sin contrato)
SELECT 
    'Invitados sin contrato' AS tipo,
    COUNT(*) AS cantidad
FROM invitados
WHERE contrato_id IS NULL OR contrato_id NOT IN (SELECT id FROM contratos);

-- Verificar que no quedan mesas huérfanas (sin contrato)
SELECT 
    'Mesas sin contrato' AS tipo,
    COUNT(*) AS cantidad
FROM mesas
WHERE contrato_id IS NULL OR contrato_id NOT IN (SELECT id FROM contratos);

-- Verificar que las tablas principales están intactas
SELECT 
    'Vendedores' AS tabla,
    COUNT(*) AS cantidad
FROM vendedores
UNION ALL
SELECT 
    'Salones',
    COUNT(*)
FROM salones
UNION ALL
SELECT 
    'Paquetes',
    COUNT(*)
FROM paquetes
UNION ALL
SELECT 
    'Servicios',
    COUNT(*)
FROM servicios
UNION ALL
SELECT 
    'Temporadas',
    COUNT(*)
FROM temporadas
ORDER BY tabla;

-- Resumen final
SELECT 
    'VERIFICACION COMPLETA' AS mensaje,
    CASE 
        WHEN (SELECT COUNT(*) FROM clientes WHERE LOWER(nombre_completo) IN ('sadasd', 'maria', 'enmanuel', '23123')) = 0 
        THEN 'OK - No hay clientes de prueba'
        ELSE 'ERROR - Aun hay clientes de prueba'
    END AS estado_clientes,
    CASE 
        WHEN (SELECT COUNT(*) FROM contratos WHERE cliente_id IS NULL OR cliente_id NOT IN (SELECT id FROM clientes)) = 0 
        THEN 'OK - No hay contratos huerfanos'
        ELSE 'ADVERTENCIA - Hay contratos huerfanos'
    END AS estado_contratos;

