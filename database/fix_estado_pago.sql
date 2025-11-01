-- =====================================================
-- Corrección: Estado de Pago cuando saldo_pendiente = 0
-- Descripción: Actualiza el trigger y corrige registros existentes
-- Fecha: Noviembre 2025
-- =====================================================

-- 1. Actualizar la función del trigger
CREATE OR REPLACE FUNCTION actualizar_saldo_contrato()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_saldo_pendiente DECIMAL(10, 2);
BEGIN
    -- Calcular el nuevo saldo pendiente
    SELECT total_contrato - (total_pagado + NEW.monto_total)
    INTO nuevo_saldo_pendiente
    FROM contratos
    WHERE id = NEW.contrato_id;
    
    UPDATE contratos
    SET 
        total_pagado = total_pagado + NEW.monto_total,
        saldo_pendiente = nuevo_saldo_pendiente,
        estado_pago = CASE 
            -- Si saldo pendiente es 0 o negativo, está completado
            WHEN nuevo_saldo_pendiente <= 0 THEN 'completado'
            -- Si ha pagado algo pero aún debe, está parcial
            WHEN (total_pagado + NEW.monto_total) > 0 THEN 'parcial'
            -- Si no ha pagado nada y el saldo es mayor a 0, está pendiente
            ELSE 'pendiente'
        END
    WHERE id = NEW.contrato_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Corregir contratos existentes donde saldo_pendiente = 0 pero estado_pago != 'completado'
UPDATE contratos
SET estado_pago = 'completado'
WHERE saldo_pendiente <= 0 AND estado_pago != 'completado';

-- 3. Corregir contratos donde el estado de pago no coincide con los montos
UPDATE contratos
SET estado_pago = CASE 
    -- Si saldo pendiente es 0 o negativo, está completado
    WHEN saldo_pendiente <= 0 THEN 'completado'
    -- Si ha pagado algo pero aún debe, está parcial
    WHEN total_pagado > 0 AND saldo_pendiente > 0 THEN 'parcial'
    -- Si no ha pagado nada, está pendiente
    WHEN total_pagado = 0 THEN 'pendiente'
    ELSE estado_pago
END
WHERE 
    (saldo_pendiente <= 0 AND estado_pago != 'completado')
    OR (total_pagado > 0 AND saldo_pendiente > 0 AND estado_pago NOT IN ('parcial', 'completado'))
    OR (total_pagado = 0 AND saldo_pendiente > 0 AND estado_pago != 'pendiente');

-- 4. Mostrar estadísticas de correcciones
SELECT 
    'Total de contratos corregidos' AS descripcion,
    COUNT(*) AS cantidad
FROM contratos
WHERE 
    (saldo_pendiente <= 0 AND estado_pago = 'completado')
    OR (total_pagado > 0 AND saldo_pendiente > 0 AND estado_pago = 'parcial')
    OR (total_pagado = 0 AND saldo_pendiente > 0 AND estado_pago = 'pendiente');

-- 5. Mostrar contratos con saldo 0
SELECT 
    id,
    codigo_contrato,
    total_contrato,
    total_pagado,
    saldo_pendiente,
    estado_pago,
    CASE 
        WHEN saldo_pendiente <= 0 THEN 'CORRECTO'
        ELSE 'REVISAR'
    END AS estado
FROM contratos
WHERE saldo_pendiente <= 0
ORDER BY id DESC
LIMIT 10;

-- =====================================================
-- Fin de la migración
-- =====================================================

