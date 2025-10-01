import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MetaService, CustomAudience, CampaignMetrics, PixelEvent } from './meta.service';

@Controller('admin/meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Post('track-event')
  async trackEvent(@Body() eventData: Omit<PixelEvent, 'id' | 'timestamp'>): Promise<PixelEvent> {
    return this.metaService.trackEvent(eventData);
  }

  @Get('audiences')
  async getCustomAudiences(): Promise<CustomAudience[]> {
    return this.metaService.getCustomAudiences();
  }

  @Get('campaigns')
  async getCampaignMetrics(): Promise<CampaignMetrics[]> {
    return this.metaService.getCampaignMetrics();
  }

  @Post('audiences/lookalike')
  async createLookalikeAudience(
    @Body() body: { baseAudienceId: string; similarity?: number },
  ): Promise<CustomAudience> {
    return this.metaService.createLookalikeAudience(body.baseAudienceId, body.similarity);
  }

  @Get('pixel-config')
  async getPixelConfig(): Promise<{
    pixelId: string;
    events: string[];
    isActive: boolean;
    lastEvent: Date;
  }> {
    // Configuración del pixel (en producción esto vendría de variables de entorno)
    return {
      pixelId: process.env.META_PIXEL_ID || '1234567890123456',
      events: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'],
      isActive: true,
      lastEvent: new Date(),
    };
  }

  @Get('dashboard')
  async getMetaDashboard(): Promise<{
    audiences: CustomAudience[];
    campaigns: CampaignMetrics[];
    pixelConfig: {
      pixelId: string;
      events: string[];
      isActive: boolean;
      lastEvent: Date;
    };
  }> {
    const [audiences, campaigns, pixelConfig] = await Promise.all([
      this.metaService.getCustomAudiences(),
      this.metaService.getCampaignMetrics(),
      this.getPixelConfig(),
    ]);

    return {
      audiences,
      campaigns,
      pixelConfig,
    };
  }
}
