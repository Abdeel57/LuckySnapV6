-- Script para limpiar datos corruptos de doble serialización
-- Ejecutar en pgAdmin después de conectar a la base de datos

-- Limpiar paymentAccounts corruptos
UPDATE "settings" 
SET "paymentAccounts" = '[]'::jsonb 
WHERE "paymentAccounts" LIKE '"%"' OR "paymentAccounts" IS NULL;

-- Limpiar faqs corruptos  
UPDATE "settings" 
SET "faqs" = '[]'::jsonb 
WHERE "faqs" LIKE '"%"' OR "faqs" IS NULL;

-- Verificar que se limpiaron correctamente
SELECT 
    id,
    siteName,
    "paymentAccounts",
    faqs,
    "updatedAt"
FROM "settings" 
WHERE id = 'main_settings';

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;
