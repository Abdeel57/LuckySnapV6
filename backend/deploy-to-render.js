#!/usr/bin/env node

/**
 * 🚀 DESPLIEGUE OPTIMIZADO PARA RENDER
 * 
 * Este script automatiza el proceso de despliegue a Render
 * con todas las optimizaciones necesarias.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DESPLIEGUE OPTIMIZADO PARA RENDER');
console.log('=====================================');

async function deployToRender() {
  try {
    // 1. Verificar que estamos en el directorio correcto
    console.log('\n1️⃣ Verificando directorio de trabajo...');
    if (!fs.existsSync('package.json')) {
      throw new Error('No se encontró package.json. Asegúrate de estar en el directorio backend');
    }
    console.log('✅ Directorio correcto');

    // 2. Verificar que los archivos necesarios existen
    console.log('\n2️⃣ Verificando archivos necesarios...');
    const requiredFiles = [
      'fix-render-backend.js',
      'migrate-render-database.js',
      'diagnose-render-issues.js',
      'render.yaml'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Archivo requerido no encontrado: ${file}`);
      }
    }
    console.log('✅ Todos los archivos necesarios están presentes');

    // 3. Instalar dependencias
    console.log('\n3️⃣ Instalando dependencias...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencias instaladas');
    } catch (error) {
      console.error('❌ Error instalando dependencias:', error.message);
      throw error;
    }

    // 4. Generar cliente Prisma
    console.log('\n4️⃣ Generando cliente Prisma...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Cliente Prisma generado');
    } catch (error) {
      console.error('❌ Error generando cliente Prisma:', error.message);
      throw error;
    }

    // 5. Verificar configuración de Render
    console.log('\n5️⃣ Verificando configuración de Render...');
    const renderConfig = fs.readFileSync('render.yaml', 'utf8');
    
    if (!renderConfig.includes('fix-render-backend.js')) {
      console.log('⚠️ Actualizando configuración de Render...');
      const updatedConfig = renderConfig.replace(
        /startCommand: .*/,
        'startCommand: node fix-render-backend.js'
      );
      fs.writeFileSync('render.yaml', updatedConfig);
      console.log('✅ Configuración de Render actualizada');
    } else {
      console.log('✅ Configuración de Render correcta');
    }

    // 6. Crear archivo de inicio optimizado
    console.log('\n6️⃣ Creando archivo de inicio optimizado...');
    const startScript = `#!/usr/bin/env node

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
    console.error(\`❌ Variable de entorno requerida no encontrada: \${envVar}\`);
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
  console.log(\`🛑 Servidor terminado con código: \${code}\`);
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
`;

    fs.writeFileSync('start-render.js', startScript);
    console.log('✅ Script de inicio creado');

    // 7. Crear archivo de configuración de entorno
    console.log('\n7️⃣ Creando configuración de entorno...');
    const envConfig = `# Configuración optimizada para Render
NODE_ENV=production
PORT=3000
NODE_VERSION=22.19.0

# Base de datos (configurar en Render)
DATABASE_URL=your_database_url_here

# Logging
LOG_LEVEL=error

# Optimizaciones
MAX_REQUEST_SIZE=2mb
REQUEST_TIMEOUT=30000
`;

    fs.writeFileSync('.env.render', envConfig);
    console.log('✅ Configuración de entorno creada');

    // 8. Crear script de diagnóstico
    console.log('\n8️⃣ Creando script de diagnóstico...');
    const diagnosticScript = `#!/usr/bin/env node

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
    console.log('\\n1️⃣ Verificando variables de entorno...');
    const envVars = ['NODE_ENV', 'PORT', 'DATABASE_URL'];
    
    for (const envVar of envVars) {
      const value = process.env[envVar];
      if (value) {
        console.log(\`✅ \${envVar}: \${envVar === 'DATABASE_URL' ? 'configurada' : value}\`);
      } else {
        console.log(\`❌ \${envVar}: no configurada\`);
      }
    }

    console.log('\\n2️⃣ Verificando archivos críticos...');
    const criticalFiles = [
      'fix-render-backend.js',
      'package.json',
      'node_modules/@prisma/client'
    ];
    
    for (const file of criticalFiles) {
      try {
        require.resolve(file);
        console.log(\`✅ \${file}: encontrado\`);
      } catch (error) {
        console.log(\`❌ \${file}: no encontrado\`);
      }
    }

    console.log('\\n3️⃣ Verificando memoria disponible...');
    const memUsage = process.memoryUsage();
    console.log(\`💾 Memoria usada: \${Math.round(memUsage.heapUsed / 1024 / 1024)} MB\`);
    console.log(\`💾 Memoria total: \${Math.round(memUsage.heapTotal / 1024 / 1024)} MB\`);

    console.log('\\n4️⃣ Verificando CPU...');
    const cpuUsage = process.cpuUsage();
    console.log(\`🖥️ CPU: \${JSON.stringify(cpuUsage)}\`);

    console.log('\\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

diagnoseRender();
`;

    fs.writeFileSync('diagnose-render.js', diagnosticScript);
    console.log('✅ Script de diagnóstico creado');

    // 9. Crear README de despliegue
    console.log('\n9️⃣ Creando documentación de despliegue...');
    const deploymentReadme = `# 🚀 Despliegue en Render - Lucky Snap Backend

## Configuración Requerida

### Variables de Entorno en Render
- \`NODE_ENV\`: production
- \`PORT\`: 3000
- \`DATABASE_URL\`: URL de tu base de datos PostgreSQL

### Comandos de Build
- Build Command: \`npm install && npx prisma generate\`
- Start Command: \`node fix-render-backend.js\`

## Archivos Críticos
- \`fix-render-backend.js\`: Servidor optimizado para Render
- \`migrate-render-database.js\`: Migración de base de datos
- \`diagnose-render-issues.js\`: Diagnóstico de problemas
- \`render.yaml\`: Configuración de Render

## Solución de Problemas

### Error 500 en endpoints
1. Verificar logs en Render Dashboard
2. Ejecutar \`node diagnose-render-issues.js\`
3. Verificar conexión a base de datos

### Timeout en requests
1. Verificar que la base de datos esté activa
2. Revisar límites de memoria en Render
3. Optimizar consultas de base de datos

### Problemas de CORS
1. Verificar configuración de CORS en \`fix-render-backend.js\`
2. Asegurar que el frontend esté en la lista de orígenes permitidos

## Monitoreo
- Health Check: \`/api/health\`
- Logs: Render Dashboard > Logs
- Métricas: Render Dashboard > Metrics

## Contacto
Para soporte técnico, revisar los logs y ejecutar los scripts de diagnóstico.
`;

    fs.writeFileSync('RENDER-DEPLOYMENT.md', deploymentReadme);
    console.log('✅ Documentación de despliegue creada');

    // 10. Resumen final
    console.log('\n🎉 DESPLIEGUE PREPARADO EXITOSAMENTE');
    console.log('=====================================');
    console.log('📋 Archivos creados:');
    console.log('  - fix-render-backend.js (servidor optimizado)');
    console.log('  - migrate-render-database.js (migración de BD)');
    console.log('  - diagnose-render-issues.js (diagnóstico)');
    console.log('  - start-render.js (script de inicio)');
    console.log('  - .env.render (configuración de entorno)');
    console.log('  - diagnose-render.js (diagnóstico rápido)');
    console.log('  - RENDER-DEPLOYMENT.md (documentación)');
    console.log('');
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('1. Subir cambios a tu repositorio Git');
    console.log('2. En Render Dashboard:');
    console.log('   - Ir a tu servicio backend');
    console.log('   - Actualizar Build Command: npm install && npx prisma generate');
    console.log('   - Actualizar Start Command: node fix-render-backend.js');
    console.log('   - Verificar variables de entorno (especialmente DATABASE_URL)');
    console.log('3. Hacer redeploy del servicio');
    console.log('4. Verificar que /api/health responda correctamente');
    console.log('5. Probar endpoints administrativos');
    console.log('');
    console.log('✅ El backend está listo para Render');

  } catch (error) {
    console.error('\n❌ ERROR EN DESPLIEGUE:', error);
    console.error('📋 Detalles del error:', error.message);
    process.exit(1);
  }
}

// Ejecutar despliegue
deployToRender()
  .then(() => {
    console.log('\n🎉 Proceso de despliegue completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal en despliegue:', error);
    process.exit(1);
  });
