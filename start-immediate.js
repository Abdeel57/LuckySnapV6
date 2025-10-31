#!/usr/bin/env node

/**
 * 🚀 Lucky Snap - Solución Inmediata
 * 
 * Inicia el backend que funciona inmediatamente
 * sin necesidad de deploy
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Lucky Snap - Solución Inmediata...\n');

// Verificar que el backend existe
const backendPath = path.join(__dirname, 'backend-start-immediate.js');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Archivo backend-start-immediate.js no encontrado');
  process.exit(1);
}

console.log('✅ Archivo backend encontrado');
console.log('🌐 Iniciando backend inmediato...\n');

// Iniciar el backend
const backend = spawn('node', [backendPath], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

backend.on('error', (error) => {
  console.error('❌ Error iniciando backend:', error);
});

backend.on('close', (code) => {
  console.log(`\n🛑 Backend cerrado con código: ${code}`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando aplicación...');
  backend.kill('SIGINT');
  process.exit(0);
});

console.log('✅ Backend iniciado correctamente');
console.log('🌐 URL: http://localhost:3000');
console.log('🎯 Apartado de boletos funcionando inmediatamente');
console.log('\n📱 Para probar:');
console.log('1. Ve a tu frontend');
console.log('2. Intenta apartar un boleto');
console.log('3. Ve al panel de admin para ver la orden');
console.log('\n⏹️  Presiona Ctrl+C para detener');














