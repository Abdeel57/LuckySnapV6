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
  try {
    const raffles = loadData(RAFFLES_FILE);
    const activeRaffles = raffles.filter(r => r.status === 'active');
    console.log('📋 Active raffles:', activeRaffles.map(r => ({ id: r.id, title: r.title, slug: r.slug })));
    res.json(activeRaffles);
  } catch (error) {
    console.error('❌ Error loading active raffles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/public/raffles/slug/:slug', (req, res) => {
  try {
    const raffles = loadData(RAFFLES_FILE);
    console.log('🔍 Searching for raffle with slug:', req.params.slug);
    console.log('📋 Available raffles:', raffles.map(r => ({ id: r.id, title: r.title, slug: r.slug })));
    
    const raffle = raffles.find(r => r.slug === req.params.slug);
    if (raffle) {
      console.log('✅ Raffle found:', { id: raffle.id, title: raffle.title, hasHeroImage: !!raffle.heroImage, galleryCount: raffle.gallery?.length || 0 });
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

// Endpoint para obtener boletos ocupados de una rifa
app.get('/api/public/raffles/:id/occupied-tickets', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []);
    const raffleId = req.params.id;
    
    // Filtrar órdenes de la rifa específica que no estén canceladas
    const raffleOrders = orders.filter(order => 
      order.raffleId === raffleId && 
      order.status !== 'CANCELLED' && 
      order.status !== 'EXPIRED'
    );
    
    // Extraer todos los números de boletos ocupados
    const occupiedTickets = [];
    raffleOrders.forEach(order => {
      if (order.tickets && Array.isArray(order.tickets)) {
        occupiedTickets.push(...order.tickets);
      }
    });
    
    // Eliminar duplicados y ordenar
    const uniqueOccupiedTickets = [...new Set(occupiedTickets)].sort((a, b) => a - b);
    
    console.log('✅ Occupied tickets loaded for raffle:', raffleId, 'Count:', uniqueOccupiedTickets.length);
    res.json(uniqueOccupiedTickets);
  } catch (error) {
    console.error('❌ Error loading occupied tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/public/raffles/:id', (req, res) => {
  try {
    const raffles = loadData(RAFFLES_FILE, []);
    const raffle = raffles.find(r => r.id === req.params.id);
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

app.get('/api/public/raffles/:id/occupied-tickets', (req, res) => {
  try {
    // Por ahora retornamos array vacío, pero aquí se podría implementar la lógica de boletos ocupados
    const orders = loadData(ORDERS_FILE, []);
    const raffleOrders = orders.filter(order => order.raffleId === req.params.id && order.status === 'completed');
    const occupiedTickets = raffleOrders.flatMap(order => order.tickets || []);
    console.log('🎫 Occupied tickets for raffle', req.params.id, ':', occupiedTickets.length);
    res.json(occupiedTickets);
  } catch (error) {
    console.error('❌ Error loading occupied tickets:', error);
    res.json([]);
  }
});

app.get('/api/admin/raffles', (req, res) => {
  try {
    const raffles = loadData(RAFFLES_FILE);
    res.json(raffles);
  } catch (error) {
    console.error('❌ Error loading raffles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/raffles/finished', (req, res) => {
  try {
    const raffles = loadData(RAFFLES_FILE);
    const finishedRaffles = raffles.filter(r => r.status === 'finished');
    res.json(finishedRaffles);
  } catch (error) {
    console.error('❌ Error loading finished raffles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/raffles', (req, res) => {
  try {
    // Validación básica de datos requeridos
    if (!req.body.title || req.body.title.trim() === '') {
      return res.status(400).json({ error: 'El título es requerido' });
    }
    
    if (!req.body.tickets || req.body.tickets < 1) {
      return res.status(400).json({ error: 'El número de boletos debe ser mayor a 0' });
    }
    
    if (!req.body.drawDate) {
      return res.status(400).json({ error: 'La fecha del sorteo es requerida' });
    }
    
    const raffles = loadData(RAFFLES_FILE, []);
    console.log('📝 Creating raffle:', {
      title: req.body.title,
      hasHeroImage: !!req.body.heroImage,
      heroImageType: req.body.heroImage ? (req.body.heroImage.startsWith('data:') ? 'BASE64' : 'URL') : 'NONE',
      heroImageLength: req.body.heroImage ? req.body.heroImage.length : 0,
      galleryCount: req.body.gallery?.length || 0,
      galleryImages: req.body.gallery?.map((img, i) => ({
        index: i,
        hasImage: !!img,
        length: img ? img.length : 0,
        type: img ? (img.startsWith('data:') ? 'BASE64' : 'URL') : 'NONE'
      })) || []
    });
    
    // Generar slug único
    let baseSlug = req.body.slug || req.body.title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || 'nueva-rifa';
    let slug = baseSlug;
    let counter = 1;
    while (raffles.some(r => r.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Determinar imagen principal: usar gallery[0] si existe, sino heroImage, sino imagen por defecto
    const gallery = req.body.gallery || [];
    const heroImage = gallery.length > 0 ? gallery[0] : (req.body.heroImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop');
    
    const raffle = {
      id: Date.now().toString(),
      title: req.body.title || 'Nueva Rifa',
      description: req.body.description || '',
      heroImage: heroImage,
      gallery: gallery,
      tickets: req.body.tickets || 100,
      sold: 0,
      drawDate: req.body.drawDate ? new Date(req.body.drawDate) : new Date(),
      packs: req.body.packs || [],
      bonuses: req.body.bonuses || [],
      status: req.body.status || 'draft',
      slug: slug,
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
      heroImagePreview: raffle.heroImage ? raffle.heroImage.substring(0, 50) + '...' : 'NO_IMAGE',
      galleryCount: raffle.gallery?.length || 0,
      galleryImages: raffle.gallery?.map((img, i) => ({
        index: i,
        hasImage: !!img,
        length: img ? img.length : 0,
        preview: img ? img.substring(0, 30) + '...' : 'NO_IMAGE'
      })) || []
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
    const raffles = loadData(RAFFLES_FILE, []); // Cargar datos del archivo
    const index = raffles.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      // Generar slug único si se está cambiando
      let slug = raffles[index].slug;
      if (req.body.slug && req.body.slug !== raffles[index].slug) {
        let baseSlug = req.body.slug.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        slug = baseSlug;
        let counter = 1;
        while (raffles.some((r, i) => i !== index && r.slug === slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      
      // Determinar imagen principal: usar gallery[0] si existe, sino heroImage, sino imagen por defecto
      const gallery = req.body.gallery || raffles[index].gallery || [];
      const heroImage = gallery.length > 0 ? gallery[0] : (req.body.heroImage || raffles[index].heroImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop');
      
      raffles[index] = { 
        ...raffles[index], 
        ...req.body, 
        slug: slug,
        heroImage: heroImage,
        gallery: gallery,
        updatedAt: new Date() 
      };
      saveData(RAFFLES_FILE, raffles); // Guardar datos persistentemente
      console.log('✅ Raffle updated:', { id: raffles[index].id, title: raffles[index].title });
      res.json(raffles[index]);
    } else {
      console.log('❌ Raffle not found for update:', req.params.id);
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    console.error('❌ Error updating raffle:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/raffles/:id', (req, res) => {
  try {
    const raffles = loadData(RAFFLES_FILE, []); // Cargar datos del archivo
    const index = raffles.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      const deletedRaffle = raffles[index];
      raffles.splice(index, 1);
      saveData(RAFFLES_FILE, raffles); // Guardar datos persistentemente
      console.log('✅ Raffle deleted:', { id: deletedRaffle.id, title: deletedRaffle.title });
      res.status(204).send();
    } else {
      console.log('❌ Raffle not found for deletion:', req.params.id);
      res.status(404).json({ error: 'Raffle not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting raffle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Órdenes
app.post('/api/public/orders', (req, res) => {
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
    
    const orders = loadData(ORDERS_FILE, []); // Cargar datos del archivo
    console.log('📋 Current orders count:', orders.length);
    
    const order = {
      id: Date.now().toString(),
      folio: `ORD-${Date.now()}`,
      raffleId: req.body.raffleId,
      customer: {
        name: req.body.customer.name.trim(),
        phone: req.body.customer.phone.trim(),
        email: req.body.customer.email?.trim() || '',
        district: req.body.customer.district?.trim() || ''
      },
      tickets: req.body.tickets,
      totalAmount: req.body.totalAmount || 0,
      status: 'PENDING',
      paymentMethod: req.body.paymentMethod || 'transfer',
      notes: req.body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };
    
    orders.push(order);
    saveData(ORDERS_FILE, orders); // Guardar datos persistentemente
    
    console.log('✅ Order created successfully:', {
      id: order.id,
      folio: order.folio,
      customer: order.customer.name,
      tickets: order.tickets.length,
      amount: order.totalAmount,
      raffleId: order.raffleId
    });
    
    console.log('📋 Total orders after creation:', orders.length);
    res.json(order);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/orders/folio/:folio', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []); // Cargar datos del archivo
    const order = orders.find(o => o.folio === req.params.folio);
    if (order) {
      console.log('✅ Order found by folio:', order.folio);
      res.json(order);
    } else {
      console.log('❌ Order not found for folio:', req.params.folio);
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('❌ Error loading order by folio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/orders', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []); // Cargar datos del archivo
    console.log('📋 Loading orders for admin:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar estado de orden
app.patch('/api/admin/orders/:id', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []); // Cargar datos del archivo
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
      orders[index] = { 
        ...orders[index], 
        ...req.body, 
        updatedAt: new Date() 
      };
      saveData(ORDERS_FILE, orders); // Guardar datos persistentemente
      console.log('✅ Order updated:', { id: orders[index].id, status: orders[index].status });
      res.json(orders[index]);
    } else {
      console.log('❌ Order not found for update:', req.params.id);
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar orden
app.delete('/api/admin/orders/:id', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []); // Cargar datos del archivo
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
      const deletedOrder = orders[index];
      orders.splice(index, 1);
      saveData(ORDERS_FILE, orders); // Guardar datos persistentemente
      console.log('✅ Order deleted:', { id: deletedOrder.id, folio: deletedOrder.folio });
      res.status(204).send();
    } else {
      console.log('❌ Order not found for deletion:', req.params.id);
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clientes
app.get('/api/admin/customers', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []); // Cargar datos del archivo
    
    // Extraer clientes únicos de las órdenes
    const customerMap = new Map();
    
    orders.forEach(order => {
      if (order.customer && order.customer.phone) {
        const key = order.customer.phone.trim();
        if (customerMap.has(key)) {
          const customer = customerMap.get(key);
          customer.totalOrders += 1;
          customer.totalSpent += order.totalAmount || 0;
          customer.lastOrderDate = new Date(Math.max(
            new Date(customer.lastOrderDate).getTime(),
            new Date(order.createdAt).getTime()
          ));
          customer.orders.push({
            id: order.id,
            folio: order.folio,
            raffleId: order.raffleId,
            amount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
          });
        } else {
          customerMap.set(key, {
            id: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: order.customer.name.trim(),
            phone: order.customer.phone.trim(),
            email: order.customer.email?.trim() || '',
            district: order.customer.district?.trim() || '',
            totalOrders: 1,
            totalSpent: order.totalAmount || 0,
            firstOrderDate: order.createdAt,
            lastOrderDate: order.createdAt,
            orders: [{
              id: order.id,
              folio: order.folio,
              raffleId: order.raffleId,
              amount: order.totalAmount,
              status: order.status,
              createdAt: order.createdAt
            }]
          });
        }
      }
    });
    
    const customers = Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
    
    console.log('👥 Customers loaded:', customers.length);
    res.json(customers);
  } catch (error) {
    console.error('❌ Error loading customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener cliente específico
app.get('/api/admin/customers/:id', (req, res) => {
  try {
    const orders = loadData(ORDERS_FILE, []);
    const customerMap = new Map();
    
    orders.forEach(order => {
      if (order.customer && order.customer.phone) {
        const key = order.customer.phone.trim();
        if (customerMap.has(key)) {
          const customer = customerMap.get(key);
          customer.totalOrders += 1;
          customer.totalSpent += order.totalAmount || 0;
          customer.orders.push({
            id: order.id,
            folio: order.folio,
            raffleId: order.raffleId,
            amount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
          });
        } else {
          customerMap.set(key, {
            id: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: order.customer.name.trim(),
            phone: order.customer.phone.trim(),
            email: order.customer.email?.trim() || '',
            district: order.customer.district?.trim() || '',
            totalOrders: 1,
            totalSpent: order.totalAmount || 0,
            orders: [{
              id: order.id,
              folio: order.folio,
              raffleId: order.raffleId,
              amount: order.totalAmount,
              status: order.status,
              createdAt: order.createdAt
            }]
          });
        }
      }
    });
    
    const customers = Array.from(customerMap.values());
    const customer = customers.find(c => c.id === req.params.id);
    
    if (customer) {
      console.log('✅ Customer found:', { id: customer.id, name: customer.name });
      res.json(customer);
    } else {
      console.log('❌ Customer not found:', req.params.id);
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    console.error('❌ Error loading customer:', error);
    res.status(500).json({ error: 'Internal server error' });
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
