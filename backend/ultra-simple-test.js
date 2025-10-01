#!/usr/bin/env node

/**
 * 🔧 BACKEND ULTRA SIMPLE - SIN DEPENDENCIAS
 * 
 * Este script es la versión más simple posible
 * para probar que Render funcione.
 */

const http = require('http');
const PORT = process.env.PORT || 3000;

console.log('🚀 BACKEND ULTRA SIMPLE INICIANDO...');
console.log('=====================================');

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

  // Rutas
  if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Lucky Snap Backend - Ultra Simple',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
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
      }
    }));
  } else if (req.url === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Backend ultra simple funcionando',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: 'Ruta no encontrada',
      path: req.url,
      timestamp: new Date().toISOString()
    }));
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor ultra simple iniciado en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('✅ Backend ultra simple listo');
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
