-- 🚀 MIGRACIÓN PARA EXPIRACIÓN AUTOMÁTICA DE ÓRDENES
-- Copia y pega esto en pgAdmin Query Tool de tu base de datos Railway ("railway")

-- 1. Actualizar el enum OrderStatus para incluir 'RELEASED' si no existe
-- Nota: En PostgreSQL, los enums se manejan con ALTER TYPE
DO $$
BEGIN
    -- Verificar si el valor ya existe para evitar errores
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'OrderStatus' AND e.enumlabel = 'RELEASED'
    ) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'RELEASED';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Si el tipo no existe, lo creamos (aunque Prisma debería haberlo creado)
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'RELEASED');
END $$;

-- 2. Agregar la columna orderExpirationMinutes a la tabla settings
-- Usamos "orderExpirationMinutes" con comillas para respetar el case-sensitivity de Prisma
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS "orderExpirationMinutes" INTEGER DEFAULT 1440;

-- 3. Verificar los cambios
SELECT 
    column_name, 
    data_type, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND column_name = 'orderExpirationMinutes';

-- ¡Listo! El backend ahora podrá leer y escribir este campo.
