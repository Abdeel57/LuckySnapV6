#!/usr/bin/env node

/**
 * 🔍 Lucky Snap - Verificador de Configuración
 * 
 * Este script verifica que toda la configuración esté correcta
 * y que la aplicación esté lista para funcionar.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Lucky Snap - Verificando configuración...\n');

const checks = [];

// Función para agregar verificación
function addCheck(name, test) {
  checks.push({ name, test });
}

// Verificar Node.js
addCheck('Node.js versión', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major < 18) {
    throw new Error(`Node.js ${version} no es compatible. Se requiere 18+`);
  }
  return `✅ Node.js ${version}`;
});

// Verificar directorios
addCheck('Estructura de directorios', () => {
  const requiredDirs = ['frontend', 'backend'];
  const missing = requiredDirs.filter(dir => !fs.existsSync(dir));
  if (missing.length > 0) {
    throw new Error(`Directorios faltantes: ${missing.join(', ')}`);
  }
  return `✅ Directorios encontrados: ${requiredDirs.join(', ')}`;
});

// Verificar package.json
addCheck('Archivos de configuración', () => {
  const requiredFiles = [
    'package.json',
    'frontend/package.json',
    'backend/package.json'
  ];
  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Archivos faltantes: ${missing.join(', ')}`);
  }
  return `✅ Archivos de configuración encontrados`;
});

// Verificar dependencias del frontend
addCheck('Dependencias del frontend', () => {
  const frontendNodeModules = path.join('frontend', 'node_modules');
  if (!fs.existsSync(frontendNodeModules)) {
    throw new Error('Dependencias del frontend no instaladas. Ejecuta: npm run install:all');
  }
  return '✅ Dependencias del frontend instaladas';
});

// Verificar dependencias del backend
addCheck('Dependencias del backend', () => {
  const backendNodeModules = path.join('backend', 'node_modules');
  if (!fs.existsSync(backendNodeModules)) {
    throw new Error('Dependencias del backend no instaladas. Ejecuta: npm run install:all');
  }
  return '✅ Dependencias del backend instaladas';
});

// Verificar archivo .env
addCheck('Configuración de entorno', () => {
  const envFile = path.join('backend', '.env');
  if (!fs.existsSync(envFile)) {
    throw new Error('Archivo .env no encontrado. Ejecuta: cd backend && copy env.example .env');
  }
  return '✅ Archivo .env encontrado';
});

// Verificar Prisma
addCheck('Cliente Prisma', () => {
  try {
    const prismaClientPath = path.join('backend', 'node_modules', '@prisma', 'client');
    if (!fs.existsSync(prismaClientPath)) {
      throw new Error('Cliente Prisma no generado. Ejecuta: cd backend && npm run generate');
    }
    return '✅ Cliente Prisma generado';
  } catch (error) {
    throw new Error('Error verificando Prisma: ' + error.message);
  }
});

// Verificar migraciones
addCheck('Estado de migraciones', () => {
  try {
    const result = execSync('cd backend && npm run migrate:status', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    if (result.includes('Database schema is up to date')) {
      return '✅ Base de datos actualizada';
    } else {
      throw new Error('Migraciones pendientes. Ejecuta: npm run migrate:deploy');
    }
  } catch (error) {
    throw new Error('Error verificando migraciones: ' + error.message);
  }
});

// Verificar puertos
addCheck('Disponibilidad de puertos', async () => {
  const net = await import('net');
  
  function checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(false));
        server.close();
      });
      server.on('error', () => resolve(true));
    });
  }
  
  return Promise.all([checkPort(3000), checkPort(5173)]).then(([backend, frontend]) => {
    const issues = [];
    if (backend) issues.push('Puerto 3000 (backend) en uso');
    if (frontend) issues.push('Puerto 5173 (frontend) en uso');
    
    if (issues.length > 0) {
      console.log(`⚠️  ${issues.join(', ')}`);
      return '⚠️  Algunos puertos están en uso';
    }
    return '✅ Puertos disponibles';
  });
});

// Ejecutar verificaciones
async function runChecks() {
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      const result = await check.test();
      console.log(`${result}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Resumen: ${passed} verificaciones exitosas, ${failed} fallidas`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡Configuración completa! Puedes ejecutar: npm start');
  } else {
    console.log('\n🔧 Corrige los errores antes de continuar.');
    console.log('💡 Ejecuta: npm run setup para configuración automática');
  }
  
  return failed === 0;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runChecks().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runChecks };
