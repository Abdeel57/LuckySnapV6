# 🔧 MIGRACIÓN DE USUARIOS - PASOS A SEGUIR

## 📋 RESUMEN
Se han actualizado los campos de usuarios para usar **username** y **role** en lugar de email. Es necesario ejecutar una migración en PostgreSQL.

---

## ⚠️ PASOS IMPORTANTES

### 1️⃣ **EJECUTAR MIGRACIÓN EN POSTGRESQL**

Ve a pgAdmin y ejecuta este SQL:

**Ubicación del archivo:** `backend/migrations/add_admin_user_fields.sql`

**O copia y pega este SQL directamente:**

```sql
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

-- Hacer email opcional
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='admin_users' AND column_name='email' AND is_nullable='NO') THEN
        ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;
        RAISE NOTICE 'Campo email ahora es opcional';
    END IF;
END $$;

-- Actualizar usuarios existentes
UPDATE admin_users 
SET 
    username = COALESCE(username, 'admin' || id),
    role = COALESCE(role, 'admin'),
    email = CASE WHEN email IS NULL THEN NULL ELSE email END
WHERE username IS NULL OR role IS NULL;

-- Crear el superadmin
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
```

---

### 2️⃣ **VERIFICAR QUE FUNCIONÓ**

Ejecuta este query:

```sql
SELECT id, name, username, role, email FROM admin_users;
```

**Debes ver:**
- ✅ El superadmin con username='Orlando12' y role='superadmin'
- ✅ Cualquier otro usuario existente con username y role

---

### 3️⃣ **HACER DEPLOY**

```bash
git add -A
git commit -m "feat: migración de usuarios con username y role"
git push origin main
```

---

## ✅ DESPUÉS DEL DEPLOY

1. **Inicia sesión** con:
   - Usuario: `Orlando12`
   - Contraseña: `Pomelo_12@`

2. **Crea un nuevo usuario** desde el panel

3. **Verifica** que aparece en la lista

---

## 🎯 CAMBIOS IMPLEMENTADOS

### ✅ Schema Prisma Actualizado
- Campo `username` (único, obligatorio)
- Campo `role` (default: 'ventas')
- Campo `email` (opcional)

### ✅ Backend Actualizado
- Validación ahora usa `username` en lugar de `email`
- CreateUser valida campos correctos

### ✅ Frontend Actualizado
- Formulario pide: Nombre, Usuario, Contraseña, Rol
- Superadmin no aparece en la lista
- Menu adaptativo según rol

