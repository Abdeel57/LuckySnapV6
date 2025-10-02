// Punto de entrada forzado para el backend definitivo
console.log('🚀 Iniciando Lucky Snap Backend DEFINITIVO...');
console.log('📡 Verificando configuración...');

// Verificar que app-final.js existe
const fs = require('fs');
const path = require('path');

const appFinalPath = path.join(__dirname, 'app-final.js');

if (fs.existsSync(appFinalPath)) {
  console.log('✅ Archivo app-final.js encontrado');
  console.log('🚀 Ejecutando backend definitivo...');
  require('./app-final.js');
} else {
  console.log('❌ Archivo app-final.js no encontrado');
  console.log('🔧 Intentando app.js...');
  
  const appPath = path.join(__dirname, 'app.js');
  if (fs.existsSync(appPath)) {
    console.log('✅ Archivo app.js encontrado');
    console.log('🚀 Ejecutando app.js...');
    require('./app.js');
  } else {
    console.error('❌ No se encontró ningún backend válido');
    process.exit(1);
  }
}