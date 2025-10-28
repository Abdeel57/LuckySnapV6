-- MIGRACIÓN FINAL - Ejecutar en pgAdmin

-- Agregar las columnas si no existen
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ventas';
ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;

-- Hacer username único
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users(username);

-- Actualizar usuarios existentes
UPDATE admin_users 
SET 
    username = COALESCE(username, 'admin' || id),
    role = COALESCE(role, 'admin'),
    "updatedAt" = NOW()
WHERE username IS NULL OR role IS NULL;

-- Crear el superadmin (con camelCase)
INSERT INTO admin_users (id, name, username, email, password, role, "createdAt", "updatedAt")
VALUES (
    'superadmin-1',
    'Super Administrador',
    'Orlando12',
    NULL,
    'Pomelo_12@',
    'superadmin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "updatedAt" = NOW();

-- Verificar
SELECT id, name, username, role, email FROM admin_users;

