#!/usr/bin/env node

/**
 * 🔍 Lucky Snap - Verificación Rápida
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Lucky Snap - Verificación rápida...\n');

// Verificaciones básicas
const checks = [
  {
    name: 'Node.js',
    test: () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      return major >= 18 ? `✅ Node.js ${version}` : `❌ Node.js ${version} (requiere 18+)`;
    }
  },
  {
    name: 'Directorios',
    test: () => {
      const dirs = ['frontend', 'backend'];
      const missing = dirs.filter(dir => !fs.existsSync(dir));
      return missing.length === 0 ? '✅ Directorios encontrados' : `❌ Faltan: ${missing.join(', ')}`;
    }
  },
  {
    name: 'Package.json',
    test: () => {
      const files = ['package.json', 'frontend/package.json', 'backend/package.json'];
      const missing = files.filter(file => !fs.existsSync(file));
      return missing.length === 0 ? '✅ Archivos de configuración' : `❌ Faltan: ${missing.join(', ')}`;
    }
  },
  {
    name: 'Dependencias Frontend',
    test: () => {
      return fs.existsSync('frontend/node_modules') ? '✅ Frontend instalado' : '❌ Frontend no instalado';
    }
  },
  {
    name: 'Dependencias Backend',
    test: () => {
      return fs.existsSync('backend/node_modules') ? '✅ Backend instalado' : '❌ Backend no instalado';
    }
  },
  {
    name: 'Archivo .env',
    test: () => {
      return fs.existsSync('backend/.env') ? '✅ Configuración encontrada' : '❌ Archivo .env faltante';
    }
  }
];

// Ejecutar verificaciones
checks.forEach(check => {
  console.log(`${check.test()}`);
});

console.log('\n🚀 Para iniciar la aplicación:');
console.log('   npm start');
console.log('\n🔧 Para configuración completa:');
console.log('   npm run setup');
console.log('\n📖 Para más información:');
console.log('   Ver README.md');




