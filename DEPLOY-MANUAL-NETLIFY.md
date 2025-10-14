# 🚀 DEPLOY MANUAL A NETLIFY - Paso a Paso

## 📦 MÉTODO 1: Arrastrar y Soltar (MÁS RÁPIDO)

### Paso 1: Verifica el Build
```
✅ La carpeta frontend/dist ya está lista con todos los cambios
```

### Paso 2: Ve a Netlify
1. Abre: https://app.netlify.com/
2. Login con tu cuenta
3. Encuentra tu sitio: `jocular-brioche-6fbeda`

### Paso 3: Deploy Manual
1. Click en la pestaña **"Deploys"**
2. Busca la sección que dice **"Need to deploy manually?"**
3. Arrastra la carpeta completa: **`frontend/dist`** desde tu computadora
4. Suelta la carpeta en la zona de drop
5. ✅ Netlify empezará a subir los archivos

### Paso 4: Esperar
- Netlify procesará los archivos (30-60 segundos)
- Verás una barra de progreso
- Cuando termine dirá **"Published"**

### Paso 5: Verificar
1. Click en el link de tu sitio
2. Ve a `/#/admin/apartados`
3. ✅ Ya NO debe aparecer "FileText is not defined"

---

## ⚙️ MÉTODO 2: Trigger Manual Deploy desde Dashboard

Si el deploy automático está deshabilitado:

### Paso 1: Configurar Auto Deploy
1. En Netlify → Tu sitio
2. Ve a **Site settings**
3. Ve a **Build & deploy** → **Continuous deployment**
4. Verifica que **"Build settings"** esté activo
5. Verifica que la **branch** sea `main`

### Paso 2: Trigger Deploy
1. Ve a **Deploys**
2. Click en **"Trigger deploy"** (botón arriba a la derecha)
3. Selecciona **"Deploy site"**
4. Netlify detectará el último commit y hará build

### Paso 3: Esperar
- Build tomará 2-3 minutos
- Verás el progreso en tiempo real
- Al terminar dirá **"Published"**

---

## 🔧 MÉTODO 3: Netlify CLI (Para Desarrolladores)

Si tienes Netlify CLI instalado:

```bash
# Instalar (si no lo tienes)
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

---

## ✅ VERIFICACIÓN FINAL

Después del deploy, verifica:

1. **Ve a tu URL de Netlify**
2. **Abre el panel de admin**: `/#/admin`
3. **Login** con tus credenciales
4. **Ve a "Apartados"**
5. ✅ **Verifica que carga sin errores**

### Características que deberías ver:
- ✅ Apartados funcionando sin "FileText is not defined"
- ✅ Upload de imágenes con validación
- ✅ Mensajes de error claros
- ✅ Interfaz mejorada

---

## 🆘 SI HAY PROBLEMAS

### Error: "Deploy failed"

**Revisa el log de build:**
1. En Netlify → Deploys
2. Click en el deploy fallido
3. Mira el log completo
4. Busca líneas con "ERROR"

**Soluciones comunes:**
- Si dice "npm ERR!": problema con dependencias
- Si dice "vite build failed": problema de compilación
- Si dice "command not found": configuración incorrecta

### Error: "Sitio en blanco"

**Causa:** Configuración de build incorrecta

**Solución:**
1. Ve a Site settings → Build & deploy
2. Verifica:
   ```
   Build command: cd frontend && npm run build
   Publish directory: frontend/dist
   ```

### Sitio carga pero con errores

**Causa:** Variable de entorno del API no configurada

**Solución:**
1. Ve a Site settings → Environment variables
2. Agrega:
   ```
   VITE_API_URL=https://tu-backend.onrender.com/api
   ```
3. Redeploy

---

## 📞 NOTAS IMPORTANTES

- **Tiempo de build:** 2-3 minutos normalmente
- **Tiempo de propagación:** Inmediato después de publicado
- **Cache:** Si no ves cambios, limpia cache del navegador (Ctrl+Shift+R)

---

**¡Tu frontend estará listo en minutos! 🎉**

