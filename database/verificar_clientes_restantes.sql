-- Verificar qué clientes quedaron y por qué
SELECT 
    id,
    nombre_completo,
    email,
    telefono,
    fecha_registro,
    vendedor_id
FROM clientes
ORDER BY id;

-- Ver contratos de cada cliente
SELECT 
    c.id AS cliente_id,
    c.nombre_completo,
    c.email,
    COUNT(ct.id) AS cantidad_contratos,
    STRING_AGG(ct.codigo_contrato, ', ') AS codigos_contratos
FROM clientes c
LEFT JOIN contratos ct ON ct.cliente_id = c.id
GROUP BY c.id, c.nombre_completo, c.email
ORDER BY c.id;

-- Ver ofertas de cada cliente
SELECT 
    c.id AS cliente_id,
    c.nombre_completo,
    COUNT(o.id) AS cantidad_ofertas,
    STRING_AGG(o.codigo_oferta, ', ') AS codigos_ofertas
FROM clientes c
LEFT JOIN ofertas o ON o.cliente_id = c.id
GROUP BY c.id, c.nombre_completo
ORDER BY c.id;

