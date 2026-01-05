# 🚂 DEPLOY MANUAL EN RAILWAY - Usando Redeploy

## ✅ Pasos Simples:

### 1️⃣ En Railway Dashboard:
1. Ve a: **https://railway.app/dashboard**
2. Selecciona tu proyecto → Servicio de backend

### 2️⃣ Haz Clic en "Redeploy":
- Verás un botón que dice **"Redeploy"** (o "Redeploy" en el menú)
- **Esto es exactamente lo que necesitas hacer**
- "Redeploy" = Deploy manual del último commit de GitHub

### 3️⃣ Confirma:
- Railway te pedirá confirmación
- Haz clic en **"Confirm"** o **"Redeploy"**

### 4️⃣ Monitorea en "Logs":
- Ve a la pestaña **"Logs"**
- Verás el progreso del deploy en tiempo real
- Tardará 2-5 minutos

### 5️⃣ Verifica:
- Cuando termine, debería decir **"Active"** o **"Running"**
- Prueba: Tu URL de Railway + `/api/health`

---

## 📝 ¿Qué hace "Redeploy"?

- ✅ Toma el último commit de GitHub (tu cambio de eliminar rifas)
- ✅ Reconstruye el backend
- ✅ Reinicia el servicio con el nuevo código

---

## 🔄 Diferencia entre "Restart" y "Redeploy":

- **Restart**: Solo reinicia el servicio SIN descargar nuevos cambios
- **Redeploy**: Descarga el último código de GitHub y hace deploy completo

**Para tu caso, necesitas "Redeploy" ✅**

