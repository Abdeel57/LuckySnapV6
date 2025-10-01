import { Controller, Post, Body } from '@nestjs/common';
import { TrackingService, TrackingEvent } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('event')
  async trackEvent(@Body() event: TrackingEvent): Promise<{ success: boolean; eventId: string }> {
    let eventId = '';

    switch (event.eventName) {
      case 'PageView':
        await this.trackingService.trackPageView(event.userId, event.sessionId, event.data);
        eventId = `pageview_${Date.now()}`;
        break;
      case 'ViewContent':
        await this.trackingService.trackViewContent(event.data.raffleId, event.data, event.userId);
        eventId = `viewcontent_${Date.now()}`;
        break;
      case 'AddToCart':
        await this.trackingService.trackAddToCart(
          event.data.raffleId,
          event.data.tickets,
          event.data.totalValue,
          event.userId,
        );
        eventId = `addtocart_${Date.now()}`;
        break;
      case 'InitiateCheckout':
        await this.trackingService.trackInitiateCheckout(
          event.data.raffleId,
          event.data.tickets,
          event.data.totalValue,
          event.userId,
        );
        eventId = `checkout_${Date.now()}`;
        break;
      case 'Purchase':
        await this.trackingService.trackPurchase(
          event.data.orderId,
          event.data.raffleId,
          event.data.tickets,
          event.data.totalValue,
          event.userId,
        );
        eventId = `purchase_${Date.now()}`;
        break;
      case 'Lead':
        await this.trackingService.trackLead(event.userId!, event.data);
        eventId = `lead_${Date.now()}`;
        break;
      default:
        await this.trackingService.trackCustomEvent(event.eventName, event.data, event.userId);
        eventId = `custom_${Date.now()}`;
        break;
    }

    return { success: true, eventId };
  }

  @Post('pageview')
  async trackPageView(@Body() body: { userId?: string; sessionId?: string; data?: any }): Promise<{ success: boolean }> {
    await this.trackingService.trackPageView(body.userId, body.sessionId, body.data);
    return { success: true };
  }

  @Post('view-content')
  async trackViewContent(@Body() body: { raffleId: string; data?: any; userId?: string }): Promise<{ success: boolean }> {
    await this.trackingService.trackViewContent(body.raffleId, body.data, body.userId);
    return { success: true };
  }

  @Post('add-to-cart')
  async trackAddToCart(@Body() body: { raffleId: string; tickets: number[]; totalValue: number; userId?: string }): Promise<{ success: boolean }> {
    await this.trackingService.trackAddToCart(body.raffleId, body.tickets, body.totalValue, body.userId);
    return { success: true };
  }

  @Post('initiate-checkout')
  async trackInitiateCheckout(@Body() body: { raffleId: string; tickets: number[]; totalValue: number; userId?: string }): Promise<{ success: boolean }> {
    await this.trackingService.trackInitiateCheckout(body.raffleId, body.tickets, body.totalValue, body.userId);
    return { success: true };
  }

  @Post('purchase')
  async trackPurchase(@Body() body: { orderId: string; raffleId: string; tickets: number[]; totalValue: number; userId?: string }): Promise<{ success: boolean }> {
    await this.trackingService.trackPurchase(body.orderId, body.raffleId, body.tickets, body.totalValue, body.userId);
    return { success: true };
  }

  @Post('lead')
  async trackLead(@Body() body: { userId: string; data?: any }): Promise<{ success: boolean }> {
    await this.trackingService.trackLead(body.userId, body.data);
    return { success: true };
  }
}
