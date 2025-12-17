#!/usr/bin/env node

/**
 * 🚀 Lucky Snap - Backend Optimizado para Render
 * 
 * Script optimizado para iniciar el backend en Render con:
 * - Límites de memoria configurados
 * - Manejo robusto de errores
 * - Logging apropiado para producción
 * - Proceso hijo seguro
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Lucky Snap Backend - Iniciando...');
console.log('📦 Entorno:', process.env.NODE_ENV || 'development');
console.log('🔌 Puerto:', process.env.PORT || '3000');
console.log('💾 Memoria inicial:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');

// Verificar variables de entorno críticas
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Variables de entorno faltantes:', missingVars.join(', '));
  console.error('💡 Asegúrate de configurar estas variables en Render Dashboard');
  process.exit(1);
}

console.log('✅ Variables de entorno verificadas');

// Determinar qué archivo iniciar
const distMainPath = path.join(__dirname, 'dist', 'main.js');
const indexPath = path.join(__dirname, 'index.js');

let startCommand = 'node';
let startArgs = [];

// Verificar si existe el archivo compilado
const fs = require('fs');
if (fs.existsSync(distMainPath)) {
  console.log('📂 Usando build compilado: dist/main.js');
  startArgs = [distMainPath];
} else if (fs.existsSync(indexPath)) {
  console.log('📂 Usando index.js');
  startArgs = [indexPath];
} else {
  console.error('❌ ERROR: No se encontró dist/main.js ni index.js');
  console.error('💡 Ejecuta "npm run build" primero');
  process.exit(1);
}

// Configurar opciones del proceso con límites de memoria
const serverProcess = spawn(startCommand, startArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    // Limitar memoria para plan Free de Render (512MB)
    NODE_OPTIONS: '--max-old-space-size=450',
  },
});

// Manejo de señales
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM recibida, cerrando servidor...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT recibida, cerrando servidor...');
  serverProcess.kill('SIGINT');
});

// Manejo de errores del proceso hijo
serverProcess.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ Servidor terminó con código: ${code}, señal: ${signal}`);
    process.exit(code || 1);
  }
  console.log('✅ Servidor cerrado correctamente');
  process.exit(0);
});

// Monitoreo de memoria cada 5 minutos
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  if (heapUsedMB > 400) {
    console.warn(`⚠️ ADVERTENCIA: Uso de memoria alto: ${heapUsedMB}MB / ${heapTotalMB}MB`);
  } else {
    console.log(`💾 Memoria: ${heapUsedMB}MB / ${heapTotalMB}MB`);
  }
}, 5 * 60 * 1000); // 5 minutos

console.log('✅ Servidor iniciado correctamente');
console.log('🌐 Esperando conexiones...');

