-- Agregar campo gallery a la tabla raffles
-- Ejecutar en Railway PostgreSQL via pgAdmin

ALTER TABLE "raffles" ADD COLUMN IF NOT EXISTS "gallery" JSONB;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'raffles' AND column_name = 'gallery';

