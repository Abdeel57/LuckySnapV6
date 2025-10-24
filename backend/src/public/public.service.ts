import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Using `import type` for Prisma namespace and a value import for the OrderStatus enum.
import { type Prisma } from '@prisma/client';
import { add } from 'date-fns';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getActiveRaffles() {
    return this.prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRaffleBySlug(slug: string) {
    return this.prisma.raffle.findUnique({
      where: { slug },
    });
  }

  async getOccupiedTickets(raffleId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        raffleId,
        status: { in: ['PAID', 'PENDING'] },
      },
      select: { tickets: true },
    });
    return orders.flatMap(o => o.tickets);
  }

  async getPastWinners() {
    return this.prisma.winner.findMany({
        orderBy: { createdAt: 'desc' }
    });
  }

  async getSettings() {
    try {
      console.log('🔧 Getting settings from database...');
      
      const settings = await this.prisma.settings.findUnique({
        where: { id: 'main_settings' },
      });
      
      if (!settings) {
        console.log('⚠️ No settings found, creating default settings');
        // Create default settings if they don't exist
        const newSettings = await this.prisma.settings.create({
          data: {
            id: 'main_settings',
            siteName: 'Lucky Snap',
            logoAnimation: 'rotate',
            primaryColor: '#111827',
            secondaryColor: '#1f2937',
            accentColor: '#ec4899',
            actionColor: '#0ea5e9',
            paymentAccounts: JSON.stringify([]),
            faqs: JSON.stringify([]),
          },
        });
        
        return this.formatSettingsResponse(newSettings);
      }
      
      console.log('✅ Settings found:', settings);
      return this.formatSettingsResponse(settings);
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      // Return default settings if there's an error
      return {
        id: 'main_settings',
        siteName: 'Lucky Snap',
        appearance: {
          siteName: 'Lucky Snap',
          logoAnimation: 'rotate',
          colors: {
            backgroundPrimary: '#111827',
            backgroundSecondary: '#1f2937',
            accent: '#ec4899',
            action: '#0ea5e9',
          }
        },
        contactInfo: {
          whatsapp: '',
          email: '',
        },
        socialLinks: {
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
        },
        paymentAccounts: [],
        faqs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  private formatSettingsResponse(settings: any) {
    return {
      id: settings.id,
      siteName: settings.siteName,
      appearance: {
        siteName: settings.siteName,
        logo: settings.logo,
        favicon: settings.favicon,
        logoAnimation: settings.logoAnimation || 'rotate',
        colors: {
          backgroundPrimary: settings.primaryColor || '#111827',
          backgroundSecondary: settings.secondaryColor || '#1f2937',
          accent: settings.accentColor || '#ec4899',
          action: settings.actionColor || '#0ea5e9',
        }
      },
      contactInfo: {
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
      },
      socialLinks: {
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        twitterUrl: settings.twitterUrl || '',
      },
      paymentAccounts: settings.paymentAccounts ? JSON.parse(settings.paymentAccounts as string) : [],
      faqs: settings.faqs ? JSON.parse(settings.faqs as string) : [],
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  async testDatabaseConnection() {
    try {
      // Simple query to test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  async createOrder(orderData: any) {
    try {
      console.log('📝 Creating order with data:', orderData);
      
      // Verificar que la rifa existe
      const raffle = await this.prisma.raffle.findUnique({ where: { id: orderData.raffleId } });
      if (!raffle) {
        throw new NotFoundException('Raffle not found');
      }
      
      console.log('✅ Raffle found:', raffle.title);
      
      // Crear o buscar el usuario
      let user;
      const userData = orderData.userData || {};
      
      if (userData.email) {
        // Buscar usuario existente por email
        user = await this.prisma.user.findUnique({ where: { email: userData.email } });
      }
      
      if (!user) {
        // Crear nuevo usuario
        user = await this.prisma.user.create({
          data: {
            email: userData.email || `user-${Date.now()}@temp.com`,
            name: userData.name,
            phone: userData.phone,
            district: userData.district,
          },
        });
        console.log('✅ User created:', user.id);
      } else {
        console.log('✅ Existing user found:', user.id);
      }
      
      // Crear la orden
      const newOrder = await this.prisma.order.create({
        data: {
          folio: `LKSNP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          raffleId: orderData.raffleId,
          userId: user.id,
          tickets: orderData.tickets,
          total: orderData.total,
          status: 'PENDING',
          paymentMethod: orderData.paymentMethod || 'transfer',
          notes: orderData.notes || '',
          expiresAt: add(new Date(), { hours: 24 }),
        },
        include: {
          raffle: true,
          user: true,
        },
      });

      console.log('✅ Order created:', newOrder.folio);

      // Actualizar boletos vendidos
      await this.prisma.raffle.update({
        where: { id: orderData.raffleId },
        data: { sold: { increment: Array.isArray(orderData.tickets) ? orderData.tickets.length : 0 } },
      });

      console.log('✅ Raffle updated with sold tickets');

      return newOrder;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async getOrderByFolio(folio: string) {
    return this.prisma.order.findUnique({
      where: { folio: folio.toUpperCase() },
    });
  }
}
