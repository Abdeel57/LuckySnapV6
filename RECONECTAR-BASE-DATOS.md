# 🔄 GUÍA PARA RECONECTAR BASE DE DATOS

## ⚠️ PROBLEMA
El error "server closed the connection unexpectedly" indica que Railway cambió la IP o la base de datos está inactiva.

## ✅ SOLUCIÓN

### Opción 1: Actualizar Configuración en Railway
1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu proyecto "Lucky Snap"
3. Ve a la pestaña "Data" o "Databases"
4. Busca tu base de datos PostgreSQL
5. Copia la NUEVA "Connection String"
6. Actualiza pgAdmin con los nuevos datos

### Opción 2: Crear Nueva Base de Datos
Si la base de datos está inactiva:
1. En Railway, ve a "Data"
2. Click en "New Database" o "Add PostgreSQL"
3. Copia la nueva connection string
4. Configura pgAdmin con los nuevos datos

### Extraer Información de la Connection String
Ejemplo de connection string:
```
postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:35011/railway
```

Información extraída:
- **Host**: `shinkansen.proxy.rlwy.net`
- **Port**: `35011` (o el que aparece en tu string)
- **Database**: `railway`
- **Username**: `postgres`
- **Password**: (la parte después de `postgres:` hasta el `@`)

### Configurar pgAdmin

1. **Click derecho en "Servers" → "Properties"**

2. **En la pestaña "Connection":**
   - Host: `shinkansen.proxy.rlwy.net` (actualizar si cambió)
   - Port: `35011` (verificar en Railway)
   - Database: `railway`
   - Username: `postgres`
   - Password: (la nueva contraseña de Railway)

3. **Marcar "Save Password"**

4. **Click en "OK"**

## 🧪 Probar Conexión

Para verificar que funciona:
```sql
SELECT NOW();
```

Si ejecuta sin errores, la conexión está activa.

## 📝 NOTA IMPORTANTE
Si Railway cambió tu base de datos, también necesitas actualizar el `DATABASE_URL` en Render para que tu backend siga funcionando.
