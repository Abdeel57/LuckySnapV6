const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build simplificado...');

try {
  // 1. Instalar dependencias
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });

  // 2. Generar Prisma
  console.log('🗄️ Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 3. Crear directorio dist
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 4. Compilar con tsc directamente
  console.log('🔨 Compilando TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  console.log('✅ Build completado exitosamente!');
} catch (error) {
  console.error('❌ Error en el build:', error.message);
  process.exit(1);
}
