// Sistema de almacenamiento persistente usando archivos JSON
const fs = require('fs').promises;
const path = require('path');

class PersistentStorage {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.files = {
      settings: 'settings.json',
      raffles: 'raffles.json',
      orders: 'orders.json',
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
      raffles: [],
      orders: [],
      users: [],
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

module.exports = PersistentStorage;
