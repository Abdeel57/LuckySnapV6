#!/usr/bin/env node

/**
 * 🚀 SERVIDOR DEFINITIVO PARA RENDER
 * 
 * Este es el servidor que funcionará 100% en Render
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 LUCKY SNAP BACKEND - SERVIDOR DEFINITIVO');
console.log('============================================');
console.log(`🌐 Puerto: ${PORT}`);
console.log(`📁 Directorio: ${process.cwd()}`);

// Cliente Prisma
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error'],
    errorFormat: 'pretty'
  });
  console.log('✅ Cliente Prisma inicializado');
} catch (error) {
  console.error('❌ Error inicializando Prisma:', error.message);
  // Continuar sin Prisma si hay error
}

// Middleware
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

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({
    message: 'Lucky Snap Backend - Servidor Definitivo',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      });
    } else {
      res.json({
        status: 'healthy',
        database: 'not_connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      });
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ENDPOINT CRÍTICO: Órdenes
app.get('/api/admin/orders', async (req, res) => {
  try {
    console.log('📋 Obteniendo órdenes...');
    
    if (!prisma) {
      return res.json([]);
    }

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
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    console.log(`✅ Órdenes obtenidas: ${orders.length}`);
    
    // Transformar datos para el frontend
    const transformedOrders = orders.map(order => ({
      ...order,
      customer: {
        id: order.user?.id || order.userId,
        name: order.user?.name || 'Sin nombre',
        phone: order.user?.phone || 'Sin teléfono',
        email: order.user?.email || '',
        district: order.user?.district || 'Sin distrito',
      },
      raffleTitle: order.raffle?.title || 'Rifa no encontrada',
      total: order.totalAmount || 0,
    }));
    
    res.json(transformedOrders);
    
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes',
      message: error.message,
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

// ENDPOINT CRÍTICO: Rifas
app.get('/api/admin/raffles', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas...');
    
    if (!prisma) {
      return res.json([]);
    }

    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    console.log(`✅ Rifas obtenidas: ${raffles.length}`);
    res.json(raffles);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las rifas',
      message: error.message,
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

// Rifas activas
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas activas...');
    
    if (!prisma) {
      return res.json([]);
    }

    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`✅ Rifas activas obtenidas: ${raffles.length}`);
    res.json(raffles);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas activas:', error);
    res.status(500).json([]);
  }
});

// Estadísticas
app.get('/api/admin/stats', async (req, res) => {
  try {
    if (!prisma) {
      return res.json({
        todaySales: 0,
        pendingOrders: 0,
        activeRaffles: 0,
        totalOrders: 0
      });
    }

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
    res.status(500).json({
      todaySales: 0,
      pendingOrders: 0,
      activeRaffles: 0,
      totalOrders: 0
    });
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

// Manejo de errores
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
app.use((req, res) => {
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
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('✅ Conexión a base de datos cerrada');
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error);
    }
  }
}

// Manejar señales de terminación
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor definitivo iniciado en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Órdenes: http://localhost:${PORT}/api/admin/orders`);
  console.log(`🎯 Rifas: http://localhost:${PORT}/api/admin/raffles`);
  console.log('✅ Backend Lucky Snap - SERVIDOR DEFINITIVO listo');
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
