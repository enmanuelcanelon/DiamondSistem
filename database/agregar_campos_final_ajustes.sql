-- Agregar nuevos campos a la tabla ajustes_evento para la sección "Final"
-- Campos: vestido_nina, observaciones_adicionales, items_especiales, protocolo

ALTER TABLE ajustes_evento
ADD COLUMN IF NOT EXISTS vestido_nina VARCHAR(500),
ADD COLUMN IF NOT EXISTS observaciones_adicionales TEXT,
ADD COLUMN IF NOT EXISTS items_especiales TEXT,
ADD COLUMN IF NOT EXISTS protocolo TEXT;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ajustes_evento'
  AND column_name IN ('vestido_nina', 'observaciones_adicionales', 'items_especiales', 'protocolo')
ORDER BY column_name;

