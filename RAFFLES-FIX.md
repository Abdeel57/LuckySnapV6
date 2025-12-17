# 🔧 Solución para Problemas en Sección de Rifas

## Problema Identificado

Existen **DOS archivos diferentes** para la gestión de rifas con lógica distinta:

1. `frontend/pages/admin/AdminRafflesPage.tsx` - Limpia datos usando `cleanRaffleData` correctamente
2. `frontend/pages/admin/OptimizedAdminRafflesPage.tsx` - Usa lógica antigua con campos que no existen en el schema

## Causa del Error

El problema es que hay una inconsistencia entre:
- **Schema de Prisma** (back): Solo tiene campos: `title`, `description`, `imageUrl`, `price`, `tickets`, `drawDate`, `status`, `slug`, `boletosConOportunidades`, `numeroOportunidades`
- **Tipo Raffle en frontend**: Tiene campos adicionales como `heroImage`, `gallery`, `packs`, `bonuses` que NO existen en la base de datos

Cuando `OptimizedAdminRafflesPage` envía datos con campos que no existen (`heroImage`, `gallery`, `packs`, `bonuses`), el backend los rechaza o los ignora, causando errores.

## Solución Implementada

### Backend (Ya funciona correctamente)
- ✅ Valida y acepta solo campos válidos del schema
- ✅ Genera slug automáticamente si no se proporciona
- ✅ Previene cambios en `price` y `tickets` cuando hay boletos vendidos

### Frontend: Actualización Necesaria

**Archivo:** `frontend/pages/admin/AdminRafflesPage.tsx`

Este archivo ya tiene la función `cleanRaffleData` que limpia los datos correctamente:

```typescript
const cleanRaffleData = (data: Raffle) => {
    const gallery = data.gallery || [];
    return {
        title: data.title.trim(),
        description: data.description || null,
        imageUrl: gallery.length > 0 ? gallery[0] : (data.imageUrl || data.heroImage || null),
        price: Number(data.price),
        tickets: Number(data.tickets),
        drawDate: new Date(data.drawDate),
        status: data.status || 'draft',
        slug: data.slug || null,
        boletosConOportunidades: data.boletosConOportunidades || false,
        numeroOportunidades: data.numeroOportunidades || 1
        // NO enviar: packs, gallery, bonuses, heroImage, sold, createdAt, updatedAt
    };
};
```

## Verificación

1. ✅ Backend recibe solo campos válidos
2. ✅ Backend valida datos correctamente
3. ✅ Backend previene cambios peligrosos (precio/boletos con ventas)
4. ⚠️ Frontend debe usar `AdminRafflesPage.tsx` NO `OptimizedAdminRafflesPage.tsx`

## Acción Requerida

**Verificar qué página está activa en el router:**

Buscar en `frontend/App.tsx` o `frontend/main.tsx`:

```typescript
// Debe ser:
import AdminRafflesPage from './pages/admin/AdminRafflesPage';

// NO debe ser:
import OptimizedAdminRafflesPage from './pages/admin/OptimizedAdminRafflesPage';
```

Si está usando `OptimizedAdminRafflesPage`, cambiar a `AdminRafflesPage`.

## Campos Aceptados por el Backend

### Campos Requeridos:
- `title`: string (requerido)
- `price`: number (requerido, > 0)
- `tickets`: number (requerido, > 0)
- `drawDate`: Date (requerido)

### Campos Opcionales:
- `description`: string | null
- `imageUrl`: string | null
- `status`: 'draft' | 'active' | 'finished' (default: 'draft')
- `slug`: string | null (se genera automáticamente si no se proporciona)
- `boletosConOportunidades`: boolean (default: false)
- `numeroOportunidades`: number (default: 1, min: 1, max: 10)

### Campos NO Aceptados:
- ❌ `heroImage`
- ❌ `gallery` (usar `imageUrl` con la primera imagen)
- ❌ `packs`
- ❌ `bonuses`
- ❌ `id` (se genera automáticamente)
- ❌ `sold` (se maneja automáticamente)
- ❌ `createdAt` (se genera automáticamente)
- ❌ `updatedAt` (se genera automáticamente)

## Cómo Probar

1. Crear una rifa nueva con campos básicos
2. Editar una rifa existente
3. Cambiar estado de rifa (draft → active → finished)
4. Intentar cambiar precio en rifa con boletos vendidos (debe fallar)
5. Eliminar rifa sin boletos pagados
6. Intentar eliminar rifa con boletos pagados (debe fallar)
