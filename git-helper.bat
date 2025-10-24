@echo off
echo Git Helper Script
echo.
if "%1"=="status" git status
if "%1"=="add" git add .
if "%1"=="push" git push
if "%1"=="pull" git pull
if "%1"=="log" git log --oneline -10
if "%1"=="quick" (
    set /p msg="Mensaje de commit: "
    git add .
    git commit -m "%msg%"
    git push
)
if "%1"=="" (
    echo Comandos disponibles:
    echo   status - Ver estado
    echo   add    - Agregar cambios
    echo   push   - Subir cambios
    echo   pull   - Descargar cambios
    echo   log    - Ver historial
    echo   quick  - Flujo rapido
)
