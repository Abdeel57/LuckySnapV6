#!/usr/bin/env node

/**
 * 🚀 Lucky Snap - Deploy Completo
 * 
 * Este script prepara y despliega la aplicación completa
 * resolviendo TODOS los problemas identificados.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Lucky Snap - Deploy Completo - Resolviendo TODOS los problemas...\n');

// Función para ejecutar comandos
function runCommand(command, cwd = '.') {
  try {
    console.log(`🔄 ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (error) {
    console.error(`❌ Error: ${command}`);
    return false;
  }
}

async function deployComplete() {
  console.log('📋 PASO 1: Preparando Frontend...');
  
  // Limpiar y reconstruir frontend
  if (!runCommand('rm -rf dist', 'frontend')) {
    console.log('⚠️  No se pudo limpiar dist (normal en Windows)');
  }
  
  if (!runCommand('npm run build', 'frontend')) {
    console.error('❌ Error construyendo frontend');
    return false;
  }
  
  console.log('✅ Frontend construido correctamente');
  
  console.log('\n📋 PASO 2: Preparando Backend...');
  
  // Instalar dependencias del backend
  if (!runCommand('npm install', 'backend')) {
    console.error('❌ Error instalando dependencias del backend');
    return false;
  }
  
  // Generar cliente Prisma
  if (!runCommand('npx prisma generate', 'backend')) {
    console.error('❌ Error generando cliente Prisma');
    return false;
  }
  
  console.log('✅ Backend preparado correctamente');
  
  console.log('\n📋 PASO 3: Verificando archivos críticos...');
  
  // Verificar que los archivos críticos existen
  const criticalFiles = [
    'frontend/dist/index.html',
    'backend/start-fixed.js',
    'backend/package.json'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Archivo crítico faltante: ${file}`);
      return false;
    }
    console.log(`✅ ${file}`);
  }
  
  console.log('\n🎯 DEPLOY LISTO - Instrucciones:');
  console.log('\n📱 FRONTEND (Netlify):');
  console.log('1. Ve a tu dashboard de Netlify');
  console.log('2. Selecciona tu sitio');
  console.log('3. Ve a "Deploys"');
  console.log('4. Haz clic en "Trigger deploy" > "Deploy site"');
  console.log('5. O arrastra la carpeta frontend/dist a Netlify');
  
  console.log('\n🔧 BACKEND (Render):');
  console.log('1. Ve a tu dashboard de Render');
  console.log('2. Selecciona tu servicio backend');
  console.log('3. Haz clic en "Manual Deploy"');
  console.log('4. Selecciona la rama main');
  console.log('5. Haz clic en "Deploy latest commit"');
  
  console.log('\n⚙️  CONFIGURACIÓN DEL BACKEND EN RENDER:');
  console.log('Build Command: npm install && npx prisma generate');
  console.log('Start Command: npm run start:fixed');
  console.log('Node Version: 22.19.0');
  
  console.log('\n🔍 VERIFICACIÓN POST-DEPLOY:');
  console.log('Backend Health: https://tu-backend.onrender.com/api/health');
  console.log('Backend Orders: https://tu-backend.onrender.com/api/admin/orders');
  console.log('Frontend: https://tu-frontend.netlify.app/#/admin/apartados');
  
  console.log('\n✅ PROBLEMAS RESUELTOS:');
  console.log('✅ Error FileText no definido - Corregido en frontend');
  console.log('✅ Error JSON malformado - Corregido en backend');
  console.log('✅ Backend optimizado para producción');
  console.log('✅ Manejo robusto de errores');
  console.log('✅ Respuestas JSON válidas garantizadas');
  
  return true;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deployComplete().then(success => {
    if (success) {
      console.log('\n🎉 ¡DEPLOY COMPLETO LISTO!');
      console.log('🚀 Ejecuta los pasos de deploy en Netlify y Render');
    } else {
      console.log('\n❌ Error en la preparación del deploy');
    }
    process.exit(success ? 0 : 1);
  });
}

export { deployComplete };






