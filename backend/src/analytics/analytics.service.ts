import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SalesTrend {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface CustomerInsight {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
    lastOrder: Date;
  }>;
}

export interface ConversionFunnel {
  visitors: number;
  interested: number;
  addedToCart: number;
  initiatedCheckout: number;
  completedPurchase: number;
  conversionRate: number;
}

export interface ROIMetrics {
  totalRevenue: number;
  totalAdSpend: number;
  totalOrders: number;
  costPerAcquisition: number;
  returnOnAdSpend: number;
  revenuePerCustomer: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSalesTrends(period: 'day' | 'week' | 'month' = 'day', days: number = 30): Promise<SalesTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'PAID',
      },
      include: {
        raffle: true,
      },
    });

    const trends: { [key: string]: SalesTrend } = {};

    orders.forEach(order => {
      const date = this.formatDate(order.createdAt, period);
      
      if (!trends[date]) {
        trends[date] = {
          date,
          sales: 0,
          orders: 0,
          revenue: 0,
        };
      }

      trends[date].sales += order.tickets.length;
      trends[date].orders += 1;
      trends[date].revenue += order.total;
    });

    return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCustomerInsights(): Promise<CustomerInsight> {
    const customers = await this.prisma.user.findMany({
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.createdAt >= thirtyDaysAgo).length;
    const returningCustomers = customers.filter(c => c.orders && c.orders.length > 1).length;

    let totalRevenue = 0;
    let totalOrders = 0;

    customers.forEach(customer => {
      if (customer.orders) {
        customer.orders.forEach(order => {
          totalRevenue += order.total;
          totalOrders += 1;
        });
      }
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const topCustomers = customers
      .map(customer => {
        const totalSpent = customer.orders ? customer.orders.reduce((sum, order) => sum + order.total, 0) : 0;
        const lastOrder = customer.orders && customer.orders.length > 0 
          ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
          : null;

        return {
          id: customer.id,
          name: customer.name || 'Sin nombre',
          email: customer.email,
          totalSpent,
          orderCount: customer.orders ? customer.orders.length : 0,
          lastOrder,
        };
      })
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageOrderValue,
      customerLifetimeValue,
      topCustomers,
    };
  }

  async getConversionFunnel(): Promise<ConversionFunnel> {
    // Simulamos datos de funnel basados en órdenes reales
    const totalOrders = await this.prisma.order.count();
    const completedOrders = await this.prisma.order.count({
      where: { status: 'PAID' },
    });

    // Estimaciones basadas en ratios típicos de e-commerce
    const completedPurchase = completedOrders;
    const initiatedCheckout = Math.round(completedPurchase * 1.5); // 67% conversión
    const addedToCart = Math.round(initiatedCheckout * 2); // 50% conversión
    const interested = Math.round(addedToCart * 3); // 33% conversión
    const visitors = Math.round(interested * 5); // 20% conversión

    const conversionRate = visitors > 0 ? (completedPurchase / visitors) * 100 : 0;

    return {
      visitors,
      interested,
      addedToCart,
      initiatedCheckout,
      completedPurchase,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getROIMetrics(): Promise<ROIMetrics> {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      include: { user: true },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.userId)).size;

    // Simulamos ad spend basado en revenue (típicamente 15-30% del revenue)
    const totalAdSpend = totalRevenue * 0.2;
    const costPerAcquisition = totalOrders > 0 ? totalAdSpend / totalOrders : 0;
    const returnOnAdSpend = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
    const revenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

    return {
      totalRevenue,
      totalAdSpend,
      totalOrders,
      costPerAcquisition: Math.round(costPerAcquisition * 100) / 100,
      returnOnAdSpend: Math.round(returnOnAdSpend * 100) / 100,
      revenuePerCustomer: Math.round(revenuePerCustomer * 100) / 100,
    };
  }

  async getPopularRaffles(): Promise<Array<{
    id: string;
    title: string;
    ticketsSold: number;
    revenue: number;
    conversionRate: number;
  }>> {
    const raffles = await this.prisma.raffle.findMany({
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    return raffles
      .map(raffle => {
        const ticketsSold = raffle.orders ? raffle.orders.reduce((sum, order) => sum + order.tickets.length, 0) : 0;
        const revenue = raffle.orders ? raffle.orders.reduce((sum, order) => sum + order.total, 0) : 0;
        const conversionRate = 100 > 0 ? (ticketsSold / 100) * 100 : 0;

        return {
          id: raffle.id,
          title: raffle.title,
          ticketsSold,
          revenue,
          conversionRate: Math.round(conversionRate * 100) / 100,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async getAbandonmentAnalysis(): Promise<{
    cartAbandonmentRate: number;
    checkoutAbandonmentRate: number;
    totalAbandonedRevenue: number;
  }> {
    const pendingOrders = await this.prisma.order.count({
      where: { status: 'PENDING' },
    });

    const completedOrders = await this.prisma.order.count({
      where: { status: 'PAID' },
    });

    const totalOrders = pendingOrders + completedOrders;

    const cartAbandonmentRate = totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0;
    const checkoutAbandonmentRate = totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0;

    const abandonedOrders = await this.prisma.order.findMany({
      where: { status: 'PENDING' },
    });

    const totalAbandonedRevenue = abandonedOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      cartAbandonmentRate: Math.round(cartAbandonmentRate * 100) / 100,
      checkoutAbandonmentRate: Math.round(checkoutAbandonmentRate * 100) / 100,
      totalAbandonedRevenue,
    };
  }

  private formatDate(date: Date, period: 'day' | 'week' | 'month'): string {
    switch (period) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
}
