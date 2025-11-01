-- =====================================================
-- MIGRACIÓN: Sistema de Asignación de Mesas
-- Descripción: Agrega tablas para gestionar mesas e invitados
-- =====================================================

-- Tabla de Mesas
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL,
    numero_mesa INTEGER NOT NULL,
    nombre_mesa VARCHAR(100),
    capacidad INTEGER NOT NULL DEFAULT 10,
    forma VARCHAR(50) DEFAULT 'redonda', -- redonda, rectangular, cuadrada
    notas TEXT,
    posicion_x DECIMAL(10,2),
    posicion_y DECIMAL(10,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
    UNIQUE(contrato_id, numero_mesa)
);

-- Tabla de Invitados
CREATE TABLE IF NOT EXISTS invitados (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    tipo VARCHAR(50) DEFAULT 'adulto', -- adulto, niño, bebe
    mesa_id INTEGER,
    confirmado BOOLEAN DEFAULT FALSE,
    asistira BOOLEAN,
    restricciones_alimentarias TEXT,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_mesas_contrato ON mesas(contrato_id);
CREATE INDEX IF NOT EXISTS idx_invitados_contrato ON invitados(contrato_id);
CREATE INDEX IF NOT EXISTS idx_invitados_mesa ON invitados(mesa_id);

-- Trigger para actualizar fecha_actualizacion en mesas
CREATE OR REPLACE FUNCTION actualizar_fecha_mesas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_mesas
    BEFORE UPDATE ON mesas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_mesas();

-- Trigger para actualizar fecha_actualizacion en invitados
CREATE OR REPLACE FUNCTION actualizar_fecha_invitados()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_invitados
    BEFORE UPDATE ON invitados
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_invitados();

-- Comentarios para documentación
COMMENT ON TABLE mesas IS 'Almacena las mesas configuradas para cada evento';
COMMENT ON TABLE invitados IS 'Almacena la lista de invitados y su asignación a mesas';
COMMENT ON COLUMN invitados.tipo IS 'Tipo de invitado: adulto, niño, bebe';
COMMENT ON COLUMN invitados.confirmado IS 'Indica si el invitado ha confirmado su asistencia';
COMMENT ON COLUMN invitados.asistira IS 'Indica si el invitado asistirá (NULL = sin respuesta)';

