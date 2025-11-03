-- ============================================
-- CORRECCIÓN DIRECTA DE ENCODING UTF-8
-- Actualizar servicios por ID específico
-- ============================================

-- Primero, ver todos los servicios con problemas
SELECT id, nombre, categoria FROM servicios WHERE id IN (7, 11, 13, 17, 18);

-- Actualizar directamente por ID
UPDATE servicios SET nombre = 'Champaña' WHERE id = 7;
UPDATE servicios SET nombre = 'Decoración Plus' WHERE id = 11;
UPDATE servicios SET nombre = 'Número Lumínico' WHERE id = 13;
UPDATE servicios SET nombre = 'Máquina de Humo' WHERE id = 17;
UPDATE servicios SET nombre = 'Máquina de Chispas' WHERE id = 18;

-- Verificar los cambios
SELECT id, nombre, categoria FROM servicios WHERE id IN (7, 11, 13, 17, 18);



