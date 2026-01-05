# 🚂 DEPLOY MANUAL EN RAILWAY - Paso a Paso

## 📋 Pasos para Deploy Manual del Backend en Railway

### 1️⃣ Acceder a Railway Dashboard
1. Ve a: **https://railway.app/dashboard**
2. Inicia sesión con tu cuenta de Railway

### 2️⃣ Seleccionar tu Proyecto
1. En el dashboard, busca tu proyecto (probablemente "Lucky Snap" o similar)
2. Haz clic en el proyecto para abrirlo

### 3️⃣ Seleccionar el Servicio de Backend
1. Dentro del proyecto, verás tus servicios
2. Selecciona el servicio del **backend** (el que tiene el código del servidor)

### 4️⃣ Hacer Deploy Manual

#### Opción A: Desde la pestaña Deployments (Recomendado)
1. Haz clic en la pestaña **"Deployments"** en el menú lateral
2. Verás una lista de deploys anteriores
3. Haz clic en el botón **"Deploy"** o **"Redeploy"** (arriba a la derecha)
4. Selecciona **"Deploy latest commit"** o **"Deploy from GitHub"**
5. Confirma el deploy

#### Opción B: Desde Settings
1. Ve a **Settings** → **Service Settings**
2. Busca la sección **"Deploy"**
3. Haz clic en **"Redeploy"** o **"Deploy"**

### 5️⃣ Monitorear el Deploy
1. Ve a la pestaña **"Logs"** mientras se hace el deploy
2. Verás el progreso en tiempo real:
   ```
   Installing dependencies...
   npm install
   npx prisma generate
   npm run start:optimized
   ```
3. El deploy puede tardar **2-5 minutos**

### 6️⃣ Verificar que el Deploy Fue Exitoso
1. Cuando termine, el estado debería cambiar a **"Active"** o **"Running"**
2. Deberías ver un mensaje de éxito en los logs
3. Prueba tu backend:
   - Ve a **Settings** → **Networking**
   - Copia la **URL pública** (ej: `https://tu-backend.railway.app`)
   - Prueba: `https://tu-backend.railway.app/api/health`
   - Deberías ver: `{"status":"OK"}`

---

## 🔍 Verificar Configuración (Opcional)

Si quieres asegurarte de que todo esté bien configurado:

### Settings → Service Settings
- ✅ **Auto-Deploy**: Debería estar activado (para futuros deploys automáticos)
- ✅ **Branch**: Debería ser `main`

### Settings → Source
- ✅ **Repository**: Debería estar conectado a `Abdeel57/LuckySnapV6`
- ✅ **Branch**: Debería ser `main`

### Variables de Entorno (Settings → Variables)
Asegúrate de que estas variables estén configuradas:
- ✅ `DATABASE_URL`: Tu connection string de Railway PostgreSQL
- ✅ `NODE_ENV`: `production`
- ✅ `PORT`: `3000`
- ✅ `JWT_SECRET`: Tu secreto JWT
- ✅ `CORS_ORIGINS`: URL de tu frontend en Netlify

---

## ✅ Checklist de Verificación

Después del deploy:

- [ ] Deploy completado sin errores
- [ ] Estado del servicio es "Active" o "Running"
- [ ] Endpoint `/api/health` responde correctamente
- [ ] Los logs no muestran errores críticos
- [ ] El backend está accesible desde el frontend

---

## 🚨 Solución de Problemas

### Si el deploy falla:
1. Revisa los logs para ver el error específico
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de que la base de datos esté activa en Railway
4. Verifica que el código en GitHub esté actualizado

### Si el backend no responde:
1. Espera 2-3 minutos después del deploy (puede tardar en iniciar)
2. Verifica la URL pública en Settings → Networking
3. Revisa los logs para ver si hay errores de conexión
4. Verifica que `DATABASE_URL` esté correcta

---

## 🎉 ¡Listo!

Una vez que el deploy esté completo y verificado, tu cambio (permitir eliminar rifas con órdenes pagadas) estará disponible en producción.

**¿Necesitas ayuda con algún paso específico?**

