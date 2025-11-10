-- Tabla para almacenar las listas de compra generadas
CREATE TABLE IF NOT EXISTS listas_compra (
    id SERIAL PRIMARY KEY,
    items JSONB NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_recepcion TIMESTAMP,
    recibida BOOLEAN DEFAULT false,
    usuario_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_listas_compra_recibida ON listas_compra(recibida);
CREATE INDEX IF NOT EXISTS idx_listas_compra_fecha_creacion ON listas_compra(fecha_creacion DESC);

