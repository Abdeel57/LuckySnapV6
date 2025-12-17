# 🔄 ACTUALIZAR BASE DE DATOS EN RAILWAY - PASO A PASO

## ✅ PASO 1: Obtener Nueva Connection String

1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu proyecto
3. Click en tu base de datos PostgreSQL
4. Ve a la pestaña **"Connect"** o **"Data"**
5. Copia la **connection string** completa

Ejemplo:
```
postgresql://postgres:NUEVA_PASSWORD@NUEVO_HOST.rlwy.net:PUERTO/railway
```

---

## ✅ PASO 2: Actualizar pgAdmin con Nueva Conexión

### Editar Conexión Existente:
1. Click derecho en **"Lucky Snap"** → **"Properties"**
2. En la pestaña **"Connection"**:
   - **Host**: Copia desde el connection string (ej: `shinkansen.proxy.rlwy.net`)
   - **Port**: Copia del connection string (ej: `35011`)
   - **Database**: `railway`
   - **Username**: `postgres`
   - **Password**: La nueva contraseña del connection string
3. ✅ **Marca "Save Password"**
4. Click en **"OK"**

### O Crear Nueva Conexión:
1. Click derecho en **"Servers"** → **"Register"** → **"Server"**
2. Pestaña **"General"**:
   - Name: `Lucky Snap Railway`
3. Pestaña **"Connection"**:
   - Host: (del connection string)
   - Port: (del connection string)
   - Database: `railway`
   - Username: `postgres`
   - Password: (nueva contraseña)
4. ✅ Marca **"Save Password"**
5. Click en **"Save"**

---

## ✅ PASO 3: Ejecutar Migración SQL

1. Conéctate a tu base de datos en pgAdmin
2. Click derecho en tu base de datos → **"Query Tool"**
3. Copia y pega este SQL:

```sql
-- Agregar columna boletosConOportunidades
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS "boletosConOportunidades" BOOLEAN DEFAULT false;

-- Agregar columna numeroOportunidades
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS "numeroOportunidades" INTEGER DEFAULT 1;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'raffles'
AND column_name IN ('boletosConOportunidades', 'numeroOportunidades');
```

4. Ejecuta con **F5** o click en el botón ejecutar

---

## ✅ PASO 4: Actualizar Backend en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio **"lucky-snap-backend-complete"**
3. Ve a **"Environment"**
4. Busca la variable **"DATABASE_URL"**
5. Click en el lápiz para editar
6. Pega tu **NUEVO connection string** de Railway
7. Click en **"Save Changes"**
8. Render automáticamente reiniciará el backend

---

## ✅ PASO 5: Verificar que Todo Funciona

1. Espera 2-3 minutos a que Render reinicie
2. Prueba acceder a tu backend:
   ```
   https://lucky-snap-backend-complete.onrender.com/api/health
   ```
3. Deberías ver: `"status": "OK"`

---

## 🎉 ¡LISTO!

Tu base de datos y backend deberían estar funcionando correctamente.

---

## 🆘 SI ALGO FALLA

Si render no se conecta:
1. Verifica que la connection string esté correcta
2. Verifica que Railway muestre que la base de datos está activa
3. Espera 5 minutos y vuelve a intentar
4. Verifica los logs en Render para ver el error específico
