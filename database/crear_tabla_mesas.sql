-- Crear tabla mesas
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    numero_mesa INTEGER NOT NULL,
    capacidad INTEGER DEFAULT 10 NOT NULL,
    nombre_mesa VARCHAR(100),
    notas TEXT,
    fecha_creacion TIMESTAMP(6) DEFAULT NOW(),
    UNIQUE(contrato_id, numero_mesa)
);

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_mesas_contrato ON mesas(contrato_id);

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla mesas creada exitosamente' AS mensaje;


