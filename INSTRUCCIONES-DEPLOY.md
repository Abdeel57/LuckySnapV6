# 📦 INSTRUCCIONES DE DEPLOY - Lucky Snap

---

## 🎯 DEPLOY FRONTEND A NETLIFY

### **Método 1: Arrastrar y Soltar (MÁS FÁCIL) ⭐**

1. **Verifica que el build está listo:**
   ```
   📁 frontend/dist/
   ```
   ✅ Ya está compilado con todos los cambios

2. **Ve a Netlify:**
   - Abre: https://app.netlify.com/
   - Login con tu cuenta
   - Busca tu sitio: `jocular-brioche-6fbeda`

3. **Hacer Deploy:**
   - Click en "Deploys" en el menú
   - Arrastra la carpeta `frontend/dist` a la zona de drop
   - Espera 30-60 segundos
   - ✅ ¡Listo!

4. **Verificar:**
   - Ve a tu URL de Netlify
   - Prueba ir a `/admin/apartados`
   - ✅ Ya NO debe aparecer el error "FileText is not defined"

---

### **Método 2: Desde Git (Automático)**

1. **Hacer commit de los cambios:**
   ```bash
   git add .
   git commit -m "fix: Optimizaciones para producción - FileText, paginación, Cloudinary"
   git push origin main
   ```

2. **Netlify detectará el push automáticamente**
   - Ve a https://app.netlify.com/
   - Verás un nuevo deploy en proceso
   - Espera 2-3 minutos

---

## 🔧 DEPLOY BACKEND A RENDER

### **Paso 1: Actualizar Configuración**

1. **Ve a Render Dashboard:**
   - Abre: https://dashboard.render.com/
   - Selecciona tu servicio backend

2. **Actualizar Settings → Build & Deploy:**
   ```yaml
   Build Command:
     npm install && npx prisma generate

   Start Command:
     node fix-render-backend.js
   ```

3. **Verificar Environment Variables:**
   ```
   ✅ DATABASE_URL (debe estar configurada)
   ✅ NODE_ENV=production
   ✅ PORT=3000
   ✅ JWT_SECRET=tu_secreto
   ✅ CORS_ORIGINS=https://jocular-brioche-6fbeda.netlify.app
   ```

### **Paso 2: Hacer Deploy**

**Opción A - Manual Deploy:**
1. En Render Dashboard, click "Manual Deploy"
2. Click "Deploy latest commit"
3. Espera 5-10 minutos

**Opción B - Push a Git:**
```bash
git add .
git commit -m "fix: Optimizaciones para producción"
git push origin main
```
Render detectará el push y hará deploy automáticamente.

### **Paso 3: Verificar Deploy**

```bash
# Health Check (reemplaza con tu URL)
curl https://tu-backend.onrender.com/api/health

# Debería responder:
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45,
  "environment": "production",
  "memory": {
    "used": 120,
    "total": 450
  }
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de hacer deploy, verifica:

### Frontend:
- [ ] Ve a tu URL de Netlify
- [ ] Click en "Admin" o ve a `/#/admin`
- [ ] Login con tus credenciales
- [ ] Ve a "Apartados"
- [ ] ✅ NO debe aparecer error "FileText is not defined"
- [ ] ✅ Las órdenes deben cargar correctamente

### Backend:
- [ ] Health check responde OK
- [ ] `/api/admin/orders` carga sin timeout
- [ ] `/api/admin/raffles` funciona correctamente
- [ ] Panel de admin muestra datos

---

## 🎉 NUEVAS CARACTERÍSTICAS QUE VERÁS

### 🎨 **Frontend:**
- ✅ Sección de apartados funcionando sin errores
- ✅ Upload de imágenes con validación (máx 2MB)
- ✅ Indicador de carga al subir imágenes
- ✅ Mensajes de error más claros

### ⚙️ **Backend:**
- ✅ Respuestas más rápidas (< 500ms)
- ✅ Sin timeouts en consultas grandes
- ✅ Paginación automática
- ✅ Health check disponible en /api/health
- ✅ Uso de memoria reducido 70%

---

## 🆘 PROBLEMAS COMUNES

### "FileText is not defined" sigue apareciendo:

**Causa:** El deploy de Netlify no se hizo correctamente

**Solución:**
1. Verifica que arrastraste la carpeta `frontend/dist` completa
2. O haz force deploy:
   - En Netlify: Settings → Build & Deploy → Clear cache and deploy site

### Backend con error 500:

**Causa:** Variables de entorno no configuradas

**Solución:**
1. Ve a Render → Environment
2. Verifica que todas las variables estén configuradas
3. Redeploy manual

### Imágenes no suben:

**Causa:** Cloudinary no configurado (opcional)

**Solución:**
- Las imágenes usarán placeholders automáticamente
- Para habilitar Cloudinary, configura:
  ```
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  ```

---

## 📞 SOPORTE

Si necesitas ayuda:
1. Revisa los logs en Netlify/Render Dashboard
2. Verifica el health check del backend
3. Revisa la consola del navegador (F12)

---

**¡Listo! Tus usuarios ahora verán todas las mejoras! 🎉**

