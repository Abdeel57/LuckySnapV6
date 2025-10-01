// Script para iniciar el backend con Prisma
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar URL de base de datos específica
const DATABASE_URL = 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://jocular-brioche-6fbeda.netlify.app',
    /\.onrender\.com$/,
    /\.netlify\.app$/
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas públicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - CON PRISMA + POSTGRESQL', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    database: 'PostgreSQL'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const raffleCount = await prisma.raffle.count();
    const orderCount = await prisma.order.count();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      users: userCount,
      raffles: raffleCount,
      orders: orderCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Configuración
app.get('/api/public/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'main_settings' }
    });
    res.json(settings || {});
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rifas activas
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' }
    });
    console.log('📋 Active raffles:', raffles.map(r => ({ id: r.id, title: r.title, slug: r.slug })));
    res.json(raffles);
  } catch (error) {
    console.error('❌ Error loading active raffles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rifa por slug
app.get('/api/public/raffles/slug/:slug', async (req, res) => {
  try {
    console.log('🔍 Searching for raffle with slug:', req.params.slug);
    
    const raffle = await prisma.raffle.findUnique({
      where: { slug: req.params.slug }
    });
    
    if (raffle) {
      console.log('✅ Raffle found:', { id: raffle.id, title: raffle.title });
      res.json(raffle);
    } else {
      console.log('❌ Raffle not found for slug:', req.params.slug);
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    console.error('❌ Error loading raffle by slug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rifa por ID
app.get('/api/public/raffles/:id', async (req, res) => {
  try {
    const raffle = await prisma.raffle.findUnique({
      where: { id: req.params.id }
    });
    
    if (raffle) {
      console.log('✅ Raffle found by ID:', { id: raffle.id, title: raffle.title });
      res.json(raffle);
    } else {
      console.log('❌ Raffle not found for ID:', req.params.id);
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    console.error('❌ Error loading raffle by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Boletos ocupados
app.get('/api/public/raffles/:id/occupied-tickets', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        raffleId: req.params.id,
        status: { not: 'CANCELLED' }
      }
    });
    
    const occupiedTickets = [];
    orders.forEach(order => {
      if (order.tickets && Array.isArray(order.tickets)) {
        occupiedTickets.push(...order.tickets);
      }
    });
    
    const uniqueOccupiedTickets = [...new Set(occupiedTickets)].sort((a, b) => a - b);
    
    console.log('✅ Occupied tickets loaded for raffle:', req.params.id, 'Count:', uniqueOccupiedTickets.length);
    res.json(uniqueOccupiedTickets);
  } catch (error) {
    console.error('❌ Error loading occupied tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear orden
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('📝 Creating new order with data:', req.body);
    
    // Validación básica
    if (!req.body.customer || !req.body.customer.name || !req.body.customer.phone) {
      console.log('❌ Missing customer data');
      return res.status(400).json({ error: 'Datos del cliente son requeridos' });
    }
    
    if (!req.body.raffleId) {
      console.log('❌ Missing raffle ID');
      return res.status(400).json({ error: 'ID de rifa es requerido' });
    }
    
    if (!req.body.tickets || req.body.tickets.length === 0) {
      console.log('❌ No tickets selected');
      return res.status(400).json({ error: 'Debe seleccionar al menos un boleto' });
    }
    
    // Crear o encontrar usuario
    const user = await prisma.user.upsert({
      where: { email: req.body.customer.email || `${req.body.customer.phone}@temp.com` },
      update: {
        name: req.body.customer.name.trim()
      },
      create: {
        email: req.body.customer.email || `${req.body.customer.phone}@temp.com`,
        name: req.body.customer.name.trim()
      }
    });
    
    // Crear orden
    const order = await prisma.order.create({
      data: {
        folio: `ORD-${Date.now()}`,
        raffleId: req.body.raffleId,
        userId: user.id,
        tickets: req.body.tickets,
        totalAmount: req.body.totalAmount || 0,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    });
    
    console.log('✅ Order created successfully:', {
      id: order.id,
      folio: order.folio,
      userId: user.id,
      tickets: order.tickets.length,
      amount: order.totalAmount,
      raffleId: order.raffleId
    });
    
    res.json({
      ...order,
      customer: {
        name: req.body.customer.name,
        phone: req.body.customer.phone,
        email: req.body.customer.email
      }
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener orden por folio
app.get('/api/public/orders/folio/:folio', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { folio: req.params.folio },
      include: {
        user: true,
        raffle: true
      }
    });
    
    if (order) {
      console.log('✅ Order found by folio:', order.folio);
      res.json({
        ...order,
        customer: {
          name: order.user.name,
          email: order.user.email
        }
      });
    } else {
      console.log('❌ Order not found for folio:', req.params.folio);
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('❌ Error loading order by folio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Estadísticas
app.get('/api/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' }
    });
    
    const activeRaffles = await prisma.raffle.count({
      where: { status: 'active' }
    });
    
    const totalRaffles = await prisma.raffle.count();
    const totalOrders = await prisma.order.count();
    
    const totalRevenue = await prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true }
    });
    
    const totalWinners = await prisma.winner.count();
    
    const stats = {
      todaySales: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      pendingOrders: pendingOrders,
      activeRaffles: activeRaffles,
      totalRaffles: totalRaffles,
      totalOrders: totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalWinners: totalWinners
    };
    
    console.log('📊 Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// ===== NUEVOS ENDPOINTS DE ANALYTICS =====

// Dashboard completo de analytics
app.get('/api/admin/analytics/dashboard-summary', async (req, res) => {
  try {
    // Sales Trends
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'PAID'
      }
    });

    const salesTrends = recentOrders.map(order => ({
      date: order.createdAt.toISOString().split('T')[0],
      sales: order.tickets.length,
      orders: 1,
      revenue: order.totalAmount
    }));

    // Customer Insights
    const customers = await prisma.user.findMany({
      include: {
        orders: {
          where: { status: 'PAID' }
        }
      }
    });

    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.createdAt >= thirtyDaysAgo).length;
    const returningCustomers = customers.filter(c => c.orders.length > 1).length;
    
    let totalRevenue = 0;
    let totalOrders = 0;
    customers.forEach(customer => {
      if (customer.orders) {
        customer.orders.forEach(order => {
          totalRevenue += order.totalAmount;
          totalOrders += 1;
        });
      }
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const topCustomers = customers
      .map(customer => {
        const totalSpent = customer.orders ? customer.orders.reduce((sum, order) => sum + order.totalAmount, 0) : 0;
        const lastOrder = customer.orders && customer.orders.length > 0 
          ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
          : null;

        return {
          id: customer.id,
          name: customer.name || 'Sin nombre',
          email: customer.email,
          totalSpent,
          orderCount: customer.orders ? customer.orders.length : 0,
          lastOrder: lastOrder ? lastOrder.toISOString() : null,
        };
      })
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Conversion Funnel (simulado)
    const completedOrders = await prisma.order.count({ where: { status: 'PAID' } });
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    
    const conversionFunnel = {
      visitors: completedOrders * 100, // Simulado
      interested: completedOrders * 20,
      addedToCart: completedOrders * 10,
      initiatedCheckout: completedOrders * 5,
      completedPurchase: completedOrders,
      conversionRate: 1.0 // 1% conversión típica
    };

    // ROI Metrics
    const totalAdSpend = totalRevenue * 0.2; // 20% del revenue como ad spend
    const uniqueCustomers = new Set(recentOrders.map(order => order.userId)).size;
    
    const roiMetrics = {
      totalRevenue,
      totalAdSpend,
      totalOrders: completedOrders,
      costPerAcquisition: completedOrders > 0 ? totalAdSpend / completedOrders : 0,
      returnOnAdSpend: totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0,
      revenuePerCustomer: uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0
    };

    // Popular Raffles
    const raffles = await prisma.raffle.findMany({
      include: {
        orders: {
          where: { status: 'PAID' }
        }
      }
    });

    const popularRaffles = raffles
      .map(raffle => {
        const ticketsSold = raffle.orders ? raffle.orders.reduce((sum, order) => sum + order.tickets.length, 0) : 0;
        const revenue = raffle.orders ? raffle.orders.reduce((sum, order) => sum + order.total, 0) : 0;
        const conversionRate = 100 > 0 ? (ticketsSold / 100) * 100 : 0;

        return {
          id: raffle.id,
          title: raffle.title,
          ticketsSold,
          revenue,
          conversionRate: Math.round(conversionRate * 100) / 100,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Abandonment Analysis
    const abandonedOrders = await prisma.order.findMany({
      where: { status: 'PENDING' }
    });

        const totalAbandonedRevenue = abandonedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalAllOrders = completedOrders + pendingOrders;
    
    const abandonmentAnalysis = {
      cartAbandonmentRate: totalAllOrders > 0 ? (pendingOrders / totalAllOrders) * 100 : 0,
      checkoutAbandonmentRate: totalAllOrders > 0 ? (pendingOrders / totalAllOrders) * 100 : 0,
      totalAbandonedRevenue
    };

    const dashboardData = {
      salesTrends,
      customerInsights: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        averageOrderValue,
        customerLifetimeValue,
        topCustomers
      },
      conversionFunnel,
      roiMetrics,
      popularRaffles,
      abandonmentAnalysis
    };

    console.log('📊 Analytics dashboard data generated');
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Error generating analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Meta Pixel Dashboard
app.get('/api/admin/meta/dashboard', async (req, res) => {
  try {
    // Audiences
    const frequentBuyers = await prisma.user.findMany({
      include: {
        orders: {
          where: { status: 'PAID' }
        }
      }
    });

    const frequentBuyersList = frequentBuyers.filter(user => user.orders && user.orders.length >= 3);
    const highValueCustomers = frequentBuyers.filter(user => {
        const totalSpent = user.orders ? user.orders.reduce((sum, order) => sum + order.totalAmount, 0) : 0;
      return totalSpent >= 500;
    });

    const cartAbandoners = await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      distinct: ['userId']
    });

    const audiences = [];

    if (frequentBuyersList.length > 0) {
      audiences.push({
        id: 'aud_frequent_buyers',
        name: 'Compradores Frecuentes',
        description: 'Usuarios con 3 o más compras completadas',
        criteria: { type: 'frequent_buyers', conditions: { minOrders: 3 } },
        size: frequentBuyersList.length,
        lastUpdated: new Date().toISOString()
      });
    }

    if (highValueCustomers.length > 0) {
      audiences.push({
        id: 'aud_high_value',
        name: 'Clientes de Alto Valor',
        description: 'Usuarios que han gastado $500 o más',
        criteria: { type: 'high_value', conditions: { minSpent: 500 } },
        size: highValueCustomers.length,
        lastUpdated: new Date().toISOString()
      });
    }

    if (cartAbandoners.length > 0) {
      audiences.push({
        id: 'aud_cart_abandoners',
        name: 'Abandonadores de Carrito',
        description: 'Usuarios que iniciaron una compra pero no la completaron',
        criteria: { type: 'cart_abandoners', conditions: { hasPendingOrders: true } },
        size: cartAbandoners.length,
        lastUpdated: new Date().toISOString()
      });
    }

    // Campaigns (simulado)
    const orders = await prisma.order.findMany({
      where: { status: 'PAID' },
      include: { raffle: true }
    });

    const raffles = await prisma.raffle.findMany({
      include: {
        orders: {
          where: { status: 'PAID' }
        }
      }
    });

    const campaigns = raffles.map((raffle, index) => {
      const raffleOrders = raffle.orders || [];
      const raffleRevenue = raffleOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const conversions = raffleOrders.length;
      
      const budget = raffleRevenue * 0.2;
      const spent = budget * 0.8;
      const impressions = conversions * 1000;
      const clicks = conversions * 50;
      const costPerClick = clicks > 0 ? spent / clicks : 0;
      const costPerConversion = conversions > 0 ? spent / conversions : 0;
      const returnOnAdSpend = spent > 0 ? raffleRevenue / spent : 0;

      return {
        campaignId: `campaign_${raffle.id}`,
        name: `Campaña ${raffle.title}`,
        status: raffle.status === 'active' ? 'active' : 'paused',
        budget,
        spent,
        impressions,
        clicks,
        conversions,
        costPerClick: Math.round(costPerClick * 100) / 100,
        costPerConversion: Math.round(costPerConversion * 100) / 100,
        returnOnAdSpend: Math.round(returnOnAdSpend * 100) / 100,
      };
    });

    // Pixel Config
    const pixelConfig = {
      pixelId: process.env.META_PIXEL_ID || '1234567890123456',
      events: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'],
      isActive: true,
      lastEvent: new Date().toISOString()
    };

    const metaData = {
      audiences,
      campaigns,
      pixelConfig
    };

    console.log('🎯 Meta dashboard data generated');
    res.json(metaData);
  } catch (error) {
    console.error('❌ Error generating Meta data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== ENDPOINTS ADMINISTRATIVOS =====

// Obtener todas las órdenes
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        raffle: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Loaded ${orders.length} orders for admin`);
    res.json(orders);
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar estado de orden
app.patch('/api/admin/orders/:folio/status', async (req, res) => {
  try {
    const { folio } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating order ${folio} to status: ${status}`);
    
    const order = await prisma.order.findUnique({ 
      where: { folio },
      include: { user: true, raffle: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Actualizar estado
    const updatedOrder = await prisma.order.update({
      where: { folio },
      data: { status: status },
      include: { user: true, raffle: true }
    });
    
    // Si se marca como PAID, actualizar contadores
    if (status === 'PAID' && order.status !== 'PAID') {
      await prisma.raffle.update({
        where: { id: order.raffleId },
        data: { sold: { increment: order.tickets.length } }
      });
      
      console.log(`✅ Order ${folio} marked as PAID, updated raffle sold count`);
      
      // TODO: Enviar confirmación automática de pago
      console.log(`📧 Payment confirmation would be sent for order ${folio}`);
    }
    
    // Si se cancela, revertir contadores
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await prisma.raffle.update({
        where: { id: order.raffleId },
        data: { sold: { decrement: order.tickets.length } }
      });
      
      console.log(`❌ Order ${folio} cancelled, reverted raffle sold count`);
    }
    
    console.log(`✅ Order ${folio} status updated to ${status}`);
    res.json(updatedOrder);
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener todas las rifas
app.get('/api/admin/raffles', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🎟️ Loaded ${raffles.length} raffles for admin`);
    res.json(raffles);
  } catch (error) {
    console.error('❌ Error loading raffles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener rifas finalizadas
app.get('/api/admin/raffles/finished', async (req, res) => {
  try {
    const raffles = await prisma.raffle.findMany({
      where: { status: 'finished' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🏁 Loaded ${raffles.length} finished raffles`);
    res.json(raffles);
  } catch (error) {
    console.error('❌ Error loading finished raffles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear nueva rifa
app.post('/api/admin/raffles', async (req, res) => {
  try {
    const raffleData = {
      ...req.body,
      slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      status: 'active'
    };
    
    const raffle = await prisma.raffle.create({
      data: raffleData
    });
    
    console.log(`✅ New raffle created: ${raffle.title} (${raffle.id})`);
    res.json(raffle);
  } catch (error) {
    console.error('❌ Error creating raffle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar rifa
app.patch('/api/admin/raffles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Si se actualiza el título, regenerar slug
    if (updateData.title) {
      updateData.slug = updateData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    
    const raffle = await prisma.raffle.update({
      where: { id },
      data: updateData
    });
    
    console.log(`✅ Raffle ${id} updated`);
    res.json(raffle);
  } catch (error) {
    console.error('❌ Error updating raffle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Eliminar rifa
app.delete('/api/admin/raffles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.raffle.delete({
      where: { id }
    });
    
    console.log(`🗑️ Raffle ${id} deleted`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting raffle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener ganadores
app.get('/api/admin/winners', async (req, res) => {
  try {
    const winners = await prisma.winner.findMany({
      include: {
        user: true,
        raffle: true,
        ticket: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🏆 Loaded ${winners.length} winners`);
    res.json(winners);
  } catch (error) {
    console.error('❌ Error loading winners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Realizar sorteo
app.post('/api/admin/winners/draw', async (req, res) => {
  try {
    const { raffleId } = req.body;
    
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: { orders: { where: { status: 'PAID' } } }
    });
    
    if (!raffle) {
      return res.status(404).json({ error: 'Raffle not found' });
    }
    
    // Lógica de sorteo (simplificada)
    const allTickets = [];
    raffle.orders.forEach(order => {
      order.tickets.forEach(ticketNumber => {
        allTickets.push({ ticketNumber, orderId: order.id, userId: order.userId });
      });
    });
    
    if (allTickets.length === 0) {
      return res.status(400).json({ error: 'No tickets available for drawing' });
    }
    
    // Seleccionar ganador aleatorio
    const winnerTicket = allTickets[Math.floor(Math.random() * allTickets.length)];
    
    const winner = await prisma.winner.create({
      data: {
        raffleId: raffle.id,
        userId: winnerTicket.userId,
        ticketId: winnerTicket.ticketNumber.toString()
      }
    });
    
    // Marcar rifa como finalizada
    await prisma.raffle.update({
      where: { id: raffleId },
      data: { status: 'finished' }
    });
    
    console.log(`🎉 Winner drawn for raffle ${raffle.title}: ticket ${winnerTicket.ticketNumber}`);
    res.json(winner);
  } catch (error) {
    console.error('❌ Error drawing winner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear ganador manualmente
app.post('/api/admin/winners', async (req, res) => {
  try {
    const winner = await prisma.winner.create({
      data: req.body
    });
    
    console.log(`🏆 Winner created manually: ${winner.id}`);
    res.json(winner);
  } catch (error) {
    console.error('❌ Error creating winner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Eliminar ganador
app.delete('/api/admin/winners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.winner.delete({
      where: { id }
    });
    
    console.log(`🗑️ Winner ${id} deleted`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting winner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener usuarios
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        orders: true,
        tickets: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`👥 Loaded ${users.length} users for admin`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error loading users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear usuario
app.post('/api/admin/users', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: req.body
    });
    
    console.log(`✅ New user created: ${user.email} (${user.id})`);
    res.json(user);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar usuario
app.patch('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: req.body
    });
    
    console.log(`✅ User ${id} updated`);
    res.json(user);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Eliminar usuario
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id }
    });
    
    console.log(`🗑️ User ${id} deleted`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar configuraciones
app.post('/api/admin/settings', async (req, res) => {
  try {
    const settingsData = {
      ...req.body,
      paymentAccounts: JSON.stringify(req.body.paymentAccounts || []),
      faqs: JSON.stringify(req.body.faqs || [])
    };
    
    const settings = await prisma.settings.upsert({
      where: { id: 'main_settings' },
      update: settingsData,
      create: { id: 'main_settings', ...settingsData }
    });
    
    console.log(`⚙️ Settings updated`);
    res.json(settings);
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tracking endpoints
app.post('/api/tracking/event', (req, res) => {
  console.log('📊 Meta Pixel Event:', req.body);
  res.json({ success: true, eventId: `evt_${Date.now()}` });
});

app.post('/api/tracking/pageview', (req, res) => {
  console.log('📊 Page View tracked:', req.body);
  res.json({ success: true });
});

app.post('/api/tracking/view-content', (req, res) => {
  console.log('📊 View Content tracked:', req.body);
  res.json({ success: true });
});

app.post('/api/tracking/add-to-cart', (req, res) => {
  console.log('📊 Add to Cart tracked:', req.body);
  res.json({ success: true });
});

app.post('/api/tracking/initiate-checkout', (req, res) => {
  console.log('📊 Initiate Checkout tracked:', req.body);
  res.json({ success: true });
});

app.post('/api/tracking/purchase', (req, res) => {
  console.log('📊 Purchase tracked:', req.body);
  res.json({ success: true });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Lucky Snap Backend CON PRISMA funcionando en puerto ${PORT}`);
  console.log(`🗄️ Base de datos: PostgreSQL`);
  console.log(`🔗 URL: ${DATABASE_URL.split('@')[1]}`);
  
  try {
    // Probar conexión
    const userCount = await prisma.user.count();
    const raffleCount = await prisma.raffle.count();
    const orderCount = await prisma.order.count();
    
    console.log(`📊 Datos cargados: ${raffleCount} rifas, ${orderCount} órdenes, ${userCount} usuarios`);
    console.log(`✅ Backend listo para recibir peticiones`);
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
  }
});
