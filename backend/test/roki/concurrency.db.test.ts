/**
 * Prueba de concurrencia REAL sobre Postgres: varias confirmaciones simultáneas
 * del mismo pago deben producir exactamente un pedido PAID y una sola anotación.
 *
 * Requiere una base de datos de PRUEBAS con las migraciones aplicadas:
 *   DATABASE_URL=<url de pruebas> npx prisma migrate deploy
 *   TEST_DATABASE_URL=<url de pruebas> npm run test:roki-db
 * Se omite si TEST_DATABASE_URL no está definida y se niega a usar la URL de producción.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomInt } from 'node:crypto';

const url = process.env.TEST_DATABASE_URL;
const looksLikeProduction = Boolean(url && (url === process.env.DATABASE_URL || /railway|render\.com|prod/i.test(url)));

test(
  'confirmación concurrente del mismo pago → un solo PAID, sin duplicar boletos',
  { skip: !url ? 'Define TEST_DATABASE_URL (base de pruebas)' : looksLikeProduction ? 'TEST_DATABASE_URL parece producción; abortado' : false },
  async () => {
    process.env.ROKI_ENABLED = 'true';
    process.env.ROKI_ENVIRONMENT = 'sandbox';
    process.env.ROKI_SECRET_KEY = process.env.ROKI_SECRET_KEY || 'sk_test_local';
    process.env.ROKI_WEBHOOK_SECRET = 'whsec_test_local';

    const { PrismaClient } = require('@prisma/client');
    const { AdminService } = require('../../src/admin/admin.service');
    const { RokiConfigService } = require('../../src/roki/roki.config');
    const { RokiPaymentsService } = require('../../src/roki/roki-payments.service');
    const { buildSignatureHeader } = require('../../src/roki/roki.signature');

    const prisma = new PrismaClient({ datasources: { db: { url } } });
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    const providerPaymentId = randomInt(1_000_000, 9_000_000);

    const paidPayload = (id: number, folio: string, amount: number) => ({
      id,
      status: 'paid',
      amount,
      total: amount,
      currency: '340',
      currency_iso: 'HNL',
      external_reference: folio,
      transaction_id: randomUUID(),
      checkout_url: 'https://pay.roki.systems/testslug00',
      paid_at: new Date().toISOString(),
    });

    const fakeClient = {
      getMe: async () => ({ id: 'merchant-test', business_name: 'Test', environment: 'sandbox' }),
      getPayment: async (id: number) => {
        const row = await prisma.payment.findFirst({ where: { providerPaymentId: id } });
        return paidPayload(id, row?.externalReference ?? 'X', row?.amountExpected ?? 0);
      },
      createPayment: async () => { throw new Error('no usado en esta prueba'); },
      listPayments: async () => ({ data: [] }),
      listWebhooks: async () => ({}),
      testWebhook: async () => ({}),
    };

    const admin = new AdminService(prisma);
    const service = new RokiPaymentsService(prisma, new RokiConfigService(), fakeClient, admin);

    const raffle = await prisma.raffle.create({ data: { title: `Prueba ROKI ${suffix}`, price: 50, tickets: 100, drawDate: new Date(Date.now() + 86_400_000), status: 'active' } });
    const user = await prisma.user.create({ data: { email: `roki-${suffix}@test.local`, name: 'Prueba', phone: '99999999' } });
    const cleanup: Array<() => Promise<unknown>> = [];
    cleanup.push(() => prisma.user.delete({ where: { id: user.id } }));
    cleanup.push(() => prisma.raffle.delete({ where: { id: raffle.id } }));

    try {
      // ── Caso 1: seis confirmaciones simultáneas ──────────────────────────────
      const folio = `TST-${suffix}A`;
      const order = await prisma.order.create({ data: { folio, raffleId: raffle.id, userId: user.id, tickets: [1, 2, 3], total: 150, status: 'PENDING', paymentMethod: 'roki', expiresAt: new Date(Date.now() + 86_400_000), notes: 'seed' } });
      const payment = await prisma.payment.create({ data: { orderId: order.id, provider: 'roki', environment: 'sandbox', status: 'pending', providerPaymentId, externalReference: folio, idempotencyKey: `test:${suffix}:1`, amountExpected: 150, currencyCode: '340', currencyIso: 'HNL', requestSnapshot: {} } });
      cleanup.unshift(() => prisma.paymentEvent.deleteMany({ where: { paymentId: payment.id } }));
      cleanup.unshift(() => prisma.payment.deleteMany({ where: { orderId: order.id } }));
      cleanup.unshift(() => prisma.order.delete({ where: { id: order.id } }));

      const payload = paidPayload(providerPaymentId, folio, 150);
      const results = await Promise.all(Array.from({ length: 6 }, (_, i) => service.applyProviderPayment(payment.id, payload, { source: `test-${i}` })));
      const confirmed = results.filter((r: any) => r.result === 'confirmed').length;
      const already = results.filter((r: any) => r.result === 'already_confirmed').length;
      assert.equal(confirmed, 1, `exactamente una confirmación (obtenido ${JSON.stringify(results)})`);
      assert.equal(already, 5);

      const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
      assert.equal(orderAfter?.status, 'PAID');
      assert.equal(orderAfter?.paymentMethod, 'roki');
      assert.equal((orderAfter?.notes ?? '').split('[ROKI sandbox] Pago #').length - 1, 1, 'una sola anotación de confirmación');
      const paymentAfter = await prisma.payment.findUnique({ where: { id: payment.id } });
      assert.ok(paymentAfter?.confirmedAt);
      assert.equal(paymentAfter?.status, 'paid');
      assert.equal(paymentAfter?.amountConfirmed, 150);
      const raffleAfter = await prisma.raffle.findUnique({ where: { id: raffle.id } });
      assert.equal(raffleAfter?.sold, 3);

      // ── Caso 2: webhook duplicado y reproceso idempotente ────────────────────
      const rawBody = Buffer.from(JSON.stringify({ id: randomUUID(), type: 'payment.approved', created_at: new Date().toISOString(), data: payload }));
      const header = buildSignatureHeader('whsec_test_local', rawBody);
      const first = await service.receiveWebhook(rawBody, { 'roki-signature': header });
      const second = await service.receiveWebhook(rawBody, { 'roki-signature': header });
      assert.equal(first.duplicate, false);
      assert.equal(second.duplicate, true);
      await service.processEvent(first.eventRowId);
      const event = await prisma.paymentEvent.findUnique({ where: { id: first.eventRowId } });
      assert.equal(event?.status, 'processed');
      const orderAgain = await prisma.order.findUnique({ where: { id: order.id } });
      assert.equal((orderAgain?.notes ?? '').split('[ROKI sandbox] Pago #').length - 1, 1, 'el webhook no vuelve a confirmar');

      // Firma inválida → 400
      await assert.rejects(() => service.receiveWebhook(rawBody, { 'roki-signature': 't=1,v1=00' }), /Firma inválida/);

      // ── Caso 3: pago tardío sobre pedido liberado cuyos boletos ya se revendieron ──
      const folioB = `TST-${suffix}B`;
      const released = await prisma.order.create({ data: { folio: folioB, raffleId: raffle.id, userId: user.id, tickets: [50, 51], total: 100, status: 'CANCELLED', paymentMethod: 'roki', expiresAt: new Date(Date.now() - 3_600_000) } });
      const resold = await prisma.order.create({ data: { folio: `TST-${suffix}C`, raffleId: raffle.id, userId: user.id, tickets: [51], total: 50, status: 'PENDING', paymentMethod: 'transfer', expiresAt: new Date(Date.now() + 86_400_000) } });
      const latePayment = await prisma.payment.create({ data: { orderId: released.id, provider: 'roki', environment: 'sandbox', status: 'pending', providerPaymentId: providerPaymentId + 1, externalReference: folioB, idempotencyKey: `test:${suffix}:2`, amountExpected: 100, currencyCode: '340', currencyIso: 'HNL', requestSnapshot: {} } });
      cleanup.unshift(() => prisma.payment.deleteMany({ where: { orderId: released.id } }));
      cleanup.unshift(() => prisma.order.deleteMany({ where: { id: { in: [released.id, resold.id] } } }));

      const late = await service.applyProviderPayment(latePayment.id, paidPayload(providerPaymentId + 1, folioB, 100), { source: 'test-late' });
      assert.equal(late.result, 'review');
      assert.equal((late as any).reason, 'late_payment');
      const adminTry = await service.applyProviderPayment(latePayment.id, paidPayload(providerPaymentId + 1, folioB, 100), { source: 'admin', allowReinstate: true });
      assert.equal(adminTry.result, 'review', 'ni el admin puede reactivar si un boleto ya es de otro pedido');
      const releasedAfter = await prisma.order.findUnique({ where: { id: released.id } });
      assert.equal(releasedAfter?.status, 'CANCELLED');
      const incidents = await service.listIncidents();
      assert.ok(incidents.some((i: any) => i.id === latePayment.id && i.reviewReason === 'late_payment'));

      // ── Caso 4: importe distinto → revisión, nunca PAID ───────────────────────
      const folioD = `TST-${suffix}D`;
      const orderD = await prisma.order.create({ data: { folio: folioD, raffleId: raffle.id, userId: user.id, tickets: [60], total: 50, status: 'PENDING', paymentMethod: 'roki', expiresAt: new Date(Date.now() + 86_400_000) } });
      const paymentD = await prisma.payment.create({ data: { orderId: orderD.id, provider: 'roki', environment: 'sandbox', status: 'pending', providerPaymentId: providerPaymentId + 2, externalReference: folioD, idempotencyKey: `test:${suffix}:3`, amountExpected: 50, currencyCode: '340', currencyIso: 'HNL', requestSnapshot: {} } });
      cleanup.unshift(() => prisma.payment.deleteMany({ where: { orderId: orderD.id } }));
      cleanup.unshift(() => prisma.order.delete({ where: { id: orderD.id } }));
      const mismatch = await service.applyProviderPayment(paymentD.id, paidPayload(providerPaymentId + 2, folioD, 40), { source: 'test-amount' });
      assert.equal(mismatch.result, 'review');
      assert.equal((mismatch as any).reason, 'amount_mismatch');
      assert.equal((await prisma.order.findUnique({ where: { id: orderD.id } }))?.status, 'PENDING');
    } finally {
      for (const step of cleanup) await step().catch(() => undefined);
      await prisma.$disconnect();
    }
  },
);
