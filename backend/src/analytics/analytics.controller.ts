import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService, SalesTrend, CustomerInsight, ConversionFunnel, ROIMetrics } from './analytics.service';

@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales-trends')
  async getSalesTrends(
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
    @Query('days') days: string = '30',
  ): Promise<SalesTrend[]> {
    return this.analyticsService.getSalesTrends(period, parseInt(days));
  }

  @Get('customer-insights')
  async getCustomerInsights(): Promise<CustomerInsight> {
    return this.analyticsService.getCustomerInsights();
  }

  @Get('conversion-funnel')
  async getConversionFunnel(): Promise<ConversionFunnel> {
    return this.analyticsService.getConversionFunnel();
  }

  @Get('roi-metrics')
  async getROIMetrics(): Promise<ROIMetrics> {
    return this.analyticsService.getROIMetrics();
  }

  @Get('popular-raffles')
  async getPopularRaffles(): Promise<Array<{
    id: string;
    title: string;
    ticketsSold: number;
    revenue: number;
    conversionRate: number;
  }>> {
    return this.analyticsService.getPopularRaffles();
  }

  @Get('abandonment-analysis')
  async getAbandonmentAnalysis(): Promise<{
    cartAbandonmentRate: number;
    checkoutAbandonmentRate: number;
    totalAbandonedRevenue: number;
  }> {
    return this.analyticsService.getAbandonmentAnalysis();
  }

  @Get('dashboard-summary')
  async getDashboardSummary(): Promise<{
    salesTrends: SalesTrend[];
    customerInsights: CustomerInsight;
    conversionFunnel: ConversionFunnel;
    roiMetrics: ROIMetrics;
    popularRaffles: Array<{
      id: string;
      title: string;
      ticketsSold: number;
      revenue: number;
      conversionRate: number;
    }>;
    abandonmentAnalysis: {
      cartAbandonmentRate: number;
      checkoutAbandonmentRate: number;
      totalAbandonedRevenue: number;
    };
  }> {
    const [
      salesTrends,
      customerInsights,
      conversionFunnel,
      roiMetrics,
      popularRaffles,
      abandonmentAnalysis,
    ] = await Promise.all([
      this.analyticsService.getSalesTrends('day', 30),
      this.analyticsService.getCustomerInsights(),
      this.analyticsService.getConversionFunnel(),
      this.analyticsService.getROIMetrics(),
      this.analyticsService.getPopularRaffles(),
      this.analyticsService.getAbandonmentAnalysis(),
    ]);

    return {
      salesTrends,
      customerInsights,
      conversionFunnel,
      roiMetrics,
      popularRaffles,
      abandonmentAnalysis,
    };
  }
}
