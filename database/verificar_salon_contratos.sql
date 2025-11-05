-- Script para verificar datos de salón en contratos y ofertas
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/verificar_salon_contratos.sql'

-- 1. Verificar contratos con sus datos de salón
SELECT 
    c.id,
    c.codigo_contrato,
    c.cliente_id,
    c.oferta_id,
    c.salon_id AS contrato_salon_id,
    c.lugar_salon AS contrato_lugar_salon,
    s.nombre AS salon_nombre,
    s.id AS salon_id_real
FROM contratos c
LEFT JOIN salones s ON c.salon_id = s.id
ORDER BY c.id DESC
LIMIT 10;

-- 2. Verificar ofertas asociadas y sus datos de salón
SELECT 
    o.id AS oferta_id,
    o.codigo_oferta,
    o.salon_id AS oferta_salon_id,
    o.lugar_salon AS oferta_lugar_salon,
    os.nombre AS oferta_salon_nombre,
    c.id AS contrato_id,
    c.codigo_contrato,
    c.salon_id AS contrato_salon_id,
    c.lugar_salon AS contrato_lugar_salon
FROM ofertas o
LEFT JOIN salones os ON o.salon_id = os.id
LEFT JOIN contratos c ON c.oferta_id = o.id
WHERE c.id IS NOT NULL
ORDER BY c.id DESC
LIMIT 10;

-- 3. Contratos que NO tienen salón pero sus ofertas SÍ tienen
SELECT 
    c.id AS contrato_id,
    c.codigo_contrato,
    c.salon_id AS contrato_salon_id,
    c.lugar_salon AS contrato_lugar_salon,
    o.id AS oferta_id,
    o.codigo_oferta,
    o.salon_id AS oferta_salon_id,
    o.lugar_salon AS oferta_lugar_salon,
    os.nombre AS oferta_salon_nombre
FROM contratos c
INNER JOIN ofertas o ON c.oferta_id = o.id
LEFT JOIN salones os ON o.salon_id = os.id
WHERE (c.salon_id IS NULL OR c.lugar_salon IS NULL)
  AND (o.salon_id IS NOT NULL OR o.lugar_salon IS NOT NULL)
ORDER BY c.id DESC;

