import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  amountsMatch,
  buildIdempotencyKey,
  decideConfirmation,
  derivePublicState,
  formatHondurasDateTime,
  nextCheckDelayMs,
  normalizeProviderStatus,
  parseProviderDate,
  type ConfirmationInput,
} from '../../src/roki/roki.decision';
import type { RokiPayment } from '../../src/roki/roki.types';

const paidPayment = (overrides: Partial<RokiPayment> = {}): RokiPayment => ({
  id: 501,
  status: 'paid',
  amount: 150,
  total: 150,
  currency: '340',
  currency_iso: 'HNL',
  external_reference: 'LKSNP-ABC12',
  transaction_id: '3f6c9d1e-0f0a-4a2b-9c4d-1234567890ab',
  checkout_url: 'https://pay.roki.systems/abcdefghijkl',
  paid_at: '2026-10-30T15:04:05Z',
  ...overrides,
});

const base = (overrides: Partial<ConfirmationInput> = {}): ConfirmationInput => ({
  payment: { providerPaymentId: 501, externalReference: 'LKSNP-ABC12', amountExpected: 150, currencyCode: '340', confirmedAt: null },
  providerPayment: paidPayment(),
  order: { id: 'o1', status: 'PENDING', paymentMethod: 'roki', tickets: [7, 8, 9] },
  conflictingOrders: [],
  ...overrides,
});

test('idempotencia: misma entrada → misma llave; cambia con importe, boletos o intento; ≤191', () => {
  const input = { environment: 'sandbox', orderId: 'ord_1', amount: 150, currencyCode: '340', tickets: [9, 7, 8], attempt: 1 };
  const a = buildIdempotencyKey(input);
  assert.equal(a, buildIdempotencyKey({ ...input, tickets: [7, 8, 9] }), 'el orden de los boletos no importa');
  assert.notEqual(a, buildIdempotencyKey({ ...input, amount: 150.5 }));
  assert.notEqual(a, buildIdempotencyKey({ ...input, tickets: [7, 8] }));
  assert.notEqual(a, buildIdempotencyKey({ ...input, attempt: 2 }));
  assert.notEqual(a, buildIdempotencyKey({ ...input, environment: 'live' }));
  assert.ok(a.length <= 191);
  assert.match(a, /^roki:sandbox:ord_1:[0-9a-f]{24}:1$/);
});

test('expires_at se envía en hora de Honduras (UTC-6) con formato YYYY-MM-DD HH:mm:ss', () => {
  assert.equal(formatHondurasDateTime(new Date('2026-10-30T05:30:00Z')), '2026-10-29 23:30:00');
  assert.equal(formatHondurasDateTime(new Date('2026-12-31T06:00:00Z')), '2026-12-31 00:00:00');
});

test('fechas del proveedor: ISO con zona y local de Honduras sin zona', () => {
  assert.equal(parseProviderDate('2026-10-30T15:04:05Z')?.toISOString(), '2026-10-30T15:04:05.000Z');
  assert.equal(parseProviderDate('2026-10-30 09:04:05')?.toISOString(), '2026-10-30T15:04:05.000Z');
  assert.equal(parseProviderDate(null), null);
  assert.equal(parseProviderDate('no-es-fecha'), null);
});

test('importes: tolerancia de centavos y strings', () => {
  assert.ok(amountsMatch('150.00', 150));
  assert.ok(amountsMatch(0.1 + 0.2, 0.3));
  assert.ok(!amountsMatch(150.01, 150));
  assert.ok(!amountsMatch(null, 150));
});

test('estados del proveedor se normalizan', () => {
  assert.equal(normalizeProviderStatus('paid'), 'paid');
  assert.equal(normalizeProviderStatus('APPROVED'), 'paid');
  assert.equal(normalizeProviderStatus('canceled'), 'voided');
  assert.equal(normalizeProviderStatus(undefined), 'pending');
});

test('confirma una sola vez: ya confirmado → already_confirmed', () => {
  const r = decideConfirmation(base({ payment: { ...base().payment, confirmedAt: new Date() } }));
  assert.equal(r.action, 'already_confirmed');
});

test('no confirma si el proveedor no reporta paid', () => {
  for (const status of ['pending', 'expired', 'voided', 'refunded']) {
    const r = decideConfirmation(base({ providerPayment: paidPayment({ status }) }));
    assert.equal(r.action, 'not_paid');
  }
});

test('identidad del cobro: id, referencia, moneda e importe deben coincidir', () => {
  const cases: Array<[Partial<RokiPayment>, string]> = [
    [{ id: 502 }, 'payment_id_mismatch'],
    [{ external_reference: 'LKSNP-OTRO1' }, 'reference_mismatch'],
    [{ currency: '840' }, 'currency_mismatch'],
    [{ amount: 100, total: 100 }, 'amount_mismatch'],
    [{ amount: 150, total: 165 }, 'amount_mismatch'],
  ];
  for (const [patch, reason] of cases) {
    const r = decideConfirmation(base({ providerPayment: paidPayment(patch) }));
    assert.equal(r.action, 'review');
    assert.equal((r as any).reason, reason);
  }
});

test('pedido PENDING sin conflictos → confirmar', () => {
  const r = decideConfirmation(base());
  assert.deepEqual(r, { action: 'confirm', reinstated: false });
});

test('pedido PENDING con boletos retenidos por otro pedido → revisión (nunca duplicar boletos)', () => {
  const r = decideConfirmation(base({ conflictingOrders: [{ id: 'o2', status: 'PAID', tickets: [9, 50] }] }));
  assert.equal(r.action, 'review');
  assert.equal((r as any).reason, 'ticket_conflict');
  assert.deepEqual((r as any).details.conflicts, [{ id: 'o2', status: 'PAID', tickets: [9] }]);
});

test('pedido ya PAID por otra vía → revisión por posible doble cobro', () => {
  const r = decideConfirmation(base({ order: { id: 'o1', status: 'PAID', paymentMethod: 'transfer', tickets: [7, 8, 9] } }));
  assert.equal(r.action, 'review');
  assert.equal((r as any).reason, 'order_paid_other_method');
});

test('pago tardío sobre pedido liberado: incidencia; solo admin puede reactivar y solo si no hay conflicto', () => {
  const released = { id: 'o1', status: 'CANCELLED', paymentMethod: 'roki', tickets: [7, 8, 9] };
  const auto = decideConfirmation(base({ order: released }));
  assert.equal(auto.action, 'review');
  assert.equal((auto as any).reason, 'late_payment');
  assert.equal((auto as any).details.ticketsAvailable, true);

  const admin = decideConfirmation(base({ order: released, allowReinstate: true }));
  assert.deepEqual(admin, { action: 'confirm', reinstated: true });

  const resold = decideConfirmation(base({ order: released, allowReinstate: true, conflictingOrders: [{ id: 'o3', status: 'PENDING', tickets: [8] }] }));
  assert.equal(resold.action, 'review');
  assert.equal((resold as any).details.ticketsAvailable, false);
});

test('pedido inexistente → revisión', () => {
  assert.equal((decideConfirmation(base({ order: null })) as any).reason, 'order_missing');
});

test('estado público para la pantalla de resultado', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const pay = (p: Partial<NonNullable<Parameters<typeof derivePublicState>[0]['payment']>>) => ({ status: 'pending' as const, confirmedAt: null, reviewReason: null, reviewResolvedAt: null, expiresAt: new Date('2026-10-31T00:00:00Z'), ...p });
  assert.equal(derivePublicState({ orderStatus: 'PAID', payment: pay({ status: 'paid', confirmedAt: now }), now }), 'confirmed');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: pay({ status: 'paid' }), now }), 'verifying');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: pay({}), now }), 'pending');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: pay({ expiresAt: new Date('2026-10-30T11:00:00Z') }), now }), 'expired');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: pay({ status: 'expired' }), now }), 'expired');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: pay({ status: 'voided' }), now }), 'failed');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: pay({ status: 'paid', reviewReason: 'late_payment' }), now }), 'review');
  assert.equal(derivePublicState({ orderStatus: 'CANCELLED', payment: pay({ status: 'expired' }), now }), 'released');
  assert.equal(derivePublicState({ orderStatus: 'PENDING', payment: null, now }), 'none');
});

test('espera exponencial con tope de 30 minutos', () => {
  assert.equal(nextCheckDelayMs(0), 60_000);
  assert.equal(nextCheckDelayMs(3), 8 * 60_000);
  assert.equal(nextCheckDelayMs(10), 30 * 60_000);
});
