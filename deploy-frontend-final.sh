#!/bin/bash

# ═══════════════════════════════════════════════════════════
# DEPLOY SCRIPT - LUCKSNAP V6 - SISTEMA DE PERSONALIZACIÓN
# ═══════════════════════════════════════════════════════════

echo "🚀 STARTING LUCKSNAP V6 DEPLOYMENT..."
echo "═══════════════════════════════════════════════════════════"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio frontend."
    exit 1
fi

print_status "Verificando dependencias..."

# Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
    print_warning "node_modules no encontrado. Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Error instalando dependencias"
        exit 1
    fi
fi

print_success "Dependencias verificadas"

print_status "Iniciando build del frontend..."

# Ejecutar build
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completado exitosamente"
else
    print_error "Error en el build del frontend"
    exit 1
fi

# Verificar que la carpeta dist existe
if [ ! -d "dist" ]; then
    print_error "Carpeta dist no encontrada después del build"
    exit 1
fi

print_success "Frontend listo para deploy"

# Mostrar información del build
print_status "Información del build:"
echo "  📁 Carpeta dist: $(du -sh dist | cut -f1)"
echo "  📄 Archivos generados: $(find dist -type f | wc -l)"

echo ""
echo "🎯 DEPLOYMENT READY!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASOS MANUALES:"
echo ""
echo "1. 🌐 DEPLOY FRONTEND (Netlify):"
echo "   - Ve a https://app.netlify.com/"
echo "   - Arrastra la carpeta 'frontend/dist' al área de deploy"
echo "   - O usa: netlify deploy --prod --dir=frontend/dist"
echo ""
echo "2. 🔧 DEPLOY BACKEND (Render):"
echo "   - Ve a https://dashboard.render.com/"
echo "   - Selecciona tu servicio backend"
echo "   - Haz clic en 'Manual Deploy'"
echo ""
echo "3. ✅ VERIFICAR DEPLOYMENT:"
echo "   - Prueba la página pública"
echo "   - Prueba el panel de administración"
echo "   - Prueba la personalización de colores"
echo ""
echo "🎉 ¡Sistema de personalización inteligente listo para producción!"
echo "═══════════════════════════════════════════════════════════"
