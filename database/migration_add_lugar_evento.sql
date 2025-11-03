-- Migración: Agregar campo lugar_evento a la tabla ofertas
-- Fecha: 01 de Noviembre 2025

-- Agregar columna lugar_evento a la tabla ofertas
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS lugar_evento VARCHAR(255);

-- Agregar comentario
COMMENT ON COLUMN ofertas.lugar_evento IS 'Lugar donde se realizará el evento';

-- Verificar que se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ofertas' AND column_name = 'lugar_evento';



