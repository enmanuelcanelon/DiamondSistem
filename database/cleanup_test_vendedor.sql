-- ============================================
-- Script para limpiar el vendedor de prueba
-- "Administrador Sistema" (ADMIN001) y todos sus datos relacionados
-- ============================================
-- IMPORTANTE: Este script elimina:
-- - El vendedor "Administrador Sistema" (ADMIN001)
-- - Todos sus clientes creados
-- - Todas sus ofertas
-- - Todos sus contratos y datos relacionados
-- ============================================

BEGIN;

-- 1. Obtener el ID del vendedor de prueba
DO $$
DECLARE
    vendedor_test_id INT;
BEGIN
    -- Buscar el ID del vendedor "Administrador Sistema"
    SELECT id INTO vendedor_test_id 
    FROM vendedores 
    WHERE codigo_vendedor = 'ADMIN001' 
       OR email = 'admin@diamondsistem.com'
       OR nombre_completo = 'Administrador Sistema';
    
    IF vendedor_test_id IS NULL THEN
        RAISE NOTICE 'No se encontró el vendedor de prueba. Puede que ya haya sido eliminado.';
    ELSE
        RAISE NOTICE 'Eliminando datos del vendedor ID: %', vendedor_test_id;
        
        -- 2. Eliminar mensajes relacionados con contratos del vendedor
        DELETE FROM mensajes 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 3. Eliminar pagos relacionados con contratos del vendedor
        DELETE FROM pagos 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 4. Eliminar contratos_servicios relacionados con contratos del vendedor
        DELETE FROM contratos_servicios 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 5. Eliminar solicitudes_cliente relacionadas con contratos del vendedor
        DELETE FROM solicitudes_cliente 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 6. Eliminar solicitudes_cliente relacionadas con clientes del vendedor
        DELETE FROM solicitudes_cliente 
        WHERE cliente_id IN (
            SELECT id FROM clientes WHERE vendedor_id = vendedor_test_id
        );
        
        -- 7. Eliminar solicitudes_cliente donde el vendedor respondió
        DELETE FROM solicitudes_cliente 
        WHERE respondido_por = vendedor_test_id;
        
        -- 8. Eliminar versiones_contratos_pdf relacionadas con contratos del vendedor
        DELETE FROM versiones_contratos_pdf 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 9. Eliminar eventos relacionados con contratos del vendedor
        DELETE FROM eventos 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 10. Eliminar ajustes_evento relacionados con contratos del vendedor
        DELETE FROM ajustes_evento 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 11. Eliminar invitados relacionados con contratos del vendedor
        DELETE FROM invitados 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 12. Eliminar mesas relacionados con contratos del vendedor
        DELETE FROM mesas 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 13. Eliminar playlist_canciones relacionados con contratos del vendedor
        DELETE FROM playlist_canciones 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 14. Eliminar checklist_servicios_externos relacionados con contratos del vendedor
        DELETE FROM checklist_servicios_externos 
        WHERE contrato_id IN (
            SELECT id FROM contratos WHERE vendedor_id = vendedor_test_id
        );
        
        -- 15. Eliminar contratos del vendedor
        DELETE FROM contratos 
        WHERE vendedor_id = vendedor_test_id;
        
        -- 16. Eliminar ofertas_servicios_adicionales relacionadas con ofertas del vendedor
        DELETE FROM ofertas_servicios_adicionales 
        WHERE oferta_id IN (
            SELECT id FROM ofertas WHERE vendedor_id = vendedor_test_id
        );
        
        -- 17. Eliminar ofertas del vendedor
        DELETE FROM ofertas 
        WHERE vendedor_id = vendedor_test_id;
        
        -- 18. Eliminar clientes del vendedor
        DELETE FROM clientes 
        WHERE vendedor_id = vendedor_test_id;
        
        -- 19. Finalmente, eliminar el vendedor
        DELETE FROM vendedores 
        WHERE id = vendedor_test_id;
        
        RAISE NOTICE 'Limpieza completada exitosamente.';
    END IF;
END $$;

COMMIT;

-- Verificar que se eliminó correctamente
DO $$
DECLARE
    vendedor_count INT;
    clientes_count INT;
    ofertas_count INT;
    contratos_count INT;
BEGIN
    -- Verificar vendedor
    SELECT COUNT(*) INTO vendedor_count
    FROM vendedores 
    WHERE codigo_vendedor = 'ADMIN001' 
       OR email = 'admin@diamondsistem.com'
       OR nombre_completo = 'Administrador Sistema';
    
    -- Verificar clientes
    SELECT COUNT(*) INTO clientes_count
    FROM clientes c
    INNER JOIN vendedores v ON c.vendedor_id = v.id
    WHERE v.codigo_vendedor = 'ADMIN001' 
       OR v.email = 'admin@diamondsistem.com'
       OR v.nombre_completo = 'Administrador Sistema';
    
    -- Verificar ofertas
    SELECT COUNT(*) INTO ofertas_count
    FROM ofertas o
    INNER JOIN vendedores v ON o.vendedor_id = v.id
    WHERE v.codigo_vendedor = 'ADMIN001' 
       OR v.email = 'admin@diamondsistem.com'
       OR v.nombre_completo = 'Administrador Sistema';
    
    -- Verificar contratos
    SELECT COUNT(*) INTO contratos_count
    FROM contratos c
    INNER JOIN vendedores v ON c.vendedor_id = v.id
    WHERE v.codigo_vendedor = 'ADMIN001' 
       OR v.email = 'admin@diamondsistem.com'
       OR v.nombre_completo = 'Administrador Sistema';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESULTADO DE LA LIMPIEZA:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vendedores eliminados: %', CASE WHEN vendedor_count = 0 THEN '✓ OK' ELSE '✗ FALLO' END;
    RAISE NOTICE 'Clientes eliminados: %', CASE WHEN clientes_count = 0 THEN '✓ OK' ELSE '✗ FALLO' END;
    RAISE NOTICE 'Ofertas eliminadas: %', CASE WHEN ofertas_count = 0 THEN '✓ OK' ELSE '✗ FALLO' END;
    RAISE NOTICE 'Contratos eliminados: %', CASE WHEN contratos_count = 0 THEN '✓ OK' ELSE '✗ FALLO' END;
    RAISE NOTICE '========================================';
    
    IF vendedor_count = 0 AND clientes_count = 0 AND ofertas_count = 0 AND contratos_count = 0 THEN
        RAISE NOTICE '✓ LIMPIEZA COMPLETADA EXITOSAMENTE';
    ELSE
        RAISE WARNING '⚠ ALGUNOS DATOS AÚN EXISTEN';
    END IF;
END $$;

