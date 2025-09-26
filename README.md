<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lucky Snap - Sistema de Rifas

Aplicación fullstack para gestión de rifas con React + NestJS + PostgreSQL.

## 🚀 Setup Local

**Prerequisites:** Node.js 22.19.0+

### 1. Configurar Variables de Entorno

```bash
# Frontend
cp env.example .env

# Backend  
cp backend/env.example backend/.env
```

Edita los archivos `.env` con tus valores:
- `DATABASE_URL`: URL de tu base de datos PostgreSQL
- `VITE_API_URL`: URL del backend (http://localhost:3000/api para desarrollo)

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
npm run migrate:status

# Aplicar migraciones (si hay migraciones pendientes)
npm run migrate:deploy
```

### 4. Ejecutar en Desarrollo

```bash
# Ejecutar frontend y backend simultáneamente
npm run dev

# O ejecutar por separado:
npm run dev:frontend  # Frontend en http://localhost:5173
npm run dev:backend   # Backend en http://localhost:3000
```

### 5. Verificar Funcionamiento

```bash
# Health check del backend
curl http://localhost:3000/api/health

# Abrir frontend
open http://localhost:5173
```

## 🏗️ Build para Producción

```bash
# Build completo (frontend + backend)
npm run build

# Solo frontend
npm run build:frontend

# Solo backend  
npm run build:backend
```

## 📋 Comandos Disponibles

- `npm run dev` - Desarrollo completo (FE + BE)
- `npm run build` - Build completo
- `npm run migrate:deploy` - Aplicar migraciones
- `npm run typecheck` - Verificar tipos TypeScript

## 🌐 Despliegue en Render

El proyecto incluye `render.yaml` para despliegue automático en Render:

1. Conecta tu repositorio a Render
2. Render detectará automáticamente el blueprint
3. Configura las variables de entorno en Render
4. El despliegue se realizará automáticamente

## 🔧 Estructura del Proyecto

```
├── frontend/          # React + Vite
├── backend/           # NestJS + Prisma
├── render.yaml        # Configuración de despliegue
└── env.example        # Variables de entorno ejemplo
```
