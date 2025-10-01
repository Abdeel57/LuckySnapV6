// Script para iniciar el backend NestJS compilado
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Lucky Snap Backend con NestJS...');

// Ejecutar la aplicación NestJS compilada
const nestApp = spawn('node', ['dist/main.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000
  }
});

nestApp.on('error', (error) => {
  console.error('❌ Error iniciando la aplicación NestJS:', error);
  process.exit(1);
});

nestApp.on('exit', (code) => {
  console.log(`📱 Aplicación NestJS terminada con código: ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, terminando aplicación...');
  nestApp.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, terminando aplicación...');
  nestApp.kill('SIGTERM');
});
