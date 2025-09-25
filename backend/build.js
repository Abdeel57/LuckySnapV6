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
  
  // Usar el compilador de TypeScript directamente
  const ts = require('typescript');
  const tsconfig = require('./tsconfig.json');
  
  console.log('📍 Compilando con TypeScript API...');
  
  const program = ts.createProgram(['src/**/*.ts'], tsconfig.compilerOptions);
  const emitResult = program.emit();
  
  if (emitResult.emitSkipped) {
    throw new Error('TypeScript compilation failed');
  }
  
  console.log('✅ TypeScript compilado exitosamente');

  console.log('✅ Build completado exitosamente!');
} catch (error) {
  console.error('❌ Error en el build:', error.message);
  process.exit(1);
}
