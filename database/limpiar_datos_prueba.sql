-- ============================================
-- SCRIPT PARA LIMPIAR DATOS DE PRUEBA
-- ============================================
-- Este script elimina todos los clientes, ofertas y contratos
-- manteniendo intacta la estructura de la base de datos
-- ============================================

BEGIN;

-- ============================================
-- 1. VERIFICACIÓN INICIAL
-- ============================================
SELECT 'DATOS ANTES DE LA LIMPIEZA' AS info;

SELECT 
    'Clientes' AS tabla, 
    COUNT(*) AS total 
FROM clientes
UNION ALL
SELECT 
    'Ofertas' AS tabla, 
    COUNT(*) AS total 
FROM ofertas
UNION ALL
SELECT 
    'Contratos' AS tabla, 
    COUNT(*) AS total 
FROM contratos
UNION ALL
SELECT 
    'Pagos' AS tabla, 
    COUNT(*) AS total 
FROM pagos;

-- ============================================
-- 2. ELIMINAR DATOS EN ORDEN CORRECTO
-- (Respetando dependencias de claves foráneas)
-- ============================================

-- 2.1 Versiones de contratos PDF
DELETE FROM versiones_contratos_pdf;
SELECT 'Versiones de contratos eliminadas' AS paso;

-- 2.2 Eventos (si existe)
DELETE FROM eventos WHERE id IS NOT NULL;
SELECT 'Eventos eliminados' AS paso;

-- 2.3 Ajustes de eventos
DELETE FROM ajustes_evento;
SELECT 'Ajustes de eventos eliminados' AS paso;

-- 2.4 Playlist musical
DELETE FROM playlist_canciones;
SELECT 'Playlist eliminadas' AS paso;

-- 2.5 Invitados
DELETE FROM invitados;
SELECT 'Invitados eliminados' AS paso;

-- 2.6 Mesas (si existe - sistema de seating eliminado)
DELETE FROM mesas WHERE id IS NOT NULL;
SELECT 'Mesas eliminadas (si existía)' AS paso;

-- 2.7 Solicitudes de clientes
DELETE FROM solicitudes_cliente;
SELECT 'Solicitudes de clientes eliminadas' AS paso;

-- 2.8 Mensajes
DELETE FROM mensajes;
SELECT 'Mensajes eliminados' AS paso;

-- 2.9 Pagos de contratos
DELETE FROM pagos;
SELECT 'Pagos eliminados' AS paso;

-- 2.10 Servicios de contratos
DELETE FROM contratos_servicios;
SELECT 'Servicios de contratos eliminados' AS paso;

-- 2.11 Contratos
DELETE FROM contratos;
SELECT 'Contratos eliminados' AS paso;

-- 2.12 Servicios de ofertas
DELETE FROM ofertas_servicios_adicionales;
SELECT 'Servicios de ofertas eliminados' AS paso;

-- 2.13 Ofertas
DELETE FROM ofertas;
SELECT 'Ofertas eliminadas' AS paso;

-- 2.14 Clientes (finalmente)
DELETE FROM clientes;
SELECT 'Clientes eliminados' AS paso;

-- ============================================
-- 3. REINICIAR SECUENCIAS (CONTADORES)
-- ============================================
-- Esto reinicia los IDs auto-incrementales

ALTER SEQUENCE clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE ofertas_id_seq RESTART WITH 1;
ALTER SEQUENCE contratos_id_seq RESTART WITH 1;
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;
ALTER SEQUENCE mensajes_id_seq RESTART WITH 1;
ALTER SEQUENCE solicitudes_cliente_id_seq RESTART WITH 1;
ALTER SEQUENCE ajustes_evento_id_seq RESTART WITH 1;
ALTER SEQUENCE playlist_canciones_id_seq RESTART WITH 1;
ALTER SEQUENCE invitados_id_seq RESTART WITH 1;
ALTER SEQUENCE versiones_contratos_pdf_id_seq RESTART WITH 1;
ALTER SEQUENCE ofertas_servicios_adicionales_id_seq RESTART WITH 1;
ALTER SEQUENCE contratos_servicios_id_seq RESTART WITH 1;
ALTER SEQUENCE eventos_id_seq RESTART WITH 1;

SELECT 'Secuencias reiniciadas' AS paso;

-- ============================================
-- 4. VERIFICACIÓN FINAL
-- ============================================
SELECT 'DATOS DESPUÉS DE LA LIMPIEZA' AS info;

SELECT 
    'Clientes' AS tabla, 
    COUNT(*) AS total 
FROM clientes
UNION ALL
SELECT 
    'Ofertas' AS tabla, 
    COUNT(*) AS total 
FROM ofertas
UNION ALL
SELECT 
    'Contratos' AS tabla, 
    COUNT(*) AS total 
FROM contratos
UNION ALL
SELECT 
    'Pagos' AS tabla, 
    COUNT(*) AS total 
FROM pagos
UNION ALL
SELECT 
    'Mensajes' AS tabla, 
    COUNT(*) AS total 
FROM mensajes
UNION ALL
SELECT 
    'Solicitudes' AS tabla, 
    COUNT(*) AS total 
FROM solicitudes_cliente;

-- ============================================
-- 5. VERIFICAR INTEGRIDAD
-- ============================================
SELECT 'VERIFICACIÓN DE INTEGRIDAD' AS info;

-- Verificar que no hay huérfanos
SELECT 
    'Ofertas huérfanas' AS verificacion,
    COUNT(*) AS cantidad
FROM ofertas o
LEFT JOIN clientes c ON o.cliente_id = c.id
WHERE c.id IS NULL;

SELECT 
    'Contratos huérfanos' AS verificacion,
    COUNT(*) AS cantidad
FROM contratos co
LEFT JOIN clientes cl ON co.cliente_id = cl.id
WHERE cl.id IS NULL;

COMMIT;

-- ============================================
-- 6. RESUMEN
-- ============================================
SELECT '✅ LIMPIEZA COMPLETADA EXITOSAMENTE' AS resultado;
SELECT 'La base de datos está lista para nuevas pruebas' AS mensaje;
