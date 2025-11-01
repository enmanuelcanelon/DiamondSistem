-- =====================================================
-- MIGRACION: Sistema de Ajustes del Evento
-- Descripcion: Agrega tabla para personalizacion de detalles del evento
-- =====================================================

-- Tabla de Ajustes del Evento
CREATE TABLE IF NOT EXISTS ajustes_evento (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL UNIQUE,
    
    -- TORTA
    sabor_torta VARCHAR(100),
    tamano_torta VARCHAR(50),
    tipo_relleno VARCHAR(100),
    diseno_torta TEXT,
    notas_torta TEXT,
    
    -- DECORACION
    estilo_decoracion VARCHAR(100),
    colores_principales TEXT, -- JSON array de colores
    flores_preferidas VARCHAR(255),
    tematica VARCHAR(100),
    notas_decoracion TEXT,
    
    -- MENU
    tipo_servicio VARCHAR(50), -- buffet, plated, estaciones
    entrada VARCHAR(255),
    plato_principal VARCHAR(255),
    acompanamientos TEXT, -- JSON array
    opciones_vegetarianas TEXT,
    opciones_veganas TEXT,
    restricciones_alimentarias TEXT,
    bebidas_incluidas TEXT, -- JSON array
    notas_menu TEXT,
    
    -- ENTRETENIMIENTO
    musica_ceremonial VARCHAR(255),
    primer_baile VARCHAR(255),
    baile_padre_hija VARCHAR(255),
    baile_madre_hijo VARCHAR(255),
    hora_show VARCHAR(50),
    actividades_especiales TEXT,
    notas_entretenimiento TEXT,
    
    -- FOTOGRAFIA Y VIDEO
    momentos_especiales TEXT, -- JSON array de momentos que quieren capturar
    poses_especificas TEXT,
    ubicaciones_fotos TEXT,
    notas_fotografia TEXT,
    
    -- OTROS DETALLES
    invitado_honor VARCHAR(255),
    brindis_especial VARCHAR(255),
    sorpresas_planeadas TEXT,
    solicitudes_especiales TEXT,
    
    -- CONTROL
    porcentaje_completado INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

-- Indice para busqueda rapida
CREATE INDEX IF NOT EXISTS idx_ajustes_contrato ON ajustes_evento(contrato_id);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_ajustes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    
    -- Calcular porcentaje completado (campos importantes completados)
    NEW.porcentaje_completado = (
        CASE WHEN NEW.sabor_torta IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.estilo_decoracion IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.tipo_servicio IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.plato_principal IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.colores_principales IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.musica_ceremonial IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.primer_baile IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.momentos_especiales IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.bebidas_incluidas IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.tematica IS NOT NULL THEN 10 ELSE 0 END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_ajustes
    BEFORE UPDATE ON ajustes_evento
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_ajustes();

-- Trigger para calcular porcentaje en INSERT
CREATE TRIGGER trigger_calcular_porcentaje_insert
    BEFORE INSERT ON ajustes_evento
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_ajustes();

-- Comentarios para documentacion
COMMENT ON TABLE ajustes_evento IS 'Almacena las preferencias y ajustes personalizados de cada evento';
COMMENT ON COLUMN ajustes_evento.porcentaje_completado IS 'Porcentaje de campos importantes completados (0-100)';
COMMENT ON COLUMN ajustes_evento.colores_principales IS 'Array JSON de colores en formato hexadecimal o nombres';
COMMENT ON COLUMN ajustes_evento.acompanamientos IS 'Array JSON de acompanamientos del menu';
COMMENT ON COLUMN ajustes_evento.tipo_servicio IS 'Tipo de servicio de comida: buffet, plated (servido), estaciones';

