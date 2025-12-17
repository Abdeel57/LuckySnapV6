-- Migración: Agregar campos de personalización de correo electrónico
-- Ejecutar este script en pgAdmin o en tu cliente PostgreSQL

-- Agregar las nuevas columnas para personalización de email
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "emailFromName" TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "emailReplyTo" TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "emailSubject" TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN settings."emailFromName" IS 'Nombre del remitente que aparece en los emails';
COMMENT ON COLUMN settings."emailReplyTo" IS 'Email de respuesta (Reply-To) para emails enviados';
COMMENT ON COLUMN settings."emailSubject" IS 'Asunto por defecto para emails automáticos';

