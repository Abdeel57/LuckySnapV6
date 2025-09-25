const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build personalizado...');

try {
  // 1. Instalar dependencias
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });

  // 2. Instalar TypeScript específicamente
  console.log('🔧 Instalando TypeScript...');
  execSync('npm install typescript', { stdio: 'inherit' });

  // 3. Generar Prisma
  console.log('🗄️ Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 4. Crear directorio dist si no existe
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 5. Compilar TypeScript manualmente
  console.log('🔨 Compilando TypeScript...');
  execSync('./node_modules/.bin/tsc', { stdio: 'inherit' });

  console.log('✅ Build completado exitosamente!');
} catch (error) {
  console.error('❌ Error en el build:', error.message);
  process.exit(1);
}
