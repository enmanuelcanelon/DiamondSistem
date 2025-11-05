#!/bin/bash

# =====================================================
# Script para aplicar todos los fixes inmediatamente
# =====================================================

echo "🔧 Aplicando correcciones..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =====================================================
# 1. VERIFICAR MIGRACIÓN DE HOMENAJEADO
# =====================================================

echo -e "${BLUE}📋 Paso 1: Verificando migración de homenajeado...${NC}"
psql -U postgres -d diamond_sistem << EOF
-- Verificar si existe columna homenajeado
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ofertas' AND column_name = 'homenajeado'
    ) 
    THEN '✅ Campo homenajeado existe en ofertas'
    ELSE '❌ Campo homenajeado NO existe en ofertas - Aplicando migración...'
  END as status_ofertas;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contratos' AND column_name = 'homenajeado'
    ) 
    THEN '✅ Campo homenajeado existe en contratos'
    ELSE '❌ Campo homenajeado NO existe en contratos - Aplicando migración...'
  END as status_contratos;
EOF

echo -e "${YELLOW}⚠️  Si viste algún ❌ arriba, ejecuta:${NC}"
echo "psql -U postgres -d diamond_sistem -f database/migration_homenajeado.sql"
echo ""

# =====================================================
# 2. ACTUALIZAR COMISIÓN DE VENDEDORES
# =====================================================

echo -e "${BLUE}📋 Paso 2: Actualizando comisión de vendedores (10% → 3%)...${NC}"
psql -U postgres -d diamond_sistem << EOF
-- Actualizar comisión
UPDATE vendedores
SET comision_porcentaje = 3.00
WHERE comision_porcentaje = 10.00;

-- Mostrar resultado
SELECT 
  COUNT(*) as vendedores_actualizados,
  '✅ Comisión actualizada a 3%' as status
FROM vendedores
WHERE comision_porcentaje = 3.00;

-- Verificar todos los vendedores
SELECT 
  id, 
  nombre_completo, 
  comision_porcentaje,
  CASE 
    WHEN comision_porcentaje = 3.00 THEN '✅'
    ELSE '⚠️'
  END as status
FROM vendedores
ORDER BY id;
EOF

echo ""

# =====================================================
# 3. REGENERAR PRISMA CLIENT
# =====================================================

echo -e "${BLUE}📋 Paso 3: Regenerando Prisma Client...${NC}"
cd backend
npx prisma generate
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Prisma Client regenerado correctamente${NC}"
else
  echo -e "${YELLOW}⚠️  Error al regenerar Prisma Client${NC}"
  echo "Ejecuta manualmente: cd backend && npx prisma generate"
fi
cd ..

echo ""

# =====================================================
# 4. VERIFICAR ESTADO FINAL
# =====================================================

echo -e "${BLUE}📋 Paso 4: Verificando estado final...${NC}"
psql -U postgres -d diamond_sistem << EOF
-- Resumen de cambios
SELECT 
  '✅ RESUMEN DE CAMBIOS' as titulo;

-- 1. Comisión
SELECT 
  '1. Comisión de Vendedores' as item,
  COUNT(*) as total_vendedores,
  MIN(comision_porcentaje) as min_comision,
  MAX(comision_porcentaje) as max_comision,
  AVG(comision_porcentaje)::numeric(5,2) as promedio_comision
FROM vendedores;

-- 2. Campo homenajeado
SELECT 
  '2. Campo Homenajeado' as item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ofertas' AND column_name = 'homenajeado'
    ) 
    THEN '✅ Existe en ofertas'
    ELSE '❌ NO existe en ofertas'
  END as status_ofertas,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contratos' AND column_name = 'homenajeado'
    ) 
    THEN '✅ Existe en contratos'
    ELSE '❌ NO existe en contratos'
  END as status_contratos;

-- 3. Datos de homenajeado
SELECT 
  '3. Ofertas con Homenajeado' as item,
  COUNT(*) as total_con_homenajeado
FROM ofertas
WHERE homenajeado IS NOT NULL;

SELECT 
  '4. Contratos con Homenajeado' as item,
  COUNT(*) as total_con_homenajeado
FROM contratos
WHERE homenajeado IS NOT NULL;
EOF

echo ""

# =====================================================
# 5. INSTRUCCIONES FINALES
# =====================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ CAMBIOS APLICADOS EXITOSAMENTE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Reiniciar el backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Refrescar el frontend (F5 en el navegador)"
echo ""
echo "3. Crear una oferta NUEVA con homenajeado para probar"
echo ""
echo "4. Verificar que la comisión se calcula al 3%"
echo ""
echo -e "${BLUE}📄 Documentación:${NC}"
echo "   - FIX_HORA_COMISION_HOMENAJEADO.md"
echo "   - database/fix_comision_y_homenajeado.sql"
echo ""
echo -e "${GREEN}¡Listo para usar!${NC}"




