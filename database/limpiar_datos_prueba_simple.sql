-- ================================================
-- LIMPIAR DATOS DE PRUEBA - Version Simple
-- ================================================

BEGIN;

-- Eliminar datos en orden correcto
DELETE FROM versiones_contratos_pdf;
DELETE FROM ajustes_evento;
DELETE FROM playlist_canciones;
DELETE FROM invitados;
DELETE FROM mesas;
DELETE FROM mensajes;
DELETE FROM solicitudes_cliente;
DELETE FROM historial_cambios_precios;
DELETE FROM eventos;
DELETE FROM pagos;
DELETE FROM contratos_servicios;
DELETE FROM contratos;
DELETE FROM ofertas_servicios_adicionales;
DELETE FROM ofertas;
DELETE FROM clientes;

-- Reiniciar secuencias
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

COMMIT;

-- Verificar limpieza
SELECT 'Limpieza completada exitosamente' as resultado;
SELECT COUNT(*) as clientes_restantes FROM clientes;
SELECT COUNT(*) as ofertas_restantes FROM ofertas;
SELECT COUNT(*) as contratos_restantes FROM contratos;

