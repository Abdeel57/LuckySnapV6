# 🚀 GUÍA: Ejecutar App en Modo Desarrollo

## 📋 PREREQUISITOS

1. ✅ Node.js instalado (v18+)
2. ✅ PostgreSQL configurado (o usar Railway)
3. ✅ Variables de entorno configuradas

---

## 🔧 PASO 1: CONFIGURAR VARIABLES DE ENTORNO

### **Crear archivo `.env` en la raíz del proyecto:**

```bash
# Backend
DATABASE_URL=postgresql://usuario:password@host:puerto/database
PORT=3000
NODE_ENV=development

# Frontend (opcional, para desarrollo)
VITE_API_URL=http://localhost:3000/api
```

### **O usar las variables de Railway:**
- Copia tu `DATABASE_URL` de Railway
- Configura `PORT=3000` para desarrollo local

---

## 🖥️ PASO 2: EJECUTAR BACKEND EN MODO DESARROLLO

### **Terminal 1 - Backend:**

```bash
# Navegar a carpeta backend
cd backend

# Instalar dependencias (solo primera vez)
npm install

# Ejecutar en modo desarrollo
npm start
# O directamente:
node index.js
```

**Resultado esperado:**
```
🚀 Iniciando Lucky Snap Backend...
✅ DATABASE_URL configurada
📡 Iniciando servidor principal...
🎉 Servidor ejecutándose en puerto 3000
🌐 Disponible en: http://0.0.0.0:3000
🔗 Health check: http://0.0.0.0:3000/api/health
✅ Backend listo para recibir conexiones
```

**Verificar que funciona:**
- Abre: http://localhost:3000/api/health
- Deberías ver: `{"status":"OK", ...}`

---

## 🎨 PASO 3: EJECUTAR FRONTEND EN MODO DESARROLLO

### **Terminal 2 - Frontend:**

```bash
# Navegar a carpeta frontend
cd frontend

# Instalar dependencias (solo primera vez)
npm install

# Ejecutar en modo desarrollo
npm run dev
```

**Resultado esperado:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h to show help
```

**Verificar que funciona:**
- Abre: http://localhost:5173
- Deberías ver la página sin errores

---

## 🔍 PASO 4: VER ERRORES SIN MINIFICAR

### **En modo desarrollo:**
- ✅ Código sin minificar
- ✅ Errores completos con stack traces
- ✅ Líneas de código exactas
- ✅ Nombres de variables originales

### **Cómo ver errores:**
1. Abre **DevTools** (F12)
2. Ve a pestaña **Console**
3. Los errores mostrarán:
   - Archivo exacto
   - Línea exacta
   - Stack trace completo
   - Variables y valores

---

## 📊 CONFIGURACIÓN ACTUAL

### **Frontend (Vite):**
- Puerto: `5173`
- Proxy API: `/api` → `http://localhost:3000`
- Hot reload: ✅ Automático
- Source maps: ✅ Habilitado

### **Backend:**
- Puerto: `3000`
- CORS: ✅ Configurado para localhost:5173
- Logs: ✅ Completos en consola

---

## 🐛 DEBUGGING

### **Ver logs del backend:**
```bash
# En Terminal 1 (backend)
# Todos los console.log aparecerán aquí
```

### **Ver logs del frontend:**
```bash
# En Terminal 2 (frontend)
# O en DevTools → Console
```

### **React DevTools:**
1. Instala extensión: React Developer Tools
2. Abre DevTools → pestaña "Components"
3. Inspecciona componentes y props

---

## ⚠️ PROBLEMAS COMUNES

### **Error: Puerto 3000 ya en uso**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O cambia el puerto en .env:
PORT=3001
```

### **Error: Puerto 5173 ya en uso**
```bash
# Vite automáticamente usa el siguiente puerto disponible
# O especifica manualmente:
npm run dev -- --port 5174
```

### **Error: CORS**
- Verifica que backend tenga CORS habilitado
- Verifica que frontend use `http://localhost:3000/api`

### **Error: DATABASE_URL no encontrada**
- Crea archivo `.env` en carpeta `backend/`
- O configura variables de entorno del sistema

---

## ✅ VERIFICACIÓN FINAL

### **Backend funcionando:**
```bash
curl http://localhost:3000/api/health
# Debería retornar: {"status":"OK", ...}
```

### **Frontend funcionando:**
- Abre: http://localhost:5173
- No debería haber errores en consola
- La página debería cargar completamente

---

## 🎯 PRÓXIMOS PASOS

1. Ejecutar ambos servidores
2. Abrir http://localhost:5173
3. Ir a una rifa
4. Revisar errores en DevTools → Console
5. Compartir logs completos para debugging

