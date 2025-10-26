# 📊 VERIFICAR TABLAS EN TU BASE DE DATOS

## ❗ PROBLEMA
El error "relation 'raffles' does not exist" significa que no estás en la base de datos correcta o las tablas no existen.

## ✅ SOLUCIÓN

### Paso 1: Verificar que Estás en "railway"
1. En pgAdmin, busca en el árbol lateral:
   - **Lucky Snap**
     - Databases (2)
       - **railway** ← Esta es la correcta
       - postgres ← Esta es la base de datos por defecto
2. Click derecho en **"railway"** → **"Query Tool"**

### Paso 2: Verificar que las Tablas Existen
Ejecuta este SQL para ver todas tus tablas:

```sql
-- Ver todas las tablas en la base de datos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Deberías ver:
- raffles
- orders
- users
- winners
- settings
- admin_users

### Paso 3: Si NO Ves las Tablas

#### Opción A: Las Tablas Están Vacías (Nueva Base de Datos)
Necesitas ejecutar el script de inicialización:

1. En Railway, ve a tu base de datos
2. Busca la pestaña "Scripts" o "Init Script"
3. O ejecuta manualmente todas las tablas

#### Opción B: Estás en la Base de Datos Incorrecta
1. Verifica que "railway" tiene esquema `public` con tablas
2. Si no tiene tablas, necesitas crear la base de datos inicial

### Paso 4: Si SÍ Ves las Tablas
Entonces puedes ejecutar la migración:

```sql
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS "boletosConOportunidades" BOOLEAN DEFAULT false;

ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS "numeroOportunidades" INTEGER DEFAULT 1;
```

---

## 🔍 DIAGNÓSTICO

**¿Qué base de datos debes usar?**
- ✅ **CORRECTA**: "railway" (donde están tus tablas)
- ❌ **INCORRECTA**: "postgres" (base de datos por defecto vacía)

**¿Cómo saber si "railway" existe?**
- Mira el árbol lateral en pgAdmin
- Busca bajo "Databases"
- Si solo ves "postgres", la conexión no está configurada correctamente
