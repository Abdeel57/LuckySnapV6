// Backend simple y funcional para Lucky Snap
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.json());

// Datos en memoria (para que funcione inmediatamente)
let settings = {
  id: 'main_settings',
  siteName: 'Lucky Snap',
  paymentAccounts: [],
  faqs: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

let raffles = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max',
    description: 'El último iPhone con todas las características premium',
    heroImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'],
    tickets: 100,
    sold: 25,
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    packs: [
      { name: 'Pack Básico', tickets: 1, price: 50 },
      { name: 'Pack Premium', tickets: 5, price: 200 },
      { name: 'Pack VIP', tickets: 10, price: 350 }
    ],
    bonuses: ['Descuento 10%', 'Boletos extra'],
    status: 'active',
    slug: 'iphone-15-pro-max',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let orders = [];
let winners = [];
let users = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@luckysnap.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Rutas públicas
app.get('/', (req, res) => {
  res.json({ message: 'Lucky Snap API - Funcionando correctamente', status: 'ok' });
});

app.get('/api/public/settings', (req, res) => {
  res.json(settings);
});

app.get('/api/public/raffles/active', (req, res) => {
  res.json(raffles.filter(r => r.status === 'active'));
});

app.get('/api/public/raffles/slug/:slug', (req, res) => {
  const raffle = raffles.find(r => r.slug === req.params.slug);
  if (raffle) {
    res.json(raffle);
  } else {
    res.status(404).json({ error: 'Raffle not found' });
  }
});

app.get('/api/public/raffles/:id/occupied-tickets', (req, res) => {
  res.json([]);
});

app.get('/api/public/winners', (req, res) => {
  res.json(winners);
});

app.post('/api/public/orders', (req, res) => {
  const order = {
    id: Date.now().toString(),
    ...req.body,
    folio: `ORD-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
  orders.push(order);
  res.json(order);
});

app.get('/api/public/orders/folio/:folio', (req, res) => {
  const order = orders.find(o => o.folio === req.params.folio);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Rutas de administración
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalRaffles: raffles.length,
    activeRaffles: raffles.filter(r => r.status === 'active').length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    totalWinners: winners.length
  });
});

app.get('/api/admin/raffles', (req, res) => {
  res.json(raffles);
});

app.post('/api/admin/raffles', (req, res) => {
  const raffle = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  raffles.push(raffle);
  res.json(raffle);
});

app.patch('/api/admin/raffles/:id', (req, res) => {
  const index = raffles.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    raffles[index] = { ...raffles[index], ...req.body, updatedAt: new Date() };
    res.json(raffles[index]);
  } else {
    res.status(404).json({ error: 'Raffle not found' });
  }
});

app.delete('/api/admin/raffles/:id', (req, res) => {
  const index = raffles.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    raffles.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Raffle not found' });
  }
});

app.get('/api/admin/orders', (req, res) => {
  res.json(orders);
});

app.patch('/api/admin/orders/:folio/status', (req, res) => {
  const order = orders.find(o => o.folio === req.params.folio);
  if (order) {
    order.status = req.body.status;
    order.updatedAt = new Date();
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.get('/api/admin/winners', (req, res) => {
  res.json(winners);
});

app.post('/api/admin/winners', (req, res) => {
  const winner = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date()
  };
  winners.push(winner);
  res.json(winner);
});

app.get('/api/admin/users', (req, res) => {
  res.json(users);
});

app.post('/api/admin/users', (req, res) => {
  const user = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.push(user);
  res.json(user);
});

app.post('/api/admin/settings', (req, res) => {
  settings = { ...settings, ...req.body, updatedAt: new Date() };
  res.json(settings);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Lucky Snap Backend funcionando en puerto ${PORT}`);
  console.log(`📊 Datos en memoria: ${raffles.length} rifas, ${orders.length} órdenes`);
});
