-- Verificar que la tabla winners tiene los campos correctos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'winners'
ORDER BY ordinal_position;
