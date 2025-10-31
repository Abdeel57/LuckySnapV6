-- Migración: Cambiar twitterUrl por tiktokUrl en la tabla settings
-- Ejecutar este script en pgAdmin o en tu cliente PostgreSQL

-- Primero, agregar la nueva columna tiktokUrl
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;

-- Copiar datos de twitterUrl a tiktokUrl (si existen datos)
UPDATE settings SET "tiktokUrl" = "twitterUrl" WHERE "twitterUrl" IS NOT NULL AND "tiktokUrl" IS NULL;

-- Opcional: Eliminar la columna twitterUrl después de verificar que todo funciona
-- Descomenta la siguiente línea después de verificar que todo está bien:
-- ALTER TABLE settings DROP COLUMN "twitterUrl";

