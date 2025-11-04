const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(cors());
app.use(express.json());

// Configurar conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('🚀 Lucky Snap Backend DEFINITIVO iniciado');
console.log('📡 Puerto:', PORT);
console.log('🔗 URL:', `http://localhost:${PORT}`);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lucky Snap Backend funcionando',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Obtener rifas activas
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, description, "imageUrl", price, tickets, sold, "drawDate", status, slug
      FROM raffles 
      WHERE status = 'active' 
      ORDER BY "drawDate" ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting active raffles:', error);
    res.status(500).json({ error: 'Error al obtener rifas activas' });
  }
});

// Crear orden
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { raffleId, userId, tickets, total, paymentMethod, notes, userData } = req.body;

    if (!raffleId || !userId || !tickets || total === undefined) {
      return res.status(400).json({ error: 'Datos de orden incompletos' });
    }

    // Verificar que la rifa existe
    const raffleResult = await pool.query('SELECT id, title, tickets, sold FROM raffles WHERE id = $1', [raffleId]);
    if (raffleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }

    const raffle = raffleResult.rows[0];
    console.log('🔍 Rifa encontrada:', raffle.title);

    // Verificar o crear usuario
    let userResult = await pool.query('SELECT id, name FROM users WHERE id = $1', [userId]);
    let user = userResult.rows[0];

    if (!user) {
      if (!userData || !userData.name || !userData.phone) {
        return res.status(400).json({ error: 'userData es requerido para crear usuario' });
      }
      
      userResult = await pool.query(
        'INSERT INTO users (id, name, phone, email, district) VALUES ($1, $2, $3, $4, $5) RETURNING id, name',
        [userId, userData.name, userData.phone, userData.email || '', userData.district || '']
      );
      user = userResult.rows[0];
      console.log('✅ Usuario creado:', user.name);
    } else {
      console.log('✅ Usuario encontrado:', user.name);
    }

    // Crear orden
    const folio = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const orderResult = await pool.query(
      'INSERT INTO orders (id, folio, "raffleId", "userId", tickets, total, status, "paymentMethod", notes, "expiresAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [uuidv4(), folio, raffleId, userId, tickets, total, 'PENDING', paymentMethod || null, notes || null, expiresAt]
    );
    
    const newOrder = orderResult.rows[0];
    console.log('✅ Orden creada:', newOrder.folio);

    // Actualizar tickets vendidos
    await pool.query(
      'UPDATE raffles SET sold = sold + $1 WHERE id = $2',
      [tickets.length, raffleId]
    );

    res.json(newOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      error: 'Error al crear la orden',
      details: error.message
    });
  }
});

// Obtener todas las órdenes (admin)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        r.title as "raffleTitle",
        u.name as "userName",
        u.phone as "userPhone",
        u.email as "userEmail",
        u.district as "userDistrict"
      FROM orders o
      LEFT JOIN raffles r ON o."raffleId" = r.id
      LEFT JOIN users u ON o."userId" = u.id
      ORDER BY o."createdAt" DESC
    `);
    
    // Transformar para compatibilidad con frontend
    const orders = result.rows.map(order => ({
      ...order,
      customer: {
        id: order.userId,
        name: order.userName || 'Sin nombre',
        phone: order.userPhone || 'Sin teléfono',
        email: order.userEmail || '',
        district: order.userDistrict || 'Sin distrito',
      }
    }));
    
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// Obtener estadísticas (admin)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ventas de hoy
    const todaySalesResult = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = $1 AND "createdAt" >= $2',
      ['PAID', today]
    );

    // Total de órdenes
    const totalOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    
    // Órdenes pendientes
    const pendingOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['PENDING']);

    // Total de rifas
    const totalRafflesResult = await pool.query('SELECT COUNT(*) as count FROM raffles');

    res.json({
      todaySales: parseFloat(todaySalesResult.rows[0].total) || 0,
      totalOrders: parseInt(totalOrdersResult.rows[0].count) || 0,
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count) || 0,
      totalRaffles: parseInt(totalRafflesResult.rows[0].count) || 0
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Manejar rutas no encontradas
// CRÍTICO: No usar '*' como patrón - incompatible con path-to-regexp v6+
// Usar middleware sin patrón para capturar todas las rutas no manejadas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🎉 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Disponible en: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
