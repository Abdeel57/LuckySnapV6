# 🔍 VERIFICACIÓN RÁPIDA DEL PANEL DE USUARIOS

## Script de Verificación Rápida

Ejecuta estos comandos para verificar que todo está listo:

### 1. Verificar Backend

```bash
cd backend

# Verificar dependencias
echo "Verificando bcrypt..."
npm list bcrypt @types/bcrypt

# Verificar compilación
echo "Compilando..."
npm run typecheck

# Regenerar Prisma
echo "Regenerando Prisma Client..."
npx prisma generate

echo "✅ Backend verificado"
```

### 2. Verificar Base de Datos

```sql
-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- Verificar que existe al menos un admin
SELECT COUNT(*) as admin_count 
FROM admin_users 
WHERE role IN ('admin', 'superadmin');

-- Verificar que las contraseñas están hasheadas
SELECT username, 
       CASE 
         WHEN password LIKE '$2b$%' THEN '✅ Hasheada'
         ELSE '❌ Texto plano'
       END as password_status
FROM admin_users
LIMIT 5;
```

### 3. Probar Endpoints (desde terminal o Postman)

```bash
# Base URL (ajusta según tu ambiente)
BASE_URL="http://localhost:3000/api"  # Local
# BASE_URL="https://tu-backend.com/api"  # Producción

# Test 1: Obtener usuarios
echo "Test 1: GET /admin/users"
curl -X GET "$BASE_URL/admin/users" -H "Content-Type: application/json"

# Test 2: Crear usuario (ajusta los datos)
echo "Test 2: POST /admin/users"
curl -X POST "$BASE_URL/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "username": "testuser",
    "password": "testpass123",
    "role": "ventas"
  }'

# Verificar que NO aparece password en la respuesta
echo "✅ Verifica que la respuesta NO incluye 'password'"
```

### 4. Verificar Frontend

```bash
cd frontend

# Verificar compilación
echo "Compilando frontend..."
npm run build

echo "✅ Frontend verificado"
```

## Checklist Visual

Marca estos puntos cuando pruebes en el navegador:

### Panel de Usuarios - Funcionalidades
- [ ] ✅ Lista de usuarios se carga correctamente
- [ ] ✅ Puedo crear un nuevo usuario
- [ ] ✅ Puedo editar un usuario existente
- [ ] ✅ Puedo eliminar un usuario (no superadmin)
- [ ] ✅ Las contraseñas NO aparecen en ningún lugar visible

### Panel de Usuarios - Validaciones
- [ ] ✅ Error al crear usuario con username duplicado
- [ ] ✅ Error al crear usuario con password menor a 6 caracteres
- [ ] ✅ Error al intentar eliminar superadmin
- [ ] ✅ Error al editar usuario que no existe

### Panel de Usuarios - Seguridad
- [ ] ✅ En la consola del navegador, las respuestas NO incluyen passwords
- [ ] ✅ En la base de datos, las contraseñas están hasheadas
- [ ] ✅ Solo usuarios admin pueden acceder al panel

## Pruebas Manuales Rápidas

### Prueba 1: Crear y Verificar Usuario
1. Crear usuario: nombre="Test", username="test1", password="test123", rol="ventas"
2. Verificar que aparece en la lista
3. **VERIFICAR:** En la consola del navegador (F12 → Network), la respuesta NO incluye `password`

### Prueba 2: Editar sin Cambiar Password
1. Editar usuario test1: cambiar nombre a "Test Actualizado"
2. NO tocar el campo password
3. Guardar
4. **VERIFICAR:** El nombre cambió, la contraseña sigue funcionando

### Prueba 3: Cambiar Password
1. Editar usuario test1: cambiar password a "newpass123"
2. Guardar
3. **VERIFICAR:** Puedes iniciar sesión con la nueva contraseña

### Prueba 4: Intentar Eliminar Superadmin
1. Si tienes acceso directo a un superadmin en la lista
2. Intentar eliminarlo
3. **VERIFICAR:** Error "Cannot delete superadmin user"

## Resultado Esperado

Si todos los tests pasan:
```
✅ Backend: Funcionando
✅ Base de datos: Correcta
✅ Frontend: Funcionando
✅ Seguridad: Implementada
✅ Validaciones: Funcionando
```

**El panel de usuarios está 100% funcional** 🎉

