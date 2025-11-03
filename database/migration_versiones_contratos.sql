-- ==================================================
-- MIGRACIÓN: SISTEMA DE VERSIONES DE CONTRATOS PDF
-- ==================================================
-- Permite guardar múltiples versiones de contratos cuando hay cambios de precio
-- Cada vez que se aprueba un cambio, se genera y guarda una nueva versión

-- Tabla: versiones_contratos_pdf
CREATE TABLE IF NOT EXISTS versiones_contratos_pdf (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    version_numero INTEGER NOT NULL,
    total_contrato DECIMAL(10,2) NOT NULL,
    cantidad_invitados INTEGER,
    motivo_cambio TEXT,
    cambios_detalle JSONB, -- JSON con detalles de qué cambió
    pdf_contenido BYTEA, -- Contenido del PDF guardado en base de datos
    generado_por INTEGER REFERENCES vendedores(id),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(contrato_id, version_numero),
    CHECK (version_numero > 0)
);

-- Índices para mejorar consultas
CREATE INDEX idx_versiones_contratos_contrato ON versiones_contratos_pdf(contrato_id);
CREATE INDEX idx_versiones_contratos_fecha ON versiones_contratos_pdf(fecha_generacion DESC);

-- Comentarios
COMMENT ON TABLE versiones_contratos_pdf IS 'Almacena versiones históricas de contratos PDF cuando hay cambios';
COMMENT ON COLUMN versiones_contratos_pdf.version_numero IS 'Número de versión secuencial (1, 2, 3...)';
COMMENT ON COLUMN versiones_contratos_pdf.pdf_contenido IS 'Contenido binario del PDF generado';
COMMENT ON COLUMN versiones_contratos_pdf.cambios_detalle IS 'JSON con detalles de los cambios (servicios agregados, invitados, etc)';

-- ==================================================
-- FUNCIÓN: Obtener próximo número de versión
-- ==================================================
CREATE OR REPLACE FUNCTION obtener_proximo_numero_version(p_contrato_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_ultima_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_numero), 0) + 1
    INTO v_ultima_version
    FROM versiones_contratos_pdf
    WHERE contrato_id = p_contrato_id;
    
    RETURN v_ultima_version;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- TRIGGER: Crear versión inicial al crear contrato
-- ==================================================
-- Este trigger crea automáticamente la versión 1 cuando se firma un contrato
CREATE OR REPLACE FUNCTION crear_version_inicial_contrato()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear versión inicial si el contrato está confirmado/firmado
    IF NEW.estado = 'confirmado' THEN
        INSERT INTO versiones_contratos_pdf (
            contrato_id,
            version_numero,
            total_contrato,
            cantidad_invitados,
            motivo_cambio,
            cambios_detalle,
            generado_por,
            fecha_generacion
        ) VALUES (
            NEW.id,
            1,
            NEW.total_contrato,
            NEW.cantidad_invitados,
            'Versión inicial del contrato',
            jsonb_build_object(
                'tipo', 'inicial',
                'paquete_id', NEW.paquete_id,
                'fecha_evento', NEW.fecha_evento
            ),
            NEW.vendedor_id,
            NEW.fecha_firma
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asociar trigger a la tabla contratos
DROP TRIGGER IF EXISTS trigger_crear_version_inicial ON contratos;
CREATE TRIGGER trigger_crear_version_inicial
    AFTER INSERT ON contratos
    FOR EACH ROW
    EXECUTE FUNCTION crear_version_inicial_contrato();

-- ==================================================
-- VISTA: Resumen de versiones por contrato
-- ==================================================
CREATE OR REPLACE VIEW vista_versiones_contratos AS
SELECT 
    v.id,
    v.contrato_id,
    v.version_numero,
    v.total_contrato,
    v.cantidad_invitados,
    v.motivo_cambio,
    v.fecha_generacion,
    c.codigo_contrato,
    cl.nombre_completo AS cliente_nombre,
    vd.nombre_completo AS vendedor_nombre,
    -- Diferencia con versión anterior
    LAG(v.total_contrato) OVER (PARTITION BY v.contrato_id ORDER BY v.version_numero) AS total_anterior,
    v.total_contrato - LAG(v.total_contrato) OVER (PARTITION BY v.contrato_id ORDER BY v.version_numero) AS diferencia_precio
FROM versiones_contratos_pdf v
INNER JOIN contratos c ON v.contrato_id = c.id
INNER JOIN clientes cl ON c.cliente_id = cl.id
LEFT JOIN vendedores vd ON v.generado_por = vd.id
ORDER BY v.contrato_id, v.version_numero DESC;

-- ==================================================
-- DATOS DE PRUEBA (Opcional - Comentado por defecto)
-- ==================================================
-- Descomentar para crear versiones de prueba para contratos existentes

/*
-- Crear versión inicial para todos los contratos existentes que no tengan
INSERT INTO versiones_contratos_pdf (
    contrato_id,
    version_numero,
    total_contrato,
    cantidad_invitados,
    motivo_cambio,
    cambios_detalle,
    generado_por,
    fecha_generacion
)
SELECT 
    c.id,
    1,
    c.total_contrato,
    c.cantidad_invitados,
    'Versión inicial - Migración',
    jsonb_build_object(
        'tipo', 'migracion',
        'paquete_id', c.paquete_id,
        'fecha_evento', c.fecha_evento
    ),
    c.vendedor_id,
    c.fecha_firma
FROM contratos c
WHERE c.estado = 'confirmado'
AND NOT EXISTS (
    SELECT 1 FROM versiones_contratos_pdf v
    WHERE v.contrato_id = c.id
);
*/

-- ==================================================
-- VERIFICACIÓN
-- ==================================================
-- Consultar versiones creadas
-- SELECT * FROM vista_versiones_contratos;

-- Ver cuántas versiones tiene cada contrato
-- SELECT contrato_id, codigo_contrato, COUNT(*) as total_versiones
-- FROM vista_versiones_contratos
-- GROUP BY contrato_id, codigo_contrato
-- ORDER BY total_versiones DESC;

