-- =====================================================
-- MIGRACIÓN: Sistema de Playlist Musical
-- Descripción: Agrega tabla para gestionar canciones del evento
-- =====================================================

-- Tabla de Playlist
CREATE TABLE IF NOT EXISTS playlist_canciones (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    artista VARCHAR(255),
    genero VARCHAR(100),
    categoria VARCHAR(50) DEFAULT 'favorita', -- favorita, prohibida, sugerida
    notas TEXT,
    orden INTEGER,
    reproducida BOOLEAN DEFAULT FALSE,
    agregado_por VARCHAR(50) DEFAULT 'cliente', -- cliente, vendedor
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_playlist_contrato ON playlist_canciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_playlist_categoria ON playlist_canciones(categoria);
CREATE INDEX IF NOT EXISTS idx_playlist_orden ON playlist_canciones(orden);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_playlist()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_playlist
    BEFORE UPDATE ON playlist_canciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_playlist();

-- Comentarios para documentación
COMMENT ON TABLE playlist_canciones IS 'Almacena las canciones para la playlist del evento';
COMMENT ON COLUMN playlist_canciones.categoria IS 'Tipo de canción: favorita (debe sonar), prohibida (no debe sonar), sugerida (opcional)';
COMMENT ON COLUMN playlist_canciones.orden IS 'Orden de reproducción para canciones favoritas';
COMMENT ON COLUMN playlist_canciones.reproducida IS 'Indica si la canción ya fue reproducida durante el evento';
COMMENT ON COLUMN playlist_canciones.agregado_por IS 'Quien agregó la canción: cliente o vendedor';



