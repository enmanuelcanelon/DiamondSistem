-- ============================================
-- SCRIPT DE AUDITORÍA DE BASE DE DATOS
-- ============================================
-- Este script verifica la estructura completa de la BD
-- e identifica elementos no utilizados o innecesarios
-- ============================================

-- ============================================
-- 1. INFORMACIÓN GENERAL
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '📊 RESUMEN GENERAL DE LA BASE DE DATOS' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

-- Listar todas las tablas
SELECT 
    schemaname AS esquema,
    tablename AS tabla,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamaño
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Total de registros por tabla
SELECT 
    'clientes' AS tabla, 
    COUNT(*) AS registros 
FROM clientes
UNION ALL
SELECT 'vendedores', COUNT(*) FROM vendedores
UNION ALL
SELECT 'paquetes', COUNT(*) FROM paquetes
UNION ALL
SELECT 'servicios', COUNT(*) FROM servicios
UNION ALL
SELECT 'salones', COUNT(*) FROM salones
UNION ALL
SELECT 'temporadas', COUNT(*) FROM temporadas
UNION ALL
SELECT 'ofertas', COUNT(*) FROM ofertas
UNION ALL
SELECT 'contratos', COUNT(*) FROM contratos
UNION ALL
SELECT 'pagos', COUNT(*) FROM pagos
UNION ALL
SELECT 'mensajes', COUNT(*) FROM mensajes
UNION ALL
SELECT 'solicitudes_cliente', COUNT(*) FROM solicitudes_cliente
UNION ALL
SELECT 'ajustes_evento', COUNT(*) FROM ajustes_evento
UNION ALL
SELECT 'playlist_musical', COUNT(*) FROM playlist_musical
UNION ALL
SELECT 'asignacion_mesas', COUNT(*) FROM asignacion_mesas
UNION ALL
SELECT 'versiones_contratos_pdf', COUNT(*) FROM versiones_contratos_pdf
ORDER BY tabla;

-- ============================================
-- 2. VERIFICAR RELACIONES Y CLAVES FORÁNEAS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '🔗 CLAVES FORÁNEAS Y RELACIONES' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT
    tc.table_name AS tabla_origen,
    kcu.column_name AS columna,
    ccu.table_name AS tabla_referenciada,
    ccu.column_name AS columna_referenciada,
    tc.constraint_name AS nombre_restriccion
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 3. VERIFICAR ÍNDICES
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '📑 ÍNDICES EXISTENTES' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT
    schemaname AS esquema,
    tablename AS tabla,
    indexname AS indice,
    indexdef AS definicion
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 4. DETECTAR COLUMNAS NO USADAS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '⚠️  COLUMNAS QUE PODRÍAN NO ESTAR EN USO' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

-- Columnas con todos los valores NULL
-- (Esta sección se ejecutará solo si hay datos)
SELECT 
    'ajustes_evento' AS tabla,
    'estilo_decoracion_otro' AS columna,
    COUNT(*) AS total,
    COUNT(estilo_decoracion_otro) AS con_valor,
    (COUNT(*) - COUNT(estilo_decoracion_otro)) AS nulos
FROM ajustes_evento
WHERE EXISTS (SELECT 1 FROM ajustes_evento LIMIT 1)
UNION ALL
SELECT 
    'ajustes_evento',
    'sabor_otro',
    COUNT(*),
    COUNT(sabor_otro),
    (COUNT(*) - COUNT(sabor_otro))
FROM ajustes_evento
WHERE EXISTS (SELECT 1 FROM ajustes_evento LIMIT 1)
UNION ALL
SELECT 
    'ajustes_evento',
    'diseno_otro',
    COUNT(*),
    COUNT(diseno_otro),
    (COUNT(*) - COUNT(diseno_otro))
FROM ajustes_evento
WHERE EXISTS (SELECT 1 FROM ajustes_evento LIMIT 1)
UNION ALL
SELECT 
    'contratos',
    'plan_pagos',
    COUNT(*),
    COUNT(plan_pagos),
    (COUNT(*) - COUNT(plan_pagos))
FROM contratos
WHERE EXISTS (SELECT 1 FROM contratos LIMIT 1);

-- ============================================
-- 5. VERIFICAR TRIGGERS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '⚡ TRIGGERS ACTIVOS' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT
    trigger_name AS nombre_trigger,
    event_manipulation AS evento,
    event_object_table AS tabla,
    action_timing AS momento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 6. VERIFICAR VISTAS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '👁️  VISTAS EXISTENTES' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT
    table_name AS vista,
    view_definition AS definicion
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 7. VERIFICAR FUNCIONES/PROCEDIMIENTOS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '⚙️  FUNCIONES Y PROCEDIMIENTOS' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT
    routines.routine_name AS nombre_funcion,
    routines.routine_type AS tipo,
    routines.data_type AS tipo_retorno,
    parameters.parameter_name AS parametro,
    parameters.data_type AS tipo_parametro
FROM information_schema.routines
LEFT JOIN information_schema.parameters 
    ON routines.specific_name = parameters.specific_name
WHERE routines.routine_schema = 'public'
ORDER BY routines.routine_name, parameters.ordinal_position;

-- ============================================
-- 8. SERVICIOS NO USADOS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '🔍 SERVICIOS QUE NO SE USAN' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

-- Servicios que no están en ningún paquete ni se han vendido
SELECT 
    s.id,
    s.nombre,
    s.categoria,
    s.precio_base,
    COALESCE(ps.veces_en_paquetes, 0) AS veces_en_paquetes,
    COALESCE(os.veces_en_ofertas, 0) AS veces_en_ofertas,
    COALESCE(cs.veces_en_contratos, 0) AS veces_en_contratos
FROM servicios s
LEFT JOIN (
    SELECT servicio_id, COUNT(*) AS veces_en_paquetes
    FROM paquetes_servicios
    GROUP BY servicio_id
) ps ON s.id = ps.servicio_id
LEFT JOIN (
    SELECT servicio_id, COUNT(*) AS veces_en_ofertas
    FROM ofertas_servicios_adicionales
    GROUP BY servicio_id
) os ON s.id = os.servicio_id
LEFT JOIN (
    SELECT servicio_id, COUNT(*) AS veces_en_contratos
    FROM contratos_servicios
    GROUP BY servicio_id
) cs ON s.id = cs.servicio_id
WHERE s.activo = TRUE
ORDER BY 
    COALESCE(ps.veces_en_paquetes, 0) + 
    COALESCE(os.veces_en_ofertas, 0) + 
    COALESCE(cs.veces_en_contratos, 0) ASC,
    s.nombre;

-- ============================================
-- 9. PAQUETES NO USADOS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '📦 PAQUETES QUE NO SE USAN' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT 
    p.id,
    p.nombre,
    p.precio_base,
    COALESCE(o.veces_en_ofertas, 0) AS veces_en_ofertas,
    COALESCE(c.veces_en_contratos, 0) AS veces_en_contratos
FROM paquetes p
LEFT JOIN (
    SELECT paquete_id, COUNT(*) AS veces_en_ofertas
    FROM ofertas
    GROUP BY paquete_id
) o ON p.id = o.paquete_id
LEFT JOIN (
    SELECT paquete_id, COUNT(*) AS veces_en_contratos
    FROM contratos
    GROUP BY paquete_id
) c ON p.id = c.paquete_id
WHERE p.activo = TRUE
ORDER BY 
    COALESCE(o.veces_en_ofertas, 0) + 
    COALESCE(c.veces_en_contratos, 0) ASC,
    p.nombre;

-- ============================================
-- 10. TEMPORADAS NO USADAS
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '📅 TEMPORADAS QUE NO SE USAN' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT 
    t.id,
    t.nombre,
    t.fecha_inicio,
    t.fecha_fin,
    t.ajuste_precio,
    COALESCE(o.veces_en_ofertas, 0) AS veces_en_ofertas
FROM temporadas t
LEFT JOIN (
    SELECT temporada_id, COUNT(*) AS veces_en_ofertas
    FROM ofertas
    WHERE temporada_id IS NOT NULL
    GROUP BY temporada_id
) o ON t.id = o.temporada_id
WHERE t.activa = TRUE
ORDER BY 
    COALESCE(o.veces_en_ofertas, 0) ASC,
    t.nombre;

-- ============================================
-- 11. VERIFICAR INTEGRIDAD REFERENCIAL
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '✅ VERIFICACIÓN DE INTEGRIDAD' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

-- Ofertas sin cliente
SELECT 
    'Ofertas huérfanas (sin cliente)' AS problema,
    COUNT(*) AS cantidad
FROM ofertas o
LEFT JOIN clientes c ON o.cliente_id = c.id
WHERE c.id IS NULL;

-- Contratos sin cliente
SELECT 
    'Contratos huérfanos (sin cliente)' AS problema,
    COUNT(*) AS cantidad
FROM contratos co
LEFT JOIN clientes cl ON co.cliente_id = cl.id
WHERE cl.id IS NULL;

-- Contratos sin oferta
SELECT 
    'Contratos sin oferta asociada' AS problema,
    COUNT(*) AS cantidad
FROM contratos co
LEFT JOIN ofertas o ON co.oferta_id = o.id
WHERE o.id IS NULL AND co.oferta_id IS NOT NULL;

-- Ajustes sin contrato
SELECT 
    'Ajustes de evento sin contrato' AS problema,
    COUNT(*) AS cantidad
FROM ajustes_evento ae
LEFT JOIN contratos c ON ae.contrato_id = c.id
WHERE c.id IS NULL;

-- Pagos sin contrato
SELECT 
    'Pagos sin contrato asociado' AS problema,
    COUNT(*) AS cantidad
FROM pagos p
LEFT JOIN contratos c ON p.contrato_id = c.id
WHERE c.id IS NULL;

-- ============================================
-- 12. RESUMEN FINAL
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '✅ AUDITORÍA COMPLETADA' AS titulo;
SELECT '═══════════════════════════════════════' AS separador;

SELECT 
    'Base de datos: diamondsistem' AS info,
    'Verificación completa realizada' AS estado,
    NOW() AS fecha_hora;

