-- ============================================
-- Script para poblar inventario_items
-- ============================================
-- Este script crea todos los items del catálogo de inventario
-- con sus unidades de medida y categorías

BEGIN;

-- BEBIDAS ALCOHÓLICAS
INSERT INTO inventario_items (nombre, unidad_medida, categoria, descripcion, activo, fecha_creacion) VALUES
('Champaña', 'botella', 'bebidas_alcoholicas', 'Champaña para brindis', true, NOW()),
('Sidra', 'botella', 'bebidas_alcoholicas', 'Sidra para brindis', true, NOW()),
('Whisky Premium', 'botella', 'bebidas_alcoholicas', 'Whisky premium importado', true, NOW()),
('Whisky House', 'botella', 'bebidas_alcoholicas', 'Whisky de la casa', true, NOW()),
('Vodka', 'botella', 'bebidas_alcoholicas', 'Vodka', true, NOW()),
('Tequila', 'botella', 'bebidas_alcoholicas', 'Tequila', true, NOW()),
('Ron Spice', 'botella', 'bebidas_alcoholicas', 'Ron con especias', true, NOW()),
('Ron Blanco', 'botella', 'bebidas_alcoholicas', 'Ron blanco', true, NOW()),
('Vino Blanco', 'botella', 'bebidas_alcoholicas', 'Vino blanco', true, NOW()),
('Vino Tinto', 'botella', 'bebidas_alcoholicas', 'Vino tinto', true, NOW()),
('Vino Chardonnay', 'botella', 'bebidas_alcoholicas', 'Vino chardonnay', true, NOW()),
('Chamberry', 'botella', 'bebidas_alcoholicas', 'Chamberry', true, NOW()),
('Blue Curacao', 'botella', 'bebidas_alcoholicas', 'Blue Curacao', true, NOW()),
('Piña Colada', 'botella', 'bebidas_alcoholicas', 'Piña colada', true, NOW());

-- BEBIDAS NO ALCOHÓLICAS
INSERT INTO inventario_items (nombre, unidad_medida, categoria, descripcion, activo, fecha_creacion) VALUES
('Jugo de Naranja', 'botella', 'bebidas_no_alcoholicas', 'Jugo de naranja', true, NOW()),
('Agua Tónica', 'botella', 'bebidas_no_alcoholicas', 'Agua tónica', true, NOW()),
('Club Soda', 'botella', 'bebidas_no_alcoholicas', 'Club soda', true, NOW()),
('Coca Cola', 'botella', 'bebidas_no_alcoholicas', 'Coca Cola regular', true, NOW()),
('Coca Cola Zero', 'botella', 'bebidas_no_alcoholicas', 'Coca Cola Zero', true, NOW()),
('Coca Cola Light', 'botella', 'bebidas_no_alcoholicas', 'Coca Cola Light', true, NOW()),
('Sprite', 'botella', 'bebidas_no_alcoholicas', 'Sprite regular', true, NOW()),
('Sprite Zero', 'botella', 'bebidas_no_alcoholicas', 'Sprite Zero', true, NOW()),
('Fanta Naranja', 'botella', 'bebidas_no_alcoholicas', 'Fanta sabor naranja', true, NOW()),
('Granadina', 'botella', 'bebidas_no_alcoholicas', 'Granadina (1/4 botella)', true, NOW());

-- VAJILLA Y UTENSILIOS
INSERT INTO inventario_items (nombre, unidad_medida, categoria, descripcion, activo, fecha_creacion) VALUES
('Vasos de Vidrio', 'unidad', 'vajilla', 'Vasos de vidrio para bebidas', true, NOW()),
('Vasos de Plástico', 'unidad', 'vajilla', 'Vasos de plástico desechables grandes', true, NOW()),
('Vasos de Plástico Pequeños', 'unidad', 'vajilla', 'Vasos de plástico desechables pequeños', true, NOW()),
('Platos para Cake', 'unidad', 'vajilla', 'Platos individuales para pastel', true, NOW()),
('Platos de Vidrio Pequeños', 'unidad', 'vajilla', 'Platos pequeños de vidrio', true, NOW()),
('Servilletas Blancas', 'paquete', 'vajilla', 'Paquete de servilletas blancas', true, NOW()),
('Servilletas Negras', 'paquete', 'vajilla', 'Paquete de servilletas negras', true, NOW()),
('Pinchos para Dientes', 'unidad', 'vajilla', 'Pinchos para dientes (montoncito)', true, NOW());

-- DECORACIÓN Y ACCESORIOS
INSERT INTO inventario_items (nombre, unidad_medida, categoria, descripcion, activo, fecha_creacion) VALUES
('Velas para Cake', 'unidad', 'decoracion', 'Velas para pastel de cumpleaños', true, NOW());

-- COMIDA - MESA DE QUESO
INSERT INTO inventario_items (nombre, unidad_medida, categoria, descripcion, activo, fecha_creacion) VALUES
('Queso Brie', 'bola', 'comida', 'Queso Brie (1 bola)', true, NOW()),
('Queso Amarillo', 'bolsa', 'comida', 'Queso amarillo (bolsas)', true, NOW()),
('Queso Blanco', 'bolsa', 'comida', 'Queso blanco (bolsas)', true, NOW()),
('Queso Azul', 'bolsa', 'comida', 'Queso azul (bolsas)', true, NOW()),
('Queso Parmesano', 'bolsa', 'comida', 'Queso parmesano (bolsas)', true, NOW()),
('Queso Cuadrado Amarillo', 'bolsa', 'comida', 'Queso cuadrado amarillo (bolsas)', true, NOW()),
('Queso Cuadrado Blanco', 'bolsa', 'comida', 'Queso cuadrado blanco (bolsas)', true, NOW()),
('Queso Cuadrado Azul', 'bolsa', 'comida', 'Queso cuadrado azul (bolsas)', true, NOW()),
('Prochuto', 'libra', 'comida', 'Prochuto (1/4 libra)', true, NOW()),
('Salami', 'libra', 'comida', 'Salami (1/4 libra)', true, NOW()),
('Salchichón', 'libra', 'comida', 'Salchichón (1/4 libra)', true, NOW()),
('Galletas Mixtas', 'paquete', 'comida', 'Caja de galletas mixtas (1 paquete)', true, NOW()),
('Humos', 'unidad', 'comida', 'Humos (1 unidad)', true, NOW()),
('Cherry', 'libra', 'comida', 'Cherry (1/4 libra)', true, NOW()),
('Aceituna Negra', 'paquete', 'comida', 'Aceituna negra (1 paquete)', true, NOW()),
('Aceituna Verde', 'paquete', 'comida', 'Aceituna verde (1 paquete)', true, NOW()),
('Piña', 'unidad', 'comida', 'Media piña', true, NOW()),
('Ensalada de Pollo', 'paquete', 'comida', 'Ensalada de pollo (1 paquete)', true, NOW()),
('Fresa', 'paquete', 'comida', 'Fresas (1 paquete)', true, NOW()),
('Uva', 'paquete', 'comida', 'Uvas (1 paquete)', true, NOW()),
('Maní', 'libra', 'comida', 'Maní (1/4 libra)', true, NOW()),
('Limón', 'paquete', 'comida', 'Limones (2 paquetes)', true, NOW());

COMMIT;

