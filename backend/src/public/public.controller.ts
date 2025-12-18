import { Controller, Get, Post, Body, Param, NotFoundException, Req, HttpException, HttpStatus, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { TrackingService } from '../tracking/tracking.service';
// FIX: Using `import type` for the Prisma namespace to aid module resolution.
import type { Prisma } from '@prisma/client';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly trackingService: TrackingService,
  ) {}

  @Get('raffles/active')
  getActiveRaffles() {
    return this.publicService.getActiveRaffles();
  }

  @Get('raffles/slug/:slug')
  async getRaffleBySlug(@Param('slug') slug: string, @Req() req: any) {
    const raffle = await this.publicService.getRaffleBySlug(slug);
    if (!raffle) {
      throw new NotFoundException(`Raffle with slug ${slug} not found`);
    }
    
    // Track ViewContent event
    await this.trackingService.trackViewContent(raffle.id, raffle, req.user?.id);
    
    return raffle;
  }

  @Get('raffles/:id/occupied-tickets')
  getOccupiedTickets(
    @Param('id') id: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    const parsedOffset = Number(offset);
    const parsedLimit = Number(limit);

    return this.publicService.getOccupiedTickets(id, {
      offset: Number.isFinite(parsedOffset) ? parsedOffset : 0,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      sortDirection: sort,
    });
  }

  @Get('winners')
  getPastWinners() {
    return this.publicService.getPastWinners();
  }

  @Get('settings')
  async getSettings() {
    try {
      console.log('🔧 Public controller: Getting settings...');
      const settings = await this.publicService.getSettings();
      console.log('✅ Public controller: Settings retrieved successfully');
      return settings;
    } catch (error) {
      console.error('❌ Public controller: Error getting settings:', error);
      // Fallback response if anything fails
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
          tiktokUrl: '',
        },
        paymentAccounts: [],
        faqs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
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

  @Get('test')
  testEndpoint() {
    return {
      message: 'Backend is working!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  @Get('config')
  getConfig() {
    // Alternative endpoint for settings
    return {
      id: 'main_settings',
      siteName: 'Lucky Snap',
      paymentAccounts: [],
      faqs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get('working')
  getWorkingSettings() {
    // This endpoint will definitely work
    return {
      success: true,
      data: {
        id: 'main_settings',
        siteName: 'Lucky Snap',
        paymentAccounts: [],
        faqs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
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
  async createOrder(@Body() orderData: Prisma.OrderUncheckedCreateInput, @Req() req: any) {
    // Track InitiateCheckout event
    await this.trackingService.trackInitiateCheckout(
      orderData.raffleId,
      orderData.tickets as number[],
      orderData.total,
      orderData.userId
    );

    const order = await this.publicService.createOrder(orderData);
    
    // Track Purchase event
    await this.trackingService.trackPurchase(
      order.id,
      orderData.raffleId,
      orderData.tickets as number[],
      orderData.total,
      orderData.userId
    );

    return order;
  }

  @Post('verificar-boleto')
  async verifyTicket(@Body() body: { codigo_qr?: string; numero_boleto?: number; sorteo_id?: string }) {
    try {
      const result = await this.publicService.verifyTicket(body);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error verifying ticket:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al verificar el boleto',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('buscar-boletos')
  async searchTickets(@Body() body: {
    numero_boleto?: number;
    nombre_cliente?: string;
    telefono?: string;
    folio?: string;
    raffleId?: string;
  }) {
    try {
      const result = await this.publicService.searchTickets(body);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error in searchTickets controller:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al buscar boletos',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('orders/folio/:folio')
  async getOrderByFolio(@Param('folio') folio: string) {
    try {
      const order = await this.publicService.getOrderByFolio(folio);
      return order;
    } catch (error) {
      console.error('❌ Error getting order by folio:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al obtener la orden',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
