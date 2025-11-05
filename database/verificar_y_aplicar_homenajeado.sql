-- =====================================================
-- VERIFICAR Y APLICAR CAMPO HOMENAJEADO
-- =====================================================

\echo '🔍 VERIFICANDO CAMPO HOMENAJEADO...'
\echo ''

-- 1. Verificar si existe en OFERTAS
\echo '1️⃣ Verificando campo en tabla OFERTAS:'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ofertas' AND column_name = 'homenajeado'
    ) 
    THEN '✅ Campo homenajeado EXISTE en ofertas'
    ELSE '❌ Campo homenajeado NO EXISTE en ofertas'
  END as status;

-- 2. Verificar si existe en CONTRATOS
\echo ''
\echo '2️⃣ Verificando campo en tabla CONTRATOS:'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contratos' AND column_name = 'homenajeado'
    ) 
    THEN '✅ Campo homenajeado EXISTE en contratos'
    ELSE '❌ Campo homenajeado NO EXISTE en contratos'
  END as status;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 3. Si no existen, aplicar migración
\echo '3️⃣ Aplicando migración (si es necesario)...'

-- Agregar columna a OFERTAS si no existe
ALTER TABLE ofertas 
ADD COLUMN IF NOT EXISTS homenajeado VARCHAR(200);

-- Agregar columna a CONTRATOS si no existe
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS homenajeado VARCHAR(200);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_ofertas_homenajeado ON ofertas(homenajeado);
CREATE INDEX IF NOT EXISTS idx_contratos_homenajeado ON contratos(homenajeado);

\echo '✅ Migración aplicada correctamente'
\echo ''

-- 4. Verificar datos existentes
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '4️⃣ Verificando datos existentes:'
\echo ''

\echo '📊 OFERTAS con homenajeado:'
SELECT 
  COUNT(*) FILTER (WHERE homenajeado IS NOT NULL) as con_homenajeado,
  COUNT(*) FILTER (WHERE homenajeado IS NULL) as sin_homenajeado,
  COUNT(*) as total
FROM ofertas;

\echo ''
\echo '📊 CONTRATOS con homenajeado:'
SELECT 
  COUNT(*) FILTER (WHERE homenajeado IS NOT NULL) as con_homenajeado,
  COUNT(*) FILTER (WHERE homenajeado IS NULL) as sin_homenajeado,
  COUNT(*) as total
FROM contratos;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 5. Mostrar ejemplos de datos con homenajeado (si existen)
\echo '5️⃣ Ejemplos de registros CON homenajeado:'
\echo ''

\echo '📝 Ofertas:'
SELECT 
  id, 
  codigo_oferta, 
  homenajeado, 
  lugar_evento,
  fecha_evento
FROM ofertas
WHERE homenajeado IS NOT NULL
ORDER BY fecha_creacion DESC
LIMIT 5;

\echo ''
\echo '📝 Contratos:'
SELECT 
  id, 
  codigo_contrato, 
  homenajeado, 
  lugar_salon,
  fecha_evento
FROM contratos
WHERE homenajeado IS NOT NULL
ORDER BY fecha_firma DESC
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '✅ VERIFICACIÓN COMPLETA'
\echo ''
\echo '📝 NOTAS:'
\echo '   - Si ves ofertas/contratos con homenajeado = NULL, es normal.'
\echo '   - Solo las ofertas/contratos NUEVOS tendrán este campo lleno.'
\echo '   - El frontend mostrará el homenajeado solo si existe.'
\echo ''
\echo '🔄 PRÓXIMOS PASOS:'
\echo '   1. Reiniciar backend: cd backend && npm run dev'
\echo '   2. Refrescar navegador (F5)'
\echo '   3. Crear una oferta NUEVA con homenajeado'
\echo '   4. Verificar que aparece en preview y detalles'
\echo ''




