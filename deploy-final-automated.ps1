# ═══════════════════════════════════════════════════════════
# DEPLOY FINAL AUTOMATIZADO - LUCKSNAP V6
# ═══════════════════════════════════════════════════════════

Write-Host "🚀 INICIANDO DEPLOY FINAL AUTOMATIZADO..." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

# Función para imprimir mensajes con color
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "frontend\package.json")) {
    Write-Error "No se encontró frontend\package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
}

Write-Status "PASO 1: Verificando dependencias del frontend..."

# Cambiar al directorio frontend
Set-Location frontend

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Warning "node_modules no encontrado. Instalando dependencias..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error instalando dependencias"
        exit 1
    }
}

Write-Success "Dependencias verificadas"

Write-Status "PASO 2: Iniciando build del frontend..."

# Ejecutar build
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Success "Build completado exitosamente"
} else {
    Write-Error "Error en el build del frontend"
    exit 1
}

# Verificar que la carpeta dist existe
if (-not (Test-Path "dist")) {
    Write-Error "Carpeta dist no encontrada después del build"
    exit 1
}

Write-Success "Frontend listo para deploy"

# Mostrar información del build
Write-Status "PASO 3: Información del build:"
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum
$distSizeMB = [math]::Round($distSize / 1MB, 2)
$fileCount = (Get-ChildItem -Path "dist" -Recurse -File).Count

Write-Host "  📁 Carpeta dist: $distSizeMB MB" -ForegroundColor Cyan
Write-Host "  📄 Archivos generados: $fileCount" -ForegroundColor Cyan

# Volver al directorio raíz
Set-Location ..

Write-Host ""
Write-Host "🎯 DEPLOYMENT COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUCCIONES FINALES DE DEPLOY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🌐 DEPLOY FRONTEND (Netlify):" -ForegroundColor Cyan
Write-Host "   ✅ Carpeta lista: frontend\dist" -ForegroundColor Green
Write-Host "   📋 Ve a: https://app.netlify.com/" -ForegroundColor White
Write-Host "   📋 Arrastra la carpeta 'frontend\dist' al área de deploy" -ForegroundColor White
Write-Host ""
Write-Host "2. 🔧 DEPLOY BACKEND (Render):" -ForegroundColor Cyan
Write-Host "   📋 Ve a: https://dashboard.render.com/" -ForegroundColor White
Write-Host "   📋 Selecciona tu servicio backend" -ForegroundColor White
Write-Host "   📋 Haz clic en 'Manual Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "3. ✅ VERIFICAR DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "   🎨 Prueba la personalización de colores" -ForegroundColor White
Write-Host "   ⚙️  Prueba el panel de administración" -ForegroundColor White
Write-Host "   📱 Prueba en diferentes dispositivos" -ForegroundColor White
Write-Host ""
Write-Host "🎉 ¡SISTEMA DE PERSONALIZACIÓN INTELIGENTE LISTO!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
