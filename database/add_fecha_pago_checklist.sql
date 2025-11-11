-- Agregar columna fecha_pago a checklist_servicios_externos
-- Esta columna ya está en el schema de Prisma pero falta en la base de datos

ALTER TABLE checklist_servicios_externos 
ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP(6);

-- Comentario: Esta columna almacena la fecha de pago del servicio externo

