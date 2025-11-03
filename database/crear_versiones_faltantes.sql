-- ================================================
-- Crear versiones faltantes para contratos existentes
-- ================================================

-- Crear version 1 para todos los contratos que no tengan versiones
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
    'Version inicial del contrato',
    jsonb_build_object(
        'tipo', 'inicial',
        'paquete_id', c.paquete_id,
        'fecha_evento', c.fecha_evento
    ),
    c.vendedor_id,
    c.fecha_firma
FROM contratos c
WHERE NOT EXISTS (
    SELECT 1 FROM versiones_contratos_pdf v
    WHERE v.contrato_id = c.id
);

-- Ver cuantas versiones se crearon
SELECT COUNT(*) as versiones_creadas FROM versiones_contratos_pdf;

-- Ver contratos con versiones
SELECT 
    c.id,
    c.codigo_contrato,
    COUNT(v.id) as total_versiones
FROM contratos c
LEFT JOIN versiones_contratos_pdf v ON c.id = v.contrato_id
GROUP BY c.id, c.codigo_contrato
ORDER BY c.id;

