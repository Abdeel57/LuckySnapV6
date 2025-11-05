-- Migración para agregar campos packs y bonuses a la tabla raffles
-- Ejecutar este script en la base de datos PostgreSQL

-- Agregar columna packs (JSONB) para almacenar paquetes de boletos
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS packs JSONB;

-- Agregar columna bonuses (array de strings) para almacenar bonos/premios adicionales
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS bonuses TEXT[];

-- Comentarios para documentación
COMMENT ON COLUMN raffles.packs IS 'Array de paquetes de boletos con nombre, cantidad y precio';
COMMENT ON COLUMN raffles.bonuses IS 'Array de bonos y premios adicionales ofrecidos en la rifa';

