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
    const settings = await this.prisma.settings.findUnique({
      where: { id: 'main_settings' },
    });
     if (!settings) {
      // Create default settings if they don't exist
      return this.prisma.settings.create({
        data: {
          id: 'main_settings',
          siteName: 'Lucky Snap',
          appearance: JSON.stringify({
            siteName: 'Lucky Snap',
            logoUrl: '',
            logoAnimation: 'none',
            colors: {
              backgroundPrimary: '#0f172a',
              backgroundSecondary: '#1e293b',
              accent: '#3b82f6',
              action: '#10b981'
            }
          }),
          contactInfo: JSON.stringify({
            whatsapp: '',
            email: ''
          }),
          socialLinks: JSON.stringify({
            facebookUrl: '',
            instagramUrl: '',
            twitterUrl: ''
          }),
          paymentAccounts: JSON.stringify([]),
          faqs: JSON.stringify([]),
        },
      });
    }
    
    // Parse JSON fields for frontend
    return {
      ...settings,
      appearance: settings.appearance ? JSON.parse(settings.appearance as string) : null,
      contactInfo: settings.contactInfo ? JSON.parse(settings.contactInfo as string) : null,
      socialLinks: settings.socialLinks ? JSON.parse(settings.socialLinks as string) : null,
      paymentAccounts: settings.paymentAccounts ? JSON.parse(settings.paymentAccounts as string) : [],
      faqs: settings.faqs ? JSON.parse(settings.faqs as string) : [],
    };
  }

  async createOrder(orderData: Prisma.OrderUncheckedCreateInput) {
    const raffle = await this.prisma.raffle.findUnique({ where: { id: orderData.raffleId } });
    if (!raffle) {
        throw new NotFoundException('Raffle not found');
    }
    
    const newOrder = await this.prisma.order.create({
        data: {
            ...orderData,
            folio: `LKSNP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            status: 'PENDING',
            createdAt: new Date(),
            expiresAt: add(new Date(), { hours: 24 }),
        }
    });

    // This should ideally be in a transaction
    await this.prisma.raffle.update({
        where: { id: orderData.raffleId },
        data: { sold: { increment: Array.isArray(orderData.tickets) ? orderData.tickets.length : 0 } },
    });

    return newOrder;
  }

  async getOrderByFolio(folio: string) {
    return this.prisma.order.findUnique({
      where: { folio: folio.toUpperCase() },
    });
  }
}
