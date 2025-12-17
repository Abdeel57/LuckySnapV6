-- Migración para agregar nuevos campos al modelo Winner
-- Ejecutar en Railway PostgreSQL cuando sea posible

-- Agregar campos opcionales al modelo Winner
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "ticketNumber" INTEGER;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "testimonial" TEXT;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- Verificar que los campos se agregaron correctamente
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'winners';

