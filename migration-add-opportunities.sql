-- Migración: Agregar campos de múltiples oportunidades a la tabla raffles
-- Ejecutar en pgAdmin conectado a la base de datos de producción

-- Agregar columna boletosConOportunidades
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS "boletosConOportunidades" BOOLEAN DEFAULT false;

-- Agregar columna numeroOportunidades
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS "numeroOportunidades" INTEGER DEFAULT 1;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'raffles'
AND column_name IN ('boletosConOportunidades', 'numeroOportunidades');
