-- ============================================
-- DIAMONDSISTEM - ESQUEMA DE BASE DE DATOS
-- Sistema de Gestión de Eventos y Contratos
-- ============================================

-- Tabla: Vendedores
-- Gestiona los vendedores con sus datos de acceso y comisiones
CREATE TABLE vendedores (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    codigo_vendedor VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    comision_porcentaje DECIMAL(5,2) DEFAULT 10.00,
    total_ventas DECIMAL(10,2) DEFAULT 0.00,
    total_comisiones DECIMAL(10,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Clientes
-- Información de los clientes potenciales y actuales
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    como_nos_conocio VARCHAR(255),
    tipo_evento VARCHAR(100),
    vendedor_id INTEGER REFERENCES vendedores(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Temporadas
-- Define las temporadas y su impacto en precios
CREATE TABLE temporadas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    meses VARCHAR(255) NOT NULL,
    ajuste_precio DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla: Paquetes
-- Los 5 paquetes disponibles con sus características
CREATE TABLE paquetes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    duracion_horas INTEGER NOT NULL,
    invitados_minimo INTEGER,
    dias_disponibles VARCHAR(100),
    horario_inicio TIME DEFAULT '10:00:00',
    horario_fin_base TIME DEFAULT '01:00:00',
    horario_fin_maximo TIME DEFAULT '02:00:00',
    descripcion TEXT,
    es_personalizable BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Servicios
-- Todos los servicios disponibles con precios
CREATE TABLE servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    tipo_cobro VARCHAR(50) DEFAULT 'fijo',
    categoria VARCHAR(100),
    requiere_seleccion BOOLEAN DEFAULT FALSE,
    opciones_disponibles TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Paquetes_Servicios (Relación muchos a muchos)
-- Define qué servicios están incluidos en cada paquete
CREATE TABLE paquetes_servicios (
    id SERIAL PRIMARY KEY,
    paquete_id INTEGER REFERENCES paquetes(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    incluido_gratis BOOLEAN DEFAULT TRUE,
    notas TEXT,
    UNIQUE(paquete_id, servicio_id)
);

-- Tabla: Ofertas
-- Ofertas/Propuestas creadas por vendedores para clientes
CREATE TABLE ofertas (
    id SERIAL PRIMARY KEY,
    codigo_oferta VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    vendedor_id INTEGER REFERENCES vendedores(id),
    paquete_id INTEGER REFERENCES paquetes(id),
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cantidad_invitados INTEGER NOT NULL,
    temporada_id INTEGER REFERENCES temporadas(id),
    precio_paquete_base DECIMAL(10,2) NOT NULL,
    ajuste_temporada DECIMAL(10,2) DEFAULT 0.00,
    subtotal_servicios DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    impuesto_porcentaje DECIMAL(5,2) DEFAULT 7.00,
    impuesto_monto DECIMAL(10,2) NOT NULL,
    tarifa_servicio_porcentaje DECIMAL(5,2) DEFAULT 18.00,
    tarifa_servicio_monto DECIMAL(10,2) NOT NULL,
    total_final DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    notas_vendedor TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP
);

-- Tabla: Ofertas_Servicios_Adicionales
-- Servicios adicionales agregados a una oferta específica
CREATE TABLE ofertas_servicios_adicionales (
    id SERIAL PRIMARY KEY,
    oferta_id INTEGER REFERENCES ofertas(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id),
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    precio_original DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas TEXT,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Contratos
-- Contratos firmados que generan eventos
CREATE TABLE contratos (
    id SERIAL PRIMARY KEY,
    codigo_contrato VARCHAR(50) UNIQUE NOT NULL,
    oferta_id INTEGER REFERENCES ofertas(id),
    cliente_id INTEGER REFERENCES clientes(id),
    vendedor_id INTEGER REFERENCES vendedores(id),
    paquete_id INTEGER REFERENCES paquetes(id),
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cantidad_invitados INTEGER NOT NULL,
    total_contrato DECIMAL(10,2) NOT NULL,
    tipo_pago VARCHAR(50) NOT NULL,
    meses_financiamiento INTEGER DEFAULT 1,
    pago_mensual DECIMAL(10,2),
    total_pagado DECIMAL(10,2) DEFAULT 0.00,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    estado_pago VARCHAR(50) DEFAULT 'pendiente',
    codigo_acceso_cliente VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_firma TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminos_aceptados BOOLEAN DEFAULT TRUE,
    comision_calculada DECIMAL(10,2),
    comision_pagada BOOLEAN DEFAULT FALSE
);

-- Tabla: Contratos_Servicios
-- Servicios incluidos en el contrato (copia de oferta + posibles adiciones)
CREATE TABLE contratos_servicios (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id),
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    incluido_en_paquete BOOLEAN DEFAULT FALSE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pagos
-- Registro de todos los pagos realizados
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos(id),
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    tipo_tarjeta VARCHAR(50),
    recargo_tarjeta DECIMAL(10,2) DEFAULT 0.00,
    monto_total DECIMAL(10,2) NOT NULL,
    numero_referencia VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'completado',
    notas TEXT,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER REFERENCES vendedores(id)
);

-- Tabla: Eventos
-- Eventos asociados a contratos firmados
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos(id) UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id),
    nombre_evento VARCHAR(255) NOT NULL,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cantidad_invitados_confirmados INTEGER,
    estado VARCHAR(50) DEFAULT 'en_proceso',
    detalles_comida TEXT,
    detalles_bebidas TEXT,
    detalles_decoracion TEXT,
    detalles_musica TEXT,
    seating_chart TEXT,
    instrucciones_especiales TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion TIMESTAMP
);

-- Tabla: Solicitudes_Cliente
-- Solicitudes de clientes para añadir servicios o invitados
CREATE TABLE solicitudes_cliente (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos(id),
    cliente_id INTEGER REFERENCES clientes(id),
    tipo_solicitud VARCHAR(50) NOT NULL,
    invitados_adicionales INTEGER,
    servicio_id INTEGER REFERENCES servicios(id),
    cantidad_servicio INTEGER,
    detalles_solicitud TEXT,
    costo_adicional DECIMAL(10,2),
    estado VARCHAR(50) DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    respondido_por INTEGER REFERENCES vendedores(id)
);

-- Tabla: Mensajes
-- Sistema de mensajería entre clientes y vendedores
CREATE TABLE mensajes (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos(id),
    remitente_tipo VARCHAR(50) NOT NULL,
    remitente_id INTEGER NOT NULL,
    destinatario_tipo VARCHAR(50) NOT NULL,
    destinatario_id INTEGER NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP
);

-- Tabla: Configuracion_Sistema
-- Configuración global del sistema (taxes, comisiones, etc.)
CREATE TABLE configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(50),
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Historial_Cambios_Precios
-- Registro de cambios de precios durante negociaciones
CREATE TABLE historial_cambios_precios (
    id SERIAL PRIMARY KEY,
    oferta_id INTEGER REFERENCES ofertas(id),
    contrato_id INTEGER REFERENCES contratos(id),
    tipo_entidad VARCHAR(50),
    entidad_id INTEGER,
    precio_original DECIMAL(10,2) NOT NULL,
    precio_nuevo DECIMAL(10,2) NOT NULL,
    motivo TEXT,
    modificado_por INTEGER REFERENCES vendedores(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_ofertas_cliente ON ofertas(cliente_id);
CREATE INDEX idx_ofertas_vendedor ON ofertas(vendedor_id);
CREATE INDEX idx_ofertas_estado ON ofertas(estado);
CREATE INDEX idx_ofertas_fecha_evento ON ofertas(fecha_evento);
CREATE INDEX idx_contratos_cliente ON contratos(cliente_id);
CREATE INDEX idx_contratos_vendedor ON contratos(vendedor_id);
CREATE INDEX idx_contratos_codigo_acceso ON contratos(codigo_acceso_cliente);
CREATE INDEX idx_contratos_estado ON contratos(estado);
CREATE INDEX idx_eventos_fecha ON eventos(fecha_evento);
CREATE INDEX idx_eventos_estado ON eventos(estado);
CREATE INDEX idx_pagos_contrato ON pagos(contrato_id);
CREATE INDEX idx_solicitudes_contrato ON solicitudes_cliente(contrato_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_cliente(estado);
CREATE INDEX idx_mensajes_contrato ON mensajes(contrato_id);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de contratos con información completa
CREATE VIEW vista_contratos_completos AS
SELECT 
    c.id,
    c.codigo_contrato,
    cl.nombre_completo as cliente_nombre,
    cl.email as cliente_email,
    cl.telefono as cliente_telefono,
    v.nombre_completo as vendedor_nombre,
    v.codigo_vendedor,
    p.nombre as paquete_nombre,
    c.fecha_evento,
    c.total_contrato,
    c.total_pagado,
    c.saldo_pendiente,
    c.estado_pago,
    c.estado as estado_contrato,
    e.estado as estado_evento,
    c.fecha_firma
FROM contratos c
JOIN clientes cl ON c.cliente_id = cl.id
JOIN vendedores v ON c.vendedor_id = v.id
JOIN paquetes p ON c.paquete_id = p.id
LEFT JOIN eventos e ON c.id = e.contrato_id;

-- Vista: Solicitudes pendientes
CREATE VIEW vista_solicitudes_pendientes AS
SELECT 
    s.id,
    s.tipo_solicitud,
    c.codigo_contrato,
    cl.nombre_completo as cliente_nombre,
    v.nombre_completo as vendedor_nombre,
    s.costo_adicional,
    s.fecha_solicitud,
    ser.nombre as servicio_nombre,
    s.invitados_adicionales
FROM solicitudes_cliente s
JOIN contratos c ON s.contrato_id = c.id
JOIN clientes cl ON s.cliente_id = cl.id
JOIN vendedores v ON c.vendedor_id = v.id
LEFT JOIN servicios ser ON s.servicio_id = ser.id
WHERE s.estado = 'pendiente';

-- ============================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- ============================================

-- Trigger: Actualizar fecha_actualizacion en clientes
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_actualizacion
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_contratos_actualizacion
    BEFORE UPDATE ON contratos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_eventos_actualizacion
    BEFORE UPDATE ON eventos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger: Actualizar saldo pendiente en contratos al registrar pagos
CREATE OR REPLACE FUNCTION actualizar_saldo_contrato()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_saldo_pendiente DECIMAL(10, 2);
BEGIN
    -- Calcular el nuevo saldo pendiente
    SELECT total_contrato - (total_pagado + NEW.monto_total)
    INTO nuevo_saldo_pendiente
    FROM contratos
    WHERE id = NEW.contrato_id;
    
    UPDATE contratos
    SET 
        total_pagado = total_pagado + NEW.monto_total,
        saldo_pendiente = nuevo_saldo_pendiente,
        estado_pago = CASE 
            -- Si saldo pendiente es 0 o negativo, está completado
            WHEN nuevo_saldo_pendiente <= 0 THEN 'completado'
            -- Si ha pagado algo pero aún debe, está parcial
            WHEN (total_pagado + NEW.monto_total) > 0 THEN 'parcial'
            -- Si no ha pagado nada y el saldo es mayor a 0, está pendiente
            ELSE 'pendiente'
        END
    WHERE id = NEW.contrato_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pago_actualizar_contrato
    AFTER INSERT ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_saldo_contrato();

-- Trigger: Marcar comisión como pagada cuando contrato esté completado
CREATE OR REPLACE FUNCTION calcular_comision_vendedor()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_pago = 'completado' AND OLD.estado_pago != 'completado' THEN
        UPDATE contratos
        SET comision_pagada = TRUE
        WHERE id = NEW.id;
        
        UPDATE vendedores
        SET 
            total_ventas = total_ventas + NEW.total_contrato,
            total_comisiones = total_comisiones + NEW.comision_calculada
        WHERE id = NEW.vendedor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comision_vendedor
    AFTER UPDATE ON contratos
    FOR EACH ROW
    WHEN (NEW.estado_pago = 'completado')
    EXECUTE FUNCTION calcular_comision_vendedor();

