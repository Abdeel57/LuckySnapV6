@echo off
echo ----------------------------------------
echo INSTALADOR AUTOMATICO DE GIT
echo ----------------------------------------
echo.
echo Este script instalara Git en tu computadora para poder subir los cambios a la web.
echo.
echo 1. Buscando Git en los repositorios de Microsoft...
winget search "Git.Git" > nul
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo acceder a Winget. Asegurate de tener internet.
    pause
    exit /b
)

echo.
echo 2. Iniciando descarga e instalacion (esto puede tardar unos minutos)...
echo Por favor acepta cualquier ventana que pida permisos.
echo.
winget install --id Git.Git -e --source winget

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema con la instalacion.
    echo Intenta ejecutar este archivo como Administrador.
    pause
    exit /b
)

echo.
echo ----------------------------------------
echo [EXITO] GIT INSTALADO CORRECTAMENTE
echo ----------------------------------------
echo IMPORTANTE:
echo Para usar Git, debes CERRAR esta ventana y cualquier otra terminal que tengas abierta.
echo Luego, podras ejecutar el archivo 'push-fix.bat'.
echo.
pause
