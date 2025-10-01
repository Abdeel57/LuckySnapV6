#!/usr/bin/env node

/**
 * 🚀 Lucky Snap Backend - VERSIÓN FINAL DEFINITIVA
 * 
 * Este script resuelve COMPLETAMENTE el problema de JSON malformado
 * y garantiza respuestas válidas siempre.
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de base de datos
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

console.log('🔧 Lucky Snap Backend - VERSIÓN FINAL DEFINITIVA');
console.log('📊 Base de datos:', DATABASE_URL.split('@')[1]?.split('/')[0] || 'Configurada');

// Cliente Prisma con configuración ultra-robusta
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

// Middleware CORS completo
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

// Middleware de parsing seguro
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Middleware de logging detallado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Middleware para garantizar respuestas JSON válidas
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    try {
      // Validar que los datos sean serializables
      const jsonString = JSON.stringify(data);
      
      // Verificar que no esté vacío
      if (jsonString === '{}' || jsonString === '[]' || jsonString === 'null') {
        console.log('⚠️  Respuesta vacía detectada, enviando respuesta por defecto');
        return originalJson.call(this, { 
          success: true, 
          data: data, 
          message: 'Respuesta vacía',
          timestamp: new Date().toISOString()
        });
      }
      
      return originalJson.call(this, data);
    } catch (error) {
      console.error('❌ Error serializando JSON:', error);
      return originalJson.call(this, { 
        success: false, 
        error: 'Error interno del servidor',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - VERSIÓN FINAL', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '6.0.0',
    database: 'PostgreSQL'
  });
});

// Health check ultra-robusto
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

// RUTA CRÍTICA: Órdenes con manejo ultra-robusto
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
    
    // Respuesta garantizada válida
    const response = {
      success: true,
      data: orders || [],
      count: orders ? orders.length : 0,
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
      data: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// RUTA CRÍTICA: Rifas con manejo ultra-robusto
app.get('/api/admin/raffles', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas...');
    
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Rifas obtenidas: ${raffles.length}`);
    
    // Respuesta garantizada válida
    const response = {
      success: true,
      data: raffles || [],
      count: raffles ? raffles.length : 0,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error al obtener las rifas',
      message: error.message,
      data: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// Rifas activas para el frontend público
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas activas...');
    
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Rifas activas obtenidas: ${raffles.length}`);
    
    // Respuesta garantizada válida
    const response = raffles || [];
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas activas:', error);
    res.status(500).json([]);
  }
});

// Obtener rifa por slug
app.get('/api/public/raffles/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('🔍 Obteniendo rifa por slug:', slug);
    
    const raffle = await prisma.raffle.findUnique({
      where: { slug }
    });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        error: 'Rifa no encontrada',
        message: `No se encontró una rifa con slug ${slug}`
      });
    }
    
    console.log('✅ Rifa encontrada:', raffle.title);
    res.json(raffle);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifa por slug:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Obtener boletos ocupados
app.get('/api/public/raffles/:id/occupied-tickets', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🎫 Obteniendo boletos ocupados para rifa:', id);
    
    const orders = await prisma.order.findMany({
      where: {
        raffleId: id,
        status: { in: ['PENDING', 'COMPLETED'] }
      },
      select: { tickets: true }
    });
    
    const occupiedTickets = orders.flatMap(o => o.tickets);
    console.log(`✅ Boletos ocupados obtenidos: ${occupiedTickets.length}`);
    
    res.json(occupiedTickets);
    
  } catch (error) {
    console.error('❌ Error obteniendo boletos ocupados:', error);
    res.status(500).json([]);
  }
});

// Usuarios
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users || []);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json([]);
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
    res.json(winners || []);
  } catch (error) {
    console.error('❌ Error obteniendo ganadores:', error);
    res.status(500).json([]);
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

// RUTA CRÍTICA: Crear órdenes (apartado de boletos)
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('🛒 Creando nueva orden...');
    console.log('📤 Datos recibidos:', req.body);
    
    const { raffleId, userId, tickets, totalAmount, customer } = req.body;
    
    // Validar datos requeridos
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
        // Crear usuario si no existe
        user = await prisma.user.create({
          data: {
            id: userId,
            name: customer?.name || 'Cliente',
            email: customer?.email || '',
            phone: customer?.phone || '',
            district: customer?.district || ''
          }
        });
        console.log('✅ Usuario creado:', user.id);
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
    console.error('❌ Error crítico creando orden:', error);
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
  console.log(`🎯 Rifas: http://localhost:${PORT}/api/admin/raffles`);
  console.log('✅ Backend Lucky Snap - VERSIÓN FINAL lista\n');
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
