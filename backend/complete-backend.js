// Backend completo con TODA la funcionalidad de configuración
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Datos en memoria con configuración completa
let settings = {
  id: 'main_settings',
  siteName: 'Lucky Snap',
  appearance: {
    colors: {
      backgroundPrimary: '#1a1a1a',
      backgroundSecondary: '#2d2d2d',
      accent: '#ff6b6b',
      action: '#4ecdc4'
    },
    logo: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
    favicon: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=32&h=32&fit=crop'
  },
  contactInfo: {
    whatsapp: '+1234567890',
    email: 'contacto@luckysnap.com',
    phone: '+1234567890',
    address: 'Tu dirección aquí'
  },
  socialLinks: {
    facebookUrl: 'https://facebook.com/luckysnap',
    instagramUrl: 'https://instagram.com/luckysnap',
    twitterUrl: 'https://twitter.com/luckysnap',
    youtubeUrl: 'https://youtube.com/luckysnap'
  },
  paymentAccounts: [
    {
      name: 'Banco Principal',
      accountNumber: '1234567890',
      accountHolder: 'Lucky Snap',
      type: 'bank'
    }
  ],
  faqs: [
    {
      question: '¿Cómo funcionan las rifas?',
      answer: 'Las rifas funcionan comprando boletos y participando en sorteos.'
    },
    {
      question: '¿Cuándo se realizan los sorteos?',
      answer: 'Los sorteos se realizan en las fechas especificadas en cada rifa.'
    }
  ],
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
  res.json({ 
    message: 'Lucky Snap API - CONFIGURACIÓN COMPLETA', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    raffles: raffles.length,
    orders: orders.length,
    users: users.length
  });
});

// Configuración completa
app.get('/api/public/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/admin/settings', (req, res) => {
  try {
    console.log('📝 Updating settings:', {
      siteName: req.body.siteName,
      hasAppearance: !!req.body.appearance,
      hasContactInfo: !!req.body.contactInfo,
      hasSocialLinks: !!req.body.socialLinks,
      paymentAccounts: req.body.paymentAccounts?.length || 0,
      faqs: req.body.faqs?.length || 0
    });

    // Actualizar configuración completa
    settings = {
      ...settings,
      siteName: req.body.siteName || settings.siteName,
      appearance: req.body.appearance || settings.appearance,
      contactInfo: req.body.contactInfo || settings.contactInfo,
      socialLinks: req.body.socialLinks || settings.socialLinks,
      paymentAccounts: req.body.paymentAccounts || settings.paymentAccounts,
      faqs: req.body.faqs || settings.faqs,
      updatedAt: new Date()
    };

    console.log('✅ Settings updated successfully');
    res.json(settings);
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Rifas
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

app.get('/api/admin/raffles', (req, res) => {
  res.json(raffles);
});

app.post('/api/admin/raffles', (req, res) => {
  try {
    console.log('📝 Creating raffle:', req.body.title);
    
    const raffle = {
      id: Date.now().toString(),
      title: req.body.title || 'Nueva Rifa',
      description: req.body.description || '',
      heroImage: req.body.heroImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      gallery: req.body.gallery || [],
      tickets: req.body.tickets || 100,
      sold: 0,
      drawDate: req.body.drawDate ? new Date(req.body.drawDate) : new Date(),
      packs: req.body.packs || [],
      bonuses: req.body.bonuses || [],
      status: req.body.status || 'draft',
      slug: req.body.slug || req.body.title?.toLowerCase().replace(/\s+/g, '-') || 'nueva-rifa',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    raffles.push(raffle);
    console.log('✅ Raffle created:', raffle.id);
    res.json(raffle);
  } catch (error) {
    console.error('❌ Error creating raffle:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.patch('/api/admin/raffles/:id', (req, res) => {
  try {
    const index = raffles.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      raffles[index] = { ...raffles[index], ...req.body, updatedAt: new Date() };
      res.json(raffles[index]);
    } else {
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/raffles/:id', (req, res) => {
  try {
    const index = raffles.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      raffles.splice(index, 1);
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Órdenes
app.post('/api/public/orders', (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/orders/folio/:folio', (req, res) => {
  const order = orders.find(o => o.folio === req.params.folio);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.get('/api/admin/orders', (req, res) => {
  res.json(orders);
});

// Usuarios
app.get('/api/admin/users', (req, res) => {
  res.json(users);
});

app.post('/api/admin/users', (req, res) => {
  try {
    const user = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ganadores
app.get('/api/public/winners', (req, res) => {
  res.json(winners);
});

app.get('/api/admin/winners', (req, res) => {
  res.json(winners);
});

app.post('/api/admin/winners', (req, res) => {
  try {
    const winner = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    winners.push(winner);
    res.json(winner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalRaffles: raffles.length,
    activeRaffles: raffles.filter(r => r.status === 'active').length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    totalWinners: winners.length
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Lucky Snap Backend COMPLETO funcionando en puerto ${PORT}`);
  console.log(`📊 Datos: ${raffles.length} rifas, ${orders.length} órdenes`);
  console.log(`🎨 Configuración completa: colores, imágenes, logo, contactos`);
});
