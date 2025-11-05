-- ============================================
-- Script para verificar y crear Manager Carolina
-- ============================================

-- Verificar si el manager ya existe
SELECT 
    id,
    nombre_completo,
    codigo_manager,
    email,
    telefono,
    activo,
    fecha_registro
FROM managers
WHERE codigo_manager = 'MGR001' OR email = 'carolina@diamondsistem.com';

-- Si no existe, crear el manager (descomentar para ejecutar)
-- Nota: Necesitarás el hash de la contraseña 'Carolina2025!'
-- Puedes generarlo usando bcrypt o desde el backend

-- Para crear el manager, primero necesitas el hash de la contraseña
-- Puedes usar el siguiente comando en Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('Carolina2025!', 10);
-- console.log(hash);

-- INSERT INTO managers (
--     nombre_completo,
--     codigo_manager,
--     email,
--     telefono,
--     password_hash,
--     activo,
--     fecha_registro,
--     fecha_actualizacion
-- ) VALUES (
--     'Carolina',
--     'MGR001',
--     'carolina@diamondsistem.com',
--     '+1-305-555-0101',
--     'AQUI_VA_EL_HASH_DE_LA_CONTRASEÑA', -- Reemplazar con el hash real
--     true,
--     NOW(),
--     NOW()
-- );

-- Si el manager ya existe pero quieres actualizar la contraseña:
-- UPDATE managers
-- SET password_hash = 'AQUI_VA_EL_HASH_DE_LA_CONTRASEÑA', -- Reemplazar con el hash real
--     fecha_actualizacion = NOW()
-- WHERE codigo_manager = 'MGR001';

-- Verificar todos los managers después de la operación
SELECT 
    id,
    nombre_completo,
    codigo_manager,
    email,
    telefono,
    activo,
    fecha_registro
FROM managers
ORDER BY fecha_registro DESC;

