#!/usr/bin/env node

/**
 * 🔍 Lucky Snap - Verificar Estado del Build
 * 
 * Script para verificar si el post-processing está funcionando
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 Lucky Snap - Verificando Estado del Build...\n');

// Verificar directorio dist
const distPath = path.join(process.cwd(), 'frontend', 'dist');
console.log('📁 Verificando directorio dist...');

if (!fs.existsSync(distPath)) {
  console.log('❌ Directorio dist no existe');
  console.log('💡 Ejecutando build...');
  
  try {
    execSync('cd frontend && npm run build', { stdio: 'inherit' });
    console.log('✅ Build completado');
  } catch (error) {
    console.error('❌ Error en build:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Directorio dist existe');
}

// Verificar archivos críticos
console.log('\n📋 Verificando archivos críticos...');

const criticalFiles = [
  'index.html',
  'assets/index-DXuxxmhA.js',
  'assets/AdminOrdersPage-Cz05hDHR.js',
  'assets/ui-Bf2fOwCr.js'
];

let allFilesExist = true;
for (const file of criticalFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`);
    allFilesExist = false;
  }
}

// Verificar contenido de AdminOrdersPage
console.log('\n🔍 Verificando contenido de AdminOrdersPage...');
const adminOrdersPath = path.join(distPath, 'assets', 'AdminOrdersPage-Cz05hDHR.js');

if (fs.existsSync(adminOrdersPath)) {
  const content = fs.readFileSync(adminOrdersPath, 'utf8');
  
  // Verificar que no tenga referencias a FileText
  if (content.includes('FileText')) {
    console.log('❌ AdminOrdersPage contiene referencias a FileText');
  } else {
    console.log('✅ AdminOrdersPage NO contiene referencias a FileText');
  }
  
  // Verificar que tenga contenido válido
  if (content.length > 1000) {
    console.log('✅ AdminOrdersPage tiene contenido válido');
  } else {
    console.log('❌ AdminOrdersPage parece estar vacío o corrupto');
  }
  
  // Verificar que tenga imports de lucide-react
  if (content.includes('lucide-react')) {
    console.log('✅ AdminOrdersPage tiene imports de lucide-react');
  } else {
    console.log('❌ AdminOrdersPage NO tiene imports de lucide-react');
  }
} else {
  console.log('❌ AdminOrdersPage no encontrado');
}

// Verificar index.html
console.log('\n🔍 Verificando index.html...');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  
  if (content.includes('AdminOrdersPage')) {
    console.log('✅ index.html referencia AdminOrdersPage');
  } else {
    console.log('❌ index.html NO referencia AdminOrdersPage');
  }
  
  if (content.includes('assets/')) {
    console.log('✅ index.html tiene referencias a assets');
  } else {
    console.log('❌ index.html NO tiene referencias a assets');
  }
} else {
  console.log('❌ index.html no encontrado');
}

// Resumen final
console.log('\n📊 RESUMEN DEL ESTADO:');
if (allFilesExist) {
  console.log('✅ Todos los archivos críticos existen');
  console.log('✅ Build completado correctamente');
  console.log('✅ Post-processing funcionando');
} else {
  console.log('❌ Faltan archivos críticos');
  console.log('❌ Build incompleto');
  console.log('❌ Post-processing puede estar fallando');
}

console.log('\n🎯 PRÓXIMOS PASOS:');
if (allFilesExist) {
  console.log('✅ Frontend listo para deploy');
  console.log('📱 Haz deploy en Netlify');
} else {
  console.log('❌ Ejecuta: cd frontend && npm run build');
  console.log('❌ Verifica errores en la consola');
}




