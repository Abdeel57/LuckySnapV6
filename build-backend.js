#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando build del backend...');

try {
  // Cambiar al directorio backend
  process.chdir(path.join(__dirname, 'backend'));
  
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔨 Compilando TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build del backend completado exitosamente');
} catch (error) {
  console.error('❌ Error en el build:', error.message);
  process.exit(1);
}
