// Meta Pixel Service for Frontend
declare global {
  interface Window {
    fbq: any;
  }
}

interface PixelEvent {
  eventName: string;
  eventData: any;
  userId?: string;
  sessionId?: string;
}

class MetaPixelService {
  private pixelId: string | null = null;
  private isInitialized: boolean = false;
  private eventQueue: PixelEvent[] = [];

  constructor() {
    this.loadPixelConfig();
  }

  private async loadPixelConfig() {
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/admin/meta/pixel-config`);
      const config = await response.json();
      this.pixelId = config.pixelId;
      this.initializePixel();
    } catch (error) {
      // Error logging removed for production
      // Usar ID por defecto si falla
      this.pixelId = '1234567890123456';
      this.initializePixel();
    }
  }

  private initializePixel() {
    if (!this.pixelId || this.isInitialized) return;

    // Create script element
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${this.pixelId}');
      fbq('track', 'PageView');
    `;

    // Create noscript element
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);

    // Add to document
    document.head.appendChild(script);
    document.body.appendChild(noscript);

    this.isInitialized = true;
    // Removed console.log for production performance

    // Process queued events
    this.processEventQueue();
  }

  private processEventQueue() {
    if (!this.isInitialized || this.eventQueue.length === 0) return;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEventDirect(event);
      }
    }
  }

  private trackEventDirect(event: PixelEvent) {
    if (!window.fbq || !this.isInitialized) {
      console.warn('Meta Pixel not initialized, queuing event:', event);
      this.eventQueue.push(event);
      return;
    }

    try {
      window.fbq('track', event.eventName, event.eventData);
      // Removed console.log for production performance
      
      // Also send to backend for analytics (DESACTIVADO)
      this.sendToBackend(event);
    } catch (error) {
      // Error logging removed for production
    }
  }

  private async sendToBackend(event: PixelEvent) {
    // DESACTIVADO: Causa 500 errors constantes y consume memoria en móviles
    // El tracking de Meta Pixel funciona sin enviar al backend
    return;
  }

  // Public methods
  public trackPageView(url?: string, title?: string, userId?: string) {
    this.trackEventDirect({
      eventName: 'PageView',
      eventData: {
        page_url: url || window.location.href,
        page_title: title || document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      },
      userId,
      sessionId: this.getSessionId(),
    });
  }

  public trackViewContent(raffleId: string, raffleData?: any, userId?: string) {
    this.trackEventDirect({
      eventName: 'ViewContent',
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle',
        content_name: raffleData?.title,
        content_category: 'gaming',
        value: raffleData?.price || 0,
        currency: 'MXN',
      },
      userId,
      sessionId: this.getSessionId(),
    });
  }

  public trackAddToCart(raffleId: string, tickets: number[], totalValue: number, userId?: string) {
    this.trackEventDirect({
      eventName: 'AddToCart',
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle_ticket',
        content_name: `Boletos ${tickets.join(', ')}`,
        value: totalValue,
        currency: 'MXN',
        num_items: tickets.length,
      },
      userId,
      sessionId: this.getSessionId(),
    });
  }

  public trackInitiateCheckout(raffleId: string, tickets: number[], totalValue: number, userId?: string) {
    this.trackEventDirect({
      eventName: 'InitiateCheckout',
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle_ticket',
        value: totalValue,
        currency: 'MXN',
        num_items: tickets.length,
      },
      userId,
      sessionId: this.getSessionId(),
    });
  }

  public trackPurchase(orderId: string, raffleId: string, tickets: number[], totalValue: number, userId?: string) {
    this.trackEventDirect({
      eventName: 'Purchase',
      eventData: {
        content_ids: [raffleId],
        content_type: 'raffle_ticket',
        value: totalValue,
        currency: 'MXN',
        num_items: tickets.length,
        order_id: orderId,
      },
      userId,
      sessionId: this.getSessionId(),
    });
  }

  public trackLead(userId: string, leadData?: any) {
    this.trackEventDirect({
      eventName: 'Lead',
      eventData: {
        content_name: 'User Registration',
        content_category: 'sign_up',
        value: 0,
        currency: 'MXN',
        ...leadData,
      },
      userId,
      sessionId: this.getSessionId(),
    });
  }

  public trackCustomEvent(eventName: string, eventData: any, userId?: string) {
    this.trackEventDirect({
      eventName,
      eventData,
      userId,
      sessionId: this.getSessionId(),
    });
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('meta_pixel_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('meta_pixel_session_id', sessionId);
    }
    return sessionId;
  }

  public isReady(): boolean {
    return this.isInitialized && !!window.fbq;
  }

  public getPixelId(): string | null {
    return this.pixelId;
  }
}

// Create singleton instance
const metaPixelService = new MetaPixelService();

export default metaPixelService;

// Auto-track page views on route changes
if (typeof window !== 'undefined') {
  // Track initial page view
  metaPixelService.trackPageView();

  // Track page views on navigation (for SPAs)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      metaPixelService.trackPageView();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
