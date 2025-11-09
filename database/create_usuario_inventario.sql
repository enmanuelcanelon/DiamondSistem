-- ============================================
-- Script para crear usuario de inventario de prueba
-- ============================================
-- IMPORTANTE: Este script crea un usuario de prueba
-- Código: INV001
-- Password: Inventario123!
-- ============================================

BEGIN;

-- Insertar usuario de inventario de prueba
-- Password hash para "Inventario123!" generado con bcrypt
INSERT INTO usuarios_inventario (
  nombre_completo,
  codigo_usuario,
  email,
  telefono,
  password_hash,
  activo,
  fecha_registro,
  fecha_actualizacion
) VALUES (
  'Usuario Inventario Prueba',
  'INV001',
  'inventario@diamondsistem.com',
  '555-0001',
  '$2b$10$Rc2CTf56v4q/P2zMcZG2D.Adu/STVeXTeN0ZpbYXkEpdh8tDXsZrq', -- Hash para "Inventario123!"
  true,
  NOW(),
  NOW()
)
ON CONFLICT (codigo_usuario) DO NOTHING;

COMMIT;

-- NOTA: El password_hash debe generarse correctamente con bcrypt
-- Para generar un hash correcto, ejecuta en Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('Inventario123!', 10);
-- console.log(hash);

