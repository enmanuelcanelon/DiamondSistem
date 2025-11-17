-- ============================================
-- ACTUALIZAR PRECIOS DE TEMPORADAS
-- ============================================
-- Temporada Alta: de 4000 a 1000
-- Temporada Media: de 2000 a 0

UPDATE temporadas 
SET ajuste_precio = 1000.00, 
    descripcion = 'Temporada Alta - Ajuste de +$1,000'
WHERE nombre = 'Alta';

UPDATE temporadas 
SET ajuste_precio = 0.00, 
    descripcion = 'Temporada Media - Sin ajuste de precio'
WHERE nombre = 'Media';

