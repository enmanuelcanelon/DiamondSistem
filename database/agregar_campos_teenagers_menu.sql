-- Script para agregar campos de tipo de comida y tipo de pasta para teenagers
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/agregar_campos_teenagers_menu.sql'

-- Agregar campos a la tabla ajustes_evento
ALTER TABLE ajustes_evento 
ADD COLUMN IF NOT EXISTS teenagers_tipo_comida VARCHAR(50),
ADD COLUMN IF NOT EXISTS teenagers_tipo_pasta VARCHAR(50);

-- Comentarios para documentación
COMMENT ON COLUMN ajustes_evento.teenagers_tipo_comida IS 'Tipo de comida para teenagers: "pasta" o "menu"';
COMMENT ON COLUMN ajustes_evento.teenagers_tipo_pasta IS 'Tipo de pasta si teenagers_tipo_comida es "pasta": "napolitana" o "alfredo"';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ajustes_evento' 
  AND column_name IN ('teenagers_tipo_comida', 'teenagers_tipo_pasta')
ORDER BY column_name;

