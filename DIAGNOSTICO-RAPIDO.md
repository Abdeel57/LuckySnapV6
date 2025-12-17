# 🔍 DIAGNÓSTICO RÁPIDO - Lucky Snap

## ⚡ PASOS INMEDIATOS

### 1️⃣ ABRE LA CONSOLA DEL NAVEGADOR

1. Ve a tu sitio: `https://jocular-brioche-6fbeda.netlify.app`
2. Presiona **F12** (o click derecho → Inspeccionar)
3. Ve a la pestaña **"Console"**
4. Busca estos mensajes:

```
🔗 API URL being used: ???
🌍 Environment: ???
📋 VITE_API_URL from env: ???
```

---

## 📊 DIAGNÓSTICO SEGÚN LO QUE VES

### ❌ CASO 1: Dice `http://localhost:3000/api`

**Problema:** Variable de entorno NO configurada en Netlify

**Solución URGENTE:**

1. **Ve a Netlify:**
   ```
   https://app.netlify.com/
   → Tu sitio
   → Site settings
   → Environment variables
   ```

2. **Agrega variable:**
   ```
   Key:   VITE_API_URL
   Value: https://TU-BACKEND.onrender.com/api
   ```
   ⚠️ **REEMPLAZA `TU-BACKEND` con tu URL real de Render**

3. **Obtén tu URL de Render:**
   - Ve a https://dashboard.render.com/
   - Tu servicio backend
   - Copia la URL (ejemplo: `https://lucky-snap-abc123.onrender.com`)
   - Agrégale `/api` al final

4. **Redeploy:**
   - Netlify → Deploys
   - **"Trigger deploy"** → **"Clear cache and deploy site"**
   - Espera 2-3 minutos

---

### ❌ CASO 2: Dice la URL correcta pero hay errores

**Busca errores tipo:**
```
❌ Failed to fetch
❌ CORS policy
❌ Network Error
❌ 500 Internal Server Error
❌ 404 Not Found
```

**Soluciones por tipo:**

#### A) Error de CORS:
```
Access to fetch at '...' has been blocked by CORS policy
```

**Causa:** Backend no acepta requests de Netlify

**Solución:**
1. Ve a Render → Tu backend → Environment
2. Verifica que NO haya variable `CORS_ORIGINS`
   (El código ya acepta todos los dominios .netlify.app)
3. Si existe, **BÓRRALA**
4. Manual Deploy en Render

#### B) Error 404:
```
GET https://tu-backend.onrender.com/api/admin/raffles 404
```

**Causa:** Backend no está desplegado o ruta incorrecta

**Solución:**
1. Verifica health check:
   ```
   https://tu-backend.onrender.com/api/health
   ```
2. Si da 404, el backend necesita deploy
3. Ve a instrucciones de deploy backend abajo

#### C) Error 500:
```
GET https://tu-backend.onrender.com/api/admin/raffles 500
```

**Causa:** Error en el servidor backend

**Solución:**
1. Ve a Render → Tu backend → Logs
2. Busca errores en rojo
3. Probablemente:
   - DATABASE_URL mal configurada
   - Prisma no generado
   - Error en código

---

### ✅ CASO 3: Todo se ve bien pero no funciona

**Revisa en la pestaña "Network" (F12):**

1. Ve a pestaña **"Network"**
2. Filtra por **"Fetch/XHR"**
3. Intenta crear una rifa
4. Mira qué requests se hacen
5. Click en cada request y ve:
   - **Status:** ¿200, 404, 500?
   - **Response:** ¿Qué dice?
   - **Headers:** ¿Está el CORS?

---

## 🛠️ SOLUCIONES ESPECÍFICAS

### SOLUCIÓN 1: Backend "Dormido" (Render Free)

**Síntoma:** Primera request toma 30+ segundos

**Causa:** Render Free duerme después de 15min inactividad

**Solución:**
- Espera 30 segundos en la primera carga
- Después funcionará normal
- Considera upgrade a Render Paid ($7/mes) para evitar esto

---

### SOLUCIÓN 2: Backend No Desplegado

**Ve a Render y verifica:**

1. **Build Command debe ser:**
   ```
   npm install && npx prisma generate
   ```

2. **Start Command debe ser:**
   ```
   node fix-render-backend.js
   ```
   O si no existe ese archivo:
   ```
   node dist/main.js
   ```

3. **Environment Variables requeridas:**
   ```
   DATABASE_URL=postgresql://...
   NODE_ENV=production
   PORT=3000
   ```

4. **Manual Deploy:**
   - Click "Manual Deploy"
   - "Deploy latest commit"
   - Espera 5-10 minutos
   - Revisa logs por errores

---

### SOLUCIÓN 3: Base de Datos No Conecta

**Ve a Render Logs y busca:**
```
❌ Error connecting to database
❌ Prisma Client error
❌ P1001: Can't reach database
```

**Solución:**
1. Verifica DATABASE_URL en Render Environment
2. Debe ser formato: `postgresql://user:pass@host:port/db`
3. Verifica que Railway (o tu DB) esté activo
4. Prueba la conexión desde Render Logs

---

## 📋 CHECKLIST DE VERIFICACIÓN

Marca lo que YA funciona:

**Frontend:**
- [ ] Sitio carga (no da error 404)
- [ ] Console muestra URL correcta del backend
- [ ] No hay errores de CORS
- [ ] Requests se hacen a la URL correcta

**Backend:**
- [ ] Health check responde OK
- [ ] Logs no muestran errores
- [ ] DATABASE_URL configurada
- [ ] Start command correcto
- [ ] Deploy exitoso (verde)

**Funcionalidad:**
- [ ] Puedo hacer login en admin
- [ ] Veo rifas existentes
- [ ] Puedo crear nueva rifa
- [ ] Puedo ver apartados
- [ ] Puedo marcar como pagado

---

## 🎯 ACCIÓN INMEDIATA

**AHORA MISMO haz esto:**

1. **Abre tu sitio en el navegador**
2. **Presiona F12**
3. **Ve a Console**
4. **Toma screenshot de lo que dice**
5. **Comparte el screenshot**

Con eso sabré EXACTAMENTE cuál es el problema.

---

## 📞 INFORMACIÓN QUE NECESITO

Para ayudarte mejor, dime:

1. **¿Qué dice la consola?**
   - Específicamente el mensaje: `🔗 API URL being used:`

2. **¿Qué URL usa?**
   - localhost:3000 ❌
   - Tu URL de Render ✅

3. **¿Hay errores en rojo?**
   - Copia y pega los errores

4. **¿El backend está desplegado en Render?**
   - Ve a Render y dime si dice "Live" en verde

---

**¡Resolveremos esto en minutos! 🚀**

