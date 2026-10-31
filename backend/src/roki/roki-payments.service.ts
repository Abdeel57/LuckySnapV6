import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { Prisma, Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { RokiConfigService, describeRokiConfig, apiOrigin, ROKI_PAY_LINK_PATH, ROKI_RETURN_PATH } from './roki.config';
import { RokiApiError, RokiClient } from './roki.client';
import { verifyRokiSignature } from './roki.signature';
import {
  amountsMatch,
  buildIdempotencyKey,
  decideConfirmation,
  derivePublicState,
  formatHondurasDateTime,
  isLegitimateTotal,
  nextCheckDelayMs,
  normalizeProviderStatus,
  parseProviderDate,
  round2,
  toNumber,
  TERMINAL_UNPAID_STATUSES,
  type PaymentStatus,
  type PublicPaymentState,
} from './roki.decision';
import type { RokiCreatePaymentBody, RokiPayment, RokiWebhookEvent } from './roki.types';
import type { HtmlAction, HtmlPageInput } from './roki.html';

const PROVIDER = 'roki';
const STATUS_POLL_MIN_INTERVAL_MS = 10_000; // la pantalla de resultado no fuerza más de una consulta a ROKI cada 10 s
const RETURN_MIN_CHECK_INTERVAL_MS = 2_000; // el regreso desde el checkout verifica casi siempre
const MAX_LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const RELEASED_ORDER_STATUSES = ['CANCELLED', 'EXPIRED', 'RELEASED'];

export interface CheckoutResponse {
  paymentId: string;
  providerPaymentId: number | null;
  checkoutUrl: string;
  expiresAt: string | null;
  status: PaymentStatus;
  reused: boolean;
}

export interface PublicStatusResponse {
  state: PublicPaymentState;
  provider: 'roki';
  environment: string;
  order: {
    id: string;
    folio: string;
    status: string;
    total: number;
    tickets: number[];
    expiresAt: string;
    raffle: { title: string; slug: string | null };
  };
  payment: {
    id: string;
    status: PaymentStatus;
    providerPaymentId: number | null;
    checkoutUrl: string | null;
    expiresAt: string | null;
    paidAt: string | null;
    confirmedAt: string | null;
    amount: number;
    currencyIso: string;
    reviewPending: boolean;
  } | null;
  canContinue: boolean; // el enlace actual sigue vigente
  canRetry: boolean; // se puede crear un enlace nuevo
}

export type SyncResult =
  | { result: 'confirmed'; reinstated: boolean }
  | { result: 'already_confirmed' }
  | { result: 'not_paid'; status: PaymentStatus }
  | { result: 'review'; reason: string }
  | { result: 'no_provider_id' }
  | { result: 'error'; error: string };

export interface ReconcileSummary {
  startedAt: string;
  finishedAt: string;
  checked: number;
  confirmed: number;
  review: number;
  terminal: number;
  stillPending: number;
  errors: number;
  adopted: number;
  eventsReprocessed: number;
  skipped?: string;
}

const isUniqueViolation = (error: unknown): boolean => (error as { code?: string })?.code === 'P2002';

@Injectable()
export class RokiPaymentsService {
  private reconciling = false;
  private merchantIdCache: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: RokiConfigService,
    private readonly client: RokiClient,
    private readonly adminService: AdminService,
  ) {}

  get config() {
    return this.configService.config;
  }

  // ───────────────────────────────── Público ─────────────────────────────────

  getPublicConfig() {
    return {
      provider: 'roki' as const,
      // La tienda solo muestra la opción si además ROKI_PUBLIC_CHECKOUT=true (permite probar en producción sin exponerla)
      enabled: this.config.enabled && this.config.publicCheckout,
      environment: this.config.environment,
      currencyIso: this.config.currencyIso,
      currencyCode: this.config.currencyCode,
    };
  }

  /** Crea (o reutiliza) el enlace de pago de un pedido PENDING. El folio actúa como autorización. */
  async startCheckout(orderId: string, folio: string): Promise<CheckoutResponse> {
    if (!this.config.enabled) throw new ServiceUnavailableException('El pago con tarjeta no está disponible en este momento.');

    const order = await this.loadOrderForCustomer(orderId, folio);
    const now = new Date();

    if (order.status === 'PAID') throw new ConflictException({ code: 'already_paid', message: 'Este pedido ya está pagado.' });
    if (order.status !== 'PENDING') throw new ConflictException({ code: 'order_not_pending', message: 'Este apartado ya no está vigente. Elige tus boletos de nuevo.' });

    const minLead = this.config.minMinutesBeforeOrderExpiry * 60_000;
    if (order.expiresAt.getTime() - now.getTime() < minLead) {
      throw new ConflictException({ code: 'order_expiring', message: 'El apartado está por vencer. Elige tus boletos de nuevo para pagar con tarjeta.' });
    }

    const attempts = order.payments.filter((p) => p.provider === PROVIDER && p.environment === this.config.environment);

    const paidAttempt = attempts.find((p) => p.status === 'paid' || p.confirmedAt);
    if (paidAttempt) {
      throw new ConflictException({ code: 'payment_received', message: 'Ya recibimos un pago para este pedido y lo estamos verificando.' });
    }

    // El sorteo debe seguir abierto: no se cobra un boleto de un sorteo cerrado o ya realizado
    const drawAt = order.raffle?.drawDate ? new Date(order.raffle.drawDate).getTime() : null;
    if (!order.raffle || order.raffle.status === 'finished' || (drawAt !== null && drawAt - now.getTime() < minLead)) {
      throw new ConflictException({ code: 'raffle_closed', message: 'Este sorteo ya cerró y no admite pagos.' });
    }

    const active = attempts.find((p) => p.status === 'pending' && p.checkoutUrl && p.providerPaymentId !== null && (!p.expiresAt || p.expiresAt.getTime() > now.getTime() + 60_000));
    if (active && amountsMatch(active.amountExpected, order.total)) {
      return this.toCheckoutResponse(active, true);
    }

    // Instantánea del pedido en el momento de crear el pago
    const amount = round2(order.total);
    if (!(amount >= 0.01)) throw new ConflictException({ code: 'invalid_amount', message: 'El importe del pedido no es válido.' });

    // El total lo envía el navegador al crear el pedido: se recalcula con el precio del sorteo antes de cobrar
    const pricing = isLegitimateTotal(amount, { price: order.raffle.price, tickets: order.raffle.tickets, packs: order.raffle.packs }, order.tickets);
    if (!pricing.ok) {
      console.warn(`🚫 [ROKI] Importe no verificable para ${order.folio}: total ${amount} · comprados ${pricing.purchased} · válidos ${pricing.allowed.join(', ') || 'ninguno'}`);
      throw new ConflictException({ code: 'amount_unverified', message: 'No pudimos validar el importe de este pedido para pagar con tarjeta. Paga por transferencia o escríbenos por WhatsApp.' });
    }

    const linkExpiresAt = new Date(Math.min(order.expiresAt.getTime(), drawAt ?? Number.POSITIVE_INFINITY, now.getTime() + MAX_LINK_LIFETIME_MS));
    const attemptNumber = attempts.length + 1;
    const idempotencyKey = buildIdempotencyKey({
      environment: this.config.environment,
      orderId: order.id,
      amount,
      currencyCode: this.config.currencyCode,
      tickets: order.tickets,
      attempt: attemptNumber,
    });

    // Con PUBLIC_API_URL el regreso pasa por el backend, que verifica el cobro al instante y luego redirige
    const resultUrl = (result: 'success' | 'cancel') => this.returnUrl(order.id, order.folio, result);

    const body: RokiCreatePaymentBody = {
      amount,
      currency_code: this.config.currencyCode,
      external_reference: order.folio.slice(0, 191),
      name: (order.raffle?.title || 'Lucky Snap').slice(0, 191),
      description: `Folio ${order.folio} · ${order.tickets.length} boleto(s)`.slice(0, 120),
      metadata: {
        order_id: order.id,
        folio: order.folio,
        raffle_id: order.raffleId,
        attempt: attemptNumber,
        environment: this.config.environment,
      },
      success_url: resultUrl('success'),
      cancel_url: resultUrl('cancel'),
      expires_at: formatHondurasDateTime(linkExpiresAt),
      reusable: false,
      sales_tax_type: 'none',
      tip_enabled: false,
      service_fee_enabled: false,
    };
    const customer = this.buildCustomer(order.user);
    if (customer) body.customer = customer;

    const merchantId = await this.getMerchantId();

    let row: Payment;
    try {
      row = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: PROVIDER,
          environment: this.config.environment,
          merchantId,
          status: 'pending',
          externalReference: order.folio,
          idempotencyKey,
          amountExpected: amount,
          currencyCode: this.config.currencyCode,
          currencyIso: this.config.currencyIso,
          requestSnapshot: body as unknown as Prisma.InputJsonValue,
          expiresAt: linkExpiresAt,
          nextCheckAt: new Date(now.getTime() + 60_000),
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
        if (existing?.checkoutUrl) return this.toCheckoutResponse(existing, true);
      }
      throw error;
    }

    let providerPayment: RokiPayment;
    try {
      providerPayment = await this.client.createPayment(body, idempotencyKey);
    } catch (error) {
      const detail = error instanceof RokiApiError ? `${error.status}: ${error.message}` : String(error);
      console.error(`❌ [ROKI] No se pudo crear el pago del folio ${order.folio}: ${detail}`);
      await this.prisma.payment.update({
        where: { id: row.id },
        data: { status: 'failed', providerSnapshot: { error: detail.slice(0, 500) } as Prisma.InputJsonValue, nextCheckAt: null },
      });
      throw new HttpException(
        { code: 'provider_error', message: 'No se pudo iniciar el pago con tarjeta. Intenta de nuevo o paga por transferencia.' },
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (Array.isArray(providerPayment.warnings) && providerPayment.warnings.length > 0) {
      console.warn(`⚠️ [ROKI] Advertencias al crear pago ${providerPayment.id}: ${providerPayment.warnings.join(' | ')}`);
    }

    // La respuesta debe describir exactamente lo que pedimos; si no, nadie va a pagar algo distinto
    const consistent =
      (providerPayment.external_reference ?? '') === order.folio &&
      String(providerPayment.currency ?? this.config.currencyCode) === this.config.currencyCode &&
      amountsMatch(providerPayment.amount, amount) &&
      amountsMatch(providerPayment.total ?? providerPayment.amount, amount) &&
      typeof providerPayment.checkout_url === 'string' &&
      providerPayment.checkout_url.length > 0;

    if (!consistent) {
      console.error(`❌ [ROKI] Respuesta inconsistente al crear pago para ${order.folio}:`, JSON.stringify(providerPayment).slice(0, 800));
      await this.prisma.payment.update({
        where: { id: row.id },
        data: {
          status: 'disabled',
          providerPaymentId: Number.isFinite(Number(providerPayment.id)) ? Number(providerPayment.id) : null,
          providerSnapshot: providerPayment as unknown as Prisma.InputJsonValue,
          reviewReason: 'amount_mismatch',
          reviewDetails: { stage: 'create', expected: amount, received: providerPayment } as unknown as Prisma.InputJsonValue,
          nextCheckAt: null,
        },
      }).catch(() => undefined);
      throw new HttpException({ code: 'provider_inconsistent', message: 'El proveedor devolvió un pago distinto al pedido. Paga por transferencia o inténtalo más tarde.' }, HttpStatus.BAD_GATEWAY);
    }

    try {
      row = await this.prisma.payment.update({
        where: { id: row.id },
        data: {
          providerPaymentId: Number(providerPayment.id),
          status: normalizeProviderStatus(providerPayment.status),
          checkoutUrl: providerPayment.checkout_url,
          transactionId: providerPayment.transaction_id ?? null,
          expiresAt: parseProviderDate(providerPayment.expires_at) ?? linkExpiresAt,
          providerSnapshot: providerPayment as unknown as Prisma.InputJsonValue,
          // lastCheckedAt queda vacío: crear el enlace no es verificar el pago (el primer regreso consulta siempre)
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        // ROKI devolvió un pago ya registrado (llave de idempotencia repetida): usamos la fila original
        const existing = await this.prisma.payment.findUnique({
          where: { provider_environment_providerPaymentId: { provider: PROVIDER, environment: this.config.environment, providerPaymentId: Number(providerPayment.id) } },
        });
        await this.prisma.payment.update({
          where: { id: row.id },
          data: { status: 'disabled', providerSnapshot: { duplicateOf: existing?.id ?? null } as Prisma.InputJsonValue, nextCheckAt: null },
        });
        if (existing?.checkoutUrl) return this.toCheckoutResponse(existing, true);
      }
      throw error;
    }

    // paymentMethod pasa a 'roki' solo al confirmar: abrir un enlace no cambia cómo se registró el apartado
    console.log(`💳 [ROKI] Pago ${row.providerPaymentId} creado para ${order.folio} (${this.config.environment}, ${this.config.currencyIso} ${amount.toFixed(2)})`);
    return this.toCheckoutResponse(row, false);
  }

  /** Estado del pago para la pantalla de resultado. Verifica con ROKI de forma acotada si sigue pendiente. */
  async getPublicStatus(orderId: string, folio: string, options: { minCheckIntervalMs?: number } = {}): Promise<PublicStatusResponse> {
    const minCheckInterval = options.minCheckIntervalMs ?? STATUS_POLL_MIN_INTERVAL_MS;
    let order = await this.loadOrderForCustomer(orderId, folio);
    let latest = this.pickRelevantPayment(order.payments);
    const now = new Date();

    const needsLiveCheck =
      latest &&
      this.config.enabled &&
      latest.environment === this.config.environment &&
      latest.providerPaymentId !== null &&
      ((latest.status === 'pending') || (latest.status === 'paid' && !latest.confirmedAt && !latest.reviewReason)) &&
      (!latest.lastCheckedAt || now.getTime() - latest.lastCheckedAt.getTime() >= minCheckInterval);

    if (needsLiveCheck && latest) {
      try {
        await this.syncPayment(latest.id, { source: 'status-poll' });
      } catch (error) {
        console.warn(`⚠️ [ROKI] Verificación en sondeo falló para pago ${latest.id}:`, error instanceof Error ? error.message : error);
      }
      order = await this.loadOrderForCustomer(orderId, folio);
      latest = this.pickRelevantPayment(order.payments);
    }

    const state = derivePublicState({
      orderStatus: order.status,
      payment: latest ? { status: latest.status as PaymentStatus, confirmedAt: latest.confirmedAt, reviewReason: latest.reviewReason, reviewResolvedAt: latest.reviewResolvedAt, expiresAt: latest.expiresAt } : null,
      now,
    });

    const minLead = this.config.minMinutesBeforeOrderExpiry * 60_000;
    const orderStillPayable = order.status === 'PENDING' && order.expiresAt.getTime() - now.getTime() >= minLead && this.config.enabled;
    const linkAlive = Boolean(latest && latest.status === 'pending' && latest.checkoutUrl && (!latest.expiresAt || latest.expiresAt.getTime() > now.getTime() + 60_000));
    const canContinue = orderStillPayable && linkAlive && state === 'pending';
    const canRetry = orderStillPayable && !linkAlive && (!latest || TERMINAL_UNPAID_STATUSES.includes(latest.status as PaymentStatus) || latest.status === 'pending');

    return {
      state,
      provider: PROVIDER,
      environment: this.config.environment,
      order: {
        id: order.id,
        folio: order.folio,
        status: order.status,
        total: order.total,
        tickets: order.tickets,
        expiresAt: order.expiresAt.toISOString(),
        raffle: { title: order.raffle?.title ?? '', slug: order.raffle?.slug ?? null },
      },
      payment: latest
        ? {
            id: latest.id,
            status: latest.status as PaymentStatus,
            providerPaymentId: latest.providerPaymentId,
            checkoutUrl: linkAlive ? latest.checkoutUrl : null,
            expiresAt: latest.expiresAt ? latest.expiresAt.toISOString() : null,
            paidAt: latest.paidAt ? latest.paidAt.toISOString() : null,
            confirmedAt: latest.confirmedAt ? latest.confirmedAt.toISOString() : null,
            amount: latest.amountExpected,
            currencyIso: latest.currencyIso,
            reviewPending: Boolean(latest.reviewReason && !latest.reviewResolvedAt),
          }
        : null,
      canContinue,
      canRetry,
    };
  }

  // ───────────────────────────────── Webhook ─────────────────────────────────

  /**
   * Verifica la firma sobre el cuerpo crudo y guarda el evento. Devuelve rápido;
   * el procesamiento ocurre después (processEvent) y es idempotente.
   */
  async receiveWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<{ accepted: true; duplicate: boolean; eventRowId: string | null }> {
    const secret = this.config.webhookSecret;
    if (!secret) {
      console.error('❌ [ROKI] Webhook recibido pero ROKI_WEBHOOK_SECRET no está configurado');
      throw new ServiceUnavailableException('Webhook no configurado');
    }

    const check = verifyRokiSignature({
      header: headers['roki-signature'],
      rawBody,
      secret,
      toleranceSeconds: this.config.webhookToleranceSeconds,
    });
    if (!check.valid) {
      console.warn(`🚫 [ROKI] Webhook rechazado: firma ${check.reason}`);
      throw new BadRequestException('Firma inválida');
    }

    let event: RokiWebhookEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Cuerpo inválido');
    }
    const eventId = typeof event?.id === 'string' && event.id ? event.id : (headers['roki-webhook-event-id'] as string | undefined);
    const eventType = typeof event?.type === 'string' && event.type ? event.type : (headers['roki-webhook-event-type'] as string | undefined) || 'unknown';
    if (!eventId) throw new BadRequestException('Evento sin id');

    const data = (event.data ?? null) as RokiPayment | null;
    const providerPaymentId = data && Number.isFinite(Number((data as RokiPayment).id)) ? Number((data as RokiPayment).id) : null;

    const linked = providerPaymentId !== null
      ? await this.prisma.payment.findUnique({
          where: { provider_environment_providerPaymentId: { provider: PROVIDER, environment: this.config.environment, providerPaymentId } },
          select: { id: true },
        })
      : null;

    const safeHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (key.startsWith('roki-') || key === 'user-agent' || key === 'content-type') safeHeaders[key] = Array.isArray(value) ? value.join(',') : String(value ?? '');
    }

    try {
      const row = await this.prisma.paymentEvent.create({
        data: {
          provider: PROVIDER,
          environment: this.config.environment,
          eventId,
          eventType,
          providerPaymentId,
          paymentId: linked?.id ?? null,
          rawBody: rawBody.toString('utf8'),
          headers: safeHeaders as Prisma.InputJsonValue,
          status: 'received',
        },
        select: { id: true },
      });
      return { accepted: true, duplicate: false, eventRowId: row.id };
    } catch (error) {
      if (isUniqueViolation(error)) {
        console.log(`↩️ [ROKI] Webhook duplicado ${eventType} ${eventId} (ya registrado)`);
        return { accepted: true, duplicate: true, eventRowId: null };
      }
      throw error;
    }
  }

  /** Procesa un evento guardado. Seguro de repetir: el estado final sale siempre de GET /payments/{id}. */
  async processEvent(eventRowId: string): Promise<void> {
    const event = await this.prisma.paymentEvent.findUnique({ where: { id: eventRowId } });
    if (!event || event.status === 'processed' || event.status === 'ignored') return;

    await this.prisma.paymentEvent.update({ where: { id: event.id }, data: { attempts: { increment: 1 } } });

    const finish = (status: 'processed' | 'ignored' | 'failed', error?: string) =>
      this.prisma.paymentEvent.update({ where: { id: event.id }, data: { status, error: error?.slice(0, 1000) ?? null, processedAt: new Date() } });

    if (!event.eventType.startsWith('payment.')) {
      await finish('ignored', event.eventType === 'webhook.test' ? 'Ping de prueba del proveedor' : `Tipo no gestionado: ${event.eventType}`);
      return;
    }

    if (event.providerPaymentId === null) {
      await finish('ignored', 'Evento sin data.id');
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { provider_environment_providerPaymentId: { provider: PROVIDER, environment: event.environment, providerPaymentId: event.providerPaymentId } },
    });
    if (!payment) {
      await finish('ignored', `Pago ${event.providerPaymentId} no pertenece a un pedido de este sistema (${event.environment})`);
      return;
    }
    if (!event.paymentId) {
      await this.prisma.paymentEvent.update({ where: { id: event.id }, data: { paymentId: payment.id } });
    }

    if (event.eventType === 'payment.failed') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { failureCount: { increment: 1 } } }).catch(() => undefined);
    }

    const result = await this.syncPayment(payment.id, { source: `webhook:${event.eventType}` });
    if (result.result === 'error') {
      // Reintentamos desde la conciliación (y ROKI también reintenta el webhook)
      await finish('failed', result.error);
      return;
    }
    await finish('processed');
  }

  // ───────────────────────── Confirmación compartida ─────────────────────────

  /** Consulta GET /payments/{id} (fuente de verdad) y aplica el resultado. */
  async syncPayment(paymentRowId: string, options: { source: string; allowReinstate?: boolean }): Promise<SyncResult> {
    const row = await this.prisma.payment.findUnique({ where: { id: paymentRowId } });
    if (!row) return { result: 'error', error: 'Pago no encontrado' };
    if (row.providerPaymentId === null) return { result: 'no_provider_id' };
    if (!this.config.secretKey) return { result: 'error', error: 'ROKI_SECRET_KEY no configurada' };
    if (row.environment !== this.config.environment) return { result: 'error', error: `El pago es de ${row.environment} y el servidor opera en ${this.config.environment}` };

    let providerPayment: RokiPayment;
    try {
      providerPayment = await this.client.getPayment(row.providerPaymentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.payment.update({
        where: { id: row.id },
        data: { lastCheckedAt: new Date(), checkCount: { increment: 1 }, nextCheckAt: new Date(Date.now() + nextCheckDelayMs(row.checkCount)) },
      }).catch(() => undefined);
      return { result: 'error', error: message };
    }

    return this.applyProviderPayment(row.id, providerPayment, options);
  }

  /**
   * Aplica el estado del proveedor con bloqueo de fila sobre el pago y el pedido.
   * Solo aquí se marca un pedido como PAID por tarjeta, y solo una vez.
   */
  async applyProviderPayment(paymentRowId: string, providerPayment: RokiPayment, options: { source: string; allowReinstate?: boolean }): Promise<SyncResult> {
    const now = new Date();
    let raffleToRecompute: string | null = null;

    const outcome = await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "payments" WHERE "id" = ${paymentRowId} FOR UPDATE`;
        const payment = await tx.payment.findUnique({ where: { id: paymentRowId } });
        if (!payment) return { result: 'error', error: 'Pago no encontrado' } as SyncResult;

        await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${payment.orderId} FOR UPDATE`;
        const order = await tx.order.findUnique({ where: { id: payment.orderId } });

        const conflictingOrders = order
          ? await tx.order.findMany({
              where: { raffleId: order.raffleId, id: { not: order.id }, status: { in: ['PENDING', 'PAID'] }, tickets: { hasSome: order.tickets } },
              select: { id: true, status: true, tickets: true },
            })
          : [];

        const decision = decideConfirmation({
          payment: {
            providerPaymentId: payment.providerPaymentId,
            externalReference: payment.externalReference,
            amountExpected: payment.amountExpected,
            currencyCode: payment.currencyCode,
            confirmedAt: payment.confirmedAt,
          },
          providerPayment,
          order: order ? { id: order.id, status: order.status, paymentMethod: order.paymentMethod, tickets: order.tickets, total: order.total } : null,
          conflictingOrders: conflictingOrders.map((o) => ({ id: o.id, status: o.status, tickets: o.tickets })),
          allowReinstate: options.allowReinstate === true,
        });

        const status = normalizeProviderStatus(providerPayment.status);
        const base: Prisma.PaymentUpdateInput = {
          status,
          providerSnapshot: providerPayment as unknown as Prisma.InputJsonValue,
          transactionId: providerPayment.transaction_id ?? payment.transactionId,
          paidAt: parseProviderDate(providerPayment.paid_at) ?? payment.paidAt,
          expiresAt: parseProviderDate(providerPayment.expires_at) ?? payment.expiresAt,
          checkoutUrl: providerPayment.checkout_url ?? payment.checkoutUrl,
          amountConfirmed: status === 'paid' || status === 'refunded' || status === 'partially_refunded' ? toNumber(providerPayment.total ?? providerPayment.amount) : payment.amountConfirmed,
          lastCheckedAt: now,
          checkCount: { increment: 1 },
          nextCheckAt: status === 'pending' ? new Date(now.getTime() + nextCheckDelayMs(payment.checkCount + 1)) : null,
        };

        switch (decision.action) {
          case 'already_confirmed': {
            const data: Prisma.PaymentUpdateInput = { ...base, status: payment.status === 'paid' && status === 'pending' ? 'paid' : status };
            // Un reembolso sobre un pedido ya confirmado requiere revisión humana (los boletos siguen asignados)
            if ((status === 'refunded' || status === 'partially_refunded') && !payment.reviewReason) {
              data.reviewReason = 'refunded_after_confirmation';
              data.reviewDetails = { refundStatus: providerPayment.refund_status ?? null, refundedAmount: toNumber(providerPayment.refunded_amount) } as Prisma.InputJsonValue;
              data.reviewResolvedAt = null;
            }
            await tx.payment.update({ where: { id: payment.id }, data });
            return { result: 'already_confirmed' } as SyncResult;
          }
          case 'not_paid': {
            await tx.payment.update({ where: { id: payment.id }, data: base });
            return { result: 'not_paid', status: decision.status } as SyncResult;
          }
          case 'confirm': {
            const stamp = `[ROKI ${payment.environment}] Pago #${providerPayment.id} confirmado ${now.toISOString()} · ${payment.currencyIso} ${round2(toNumber(providerPayment.total ?? providerPayment.amount) ?? payment.amountExpected).toFixed(2)}${providerPayment.transaction_id ? ` · tx ${providerPayment.transaction_id}` : ''}${decision.reinstated ? ' · pago tardío reactivado por admin' : ''} · vía ${options.source}`;
            await tx.order.update({
              where: { id: order!.id },
              data: {
                status: 'PAID',
                paymentMethod: PROVIDER,
                notes: appendNote(order!.notes, stamp),
                updatedAt: now,
              },
            });
            await tx.payment.update({
              where: { id: payment.id },
              data: { ...base, status: 'paid', confirmedAt: now, nextCheckAt: null, reviewResolvedAt: payment.reviewReason ? now : payment.reviewResolvedAt, reviewResolution: payment.reviewReason ? `confirmado (${options.source})` : payment.reviewResolution },
            });
            raffleToRecompute = order!.raffleId;
            return { result: 'confirmed', reinstated: decision.reinstated } as SyncResult;
          }
          case 'review': {
            const sameOpenIncident = payment.reviewReason === decision.reason && !payment.reviewResolvedAt;
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                ...base,
                nextCheckAt: null,
                reviewReason: decision.reason,
                reviewDetails: { ...decision.details, source: options.source, detectedAt: now.toISOString() } as Prisma.InputJsonValue,
                reviewResolvedAt: sameOpenIncident ? payment.reviewResolvedAt : null,
              },
            });
            if (!sameOpenIncident) console.warn(`🧐 [ROKI] Incidencia ${decision.reason} en pago ${payment.providerPaymentId} (pedido ${payment.externalReference})`, JSON.stringify(decision.details));
            return { result: 'review', reason: decision.reason } as SyncResult;
          }
        }
      },
      { timeout: 20_000, maxWait: 10_000 },
    );

    if (raffleToRecompute) {
      await this.adminService.recomputeAndPersistSold(raffleToRecompute).catch((error) => console.error('⚠️ [ROKI] No se pudo recalcular vendidos:', error));
      console.log(`✅ [ROKI] Pedido confirmado por pago ${providerPayment.id} (${options.source})`);
    }
    return outcome;
  }

  // ───────────────────────────────── Conciliación ─────────────────────────────

  /** Sondea los pagos pendientes con espera exponencial, adopta huérfanos y reprocesa eventos atascados. */
  async reconcile(limit = 25): Promise<ReconcileSummary> {
    const startedAt = new Date();
    const summary: ReconcileSummary = {
      startedAt: startedAt.toISOString(),
      finishedAt: startedAt.toISOString(),
      checked: 0,
      confirmed: 0,
      review: 0,
      terminal: 0,
      stillPending: 0,
      errors: 0,
      adopted: 0,
      eventsReprocessed: 0,
    };
    if (this.reconciling) {
      summary.skipped = 'Ya hay una conciliación en curso';
      return summary;
    }
    if (!this.config.enabled) {
      summary.skipped = 'ROKI inactivo';
      return summary;
    }
    this.reconciling = true;
    try {
      const now = new Date();
      const candidates = await this.prisma.payment.findMany({
        where: {
          provider: PROVIDER,
          environment: this.config.environment,
          providerPaymentId: { not: null },
          createdAt: { gt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) },
          OR: [
            { status: 'pending', OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: now } }] },
            { status: 'paid', confirmedAt: null, reviewReason: null },
          ],
        },
        orderBy: [{ nextCheckAt: 'asc' }],
        take: limit,
      });

      for (const candidate of candidates) {
        // Reclamar la fila: si otra instancia la tomó, nextCheckAt ya cambió
        const claimed = await this.prisma.payment.updateMany({
          where: { id: candidate.id, nextCheckAt: candidate.nextCheckAt },
          data: { nextCheckAt: new Date(Date.now() + 60_000) },
        });
        if (claimed.count === 0) continue;

        summary.checked++;
        const result = await this.syncPayment(candidate.id, { source: 'reconcile' });
        if (result.result === 'confirmed') summary.confirmed++;
        else if (result.result === 'review') summary.review++;
        else if (result.result === 'not_paid') {
          if (result.status === 'pending') summary.stillPending++;
          else summary.terminal++;
        } else if (result.result === 'error') summary.errors++;
      }

      summary.adopted = await this.adoptOrphans();
      summary.eventsReprocessed = await this.reprocessStuckEvents();
    } catch (error) {
      summary.errors++;
      console.error('❌ [ROKI] Error en conciliación:', error);
    } finally {
      this.reconciling = false;
      summary.finishedAt = new Date().toISOString();
    }
    return summary;
  }

  /** Filas sin providerPaymentId (la respuesta de creación no llegó a guardarse): se buscan por external_reference. */
  private async adoptOrphans(): Promise<number> {
    const cutoff = new Date(Date.now() - 2 * 60_000);
    const orphans = await this.prisma.payment.findMany({
      where: { provider: PROVIDER, environment: this.config.environment, providerPaymentId: null, status: 'pending', createdAt: { lt: cutoff } },
      take: 10,
    });
    let adopted = 0;
    for (const orphan of orphans) {
      try {
        const list = await this.client.listPayments({ external_reference: orphan.externalReference, per_page: 20 });
        const candidates = (list?.data ?? []).filter((p) => {
          const createdAt = parseProviderDate(p.created_at);
          const meta = (p.metadata && typeof p.metadata === 'object' && !Array.isArray(p.metadata) ? p.metadata : {}) as Record<string, unknown>;
          return amountsMatch(p.amount, orphan.amountExpected) && String(p.currency) === orphan.currencyCode && (meta.order_id === orphan.orderId || !createdAt || Math.abs(createdAt.getTime() - orphan.createdAt.getTime()) < 10 * 60_000);
        });
        if (candidates.length === 0) {
          await this.prisma.payment.update({ where: { id: orphan.id }, data: { status: 'failed', nextCheckAt: null, providerSnapshot: { error: 'No existe en el proveedor' } as Prisma.InputJsonValue } });
          continue;
        }
        const match = candidates[0];
        try {
          await this.prisma.payment.update({
            where: { id: orphan.id },
            data: { providerPaymentId: Number(match.id), checkoutUrl: match.checkout_url ?? null, providerSnapshot: match as unknown as Prisma.InputJsonValue, nextCheckAt: new Date() },
          });
          adopted++;
          await this.applyProviderPayment(orphan.id, match, { source: 'reconcile:adopt' });
        } catch (error) {
          if (isUniqueViolation(error)) {
            await this.prisma.payment.update({ where: { id: orphan.id }, data: { status: 'disabled', nextCheckAt: null, providerSnapshot: { duplicateOfProviderPayment: match.id } as Prisma.InputJsonValue } });
          } else throw error;
        }
      } catch (error) {
        console.warn(`⚠️ [ROKI] No se pudo adoptar pago huérfano ${orphan.id}:`, error instanceof Error ? error.message : error);
      }
    }
    return adopted;
  }

  private async reprocessStuckEvents(): Promise<number> {
    const cutoff = new Date(Date.now() - 60_000);
    const events = await this.prisma.paymentEvent.findMany({
      where: { provider: PROVIDER, environment: this.config.environment, receivedAt: { lt: cutoff }, OR: [{ status: 'received' }, { status: 'failed', attempts: { lt: 6 } }] },
      orderBy: { receivedAt: 'asc' },
      take: 25,
      select: { id: true },
    });
    for (const event of events) {
      await this.processEvent(event.id).catch((error) => console.warn(`⚠️ [ROKI] Reproceso de evento ${event.id} falló:`, error instanceof Error ? error.message : error));
    }
    return events.length;
  }

  // ───────────────────────────────── Admin ───────────────────────────────────

  async listPayments(filters: { status?: string; environment?: string; limit?: number; folio?: string }) {
    const take = Math.min(Math.max(filters.limit ?? 100, 1), 500);
    const rows = await this.prisma.payment.findMany({
      where: {
        provider: PROVIDER,
        ...(filters.environment ? { environment: filters.environment } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.folio ? { externalReference: { contains: filters.folio.trim().toUpperCase() } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: { order: { select: { id: true, folio: true, status: true, total: true, tickets: true, paymentMethod: true, raffle: { select: { title: true } }, user: { select: { name: true, phone: true } } } } },
    });
    return rows.map((row) => this.toAdminPayment(row));
  }

  async listIncidents() {
    const rows = await this.prisma.payment.findMany({
      where: { provider: PROVIDER, reviewReason: { not: null }, reviewResolvedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { order: { select: { id: true, folio: true, status: true, total: true, tickets: true, paymentMethod: true, raffle: { select: { title: true } }, user: { select: { name: true, phone: true } } } } },
    });
    return rows.map((row) => this.toAdminPayment(row));
  }

  async getPaymentForAdmin(paymentId: string) {
    const row = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { select: { id: true, folio: true, status: true, total: true, tickets: true, paymentMethod: true, raffle: { select: { title: true } }, user: { select: { name: true, phone: true } } } },
        events: { orderBy: { receivedAt: 'desc' }, take: 20, select: { id: true, eventId: true, eventType: true, status: true, error: true, attempts: true, receivedAt: true, processedAt: true } },
      },
    });
    if (!row) throw new NotFoundException('Pago no encontrado');
    return { ...this.toAdminPayment(row), events: row.events };
  }

  /** Acción manual sobre una incidencia. `confirm` vuelve a verificar con ROKI y permite reactivar un pedido vencido. */
  async resolveIncident(paymentId: string, action: 'confirm' | 'dismiss', note?: string) {
    const row = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!row) throw new NotFoundException('Pago no encontrado');

    if (action === 'dismiss') {
      await this.prisma.payment.update({
        where: { id: row.id },
        data: { reviewResolvedAt: new Date(), reviewResolution: (note?.trim() || 'descartada por administración').slice(0, 500) },
      });
      return { ok: true, result: 'dismissed' as const };
    }

    const result = await this.syncPayment(row.id, { source: 'admin:confirm', allowReinstate: true });
    if (result.result === 'confirmed' || result.result === 'already_confirmed') {
      if (note?.trim()) await this.prisma.payment.update({ where: { id: row.id }, data: { reviewResolution: note.trim().slice(0, 500) } }).catch(() => undefined);
    }
    return { ok: result.result === 'confirmed' || result.result === 'already_confirmed', result };
  }

  async diagnostics() {
    const described = describeRokiConfig(this.config);
    let me: { id: string; business_name: string | null; environment: string | null } | null = null;
    let meError: string | null = null;
    if (this.config.secretKey) {
      try {
        const res = await this.client.getMe();
        me = { id: String(res.id), business_name: res.business_name ?? null, environment: (res.environment as string) ?? null };
      } catch (error) {
        meError = error instanceof RokiApiError ? `${error.status || 'red'}: ${error.message}` : String(error);
      }
    }
    const environmentMatches = me?.environment ? me.environment === this.config.environment : null;

    const [pending, paidUnconfirmed, incidents, eventsReceived, eventsFailed, eventsProcessed, lastEvent] = await Promise.all([
      this.prisma.payment.count({ where: { provider: PROVIDER, environment: this.config.environment, status: 'pending' } }),
      this.prisma.payment.count({ where: { provider: PROVIDER, environment: this.config.environment, status: 'paid', confirmedAt: null } }),
      this.prisma.payment.count({ where: { provider: PROVIDER, reviewReason: { not: null }, reviewResolvedAt: null } }),
      this.prisma.paymentEvent.count({ where: { provider: PROVIDER, environment: this.config.environment, status: 'received' } }),
      this.prisma.paymentEvent.count({ where: { provider: PROVIDER, environment: this.config.environment, status: 'failed' } }),
      this.prisma.paymentEvent.count({ where: { provider: PROVIDER, environment: this.config.environment, status: 'processed' } }),
      this.prisma.paymentEvent.findFirst({ where: { provider: PROVIDER, environment: this.config.environment }, orderBy: { receivedAt: 'desc' }, select: { eventType: true, receivedAt: true, status: true } }),
    ]);

    return {
      ...described,
      merchant: me,
      merchantError: meError,
      environmentMatches,
      counters: { pending, paidUnconfirmed, incidents, eventsReceived, eventsFailed, eventsProcessed },
      lastWebhook: lastEvent,
      reconcileIntervalSeconds: this.config.reconcileIntervalSeconds,
    };
  }

  async sendWebhookTest() {
    return this.client.testWebhook();
  }

  // ───────────────────── Enlace por folio y regreso desde ROKI ─────────────────────

  /** Enlace de pago compartible: /api/public/payments/roki/pay/:folio (el folio es la autorización). */
  async startCheckoutByFolio(folio: string): Promise<CheckoutResponse & { orderId: string }> {
    const clean = (folio ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,40}$/.test(clean)) throw new NotFoundException('Pedido no encontrado');
    const order = await this.prisma.order.findUnique({ where: { folio: clean }, select: { id: true } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const checkout = await this.startCheckout(order.id, clean);
    return { ...checkout, orderId: order.id };
  }

  /** URL a la que ROKI devuelve al comprador. */
  returnUrl(orderId: string, folio: string, result: 'success' | 'cancel'): string {
    const query = `folio=${encodeURIComponent(folio)}&result=${result}`;
    const origin = apiOrigin(this.config);
    if (origin) return `${origin}${ROKI_RETURN_PATH}/${encodeURIComponent(orderId)}?${query}`;
    return this.frontendReturnUrl(orderId, folio, result);
  }

  frontendReturnUrl(orderId: string, folio: string, result: string): string {
    const app = this.config.publicAppUrl;
    if (this.config.returnPage === 'receipt') return `${app}/#/comprobante/${encodeURIComponent(folio)}`;
    return `${app}/#/pago/${encodeURIComponent(orderId)}?folio=${encodeURIComponent(folio)}&result=${encodeURIComponent(result)}`;
  }

  payLinkUrl(folio: string): string | null {
    const origin = apiOrigin(this.config);
    return origin ? `${origin}${ROKI_PAY_LINK_PATH}/${encodeURIComponent(folio)}` : null;
  }

  /**
   * Regreso desde ROKI: verifica el cobro (GET /payments/{id}) y decide a dónde ir.
   * - returnPage=result → siempre a /#/pago (el frontend nuevo muestra el estado).
   * - returnPage=receipt → al comprobante si quedó pagado; si no, página propia del backend.
   */
  async resolveReturn(orderId: string, folio: string, result: string, refreshCount: number): Promise<{ redirect: string } | { page: HtmlPageInput }> {
    // El regreso es un evento puntual: se verifica con ROKI aunque la última consulta sea reciente (mínimo 2 s)
    const status = await this.getPublicStatus(orderId, folio, { minCheckIntervalMs: RETURN_MIN_CHECK_INTERVAL_MS });
    const cleanFolio = status.order.folio;

    if (this.config.returnPage === 'result') return { redirect: this.frontendReturnUrl(orderId, cleanFolio, result) };
    if (status.state === 'confirmed') return { redirect: `${this.config.publicAppUrl}/#/comprobante/${encodeURIComponent(cleanFolio)}` };

    const store = `${this.config.publicAppUrl}/`;
    const raffleUrl = status.order.raffle.slug ? `${this.config.publicAppUrl}/#/sorteo/${status.order.raffle.slug}` : store;
    const payLink = this.payLinkUrl(cleanFolio);
    const details: Array<[string, string]> = [
      ['Folio', cleanFolio],
      ['Sorteo', status.order.raffle.title],
      ['Boletos', String(status.order.tickets.length)],
      ['Total', `${status.payment?.currencyIso ?? this.config.currencyIso} ${round2(status.order.total).toFixed(2)}`],
    ];
    if (status.payment?.providerPaymentId) details.push(['Referencia del pago', `#${status.payment.providerPaymentId}`]);
    const sandboxNote = this.config.environment === 'sandbox' ? 'Modo pruebas: no se realizó ningún cobro real.' : undefined;
    const selfUrl = `${apiOrigin(this.config) ?? ''}${ROKI_RETURN_PATH}/${encodeURIComponent(orderId)}?folio=${encodeURIComponent(cleanFolio)}&result=${encodeURIComponent(result)}`;
    const retryActions = (): HtmlAction[] => [
      ...((status.canContinue || status.canRetry) && payLink ? [{ label: status.canContinue ? 'Continuar el pago con tarjeta' : 'Reintentar con tarjeta', href: payLink, primary: true }] : []),
      { label: 'Volver a la tienda', href: store },
    ];

    switch (status.state) {
      case 'verifying':
        return {
          page: {
            tone: 'info',
            title: 'Estamos confirmando tu pago…',
            message: 'Suele tardar unos segundos. Esta página se actualiza sola.',
            details,
            refreshSeconds: refreshCount < 12 ? 5 : undefined,
            refreshUrl: `${selfUrl}&n=${refreshCount + 1}`,
            actions: refreshCount < 12 ? [] : [{ label: 'Actualizar', href: `${selfUrl}&n=0`, primary: true }, { label: 'Volver a la tienda', href: store }],
            footnote: sandboxNote,
          },
        };
      case 'review':
        return { page: { tone: 'warning', title: 'Recibimos tu pago y lo estamos validando', message: 'Un miembro del equipo revisará el cobro y te confirmará por WhatsApp. Guarda tu folio.', details, actions: [{ label: 'Volver a la tienda', href: store }], footnote: sandboxNote } };
      case 'released':
        return { page: { tone: 'danger', title: 'Este apartado ya no está vigente', message: 'El tiempo para pagar terminó y los boletos se liberaron. Puedes elegirlos de nuevo.', details, actions: [{ label: 'Elegir boletos de nuevo', href: raffleUrl, primary: true }], footnote: sandboxNote } };
      case 'expired':
        return { page: { tone: 'danger', title: 'El enlace de pago venció', message: status.canRetry ? 'Tu apartado sigue vigente: genera un nuevo enlace para pagar con tarjeta.' : 'Elige tus boletos de nuevo para seguir participando.', details, actions: status.canRetry ? retryActions() : [{ label: 'Elegir boletos de nuevo', href: raffleUrl, primary: true }], footnote: sandboxNote } };
      case 'failed':
        return { page: { tone: 'danger', title: 'El pago no se pudo procesar', message: 'Tu banco no autorizó el cobro o la operación se canceló. No se te cobró nada.', details, actions: retryActions(), footnote: sandboxNote } };
      default: {
        // pending / none: volvió sin pagar (o el banco aún no responde si result=success)
        if (result === 'success' && refreshCount < 6) {
          return { page: { tone: 'info', title: 'Estamos confirmando tu pago…', message: 'Aún no recibimos la respuesta del banco. Esta página se actualiza sola.', details, refreshSeconds: 5, refreshUrl: `${selfUrl}&n=${refreshCount + 1}`, footnote: sandboxNote } };
        }
        const expires = status.order.expiresAt ? formatHondurasDateTime(new Date(status.order.expiresAt)).slice(0, 16) : '';
        return {
          page: {
            tone: 'warning',
            title: 'No se completó el pago',
            message: expires ? `Tus boletos siguen apartados hasta el ${expires} (hora de Honduras). Puedes intentar de nuevo o pagar por transferencia.` : 'Tus boletos siguen apartados. Puedes intentar de nuevo o pagar por transferencia.',
            details,
            actions: retryActions(),
            footnote: sandboxNote,
          },
        };
      }
    }
  }

  // ───────────────────────────────── Helpers ─────────────────────────────────

  private async loadOrderForCustomer(orderId: string, folio: string) {
    if (!orderId || !folio) throw new NotFoundException('Pedido no encontrado');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        raffle: { select: { id: true, title: true, slug: true, price: true, tickets: true, packs: true, status: true, drawDate: true } },
        user: { select: { name: true, phone: true, email: true } },
        payments: { where: { provider: PROVIDER }, orderBy: { createdAt: 'desc' } },
      },
    });
    // Comparación en tiempo constante para no filtrar folios por cronometraje
    if (!order || !safeEqual(order.folio, folio.trim().toUpperCase())) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  private pickRelevantPayment(payments: Payment[]): Payment | null {
    if (payments.length === 0) return null;
    return (
      payments.find((p) => p.confirmedAt) ||
      payments.find((p) => p.status === 'paid') ||
      payments.find((p) => p.reviewReason && !p.reviewResolvedAt) ||
      payments.find((p) => p.status === 'pending') ||
      payments[0]
    );
  }

  private toCheckoutResponse(row: Payment, reused: boolean): CheckoutResponse {
    return {
      paymentId: row.id,
      providerPaymentId: row.providerPaymentId,
      checkoutUrl: row.checkoutUrl!,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      status: row.status as PaymentStatus,
      reused,
    };
  }

  private toAdminPayment(row: Payment & { order: { id: string; folio: string; status: string; total: number; tickets: number[]; paymentMethod: string | null; raffle: { title: string } | null; user: { name: string | null; phone: string | null } | null } }) {
    return {
      id: row.id,
      provider: row.provider,
      environment: row.environment,
      status: row.status,
      providerPaymentId: row.providerPaymentId,
      transactionId: row.transactionId,
      externalReference: row.externalReference,
      amountExpected: row.amountExpected,
      amountConfirmed: row.amountConfirmed,
      currencyIso: row.currencyIso,
      checkoutUrl: row.checkoutUrl,
      expiresAt: row.expiresAt,
      paidAt: row.paidAt,
      confirmedAt: row.confirmedAt,
      lastCheckedAt: row.lastCheckedAt,
      nextCheckAt: row.nextCheckAt,
      checkCount: row.checkCount,
      failureCount: row.failureCount,
      reviewReason: row.reviewReason,
      reviewDetails: row.reviewDetails,
      reviewResolvedAt: row.reviewResolvedAt,
      reviewResolution: row.reviewResolution,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      order: {
        id: row.order.id,
        folio: row.order.folio,
        status: row.order.status,
        total: row.order.total,
        ticketsCount: row.order.tickets.length,
        paymentMethod: row.order.paymentMethod,
        raffleTitle: row.order.raffle?.title ?? '',
        customerName: row.order.user?.name ?? '',
        customerPhone: row.order.user?.phone ?? '',
      },
    };
  }

  private buildCustomer(user: { name: string | null; phone: string | null; email: string | null } | null) {
    if (!user) return undefined;
    const customer: NonNullable<RokiCreatePaymentBody['customer']> = {};
    if (user.name?.trim()) customer.name = user.name.trim().slice(0, 191);
    if (user.phone?.trim()) customer.phone = user.phone.replace(/[^\d+]/g, '').slice(0, 32);
    if (user.email && /@/.test(user.email) && !/@temp\.com$/i.test(user.email)) customer.email = user.email.trim().slice(0, 191);
    return Object.keys(customer).length > 0 ? customer : undefined;
  }

  private async getMerchantId(): Promise<string | null> {
    if (this.merchantIdCache) return this.merchantIdCache;
    try {
      const me = await this.client.getMe();
      if (me?.environment && me.environment !== this.config.environment) {
        console.error(`❌ [ROKI] La llave pertenece al entorno ${me.environment} pero ROKI_ENVIRONMENT=${this.config.environment}`);
        throw new ServiceUnavailableException('Configuración de ROKI inconsistente (entorno de la llave).');
      }
      this.merchantIdCache = me?.id !== undefined ? String(me.id) : null;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      console.warn('⚠️ [ROKI] No se pudo consultar /me:', error instanceof Error ? error.message : error);
    }
    return this.merchantIdCache;
  }
}

function appendNote(existing: string | null, line: string): string {
  const base = (existing ?? '').trimEnd();
  return base ? `${base}\n${line}` : line;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
