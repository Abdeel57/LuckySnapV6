#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE DIAGNÓSTICO PARA RENDER
 * 
 * Este script diagnostica problemas comunes en Render
 * y proporciona soluciones.
 */

const { execSync } = require('child_process');

console.log('🔍 DIAGNÓSTICO DE RENDER');
console.log('========================');

async function diagnoseRender() {
  try {
    console.log('\n1️⃣ Verificando variables de entorno...');
    const envVars = ['NODE_ENV', 'PORT', 'DATABASE_URL'];
    
    for (const envVar of envVars) {
      const value = process.env[envVar];
      if (value) {
        console.log(`✅ ${envVar}: ${envVar === 'DATABASE_URL' ? 'configurada' : value}`);
      } else {
        console.log(`❌ ${envVar}: no configurada`);
      }
    }

    console.log('\n2️⃣ Verificando archivos críticos...');
    const criticalFiles = [
      'fix-render-backend.js',
      'package.json',
      'node_modules/@prisma/client'
    ];
    
    for (const file of criticalFiles) {
      try {
        require.resolve(file);
        console.log(`✅ ${file}: encontrado`);
      } catch (error) {
        console.log(`❌ ${file}: no encontrado`);
      }
    }

    console.log('\n3️⃣ Verificando memoria disponible...');
    const memUsage = process.memoryUsage();
    console.log(`💾 Memoria usada: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`💾 Memoria total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);

    console.log('\n4️⃣ Verificando CPU...');
    const cpuUsage = process.cpuUsage();
    console.log(`🖥️ CPU: ${JSON.stringify(cpuUsage)}`);

    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

diagnoseRender();
