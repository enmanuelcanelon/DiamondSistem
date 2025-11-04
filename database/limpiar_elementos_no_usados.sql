-- ============================================
-- SCRIPT PARA ELIMINAR ELEMENTOS NO USADOS
-- ============================================
-- ⚠️  IMPORTANTE: Solo ejecuta este script después de revisar
-- la auditoría y confirmar qué elementos NO se están usando
-- ============================================

BEGIN;

-- ============================================
-- 1. ELIMINAR COLUMNAS OBSOLETAS
-- ============================================
SELECT '🗑️  Eliminando columnas obsoletas...' AS paso;

-- Columnas de clientes que se movieron a ajustes_evento
ALTER TABLE clientes DROP COLUMN IF EXISTS opciones_vegetarianas;
ALTER TABLE clientes DROP COLUMN IF EXISTS opciones_veganas;
ALTER TABLE clientes DROP COLUMN IF EXISTS restricciones_alimentarias;

SELECT '✅ Columnas obsoletas de clientes eliminadas' AS resultado;

-- Columnas de ajustes_evento que ya no se usan
ALTER TABLE ajustes_evento DROP COLUMN IF EXISTS opciones_vegetarianas;
ALTER TABLE ajustes_evento DROP COLUMN IF EXISTS opciones_veganas;
ALTER TABLE ajustes_evento DROP COLUMN IF EXISTS bebidas_incluidas;
ALTER TABLE ajustes_evento DROP COLUMN IF EXISTS tamano_torta;
ALTER TABLE ajustes_evento DROP COLUMN IF EXISTS tipo_relleno;

SELECT '✅ Columnas obsoletas de ajustes_evento eliminadas' AS resultado;

-- ============================================
-- 2. VERIFICAR ANTES DE CONTINUAR
-- ============================================
SELECT '⚠️  PAUSA AQUÍ' AS advertencia;
SELECT 'Revisa los resultados de la auditoría antes de continuar' AS mensaje;
SELECT 'Los siguientes pasos eliminarán servicios, paquetes o temporadas no usados' AS advertencia2;

-- ============================================
-- 3. ELIMINAR SERVICIOS NO USADOS (COMENTADO POR SEGURIDAD)
-- ============================================
-- ⚠️  Descomenta solo si estás seguro de que estos servicios no se usan

/*
-- Servicios que nunca se han usado en ningún paquete, oferta o contrato
DELETE FROM servicios
WHERE id IN (
    SELECT s.id
    FROM servicios s
    LEFT JOIN paquetes_servicios ps ON s.id = ps.servicio_id
    LEFT JOIN ofertas_servicios os ON s.id = os.servicio_id
    LEFT JOIN contratos_servicios cs ON s.id = cs.servicio_id
    WHERE ps.servicio_id IS NULL 
        AND os.servicio_id IS NULL 
        AND cs.servicio_id IS NULL
        AND s.activo = FALSE  -- Solo servicios inactivos
);

SELECT '✅ Servicios no usados eliminados' AS resultado;
*/

-- ============================================
-- 4. ELIMINAR PAQUETES NO USADOS (COMENTADO POR SEGURIDAD)
-- ============================================
-- ⚠️  Descomenta solo si estás seguro

/*
DELETE FROM paquetes
WHERE id IN (
    SELECT p.id
    FROM paquetes p
    LEFT JOIN ofertas o ON p.id = o.paquete_id
    LEFT JOIN contratos c ON p.id = c.paquete_id
    WHERE o.paquete_id IS NULL 
        AND c.paquete_id IS NULL
        AND p.activo = FALSE  -- Solo paquetes inactivos
);

SELECT '✅ Paquetes no usados eliminados' AS resultado;
*/

-- ============================================
-- 5. ELIMINAR TEMPORADAS OBSOLETAS (COMENTADO POR SEGURIDAD)
-- ============================================
-- ⚠️  Descomenta solo si estás seguro

/*
DELETE FROM temporadas
WHERE id IN (
    SELECT t.id
    FROM temporadas t
    LEFT JOIN ofertas o ON t.id = o.temporada_id
    LEFT JOIN contratos c ON t.id = c.temporada_id
    WHERE o.temporada_id IS NULL 
        AND c.temporada_id IS NULL
        AND t.activa = FALSE  -- Solo temporadas inactivas
        AND t.fecha_fin < CURRENT_DATE  -- Solo temporadas pasadas
);

SELECT '✅ Temporadas obsoletas eliminadas' AS resultado;
*/

-- ============================================
-- 6. REGENERAR PRISMA CLIENT (NOTA)
-- ============================================
SELECT '📝 IMPORTANTE: Después de eliminar columnas' AS nota;
SELECT 'Ejecuta en el backend:' AS comando1;
SELECT 'npx prisma db pull' AS comando2;
SELECT 'npx prisma generate' AS comando3;

COMMIT;

SELECT '✅ Limpieza de elementos no usados completada' AS resultado;
SELECT 'Recuerda regenerar el Prisma Client si eliminaste columnas' AS recordatorio;

