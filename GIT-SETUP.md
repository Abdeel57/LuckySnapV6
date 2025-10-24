# 🚀 Lucky Snap V6 - Git Configuration

## ✅ Problemas de Git Solucionados

### 🔧 Configuración Aplicada:
- **Line endings**: Configurados automáticamente con `.gitattributes`
- **Autocrlf**: Habilitado para Windows
- **Safecrlf**: Deshabilitado para evitar conflictos
- **Pull strategy**: Configurado para evitar rebase automático

### 📋 Script Helper Creado:
- **Archivo**: `git-helper.ps1`
- **Propósito**: Evitar que Git se cuelgue
- **Funciones**: Comandos Git comunes con timeout

## 🛠️ Cómo Usar el Script Helper:

### Comandos Disponibles:
```powershell
# Ver estado del repositorio
.\git-helper.ps1 status

# Agregar todos los cambios
.\git-helper.ps1 add

# Hacer commit con mensaje
.\git-helper.ps1 commit

# Subir cambios
.\git-helper.ps1 push

# Descargar cambios
.\git-helper.ps1 pull

# Ver historial
.\git-helper.ps1 log

# Flujo rápido (add + commit + push)
.\git-helper.ps1 quick
```

### Ejemplo de Uso:
```powershell
# Flujo completo en un comando
.\git-helper.ps1 quick
# Te pedirá el mensaje de commit y ejecutará todo automáticamente
```

## 🔍 Solución de Problemas:

### Si Git se cuelga:
1. **Usa el script helper**: `.\git-helper.ps1 [comando]`
2. **Verifica configuración**: `git config --list`
3. **Reinicia terminal**: Cierra y abre nueva ventana

### Si hay problemas de line endings:
1. **El archivo `.gitattributes` los maneja automáticamente**
2. **Los archivos se normalizan al hacer commit**
3. **No necesitas hacer nada manual**

### Si hay conflictos:
1. **Usa**: `git status` para ver el estado
2. **Resuelve manualmente** los archivos en conflicto
3. **Usa**: `git add .` y `git commit` para finalizar

## 📝 Comandos Git Básicos (Sin Script):

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "mensaje descriptivo"

# Subir cambios
git push

# Descargar cambios
git pull

# Ver historial
git log --oneline -10
```

## ⚠️ Notas Importantes:

- **Siempre usa mensajes descriptivos** en commits
- **Verifica el estado** antes de hacer push
- **Si algo se cuelga**, usa Ctrl+C y reinicia
- **El script helper es más seguro** que comandos directos

## 🎯 Estado Actual:

✅ **Configuración aplicada**
✅ **Script helper creado**
✅ **Archivo .gitattributes configurado**
✅ **Todos los cambios pusheados**
✅ **Repositorio sincronizado**

---

**💡 Tip**: Usa `.\git-helper.ps1` para evitar problemas de Git en el futuro.
