// Servicio de datos local - funciona sin backend
import { Settings, Raffle, Order, Winner, AdminUser } from '../types';

// Datos hardcodeados para que funcione inmediatamente
const HARDCODED_SETTINGS: Settings = {
  id: 'main_settings',
  siteName: 'Lucky Snap',
  paymentAccounts: [
    {
      id: '1',
      name: 'Cuenta Principal',
      accountNumber: '1234-5678-9012-3456',
      bank: 'Banco Ejemplo',
      type: 'card'
    }
  ],
  faqs: [
    {
      id: '1',
      question: '¿Cómo funciona Lucky Snap?',
      answer: 'Lucky Snap es una plataforma de rifas donde puedes comprar boletos y participar en sorteos emocionantes.'
    },
    {
      id: '2',
      question: '¿Cómo puedo pagar?',
      answer: 'Aceptamos transferencias bancarias y pagos con tarjeta. Los detalles de pago se proporcionan después de la compra.'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const HARDCODED_RAFFLES: Raffle[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max',
    description: 'El último iPhone con todas las características premium',
    heroImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'],
    tickets: 100,
    sold: 25,
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
    packs: [
      { name: 'Pack Básico', tickets: 1, price: 50 },
      { name: 'Pack Premium', tickets: 5, price: 200 },
      { name: 'Pack VIP', tickets: 10, price: 350 }
    ],
    bonuses: ['Descuento 10%', 'Boletos extra'],
    status: 'active',
    slug: 'iphone-15-pro-max',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const HARDCODED_ORDERS: Order[] = [];

const HARDCODED_WINNERS: Winner[] = [];

const HARDCODED_USERS: AdminUser[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@luckysnap.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const localApi = {
  // Settings
  async getSettings(): Promise<Settings> {
    await delay(500); // Simular delay de red
    return HARDCODED_SETTINGS;
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    await delay(500);
    const updated = { ...HARDCODED_SETTINGS, ...settings, updatedAt: new Date() };
    Object.assign(HARDCODED_SETTINGS, updated);
    return updated;
  },

  // Raffles
  async getRaffles(): Promise<Raffle[]> {
    await delay(500);
    return HARDCODED_RAFFLES;
  },

  async createRaffle(raffle: Omit<Raffle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Raffle> {
    await delay(500);
    const newRaffle: Raffle = {
      ...raffle,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    HARDCODED_RAFFLES.push(newRaffle);
    return newRaffle;
  },

  async updateRaffle(id: string, updates: Partial<Raffle>): Promise<Raffle> {
    await delay(500);
    const index = HARDCODED_RAFFLES.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Raffle not found');
    
    HARDCODED_RAFFLES[index] = { ...HARDCODED_RAFFLES[index], ...updates, updatedAt: new Date() };
    return HARDCODED_RAFFLES[index];
  },

  async deleteRaffle(id: string): Promise<void> {
    await delay(500);
    const index = HARDCODED_RAFFLES.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Raffle not found');
    HARDCODED_RAFFLES.splice(index, 1);
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    await delay(500);
    return HARDCODED_ORDERS;
  },

  async createOrder(orderData: Omit<Order, 'folio' | 'status' | 'createdAt' | 'expiresAt' | 'id'>): Promise<Order> {
    await delay(500);
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      folio: `ORD-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    };
    HARDCODED_ORDERS.push(newOrder);
    return newOrder;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    await delay(500);
    const index = HARDCODED_ORDERS.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    
    HARDCODED_ORDERS[index] = { ...HARDCODED_ORDERS[index], ...updates, updatedAt: new Date() };
    return HARDCODED_ORDERS[index];
  },

  async deleteOrder(id: string): Promise<void> {
    await delay(500);
    const index = HARDCODED_ORDERS.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    HARDCODED_ORDERS.splice(index, 1);
  },

  async getOrderByFolio(folio: string): Promise<Order | undefined> {
    await delay(500);
    return HARDCODED_ORDERS.find(o => o.folio === folio);
  },

  // Customers (alias para órdenes pagadas)
  async getCustomers(): Promise<Order[]> {
    await delay(500);
    return HARDCODED_ORDERS.filter(o => o.status === 'PAID');
  },

  async getCustomerById(id: string): Promise<Order | undefined> {
    await delay(500);
    return HARDCODED_ORDERS.find(o => o.id === id && o.status === 'PAID');
  },

  // Winners
  async getWinners(): Promise<Winner[]> {
    await delay(500);
    return HARDCODED_WINNERS;
  },

  // Users
  async getUsers(): Promise<AdminUser[]> {
    await delay(500);
    return HARDCODED_USERS;
  },

  async createUser(userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser> {
    await delay(500);
    const newUser: AdminUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    HARDCODED_USERS.push(newUser);
    return newUser;
  },

  // Dashboard stats
  async getDashboardStats() {
    await delay(500);
    return {
      totalRaffles: HARDCODED_RAFFLES.length,
      activeRaffles: HARDCODED_RAFFLES.filter(r => r.status === 'active').length,
      totalOrders: HARDCODED_ORDERS.length,
      totalRevenue: HARDCODED_ORDERS.reduce((sum, order) => sum + (order.total || 0), 0),
      totalWinners: HARDCODED_WINNERS.length,
    };
  }
};
