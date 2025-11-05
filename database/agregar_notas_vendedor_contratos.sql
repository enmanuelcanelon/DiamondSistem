-- Agregar campo notas_vendedor a contratos
-- Este campo ya existe en ofertas, pero falta en contratos

ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS notas_vendedor TEXT;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contratos' 
AND column_name = 'notas_vendedor';




