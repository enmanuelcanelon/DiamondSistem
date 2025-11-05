-- =====================================================
-- FIX: Comisión 10% a 3% y Verificar Homenajeado
-- =====================================================

-- 1. ACTUALIZAR COMISIÓN DE VENDEDORES EXISTENTES DE 10% A 3%
UPDATE vendedores
SET comision_porcentaje = 3.00
WHERE comision_porcentaje = 10.00;

-- Verificar cambio
SELECT id, nombre_completo, comision_porcentaje 
FROM vendedores;

-- =====================================================
-- 2. VERIFICAR CAMPO HOMENAJEADO EN OFERTAS
-- =====================================================

-- Verificar si existe la columna
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ofertas' AND column_name = 'homenajeado';

-- Ver datos actuales
SELECT id, codigo_oferta, homenajeado, lugar_evento
FROM ofertas
ORDER BY fecha_creacion DESC
LIMIT 10;

-- =====================================================
-- 3. VERIFICAR CAMPO HOMENAJEADO EN CONTRATOS
-- =====================================================

-- Verificar si existe la columna
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'contratos' AND column_name = 'homenajeado';

-- Ver datos actuales
SELECT id, codigo_contrato, homenajeado, lugar_salon
FROM contratos
ORDER BY fecha_firma DESC
LIMIT 10;

-- =====================================================
-- 4. SI NO EXISTE, APLICAR MIGRACIÓN
-- =====================================================

-- Descomentar si el campo no existe:

-- ALTER TABLE ofertas 
-- ADD COLUMN IF NOT EXISTS homenajeado VARCHAR(200);

-- ALTER TABLE contratos 
-- ADD COLUMN IF NOT EXISTS homenajeado VARCHAR(200);

-- CREATE INDEX IF NOT EXISTS idx_ofertas_homenajeado ON ofertas(homenajeado);
-- CREATE INDEX IF NOT EXISTS idx_contratos_homenajeado ON contratos(homenajeado);

-- =====================================================
-- RESUMEN
-- =====================================================

-- 1. Comisión actualizada a 3%
-- 2. Campo homenajeado verificado
-- 3. Si el campo existe pero no aparece, el problema es:
--    - Frontend: Ya está correcto
--    - Backend: Verificar que incluya el campo en las queries
--    - Datos: Crear ofertas nuevas con homenajeado para probar




