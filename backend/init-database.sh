#!/bin/bash

# ============================================
# Script de Inicialización de Base de Datos
# Ejecutar manualmente cuando sea necesario
# ============================================

echo "🔧 Inicializando base de datos..."

# 1. Generar cliente Prisma
echo "📦 Generando cliente Prisma..."
npx prisma generate

# 2. Limpiar duplicados
echo "🧹 Limpiando duplicados..."
node scripts/limpiar_duplicados_sql.js

# 3. Push del schema
echo "📊 Aplicando schema a la base de datos..."
npx prisma db push --accept-data-loss

# 4. Inicializar datos
echo "🌱 Inicializando datos base..."
node scripts/inicializar_bd_completo.js

# 5. Seed de producción
echo "🌾 Aplicando seed de producción..."
node prisma/seed-production.js

echo "✅ Inicialización completada!"

