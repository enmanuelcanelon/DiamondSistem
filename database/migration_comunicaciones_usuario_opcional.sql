-- ============================================
-- MIGRACIÓN: Hacer usuario_id opcional en comunicaciones
-- Fecha: 2024-12-14
-- Descripción: Permite que mensajes de WhatsApp entrantes de números
--              desconocidos se guarden sin asignar a un vendedor específico.
-- ============================================

-- Eliminar la restricción NOT NULL de usuario_id
ALTER TABLE comunicaciones ALTER COLUMN usuario_id DROP NOT NULL;

-- Eliminar la restricción de foreign key existente si tiene ON DELETE CASCADE o similar
-- y recrearla para permitir NULL
ALTER TABLE comunicaciones DROP CONSTRAINT IF EXISTS comunicaciones_usuario_id_fkey;

ALTER TABLE comunicaciones 
ADD CONSTRAINT comunicaciones_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Comentario explicativo
COMMENT ON COLUMN comunicaciones.usuario_id IS 'ID del vendedor asignado. NULL para mensajes de números desconocidos sin asignar.';

-- Verificar el cambio
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'comunicaciones' AND column_name = 'usuario_id';
