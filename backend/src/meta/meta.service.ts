import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PixelEvent {
  id: string;
  eventName: string;
  eventData: any;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  source: 'web' | 'mobile' | 'api';
}

export interface CustomAudience {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: 'purchasers' | 'high_value' | 'inactive' | 'cart_abandoners' | 'frequent_buyers';
    conditions: any;
  };
  size: number;
  lastUpdated: Date;
  metaAudienceId?: string;
}

export interface CampaignMetrics {
  campaignId: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  costPerClick: number;
  costPerConversion: number;
  returnOnAdSpend: number;
}

@Injectable()
export class MetaService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(eventData: Omit<PixelEvent, 'id' | 'timestamp'>): Promise<PixelEvent> {
    // En un entorno real, aquí enviarías el evento a Meta Pixel
    // Por ahora, simulamos el tracking
    
    const event: PixelEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...eventData,
    };

    console.log('📊 Meta Pixel Event:', {
      eventName: event.eventName,
      userId: event.userId,
      data: event.eventData,
    });

    // Aquí implementarías el envío real a Meta
    // await this.sendToMetaPixel(event);

    return event;
  }

  async getCustomAudiences(): Promise<CustomAudience[]> {
    // Generar audiencias basadas en datos reales de la base de datos
    const audiences: CustomAudience[] = [];

    // 1. Compradores frecuentes (3+ compras)
    const frequentBuyers = await this.prisma.user.findMany({
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    const frequentBuyersList = frequentBuyers.filter(user => user.orders && user.orders.length >= 3);
    
    if (frequentBuyersList.length > 0) {
      audiences.push({
        id: 'aud_frequent_buyers',
        name: 'Compradores Frecuentes',
        description: 'Usuarios con 3 o más compras completadas',
        criteria: {
          type: 'frequent_buyers',
          conditions: { minOrders: 3 },
        },
        size: frequentBuyersList.length,
        lastUpdated: new Date(),
      });
    }

    // 2. Clientes de alto valor ($500+ gastados)
    const highValueCustomers = frequentBuyers.filter(user => {
      const totalSpent = user.orders ? user.orders.reduce((sum, order) => sum + order.total, 0) : 0;
      return totalSpent >= 500;
    });

    if (highValueCustomers.length > 0) {
      audiences.push({
        id: 'aud_high_value',
        name: 'Clientes de Alto Valor',
        description: 'Usuarios que han gastado $500 o más',
        criteria: {
          type: 'high_value',
          conditions: { minSpent: 500 },
        },
        size: highValueCustomers.length,
        lastUpdated: new Date(),
      });
    }

    // 3. Abandonadores de carrito (órdenes pendientes)
    const cartAbandoners = await this.prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      distinct: ['userId'],
    });

    if (cartAbandoners.length > 0) {
      audiences.push({
        id: 'aud_cart_abandoners',
        name: 'Abandonadores de Carrito',
        description: 'Usuarios que iniciaron una compra pero no la completaron',
        criteria: {
          type: 'cart_abandoners',
          conditions: { hasPendingOrders: true },
        },
        size: cartAbandoners.length,
        lastUpdated: new Date(),
      });
    }

    // 4. Clientes inactivos (no compran hace 30+ días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveCustomers = await this.prisma.user.findMany({
      where: {
        orders: {
          none: {
            createdAt: { gte: thirtyDaysAgo },
            status: 'PAID',
          },
        },
        createdAt: { lt: thirtyDaysAgo }, // Usuarios que existían antes
      },
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    if (inactiveCustomers.length > 0) {
      audiences.push({
        id: 'aud_inactive',
        name: 'Clientes Inactivos',
        description: 'Usuarios que no han comprado en los últimos 30 días',
        criteria: {
          type: 'inactive',
          conditions: { daysSinceLastPurchase: 30 },
        },
        size: inactiveCustomers.length,
        lastUpdated: new Date(),
      });
    }

    return audiences;
  }

  async getCampaignMetrics(): Promise<CampaignMetrics[]> {
    // Simulamos métricas de campañas basadas en datos reales
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      include: { raffle: true },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    // Simulamos campañas basadas en rifas populares
    const raffles = await this.prisma.raffle.findMany({
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    return raffles.map((raffle, index) => {
      const raffleOrders = raffle.orders || [];
      const raffleRevenue = raffleOrders.reduce((sum, order) => sum + order.total, 0);
      const conversions = raffleOrders.length;
      
      // Simulamos métricas de campaña
      const budget = raffleRevenue * 0.2; // 20% del revenue como presupuesto
      const spent = budget * 0.8; // 80% del presupuesto gastado
      const impressions = conversions * 1000; // 1000 impresiones por conversión
      const clicks = conversions * 50; // 50 clics por conversión
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
  }

  async createLookalikeAudience(baseAudienceId: string, similarity: number = 1): Promise<CustomAudience> {
    // Simulamos la creación de una audiencia lookalike
    const baseAudience = await this.getCustomAudiences();
    const base = baseAudience.find(a => a.id === baseAudienceId);
    
    if (!base) {
      throw new Error('Audiencia base no encontrada');
    }

    // Simulamos que la audiencia lookalike es 10x más grande
    const lookalikeSize = Math.round(base.size * 10 * similarity);

    return {
      id: `aud_lookalike_${baseAudienceId}`,
      name: `Lookalike ${base.name}`,
      description: `Audiencia lookalike basada en ${base.name} (${similarity}% similitud)`,
      criteria: {
        type: base.criteria.type,
        conditions: {
          ...base.criteria.conditions,
          lookalike: true,
          similarity,
        },
      },
      size: lookalikeSize,
      lastUpdated: new Date(),
    };
  }

  private async sendToMetaPixel(event: PixelEvent): Promise<void> {
    // Implementación real del envío a Meta Pixel
    // Esto requeriría la configuración de Meta Pixel API
    console.log('🚀 Enviando evento a Meta Pixel:', event);
  }
}
