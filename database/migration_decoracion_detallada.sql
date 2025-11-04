-- =====================================================
-- MIGRACION: Decoracion Detallada para Cliente
-- Descripcion: Agrega campos especificos para personalizacion de decoracion basica y premium
-- =====================================================

BEGIN;

-- Agregar columnas para tipo de decoracion
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS tipo_decoracion VARCHAR(50); -- 'basica' o 'premium'

-- ===== CAMPOS PARA DECORACION BASICA =====
-- Cojines
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS cojines_color VARCHAR(50); -- 'negros' o 'blancos'

-- Centro de mesa (una sola opción, "cilindro" incluye 3 cilindros)
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS centro_mesa_1 VARCHAR(50); -- flor, rojo, azul, rosada, blanco, arbol, candelabro, cilindro

-- Base
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS base_color VARCHAR(50); -- silver, dorado, clear, candelabro, arbol

-- Challer (cargadores de plato)
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS challer_color VARCHAR(50); -- dorado, silver, clear

-- Servilletas (con cantidades especificas)
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS servilletas JSONB; -- Array de objetos {color, cantidad}
/* Ejemplo: [{"color": "blanca", "cantidad": 80}, {"color": "rosada", "cantidad": 40}] */

-- Aros (anillos para servilleta)
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS aros_color VARCHAR(50); -- silver, dorado, clear
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS aros_nota TEXT; -- Para "otro"

-- Runner (camino de mesa)
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS runner_tipo VARCHAR(50); -- dorado, silver, morado, azul, rosado, verde, rojo, beige, negro, disco, blanco, gatsby
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS runner_nota TEXT; -- Para "otros"

-- Stage (escenario/fondo principal)
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS stage_tipo VARCHAR(50); -- 'globos' o 'flores'
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS stage_color_globos VARCHAR(100); -- Si elige globos

-- ===== CAMPOS PARA DECORACION PREMIUM =====
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS decoracion_premium_detalles TEXT; -- Detalles especiales como animales de peluche, columpios, etc.

-- ===== CAMPOS GENERALES ADICIONALES =====
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS estilo_decoracion_otro TEXT; -- Para cuando selecciona "Otro" en estilo

-- ===== OTROS DETALLES =====
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS hora_limosina TIME; -- Hora de recogida de limosina (si está contratada)

-- ===== MENÚ - TEENAGERS/KIDS =====
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS hay_teenagers BOOLEAN DEFAULT FALSE; -- Si hay teenagers/kids en el evento
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS cantidad_teenagers INTEGER DEFAULT 0; -- Cantidad de teenagers/kids

-- Registro de cambios
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS decoracion_completada BOOLEAN DEFAULT FALSE;

-- Comentarios para documentacion
COMMENT ON COLUMN ajustes_evento.tipo_decoracion IS 'Tipo de decoracion contratada: basica o premium';
COMMENT ON COLUMN ajustes_evento.centro_mesa_1 IS 'Centro de mesa (cilindro incluye 3 unidades)';
COMMENT ON COLUMN ajustes_evento.servilletas IS 'Array JSON de servilletas con color y cantidad. Blanca es ilimitada, otros colores tienen stock limitado';
COMMENT ON COLUMN ajustes_evento.stage_tipo IS 'Tipo de decoracion del escenario principal: globos o flores';
COMMENT ON COLUMN ajustes_evento.decoracion_premium_detalles IS 'Detalles especiales para decoracion premium (animales de peluche, estructuras, etc.)';
COMMENT ON COLUMN ajustes_evento.estilo_decoracion_otro IS 'Texto libre cuando el cliente selecciona "Otro" en estilo general';
COMMENT ON COLUMN ajustes_evento.hora_limosina IS 'Hora de recogida de limosina (solo si esta contratada)';
COMMENT ON COLUMN ajustes_evento.hay_teenagers IS 'Indica si habrá teenagers/kids en el evento (menu especial: pasta con pollo)';
COMMENT ON COLUMN ajustes_evento.cantidad_teenagers IS 'Cantidad de teenagers/kids para menu especial';

-- Crear indice para busquedas por tipo de decoracion
CREATE INDEX IF NOT EXISTS idx_ajustes_tipo_decoracion ON ajustes_evento(tipo_decoracion);

COMMIT;

-- =====================================================
-- VERIFICACION
-- =====================================================
SELECT 
    'Columnas agregadas correctamente' as resultado,
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'ajustes_evento' 
    AND column_name IN (
        'tipo_decoracion',
        'cojines_color',
        'centro_mesa_1',
        'base_color',
        'challer_color',
        'servilletas',
        'aros_color',
        'aros_nota',
        'runner_tipo',
        'runner_nota',
        'stage_tipo',
        'stage_color_globos',
        'decoracion_premium_detalles',
        'estilo_decoracion_otro',
        'sabor_torta',
        'sabor_otro',
        'diseno_torta',
        'diseno_otro',
        'pisos_torta',
        'hora_limosina',
        'hay_teenagers',
        'cantidad_teenagers',
        'decoracion_completada'
    );

