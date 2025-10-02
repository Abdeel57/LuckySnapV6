#!/usr/bin/env node

/**
 * 🚀 BACKEND DEFINITIVO PARA RENDER
 * 
 * Este es el archivo principal que Render buscará automáticamente
 */

const http = require('http');
const PORT = process.env.PORT || 3000;

console.log('🚀 LUCKY SNAP BACKEND - VERSIÓN DEFINITIVA');
console.log('==========================================');
console.log(`🌐 Puerto: ${PORT}`);
console.log(`📁 Directorio: ${process.cwd()}`);
console.log(`📋 Archivos disponibles:`);

// Listar archivos para debug
const fs = require('fs');
try {
  const files = fs.readdirSync('.');
  console.log('📁 Archivos en directorio:', files);
} catch (error) {
  console.log('❌ Error listando archivos:', error.message);
}

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Manejar OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Configurar respuesta JSON
  res.setHeader('Content-Type', 'application/json');

  console.log(`📡 Request: ${req.method} ${req.url}`);

  // Rutas
  if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Lucky Snap Backend - FUNCIONANDO',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      port: PORT,
      directory: process.cwd()
    }));
  } else if (req.url === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      port: PORT
    }));
  } else if (req.url === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Backend funcionando correctamente',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: 'Ruta no encontrada',
      path: req.url,
      timestamp: new Date().toISOString(),
      availableRoutes: ['/', '/api/health', '/api/test']
    }));
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('✅ Backend Lucky Snap listo y funcionando');
});

// Manejo de errores
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});
