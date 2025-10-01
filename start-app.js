#!/usr/bin/env node

/**
 * 🚀 Lucky Snap - Script de Inicio Unificado
 * 
 * Este script proporciona una forma simple y confiable de iniciar
 * toda la aplicación Lucky Snap en modo desarrollo.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 Lucky Snap - Iniciando aplicación completa...\n');

// Configuración
const config = {
  frontend: {
    port: 5173,
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'frontend')
  },
  backend: {
    port: 3000,
    command: 'npm',
    args: ['run', 'start:prisma'],
    cwd: path.join(__dirname, 'backend')
  }
};

// Función para verificar si un puerto está en uso
async function checkPort(port) {
  return new Promise((resolve) => {
    import('net').then(net => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(false));
        server.close();
      });
      
      server.on('error', () => resolve(true));
    });
  });
}

// Función para iniciar un proceso
function startProcess(name, config) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Iniciando ${name}...`);
    
    const process = spawn(config.command, config.args, {
      cwd: config.cwd,
      stdio: 'pipe',
      shell: true
    });

    process.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('ready')) {
        console.log(`✅ ${name} iniciado correctamente`);
        resolve(process);
      }
    });

    process.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('warn') && !error.includes('deprecated')) {
        console.error(`❌ Error en ${name}:`, error);
      }
    });

    process.on('error', (error) => {
      console.error(`❌ Error iniciando ${name}:`, error.message);
      reject(error);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      if (!process.killed) {
        console.log(`✅ ${name} iniciado (timeout alcanzado)`);
        resolve(process);
      }
    }, 30000);
  });
}

// Función principal
async function startApplication() {
  try {
    // Verificar que los directorios existen
    if (!fs.existsSync(config.frontend.cwd)) {
      throw new Error('Directorio frontend no encontrado');
    }
    if (!fs.existsSync(config.backend.cwd)) {
      throw new Error('Directorio backend no encontrado');
    }

    // Verificar puertos
    const frontendPortInUse = await checkPort(config.frontend.port);
    const backendPortInUse = await checkPort(config.backend.port);

    if (frontendPortInUse) {
      console.log(`⚠️  Puerto ${config.frontend.port} ya está en uso`);
    }
    if (backendPortInUse) {
      console.log(`⚠️  Puerto ${config.backend.port} ya está en uso`);
    }

    // Iniciar backend primero
    console.log('🔧 Iniciando backend...');
    const backendProcess = await startProcess('Backend', config.backend);

    // Esperar un poco para que el backend se estabilice
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Iniciar frontend
    console.log('🎨 Iniciando frontend...');
    const frontendProcess = await startProcess('Frontend', config.frontend);

    console.log('\n🎉 ¡Aplicación Lucky Snap iniciada correctamente!');
    console.log(`📱 Frontend: http://localhost:${config.frontend.port}`);
    console.log(`🔧 Backend: http://localhost:${config.backend.port}`);
    console.log(`📊 Admin: http://localhost:${config.frontend.port}/#/admin`);
    console.log('\n💡 Presiona Ctrl+C para detener la aplicación\n');

    // Manejar señales de terminación
    const cleanup = () => {
      console.log('\n🛑 Deteniendo aplicación...');
      frontendProcess.kill('SIGTERM');
      backendProcess.kill('SIGTERM');
      
      setTimeout(() => {
        frontendProcess.kill('SIGKILL');
        backendProcess.kill('SIGKILL');
        process.exit(0);
      }, 5000);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Mantener el proceso activo
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Error iniciando la aplicación:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  startApplication();
}

export { startApplication, config };
