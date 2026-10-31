import { BadRequestException, Body, Controller, Get, HttpException, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RokiPaymentsService } from './roki-payments.service';
import { renderPaymentPage, type HtmlPageInput } from './roki.html';

/**
 * Endpoints públicos del checkout alojado. El folio del pedido (aleatorio, solo
 * lo conoce el comprador) autoriza cada operación, igual que en /public/orders/folio.
 */
@Controller('public/payments/roki')
export class RokiPublicController {
  constructor(private readonly payments: RokiPaymentsService) {}

  @Get('config')
  getConfig() {
    return this.payments.getPublicConfig();
  }

  @Post('orders/:orderId/checkout')
  startCheckout(@Param('orderId') orderId: string, @Body() body: { folio?: string }) {
    const folio = typeof body?.folio === 'string' ? body.folio.trim() : '';
    if (!folio) throw new BadRequestException('Falta el folio del pedido');
    return this.payments.startCheckout(orderId, folio);
  }

  @Get('orders/:orderId/status')
  getStatus(@Param('orderId') orderId: string, @Query('folio') folio?: string) {
    const clean = typeof folio === 'string' ? folio.trim() : '';
    if (!clean) throw new BadRequestException('Falta el folio del pedido');
    return this.payments.getPublicStatus(orderId, clean);
  }

  /**
   * Enlace de pago por folio para compartir (WhatsApp, etc.): crea o reutiliza el
   * cobro del apartado y redirige al checkout de ROKI. Funciona aunque la opción
   * "Tarjeta" esté oculta en la tienda (ROKI_PUBLIC_CHECKOUT=false).
   */
  @Get('pay/:folio')
  async payByFolio(@Param('folio') folio: string, @Res() res: Response) {
    noStore(res);
    const store = `${this.payments.config.publicAppUrl}/`;
    try {
      const checkout = await this.payments.startCheckoutByFolio(folio);
      const target = safeHttpsUrl(checkout.checkoutUrl);
      if (!target) throw new HttpException({ code: 'provider_inconsistent', message: 'El enlace de pago no es válido.' }, 502);
      return res.redirect(302, target);
    } catch (error) {
      const code = errorCode(error);
      const cleanFolio = (folio ?? '').trim().toUpperCase();
      if (code === 'already_paid') return res.redirect(302, `${this.payments.config.publicAppUrl}/#/comprobante/${encodeURIComponent(cleanFolio)}`);
      const status = error instanceof HttpException ? error.getStatus() : 500;
      if (status >= 500) console.error(`❌ [ROKI] Enlace de pago ${cleanFolio}:`, error instanceof Error ? error.message : error);
      const page: HtmlPageInput = {
        tone: status === 404 ? 'danger' : 'warning',
        title: status === 404 ? 'No encontramos este apartado' : 'No se puede pagar con tarjeta',
        message: status === 404 ? 'Revisa que el folio del enlace sea correcto.' : errorMessage(error),
        details: cleanFolio ? [['Folio', cleanFolio]] : undefined,
        actions: [{ label: 'Volver a la tienda', href: store, primary: true }],
      };
      return res.status(status).type('html').send(renderPaymentPage(page));
    }
  }

  /** success_url / cancel_url de ROKI: verifica el cobro al instante y redirige o muestra el estado. */
  @Get('return/:orderId')
  async handleReturn(@Param('orderId') orderId: string, @Query('folio') folio: string, @Query('result') result: string, @Query('n') n: string, @Res() res: Response) {
    noStore(res);
    const store = `${this.payments.config.publicAppUrl}/`;
    const cleanFolio = typeof folio === 'string' ? folio.trim().toUpperCase() : '';
    const cleanResult = result === 'success' ? 'success' : 'cancel';
    const refreshCount = Math.max(0, Math.min(50, Number.parseInt(n ?? '0', 10) || 0));
    try {
      if (!cleanFolio) throw new BadRequestException('Falta el folio');
      const outcome = await this.payments.resolveReturn(orderId, cleanFolio, cleanResult, refreshCount);
      if ('redirect' in outcome) return res.redirect(302, outcome.redirect);
      return res.status(200).type('html').send(renderPaymentPage(outcome.page));
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      if (status >= 500) console.error('❌ [ROKI] Regreso desde el checkout:', error instanceof Error ? error.message : error);
      return res.status(status).type('html').send(
        renderPaymentPage({
          tone: 'danger',
          title: status === 404 ? 'No encontramos este apartado' : 'No pudimos consultar tu pago',
          message: status === 404 ? 'Revisa el enlace o busca tu folio en el verificador.' : 'Si ya pagaste, tu pago se confirmará automáticamente en unos minutos. Guarda tu folio.',
          details: cleanFolio ? [['Folio', cleanFolio]] : undefined,
          actions: [{ label: 'Volver a la tienda', href: store, primary: true }],
        }),
      );
    }
  }
}

function noStore(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function safeHttpsUrl(value: string | null | undefined): string | null {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function errorCode(error: unknown): string | null {
  if (!(error instanceof HttpException)) return null;
  const body = error.getResponse() as { code?: string } | string;
  return typeof body === 'object' && body && typeof body.code === 'string' ? body.code : null;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const body = error.getResponse() as { message?: unknown } | string;
    if (typeof body === 'string') return body;
    if (body && typeof body.message === 'string') return body.message;
  }
  return 'Inténtalo de nuevo más tarde o paga por transferencia.';
}
