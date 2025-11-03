-- ==================================================
-- SCRIPT: LIMPIAR DATOS DE PRUEBA
-- ==================================================
-- Este script elimina todos los clientes, ofertas y contratos
-- manteniendo intactos los datos del catálogo (paquetes, servicios, temporadas)

-- IMPORTANTE: Ejecutar con precaución, esto eliminará datos permanentemente

BEGIN;

-- Mostrar estadísticas ANTES de la limpieza
SELECT '=== ESTADÍSTICAS ANTES DE LA LIMPIEZA ===' as info;

SELECT 
    'Clientes' as tabla, 
    COUNT(*) as total 
FROM clientes
UNION ALL
SELECT 'Ofertas', COUNT(*) FROM ofertas
UNION ALL
SELECT 'Contratos', COUNT(*) FROM contratos
UNION ALL
SELECT 'Pagos', COUNT(*) FROM pagos
UNION ALL
SELECT 'Eventos', COUNT(*) FROM eventos
UNION ALL
SELECT 'Solicitudes', COUNT(*) FROM solicitudes_cliente
UNION ALL
SELECT 'Mensajes', COUNT(*) FROM mensajes
UNION ALL
SELECT 'Mesas', COUNT(*) FROM mesas
UNION ALL
SELECT 'Invitados', COUNT(*) FROM invitados
UNION ALL
SELECT 'Playlist', COUNT(*) FROM playlist_canciones
UNION ALL
SELECT 'Ajustes Evento', COUNT(*) FROM ajustes_evento
UNION ALL
SELECT 'Historial Cambios', COUNT(*) FROM historial_cambios_precios
UNION ALL
SELECT 'Versiones PDF', COUNT(*) FROM versiones_contratos_pdf;

-- ==================================================
-- ELIMINACIÓN EN ORDEN (de dependientes a principales)
-- ==================================================

-- 1. Eliminar versiones de contratos PDF (nueva tabla)
DELETE FROM versiones_contratos_pdf;
SELECT 'Versiones PDF eliminadas' as paso;

-- 2. Eliminar ajustes de eventos
DELETE FROM ajustes_evento;
SELECT 'Ajustes de evento eliminados' as paso;

-- 3. Eliminar playlist
DELETE FROM playlist_canciones;
SELECT 'Playlist eliminada' as paso;

-- 4. Eliminar invitados
DELETE FROM invitados;
SELECT 'Invitados eliminados' as paso;

-- 5. Eliminar mesas
DELETE FROM mesas;
SELECT 'Mesas eliminadas' as paso;

-- 6. Eliminar mensajes
DELETE FROM mensajes;
SELECT 'Mensajes eliminados' as paso;

-- 7. Eliminar solicitudes de clientes
DELETE FROM solicitudes_cliente;
SELECT 'Solicitudes eliminadas' as paso;

-- 8. Eliminar historial de cambios de precios
DELETE FROM historial_cambios_precios;
SELECT 'Historial de cambios eliminado' as paso;

-- 9. Eliminar eventos
DELETE FROM eventos;
SELECT 'Eventos eliminados' as paso;

-- 10. Eliminar pagos
DELETE FROM pagos;
SELECT 'Pagos eliminados' as paso;

-- 11. Eliminar servicios de contratos
DELETE FROM contratos_servicios;
SELECT 'Servicios de contratos eliminados' as paso;

-- 12. Eliminar contratos
DELETE FROM contratos;
SELECT 'Contratos eliminados' as paso;

-- 13. Eliminar servicios adicionales de ofertas
DELETE FROM ofertas_servicios_adicionales;
SELECT 'Servicios adicionales de ofertas eliminados' as paso;

-- 14. Eliminar ofertas
DELETE FROM ofertas;
SELECT 'Ofertas eliminadas' as paso;

-- 15. Eliminar clientes
DELETE FROM clientes;
SELECT 'Clientes eliminados' as paso;

-- ==================================================
-- REINICIAR SECUENCIAS (para que los IDs vuelvan a 1)
-- ==================================================

ALTER SEQUENCE clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE ofertas_id_seq RESTART WITH 1;
ALTER SEQUENCE contratos_id_seq RESTART WITH 1;
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;
ALTER SEQUENCE eventos_id_seq RESTART WITH 1;
ALTER SEQUENCE solicitudes_cliente_id_seq RESTART WITH 1;
ALTER SEQUENCE mensajes_id_seq RESTART WITH 1;
ALTER SEQUENCE mesas_id_seq RESTART WITH 1;
ALTER SEQUENCE invitados_id_seq RESTART WITH 1;
ALTER SEQUENCE playlist_canciones_id_seq RESTART WITH 1;
ALTER SEQUENCE ajustes_evento_id_seq RESTART WITH 1;
ALTER SEQUENCE historial_cambios_precios_id_seq RESTART WITH 1;
ALTER SEQUENCE versiones_contratos_pdf_id_seq RESTART WITH 1;
ALTER SEQUENCE contratos_servicios_id_seq RESTART WITH 1;
ALTER SEQUENCE ofertas_servicios_adicionales_id_seq RESTART WITH 1;

SELECT 'Secuencias reiniciadas' as paso;

-- ==================================================
-- VERIFICACIÓN POST-LIMPIEZA
-- ==================================================

SELECT '=== ESTADÍSTICAS DESPUÉS DE LA LIMPIEZA ===' as info;

SELECT 
    'Clientes' as tabla, 
    COUNT(*) as total 
FROM clientes
UNION ALL
SELECT 'Ofertas', COUNT(*) FROM ofertas
UNION ALL
SELECT 'Contratos', COUNT(*) FROM contratos
UNION ALL
SELECT 'Pagos', COUNT(*) FROM pagos
UNION ALL
SELECT 'Eventos', COUNT(*) FROM eventos
UNION ALL
SELECT 'Solicitudes', COUNT(*) FROM solicitudes_cliente
UNION ALL
SELECT 'Mensajes', COUNT(*) FROM mensajes
UNION ALL
SELECT 'Mesas', COUNT(*) FROM mesas
UNION ALL
SELECT 'Invitados', COUNT(*) FROM invitados
UNION ALL
SELECT 'Playlist', COUNT(*) FROM playlist_canciones
UNION ALL
SELECT 'Ajustes Evento', COUNT(*) FROM ajustes_evento
UNION ALL
SELECT 'Historial Cambios', COUNT(*) FROM historial_cambios_precios
UNION ALL
SELECT 'Versiones PDF', COUNT(*) FROM versiones_contratos_pdf;

-- ==================================================
-- VERIFICAR QUE EL CATÁLOGO SIGUE INTACTO
-- ==================================================

SELECT '=== CATÁLOGO (NO ELIMINADO) ===' as info;

SELECT 
    'Vendedores' as tabla, 
    COUNT(*) as total 
FROM vendedores
UNION ALL
SELECT 'Paquetes', COUNT(*) FROM paquetes
UNION ALL
SELECT 'Servicios', COUNT(*) FROM servicios
UNION ALL
SELECT 'Temporadas', COUNT(*) FROM temporadas
UNION ALL
SELECT 'Paquetes-Servicios', COUNT(*) FROM paquetes_servicios
UNION ALL
SELECT 'Configuración', COUNT(*) FROM configuracion_sistema;

SELECT '✅ LIMPIEZA COMPLETADA - Base de datos lista para nuevas pruebas' as resultado;

-- COMMIT para confirmar los cambios
-- Si algo salió mal, puedes hacer ROLLBACK en lugar de COMMIT

COMMIT;

-- Para DESHACER los cambios (ejecutar ANTES del COMMIT):
-- ROLLBACK;

