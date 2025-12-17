#!/bin/bash

# Deploy Script Completo - Backend y Frontend
echo "🚀 DEPLOY COMPLETO - Lucky Snap V6"
echo "=================================="

# Verificar estructura del proyecto
echo "🔍 Verificando estructura del proyecto..."
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Estructura del proyecto incorrecta"
    exit 1
fi
echo "✅ Estructura del proyecto verificada"

# Compilar backend
echo ""
echo "🔧 COMPILANDO BACKEND..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al compilar el backend"
    exit 1
fi
echo "✅ Backend compilado exitosamente"
cd ..

# Compilar frontend
echo ""
echo "🔧 COMPILANDO FRONTEND..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al compilar el frontend"
    exit 1
fi
echo "✅ Frontend compilado exitosamente"
cd ..

# Hacer commit y push
echo ""
echo "📤 SUBIENDO CAMBIOS A GITHUB..."
git add .
git commit -m "feat: Deploy ready - Complete settings functionality with real-time updates"
git push

if [ $? -ne 0 ]; then
    echo "❌ Error al subir cambios a GitHub"
    exit 1
fi

echo "✅ Cambios subidos a GitHub exitosamente"

echo ""
echo "🎉 DEPLOY PREPARADO COMPLETAMENTE!"
echo "=================================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "🔧 BACKEND (Render):"
echo "1. Ve a https://dashboard.render.com"
echo "2. Selecciona tu servicio backend"
echo "3. Haz clic en 'Manual Deploy'"
echo "4. Selecciona la rama 'main'"
echo "5. Haz clic en 'Deploy latest commit'"
echo ""
echo "🌐 FRONTEND (Netlify):"
echo "1. Ve a https://app.netlify.com"
echo "2. Selecciona tu sitio"
echo "3. Ve a 'Deploys'"
echo "4. Haz clic en 'Trigger deploy'"
echo "5. Selecciona 'Deploy site'"
echo ""
echo "🔗 URLs:"
echo "Backend:  https://lucky-snap-backend-complete.onrender.com"
echo "Frontend: https://lucky-snap-v6.netlify.app"
echo ""
echo "🧪 FUNCIONALIDADES A PROBAR:"
echo "1. Configuración de apariencia (colores, logo, nombre)"
echo "2. Información de contacto (WhatsApp, email)"
echo "3. Redes sociales (Facebook, Instagram, Twitter)"
echo "4. Cuentas de pago"
echo "5. Preguntas frecuentes"
echo "6. Aplicación en tiempo real en página pública"
echo ""
echo "✅ ¡Deploy listo para producción!"
