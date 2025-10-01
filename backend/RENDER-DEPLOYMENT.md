# 🚀 Despliegue en Render - Lucky Snap Backend

## Configuración Requerida

### Variables de Entorno en Render
- `NODE_ENV`: production
- `PORT`: 3000
- `DATABASE_URL`: URL de tu base de datos PostgreSQL

### Comandos de Build
- Build Command: `npm install && npx prisma generate`
- Start Command: `node fix-render-backend.js`

## Archivos Críticos
- `fix-render-backend.js`: Servidor optimizado para Render
- `migrate-render-database.js`: Migración de base de datos
- `diagnose-render-issues.js`: Diagnóstico de problemas
- `render.yaml`: Configuración de Render

## Solución de Problemas

### Error 500 en endpoints
1. Verificar logs en Render Dashboard
2. Ejecutar `node diagnose-render-issues.js`
3. Verificar conexión a base de datos

### Timeout en requests
1. Verificar que la base de datos esté activa
2. Revisar límites de memoria en Render
3. Optimizar consultas de base de datos

### Problemas de CORS
1. Verificar configuración de CORS en `fix-render-backend.js`
2. Asegurar que el frontend esté en la lista de orígenes permitidos

## Monitoreo
- Health Check: `/api/health`
- Logs: Render Dashboard > Logs
- Métricas: Render Dashboard > Metrics

## Contacto
Para soporte técnico, revisar los logs y ejecutar los scripts de diagnóstico.
