#!/usr/bin/env node

/**
 * 🚀 Lucky Snap - Script Unificado de Deploy
 * 
 * Uso:
 *   node scripts/deploy.js frontend
 *   node scripts/deploy.js backend
 *   node scripts/deploy.js all
 *   node scripts/deploy.js --help
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

// Ejecutar comando con promesa
function execCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`▶️  Ejecutando: ${command} ${args.join(' ')}`, 'blue');
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

// Verificar que el directorio existe
function checkDirectory(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directorio no encontrado: ${dir}`);
  }
}

// Deploy del Frontend
async function deployFrontend() {
  logSection('📦 DEPLOY FRONTEND');
  
  try {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    checkDirectory(frontendDir);
    
    log('1️⃣ Instalando dependencias...', 'yellow');
    await execCommand('npm', ['ci'], { cwd: frontendDir });
    
    log('2️⃣ Construyendo frontend...', 'yellow');
    await execCommand('npm', ['run', 'build'], { cwd: frontendDir });
    
    const distDir = path.join(frontendDir, 'dist');
    checkDirectory(distDir);
    
    log('✅ Build completado exitosamente', 'green');
    log('📂 Archivos listos en: frontend/dist', 'green');
    
    // Verificar si Netlify CLI está instalado
    try {
      log('3️⃣ Desplegando a Netlify...', 'yellow');
      await execCommand('netlify', ['deploy', '--dir=dist', '--prod'], { cwd: frontendDir });
      log('✅ Deploy a Netlify completado', 'green');
    } catch (error) {
      log('⚠️  Netlify CLI no disponible', 'yellow');
      log('💡 Opciones de deploy:', 'blue');
      log('   1. Instalar Netlify CLI: npm install -g netlify-cli', 'blue');
      log('   2. Deploy manual: Arrastra frontend/dist a https://app.netlify.com/', 'blue');
      log('   3. Conectar repositorio GitHub en Netlify para auto-deploy', 'blue');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error en deploy frontend: ${error.message}`, 'red');
    throw error;
  }
}

// Deploy del Backend
async function deployBackend() {
  logSection('🔧 DEPLOY BACKEND');
  
  try {
    const backendDir = path.join(__dirname, '..', 'backend');
    checkDirectory(backendDir);
    
    log('1️⃣ Verificando variables de entorno...', 'yellow');
    const envPath = path.join(backendDir, '.env');
    if (!fs.existsSync(envPath)) {
      log('⚠️  Archivo .env no encontrado', 'yellow');
      log('💡 Copia env.example a .env y configura las variables', 'blue');
      log('   cp backend/env.example backend/.env', 'blue');
    }
    
    log('2️⃣ Instalando dependencias...', 'yellow');
    await execCommand('npm', ['ci'], { cwd: backendDir });
    
    log('3️⃣ Generando Prisma Client...', 'yellow');
    await execCommand('npx', ['prisma', 'generate'], { cwd: backendDir });
    
    log('4️⃣ Construyendo backend...', 'yellow');
    await execCommand('npm', ['run', 'build'], { cwd: backendDir });
    
    log('✅ Build completado exitosamente', 'green');
    
    // Verificar si hay un deploy hook configurado
    const deployHook = process.env.RENDER_DEPLOY_HOOK;
    
    if (deployHook) {
      log('5️⃣ Triggering deploy en Render...', 'yellow');
      try {
        await execCommand('curl', ['-X', 'POST', deployHook]);
        log('✅ Deploy hook ejecutado', 'green');
        log('⏳ Verifica el progreso en: https://dashboard.render.com/', 'blue');
      } catch (error) {
        log('⚠️  Error ejecutando deploy hook', 'yellow');
      }
    } else {
      log('💡 Para deploy automático a Render:', 'blue');
      log('   1. Ve a tu servicio en Render Dashboard', 'blue');
      log('   2. Ve a Settings > Build & Deploy', 'blue');
      log('   3. Haz clic en "Manual Deploy" > "Deploy latest commit"', 'blue');
      log('   O configura RENDER_DEPLOY_HOOK en .env', 'blue');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error en deploy backend: ${error.message}`, 'red');
    throw error;
  }
}

// Verificación Post-Deploy
async function verifyDeployment() {
  logSection('🔍 VERIFICACIÓN POST-DEPLOY');
  
  log('Verificando configuración...', 'yellow');
  
  // Verificar frontend build
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    log('✅ Frontend build existe', 'green');
  } else {
    log('❌ Frontend build no encontrado', 'red');
  }
  
  // Verificar backend build
  const backendDist = path.join(__dirname, '..', 'backend', 'dist');
  if (fs.existsSync(backendDist)) {
    log('✅ Backend build existe', 'green');
  } else {
    log('❌ Backend build no encontrado', 'red');
  }
  
  log('\n📋 Próximos pasos:', 'blue');
  log('1. Frontend: https://app.netlify.com/ - Verifica el deploy', 'blue');
  log('2. Backend: https://dashboard.render.com/ - Verifica el deploy', 'blue');
  log('3. Prueba la app en producción', 'blue');
  log('4. Verifica health check: https://your-backend.onrender.com/api/health', 'blue');
}

// Mostrar ayuda
function showHelp() {
  console.log(`
🚀 Lucky Snap - Script de Deploy

USO:
  node scripts/deploy.js <comando>

COMANDOS:
  frontend    Construir y desplegar solo el frontend
  backend     Construir y desplegar solo el backend
  all         Desplegar frontend y backend
  verify      Verificar builds sin desplegar
  help        Mostrar esta ayuda

EJEMPLOS:
  node scripts/deploy.js frontend
  node scripts/deploy.js backend
  node scripts/deploy.js all

VARIABLES DE ENTORNO:
  RENDER_DEPLOY_HOOK    URL del webhook de Render para auto-deploy
  NETLIFY_AUTH_TOKEN    Token de autenticación de Netlify
  NETLIFY_SITE_ID       ID del sitio en Netlify

NOTAS:
  - Asegúrate de tener las dependencias instaladas
  - Configura las variables de entorno necesarias
  - Para Netlify: npm install -g netlify-cli
  `);
}

// Main
async function main() {
  const command = process.argv[2];
  
  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  log('🚀 Lucky Snap - Script de Deploy', 'bright');
  log(`Comando: ${command}\n`, 'blue');
  
  try {
    switch (command.toLowerCase()) {
      case 'frontend':
        await deployFrontend();
        break;
        
      case 'backend':
        await deployBackend();
        break;
        
      case 'all':
        await deployFrontend();
        await deployBackend();
        await verifyDeployment();
        break;
        
      case 'verify':
        await verifyDeployment();
        break;
        
      default:
        log(`❌ Comando desconocido: ${command}`, 'red');
        log('Usa --help para ver los comandos disponibles', 'yellow');
        process.exit(1);
    }
    
    logSection('✅ DEPLOY COMPLETADO CON ÉXITO');
    log('🎉 ¡Todos los pasos completados!', 'green');
    
  } catch (error) {
    logSection('❌ ERROR EN DEPLOY');
    log(error.message, 'red');
    log('\n💡 Revisa los logs arriba para más detalles', 'yellow');
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main().catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  deployFrontend,
  deployBackend,
  verifyDeployment,
};

