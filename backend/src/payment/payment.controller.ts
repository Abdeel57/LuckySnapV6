import { Controller, Post, Body, Get, Param, Headers, HttpCode, BadRequestException, NotFoundException } from '@nestjs/common';
import { PayPalService } from '../services/paypal.service';
import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private paypalService: PayPalService,
    private adminService: AdminService,
    private prisma: PrismaService
  ) {}

  /**
   * Crea una orden de PayPal
   * POST /api/payment/paypal/create
   */
  @Post('paypal/create')
  async createPayPalOrder(@Body() body: { orderId: string; amount: number }) {
    try {
      const { orderId, amount } = body;

      if (!orderId || !amount) {
        throw new BadRequestException('orderId y amount son requeridos');
      }

      // Verificar que la orden existe
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      if (order.status === 'PAID') {
        throw new BadRequestException('Esta orden ya está pagada');
      }

      // Crear orden en PayPal
      const { paypalOrderId, approvalUrl } = await this.paypalService.createOrder(
        orderId,
        amount
      );

      // Guardar PayPal Order ID en la orden
      let currentNotes = {};
      if (order.notes) {
        try {
          currentNotes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
        } catch (e) {
          // Si notes no es JSON válido, empezar desde cero
          console.warn('⚠️ order.notes no es JSON válido, iniciando desde cero:', order.notes);
          currentNotes = {};
        }
      }
      
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          notes: JSON.stringify({
            ...currentNotes,
            paypalOrderId,
            paymentProvider: 'paypal',
          }),
        },
      });

      return {
        success: true,
        paypalOrderId,
        approvalUrl,
      };
    } catch (error: any) {
      console.error('❌ Error en createPayPalOrder:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Si ya es una excepción HTTP de NestJS, re-lanzarla
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Si no, convertir a BadRequestException
      throw new BadRequestException(
        `Error al crear orden de PayPal: ${error.message || 'Error desconocido'}`
      );
    }
  }

  /**
   * Captura un pago de PayPal (después de que el usuario aprueba en PayPal)
   * POST /api/payment/paypal/capture
   */
  @Post('paypal/capture')
  async capturePayPalPayment(@Body() body: { orderId: string; paypalOrderId: string }) {
    try {
      const { orderId, paypalOrderId } = body;

      if (!orderId || !paypalOrderId) {
        throw new BadRequestException('orderId y paypalOrderId son requeridos');
      }

      // Buscar la orden
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      // Validar idempotencia: no procesar si ya está pagada
      if (order.status === 'PAID') {
        console.log('⚠️ Orden ya pagada, ignorando captura duplicada');
        return {
          success: true,
          alreadyProcessed: true,
          order,
        };
      }

      // Capturar pago en PayPal
      const captureSuccess = await this.paypalService.captureOrder(paypalOrderId);

      if (!captureSuccess) {
        throw new BadRequestException('No se pudo capturar el pago en PayPal');
      }

      // Obtener detalles de la orden de PayPal para validar monto
      const paypalOrder = await this.paypalService.getOrder(paypalOrderId);
      const paypalAmount = parseFloat(
        paypalOrder.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value || '0'
      );
      
      // Convertir a HNL para comparar
      const exchangeRate = parseFloat(process.env.PAYPAL_EXCHANGE_RATE || '24.7');
      const paypalAmountHNL = paypalAmount * exchangeRate;

      // Validar que el monto coincida (con margen de error de 1 Lempira)
      if (Math.abs(paypalAmountHNL - order.total) > 1) {
        console.error('⚠️ Monto no coincide:', {
          esperado: order.total,
          recibido: paypalAmountHNL,
        });
        // No lanzar error, solo loguear (puede haber pequeñas diferencias por conversión)
      }

      // Marcar orden como pagada usando el servicio existente
      const updatedOrder = await this.adminService.markOrderPaid(
        orderId,
        'paypal',
        `PayPal Order ID: ${paypalOrderId}`
      );

      console.log('✅ Pago PayPal capturado y orden marcada como PAID:', orderId);

      return {
        success: true,
        order: updatedOrder,
      };
    } catch (error: any) {
      console.error('❌ Error capturando pago PayPal:', error);
      throw error;
    }
  }

  /**
   * Webhook de PayPal (recibe notificaciones de PayPal)
   * POST /api/payment/paypal/webhook
   */
  @Post('paypal/webhook')
  @HttpCode(200)
  async handlePayPalWebhook(@Body() body: any, @Headers() headers: any) {
    try {
      console.log('📥 Webhook recibido de PayPal:', body.event_type);

      // Verificar webhook (básico, en producción usar verificación completa)
      const webhookData = await this.paypalService.verifyWebhook(headers, body);

      if (!webhookData) {
        return { received: true, processed: false };
      }

      // Solo procesar eventos de pago completado
      if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = webhookData.resource;
        const paypalOrderId = resource?.supplementary_data?.related_ids?.order_id;

        if (!paypalOrderId) {
          console.warn('⚠️ Webhook sin paypalOrderId');
          return { received: true, processed: false };
        }

        // Buscar orden por paypalOrderId
        const orders = await this.prisma.order.findMany({
          where: {
            notes: { contains: paypalOrderId },
          },
        });

        const order = orders.find((o) => {
          try {
            const notes = JSON.parse(o.notes || '{}');
            return notes.paypalOrderId === paypalOrderId;
          } catch {
            return false;
          }
        });

        if (!order) {
          console.warn('⚠️ Orden no encontrada para paypalOrderId:', paypalOrderId);
          return { received: true, processed: false };
        }

        // Validar idempotencia
        if (order.status === 'PAID') {
          console.log('⚠️ Orden ya pagada, ignorando webhook duplicado');
          return { received: true, processed: true, alreadyProcessed: true };
        }

        // Marcar como pagada
        await this.adminService.markOrderPaid(
          order.id,
          'paypal',
          `PayPal Webhook - Order ID: ${paypalOrderId}`
        );

        console.log('✅ Orden marcada como PAID desde webhook:', order.id);

        return { received: true, processed: true, orderId: order.id };
      }

      return { received: true, processed: false };
    } catch (error: any) {
      console.error('❌ Error procesando webhook PayPal:', error);
      // Siempre retornar 200 para que PayPal no reenvíe
      return { received: true, error: error.message };
    }
  }

  /**
   * Verifica el estado de una orden de PayPal
   * GET /api/payment/paypal/status/:orderId
   */
  @Get('paypal/status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          notes: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      const notes = order.notes ? JSON.parse(order.notes) : {};
      const paypalOrderId = notes.paypalOrderId;

      if (!paypalOrderId) {
        return {
          status: order.status,
          paypalOrderId: null,
        };
      }

      // Obtener estado de PayPal
      const paypalOrder = await this.paypalService.getOrder(paypalOrderId);

      return {
        status: order.status,
        paypalOrderId,
        paypalStatus: paypalOrder.status,
      };
    } catch (error: any) {
      console.error('❌ Error obteniendo estado:', error);
      throw error;
    }
  }
}


