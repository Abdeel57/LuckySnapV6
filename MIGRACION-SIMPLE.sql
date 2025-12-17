-- MIGRACIÓN SIMPLE - Copiar y pegar todo en pgAdmin Query Tool

-- 1. Agregar columna username
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Hacer username único
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users(username);

-- 3. Agregar columna role
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ventas';

-- 4. Hacer email opcional
ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;

-- 5. Actualizar usuarios existentes (si hay)
UPDATE admin_users 
SET 
    username = COALESCE(username, 'admin' || id),
    role = COALESCE(role, 'admin')
WHERE username IS NULL OR role IS NULL;

-- 6. Crear el superadmin
INSERT INTO admin_users (id, name, username, email, password, role, created_at, updated_at)
SELECT 
    'superadmin-1',
    'Super Administrador',
    'Orlando12',
    NULL,
    'Pomelo_12@',
    'superadmin',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'Orlando12'
);

-- ¡Listo! Ahora verifica con:
-- SELECT id, name, username, role, email FROM admin_users;

