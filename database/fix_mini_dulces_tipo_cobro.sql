-- ============================================
-- CORREGIR TIPO DE COBRO DE MINI DULCES
-- Debe ser 'por_persona' igual que Pasapalos
-- ============================================

-- Actualizar Mini Dulces para que se calcule por persona
UPDATE servicios 
SET tipo_cobro = 'por_persona'
WHERE nombre = 'Mini Dulces';

-- Verificar cambio
SELECT id, nombre, precio_base, tipo_cobro, descripcion 
FROM servicios 
WHERE nombre IN ('Mini Dulces', 'Pasapalos')
ORDER BY nombre;




