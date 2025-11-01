-- ============================================
-- DIAMONDSISTEM - COMANDOS ÚTILES
-- Consultas frecuentes para administración
-- ============================================

-- ============================================
-- CONSULTAS DE VENDEDORES
-- ============================================

-- Ver todos los vendedores activos
SELECT id, nombre_completo, codigo_vendedor, email, total_ventas, total_comisiones
FROM vendedores
WHERE activo = TRUE
ORDER BY total_ventas DESC;

-- Ver rendimiento de un vendedor específico
SELECT 
    v.nombre_completo,
    COUNT(DISTINCT c.id) as total_contratos,
    SUM(c.total_contrato) as ventas_totales,
    SUM(c.comision_calculada) as comisiones_generadas,
    COUNT(DISTINCT cl.id) as total_clientes
FROM vendedores v
LEFT JOIN contratos c ON v.id = c.vendedor_id
LEFT JOIN clientes cl ON v.id = cl.vendedor_id
WHERE v.id = 1  -- Cambiar por ID del vendedor
GROUP BY v.id;

-- ============================================
-- CONSULTAS DE CONTRATOS Y EVENTOS
-- ============================================

-- Ver todos los contratos activos
SELECT * FROM vista_contratos_completos
WHERE estado_contrato = 'activo'
ORDER BY fecha_evento;

-- Eventos próximos (próximos 30 días)
SELECT 
    codigo_contrato,
    cliente_nombre,
    paquete_nombre,
    fecha_evento,
    hora_inicio,
    cantidad_invitados_confirmados,
    estado_evento
FROM vista_contratos_completos
WHERE fecha_evento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
AND estado_evento = 'en_proceso'
ORDER BY fecha_evento, hora_inicio;

-- Contratos con saldo pendiente
SELECT 
    codigo_contrato,
    cliente_nombre,
    cliente_email,
    cliente_telefono,
    total_contrato,
    total_pagado,
    saldo_pendiente,
    fecha_evento,
    EXTRACT(DAY FROM (fecha_evento - CURRENT_DATE)) as dias_para_evento
FROM vista_contratos_completos
WHERE estado_pago != 'completado'
AND fecha_evento > CURRENT_DATE
ORDER BY fecha_evento;

-- ============================================
-- CONSULTAS DE PAGOS
-- ============================================

-- Historial de pagos de un contrato
SELECT 
    p.id,
    p.monto,
    p.metodo_pago,
    p.recargo_tarjeta,
    p.monto_total,
    p.numero_referencia,
    p.fecha_pago,
    v.nombre_completo as registrado_por
FROM pagos p
JOIN vendedores v ON p.registrado_por = v.id
WHERE p.contrato_id = 1  -- Cambiar por ID del contrato
ORDER BY p.fecha_pago DESC;

-- Resumen de pagos del día
SELECT 
    COUNT(*) as total_pagos,
    SUM(monto_total) as total_recaudado,
    metodo_pago
FROM pagos
WHERE DATE(fecha_pago) = CURRENT_DATE
GROUP BY metodo_pago;

-- Pagos del mes
SELECT 
    COUNT(*) as total_pagos,
    SUM(monto_total) as total_recaudado
FROM pagos
WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE);

-- ============================================
-- CONSULTAS DE SOLICITUDES
-- ============================================

-- Ver todas las solicitudes pendientes
SELECT * FROM vista_solicitudes_pendientes
ORDER BY fecha_solicitud DESC;

-- Solicitudes de un contrato específico
SELECT 
    s.id,
    s.tipo_solicitud,
    s.detalles_solicitud,
    s.costo_adicional,
    s.estado,
    s.fecha_solicitud,
    s.fecha_respuesta,
    ser.nombre as servicio_solicitado,
    s.invitados_adicionales
FROM solicitudes_cliente s
LEFT JOIN servicios ser ON s.servicio_id = ser.id
WHERE s.contrato_id = 1  -- Cambiar por ID del contrato
ORDER BY s.fecha_solicitud DESC;

-- ============================================
-- CONSULTAS DE OFERTAS
-- ============================================

-- Ofertas pendientes de respuesta
SELECT 
    o.codigo_oferta,
    c.nombre_completo as cliente_nombre,
    c.email as cliente_email,
    c.telefono as cliente_telefono,
    p.nombre as paquete,
    o.fecha_evento,
    o.total_final,
    o.fecha_creacion,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - o.fecha_creacion)) as dias_pendiente
FROM ofertas o
JOIN clientes c ON o.cliente_id = c.id
JOIN paquetes p ON o.paquete_id = p.id
WHERE o.estado = 'pendiente'
ORDER BY o.fecha_creacion DESC;

-- Tasa de conversión de ofertas
SELECT 
    COUNT(*) as total_ofertas,
    SUM(CASE WHEN estado = 'aceptada' THEN 1 ELSE 0 END) as aceptadas,
    SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) as rechazadas,
    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
    ROUND(SUM(CASE WHEN estado = 'aceptada' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as tasa_conversion
FROM ofertas
WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- ESTADÍSTICAS GENERALES
-- ============================================

-- Dashboard general del sistema
SELECT 
    (SELECT COUNT(*) FROM contratos WHERE estado = 'activo') as contratos_activos,
    (SELECT COUNT(*) FROM eventos WHERE estado = 'en_proceso') as eventos_en_proceso,
    (SELECT COUNT(*) FROM vista_solicitudes_pendientes) as solicitudes_pendientes,
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    (SELECT COUNT(*) FROM vendedores WHERE activo = TRUE) as vendedores_activos,
    (SELECT SUM(total_contrato) FROM contratos WHERE estado_pago = 'completado' 
     AND EXTRACT(MONTH FROM fecha_firma) = EXTRACT(MONTH FROM CURRENT_DATE)) as ingresos_mes_actual;

-- Eventos por mes
SELECT 
    TO_CHAR(fecha_evento, 'YYYY-MM') as mes,
    COUNT(*) as total_eventos,
    SUM(c.total_contrato) as ingresos_totales
FROM eventos e
JOIN contratos c ON e.contrato_id = c.id
WHERE fecha_evento >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(fecha_evento, 'YYYY-MM')
ORDER BY mes DESC;

-- Servicios más solicitados
SELECT 
    s.nombre,
    s.categoria,
    COUNT(*) as veces_solicitado,
    SUM(cs.subtotal) as ingresos_generados
FROM contratos_servicios cs
JOIN servicios s ON cs.servicio_id = s.id
WHERE cs.incluido_en_paquete = FALSE
GROUP BY s.id, s.nombre, s.categoria
ORDER BY veces_solicitado DESC
LIMIT 10;

-- Paquetes más vendidos
SELECT 
    p.nombre,
    COUNT(c.id) as veces_vendido,
    SUM(c.total_contrato) as ingresos_totales,
    AVG(c.total_contrato) as ticket_promedio
FROM contratos c
JOIN paquetes p ON c.paquete_id = p.id
GROUP BY p.id, p.nombre
ORDER BY veces_vendido DESC;

-- ============================================
-- CONSULTAS DE ANÁLISIS
-- ============================================

-- Análisis por temporada
SELECT 
    t.nombre as temporada,
    COUNT(c.id) as contratos,
    SUM(c.total_contrato) as ingresos,
    AVG(c.total_contrato) as ticket_promedio
FROM contratos c
JOIN ofertas o ON c.oferta_id = o.id
JOIN temporadas t ON o.temporada_id = t.id
GROUP BY t.nombre
ORDER BY ingresos DESC;

-- Clientes por canal de adquisición
SELECT 
    como_nos_conocio,
    COUNT(*) as total_clientes,
    COUNT(DISTINCT c.id) as con_contrato
FROM clientes cl
LEFT JOIN contratos c ON cl.id = c.cliente_id
GROUP BY como_nos_conocio
ORDER BY total_clientes DESC;

-- Análisis de pagos vs eventos
SELECT 
    CASE 
        WHEN EXTRACT(DAY FROM (fecha_evento - CURRENT_DATE)) < 15 
             AND estado_pago != 'completado' THEN 'Urgente'
        WHEN EXTRACT(DAY FROM (fecha_evento - CURRENT_DATE)) < 30 
             AND estado_pago != 'completado' THEN 'Importante'
        ELSE 'Normal'
    END as prioridad,
    COUNT(*) as cantidad_contratos,
    SUM(saldo_pendiente) as total_pendiente
FROM vista_contratos_completos
WHERE fecha_evento > CURRENT_DATE
AND estado_pago != 'completado'
GROUP BY prioridad
ORDER BY 
    CASE prioridad 
        WHEN 'Urgente' THEN 1 
        WHEN 'Importante' THEN 2 
        ELSE 3 
    END;

-- ============================================
-- OPERACIONES DE MANTENIMIENTO
-- ============================================

-- Limpiar ofertas rechazadas antiguas (más de 6 meses)
-- CUIDADO: Esto elimina datos permanentemente
-- DELETE FROM ofertas 
-- WHERE estado = 'rechazada' 
-- AND fecha_creacion < CURRENT_DATE - INTERVAL '6 months';

-- Marcar eventos antiguos como finalizados
UPDATE eventos
SET estado = 'finalizado',
    fecha_finalizacion = CURRENT_TIMESTAMP
WHERE fecha_evento < CURRENT_DATE
AND estado = 'en_proceso';

-- Actualizar estadísticas de vendedores (por si hay inconsistencias)
UPDATE vendedores v
SET 
    total_ventas = (
        SELECT COALESCE(SUM(c.total_contrato), 0)
        FROM contratos c
        WHERE c.vendedor_id = v.id
        AND c.estado_pago = 'completado'
    ),
    total_comisiones = (
        SELECT COALESCE(SUM(c.comision_calculada), 0)
        FROM contratos c
        WHERE c.vendedor_id = v.id
        AND c.comision_pagada = TRUE
    );

-- ============================================
-- RESPALDOS Y EXPORTACIONES
-- ============================================

-- Exportar lista de clientes para marketing
SELECT 
    nombre_completo,
    email,
    telefono,
    tipo_evento,
    como_nos_conocio,
    CASE 
        WHEN EXISTS (SELECT 1 FROM contratos WHERE cliente_id = clientes.id) 
        THEN 'Con Contrato' 
        ELSE 'Prospecto' 
    END as estado
FROM clientes
ORDER BY fecha_registro DESC;

-- Reporte financiero mensual
SELECT 
    TO_CHAR(p.fecha_pago, 'YYYY-MM-DD') as fecha,
    COUNT(p.id) as num_pagos,
    SUM(p.monto_total) as total_recaudado,
    STRING_AGG(DISTINCT p.metodo_pago, ', ') as metodos_usados
FROM pagos p
WHERE p.fecha_pago >= DATE_TRUNC('month', CURRENT_DATE)
AND p.estado = 'completado'
GROUP BY TO_CHAR(p.fecha_pago, 'YYYY-MM-DD')
ORDER BY fecha DESC;

-- ============================================
-- CONSULTAS PARA DEBUGGING
-- ============================================

-- Ver contratos con inconsistencias en pagos
SELECT 
    c.codigo_contrato,
    c.total_contrato,
    c.total_pagado,
    c.saldo_pendiente,
    (SELECT COALESCE(SUM(monto_total), 0) FROM pagos WHERE contrato_id = c.id) as suma_pagos_real,
    c.estado_pago
FROM contratos c
WHERE c.total_pagado != (SELECT COALESCE(SUM(monto_total), 0) FROM pagos WHERE contrato_id = c.id);

-- Ver ofertas sin servicios
SELECT o.codigo_oferta, o.subtotal_servicios, COUNT(osa.id) as servicios_adicionales
FROM ofertas o
LEFT JOIN ofertas_servicios_adicionales osa ON o.id = osa.oferta_id
GROUP BY o.id
HAVING COUNT(osa.id) = 0 AND o.subtotal_servicios > 0;

-- Ver contratos sin eventos
SELECT c.codigo_contrato, c.fecha_firma, c.estado
FROM contratos c
LEFT JOIN eventos e ON c.id = e.contrato_id
WHERE e.id IS NULL
AND c.estado = 'activo';

