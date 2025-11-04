-- Agregar campo homenajeado a ofertas y contratos
-- Ejecutar con: \i 'C:/Users/eac/Desktop/DiamondSistem/database/agregar_homenajeado.sql'

-- 1. Agregar columna a ofertas
ALTER TABLE ofertas
ADD COLUMN IF NOT EXISTS homenajeado VARCHAR(200);

-- 2. Agregar columna a contratos
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS homenajeado VARCHAR(200);

-- 3. Verificar cambios
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('ofertas', 'contratos') 
AND column_name = 'homenajeado';

