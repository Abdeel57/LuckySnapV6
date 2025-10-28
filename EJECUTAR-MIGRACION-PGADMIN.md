# 🚀 EJECUTAR MIGRACIÓN EN PGADMIN - PASO A PASO

## 📝 PASOS EXACTOS

### 1️⃣ **Abrir Query Tool en pgAdmin**

1. Conéctate a tu servidor Railway en pgAdmin
2. En el menú izquierdo, expande tu base de datos
3. Haz clic derecho en tu base de datos (ej: "railway/postgres@Lucky Snap")
4. Selecciona **"Query Tool"** o presiona `Ctrl+Alt+Q`

### 2️⃣ **Copiar y Pegar el SQL**

En la ventana del Query Tool que se abre, **borra todo el contenido** y pega esto:

```sql
-- Agregar columna username
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users(username);

-- Agregar columna role
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ventas';

-- Hacer email opcional
ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;

-- Actualizar usuarios existentes
UPDATE admin_users 
SET 
    username = COALESCE(username, 'admin' || id),
    role = COALESCE(role, 'admin')
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

### 3️⃣ **Ejecutar el SQL**

1. Haz clic en el botón **▶️ (Execute)** en la barra superior
2. O presiona **F5**

### 4️⃣ **Verificar los Mensajes**

Ve a la pestaña **"Messages"** en la parte inferior:
- Debe mostrar "Successfully run. Total query runtime: X ms"
- NO debe haber errores en rojo

### 5️⃣ **Verificar que Funcionó**

En la misma ventana del Query Tool, borra el SQL anterior y pega esto:

```sql
SELECT id, name, username, role, email FROM admin_users;
```

Y ejecuta con ▶️ o F5

**Debes ver:**
- ✅ Usuario con username='Orlando12', role='superadmin'

---

## ✅ SI VES ERRORES

Si aparece algún error, compártelo y te ayudo a solucionarlo.
