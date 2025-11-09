-- Verificar que se eliminaron todos los datos
SELECT 
    'Clientes' as tabla,
    COUNT(*) as total
FROM clientes
UNION ALL
SELECT 
    'Ofertas' as tabla,
    COUNT(*) as total
FROM ofertas
UNION ALL
SELECT 
    'Contratos' as tabla,
    COUNT(*) as total
FROM contratos
UNION ALL
SELECT 
    'Pagos' as tabla,
    COUNT(*) as total
FROM pagos
UNION ALL
SELECT 
    'Mensajes' as tabla,
    COUNT(*) as total
FROM mensajes
UNION ALL
SELECT 
    'Ofertas Servicios Adicionales' as tabla,
    COUNT(*) as total
FROM ofertas_servicios_adicionales
UNION ALL
SELECT 
    'Contratos Servicios' as tabla,
    COUNT(*) as total
FROM contratos_servicios;

