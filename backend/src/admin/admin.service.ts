import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Using `import type` for types/namespaces and value import for the enum to fix module resolution.
import { OrderStatus, type Prisma, type Raffle, type Winner } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: OrderStatus.PAID,
        createdAt: { gte: today },
      },
    });

    const pendingOrders = await this.prisma.order.count({
      where: { status: OrderStatus.PENDING },
    });

    const activeRaffles = await this.prisma.raffle.count({
      where: { status: 'active' },
    });

    return {
      todaySales: todaySales._sum.total || 0,
      pendingOrders,
      activeRaffles,
    };
  }

  // Orders
  async getAllOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async updateOrderStatus(folio: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { folio } });
    if (!order) {
        throw new NotFoundException('Order not found');
    }

    if (order.status === status) return order;

    // Handle ticket count adjustment if order is cancelled
    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        await this.prisma.raffle.update({
            where: { id: order.raffleId },
            data: { sold: { decrement: order.tickets.length } },
        });
    }

    return this.prisma.order.update({
        where: { folio },
        data: { status },
    });
  }

  // Raffles
  async getAllRaffles() {
    return this.prisma.raffle.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getFinishedRaffles() {
    return this.prisma.raffle.findMany({ where: { status: 'finished' } });
  }
  
  async createRaffle(data: Omit<Raffle, 'id' | 'sold' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.raffle.create({ data: { ...data, sold: 0 } as any });
  }

  async updateRaffle(id: string, data: Raffle) {
    return this.prisma.raffle.update({ where: { id }, data });
  }

  async deleteRaffle(id: string) {
    return this.prisma.raffle.delete({ where: { id } });
  }

  // Winners
  async getAllWinners() {
    return this.prisma.winner.findMany({ orderBy: { createdAt: 'desc' } });
  }
  
  async drawWinner(raffleId: string) {
    const paidOrders = await this.prisma.order.findMany({
        where: { raffleId, status: OrderStatus.PAID }
    });
    
    if (paidOrders.length === 0) {
        throw new BadRequestException("No hay boletos pagados para este sorteo.");
    }
    
    const allPaidTickets = paidOrders.flatMap(o => o.tickets);
    if(allPaidTickets.length === 0) {
        throw new BadRequestException("No hay boletos pagados para este sorteo.");
    }

    const winningTicket = allPaidTickets[Math.floor(Math.random() * allPaidTickets.length)];
    const winningOrder = paidOrders.find(o => o.tickets.includes(winningTicket));

    if (!winningOrder) {
         throw new Error("Error interno al encontrar al ganador.");
    }

    return { ticket: winningTicket, order: winningOrder };
  }

  async saveWinner(data: Omit<Winner, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.winner.create({ data: data as any });
  }

  async deleteWinner(id: string) {
    return this.prisma.winner.delete({ where: { id } });
  }

  // Users
  async getUsers() {
    return this.prisma.adminUser.findMany();
  }

  async createUser(data: Prisma.AdminUserCreateInput) {
    return this.prisma.adminUser.create({ data });
  }

  async updateUser(id: string, data: Prisma.AdminUserUpdateInput) {
    return this.prisma.adminUser.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    return this.prisma.adminUser.delete({ where: { id } });
  }

  // Settings
  async updateSettings(data: any) {
    const { paymentAccounts, faqs, ...mainSettings } = data;
    
    return this.prisma.settings.upsert({
      where: { id: 'main_settings' },
      update: {
        ...mainSettings,
        paymentAccounts: {
          deleteMany: {}, // Clear old ones
          create: paymentAccounts.map(({ id, ...pa }) => pa), // Create new ones
        },
        faqs: {
          deleteMany: {}, // Clear old ones
          create: faqs.map(({ id, ...faq }) => faq), // Create new ones
        },
      },
      create: {
        ...mainSettings,
        id: 'main_settings', // Ensure ID is set on creation
        paymentAccounts: {
          create: paymentAccounts.map(({ id, ...pa }) => pa),
        },
        faqs: {
          create: faqs.map(({ id, ...faq }) => faq),
        },
      },
       include: { paymentAccounts: true, faqs: true }
    });
  }
}
