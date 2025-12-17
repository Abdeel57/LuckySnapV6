# ✅ COMPLETAR ACTUALIZACIÓN DEL SISTEMA

## ✅ YA COMPLETADO
1. ✅ Base de datos conectada en pgAdmin
2. ✅ Columnas agregadas:
   - `boletosConOportunidades` (BOOLEAN)
   - `numeroOportunidades` (INTEGER)

## 🔴 PENDIENTE: Actualizar Backend en Render

### PASO 1: Obtener Connection String de Railway
1. Ve a [Railway](https://railway.app)
2. Selecciona tu proyecto
3. Click en tu base de datos PostgreSQL
4. Ve a pestaña **"Connect"** o **"Data"**
5. Copia el **connection string** completo

Formato debería ser algo así:
```
postgresql://postgres:XXXXX@XXXXX.rlwy.net:XXXXX/railway
```

### PASO 2: Actualizar en Render
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio: **"lucky-snap-backend-complete"**
3. Ve a **"Environment"** (menú lateral)
4. Busca la variable **"DATABASE_URL"**
5. Click en el **ícono de lápiz** ✏️ para editar
6. **Pega tu nuevo connection string** de Railway
7. Click en **"Save Changes"**

### PASO 3: Esperar y Verificar
1. Render se reiniciará automáticamente (2-3 minutos)
2. Prueba este endpoint:
   ```
   https://lucky-snap-backend-complete.onrender.com/api/health
   ```
3. Deberías ver: `{"status": "OK", ...}`

---

## 🎉 DESPUÉS DE ESTO

Todo estará funcionando correctamente:
- ✅ Crear sorteos con opción de múltiples oportunidades
- ✅ Editar sorteos con validaciones
- ✅ Descargar boletos (CSV/Excel)
- ✅ Verificador de boletos (QR y manual)
- ✅ Sistemas de oportunidades

---

## 📝 NOTA
Si no actualizas el DATABASE_URL en Render, tu backend seguirá intentando conectarse a la base de datos antigua y no funcionará.
