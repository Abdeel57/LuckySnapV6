import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Using `import type` for types/namespaces and value import for the enum to fix module resolution.
import { type Prisma, type Raffle, type Winner } from '@prisma/client';

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
        status: 'PAID',
        createdAt: { gte: today },
      },
    });

    const pendingOrders = await this.prisma.order.count({
      where: { status: 'PENDING' },
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
  async getAllOrders(page: number = 1, limit: number = 50, status?: string) {
    try {
      const skip = (page - 1) * limit;
      const where = status ? { status: status as any } : {};
      
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            raffle: {
              select: {
                id: true,
                title: true,
                price: true,
                status: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                district: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);
      
      // Transformar los datos para que coincidan con el frontend
      const transformedOrders = orders.map(order => ({
        ...order,
        customer: {
          id: order.user.id,
          name: order.user.name || 'Sin nombre',
          phone: order.user.phone || 'Sin teléfono',
          email: order.user.email || '',
          district: order.user.district || 'Sin distrito',
        },
        raffleTitle: order.raffle.title,
        total: order.total,
      }));
      
      return {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      // Fallback para evitar crashes
      return {
        orders: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
      };
    }
  }
  
  async updateOrderStatus(folio: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { folio } });
    if (!order) {
        throw new NotFoundException('Order not found');
    }

    if (order.status === status) return order;

    // Handle ticket count adjustment if order is cancelled
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
        await this.prisma.raffle.update({
            where: { id: order.raffleId },
            data: { sold: { decrement: order.tickets.length } },
        });
    }

    return this.prisma.order.update({
        where: { folio },
        data: { status: status as any },
    });
  }

  async updateOrder(id: string, orderData: any) {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Actualizar la orden
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: {
          ...orderData,
          updatedAt: new Date(),
        },
        include: {
          raffle: true,
          user: true,
        },
      });

      // Transformar los datos para el frontend
      return {
        ...updatedOrder,
        customer: {
          id: updatedOrder.user.id,
          name: updatedOrder.user.name || 'Sin nombre',
          phone: updatedOrder.user.phone || 'Sin teléfono',
          email: updatedOrder.user.email || '',
          district: updatedOrder.user.district || 'Sin distrito',
        },
        raffleTitle: updatedOrder.raffle.title,
        total: updatedOrder.total,
      };
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async deleteOrder(id: string) {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Si la orden está completada, ajustar el conteo de boletos vendidos
      if (order.status === 'PAID') {
        await this.prisma.raffle.update({
          where: { id: order.raffleId },
          data: { sold: { decrement: order.tickets.length } },
        });
      }

      await this.prisma.order.delete({ where: { id } });
      return { message: 'Orden eliminada exitosamente' };
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // Raffles
  async getAllRaffles(limit: number = 50) {
    return this.prisma.raffle.findMany({ 
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFinishedRaffles() {
    return this.prisma.raffle.findMany({ where: { status: 'finished' } });
  }
  
  async createRaffle(data: Omit<Raffle, 'id' | 'sold' | 'createdAt' | 'updatedAt'>) {
    try {
      // Generar slug automático si no existe
      const autoSlug = data.slug || data.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
        .replace(/^-+|-+$/g, '') // Quitar guiones del inicio/final
        .substring(0, 50) + '-' + Date.now().toString().slice(-6); // Agregar timestamp para unicidad
      
      // Imagen por defecto si no se proporciona
      const defaultImage = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop';
      
      // Filtrar solo los campos que existen en el esquema de Prisma
      const raffleData = {
        title: data.title,
        description: data.description || null,
        imageUrl: data.imageUrl || defaultImage,
        price: data.price || 50,
        tickets: data.tickets,
        sold: 0,
        drawDate: new Date(data.drawDate),
        status: data.status || 'draft',
        slug: autoSlug,
      };

      console.log('📝 Creating raffle with data:', raffleData);
      
      const createdRaffle = await this.prisma.raffle.create({ 
        data: raffleData 
      });
      
      console.log('✅ Raffle created successfully:', createdRaffle.id);
      return createdRaffle;
    } catch (error) {
      console.error('❌ Error creating raffle:', error);
      throw error;
    }
  }

  async updateRaffle(id: string, data: Raffle) {
    try {
      // Filtrar solo los campos válidos del esquema Prisma
      const raffleData: any = {};
      
      if (data.title !== undefined) raffleData.title = data.title;
      if (data.description !== undefined) raffleData.description = data.description;
      if (data.imageUrl !== undefined) raffleData.imageUrl = data.imageUrl;
      if (data.price !== undefined) raffleData.price = data.price;
      if (data.tickets !== undefined) raffleData.tickets = data.tickets;
      if (data.sold !== undefined) raffleData.sold = data.sold;
      if (data.drawDate !== undefined) raffleData.drawDate = new Date(data.drawDate);
      if (data.status !== undefined) raffleData.status = data.status;
      if (data.slug !== undefined) raffleData.slug = data.slug;
      
      console.log('📝 Updating raffle:', id, 'with data:', raffleData);
      
      const updatedRaffle = await this.prisma.raffle.update({ 
        where: { id }, 
        data: raffleData 
      });
      
      console.log('✅ Raffle updated successfully');
      return updatedRaffle;
    } catch (error) {
      console.error('❌ Error updating raffle:', error);
      throw error;
    }
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
        where: { raffleId, status: 'PAID' }
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
    try {
      // Validate required fields
      if (!data.email || !data.name || !data.password) {
        throw new Error('Email, name, and password are required');
      }
      
      return this.prisma.adminUser.create({ data });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: Prisma.AdminUserUpdateInput) {
    return this.prisma.adminUser.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    return this.prisma.adminUser.delete({ where: { id } });
  }

  // Settings
  async updateSettings(data: any) {
    try {
      const { paymentAccounts, faqs, siteName } = data;
      
      return await this.prisma.settings.upsert({
        where: { id: 'main_settings' },
        update: {
          siteName: siteName || 'Lucky Snap',
          paymentAccounts: paymentAccounts ? JSON.stringify(paymentAccounts) : JSON.stringify([]),
          faqs: faqs ? JSON.stringify(faqs) : JSON.stringify([]),
        },
        create: {
          id: 'main_settings',
          siteName: siteName || 'Lucky Snap',
          paymentAccounts: paymentAccounts ? JSON.stringify(paymentAccounts) : JSON.stringify([]),
          faqs: faqs ? JSON.stringify(faqs) : JSON.stringify([]),
        },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }
}
