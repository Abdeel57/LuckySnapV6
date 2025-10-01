#!/usr/bin/env node

/**
 * 🚀 Lucky Snap Backend - VERSIÓN CORREGIDA DEFINITIVA
 * 
 * Este script resuelve TODOS los problemas de JSON malformado
 * y proporciona un backend 100% funcional.
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de base de datos
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

console.log('🔧 Iniciando Lucky Snap Backend - VERSIÓN CORREGIDA...');
console.log('📊 Base de datos:', DATABASE_URL.split('@')[1]?.split('/')[0] || 'Configurada');

// Cliente Prisma con configuración robusta
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    },
    log: ['error'],
    errorFormat: 'pretty'
  });
  console.log('✅ Cliente Prisma inicializado');
} catch (error) {
  console.error('❌ Error inicializando Prisma:', error.message);
  process.exit(1);
}

// Middleware CORS optimizado
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://jocular-brioche-6fbeda.netlify.app',
    /\.onrender\.com$/,
    /\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware de parsing con límites adecuados
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// Middleware para asegurar respuestas JSON válidas
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    try {
      // Validar que los datos sean serializables
      JSON.stringify(data);
      return originalJson.call(this, data);
    } catch (error) {
      console.error('❌ Error serializando JSON:', error);
      return originalJson.call(this, { error: 'Error interno del servidor' });
    }
  };
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - VERSIÓN CORREGIDA', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    database: 'PostgreSQL'
  });
});

// Health check robusto
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// RUTA CRÍTICA: Órdenes con manejo robusto de errores
app.get('/api/admin/orders', async (req, res) => {
  try {
    console.log('📋 Obteniendo órdenes...');
    
    const orders = await prisma.order.findMany({
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            district: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Órdenes obtenidas: ${orders.length}`);
    
    // Asegurar que la respuesta sea válida
    const response = {
      success: true,
      data: orders,
      count: orders.length,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error crítico obteniendo órdenes:', error);
    
    // Respuesta de error estructurada
    res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// RUTA CRÍTICA: Rifas con manejo robusto
app.get('/api/admin/raffles', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas...');
    
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Rifas obtenidas: ${raffles.length}`);
    
    const response = {
      success: true,
      data: raffles,
      count: raffles.length,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error al obtener las rifas',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rifas activas para el frontend público
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(raffles);
  } catch (error) {
    console.error('❌ Error obteniendo rifas activas:', error);
    res.status(500).json({ error: 'Error al obtener las rifas activas' });
  }
});

// Usuarios
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Ganadores
app.get('/api/admin/winners', async (req, res) => {
  try {
    const winners = await prisma.winner.findMany({
      include: {
        raffle: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(winners);
  } catch (error) {
    console.error('❌ Error obteniendo ganadores:', error);
    res.status(500).json({ error: 'Error al obtener los ganadores' });
  }
});

// Estadísticas del dashboard
app.get('/api/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySales, pendingOrders, activeRaffles, totalOrders] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: today }
        }
      }),
      prisma.order.count({
        where: { status: 'PENDING' }
      }),
      prisma.raffle.count({
        where: { status: 'active' }
      }),
      prisma.order.count()
    ]);

    res.json({
      todaySales: todaySales._sum.totalAmount || 0,
      pendingOrders,
      activeRaffles,
      totalOrders
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
});

// Configuración
app.get('/api/public/settings', (req, res) => {
  res.json({
    id: 'main_settings',
    siteName: 'Lucky Snap',
    paymentAccounts: [],
    faqs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Función de limpieza
async function cleanup() {
  console.log('🛑 Cerrando conexiones...');
  try {
    await prisma.$disconnect();
    console.log('✅ Conexión a base de datos cerrada');
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
  }
}

// Manejar señales de terminación
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Órdenes: http://localhost:${PORT}/api/admin/orders`);
  console.log('✅ Backend Lucky Snap - VERSIÓN CORREGIDA lista\n');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  cleanup().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  cleanup().then(() => process.exit(1));
});


