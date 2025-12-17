#!/bin/bash

# Deploy Script para Netlify
echo "🚀 Iniciando deploy del frontend a Netlify..."

# Verificar que estamos en el directorio correcto
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: No se encontró frontend/package.json"
    exit 1
fi

echo "✅ Estructura del proyecto verificada"

# Compilar frontend
echo "🔧 Compilando frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al compilar el frontend"
    exit 1
fi
echo "✅ Frontend compilado exitosamente"

# Verificar que se creó la carpeta dist
if [ ! -d "dist" ]; then
    echo "❌ Error: No se creó la carpeta dist"
    exit 1
fi

echo "✅ Carpeta dist creada correctamente"

# Volver al directorio raíz
cd ..

echo ""
echo "🎉 Frontend listo para deploy a Netlify!"
echo "📋 Próximos pasos:"
echo "1. Ve a https://app.netlify.com"
echo "2. Selecciona tu sitio"
echo "3. Ve a 'Deploys'"
echo "4. Haz clic en 'Trigger deploy'"
echo "5. Selecciona 'Deploy site'"
echo ""
echo "🔗 URL del frontend: https://lucky-snap-v6.netlify.app"
echo "📊 Logs disponibles en el dashboard de Netlify"
echo ""
echo "💡 Alternativa - Deploy manual:"
echo "1. Arrastra la carpeta 'frontend/dist' a Netlify"
echo "2. Los cambios se aplicarán automáticamente"
