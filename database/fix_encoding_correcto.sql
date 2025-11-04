-- ============================================
-- CORREGIR ERRORES DE CODIFICACIÓN (NOMBRES CORRECTOS)
-- ============================================

-- Corregir paquete "Personalizado" (ID: 5)
UPDATE paquetes 
SET descripcion = 'Crea tu evento a medida. Personaliza cada detalle según tus necesidades.'
WHERE nombre = 'Personalizado';

-- Corregir paquete "Especial" (ID: 1)
UPDATE paquetes 
SET descripcion = 'Paquete ideal para eventos entre semana con todos los servicios básicos incluidos.'
WHERE nombre = 'Especial';

-- Verificar cambios
SELECT id, nombre, descripcion 
FROM paquetes 
WHERE nombre IN ('Personalizado', 'Especial')
ORDER BY nombre;

