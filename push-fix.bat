@echo off
echo ----------------------------------------
echo INICIANDO PROCESO DE SUBIDA (PUSH)
echo ----------------------------------------
echo.

echo 1. Agregando archivo admin.service.ts...
git add backend/src/admin/admin.service.ts
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al ejecutar git add. Verifique si git esta instalado.
    pause
    exit /b
)

echo 2. Creando commit...
git commit -m "fix(admin): permitir eliminar rifas con ordenes pagadas"
REM No fallamos aqui porque podria no haber cambios nuevos si ya se hizo commit

echo 3. Subiendo cambios a la nube (PUSH)...
git push
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] NO SE PUDO SUBIR LOS CAMBIOS.
    echo Verifique su conexion a internet.
    echo Si hay conflictos, podria necesitar un 'git pull' primero.
    pause
    exit /b
)

echo.
echo ----------------------------------------
echo [EXITO] PROCESO TERMINADO CORRECTAMENTE
echo ----------------------------------------
echo Los cambios han sido subidos a su pagina web.
echo.
pause
