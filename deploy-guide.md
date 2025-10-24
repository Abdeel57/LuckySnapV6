# 🚀 Guía de Deploy para Render

## 📋 Pasos para Redeploy Manual en Render

### 1. Preparación Local
```bash
# Verificar que todo esté listo
node quick-check.js

# Preparar para deploy
npm run prepare-deploy
```

### 2. Configuración del Backend en Render

#### Build Command:
```bash
npm install && npx prisma generate
```

#### Start Command:
```bash
npm run start:optimized
```

#### Variables de Entorno:
- `NODE_VERSION`: 22.19.0
- `PORT`: 3000
- `NODE_ENV`: production
- `DATABASE_URL`: [Tu URL de PostgreSQL]
- `JWT_SECRET`: lucky_snap_jwt_secret_2024_production
- `CORS_ORIGINS`: https://jocular-brioche-6fbeda.netlify.app,https://lucky-snap-frontend.onrender.com

### 3. Pasos en Render Dashboard

1. **Ve a tu dashboard de Render**
2. **Selecciona el servicio backend** (lucky-snap-backend)
3. **Haz clic en "Manual Deploy"**
4. **Selecciona la rama main**
5. **Haz clic en "Deploy latest commit"**

### 4. Verificación Post-Deploy

#### URLs de Prueba:
- **Health Check**: `https://tu-backend.onrender.com/api/health`
- **Órdenes**: `https://tu-backend.onrender.com/api/admin/orders`
- **Rifas**: `https://tu-backend.onrender.com/api/admin/raffles`

#### Comandos de Verificación:
```bash
# Verificar health check
curl https://tu-backend.onrender.com/api/health

# Verificar órdenes
curl https://tu-backend.onrender.com/api/admin/orders
```

### 5. Actualizar Frontend (si es necesario)

Si también necesitas actualizar el frontend:

1. **Selecciona el servicio frontend**
2. **Haz clic en "Manual Deploy"**
3. **Selecciona la rama main**
4. **Haz clic en "Deploy latest commit"**

### 6. Configuración del Frontend

#### Build Command:
```bash
npm install && npm run build
```

#### Variables de Entorno:
- `VITE_API_URL`: https://tu-backend.onrender.com/api

## 🔧 Solución de Problemas

### Error de Prisma
Si ves errores de Prisma en Render:
- Verifica que `npx prisma generate` esté en el build command
- Asegúrate de que `DATABASE_URL` esté configurada

### Error de CORS
Si hay problemas de CORS:
- Verifica que `CORS_ORIGINS` incluya tu dominio frontend
- Asegúrate de que el frontend use la URL correcta del backend

### Error de Puerto
Si hay problemas de puerto:
- Render usa automáticamente la variable `PORT`
- No necesitas configurar puertos manualmente

## 📊 Monitoreo

### Logs en Render:
1. Ve a tu servicio backend
2. Haz clic en "Logs"
3. Revisa los logs en tiempo real

### Health Check:
```bash
curl https://tu-backend.onrender.com/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-10-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## ✅ Checklist Pre-Deploy

- [ ] Código committeado a main
- [ ] Variables de entorno configuradas
- [ ] Build command correcto
- [ ] Start command correcto
- [ ] Base de datos accesible
- [ ] CORS configurado correctamente

## 🎯 URLs Finales Esperadas

- **Backend**: https://lucky-snap-backend.onrender.com
- **Frontend**: https://lucky-snap-frontend.onrender.com
- **Admin Panel**: https://lucky-snap-frontend.onrender.com/#/admin







