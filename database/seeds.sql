-- ============================================
-- DIAMONDSISTEM - DATOS INICIALES (SEEDS)
-- Población inicial de la base de datos
-- ============================================

-- ============================================
-- 1. CONFIGURACIÓN DEL SISTEMA
-- ============================================

INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion) VALUES
('impuesto_iva', '7.00', 'porcentaje', 'Impuesto IVA aplicable a contratos'),
('tarifa_servicio', '18.00', 'porcentaje', 'Tarifa de servicio aplicable a contratos'),
('deposito_inicial', '500.00', 'monto', 'Depósito no reembolsable para reservar'),
('pago_segundo', '1000.00', 'monto', 'Segundo pago requerido en 10 días'),
('pago_mensual_minimo', '500.00', 'monto', 'Pago mensual mínimo para financiamiento'),
('dias_pago_completo', '15', 'texto', 'Días antes del evento para pago completo'),
('recargo_tarjeta', '3.8', 'porcentaje', 'Recargo por pago con tarjeta'),
('comision_vendedor_default', '10.00', 'porcentaje', 'Comisión por defecto para vendedores');

-- ============================================
-- 2. TEMPORADAS
-- ============================================

INSERT INTO temporadas (nombre, meses, ajuste_precio, descripcion, activo) VALUES
('Baja', 'enero,febrero,agosto,septiembre', 0.00, 'Temporada Baja - Sin ajuste de precio', TRUE),
('Media', 'marzo,abril,julio,octubre', 2000.00, 'Temporada Media - Ajuste de +$2,000', TRUE),
('Alta', 'noviembre,diciembre,mayo,junio', 4000.00, 'Temporada Alta - Ajuste de +$4,000', TRUE);

-- ============================================
-- 3. PAQUETES
-- ============================================

-- Paquete 1: Especial
INSERT INTO paquetes (nombre, precio_base, duracion_horas, invitados_minimo, dias_disponibles, horario_inicio, horario_fin_base, horario_fin_maximo, descripcion, es_personalizable, activo) VALUES
('Especial', 3500.00, 4, 80, 'Lunes a Viernes', '10:00:00', '01:00:00', '02:00:00', 'Paquete ideal para eventos entre semana con todos los servicios básicos incluidos.', FALSE, TRUE);

-- Paquete 2: Platinum
INSERT INTO paquetes (nombre, precio_base, duracion_horas, invitados_minimo, dias_disponibles, horario_inicio, horario_fin_base, horario_fin_maximo, descripcion, es_personalizable, activo) VALUES
('Platinum', 7500.00, 4, 80, 'Lunes a Lunes', '10:00:00', '01:00:00', '02:00:00', 'Paquete premium con servicios adicionales como mapping, coordinador y mesa de quesos.', FALSE, TRUE);

-- Paquete 3: Diamond
INSERT INTO paquetes (nombre, precio_base, duracion_horas, invitados_minimo, dias_disponibles, horario_inicio, horario_fin_base, horario_fin_maximo, descripcion, es_personalizable, activo) VALUES
('Diamond', 10500.00, 5, 80, 'Lunes a Lunes', '10:00:00', '01:00:00', '02:00:00', 'Paquete exclusivo con hora loca, foto/video, photobooth y limosina incluidos.', FALSE, TRUE);

-- Paquete 4: Deluxe
INSERT INTO paquetes (nombre, precio_base, duracion_horas, invitados_minimo, dias_disponibles, horario_inicio, horario_fin_base, horario_fin_maximo, descripcion, es_personalizable, activo) VALUES
('Deluxe', 12500.00, 5, 80, 'Lunes a Lunes', '10:00:00', '01:00:00', '02:00:00', 'Paquete todo incluido con licor premium, maestro de ceremonia y servicios VIP.', FALSE, TRUE);

-- Paquete 5: Personalizado
INSERT INTO paquetes (nombre, precio_base, duracion_horas, invitados_minimo, dias_disponibles, horario_inicio, horario_fin_base, horario_fin_maximo, descripcion, es_personalizable, activo) VALUES
('Personalizado', 6000.00, 4, 50, 'Lunes a Lunes', '10:00:00', '01:00:00', '02:00:00', 'Crea tu evento a medida. Personaliza cada detalle según tus necesidades.', TRUE, TRUE);

-- ============================================
-- 4. SERVICIOS
-- ============================================

-- ENTRETENIMIENTO Y ANIMACIÓN
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Hora Loca', 'Animación con hora loca incluye accesorios y animador', 450.00, 'fijo', 'Entretenimiento', FALSE, TRUE),
('Maestro de Ceremonia', 'Profesional para dirigir el evento', 350.00, 'fijo', 'Entretenimiento', FALSE, TRUE),
('Animador', 'Animador adicional para el evento', 350.00, 'fijo', 'Entretenimiento', FALSE, TRUE),
('DJ Profesional', 'DJ con equipo profesional de sonido', 300.00, 'fijo', 'Entretenimiento', FALSE, TRUE);

-- LICORES Y BEBIDAS
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, opciones_disponibles, activo) VALUES
('Licor Básico', 'Ron, whisky, vodka y vino de la casa', 6.00, 'por_persona', 'Bebidas', TRUE, '["Ron", "Whisky", "Vodka", "Vino de la casa"]', TRUE),
('Licor Premium', 'Selección premium de licores importados', 18.00, 'por_persona', 'Bebidas', TRUE, '["Ron Premium", "Whisky Premium", "Vodka Premium", "Gin", "Tequila"]', TRUE),
('Champaña', 'Botellas de champaña', 8.00, 'por_unidad', 'Bebidas', FALSE, NULL, TRUE),
('Sidra', 'Botellas de sidra', 6.00, 'por_unidad', 'Bebidas', FALSE, NULL, TRUE),
('Refrescos/Jugo/Agua', 'Bebidas no alcohólicas ilimitadas', 0.00, 'fijo', 'Bebidas', TRUE, '["Coca Cola", "Pepsi", "Sprite", "Fanta", "Coca Cola Zero", "Jugos naturales", "Agua mineral"]', TRUE);

-- DECORACIÓN
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Decoración Básica', 'Decoración estándar del salón', 380.00, 'fijo', 'Decoración', TRUE, TRUE),
('Decoración Plus', 'Decoración premium personalizada', 380.00, 'fijo', 'Decoración', TRUE, TRUE),
('Lounge Set + Coctel Dream', 'Terraza decorada con cajas con letra baby', 100.00, 'fijo', 'Decoración', FALSE, TRUE),
('Número Lumínico', 'Número iluminado personalizado', 150.00, 'fijo', 'Decoración', TRUE, TRUE);

-- EQUIPOS Y EFECTOS
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Mapping', 'Proyección mapping en las paredes', 100.00, 'fijo', 'Equipos', FALSE, TRUE),
('Pantalla LED', 'Pantalla LED para presentaciones', 0.00, 'fijo', 'Equipos', FALSE, TRUE),
('Luces Stage', 'Iluminación profesional del escenario', 0.00, 'fijo', 'Equipos', FALSE, TRUE),
('Máquina de Humo', 'Máquina de humo para ambiente', 250.00, 'fijo', 'Equipos', FALSE, TRUE),
('Máquina de Chispas', 'Máquina de chispas frías', 250.00, 'fijo', 'Equipos', FALSE, TRUE);

-- FOTOGRAFÍA Y VIDEO
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Foto y Video 3 Horas', 'Cobertura fotográfica y video por 3 horas', 800.00, 'fijo', 'Fotografía', FALSE, TRUE),
('Foto y Video 5 Horas', 'Cobertura completa con álbum incluido', 1000.00, 'fijo', 'Fotografía', FALSE, TRUE),
('Photobooth 360', 'Cabina fotográfica 360 grados', 450.00, 'fijo', 'Fotografía', FALSE, TRUE),
('Photobooth Print', 'Cabina fotográfica con impresión instantánea', 450.00, 'fijo', 'Fotografía', FALSE, TRUE);

-- COMIDA Y CATERING
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, opciones_disponibles, activo) VALUES
('Comida', 'Primer y segundo plato a escoger', 0.00, 'fijo', 'Comida', TRUE, '["Primer plato: Ensalada César", "Primer plato: Crema de vegetales", "Segundo plato: Pollo al horno", "Segundo plato: Carne asada", "Segundo plato: Pescado a la plancha", "Segundo plato: Pasta"]', TRUE),
('Mesa de Quesos', 'Mesa de quesos variados', 4.20, 'por_persona', 'Comida', FALSE, NULL, TRUE),
('Pasapalos', 'Variedad de pasapalos fríos y calientes', 3.00, 'por_persona', 'Comida', TRUE, '["Tequeños", "Mini empanadas", "Brochetas", "Canapés", "Mini hamburguesas"]', TRUE),
('Mini Dulces', 'Paquete de 12 mini dulces', 3.00, 'por_unidad', 'Comida', FALSE, NULL, TRUE),
('Cake', 'Torta de 2 sabores', 0.00, 'fijo', 'Comida', TRUE, '["Marmoleado", "Vainilla"]', TRUE),
('Utensilios', 'Platos, cubiertos, vasos y servilletas', 0.00, 'fijo', 'Comida', FALSE, NULL, TRUE);

-- PERSONAL Y SERVICIOS
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Coordinador de Eventos', 'Coordinador profesional del evento', 150.00, 'fijo', 'Personal', FALSE, TRUE),
('Personal de Servicio', 'Meseros y personal de atención', 120.00, 'por_unidad', 'Personal', FALSE, TRUE),
('Bartender', 'Bartender profesional', 150.00, 'por_unidad', 'Personal', FALSE, TRUE);

-- TRANSPORTE
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Limosina', 'Servicio de limosina para el evento', 250.00, 'fijo', 'Transporte', FALSE, TRUE);

-- EXTRAS
INSERT INTO servicios (nombre, descripcion, precio_base, tipo_cobro, categoria, requiere_seleccion, activo) VALUES
('Hora Extra', 'Hora adicional de evento (máximo hasta 2 AM)', 800.00, 'fijo', 'Extras', FALSE, TRUE),
('Persona Adicional Temporada Baja/Media', 'Invitado adicional en temporada baja o media', 52.00, 'por_persona', 'Extras', FALSE, TRUE),
('Persona Adicional Temporada Alta', 'Invitado adicional en temporada alta', 80.00, 'por_persona', 'Extras', FALSE, TRUE);

-- ============================================
-- 5. RELACIÓN PAQUETES-SERVICIOS
-- ============================================

-- PAQUETE 1: ESPECIAL
INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 1, id, 1, TRUE, 'Incluido en precio base'
FROM servicios WHERE nombre IN (
    'Licor Básico',
    'Refrescos/Jugo/Agua',
    'Decoración Básica',
    'Utensilios',
    'Cake',
    'DJ Profesional',
    'Comida',
    'Pantalla LED',
    'Luces Stage',
    'Lounge Set + Coctel Dream'
);

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 1, id, 3, TRUE, '3 personas de servicio incluidas'
FROM servicios WHERE nombre = 'Personal de Servicio';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 1, id, 1, TRUE, '1 bartender incluido'
FROM servicios WHERE nombre = 'Bartender';

-- PAQUETE 2: PLATINUM
INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 2, id, 1, TRUE, 'Incluido en precio base'
FROM servicios WHERE nombre IN (
    'Licor Básico',
    'Comida',
    'Decoración Básica',
    'Mesa de Quesos',
    'Utensilios',
    'Cake',
    'DJ Profesional',
    'Coordinador de Eventos',
    'Mapping',
    'Pantalla LED',
    'Refrescos/Jugo/Agua',
    'Luces Stage',
    'Lounge Set + Coctel Dream',
    'Máquina de Humo',
    'Máquina de Chispas'
);

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 2, id, 4, TRUE, '4 personas de servicio incluidas'
FROM servicios WHERE nombre = 'Personal de Servicio';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 2, id, 1, TRUE, '1 bartender incluido'
FROM servicios WHERE nombre = 'Bartender';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 2, id, 10, TRUE, '10 botellas de sidra incluidas'
FROM servicios WHERE nombre = 'Sidra';

-- PAQUETE 3: DIAMOND
INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 3, id, 1, TRUE, 'Incluido en precio base'
FROM servicios WHERE nombre IN (
    'Hora Loca',
    'Licor Básico',
    'Hora Extra',
    'Foto y Video 3 Horas',
    'Comida',
    'Mesa de Quesos',
    'Limosina',
    'Decoración Plus',
    'Utensilios',
    'Cake',
    'DJ Profesional',
    'Coordinador de Eventos',
    'Mapping',
    'Pantalla LED',
    'Refrescos/Jugo/Agua',
    'Luces Stage',
    'Lounge Set + Coctel Dream',
    'Máquina de Humo',
    'Máquina de Chispas',
    'Número Lumínico'
);

-- Photobooth (escoger uno)
INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 3, id, 1, TRUE, 'Escoger entre Photobooth 360 o Photobooth Print'
FROM servicios WHERE nombre IN ('Photobooth 360', 'Photobooth Print');

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 3, id, 4, TRUE, '4 personas de servicio incluidas'
FROM servicios WHERE nombre = 'Personal de Servicio';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 3, id, 1, TRUE, '1 bartender incluido'
FROM servicios WHERE nombre = 'Bartender';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 3, id, 10, TRUE, '10 botellas de sidra incluidas'
FROM servicios WHERE nombre = 'Sidra';

-- PAQUETE 4: DELUXE
INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 4, id, 1, TRUE, 'Incluido en precio base'
FROM servicios WHERE nombre IN (
    'Hora Loca',
    'Licor Premium',
    'Hora Extra',
    'Foto y Video 5 Horas',
    'Comida',
    'Limosina',
    'Pasapalos',
    'Decoración Plus',
    'Mesa de Quesos',
    'Utensilios',
    'Cake',
    'DJ Profesional',
    'Coordinador de Eventos',
    'Maestro de Ceremonia',
    'Mapping',
    'Pantalla LED',
    'Refrescos/Jugo/Agua',
    'Luces Stage',
    'Lounge Set + Coctel Dream',
    'Máquina de Humo',
    'Máquina de Chispas',
    'Número Lumínico'
);

-- Photobooth (escoger uno)
INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 4, id, 1, TRUE, 'Escoger entre Photobooth 360 o Photobooth Print'
FROM servicios WHERE nombre IN ('Photobooth 360', 'Photobooth Print');

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 4, id, 4, TRUE, '4 personas de servicio incluidas'
FROM servicios WHERE nombre = 'Personal de Servicio';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 4, id, 1, TRUE, '1 bartender incluido'
FROM servicios WHERE nombre = 'Bartender';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 4, id, 10, TRUE, '10 botellas de champaña incluidas'
FROM servicios WHERE nombre = 'Champaña';

INSERT INTO paquetes_servicios (paquete_id, servicio_id, cantidad, incluido_gratis, notas)
SELECT 4, id, 6, TRUE, '6 paquetes de mini dulces (12 unidades cada uno)'
FROM servicios WHERE nombre = 'Mini Dulces';

-- PAQUETE 5: PERSONALIZADO
-- Este paquete no tiene servicios incluidos por defecto

-- ============================================
-- 6. VENDEDOR DE PRUEBA (PARA DESARROLLO)
-- Password para todos: Admin123! (hash bcrypt)
-- ============================================

INSERT INTO vendedores (nombre_completo, codigo_vendedor, email, telefono, password_hash, comision_porcentaje, activo) VALUES
('Administrador Sistema', 'ADMIN001', 'admin@diamondsistem.com', '+1-305-555-0100', '$2b$10$z7tX1nVdjEZiSQRUPDVHDOA.gxorHrRZTXB2ZyGB79QA1PvjbdC/W', 10.00, TRUE),
('Carlos Rodríguez', 'VEND001', 'carlos@diamondsistem.com', '+1-305-555-0101', '$2b$10$z7tX1nVdjEZiSQRUPDVHDOA.gxorHrRZTXB2ZyGB79QA1PvjbdC/W', 10.00, TRUE),
('María González', 'VEND002', 'maria@diamondsistem.com', '+1-305-555-0102', '$2b$10$z7tX1nVdjEZiSQRUPDVHDOA.gxorHrRZTXB2ZyGB79QA1PvjbdC/W', 12.00, TRUE);

-- ============================================
-- Fin de Seeds
-- ============================================

