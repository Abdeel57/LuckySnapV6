-- Migración: Agregar campos username y role a admin_users
-- Ejecutar en pgAdmin o psql

-- Agregar columna username si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='username') THEN
        ALTER TABLE admin_users ADD COLUMN username TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users(username);
        RAISE NOTICE 'Campo username agregado';
    ELSE
        RAISE NOTICE 'Campo username ya existe';
    END IF;
END $$;

-- Agregar columna role si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='role') THEN
        ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'ventas';
        RAISE NOTICE 'Campo role agregado';
    ELSE
        RAISE NOTICE 'Campo role ya existe';
    END IF;
END $$;

-- Hacer email opcional si es NOT NULL
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='admin_users' AND column_name='email' AND is_nullable='NO') THEN
        ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;
        RAISE NOTICE 'Campo email ahora es opcional';
    ELSE
        RAISE NOTICE 'Campo email ya es opcional o no existe';
    END IF;
END $$;

-- Actualizar usuarios existentes para que tengan username y role
UPDATE admin_users 
SET 
    username = COALESCE(username, 'admin' || id),
    role = COALESCE(role, 'admin'),
    email = CASE WHEN email IS NULL THEN NULL ELSE email END
WHERE username IS NULL OR role IS NULL;

-- Crear el superadmin si no existe
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

DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
END $$;










