#!/bin/bash

# Database Migration Script for Render
echo "🔧 Ejecutando migración de base de datos..."

# Verificar que estamos en el directorio backend
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta desde el directorio backend"
    exit 1
fi

echo "✅ Directorio backend verificado"

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Error al generar cliente de Prisma"
    exit 1
fi
echo "✅ Cliente de Prisma generado"

# Ejecutar migración
echo "🔧 Ejecutando migración de base de datos..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Error al ejecutar migración"
    exit 1
fi
echo "✅ Migración ejecutada exitosamente"

# Verificar la migración
echo "🔍 Verificando migración..."
npx prisma db seed
if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Error en seed, pero la migración puede estar bien"
fi

echo ""
echo "🎉 Migración completada!"
echo "📋 Próximos pasos:"
echo "1. Reinicia el servicio en Render"
echo "2. Verifica que los endpoints funcionen"
echo "3. Prueba la configuración en el admin panel"
