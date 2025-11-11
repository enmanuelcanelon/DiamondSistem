-- Agregar campos para pagos parciales de comisiones
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS comision_primera_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS comision_segunda_mitad_pagada_monto DECIMAL(10, 2) DEFAULT 0.00;

-- Actualizar los montos pagados basándose en los booleanos existentes
UPDATE contratos 
SET comision_primera_mitad_pagada_monto = comision_primera_mitad 
WHERE comision_primera_mitad_pagada = true AND comision_primera_mitad IS NOT NULL;

UPDATE contratos 
SET comision_segunda_mitad_pagada_monto = comision_segunda_mitad 
WHERE comision_segunda_mitad_pagada = true AND comision_segunda_mitad IS NOT NULL;

