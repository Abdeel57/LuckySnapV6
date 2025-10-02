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
    // Usar consultas SQL directas para evitar problemas de Prisma
    const raffles = await prisma.$queryRaw`SELECT id, title, description, "imageUrl", price, tickets, sold, "drawDate", status, slug, "createdAt", "updatedAt" FROM raffles LIMIT 5`;
    const users = await prisma.$queryRaw`SELECT id, name, phone, email, district, "createdAt", "updatedAt" FROM users LIMIT 5`;
    const orders = await prisma.$queryRaw`SELECT id, folio, "raffleId", "userId", tickets, total, status, "paymentMethod", notes, "createdAt", "updatedAt", "expiresAt" FROM orders LIMIT 5`;
    
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
    // Usar consulta SQL directa para evitar problemas de Prisma
    const orders = await prisma.$queryRaw`
      SELECT 
        o.id, o.folio, o."raffleId", o."userId", o.tickets, o.total, o.status, 
        o."paymentMethod", o.notes, o."createdAt", o."updatedAt", o."expiresAt",
        r.title as "raffleTitle",
        u.name, u.phone, u.email, u.district
      FROM orders o
      LEFT JOIN raffles r ON o."raffleId" = r.id
      LEFT JOIN users u ON o."userId" = u.id
      ORDER BY o."createdAt" DESC
    `;
    
    const transformedOrders = orders.map(order => ({
      ...order,
      customer: {
        id: order.userId,
        name: order.name || 'Sin nombre',
        phone: order.phone || 'Sin teléfono',
        email: order.email || '',
        district: order.district || 'Sin distrito',
      },
      raffleTitle: order.raffleTitle,
    }));
    
    res.json(transformedOrders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

app.get('/api/admin/raffles', async (req, res) => {
  try {
    // Usar consulta SQL directa
    const raffles = await prisma.$queryRaw`
      SELECT id, title, description, "imageUrl", price, tickets, sold, "drawDate", status, slug, "createdAt", "updatedAt"
      FROM raffles 
      ORDER BY "createdAt" DESC
    `;
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

    // Usar consultas SQL directas
    const todaySales = await prisma.$queryRaw`
      SELECT COALESCE(SUM(total), 0) as total_sales
      FROM orders 
      WHERE status = 'PAID' AND "createdAt" >= ${today}
    `;

    const pendingOrders = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE status = 'PENDING'
    `;

    const activeRaffles = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM raffles 
      WHERE status = 'active'
    `;

    res.json({
      todaySales: parseFloat(todaySales[0]?.total_sales || 0),
      pendingOrders: parseInt(pendingOrders[0]?.count || 0),
      activeRaffles: parseInt(activeRaffles[0]?.count || 0),
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Public endpoints
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    // Usar consulta SQL directa
    const raffles = await prisma.$queryRaw`
      SELECT id, title, description, "imageUrl", price, tickets, sold, "drawDate", status, slug, "createdAt", "updatedAt"
      FROM raffles 
      WHERE status = 'active'
      ORDER BY "createdAt" DESC
    `;
    res.json(raffles);
  } catch (error) {
    console.error('Error getting active raffles:', error);
    res.status(500).json({ error: 'Error al obtener rifas activas' });
  }
});

// CRÍTICO: Endpoint que estaba fallando - SOLUCIÓN DEFINITIVA
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { raffleId, userId, tickets, total, paymentMethod, notes, userData } = req.body;
    
    // Validar datos requeridos
    if (!raffleId) {
      return res.status(400).json({ error: 'raffleId es requerido' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }
    
    console.log('🔍 Verificando rifa:', raffleId);
    
    // Verificar que la rifa existe usando SQL directo
    const raffle = await prisma.$queryRaw`
      SELECT id, title, description, "imageUrl", price, tickets, sold, "drawDate", status, slug
      FROM raffles 
      WHERE id = ${raffleId}
    `;
    
    if (!raffle || raffle.length === 0) {
      console.log('❌ Rifa no encontrada:', raffleId);
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    console.log('✅ Rifa encontrada:', raffle[0].title);
    
    // Verificar que el usuario existe o crearlo usando SQL directo
    let user = await prisma.$queryRaw`
      SELECT id, name, phone, email, district
      FROM users 
      WHERE id = ${userId}
    `;
    
    if (!user || user.length === 0) {
      console.log('👤 Usuario no encontrado, creando nuevo usuario:', userId);
      
      if (!userData) {
        return res.status(400).json({ error: 'userData es requerido para crear usuario' });
      }
      
      // Crear usuario usando SQL directo
      await prisma.$queryRaw`
        INSERT INTO users (id, name, phone, email, district, "createdAt", "updatedAt")
        VALUES (${userId}, ${userData.name}, ${userData.phone}, ${userData.email || ''}, ${userData.district || ''}, NOW(), NOW())
      `;
      
      console.log('✅ Usuario creado:', userData.name);
    } else {
      console.log('✅ Usuario encontrado:', user[0].name);
    }
    
    // Generar folio único
    const folio = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📋 Creando orden con folio:', folio);
    
    // Crear orden usando SQL directo
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    await prisma.$queryRaw`
      INSERT INTO orders (id, folio, "raffleId", "userId", tickets, total, status, "paymentMethod", notes, "createdAt", "updatedAt", "expiresAt")
      VALUES (gen_random_uuid(), ${folio}, ${raffleId}, ${userId}, ${JSON.stringify(tickets || [])}, ${total || 0}, 'PENDING', ${paymentMethod || 'transfer'}, ${notes || ''}, NOW(), NOW(), ${expiresAt})
    `;
    
    console.log('✅ Orden creada exitosamente:', folio);
    
    // Obtener la orden creada
    const createdOrder = await prisma.$queryRaw`
      SELECT o.*, r.title as "raffleTitle", u.name as "userName"
      FROM orders o
      LEFT JOIN raffles r ON o."raffleId" = r.id
      LEFT JOIN users u ON o."userId" = u.id
      WHERE o.folio = ${folio}
    `;
    
    res.json(createdOrder[0]);
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
