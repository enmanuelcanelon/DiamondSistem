-- Migración para agregar Plan de Pagos a los contratos
-- Fecha: Noviembre 2025

BEGIN;

-- Agregar campos de plan de pagos a la tabla contratos
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(20) DEFAULT 'unico',
ADD COLUMN IF NOT EXISTS numero_plazos INTEGER,
ADD COLUMN IF NOT EXISTS plan_pagos JSONB;

-- Comentarios
COMMENT ON COLUMN contratos.tipo_pago IS 'Tipo de pago: "unico" o "plazos"';
COMMENT ON COLUMN contratos.numero_plazos IS 'Número de plazos mensuales (2-12)';
COMMENT ON COLUMN contratos.plan_pagos IS 'Detalle del plan de pagos en formato JSON';

-- Crear índice para búsquedas por tipo de pago
CREATE INDEX IF NOT EXISTS idx_contratos_tipo_pago ON contratos(tipo_pago);

COMMIT;

-- Ejemplo de estructura JSON para plan_pagos:
/*
{
  "depositoReserva": 500,
  "pagoInicial": 1000,
  "pagos": [
    {
      "numero": 1,
      "monto": 1000,
      "descripcion": "Pago mensual 1 de 6"
    },
    {
      "numero": 2,
      "monto": 1000,
      "descripcion": "Pago mensual 2 de 6"
    }
  ],
  "totalPagos": 8000
}
*/

