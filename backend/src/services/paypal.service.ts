import { Injectable, BadRequestException } from '@nestjs/common';
import { Client, OrdersController, OrderRequest, OrderApplicationContext, PurchaseUnitRequest, Money, Order, CheckoutPaymentIntent, Configuration, Environment, OrderApplicationContextLandingPage, OrderApplicationContextUserAction, Item } from '@paypal/paypal-server-sdk';

@Injectable()
export class PayPalService {
  private client: Client;
  private ordersController: OrdersController;
  private clientId: string;
  private clientSecret: string;
  private mode: string;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    this.clientId = clientId || '';
    this.clientSecret = clientSecret || '';
    this.mode = mode;

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
   * Genera un client token para Card Fields
   */
  async generateClientToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('PayPal no está configurado');
    }

    const baseUrl = this.mode === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/identity/generate-token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || data?.error || response.statusText;
      throw new BadRequestException(`Error al generar client token de PayPal: ${message}`);
    }

    if (!data?.client_token) {
      throw new BadRequestException('PayPal no devolvió client_token');
    }

    return data.client_token;
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
      let amountUSD = parseFloat((amount / exchangeRate).toFixed(2));
      
      // Validar monto mínimo de PayPal ($0.01 USD)
      if (amountUSD < 0.01) {
        throw new BadRequestException(
          `El monto mínimo para PayPal es $0.01 USD. Monto calculado: $${amountUSD.toFixed(2)} USD (L. ${amount})`
        );
      }
      
      // Asegurar que el monto tenga exactamente 2 decimales
      const amountUSDString = amountUSD.toFixed(2);

      // Validar y limpiar FRONTEND_URL
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // Remover trailing slash y hash
      frontendUrl = frontendUrl.replace(/\/$/, '').replace(/#.*$/, '');
      
      // Validar que las URLs sean válidas
      try {
        new URL(frontendUrl);
      } catch (e) {
        throw new BadRequestException(`FRONTEND_URL inválida: ${frontendUrl}`);
      }

      // Validar que las URLs sean HTTPS en producción
      if (this.mode === 'production') {
        if (!frontendUrl.startsWith('https://')) {
          throw new BadRequestException(
            `FRONTEND_URL debe ser HTTPS en producción: ${frontendUrl}`
          );
        }
      }

      // Construir URLs de retorno (sin hash, sin trailing slash)
      const returnUrl = `${frontendUrl}/comprobante/${orderId}`;
      const cancelUrl = `${frontendUrl}/purchase/${orderId}`;

      // Validar que las URLs sean accesibles (al menos que sean URLs válidas)
      try {
        const returnUrlObj = new URL(returnUrl);
        const cancelUrlObj = new URL(cancelUrl);
        
        // En producción, las URLs deben ser HTTPS
        if (this.mode === 'production') {
          if (returnUrlObj.protocol !== 'https:' || cancelUrlObj.protocol !== 'https:') {
            throw new BadRequestException('Las URLs de retorno deben ser HTTPS en producción');
          }
        }
      } catch (e: any) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException(`URLs inválidas: ${e.message}`);
      }

      // Crear referencia única para evitar duplicados
      const referenceId = `LS-${orderId.substring(0, 40)}`; // Máximo 50 caracteres
      const customId = orderId; // Usar el orderId completo como custom_id para webhooks

      // Construir purchase unit con todos los campos necesarios
      const purchaseUnit: any = {
        referenceId: referenceId,
        description: `Compra de boletos - Orden ${orderId}`.substring(0, 127), // PayPal limita a 127 caracteres
        amount: {
          currencyCode: currency,
          value: amountUSDString,
        } as Money,
      };

      // Agregar customId si está disponible (para webhooks)
      if (customId) {
        purchaseUnit.customId = customId;
      }

      const orderRequest: OrderRequest = {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [purchaseUnit as PurchaseUnitRequest],
        applicationContext: {
          brandName: 'Lucky Snap',
          landingPage: OrderApplicationContextLandingPage.Billing,
          userAction: OrderApplicationContextUserAction.PayNow,
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
          locale: 'es-HN', // Especificar locale para Honduras
        } as OrderApplicationContext,
      };

      console.log('📤 Creando orden en PayPal con:', {
        orderId,
        amountHNL: amount,
        amountUSD: amountUSDString,
        currency,
        mode: this.mode,
        hasClient: !!this.client,
        hasController: !!this.ordersController,
        frontendUrl,
        returnUrl,
        cancelUrl,
        referenceId,
        customId,
        purchaseUnitCount: orderRequest.purchaseUnits?.length || 0,
        orderRequest: JSON.stringify(orderRequest, null, 2),
      });

      // Validación final antes de enviar
      if (!orderRequest.purchaseUnits || orderRequest.purchaseUnits.length === 0) {
        throw new BadRequestException('La orden debe tener al menos una purchase unit');
      }

      const firstUnit = orderRequest.purchaseUnits[0];
      if (!firstUnit.amount || !firstUnit.amount.value || !firstUnit.amount.currencyCode) {
        throw new BadRequestException('La purchase unit debe tener amount válido');
      }

      if (parseFloat(firstUnit.amount.value) < 0.01) {
        throw new BadRequestException(`El monto debe ser al menos $0.01 USD. Actual: $${firstUnit.amount.value}`);
      }

      const response = await this.ordersController.createOrder({
        body: orderRequest,
        prefer: 'return=representation',
      });
      
      const order = response.result;
      
      if (!order || !order.id) {
        console.error('❌ PayPal response sin order ID:', JSON.stringify(response, null, 2));
        throw new Error('PayPal no devolvió un Order ID válido');
      }

      const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;
      
      if (!approvalUrl) {
        console.error('❌ PayPal order sin approval URL:', JSON.stringify(order, null, 2));
        throw new Error('PayPal no devolvió URL de aprobación');
      }

      console.log('✅ Orden PayPal creada exitosamente:', {
        paypalOrderId: order.id,
        approvalUrl,
      });

      return {
        paypalOrderId: order.id,
        approvalUrl,
      };
    } catch (error: any) {
      console.error('❌ Error creando orden PayPal:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error statusCode:', error?.statusCode);
      console.error('❌ Error response:', error?.response);
      console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Intentar extraer más información del error
      let errorDetails = error?.message || 'Error desconocido';
      
      if (error?.response) {
        console.error('❌ PayPal API Error Response:', JSON.stringify(error.response, null, 2));
        if (error.response.body) {
          try {
            const body = typeof error.response.body === 'string' 
              ? JSON.parse(error.response.body) 
              : error.response.body;
            errorDetails = body?.message || body?.error_description || body?.details?.[0]?.description || errorDetails;
            console.error('❌ PayPal Error Body:', JSON.stringify(body, null, 2));
          } catch (e) {
            console.error('❌ Error parsing response body:', e);
          }
        }
      }
      
      if (error?.body) {
        try {
          const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
          errorDetails = body?.message || body?.error_description || body?.details?.[0]?.description || errorDetails;
          console.error('❌ PayPal Error Body (direct):', JSON.stringify(body, null, 2));
        } catch (e) {
          console.error('❌ Error parsing error body:', e);
        }
      }
      
      throw new BadRequestException(
        `Error al crear orden de PayPal: ${errorDetails}`
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


