const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    /^http:\/\/localhost:5173$/,
    /\.onrender\.com$/,
    /\.netlify\.app$/,
    /dashboard\.render\.com$/
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Lucky Snap Backend funcionando'
  });
});

// Endpoint de diagnóstico
app.get('/api/debug', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({ take: 5 });
    const users = await prisma.user.findMany({ take: 5 });
    const orders = await prisma.order.findMany({ take: 5 });
    
    res.json({
      raffles: raffles.length,
      users: users.length,
      orders: orders.length,
      sampleRaffle: raffles[0] || null,
      sampleUser: users[0] || null,
      sampleOrder: orders[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Lucky Snap Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      orders: '/api/admin/orders',
      publicOrders: '/api/public/orders'
    }
  });
});

// Admin endpoints
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        raffle: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const transformedOrders = orders.map(order => ({
      ...order,
      customer: {
        id: order.user.id,
        name: order.user.name || 'Sin nombre',
        phone: order.user.phone || 'Sin teléfono',
        email: order.user.email || '',
        district: order.user.district || 'Sin distrito',
      },
      raffleTitle: order.raffle.title,
      total: order.total,
    }));
    
    res.json(transformedOrders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

app.get('/api/admin/raffles', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(raffles);
  } catch (error) {
    console.error('Error getting raffles:', error);
    res.status(500).json({ error: 'Error al obtener las rifas' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: 'PAID',
        createdAt: { gte: today },
      },
    });

    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
    });

    const activeRaffles = await prisma.raffle.count({
      where: { status: 'active' },
    });

    res.json({
      todaySales: todaySales._sum.total || 0,
      pendingOrders,
      activeRaffles,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Public endpoints
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(raffles);
  } catch (error) {
    console.error('Error getting active raffles:', error);
    res.status(500).json({ error: 'Error al obtener rifas activas' });
  }
});

// CRÍTICO: Endpoint que estaba fallando
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { raffleId, userId, tickets, total, paymentMethod, notes } = req.body;
    
    // Validar datos requeridos
    if (!raffleId) {
      return res.status(400).json({ error: 'raffleId es requerido' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }
    
    console.log('🔍 Verificando rifa:', raffleId);
    
    // Verificar que la rifa existe
    const raffle = await prisma.raffle.findUnique({ 
      where: { id: raffleId } 
    });
    
    if (!raffle) {
      console.log('❌ Rifa no encontrada:', raffleId);
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    console.log('✅ Rifa encontrada:', raffle.title);
    
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', userId);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('✅ Usuario encontrado:', user.name);
    
    // Generar folio único
    const folio = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📋 Creando orden con folio:', folio);
    
    // Crear orden
    const order = await prisma.order.create({
      data: {
        folio,
        raffleId,
        userId,
        tickets: tickets || [],
        total: total || 0,
        status: 'PENDING',
        paymentMethod,
        notes,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
      include: {
        raffle: true,
        user: true,
      },
    });
    
    console.log('✅ Orden creada exitosamente:', order.folio);
    
    res.json(order);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al crear la orden',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Lucky Snap Backend ejecutándose en puerto ${port}`);
  console.log(`📡 API disponible en: http://localhost:${port}/api`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});

module.exports = app;
