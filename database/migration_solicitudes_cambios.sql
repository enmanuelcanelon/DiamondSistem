-- =====================================================
-- Migración: Sistema de Solicitudes de Clientes
-- Descripción: Implementa la tabla solicitudes_cliente
--              para que clientes puedan solicitar cambios
--              y vendedores aprobarlos/rechazarlos
-- Fecha: Noviembre 2025
-- =====================================================

-- Verificar si la tabla ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitudes_cliente') THEN
        -- Crear tabla solicitudes_cliente
        CREATE TABLE solicitudes_cliente (
            id SERIAL PRIMARY KEY,
            contrato_id INT REFERENCES contratos(id) ON DELETE CASCADE,
            cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
            tipo_solicitud VARCHAR(50) NOT NULL CHECK (tipo_solicitud IN ('invitados', 'servicio')),
            
            -- Para solicitudes de invitados adicionales
            invitados_adicionales INT,
            
            -- Para solicitudes de servicios adicionales
            servicio_id INT REFERENCES servicios(id),
            cantidad_servicio INT DEFAULT 1,
            detalles_solicitud TEXT,
            costo_adicional DECIMAL(10, 2),
            
            -- Estado y gestión
            estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
            motivo_rechazo TEXT,
            fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_respuesta TIMESTAMP,
            respondido_por INT REFERENCES vendedores(id)
        );
    END IF;
END $$;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_solicitudes_contrato ON solicitudes_cliente(contrato_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_cliente(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_cliente(tipo_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_cliente(fecha_solicitud DESC);

-- Índice compuesto para queries del vendedor
CREATE INDEX IF NOT EXISTS idx_solicitudes_vendedor ON solicitudes_cliente(estado, fecha_solicitud DESC);

-- Trigger para actualizar fecha_respuesta automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_respuesta_solicitud()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado != 'pendiente' AND OLD.estado = 'pendiente' THEN
        NEW.fecha_respuesta = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_solicitud ON solicitudes_cliente;
CREATE TRIGGER trigger_actualizar_solicitud
    BEFORE UPDATE ON solicitudes_cliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_respuesta_solicitud();

-- Vista para solicitudes con información del contrato y cliente
CREATE OR REPLACE VIEW vista_solicitudes_completas AS
SELECT 
    s.id,
    s.contrato_id,
    s.cliente_id,
    s.tipo_solicitud,
    s.invitados_adicionales,
    s.servicio_id,
    srv.nombre as nombre_servicio,
    srv.categoria,
    s.cantidad_servicio,
    s.detalles_solicitud,
    s.costo_adicional,
    s.estado,
    s.motivo_rechazo,
    s.fecha_solicitud,
    s.fecha_respuesta,
    s.respondido_por,
    -- Datos del contrato
    c.codigo_contrato,
    c.fecha_evento,
    c.total_contrato,
    c.vendedor_id,
    -- Datos del cliente
    cl.nombre_completo as cliente_nombre,
    cl.email as cliente_email,
    cl.telefono as cliente_telefono,
    -- Datos del vendedor
    v.nombre_completo as vendedor_nombre,
    v.codigo_vendedor
FROM solicitudes_cliente s
INNER JOIN contratos c ON s.contrato_id = c.id
INNER JOIN clientes cl ON s.cliente_id = cl.id
INNER JOIN vendedores v ON c.vendedor_id = v.id
LEFT JOIN servicios srv ON s.servicio_id = srv.id
ORDER BY s.fecha_solicitud DESC;

-- Función para contar solicitudes pendientes por vendedor
CREATE OR REPLACE FUNCTION contar_solicitudes_pendientes_vendedor(vendedor_id_param INT)
RETURNS INT AS $$
DECLARE
    total INT;
BEGIN
    SELECT COUNT(*)
    INTO total
    FROM solicitudes_cliente sc
    INNER JOIN contratos c ON sc.contrato_id = c.id
    WHERE c.vendedor_id = vendedor_id_param
    AND sc.estado = 'pendiente';
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener solicitudes por vendedor
CREATE OR REPLACE FUNCTION obtener_solicitudes_vendedor(
    vendedor_id_param INT,
    estado_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    solicitud_id INT,
    contrato_id INT,
    codigo_contrato VARCHAR,
    cliente_nombre VARCHAR,
    tipo_solicitud VARCHAR,
    detalles TEXT,
    invitados_adicionales INT,
    nombre_servicio VARCHAR,
    cantidad_servicio INT,
    costo_adicional DECIMAL,
    estado VARCHAR,
    fecha_solicitud TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.contrato_id,
        c.codigo_contrato,
        cl.nombre_completo,
        s.tipo_solicitud,
        s.detalles_solicitud,
        s.invitados_adicionales,
        srv.nombre,
        s.cantidad_servicio,
        s.costo_adicional,
        s.estado,
        s.fecha_solicitud
    FROM solicitudes_cliente s
    INNER JOIN contratos c ON s.contrato_id = c.id
    INNER JOIN clientes cl ON c.cliente_id = cl.id
    LEFT JOIN servicios srv ON s.servicio_id = srv.id
    WHERE c.vendedor_id = vendedor_id_param
    AND (estado_param IS NULL OR s.estado = estado_param)
    ORDER BY 
        CASE WHEN s.estado = 'pendiente' THEN 0 ELSE 1 END,
        s.fecha_solicitud DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE solicitudes_cliente IS 'Solicitudes de cambios realizadas por clientes que deben ser aprobadas por el vendedor asignado';
COMMENT ON COLUMN solicitudes_cliente.tipo_solicitud IS 'Tipo de solicitud: invitados (agregar más personas) o servicio (agregar servicio adicional)';
COMMENT ON COLUMN solicitudes_cliente.estado IS 'Estado de la solicitud: pendiente, aprobada, rechazada';
COMMENT ON COLUMN solicitudes_cliente.respondido_por IS 'ID del vendedor que respondió la solicitud';

-- =====================================================
-- Fin de la migración
-- =====================================================

