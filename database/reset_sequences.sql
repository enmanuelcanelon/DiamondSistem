-- Script para resetear las secuencias de IDs después de limpiar datos
-- Ejecutar este script si necesitas que los IDs empiecen desde 1 nuevamente

-- Resetear secuencia de clientes
ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1;

-- Resetear secuencia de contratos
ALTER SEQUENCE IF EXISTS contratos_id_seq RESTART WITH 1;

-- Resetear secuencia de ofertas
ALTER SEQUENCE IF EXISTS ofertas_id_seq RESTART WITH 1;

-- Resetear secuencia de eventos
ALTER SEQUENCE IF EXISTS eventos_id_seq RESTART WITH 1;

-- Resetear secuencia de leaks (opcional, solo si quieres que los IDs empiecen desde 1)
-- ALTER SEQUENCE IF EXISTS leaks_id_seq RESTART WITH 1;

-- Verificar los valores actuales de las secuencias
SELECT 
    'clientes_id_seq' as secuencia, 
    last_value as ultimo_valor 
FROM clientes_id_seq
UNION ALL
SELECT 
    'contratos_id_seq' as secuencia, 
    last_value as ultimo_valor 
FROM contratos_id_seq
UNION ALL
SELECT 
    'ofertas_id_seq' as secuencia, 
    last_value as ultimo_valor 
FROM ofertas_id_seq
UNION ALL
SELECT 
    'eventos_id_seq' as secuencia, 
    last_value as ultimo_valor 
FROM eventos_id_seq;

