-- Verificar las descripciones corregidas
SELECT 
    id, 
    nombre, 
    descripcion 
FROM paquetes 
WHERE nombre IN ('Paquete Personalizado', 'Servicio Especial')
ORDER BY nombre;




