# 🔧 Instrucciones para Arreglar la Tabla Winners

## Problema
El schema de Prisma espera una tabla `winners` con campos `name`, `prize`, `imageUrl`, etc., pero la tabla en la base de datos tiene una estructura diferente.

## Solución

### Opción 1: Recrear la tabla (RECOMENDADO si no hay datos importantes)

1. Abre pgAdmin y conéctate a tu base de datos Railway
2. Abre el Query Tool
3. Ejecuta el script `backend/FIX_WINNERS_TABLE.sql`:

```sql
-- Eliminar la tabla vieja si existe
DROP TABLE IF EXISTS "winners" CASCADE;

-- Crear la tabla winners con los campos correctos
CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "raffleTitle" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "ticketNumber" INTEGER,
    "testimonial" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);
```

4. Verifica que la tabla se creó correctamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'winners';
```

### Opción 2: Si ya tienes datos en la tabla

Primero verifica qué campos tiene la tabla actual:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'winners';
```

Luego, dependiendo de los campos que tenga, necesitarás adaptar la migración o recrear la tabla (perdiendo los datos existentes).

## Después de aplicar el fix

1. El backend en Render debería reiniciarse automáticamente
2. Si no reinicia, entra a Render y haz un manual redeploy
3. Verifica que la app funciona correctamente

## Archivo a usar
- `backend/FIX_WINNERS_TABLE.sql`
