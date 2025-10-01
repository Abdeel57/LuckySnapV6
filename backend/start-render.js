#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE INICIO OPTIMIZADO PARA RENDER
 * 
 * Este script inicia el backend con todas las optimizaciones
 * necesarias para Render.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Lucky Snap Backend - Render Optimized');

// Verificar variables de entorno críticas
const requiredEnvVars = ['DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variable de entorno requerida no encontrada: ${envVar}`);
    process.exit(1);
  }
}

// Iniciar el servidor optimizado
const serverPath = path.join(__dirname, 'fix-render-backend.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🛑 Servidor terminado con código: ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.kill('SIGTERM');
});
