// Backend completo con TODA la funcionalidad de configuración
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Archivos de datos persistentes
const DATA_DIR = path.join(__dirname, 'data');
const RAFFLES_FILE = path.join(DATA_DIR, 'raffles.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const WINNERS_FILE = path.join(DATA_DIR, 'winners.json');

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Función para cargar datos desde archivos
const loadData = (filePath, defaultValue) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
    return defaultValue;
};

// Función para guardar datos en archivos
const saveData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Data saved to ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`❌ Error saving ${filePath}:`, error);
    }
};

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

// Cargar datos persistentes
let settings = loadData(SETTINGS_FILE, {
  id: 'main_settings',
  siteName: 'Lucky Snap',
  appearance: {
    siteName: 'Lucky Snap',
    colors: {
      backgroundPrimary: '#1a1a1a',
      backgroundSecondary: '#2d2d2d',
      accent: '#ff6b6b',
      action: '#4ecdc4'
    },
    logo: '',
    favicon: ''
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
      id: '1',
      bank: 'Banco Principal',
      accountNumber: '1234567890',
      accountHolder: 'Lucky Snap',
      clabe: '123456789012345678'
    }
  ],
  faqs: [
    {
      id: '1',
      question: '¿Cómo funcionan las rifas?',
      answer: 'Las rifas funcionan comprando boletos y participando en sorteos.'
    },
    {
      id: '2',
      question: '¿Cuándo se realizan los sorteos?',
      answer: 'Los sorteos se realizan en las fechas especificadas en cada rifa.'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

let raffles = loadData(RAFFLES_FILE, [
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
]);

let orders = loadData(ORDERS_FILE, []);
let winners = loadData(WINNERS_FILE, []);
let users = loadData(USERS_FILE, [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@luckysnap.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

console.log(`📊 Datos persistentes cargados: ${raffles.length} rifas, ${orders.length} órdenes, ${users.length} usuarios`);

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
      appearance: {
        ...settings.appearance,
        ...req.body.appearance,
        siteName: req.body.appearance?.siteName || req.body.siteName || settings.appearance.siteName
      },
      contactInfo: req.body.contactInfo || settings.contactInfo,
      socialLinks: req.body.socialLinks || settings.socialLinks,
      paymentAccounts: req.body.paymentAccounts || settings.paymentAccounts,
      faqs: req.body.faqs || settings.faqs,
      updatedAt: new Date()
    };

    saveData(SETTINGS_FILE, settings); // Guardar datos persistentemente
    console.log('✅ Settings updated and saved successfully');
    console.log('🎨 New colors:', settings.appearance.colors);
    console.log('🏷️ New site name:', settings.appearance.siteName);
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

app.get('/api/admin/raffles/finished', (req, res) => {
  const finishedRaffles = raffles.filter(r => r.status === 'finished');
  res.json(finishedRaffles);
});

app.post('/api/admin/raffles', (req, res) => {
  try {
    console.log('📝 Creating raffle:', {
      title: req.body.title,
      hasHeroImage: !!req.body.heroImage,
      heroImageType: req.body.heroImage ? (req.body.heroImage.startsWith('data:') ? 'BASE64' : 'URL') : 'NONE',
      heroImageLength: req.body.heroImage ? req.body.heroImage.length : 0,
      galleryCount: req.body.gallery?.length || 0
    });
    
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
    saveData(RAFFLES_FILE, raffles); // Guardar datos persistentemente
    console.log('✅ Raffle created and saved:', {
      id: raffle.id,
      title: raffle.title,
      hasHeroImage: !!raffle.heroImage,
      heroImageLength: raffle.heroImage ? raffle.heroImage.length : 0,
      heroImagePreview: raffle.heroImage ? raffle.heroImage.substring(0, 50) + '...' : 'NO_IMAGE'
    });
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
      saveData(RAFFLES_FILE, raffles); // Guardar datos persistentemente
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
      saveData(RAFFLES_FILE, raffles); // Guardar datos persistentemente
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
    saveData(ORDERS_FILE, orders); // Guardar datos persistentemente
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

// Clientes
app.get('/api/admin/customers', (req, res) => {
  // Extraer clientes únicos de las órdenes
  const customers = [];
  const customerMap = new Map();
  
  orders.forEach(order => {
    if (order.customer) {
      const key = order.customer.phone;
      if (customerMap.has(key)) {
        customerMap.get(key).totalOrders += 1;
      } else {
        customerMap.set(key, {
          id: Date.now().toString() + Math.random(),
          name: order.customer.name,
          phone: order.customer.phone,
          district: order.customer.district,
          totalOrders: 1,
          createdAt: order.createdAt,
          updatedAt: order.createdAt
        });
      }
    }
  });
  
  res.json(Array.from(customerMap.values()));
});

app.get('/api/admin/customers/:id', (req, res) => {
  // Buscar cliente por ID
  const customer = customers.find(c => c.id === req.params.id);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
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
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
    
    const stats = {
      todaySales: todayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      pendingOrders: orders.filter(order => order.status === 'PENDING').length,
      activeRaffles: raffles.filter(r => r.status === 'active').length,
      totalRaffles: raffles.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalWinners: winners.length
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Lucky Snap Backend COMPLETO funcionando en puerto ${PORT}`);
  console.log(`📊 Datos: ${raffles.length} rifas, ${orders.length} órdenes`);
  console.log(`🎨 Configuración completa: colores, imágenes, logo, contactos`);
});
