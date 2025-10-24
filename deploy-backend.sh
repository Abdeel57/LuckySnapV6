#!/bin/bash

# Deploy Script para Render
echo "🚀 Iniciando deploy a Render..."

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: No se encontró backend/package.json"
    exit 1
fi

echo "✅ Estructura del proyecto verificada"

# Compilar backend
echo "🔧 Compilando backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al compilar el backend"
    exit 1
fi
echo "✅ Backend compilado exitosamente"

# Volver al directorio raíz
cd ..

# Hacer commit y push
echo "📤 Subiendo cambios a GitHub..."
git add .
git commit -m "feat: Deploy ready - Complete settings functionality"
git push

if [ $? -ne 0 ]; then
    echo "❌ Error al subir cambios a GitHub"
    exit 1
fi

echo "✅ Cambios subidos a GitHub exitosamente"

echo ""
echo "🎉 Deploy preparado para Render!"
echo "📋 Próximos pasos:"
echo "1. Ve a https://dashboard.render.com"
echo "2. Selecciona tu servicio backend"
echo "3. Haz clic en 'Manual Deploy'"
echo "4. Selecciona la rama 'main'"
echo "5. Haz clic en 'Deploy latest commit'"
echo ""
echo "🔗 URL del backend: https://lucky-snap-backend-complete.onrender.com"
echo "📊 Logs disponibles en el dashboard de Render"
