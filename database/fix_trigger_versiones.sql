-- ================================================
-- Arreglar trigger para crear version inicial
-- ================================================

-- Eliminar trigger anterior
DROP TRIGGER IF EXISTS trigger_crear_version_inicial ON contratos;
DROP FUNCTION IF EXISTS crear_version_inicial_contrato();

-- Crear nueva funcion (sin restriccion de estado)
CREATE OR REPLACE FUNCTION crear_version_inicial_contrato()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear version inicial para cualquier contrato nuevo
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
        'Version inicial del contrato',
        jsonb_build_object(
            'tipo', 'inicial',
            'paquete_id', NEW.paquete_id,
            'fecha_evento', NEW.fecha_evento
        ),
        NEW.vendedor_id,
        NEW.fecha_firma
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER trigger_crear_version_inicial
    AFTER INSERT ON contratos
    FOR EACH ROW
    EXECUTE FUNCTION crear_version_inicial_contrato();

SELECT 'Trigger actualizado correctamente' as resultado;

