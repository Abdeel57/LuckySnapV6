// Archivo temporal para que Render funcione
console.log('🚀 Iniciando Lucky Snap Backend...');
console.log('📡 Redirigiendo a NestJS...');

// Verificar que dist/main.js existe
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'main.js');

if (fs.existsSync(distPath)) {
  console.log('✅ Archivo dist/main.js encontrado');
  console.log('🚀 Ejecutando NestJS...');
  require('./dist/main.js');
} else {
  console.log('❌ Archivo dist/main.js no encontrado');
  console.log('🔧 Intentando build...');
  
  // Intentar hacer build si no existe
  const { execSync } = require('child_process');
  try {
    console.log('📦 Ejecutando npm run build...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completado');
    console.log('🚀 Ejecutando NestJS...');
    require('./dist/main.js');
  } catch (error) {
    console.error('❌ Error en build:', error.message);
    process.exit(1);
  }
}
