-- Script para verificar y eliminar cliente específico
-- Ejecutar en psql: \i 'C:/Users/eac/Desktop/DiamondSistem/database/verificar_y_eliminar_cliente.sql'

-- PASO 1: Ver TODOS los clientes actuales
SELECT 
    '=== TODOS LOS CLIENTES ACTUALES ===' AS info;
    
SELECT 
    id,
    nombre_completo,
    email,
    telefono,
    fecha_registro,
    vendedor_id
FROM clientes
ORDER BY id;

-- PASO 2: Ver detalles completos de cada cliente con sus contratos
SELECT 
    '=== DETALLES COMPLETOS ===' AS info;
    
SELECT 
    c.id AS cliente_id,
    c.nombre_completo,
    c.email,
    COUNT(DISTINCT ct.id) AS total_contratos,
    COUNT(DISTINCT o.id) AS total_ofertas,
    COUNT(DISTINCT ev.id) AS total_eventos,
    COUNT(DISTINCT p.id) AS total_pagos,
    COUNT(DISTINCT i.id) AS total_invitados,
    COUNT(DISTINCT m.id) AS total_mesas
FROM clientes c
LEFT JOIN contratos ct ON ct.cliente_id = c.id
LEFT JOIN ofertas o ON o.cliente_id = c.id
LEFT JOIN eventos ev ON ev.cliente_id = c.id
LEFT JOIN pagos p ON p.contrato_id = ct.id
LEFT JOIN invitados i ON i.contrato_id = ct.id
LEFT JOIN mesas m ON m.contrato_id = ct.id
GROUP BY c.id, c.nombre_completo, c.email
ORDER BY c.id;

-- PASO 3: Si quieres eliminar un cliente específico por ID, descomenta y ajusta el ID:
-- CAMBIA EL '4' por el ID del cliente que quieres eliminar

/*
-- Obtener el ID del cliente a eliminar (ajusta el nombre o email)
DO $$
DECLARE
    cliente_id_a_eliminar INTEGER;
BEGIN
    -- Cambia 'nombre_cliente' o 'email@ejemplo.com' por el valor real
    SELECT id INTO cliente_id_a_eliminar 
    FROM clientes 
    WHERE nombre_completo = 'nombre_cliente' 
       OR email = 'email@ejemplo.com';
    
    IF cliente_id_a_eliminar IS NULL THEN
        RAISE NOTICE 'Cliente no encontrado';
    ELSE
        RAISE NOTICE 'Eliminando cliente ID: %', cliente_id_a_eliminar;
        
        -- Eliminar datos relacionados
        DELETE FROM playlist_canciones WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM mensajes WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM invitados WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM mesas WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM versiones_contratos_pdf WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM ajustes_evento WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM solicitudes_cliente WHERE cliente_id = cliente_id_a_eliminar;
        DELETE FROM pagos WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM contratos_servicios WHERE contrato_id IN (SELECT id FROM contratos WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM eventos WHERE cliente_id = cliente_id_a_eliminar;
        DELETE FROM contratos WHERE cliente_id = cliente_id_a_eliminar;
        DELETE FROM ofertas_servicios_adicionales WHERE oferta_id IN (SELECT id FROM ofertas WHERE cliente_id = cliente_id_a_eliminar);
        DELETE FROM ofertas WHERE cliente_id = cliente_id_a_eliminar;
        DELETE FROM clientes WHERE id = cliente_id_a_eliminar;
        
        RAISE NOTICE 'Cliente eliminado exitosamente';
    END IF;
END $$;
*/

