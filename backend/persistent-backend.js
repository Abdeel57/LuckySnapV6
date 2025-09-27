// Backend completo con almacenamiento persistente
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

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

// Sistema de almacenamiento persistente
class PersistentStorage {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.files = {
      settings: 'settings.json',
      raffles: 'raffles.json',
      orders: 'orders.json',
      customers: 'customers.json',
      users: 'users.json',
      winners: 'winners.json'
    };
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log('📁 Directorio de datos inicializado');
    } catch (error) {
      console.error('❌ Error inicializando directorio:', error);
    }
  }

  async save(key, data) {
    try {
      const filePath = path.join(this.dataDir, this.files[key]);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 Datos guardados en ${key}`);
    } catch (error) {
      console.error(`❌ Error guardando ${key}:`, error);
    }
  }

  async load(key) {
    try {
      const filePath = path.join(this.dataDir, this.files[key]);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`⚠️ No se encontró archivo ${key}, usando datos por defecto`);
      return this.getDefaultData(key);
    }
  }

  getDefaultData(key) {
    const defaults = {
      settings: {
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
        paymentAccounts: [],
        faqs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      raffles: [
        {
          id: '1',
          title: 'iPhone 15 Pro Max',
          description: 'El último iPhone con todas las características premium',
          heroImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'],
          tickets: 100,
          sold: 25,
          drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          packs: [
            { name: 'Pack Básico', tickets: 1, price: 50 },
            { name: 'Pack Premium', tickets: 5, price: 200 },
            { name: 'Pack VIP', tickets: 10, price: 350 }
          ],
          bonuses: ['Descuento 10%', 'Boletos extra'],
          status: 'active',
          slug: 'iphone-15-pro-max',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      orders: [],
      customers: [],
      users: [
        {
          id: '1',
          name: 'Administrador',
          email: 'admin@luckysnap.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      winners: []
    };
    return defaults[key] || [];
  }

  async saveAll(data) {
    for (const [key, value] of Object.entries(data)) {
      await this.save(key, value);
    }
  }

  async loadAll() {
    const data = {};
    for (const key of Object.keys(this.files)) {
      data[key] = await this.load(key);
    }
    return data;
  }
}

// Inicializar almacenamiento
const storage = new PersistentStorage();
let data = {};

// Cargar datos al iniciar
async function loadData() {
  try {
    await storage.init();
    data = await storage.loadAll();
    console.log('📊 Datos cargados:', {
      settings: !!data.settings,
      raffles: data.raffles.length,
      orders: data.orders.length,
      customers: data.customers.length,
      users: data.users.length,
      winners: data.winners.length
    });
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
  }
}

// Función para guardar datos automáticamente
async function autoSave(key, newData) {
  data[key] = newData;
  await storage.save(key, newData);
}

// Rutas públicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lucky Snap API - CON ALMACENAMIENTO PERSISTENTE', 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    storage: 'persistent'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    raffles: data.raffles.length,
    orders: data.orders.length,
    customers: data.customers.length,
    users: data.users.length,
    storage: 'persistent'
  });
});

// Configuración
app.get('/api/public/settings', (req, res) => {
  res.json(data.settings);
});

app.post('/api/admin/settings', async (req, res) => {
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
    const updatedSettings = {
      ...data.settings,
      siteName: req.body.siteName || data.settings.siteName,
      appearance: {
        ...data.settings.appearance,
        ...req.body.appearance,
        siteName: req.body.appearance?.siteName || req.body.siteName || data.settings.appearance.siteName
      },
      contactInfo: req.body.contactInfo || data.settings.contactInfo,
      socialLinks: req.body.socialLinks || data.settings.socialLinks,
      paymentAccounts: req.body.paymentAccounts || data.settings.paymentAccounts,
      faqs: req.body.faqs || data.settings.faqs,
      updatedAt: new Date().toISOString()
    };

    await autoSave('settings', updatedSettings);
    console.log('✅ Settings updated successfully');
    res.json(updatedSettings);
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
  res.json(data.raffles.filter(r => r.status === 'active'));
});

app.get('/api/public/raffles/slug/:slug', (req, res) => {
  const raffle = data.raffles.find(r => r.slug === req.params.slug);
  if (raffle) {
    res.json(raffle);
  } else {
    res.status(404).json({ error: 'Raffle not found' });
  }
});

app.get('/api/public/raffles/:id/occupied-tickets', (req, res) => {
  // Obtener tickets ocupados de las órdenes
  const occupiedTickets = data.orders
    .filter(order => order.raffleId === req.params.id && order.status === 'PAID')
    .flatMap(order => order.tickets || []);
  res.json(occupiedTickets);
});

app.get('/api/admin/raffles', (req, res) => {
  res.json(data.raffles);
});

app.post('/api/admin/raffles', async (req, res) => {
  try {
    console.log('📝 Creating raffle:', {
      title: req.body.title,
      hasHeroImage: !!req.body.heroImage,
      heroImageType: req.body.heroImage ? (req.body.heroImage.startsWith('data:') ? 'BASE64' : 'URL') : 'NONE',
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
      drawDate: req.body.drawDate ? new Date(req.body.drawDate).toISOString() : new Date().toISOString(),
      packs: req.body.packs || [],
      bonuses: req.body.bonuses || [],
      status: req.body.status || 'draft',
      slug: req.body.slug || req.body.title?.toLowerCase().replace(/\s+/g, '-') || 'nueva-rifa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.raffles.push(raffle);
    await autoSave('raffles', data.raffles);
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

app.patch('/api/admin/raffles/:id', async (req, res) => {
  try {
    const index = data.raffles.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      data.raffles[index] = { 
        ...data.raffles[index], 
        ...req.body, 
        updatedAt: new Date().toISOString() 
      };
      await autoSave('raffles', data.raffles);
      res.json(data.raffles[index]);
    } else {
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/raffles/:id', async (req, res) => {
  try {
    const index = data.raffles.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      data.raffles.splice(index, 1);
      await autoSave('raffles', data.raffles);
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Órdenes con datos de cliente
app.post('/api/public/orders', async (req, res) => {
  try {
    const order = {
      id: Date.now().toString(),
      ...req.body,
      folio: `ORD-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    data.orders.push(order);
    await autoSave('orders', data.orders);
    
    // Crear o actualizar cliente
    if (req.body.customer) {
      const existingCustomer = data.customers.find(c => c.phone === req.body.customer.phone);
      if (existingCustomer) {
        // Actualizar cliente existente
        existingCustomer.name = req.body.customer.name;
        existingCustomer.district = req.body.customer.district;
        existingCustomer.updatedAt = new Date().toISOString();
      } else {
        // Crear nuevo cliente
        const customer = {
          id: Date.now().toString(),
          name: req.body.customer.name,
          phone: req.body.customer.phone,
          district: req.body.customer.district,
          totalOrders: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.customers.push(customer);
      }
      await autoSave('customers', data.customers);
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/orders/folio/:folio', (req, res) => {
  const order = data.orders.find(o => o.folio === req.params.folio);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.get('/api/admin/orders', (req, res) => {
  res.json(data.orders);
});

// Clientes
app.get('/api/admin/customers', (req, res) => {
  res.json(data.customers);
});

app.get('/api/admin/customers/:id', (req, res) => {
  const customer = data.customers.find(c => c.id === req.params.id);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// Usuarios
app.get('/api/admin/users', (req, res) => {
  res.json(data.users);
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const user = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.users.push(user);
    await autoSave('users', data.users);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ganadores
app.get('/api/public/winners', (req, res) => {
  res.json(data.winners);
});

app.get('/api/admin/winners', (req, res) => {
  res.json(data.winners);
});

app.post('/api/admin/winners', async (req, res) => {
  try {
    const winner = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    data.winners.push(winner);
    await autoSave('winners', data.winners);
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
    
    const todayOrders = data.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
    
    const stats = {
      todaySales: todayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      pendingOrders: data.orders.filter(order => order.status === 'PENDING').length,
      activeRaffles: data.raffles.filter(r => r.status === 'active').length,
      totalRaffles: data.raffles.length,
      totalOrders: data.orders.length,
      totalCustomers: data.customers.length,
      totalRevenue: data.orders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalWinners: data.winners.length
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
async function startServer() {
  await loadData();
  
  app.listen(PORT, () => {
    console.log(`🚀 Lucky Snap Backend PERSISTENTE funcionando en puerto ${PORT}`);
    console.log(`📊 Datos: ${data.raffles.length} rifas, ${data.orders.length} órdenes, ${data.customers.length} clientes`);
    console.log(`💾 Almacenamiento: PERSISTENTE en ${storage.dataDir}`);
  });
}

startServer().catch(console.error);
