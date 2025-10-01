#!/usr/bin/env node

/**
 * 🔧 CORRECCIÓN ESPECÍFICA PARA RENDER
 * 
 * Este script corrige los problemas específicos identificados
 * en el backend de Render y optimiza la configuración.
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración optimizada para Render
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔧 CORRECCIÓN DE BACKEND PARA RENDER');
console.log('====================================');

// Cliente Prisma optimizado para Render
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty'
  });
  console.log('✅ Cliente Prisma inicializado');
} catch (error) {
  console.error('❌ Error inicializando Prisma:', error.message);
  process.exit(1);
}

// Middleware optimizado para Render
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

// Middleware de parsing con límites optimizados
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Middleware de logging optimizado para producción
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
  });
}

// Middleware de manejo de errores robusto
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    try {
      // Validar y limpiar datos antes de enviar
      const cleanData = JSON.parse(JSON.stringify(data));
      return originalJson.call(this, cleanData);
    } catch (error) {
      console.error('❌ Error serializando JSON:', error);
      return originalJson.call(this, { 
        success: false, 
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  };
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - Render Optimized', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '7.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check optimizado
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos
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

// ENDPOINT CRÍTICO: Órdenes con manejo optimizado
app.get('/api/admin/orders', async (req, res) => {
  try {
    console.log('📋 Obteniendo órdenes...');
    
    // Consulta optimizada con límites para evitar problemas de memoria
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
      take: 100 // Límite para evitar problemas de memoria en Render
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

// ENDPOINT CRÍTICO: Rifas con manejo optimizado
app.get('/api/admin/raffles', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas...');
    
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Límite para evitar problemas de memoria
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

// Rifas activas optimizadas
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas activas...');
    
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 20 // Límite para evitar problemas de memoria
    });
    
    console.log(`✅ Rifas activas obtenidas: ${raffles.length}`);
    res.json(raffles);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas activas:', error);
    res.status(500).json([]);
  }
});

// Estadísticas optimizadas
app.get('/api/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Consultas optimizadas con límites
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

// Crear órdenes optimizado
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('🛒 Creando nueva orden...');
    
    const { raffleId, userId, tickets, totalAmount, customer } = req.body;
    
    // Validación básica
    if (!raffleId || !userId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos de orden inválidos',
        message: 'Se requieren raffleId, userId y tickets válidos'
      });
    }
    
    // Verificar que la rifa existe
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) {
      return res.status(404).json({
        success: false,
        error: 'Rifa no encontrada',
        message: `La rifa con ID ${raffleId} no existe`
      });
    }
    
    // Crear o encontrar usuario
    let user;
    try {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            name: customer?.name || 'Cliente',
            email: customer?.email || '',
            phone: customer?.phone || '',
            district: customer?.district || ''
          }
        });
      }
    } catch (userError) {
      console.error('❌ Error con usuario:', userError);
      return res.status(500).json({
        success: false,
        error: 'Error procesando usuario',
        message: userError.message
      });
    }
    
    // Generar folio único
    const folio = `LKSNP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Calcular fecha de expiración (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Crear la orden
    const newOrder = await prisma.order.create({
      data: {
        folio,
        raffleId,
        userId: user.id,
        tickets,
        totalAmount: totalAmount || (tickets.length * raffle.price),
        status: 'PENDING',
        expiresAt
      },
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            price: true
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
      }
    });
    
    // Actualizar contador de boletos vendidos
    await prisma.raffle.update({
      where: { id: raffleId },
      data: { sold: { increment: tickets.length } }
    });
    
    console.log(`✅ Orden creada exitosamente: ${folio}`);
    
    res.json({
      success: true,
      data: newOrder,
      message: 'Orden creada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obtener orden por folio
app.get('/api/public/orders/folio/:folio', async (req, res) => {
  try {
    const { folio } = req.params;
    console.log('🔍 Buscando orden por folio:', folio);
    
    const order = await prisma.order.findUnique({
      where: { folio: folio.toUpperCase() },
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            price: true
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
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
        message: `No se encontró una orden con folio ${folio}`
      });
    }
    
    console.log('✅ Orden encontrada:', order.folio);
    res.json(order);
    
  } catch (error) {
    console.error('❌ Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
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

// Manejo de errores global optimizado
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

// Función de limpieza optimizada
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
  console.log(`🚀 Servidor Render optimizado iniciado en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Órdenes: http://localhost:${PORT}/api/admin/orders`);
  console.log(`🎯 Rifas: http://localhost:${PORT}/api/admin/raffles`);
  console.log('✅ Backend Lucky Snap - RENDER OPTIMIZADO listo\n');
});

// Manejo de errores no capturados optimizado
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  cleanup().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  cleanup().then(() => process.exit(1));
});
