-- =====================================================
-- MIGRACIÓN: SISTEMA DE SALONES
-- =====================================================
-- Implementa el sistema de salones (Diamond, Kendall, Doral)
-- con capacidades máximas, precios personalizados por paquete,
-- y reglas específicas para cada salón.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREAR TABLA DE SALONES
-- =====================================================

CREATE TABLE IF NOT EXISTS salones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    capacidad_maxima INTEGER NOT NULL,
    descripcion TEXT,
    pisos_torta INTEGER DEFAULT 3, -- Pisos de torta por defecto para este salón
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE salones IS 'Salones disponibles para eventos con sus capacidades y características';
COMMENT ON COLUMN salones.capacidad_maxima IS 'Máximo de invitados permitidos en este salón';
COMMENT ON COLUMN salones.pisos_torta IS 'Número de pisos de torta por defecto (Diamond=3, Kendall/Doral=2)';

-- =====================================================
-- 2. CREAR TABLA DE PAQUETES POR SALÓN
-- =====================================================

CREATE TABLE IF NOT EXISTS paquetes_salones (
    id SERIAL PRIMARY KEY,
    paquete_id INTEGER REFERENCES paquetes(id) ON DELETE CASCADE,
    salon_id INTEGER REFERENCES salones(id) ON DELETE CASCADE,
    precio_base DECIMAL(10,2) NOT NULL,
    invitados_minimo INTEGER NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    UNIQUE(paquete_id, salon_id)
);

COMMENT ON TABLE paquetes_salones IS 'Precios personalizados de paquetes según el salón';
COMMENT ON COLUMN paquetes_salones.precio_base IS 'Precio base del paquete para este salón específico';
COMMENT ON COLUMN paquetes_salones.invitados_minimo IS 'Mínimo de invitados para este paquete en este salón';
COMMENT ON COLUMN paquetes_salones.disponible IS 'Si el paquete está disponible en este salón';

-- =====================================================
-- 3. AGREGAR CAMPO SALON A OFERTAS
-- =====================================================

ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS salon_id INTEGER REFERENCES salones(id);
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS lugar_salon VARCHAR(100); -- Nombre del salón para referencia rápida

COMMENT ON COLUMN ofertas.salon_id IS 'Salón seleccionado para el evento';
COMMENT ON COLUMN ofertas.lugar_salon IS 'Nombre del salón (desnormalizado para rapidez)';

-- =====================================================
-- 4. AGREGAR CAMPO SALON A CONTRATOS
-- =====================================================

ALTER TABLE contratos ADD COLUMN IF NOT EXISTS salon_id INTEGER REFERENCES salones(id);
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS lugar_salon VARCHAR(100); -- Nombre del salón para referencia rápida

COMMENT ON COLUMN contratos.salon_id IS 'Salón donde se realizará el evento';
COMMENT ON COLUMN contratos.lugar_salon IS 'Nombre del salón (desnormalizado para rapidez)';

-- =====================================================
-- 5. POBLAR TABLA DE SALONES
-- =====================================================

INSERT INTO salones (nombre, capacidad_maxima, pisos_torta, descripcion, activo) VALUES
('Diamond', 200, 3, 'Salón principal con capacidad para hasta 200 invitados', TRUE),
('Kendall', 80, 2, 'Salón Kendall con capacidad para hasta 80 invitados', TRUE),
('Doral', 60, 2, 'Salón Doral con capacidad para hasta 60 invitados', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    capacidad_maxima = EXCLUDED.capacidad_maxima,
    pisos_torta = EXCLUDED.pisos_torta,
    descripcion = EXCLUDED.descripcion;

-- =====================================================
-- 6. POBLAR PAQUETES POR SALÓN
-- =====================================================

-- Obtener IDs de paquetes (asumiendo que ya existen)
DO $$
DECLARE
    v_especial_id INTEGER;
    v_personalizado_id INTEGER;
    v_platino_id INTEGER;
    v_diamond_id INTEGER;
    v_deluxe_id INTEGER;
    v_diamond_salon_id INTEGER;
    v_kendall_salon_id INTEGER;
    v_doral_salon_id INTEGER;
BEGIN
    -- Obtener IDs de paquetes
    SELECT id INTO v_especial_id FROM paquetes WHERE LOWER(nombre) = 'especial';
    SELECT id INTO v_personalizado_id FROM paquetes WHERE LOWER(nombre) = 'personalizado';
    SELECT id INTO v_platino_id FROM paquetes WHERE LOWER(nombre) LIKE '%plat%';
    SELECT id INTO v_diamond_id FROM paquetes WHERE LOWER(nombre) = 'diamond';
    SELECT id INTO v_deluxe_id FROM paquetes WHERE LOWER(nombre) = 'deluxe';
    
    -- Obtener IDs de salones
    SELECT id INTO v_diamond_salon_id FROM salones WHERE nombre = 'Diamond';
    SELECT id INTO v_kendall_salon_id FROM salones WHERE nombre = 'Kendall';
    SELECT id INTO v_doral_salon_id FROM salones WHERE nombre = 'Doral';

    -- ===== SALÓN DIAMOND (precios originales) =====
    -- Especial: $3,500, 80 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_especial_id, v_diamond_salon_id, 3500.00, 80, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Personalizado: $6,000, 50 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_personalizado_id, v_diamond_salon_id, 6000.00, 50, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Platino: $7,500, 80 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_platino_id, v_diamond_salon_id, 7500.00, 80, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Diamond: $10,500, 80 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_diamond_id, v_diamond_salon_id, 10500.00, 80, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Deluxe: $12,500, 80 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_deluxe_id, v_diamond_salon_id, 12500.00, 80, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- ===== SALÓN KENDALL (precios ajustados, sin Deluxe) =====
    -- Especial: $2,500, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_especial_id, v_kendall_salon_id, 2500.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Personalizado: $3,500, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_personalizado_id, v_kendall_salon_id, 3500.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Platino: $4,200, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_platino_id, v_kendall_salon_id, 4200.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Diamond: $5,500, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_diamond_id, v_kendall_salon_id, 5500.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Deluxe: NO DISPONIBLE en Kendall
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_deluxe_id, v_kendall_salon_id, 0.00, 60, FALSE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        disponible = FALSE;

    -- ===== SALÓN DORAL (precios ajustados, sin Deluxe) =====
    -- Especial: $2,500, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_especial_id, v_doral_salon_id, 2500.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Personalizado: $3,500, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_personalizado_id, v_doral_salon_id, 3500.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Platino: $4,200, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_platino_id, v_doral_salon_id, 4200.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Diamond: $5,500, 60 invitados mínimo
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_diamond_id, v_doral_salon_id, 5500.00, 60, TRUE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        invitados_minimo = EXCLUDED.invitados_minimo;

    -- Deluxe: NO DISPONIBLE en Doral
    INSERT INTO paquetes_salones (paquete_id, salon_id, precio_base, invitados_minimo, disponible)
    VALUES (v_deluxe_id, v_doral_salon_id, 0.00, 60, FALSE)
    ON CONFLICT (paquete_id, salon_id) DO UPDATE SET
        disponible = FALSE;

END $$;

-- =====================================================
-- 7. ACTUALIZAR CAMPOS DE TORTA EN AJUSTES_EVENTO
-- =====================================================

-- Agregar campos específicos para torta según especificación
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS sabor_torta VARCHAR(50); -- vainilla, marmoleado u otro
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS sabor_otro VARCHAR(100); -- Si selecciona "Otro" en sabor
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS diseno_torta VARCHAR(50); -- channel, delux, blanco, desnudo u otro
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS diseno_otro VARCHAR(100); -- Si selecciona "Otro" en diseño
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS pisos_torta INTEGER; -- Automático según salón (no editable por cliente)

COMMENT ON COLUMN ajustes_evento.sabor_torta IS 'Sabor de la torta: vainilla, marmoleado u otro';
COMMENT ON COLUMN ajustes_evento.sabor_otro IS 'Sabor personalizado cuando selecciona "Otro"';
COMMENT ON COLUMN ajustes_evento.diseno_torta IS 'Diseño de la torta: channel, delux, blanco, desnudo u otro';
COMMENT ON COLUMN ajustes_evento.diseno_otro IS 'Diseño personalizado cuando selecciona "Otro"';
COMMENT ON COLUMN ajustes_evento.pisos_torta IS 'Número de pisos (automático según salón: Diamond=3, Kendall/Doral=2)';

-- Campos para menú con teenagers/kids
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS hay_teenagers BOOLEAN DEFAULT FALSE;
ALTER TABLE ajustes_evento ADD COLUMN IF NOT EXISTS cantidad_teenagers INTEGER DEFAULT 0;

COMMENT ON COLUMN ajustes_evento.hay_teenagers IS 'Indica si habrá teenagers/kids en el evento (menu especial: pasta con pollo)';
COMMENT ON COLUMN ajustes_evento.cantidad_teenagers IS 'Cantidad de teenagers/kids para menu especial';

-- =====================================================
-- 8. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ofertas_salon ON ofertas(salon_id);
CREATE INDEX IF NOT EXISTS idx_contratos_salon ON contratos(salon_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_salones_disponible ON paquetes_salones(disponible);

COMMIT;

-- =====================================================
-- 9. VERIFICACIÓN
-- =====================================================

SELECT 
    'Migración completada exitosamente' as resultado,
    (SELECT COUNT(*) FROM salones) as total_salones,
    (SELECT COUNT(*) FROM paquetes_salones) as total_paquetes_salones;

-- Mostrar configuración de salones
SELECT nombre, capacidad_maxima, pisos_torta, activo FROM salones ORDER BY capacidad_maxima DESC;

-- Mostrar paquetes por salón
SELECT 
    s.nombre as salon,
    p.nombre as paquete,
    ps.precio_base,
    ps.invitados_minimo,
    ps.disponible
FROM paquetes_salones ps
JOIN salones s ON ps.salon_id = s.id
JOIN paquetes p ON ps.paquete_id = p.id
ORDER BY s.nombre, ps.precio_base;

