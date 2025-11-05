-- Script para actualizar contratos con información de salón desde sus ofertas
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/actualizar_salon_contratos.sql'

-- Verificar cuántos contratos se van a actualizar
SELECT 
    COUNT(*) AS contratos_a_actualizar
FROM contratos c
INNER JOIN ofertas o ON c.oferta_id = o.id
WHERE (c.salon_id IS NULL OR c.lugar_salon IS NULL)
  AND (o.salon_id IS NOT NULL OR o.lugar_salon IS NOT NULL);

-- Actualizar contratos con salon_id y lugar_salon desde sus ofertas
UPDATE contratos c
SET 
    salon_id = o.salon_id,
    lugar_salon = o.lugar_salon
FROM ofertas o
WHERE c.oferta_id = o.id
  AND (c.salon_id IS NULL OR c.lugar_salon IS NULL)
  AND (o.salon_id IS NOT NULL OR o.lugar_salon IS NOT NULL);

-- Verificar resultados
SELECT 
    c.id AS contrato_id,
    c.codigo_contrato,
    c.salon_id AS contrato_salon_id,
    c.lugar_salon AS contrato_lugar_salon,
    s.nombre AS salon_nombre,
    o.codigo_oferta,
    o.salon_id AS oferta_salon_id,
    o.lugar_salon AS oferta_lugar_salon
FROM contratos c
INNER JOIN ofertas o ON c.oferta_id = o.id
LEFT JOIN salones s ON c.salon_id = s.id
ORDER BY c.id DESC
LIMIT 10;

