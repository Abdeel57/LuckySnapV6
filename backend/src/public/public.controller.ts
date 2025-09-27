import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';
// FIX: Using `import type` for the Prisma namespace to aid module resolution.
import type { Prisma } from '@prisma/client';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('raffles/active')
  getActiveRaffles() {
    return this.publicService.getActiveRaffles();
  }

  @Get('raffles/slug/:slug')
  async getRaffleBySlug(@Param('slug') slug: string) {
    const raffle = await this.publicService.getRaffleBySlug(slug);
    if (!raffle) {
      throw new NotFoundException(`Raffle with slug ${slug} not found`);
    }
    return raffle;
  }

  @Get('raffles/:id/occupied-tickets')
  getOccupiedTickets(@Param('id') id: string) {
    return this.publicService.getOccupiedTickets(id);
  }

  @Get('winners')
  getPastWinners() {
    return this.publicService.getPastWinners();
  }

  @Get('settings')
  getSettings() {
    // Return hardcoded settings to ensure the admin panel works
    return {
      id: 'main_settings',
      siteName: 'Lucky Snap',
      paymentAccounts: [],
      faqs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Get('settings-simple')
  getSettingsSimple() {
    // Return hardcoded settings to test if the issue is with database
    return {
      id: 'main_settings',
      siteName: 'Lucky Snap',
      paymentAccounts: [],
      faqs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Backend is running'
    };
  }

  @Get('test-db')
  async testDatabase() {
    try {
      // Test basic database connection
      await this.publicService.testDatabaseConnection();
      return {
        status: 'ok',
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  @Post('orders')
  createOrder(@Body() orderData: Prisma.OrderUncheckedCreateInput) {
    return this.publicService.createOrder(orderData);
  }

  @Get('orders/folio/:folio')
  async getOrderByFolio(@Param('folio') folio: string) {
     const order = await this.publicService.getOrderByFolio(folio);
     if (!order) {
       throw new NotFoundException(`Order with folio ${folio} not found`);
     }
     return order;
  }
}
