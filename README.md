# 🎯 Lucky Snap - Sistema de Rifas Completo

Sistema completo de gestión de rifas con panel de administración, frontend moderno y backend robusto.

## 🚀 Inicio Rápido

### Opción 1: Inicio Automático (Recomendado)
```bash
npm start
```
Este comando iniciará automáticamente tanto el frontend como el backend.

### Opción 2: Inicio Manual
```bash
# Terminal 1 - Backend
cd backend
npm run start:optimized

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📱 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Panel Admin**: http://localhost:5173/#/admin
- **Health Check**: http://localhost:3000/api/health

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
npm start              # Inicia toda la aplicación
npm run dev            # Modo desarrollo completo
npm run dev:frontend   # Solo frontend
npm run dev:backend    # Solo backend
```

### Construcción
```bash
npm run build          # Construye frontend y backend
npm run build:frontend # Solo frontend
npm run build:backend  # Solo backend
```

### Base de Datos
```bash
npm run migrate:status # Estado de migraciones
npm run migrate:deploy # Aplicar migraciones
npm run migrate:dev    # Migración de desarrollo
npm run backup         # Respaldar datos
npm run test:db        # Probar conexión DB
```

### Utilidades
```bash
npm run setup          # Instalar dependencias y configurar DB
npm run clean          # Limpiar node_modules
npm run typecheck      # Verificar tipos TypeScript
```

## 🏗️ Arquitectura

### Frontend (React + Vite)
- **Framework**: React 19 + TypeScript
- **Routing**: React Router DOM
- **UI**: Lucide React Icons + Tailwind CSS
- **Animaciones**: Framer Motion
- **Formularios**: React Hook Form

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL + Prisma ORM
- **CORS**: Configurado para desarrollo y producción

### Base de Datos
- **Motor**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Migraciones**: Automáticas
- **Esquema**: Optimizado para rifas

## 📊 Funcionalidades

### Panel de Administración
- ✅ Gestión de Rifas
- ✅ Gestión de Órdenes/Apartados
- ✅ Gestión de Usuarios
- ✅ Gestión de Ganadores
- ✅ Estadísticas y Analytics
- ✅ Configuración del Sistema

### Frontend Público
- ✅ Visualización de Rifas Activas
- ✅ Compra de Boletos
- ✅ Historial de Órdenes
- ✅ Verificación de Boletos
- ✅ Información de Ganadores

## 🔧 Configuración

### Variables de Entorno
El archivo `backend/.env` contiene:
```env
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=development
JWT_SECRET=...
```

### Base de Datos
- **Host**: Railway PostgreSQL
- **Puerto**: 50670
- **Esquema**: Automáticamente creado por Prisma

## 🚨 Solución de Problemas

### Error de Prisma en Windows
Si encuentras errores EPERM con Prisma:
```bash
cd backend
npm run start:optimized
```

### Puerto en Uso
Si los puertos 3000 o 5173 están ocupados:
```bash
# Verificar procesos
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Terminar proceso (reemplazar PID)
taskkill /PID <PID> /F
```

### Problemas de Dependencias
```bash
npm run clean
npm run install:all
```

## 📈 Despliegue

### Desarrollo Local
```bash
npm start
```

### Producción
```bash
npm run build
npm run migrate:deploy
```

## 🤝 Soporte

Si encuentras problemas:
1. Verifica que Node.js 18+ esté instalado
2. Ejecuta `npm run setup` para configuración inicial
3. Revisa los logs en la consola
4. Verifica la conexión a la base de datos con `npm run test:db`

## 📝 Notas Importantes

- El backend usa el script optimizado `start-optimized.js` por defecto
- La base de datos está configurada para Railway PostgreSQL
- CORS está configurado para desarrollo y producción
- Todas las rutas de API están bajo `/api`
- El panel de administración está en `/#/admin`

---

**¡Disfruta usando Lucky Snap! 🎉**