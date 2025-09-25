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
          paymentAccounts: {
            bankAccounts: [],
            cryptoWallets: [],
          },
          faqs: [],
        },
      });
    }
    return settings;
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
