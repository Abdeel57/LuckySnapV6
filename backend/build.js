// Script de build para Render
console.log('🔧 Iniciando build de Lucky Snap Backend...');

const { execSync } = require('child_process');

try {
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🏗️ Generando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🏗️ Compilando NestJS...');
  execSync('nest build', { stdio: 'inherit' });
  
  console.log('✅ Build completado exitosamente!');
} catch (error) {
  console.error('❌ Error en build:', error.message);
  process.exit(1);
}
