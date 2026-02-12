import { Injectable, BadRequestException } from '@nestjs/common';
import { Client, OrdersController, OrderRequest, OrderApplicationContext, PurchaseUnitRequest, Money, Order, CheckoutPaymentIntent, Configuration, Environment } from '@paypal/paypal-server-sdk';

@Injectable()
export class PayPalService {
  private client: Client;
  private ordersController: OrdersController;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) {
      console.warn('⚠️ PayPal no configurado. Configura PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET');
      return;
    }

    // Configurar directamente con Configuration
    const config: Partial<Configuration> = {
      environment: mode === 'production' ? Environment.Production : Environment.Sandbox,
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
    };

    this.client = new Client(config);
    this.ordersController = new OrdersController(this.client);
    
    console.log('✅ PayPal Service inicializado:', {
      environment: mode,
      clientId: clientId.substring(0, 10) + '...',
    });
  }

  /**
   * Crea una orden de PayPal
   * @param orderId - ID de la orden en tu sistema
   * @param amount - Monto en Lempiras (se convierte a USD)
   * @param currency - Moneda (por defecto USD)
   * @returns URL de aprobación de PayPal y Order ID
   */
  async createOrder(orderId: string, amount: number, currency: string = 'USD'): Promise<{
    paypalOrderId: string;
    approvalUrl: string;
  }> {
    if (!this.client) {
      throw new BadRequestException('PayPal no está configurado');
    }

    try {
      if (!this.ordersController) {
        throw new BadRequestException('PayPal no está configurado');
      }

      // Convertir HNL a USD (tasa aproximada, ajustar según necesidad)
      const exchangeRate = parseFloat(process.env.PAYPAL_EXCHANGE_RATE || '24.7');
      const amountUSD = (amount / exchangeRate).toFixed(2);

      const orderRequest: OrderRequest = {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: orderId,
            description: `Compra de boletos - Orden ${orderId}`,
            amount: {
              currencyCode: currency,
              value: amountUSD,
            } as Money,
          } as PurchaseUnitRequest,
        ],
        applicationContext: {
          brandName: 'Lucky Snap',
          landingPage: 'BILLING',
          userAction: 'PAY_NOW',
          returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/comprobante/${orderId}`,
          cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/purchase/${orderId}`,
        } as OrderApplicationContext,
      };

      const response = await this.ordersController.createOrder({
        body: orderRequest,
        prefer: 'return=representation',
      });
      
      const order = response.result;
      
      if (!order || !order.id) {
        throw new Error('PayPal no devolvió un Order ID válido');
      }

      const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;
      
      if (!approvalUrl) {
        throw new Error('PayPal no devolvió URL de aprobación');
      }

      return {
        paypalOrderId: order.id,
        approvalUrl,
      };
    } catch (error: any) {
      console.error('❌ Error creando orden PayPal:', error);
      throw new BadRequestException(
        `Error al crear orden de PayPal: ${error.message || 'Error desconocido'}`
      );
    }
  }

  /**
   * Captura un pago de PayPal (después de que el usuario aprueba)
   * @param paypalOrderId - ID de la orden de PayPal
   * @returns true si el pago fue exitoso
   */
  async captureOrder(paypalOrderId: string): Promise<boolean> {
    if (!this.ordersController) {
      throw new BadRequestException('PayPal no está configurado');
    }

    try {
      const response = await this.ordersController.captureOrder({
        id: paypalOrderId,
        prefer: 'return=representation',
      });
      
      return response.result?.status === 'COMPLETED';
    } catch (error: any) {
      console.error('❌ Error capturando orden PayPal:', error);
      return false;
    }
  }

  /**
   * Obtiene detalles de una orden de PayPal
   * @param paypalOrderId - ID de la orden de PayPal
   * @returns Detalles de la orden
   */
  async getOrder(paypalOrderId: string): Promise<Order> {
    if (!this.ordersController) {
      throw new BadRequestException('PayPal no está configurado');
    }

    try {
      const response = await this.ordersController.getOrder({
        id: paypalOrderId,
      });
      return response.result;
    } catch (error: any) {
      console.error('❌ Error obteniendo orden PayPal:', error);
      throw new BadRequestException(`Error al obtener orden: ${error.message}`);
    }
  }

  /**
   * Verifica un webhook de PayPal
   * @param headers - Headers de la petición
   * @param body - Body de la petición
   * @returns Datos del evento si es válido
   */
  async verifyWebhook(headers: any, body: any): Promise<any> {
    // Nota: La verificación completa de webhooks requiere configuración adicional
    // Por ahora, validamos básicamente la estructura
    if (!body || !body.event_type) {
      throw new BadRequestException('Webhook inválido');
    }

    // Eventos que nos interesan
    const relevantEvents = [
      'PAYMENT.CAPTURE.COMPLETED',
      'PAYMENT.CAPTURE.DENIED',
      'PAYMENT.CAPTURE.REFUNDED',
    ];

    if (!relevantEvents.includes(body.event_type)) {
      return null; // Evento no relevante
    }

    return body;
  }

  /**
   * Extrae el orderId de tu sistema desde un webhook de PayPal
   * @param webhookData - Datos del webhook
   * @returns orderId de tu sistema o null
   */
  extractOrderIdFromWebhook(webhookData: any): string | null {
    try {
      // El reference_id que guardamos al crear la orden
      const resource = webhookData.resource;
      if (resource?.supplementary_data?.related_ids?.order_id) {
        // Necesitamos obtener la orden de PayPal para ver el reference_id
        // Por ahora, usamos el custom_id si está disponible
        return resource?.custom_id || null;
      }
      
      // Alternativa: buscar en purchase_units
      if (resource?.purchase_units?.[0]?.reference_id) {
        return resource.purchase_units[0].reference_id;
      }

      return null;
    } catch (error) {
      console.error('Error extrayendo orderId del webhook:', error);
      return null;
    }
  }
}


