-- Verificar todos los vendedores en el sistema
SELECT id, nombre_completo, email, codigo_vendedor 
FROM vendedores 
ORDER BY id;

-- Verificar los contratos y sus vendedores asignados
SELECT 
    c.id AS contrato_id,
    c.codigo_contrato,
    c.vendedor_id,
    v.nombre_completo AS vendedor_nombre,
    v.email AS vendedor_email,
    cl.nombre_completo AS cliente_nombre
FROM contratos c
LEFT JOIN vendedores v ON c.vendedor_id = v.id
LEFT JOIN clientes cl ON c.cliente_id = cl.id
ORDER BY c.id;

-- Si necesitas actualizar un contrato específico, usa este comando:
-- (Reemplaza CONTRATO_ID y VENDEDOR_ID_CORRECTO con los valores reales)
-- UPDATE contratos SET vendedor_id = VENDEDOR_ID_CORRECTO WHERE id = CONTRATO_ID;


