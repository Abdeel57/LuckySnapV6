# 🚀 DEPLOYAR FRONTEND AHORA

## ✅ YA HECHO
1. ✅ Commits pusheados a GitHub
2. ✅ Código listo para deploy

## 📋 DEPLOY EN NETLIFY

### Opción 1: Deploy Automático (Recomendado)
Netlify debería detectar automáticamente el push y empezar a construir.
- Ve a tu dashboard de Netlify
- Deberías ver un build en progreso
- Espera 2-5 minutos
- Cuando termine, tus cambios estarán activos

### Opción 2: Deploy Manual
Si Netlify no está detectando el push automáticamente:

1. Ve a [Netlify Dashboard](https://app.netlify.com)
2. Selecciona tu sitio
3. Click en **"Production deploy"** → **"Deploy site"**
4. Selecciona branch: `main`
5. Click en **"Deploy"**
6. Espera 2-5 minutos

### Opción 3: Drag and Drop
1. En la terminal, ejecuta:
   ```bash
   cd frontend
   npm run build
   ```
2. Espere a que termine
3. Ve a [Netlify](https://app.netlify.com)
4. Arrastra la carpeta `frontend/dist` a la sección de deploy
5. Espera a que se complete

---

## 🧪 VERIFICAR CAMBIOS

Después del deploy, verifica:
1. Ve a tu sitio público
2. Click en admin
3. Ve a "Sorteos" → "Nueva Rifa"
4. Click en "Configuración Avanzada"
5. ✅ DEBERÍAS VER:
   - Checkbox "Boletos con Múltiples Oportunidades"
   - Input para número de oportunidades
   - Todas las mejoras implementadas

---

## 📝 ARCHIVOS MODIFICADOS QUE DEBEN APARECER

- ✅ `frontend/types.ts` - Agregados campos de oportunidades
- ✅ `frontend/components/admin/AdvancedRaffleForm.tsx` - Formulario con opciones
- ✅ `frontend/pages/admin/AdminRafflesPage.tsx` - Limpieza de datos
- ✅ `backend/src/admin/admin.service.ts` - Lógica de guardado
- ✅ `backend/prisma/schema.prisma` - Schema actualizado
