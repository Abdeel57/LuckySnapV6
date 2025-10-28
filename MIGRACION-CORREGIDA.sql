-- MIGRACIÓN CORREGIDA - Ejecutar paso a paso en pgAdmin

-- PASO 1: Agregar las columnas faltantes
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ventas';
ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;

-- PASO 2: Hacer username único
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users(username);

-- PASO 3: Actualizar usuarios existentes (si hay)
UPDATE admin_users 
SET 
    username = COALESCE(username, 'admin' || id),
    role = COALESCE(role, 'admin')
WHERE username IS NULL OR role IS NULL;

-- PASO 4: Crear el superadmin (SIN created_at y updated_at)
INSERT INTO admin_users (id, name, username, email, password, role)
VALUES (
    'superadmin-1',
    'Super Administrador',
    'Orlando12',
    NULL,
    'Pomelo_12@',
    'superadmin'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    role = EXCLUDED.role;

-- ¡LISTO! Verifica con:
-- SELECT id, name, username, role, email FROM admin_users;

