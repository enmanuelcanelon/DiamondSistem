-- ============================================
-- ACTUALIZAR PRECIO DE PASAPALOS
-- Cambiar precio de $3.00 a $6.00
-- ============================================

UPDATE servicios
SET precio_base = 6.00
WHERE nombre = 'Pasapalos'
  AND precio_base = 3.00;

-- Verificar el cambio
SELECT id, nombre, precio_base, tipo_cobro, categoria
FROM servicios
WHERE nombre = 'Pasapalos';

