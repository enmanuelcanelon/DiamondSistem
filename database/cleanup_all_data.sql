-- ============================================
-- Script para limpiar TODOS los clientes, ofertas y contratos
-- ============================================
-- IMPORTANTE: Este script elimina:
-- - Todos los clientes
-- - Todas las ofertas
-- - Todos los contratos y datos relacionados
-- - Todos los pagos
-- - Todos los mensajes relacionados
-- ============================================
-- NOTA: NO elimina:
-- - Vendedores
-- - Salones
-- - Paquetes
-- - Servicios
-- - Temporadas
-- - Estructura de la base de datos
-- ============================================

BEGIN;

-- 1. Eliminar mensajes relacionados con contratos
DELETE FROM mensajes 
WHERE contrato_id IS NOT NULL;

-- 2. Eliminar pagos relacionados con contratos
DELETE FROM pagos 
WHERE contrato_id IS NOT NULL;

-- 3. Eliminar pagos de reserva sin contrato (pagos con contrato_id NULL)
DELETE FROM pagos 
WHERE contrato_id IS NULL;

-- 4. Eliminar contratos_servicios
DELETE FROM contratos_servicios;

-- 5. Eliminar solicitudes_cliente relacionadas con contratos
DELETE FROM solicitudes_cliente 
WHERE contrato_id IS NOT NULL;

-- 6. Eliminar eventos relacionados con contratos
DELETE FROM eventos 
WHERE contrato_id IS NOT NULL;

-- 7. Eliminar ajustes_evento relacionados con contratos
DELETE FROM ajustes_evento 
WHERE contrato_id IS NOT NULL;

-- 8. Eliminar versiones_contratos_pdf
DELETE FROM versiones_contratos_pdf;

-- 9. Eliminar invitados relacionados con contratos
DELETE FROM invitados 
WHERE contrato_id IS NOT NULL;

-- 10. Eliminar mesas relacionadas con contratos
DELETE FROM mesas 
WHERE contrato_id IS NOT NULL;

-- 11. Eliminar playlist_canciones relacionadas con contratos
DELETE FROM playlist_canciones 
WHERE contrato_id IS NOT NULL;

-- 12. Eliminar checklist_servicios_externos relacionados con contratos
DELETE FROM checklist_servicios_externos 
WHERE contrato_id IS NOT NULL;

-- 13. Eliminar todos los contratos
DELETE FROM contratos;

-- 14. Eliminar ofertas_servicios_adicionales
DELETE FROM ofertas_servicios_adicionales;

-- 15. Eliminar todas las ofertas
DELETE FROM ofertas;

-- 16. Eliminar solicitudes_cliente relacionadas con clientes (las que quedan)
DELETE FROM solicitudes_cliente 
WHERE cliente_id IS NOT NULL;

-- 17. Eliminar todos los clientes
DELETE FROM clientes;

-- Verificar que se eliminaron correctamente
DO $$
DECLARE
    total_clientes INT;
    total_ofertas INT;
    total_contratos INT;
    total_pagos INT;
BEGIN
    SELECT COUNT(*) INTO total_clientes FROM clientes;
    SELECT COUNT(*) INTO total_ofertas FROM ofertas;
    SELECT COUNT(*) INTO total_contratos FROM contratos;
    SELECT COUNT(*) INTO total_pagos FROM pagos;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Limpieza completada:';
    RAISE NOTICE 'Clientes restantes: %', total_clientes;
    RAISE NOTICE 'Ofertas restantes: %', total_ofertas;
    RAISE NOTICE 'Contratos restantes: %', total_contratos;
    RAISE NOTICE 'Pagos restantes: %', total_pagos;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================
-- Script completado
-- ============================================

