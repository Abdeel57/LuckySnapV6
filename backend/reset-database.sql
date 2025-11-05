-- Script para limpiar la base de datos y empezar de cero
-- ADVERTENCIA: Esto eliminará TODOS los datos

-- Eliminar todas las tablas en orden (respetando las dependencias)
DROP TABLE IF EXISTS "winners" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TABLE IF EXISTS "raffles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "admin_users" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada correctamente. Ejecuta "npx prisma migrate deploy" para recrear las tablas.' AS mensaje;

