// Backend ultra simple que SÍ funciona
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());

// Datos en memoria
let raffles = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max',
    description: 'El último iPhone con todas las características premium',
    heroImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    gallery: [],
    tickets: 100,
    sold: 25,
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    packs: [
      { name: 'Pack Básico', tickets: 1, price: 50 },
      { name: 'Pack Premium', tickets: 5, price: 200 }
    ],
    bonuses: ['Descuento 10%'],
    status: 'active',
    slug: 'iphone-15-pro-max',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let settings = {
  id: 'main_settings',
  siteName: 'Lucky Snap',
  paymentAccounts: [],
  faqs: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - FUNCIONANDO', 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    raffles: raffles.length
  });
});

// Rutas públicas
app.get('/api/public/settings', (req, res) => {
  res.json(settings);
});

app.get('/api/public/raffles/active', (req, res) => {
  res.json(raffles.filter(r => r.status === 'active'));
});

// Rutas de admin
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
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    settings = { ...settings, ...req.body, updatedAt: new Date() };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Lucky Snap Backend ULTRA SIMPLE funcionando en puerto ${PORT}`);
  console.log(`📊 Datos: ${raffles.length} rifas`);
});
