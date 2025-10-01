#!/usr/bin/env node

/**
 * 🚀 Lucky Snap - Preparador de Deploy para Render
 * 
 * Este script prepara la aplicación para el deploy en Render
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Lucky Snap - Preparando deploy para Render...\n');

// Función para ejecutar comandos
function runCommand(command, cwd = '.') {
  try {
    console.log(`🔄 Ejecutando: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Función para verificar archivos
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description} faltante: ${filePath}`);
    return false;
  }
}

async function prepareDeploy() {
  console.log('📋 Verificando archivos necesarios...\n');
  
  const checks = [
    checkFile('backend/package.json', 'Package.json del backend'),
    checkFile('backend/start-optimized.js', 'Script de inicio optimizado'),
    checkFile('backend/schema.prisma', 'Esquema de Prisma'),
    checkFile('frontend/package.json', 'Package.json del frontend'),
    checkFile('render.yaml', 'Configuración de Render'),
    checkFile('render-optimized.yaml', 'Configuración optimizada de Render')
  ];
  
  const allChecksPassed = checks.every(check => check);
  
  if (!allChecksPassed) {
    console.log('\n❌ Algunos archivos necesarios están faltando.');
    return false;
  }
  
  console.log('\n🔧 Preparando backend...');
  
  // Instalar dependencias del backend
  if (!runCommand('npm install', 'backend')) {
    return false;
  }
  
  // Generar cliente de Prisma
  if (!runCommand('npx prisma generate', 'backend')) {
    return false;
  }
  
  // Verificar migraciones
  console.log('\n📊 Verificando estado de la base de datos...');
  if (!runCommand('npm run migrate:status', 'backend')) {
    console.log('⚠️  Advertencia: No se pudo verificar el estado de las migraciones');
  }
  
  console.log('\n🎨 Preparando frontend...');
  
  // Instalar dependencias del frontend
  if (!runCommand('npm install', 'frontend')) {
    return false;
  }
  
  // Construir frontend
  if (!runCommand('npm run build', 'frontend')) {
    return false;
  }
  
  console.log('\n✅ Preparación completada exitosamente!');
  console.log('\n📋 Pasos para el deploy en Render:');
  console.log('1. Ve a tu dashboard de Render');
  console.log('2. Selecciona tu servicio backend');
  console.log('3. Haz clic en "Manual Deploy"');
  console.log('4. Selecciona la rama main');
  console.log('5. Haz clic en "Deploy latest commit"');
  console.log('\n🔧 Configuración recomendada:');
  console.log('- Build Command: npm install && npx prisma generate');
  console.log('- Start Command: npm run start:optimized');
  console.log('- Node Version: 22.19.0');
  console.log('\n🌐 URLs esperadas después del deploy:');
  console.log('- Backend: https://lucky-snap-backend.onrender.com');
  console.log('- Frontend: https://lucky-snap-frontend.onrender.com');
  
  return true;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareDeploy().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { prepareDeploy };


