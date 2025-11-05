-- ============================================
-- CORREGIR ERRORES DE CODIFICACIÓN EN PAQUETES
-- ============================================

-- Corregir "Paquete Personalizado"
UPDATE paquetes 
SET descripcion = '📝 Crea tu evento a medida. Personaliza cada detalle según tus necesidades.'
WHERE nombre = 'Paquete Personalizado';

-- Corregir "Servicio Especial"
UPDATE paquetes 
SET descripcion = 'Paquete ideal para eventos entre semana con todos los servicios básicos incluidos.'
WHERE nombre = 'Servicio Especial';

-- Verificar cambios
SELECT id, nombre, descripcion 
FROM paquetes 
WHERE nombre IN ('Paquete Personalizado', 'Servicio Especial');




