-- =====================================================
-- MIGRACION: Sistema de Chat/Mensajeria
-- Descripcion: Sistema de comunicacion entre cliente y vendedor
-- =====================================================

-- La tabla 'mensajes' ya existe en el schema, solo necesitamos verificar
-- que tenga los campos necesarios y agregar indices

-- Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- Verificar si la columna 'leido' existe, si no, agregarla
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mensajes' AND column_name='leido') THEN
        ALTER TABLE mensajes ADD COLUMN leido BOOLEAN DEFAULT FALSE;
    END IF;

    -- Verificar si la columna 'tipo_remitente' existe, si no, agregarla
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mensajes' AND column_name='tipo_remitente') THEN
        ALTER TABLE mensajes ADD COLUMN tipo_remitente VARCHAR(20) DEFAULT 'vendedor';
    END IF;
END $$;

-- Indices para mejorar el rendimiento de consultas de chat
CREATE INDEX IF NOT EXISTS idx_mensajes_contrato_fecha ON mensajes(contrato_id, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_leido ON mensajes(leido) WHERE leido = FALSE;
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON mensajes(remitente_id, tipo_remitente);

-- Trigger para actualizar fecha de actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_mensaje()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_envio = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_fecha_mensaje ON mensajes;
CREATE TRIGGER trigger_fecha_mensaje
    BEFORE INSERT ON mensajes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_mensaje();

-- Comentarios
COMMENT ON COLUMN mensajes.leido IS 'Indica si el mensaje ha sido leido por el destinatario';
COMMENT ON COLUMN mensajes.tipo_remitente IS 'Tipo de usuario que envio el mensaje: vendedor o cliente';



