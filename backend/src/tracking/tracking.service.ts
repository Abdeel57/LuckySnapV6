import { Injectable } from '@nestjs/common';
import { MetaService } from '../meta/meta.service';

export interface TrackingEvent {
  eventName: string;
  userId?: string;
  sessionId?: string;
  data: any;
  source: 'web' | 'mobile' | 'api';
}

@Injectable()
export class TrackingService {
  constructor(private metaService: MetaService) {}

  async trackPageView(userId?: string, sessionId?: string, pageData?: any): Promise<void> {
    await this.metaService.trackEvent({
      eventName: 'PageView',
      userId,
      sessionId,
      eventData: {
        page_url: pageData?.url || window?.location?.href,
        page_title: pageData?.title || document?.title,
        referrer: pageData?.referrer || document?.referrer,
        user_agent: pageData?.userAgent || navigator?.userAgent,
      },
      source: 'web',
    });
  }

  async trackViewContent(raffleId: string, raffleData?: any, userId?: string): Promise<void> {
    await this.metaService.trackEvent({
      eventName: 'ViewContent',
      userId,
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle',
        content_name: raffleData?.title,
        content_category: 'gaming',
        value: raffleData?.price || 0,
        currency: 'MXN',
      },
      source: 'web',
    });
  }

  async trackAddToCart(raffleId: string, tickets: number[], totalValue: number, userId?: string): Promise<void> {
    await this.metaService.trackEvent({
      eventName: 'AddToCart',
      userId,
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle_ticket',
        content_name: `Boletos ${tickets.join(', ')}`,
        value: totalValue,
        currency: 'MXN',
        num_items: tickets.length,
      },
      source: 'web',
    });
  }

  async trackInitiateCheckout(raffleId: string, tickets: number[], totalValue: number, userId?: string): Promise<void> {
    await this.metaService.trackEvent({
      eventName: 'InitiateCheckout',
      userId,
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle_ticket',
        value: totalValue,
        currency: 'MXN',
        num_items: tickets.length,
      },
      source: 'web',
    });
  }

  async trackPurchase(
    orderId: string,
    raffleId: string,
    tickets: number[],
    totalValue: number,
    userId?: string,
  ): Promise<void> {
    await this.metaService.trackEvent({
      eventName: 'Purchase',
      userId,
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle_ticket',
        value: totalValue,
        currency: 'MXN',
        num_items: tickets.length,
        order_id: orderId,
      },
      source: 'web',
    });
  }

  async trackLead(userId: string, leadData?: any): Promise<void> {
    await this.metaService.trackEvent({
      eventName: 'Lead',
      userId,
      eventData: {
        content_name: 'User Registration',
        content_category: 'sign_up',
        value: 0,
        currency: 'MXN',
        ...leadData,
      },
      source: 'web',
    });
  }

  async trackCustomEvent(eventName: string, eventData: any, userId?: string): Promise<void> {
    await this.metaService.trackEvent({
      eventName,
      userId,
      eventData,
      source: 'web',
    });
  }
}
