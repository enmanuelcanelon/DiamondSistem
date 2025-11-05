-- Script para agregar campos de música (bailes adicionales y canción sorpresa)
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/agregar_campos_musica.sql'

-- Agregar campos a la tabla ajustes_evento
ALTER TABLE ajustes_evento 
ADD COLUMN IF NOT EXISTS bailes_adicionales TEXT,
ADD COLUMN IF NOT EXISTS cancion_sorpresa VARCHAR(255);

-- Comentarios para documentación
COMMENT ON COLUMN ajustes_evento.bailes_adicionales IS 'JSON string con array de bailes adicionales [{nombre, con_quien}]';
COMMENT ON COLUMN ajustes_evento.cancion_sorpresa IS 'Canción sorpresa para el evento';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ajustes_evento' 
  AND column_name IN ('bailes_adicionales', 'cancion_sorpresa')
ORDER BY column_name;

