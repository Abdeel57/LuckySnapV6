# 🔄 ACTUALIZAR DATABASE_URL EN RENDER

## 📋 PASO A PASO

### 1. Obtener Nueva Connection String de Railway
- Ve a Railway
- Selecciona tu base de datos
- Ve a pestaña "Connect" o "Data"
- Copia el connection string completo

### 2. Actualizar en Render
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio: **"lucky-snap-backend-complete"**
3. Ve a **"Environment"** en el menú lateral
4. Busca la variable **"DATABASE_URL"**
5. Click en el ícono de lápiz para editar
6. Pega tu **NUEVA** connection string de Railway
7. Click en **"Save Changes"**

### 3. Render Reiniciará Automáticamente
- Espera 2-3 minutos
- El backend se reiniciará con la nueva conexión

### 4. Verificar que Funciona
```
https://lucky-snap-backend-complete.onrender.com/api/health
```

Deberías ver: `{"status": "OK", ...}`

---

## ⚠️ IMPORTANTE

- El formato del connection string debe ser:
  ```
  postgresql://postgres:PASSWORD@HOST:PORT/database
  ```
  
- NO incluyas comillas al copiarlo en Render

- Si tienes problemas, verifica que la base de datos en Railway esté "Active"
