# 🚀 Guía de Visual Studio Code para Lucky Snap V6

## 📦 Instalación y Configuración Inicial

### 1. Instalar VS Code
Ve a https://code.visualstudio.com/download y descarga la versión para Windows.

### 2. Abrir el Proyecto
1. Abre VS Code
2. `File → Open Folder`
3. Selecciona: `C:\Users\Admin\Desktop\LuckySnapV6-main`
4. VS Code detectará automáticamente las configuraciones del proyecto

### 3. Instalar Extensiones Recomendadas
VS Code te mostrará una notificación para instalar las extensiones recomendadas. Acepta para tener:
- ✅ TypeScript y JavaScript
- ✅ Prettier (formateo automático)
- ✅ Tailwind CSS IntelliSense
- ✅ ESLint
- ✅ Git Graph
- ✅ Error Lens

## 🛠️ Uso Diario

### **Terminal Integrada**
- `Ctrl + ñ` → Abre terminal integrada
- Ya está configurada con PowerShell
- Ejecuta comandos npm, git, etc.

### **Comandos Útiles**
```bash
# Desde terminal integrada:
npm start              # Inicia desarrollo completo
npm run dev:frontend   # Solo frontend
npm run dev:backend    # Solo backend
npm run build          # Construir para producción
```

### **Git desde VS Code**
- `Ctrl + Shift + G` → Panel de Git
- Ve cambios, haz commits, push, pull
- Click derecho en archivos para ver diferencias

### **Buscar en el Proyecto**
- `Ctrl + Shift + F` → Búsqueda global
- Busca funciones, variables, texto en todo el proyecto
- Incluye/excluye carpetas con patrones

## 🎯 Desarrollo con VS Code

### **Navegación por Archivos**
- `Ctrl + P` → Buscar archivos rápidamente
- `Ctrl + Shift + E` → Explorador de archivos
- `Ctrl + Shift + O` → Buscar símbolos (funciones, clases)

### **Edición Avanzada**
- `Alt + Click` → Múltiples cursores
- `Ctrl + D` → Seleccionar siguiente ocurrencia
- `Ctrl + Shift + L` → Seleccionar todas las ocurrencias
- `Ctrl + Shift + P` → Command Palette (todos los comandos)

### **IntelliSense y Autocompletado**
- TypeScript: Autocompletado inteligente
- Tailwind CSS: Sugerencias de clases
- Emmet: Expansión rápida de HTML

## 🚀 Ejecutar y Depurar

### **Tareas Configuradas**
En VS Code, `Terminal → Run Task` encontrarás:
- `npm: start` - Desarrollo completo
- `npm: dev:frontend` - Solo frontend
- `npm: dev:backend` - Solo backend
- `npm: build` - Construir producción
- `Git Status` - Estado de Git
- `Git Add All` - Agregar todos los cambios

### **Debugging**
- `F5` o ve a `Run → Start Debugging`
- Configuraciones disponibles:
  - Launch Frontend (Vite)
  - Launch Backend (NestJS)
  - Debug Current TS File

## 📁 Estructura del Proyecto

```
LuckySnapV6-main/
├── .vscode/           # Configuraciones de VS Code
├── backend/           # API NestJS
├── frontend/          # App React + Vite
├── scripts/           # Scripts de utilidad
├── package.json       # Scripts del proyecto
└── README.md          # Documentación principal
```

## 🔧 Configuraciones Personalizadas

### **Formateo Automático**
- Los archivos se formatean automáticamente al guardar
- Usa Prettier como formateador por defecto
- ESLint corrige errores automáticamente

### **Tema Recomendado**
- `File → Preferences → Color Theme`
- Recomendado: Dark Modern o GitHub Dark

### **Configuración de Terminal**
- Ya configurado para usar PowerShell
- `Terminal → New Terminal` para nuevas terminales

## 🐛 Solución de Problemas

### **VS Code no reconoce TypeScript**
1. Asegúrate de que las extensiones estén instaladas
2. `Ctrl + Shift + P` → "TypeScript: Reload Projects"
3. Reinicia VS Code

### **Terminal no funciona**
1. `Ctrl + Shift + P` → "Terminal: Select Default Profile"
2. Elige "PowerShell"
3. Reinicia la terminal

### **Git no funciona en VS Code**
1. Asegúrate de que Git esté instalado
2. `Ctrl + Shift + P` → "Git: Initialize Repository"
3. O abre la carpeta correcta

## 🎨 Atajos de Teclado Importantes

| Atajo | Función |
|-------|---------|
| `Ctrl + ñ` | Abrir terminal |
| `Ctrl + Shift + P` | Command Palette |
| `Ctrl + Shift + F` | Buscar en proyecto |
| `Ctrl + P` | Buscar archivos |
| `Ctrl + Shift + O` | Buscar símbolos |
| `Ctrl + Shift + G` | Panel de Git |
| `F5` | Iniciar debugging |
| `Ctrl + S` | Guardar (formatea automáticamente) |

## 📞 Soporte

Si tienes problemas con VS Code:
1. Verifica que todas las extensiones estén instaladas
2. Reinicia VS Code
3. Consulta la documentación: https://code.visualstudio.com/docs
4. Revisa los logs en `Help → Toggle Developer Tools`

---

**¡Listo! Ahora puedes desarrollar Lucky Snap V6 cómodamente en VS Code.**
