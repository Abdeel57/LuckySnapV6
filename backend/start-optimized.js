#!/usr/bin/env node

/**
 * 🚀 Lucky Snap Backend - Inicio Optimizado
 * 
 * Este script resuelve los problemas de Prisma en Windows
 * y proporciona un backend estable y funcional.
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de base de datos optimizada
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

console.log('🔧 Iniciando Lucky Snap Backend Optimizado...');
console.log('📊 Base de datos:', DATABASE_URL.split('@')[1]?.split('/')[0] || 'Configurada');

// Cliente Prisma con configuración optimizada para Windows
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    },
    log: ['error', 'warn'],
    errorFormat: 'pretty'
  });
  console.log('✅ Cliente Prisma inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Prisma:', error.message);
  process.exit(1);
}

// Middleware optimizado
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware de logging optimizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - Backend Optimizado', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    database: 'PostgreSQL',
    features: ['Orders', 'Raffles', 'Users', 'Winners', 'Analytics']
  });
});

// Health check mejorado
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
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas de órdenes optimizadas
app.get('/api/admin/orders', async (req, res) => {
  try {
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
    
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

// Rutas de rifas optimizadas
app.get('/api/admin/raffles', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(raffles);
  } catch (error) {
    console.error('Error getting raffles:', error);
    res.status(500).json({ error: 'Error al obtener las rifas' });
  }
});

app.get('/api/public/raffles/active', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(raffles);
  } catch (error) {
    console.error('Error getting active raffles:', error);
    res.status(500).json({ error: 'Error al obtener las rifas activas' });
  }
});

// Rutas de usuarios
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Rutas de ganadores
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
    console.error('Error getting winners:', error);
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
    console.error('Error getting stats:', error);
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
  console.error('Error global:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
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
  console.log('✅ Backend Lucky Snap listo para recibir conexiones\n');
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


