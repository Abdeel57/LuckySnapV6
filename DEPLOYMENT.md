# 🚀 Guía de Despliegue - Lucky Snap

## 📋 Requisitos Previos

- ✅ Cuenta en [Render.com](https://render.com)
- ✅ Cuenta en [Railway.app](https://railway.app) (Base de datos)
- ✅ Repositorio en GitHub con el código

## 🗄️ Base de Datos (Railway)

### Variables de Entorno Necesarias:
```
DATABASE_URL=postgresql://postgres:password@host:port/database
```

## 🔧 Backend (Render - Web Service)

### Configuración:
- **Name**: `lucksnap-backend`
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Node Version**: `18` o `20`

### Variables de Entorno:
```
DATABASE_URL=postgresql://postgres:soOPSwrlxnEjSmXKXzsFZJNrgfLQqzyC@centerbeam.proxy.rlwy.net:27393/railway
NODE_ENV=production
PORT=10000
```

## 🌐 Frontend (Render - Static Site)

### Configuración:
- **Name**: `lucksnap-frontend`
- **Root Directory**: `/` (raíz)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Variables de Entorno:
```
VITE_API_URL=https://lucksnap-backend.onrender.com/api
```

## 🔄 Proceso de Despliegue

1. **Crear cuenta en Render**
2. **Conectar repositorio de GitHub**
3. **Desplegar Backend primero**
4. **Obtener URL del Backend**
5. **Configurar Frontend con URL del Backend**
6. **Desplegar Frontend**

## 🧪 Pruebas Post-Despliegue

- ✅ Backend responde en `/api`
- ✅ Frontend carga correctamente
- ✅ Conexión a base de datos funciona
- ✅ CORS configurado correctamente

## 🆘 Solución de Problemas

### Backend no inicia:
- Verificar variables de entorno
- Revisar logs en Render
- Confirmar que la base de datos esté accesible

### Frontend no conecta con Backend:
- Verificar `VITE_API_URL`
- Confirmar que el Backend esté desplegado
- Revisar configuración de CORS

### Base de datos no conecta:
- Verificar `DATABASE_URL`
- Confirmar que Railway esté activo
- Revisar credenciales
