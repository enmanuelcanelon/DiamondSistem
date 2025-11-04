-- ============================================
-- ELIMINAR SISTEMA DE SEATING CHART
-- ============================================
-- Este script elimina completamente el sistema de
-- asignación de mesas (seating chart) para reimplementarlo
-- de forma limpia más adelante
-- ============================================

BEGIN;

SELECT '🗑️  ELIMINANDO SISTEMA DE SEATING CHART' AS info;

-- ============================================
-- 1. VERIFICAR DATOS ANTES DE ELIMINAR
-- ============================================
SELECT '📊 DATOS ACTUALES:' AS paso;

SELECT 
    'mesas' AS tabla, 
    COUNT(*) AS registros 
FROM mesas
UNION ALL
SELECT 
    'mesas_asignaciones', 
    COUNT(*) 
FROM mesas_asignaciones
UNION ALL
SELECT 
    'mesas_configuracion', 
    COUNT(*) 
FROM mesas_configuracion
UNION ALL
SELECT 
    'seating_chart_estado', 
    COUNT(*) 
FROM seating_chart_estado
UNION ALL
SELECT 
    'seating_chart_historial', 
    COUNT(*) 
FROM seating_chart_historial;

-- ============================================
-- 2. ELIMINAR TRIGGERS
-- ============================================
SELECT '⚡ Eliminando triggers...' AS paso;

DROP TRIGGER IF EXISTS trigger_inicializar_seating ON contratos CASCADE;
DROP TRIGGER IF EXISTS trigger_actualizar_seating_estado ON mesas_asignaciones CASCADE;
DROP TRIGGER IF EXISTS trigger_actualizar_mesas ON mesas CASCADE;

SELECT '✅ Triggers eliminados' AS resultado;

-- ============================================
-- 3. ELIMINAR FUNCIONES
-- ============================================
SELECT '⚙️  Eliminando funciones...' AS paso;

DROP FUNCTION IF EXISTS fn_inicializar_seating() CASCADE;
DROP FUNCTION IF EXISTS inicializar_seating_chart(integer) CASCADE;
DROP FUNCTION IF EXISTS actualizar_seating_chart_estado() CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha_mesas() CASCADE;
DROP FUNCTION IF EXISTS verificar_seating_bloqueado(integer) CASCADE;
DROP FUNCTION IF EXISTS calcular_fecha_limite_seating(date) CASCADE;

SELECT '✅ Funciones eliminadas' AS resultado;

-- ============================================
-- 4. ELIMINAR VISTAS (si existen)
-- ============================================
SELECT '👁️  Eliminando vistas...' AS paso;

DROP VIEW IF EXISTS vista_seating_chart CASCADE;
DROP VIEW IF EXISTS vista_mesas_ocupadas CASCADE;

SELECT '✅ Vistas eliminadas' AS resultado;

-- ============================================
-- 5. ELIMINAR TABLAS EN ORDEN CORRECTO
-- ============================================
SELECT '🗄️  Eliminando tablas...' AS paso;

-- 5.1 Primero las tablas dependientes
DROP TABLE IF EXISTS seating_chart_historial CASCADE;
SELECT '  ↳ seating_chart_historial eliminada' AS subtarea;

DROP TABLE IF EXISTS seating_chart_estado CASCADE;
SELECT '  ↳ seating_chart_estado eliminada' AS subtarea;

DROP TABLE IF EXISTS mesas_asignaciones CASCADE;
SELECT '  ↳ mesas_asignaciones eliminada' AS subtarea;

DROP TABLE IF EXISTS mesas_configuracion CASCADE;
SELECT '  ↳ mesas_configuracion eliminada' AS subtarea;

DROP TABLE IF EXISTS mesas CASCADE;
SELECT '  ↳ mesas eliminada' AS subtarea;

SELECT '✅ Todas las tablas de seating eliminadas' AS resultado;

-- ============================================
-- 6. VERIFICACIÓN FINAL
-- ============================================
SELECT '🔍 VERIFICANDO ELIMINACIÓN...' AS paso;

-- Verificar que las tablas ya no existen
SELECT 
    COUNT(*) AS tablas_seating_restantes
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'mesas',
        'mesas_asignaciones',
        'mesas_configuracion',
        'seating_chart_estado',
        'seating_chart_historial'
    );

-- Verificar triggers restantes
SELECT 
    COUNT(*) AS triggers_seating_restantes
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND (
        trigger_name LIKE '%seating%' 
        OR trigger_name LIKE '%mesas%'
    );

-- Verificar funciones restantes
SELECT 
    COUNT(*) AS funciones_seating_restantes
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name LIKE '%seating%' 
        OR routine_name LIKE '%mesas%'
    );

COMMIT;

-- ============================================
-- 7. RESUMEN FINAL
-- ============================================
SELECT '═══════════════════════════════════════' AS separador;
SELECT '✅ SISTEMA DE SEATING CHART ELIMINADO' AS resultado;
SELECT '═══════════════════════════════════════' AS separador;

SELECT 
    'Tablas eliminadas: 5' AS resumen_1,
    'Triggers eliminados: 3+' AS resumen_2,
    'Funciones eliminadas: 6' AS resumen_3,
    'Sistema listo para reimplementación limpia' AS resumen_4;

-- ============================================
-- 8. PRÓXIMOS PASOS
-- ============================================
SELECT '📝 IMPORTANTE:' AS nota;
SELECT 'Ejecuta estos comandos en el backend:' AS instruccion;
SELECT '  1. cd backend' AS paso_1;
SELECT '  2. npx prisma db pull' AS paso_2;
SELECT '  3. npx prisma generate' AS paso_3;
SELECT '  4. npm run dev' AS paso_4;

