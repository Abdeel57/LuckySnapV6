import { createHash } from 'crypto';
import type { RokiPayment } from './roki.types';

/**
 * Reglas puras (sin base de datos ni red) de la integración ROKI:
 * llave de idempotencia, formato de fechas, comparación de importes y la
 * decisión de confirmación. Se prueban de forma aislada en test/roki.
 */

export const HONDURAS_TIME_ZONE = 'America/Tegucigalpa';

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export function amountsMatch(a: number | string | null | undefined, b: number | string | null | undefined): boolean {
  const x = toNumber(a);
  const y = toNumber(b);
  if (x === null || y === null) return false;
  return Math.abs(round2(x) - round2(y)) < 0.005;
}

/**
 * Llave de idempotencia derivada del contenido del pedido. ROKI devuelve el pago
 * original si repite la llave aunque cambie el cuerpo, así que la llave debe
 * cambiar cuando cambie algo relevante (importe, moneda, boletos, intento).
 */
export function buildIdempotencyKey(input: {
  environment: string;
  orderId: string;
  amount: number;
  currencyCode: string;
  tickets: number[];
  attempt: number;
}): string {
  const tickets = [...input.tickets].sort((a, b) => a - b).join(',');
  const digest = createHash('sha256').update(`${round2(input.amount).toFixed(2)}|${input.currencyCode}|${tickets}`).digest('hex').slice(0, 24);
  return `roki:${input.environment}:${input.orderId}:${digest}:${input.attempt}`.slice(0, 191);
}

/** "YYYY-MM-DD HH:mm:ss" en hora de Honduras (UTC-6, sin horario de verano). */
export function formatHondurasDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HONDURAS_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/** Interpreta la fecha que devuelve ROKI (ISO con zona, o local de Honduras sin zona). */
export function parseProviderDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // Sin zona: es hora de Honduras (UTC-6)
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) + 6, Number(mi), Number(s ?? '0')));
}

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired', 'voided', 'refunded', 'partially_refunded', 'disabled'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Normaliza el estado del proveedor al conjunto que persistimos. */
export function normalizeProviderStatus(status: string | undefined | null): PaymentStatus {
  const s = (status ?? '').toLowerCase();
  if ((PAYMENT_STATUSES as readonly string[]).includes(s)) return s as PaymentStatus;
  if (s === 'approved' || s === 'completed' || s === 'succeeded') return 'paid';
  if (s === 'cancelled' || s === 'canceled') return 'voided';
  return 'pending';
}

/** Estados en los que el enlace ya no puede cobrar: permite crear un intento nuevo. */
export const TERMINAL_UNPAID_STATUSES: readonly PaymentStatus[] = ['expired', 'voided', 'disabled', 'failed'];

// ───────────────────────── Precio legítimo del pedido ─────────────────────────
// El total del pedido lo envía el navegador al crearlo. Antes de cobrar con
// tarjeta (confirmación automática) se recalcula con las mismas reglas que usa
// la página de compra: precio unitario, o precio de paquete × cantidad.

export interface RafflePricing {
  price: number | null | undefined;
  tickets: number; // boletos del rango base 1..tickets (los de regalo van por encima)
  packs: unknown; // JSON de Prisma: [{ name?, tickets?, q?, price }] o string JSON
}

export interface PackPrice {
  tickets: number;
  price: number;
}

export function parsePacks(packs: unknown): PackPrice[] {
  let list: unknown = packs;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => {
      const pack = (p ?? {}) as Record<string, unknown>;
      const tickets = Number(pack.tickets ?? pack.q ?? 1) || 1;
      const price = toNumber(pack.price as number | string | null | undefined);
      return price !== null && price > 0 && tickets > 0 ? { tickets: Math.floor(tickets), price } : null;
    })
    .filter((p): p is PackPrice => p !== null);
}

/** Boletos comprados = los del rango base; los de regalo (oportunidades) quedan fuera y no se cobran. */
export function countPurchasedTickets(tickets: number[], raffleTickets: number): number {
  return tickets.filter((t) => Number.isInteger(t) && t >= 1 && t <= raffleTickets).length;
}

/** Precio unitario igual que la página de compra: raffle.price, si no el paquete de 1 boleto, si no 50. */
export function unitPrice(raffle: RafflePricing, packs: PackPrice[] = parsePacks(raffle.packs)): number {
  const price = toNumber(raffle.price);
  if (price && price > 0) return price;
  return packs.find((p) => p.tickets === 1)?.price ?? 50;
}

/** Totales válidos para N boletos comprados: N × unitario, un paquete de N, o paquete × cantidad. */
export function allowedTotals(raffle: RafflePricing, purchasedCount: number): number[] {
  if (purchasedCount <= 0) return [];
  const packs = parsePacks(raffle.packs);
  const totals = new Set<number>([round2(purchasedCount * unitPrice(raffle, packs))]);
  for (const pack of packs) {
    if (purchasedCount % pack.tickets === 0) totals.add(round2((purchasedCount / pack.tickets) * pack.price));
  }
  return [...totals].sort((a, b) => a - b);
}

export function isLegitimateTotal(total: number, raffle: RafflePricing, tickets: number[]): { ok: boolean; purchased: number; allowed: number[] } {
  const purchased = countPurchasedTickets(tickets, raffle.tickets);
  const allowed = allowedTotals(raffle, purchased);
  return { ok: allowed.some((value) => amountsMatch(value, total)), purchased, allowed };
}

export type ReviewReason =
  | 'order_changed'
  | 'payment_id_mismatch'
  | 'reference_mismatch'
  | 'currency_mismatch'
  | 'amount_mismatch'
  | 'order_missing'
  | 'order_paid_other_method'
  | 'ticket_conflict'
  | 'late_payment'
  | 'order_status_unknown';

export interface ConfirmationInput {
  payment: {
    providerPaymentId: number | null;
    externalReference: string;
    amountExpected: number;
    currencyCode: string;
    confirmedAt: Date | null;
  };
  providerPayment: RokiPayment;
  order: { id: string; status: string; paymentMethod: string | null; tickets: number[]; total?: number } | null;
  /** Otros pedidos (PENDING/PAID) que hoy retienen alguno de los boletos de este pedido. */
  conflictingOrders: Array<{ id: string; status: string; tickets: number[] }>;
  /** Solo un administrador puede reactivar un pedido vencido con un pago tardío. */
  allowReinstate?: boolean;
}

export type ConfirmationDecision =
  | { action: 'already_confirmed' }
  | { action: 'not_paid'; status: PaymentStatus }
  | { action: 'confirm'; reinstated: boolean }
  | { action: 'review'; reason: ReviewReason; details: Record<string, unknown> };

const RELEASED_STATUSES = ['CANCELLED', 'EXPIRED', 'RELEASED'];

export function decideConfirmation(input: ConfirmationInput): ConfirmationDecision {
  const { payment, providerPayment, order, conflictingOrders } = input;

  if (payment.confirmedAt) return { action: 'already_confirmed' };

  const status = normalizeProviderStatus(providerPayment.status);
  if (status !== 'paid') return { action: 'not_paid', status };

  // Identidad del cobro: debe ser exactamente el pago que creamos
  if (payment.providerPaymentId === null || Number(providerPayment.id) !== Number(payment.providerPaymentId)) {
    return { action: 'review', reason: 'payment_id_mismatch', details: { expected: payment.providerPaymentId, received: providerPayment.id } };
  }
  if ((providerPayment.external_reference ?? '') !== payment.externalReference) {
    return { action: 'review', reason: 'reference_mismatch', details: { expected: payment.externalReference, received: providerPayment.external_reference ?? null } };
  }
  if (String(providerPayment.currency ?? '') !== String(payment.currencyCode)) {
    return { action: 'review', reason: 'currency_mismatch', details: { expected: payment.currencyCode, received: providerPayment.currency ?? null } };
  }
  // Sin impuestos ni propinas ni comisiones, total == amount; exigimos ambos
  const total = providerPayment.total ?? providerPayment.amount;
  if (!amountsMatch(providerPayment.amount, payment.amountExpected) || !amountsMatch(total, payment.amountExpected)) {
    return {
      action: 'review',
      reason: 'amount_mismatch',
      details: { expected: round2(payment.amountExpected), amount: toNumber(providerPayment.amount), total: toNumber(total) },
    };
  }

  if (!order) return { action: 'review', reason: 'order_missing', details: {} };

  // Si el pedido cambió de importe después de crear el enlace (edición manual), el cobro ya no lo cubre
  if (order.total !== undefined && !amountsMatch(order.total, payment.amountExpected)) {
    return { action: 'review', reason: 'order_changed', details: { orderTotal: round2(order.total), paymentAmount: round2(payment.amountExpected) } };
  }

  const others = conflictingOrders.filter((o) => o.id !== order.id);
  const conflictDetails = others.map((o) => ({ id: o.id, status: o.status, tickets: o.tickets.filter((t) => order.tickets.includes(t)) }));

  if (order.status === 'PAID') {
    // Ya estaba pagado por otra vía (transferencia marcada a mano u otro intento): posible doble cobro
    return { action: 'review', reason: 'order_paid_other_method', details: { paymentMethod: order.paymentMethod } };
  }

  if (order.status === 'PENDING') {
    if (others.length > 0) return { action: 'review', reason: 'ticket_conflict', details: { conflicts: conflictDetails } };
    return { action: 'confirm', reinstated: false };
  }

  if (RELEASED_STATUSES.includes(order.status)) {
    if (others.length > 0) {
      return { action: 'review', reason: 'late_payment', details: { orderStatus: order.status, ticketsAvailable: false, conflicts: conflictDetails } };
    }
    if (input.allowReinstate) return { action: 'confirm', reinstated: true };
    return { action: 'review', reason: 'late_payment', details: { orderStatus: order.status, ticketsAvailable: true } };
  }

  return { action: 'review', reason: 'order_status_unknown', details: { orderStatus: order.status } };
}

/** Espera exponencial para la conciliación por sondeo: 1, 2, 4, 8 … minutos, tope 30. */
export function nextCheckDelayMs(checkCount: number): number {
  const minutes = Math.min(30, Math.pow(2, Math.max(0, checkCount)));
  return minutes * 60_000;
}

/** Texto público del estado de un pago para la pantalla de resultado. */
export type PublicPaymentState = 'confirmed' | 'verifying' | 'pending' | 'failed' | 'expired' | 'review' | 'released' | 'none';

export function derivePublicState(input: {
  orderStatus: string;
  payment: { status: PaymentStatus; confirmedAt: Date | null; reviewReason: string | null; reviewResolvedAt: Date | null; expiresAt: Date | null } | null;
  now?: Date;
}): PublicPaymentState {
  const now = input.now ?? new Date();
  const { orderStatus, payment } = input;
  if (orderStatus === 'PAID') return 'confirmed';
  if (payment && payment.reviewReason && !payment.reviewResolvedAt) return 'review';
  if (!payment) return RELEASED_STATUSES.includes(orderStatus) ? 'released' : 'none';
  if (payment.status === 'paid') return payment.confirmedAt ? 'confirmed' : 'verifying';
  if (RELEASED_STATUSES.includes(orderStatus)) return 'released';
  if (payment.status === 'pending') {
    if (payment.expiresAt && payment.expiresAt.getTime() <= now.getTime()) return 'expired';
    return 'pending';
  }
  if (payment.status === 'expired') return 'expired';
  return 'failed';
}
