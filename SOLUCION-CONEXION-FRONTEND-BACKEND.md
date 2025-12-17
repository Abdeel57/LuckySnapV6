# 🔧 SOLUCIÓN: Conectar Frontend con Backend

## ❌ PROBLEMA IDENTIFICADO

El frontend en Netlify no puede comunicarse con el backend en Render porque:

1. ❌ Falta la variable `VITE_API_URL` en Netlify
2. ❌ El frontend está intentando conectarse a `localhost:3000`
3. ❌ CORS podría no estar configurado correctamente

---

## ✅ SOLUCIÓN COMPLETA

### **PASO 1: Obtener URL del Backend**

1. Ve a: https://dashboard.render.com/
2. Selecciona tu servicio backend
3. Copia la URL que aparece arriba (algo como):
   ```
   https://lucky-snap-backend-xxxx.onrender.com
   ```

---

### **PASO 2: Configurar Variable en Netlify**

1. Ve a: https://app.netlify.com/
2. Selecciona tu sitio: `jocular-brioche-6fbeda`
3. Ve a **Site settings** → **Environment variables**
4. Click en **"Add a variable"** o **"New variable"**
5. Agrega:
   ```
   Key:   VITE_API_URL
   Value: https://tu-backend.onrender.com/api
   ```
   ⚠️ **IMPORTANTE:** Agrega `/api` al final de la URL

6. Click **"Save"**

---

### **PASO 3: Redeploy Frontend**

Después de agregar la variable:

1. En Netlify → Deploys
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Espera 2-3 minutos

---

### **PASO 4: Configurar CORS en Backend**

El backend debe permitir requests desde tu frontend:

**Variables en Render:**
1. Ve a: https://dashboard.render.com/
2. Tu servicio backend → **Environment**
3. Verifica/Agrega:
   ```
   CORS_ORIGINS=https://jocular-brioche-6fbeda.netlify.app
   ```
   ⚠️ Sin "/" al final

4. **Manual Deploy** si cambiaste algo

---

### **PASO 5: Verificar Backend Funciona**

Antes de continuar, verifica que tu backend responda:

```bash
# Reemplaza con tu URL real
curl https://tu-backend.onrender.com/api/health
```

**Debería responder:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123
}
```

Si NO responde o da error 404:
- El backend no está desplegado correctamente
- Necesitamos arreglar el backend primero

---

## 🔍 VERIFICACIÓN

Después de configurar todo:

### 1. Verificar en el Navegador

1. Ve a tu sitio: `https://jocular-brioche-6fbeda.netlify.app`
2. Abre la consola del navegador (F12)
3. Ve a la pestaña **Console**
4. Busca el mensaje: `🔗 API URL being used:`
5. **Debe decir**: `https://tu-backend.onrender.com/api`
6. **NO debe decir**: `http://localhost:3000/api`

### 2. Probar Funcionalidad

1. Ve al panel admin: `/#/admin`
2. Login con tus credenciales
3. Intenta crear una rifa
4. Verifica que aparezcan las rifas existentes

---

## 🆘 SI SIGUE SIN FUNCIONAR

### Error de CORS

Si ves en la consola:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solución:**
1. Verifica `CORS_ORIGINS` en Render
2. Debe incluir tu dominio de Netlify SIN "/" al final
3. Redeploy backend

### Error 404 en API

Si las llamadas dan 404:

**Verifica que el backend esté corriendo:**
```bash
curl https://tu-backend.onrender.com/api/health
```

Si da 404, el backend necesita ser desplegado correctamente.

### Backend "Sleeping"

Render Free duerme después de 15min de inactividad.

**Solución:**
- El primer request despertará el servidor (~30 segundos)
- Intenta de nuevo después de esperar

---

## 📋 CHECKLIST COMPLETO

Marca cada paso:

- [ ] Obtuve URL del backend de Render
- [ ] Agregué `VITE_API_URL` en Netlify
- [ ] Hice redeploy del frontend (Clear cache)
- [ ] Configuré `CORS_ORIGINS` en backend
- [ ] Verifiqué health check del backend
- [ ] Limpié cache del navegador (Ctrl+Shift+R)
- [ ] La consola muestra la URL correcta del API
- [ ] Puedo hacer login en el admin
- [ ] Las funciones admin funcionan

---

## 🎯 RESULTADO ESPERADO

Después de estos pasos:

✅ Panel admin carga correctamente
✅ Puedes crear rifas
✅ Puedes ver apartados
✅ Puedes marcar como pagado
✅ La configuración funciona
✅ Upload de imágenes funciona

---

## 📞 INFORMACIÓN NECESARIA

Para ayudarte mejor, necesito:

1. **URL de tu backend en Render:**
   ```
   https://__________.onrender.com
   ```

2. **URL de tu frontend en Netlify:**
   ```
   https://jocular-brioche-6fbeda.netlify.app
   ```

3. **¿El backend responde al health check?**
   ```bash
   curl https://tu-backend.onrender.com/api/health
   ```

---

**¡Con esta configuración todo funcionará! 🚀**

