-- =====================================================
-- VERIFICAR DATOS PARA PREVIEW DE CONTRATOS
-- =====================================================

\echo '🔍 VERIFICANDO DATOS DE CONTRATOS PARA PREVIEW...'
\echo ''

-- 1. Verificar contratos con salones
\echo '1️⃣ CONTRATOS CON SALÓN:'
\echo ''
SELECT 
  c.id,
  c.codigo_contrato,
  c.salon_id,
  s.nombre as nombre_salon,
  c.lugar_salon,
  c.homenajeado,
  cl.nombre_completo as cliente
FROM contratos c
LEFT JOIN salones s ON c.salon_id = s.id
LEFT JOIN clientes cl ON c.cliente_id = cl.id
ORDER BY c.fecha_firma DESC
LIMIT 10;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 2. Verificar contratos SIN salón (sede externa)
\echo '2️⃣ CONTRATOS CON SEDE EXTERNA (sin salón):'
\echo ''
SELECT 
  c.id,
  c.codigo_contrato,
  c.salon_id,
  c.lugar_salon,
  c.homenajeado,
  cl.nombre_completo as cliente
FROM contratos c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
WHERE c.salon_id IS NULL
ORDER BY c.fecha_firma DESC
LIMIT 10;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 3. Verificar contratos con homenajeado
\echo '3️⃣ CONTRATOS CON HOMENAJEADO:'
\echo ''
SELECT 
  c.id,
  c.codigo_contrato,
  c.homenajeado,
  s.nombre as salon,
  cl.nombre_completo as cliente
FROM contratos c
LEFT JOIN salones s ON c.salon_id = s.id
LEFT JOIN clientes cl ON c.cliente_id = cl.id
WHERE c.homenajeado IS NOT NULL
ORDER BY c.fecha_firma DESC
LIMIT 10;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 4. Estadísticas generales
\echo '4️⃣ ESTADÍSTICAS:'
\echo ''
SELECT 
  COUNT(*) as total_contratos,
  COUNT(salon_id) as con_salon,
  COUNT(*) - COUNT(salon_id) as sin_salon_sede_externa,
  COUNT(homenajeado) as con_homenajeado
FROM contratos;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 5. Verificar ofertas con salones
\echo '5️⃣ OFERTAS CON SALÓN:'
\echo ''
SELECT 
  o.id,
  o.codigo_oferta,
  o.salon_id,
  s.nombre as nombre_salon,
  o.lugar_evento,
  o.homenajeado,
  cl.nombre_completo as cliente
FROM ofertas o
LEFT JOIN salones s ON o.salon_id = s.id
LEFT JOIN clientes cl ON o.cliente_id = cl.id
ORDER BY o.fecha_creacion DESC
LIMIT 10;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 6. Verificar salones existentes
\echo '6️⃣ SALONES DISPONIBLES:'
\echo ''
SELECT 
  id,
  nombre,
  capacidad_maxima,
  precio_base,
  activo
FROM salones
ORDER BY nombre;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- 7. Verificar paquetes personalizados
\echo '7️⃣ PAQUETES PERSONALIZADOS (para sede externa):'
\echo ''
SELECT 
  id,
  nombre,
  precio_base,
  descripcion
FROM paquetes
WHERE LOWER(nombre) LIKE '%personalizado%'
ORDER BY nombre;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '✅ VERIFICACIÓN COMPLETA'
\echo ''
\echo '📝 NOTAS PARA EL FRONTEND:'
\echo '   1. Preview de contratos debe mostrar:'
\echo '      - 📍 [Nombre del salón] (si tiene salon_id)'
\echo '      - 📍 [lugar_salon] (si salon_id es NULL)'
\echo '      - 🎉 Homenajeado/a: [nombre] (si existe)'
\echo ''
\echo '   2. Backend debe incluir en GET /contratos:'
\echo '      - include: { salones: true }'
\echo ''
\echo '   3. Sede externa:'
\echo '      - salon_id = NULL'
\echo '      - Solo permite paquete "Personalizado"'
\echo ''




