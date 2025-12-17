# 🔄 Guía de Migración - Mejoras en Sección de Ganadores

## Resumen de Cambios

Se agregaron nuevos campos al modelo `Winner` para mejorar la funcionalidad de la sección de ganadores:

### Nuevos Campos Agregados
- `ticketNumber: Int?` - Número del boleto ganador
- `testimonial: String?` - Testimonio del ganador
- `phone: String?` - Teléfono del ganador
- `city: String?` - Ciudad del ganador

### Cambios en el Frontend
- ✅ Formulario para agregar ganadores manualmente (`WinnerForm.tsx`)
- ✅ Animación atractiva para sorteos aleatorios (`WinnerDrawAnimation.tsx`)
- ✅ Conversión automática de imágenes a base64
- ✅ Visualización de campos adicionales en el historial de ganadores

### Cambios en el Backend
- ✅ Schema actualizado en `backend/prisma/schema.prisma`
- ✅ Cliente de Prisma regenerado con nuevos tipos
- ✅ Endpoints ya compatibles con los nuevos campos

## ⚠️ Estado Actual

**Base de Datos**: ✅ La migración se aplicó exitosamente usando pgAdmin.

**Código**: ✅ Todo el código está actualizado y compilado correctamente.

**Status**: ✅ **MIGRACIÓN COMPLETADA**

## 🚀 Pasos para Aplicar la Migración

### Opción 1: Migración Manual en Railway (Recomendado)

1. Abre tu panel de Railway
2. Ve a la base de datos PostgreSQL
3. Abre el editor de SQL o conecta con un cliente PostgreSQL
4. Ejecuta el siguiente SQL:

```sql
-- Migración para agregar nuevos campos al modelo Winner
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "ticketNumber" INTEGER;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "testimonial" TEXT;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "city" TEXT;
```

### Opción 2: Usando Prisma Migrate (cuando la conexión funcione)

```bash
cd backend
npx prisma migrate dev --name update_winner_model
```

### Archivos de Referencia

- ✅ `backend/prisma/schema.prisma` - Schema actualizado
- ✅ `backend/WINNER_MIGRATION_SQL.sql` - Script SQL para aplicar manualmente
- ✅ `backend/apply-winner-migration.js` - Script de verificación (opcional)

## 🔍 Verificación

Después de aplicar la migración, verifica que los campos se agregaron correctamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'winners';
```

Deberías ver los nuevos campos:
- `ticketNumber`
- `testimonial`
- `phone`
- `city`

## 📝 Notas Importantes

1. **Compatibilidad**: El código frontend y backend ya está preparado para los nuevos campos
2. **Campos Opcionales**: Todos los nuevos campos son opcionales, por lo que no romperán datos existentes
3. **Base de Datos Externa**: La migración debe ejecutarse en la base de datos de producción (Railway)
4. **Rollback**: Si necesitas revertir, puedes eliminar las columnas:
   ```sql
   ALTER TABLE "winners" DROP COLUMN IF EXISTS "ticketNumber";
   ALTER TABLE "winners" DROP COLUMN IF EXISTS "testimonial";
   ALTER TABLE "winners" DROP COLUMN IF EXISTS "phone";
   ALTER TABLE "winners" DROP COLUMN IF EXISTS "city";
   ```

## 🎯 Próximos Pasos

1. Ejecutar la migración SQL en Railway
2. Verificar que el backend funciona correctamente
3. Probar la funcionalidad de agregar ganadores manualmente
4. Probar la animación de sorteo aleatorio
5. Verificar que los datos adicionales se guardan correctamente

## ✅ Checklist de Deploy

- [x] Frontend compilado
- [x] Backend compilado
- [x] Cliente Prisma regenerado
- [x] Schema actualizado
- [x] Migración SQL aplicada en Railway (pgAdmin)
- [x] Verificación en producción
- [x] Backend recompilado con nuevos campos

