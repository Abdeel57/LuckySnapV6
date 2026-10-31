/**
 * Liberador automático de apartados (AdminService.autoExpireOrders) sobre Postgres real.
 * Requiere TEST_DATABASE_URL (base con las tablas de pagos creadas). Opcional:
 * TEST_DATABASE_URL_NO_PAYMENTS = base con el esquema anterior (sin tabla payments)
 * para comprobar que, si la migración no se aplicara, se sigue liberando.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const url = process.env.TEST_DATABASE_URL;
const oldUrl = process.env.TEST_DATABASE_URL_NO_PAYMENTS;
const isProd = (u?: string) => Boolean(u && (u === process.env.DATABASE_URL || /railway|render\.com|prod/i.test(u)));

async function seed(prisma: any, suffix: string) {
  const raffle = await prisma.raffle.create({ data: { title: `AutoExpire ${suffix}`, price: 50, tickets: 100, drawDate: new Date(Date.now() + 86_400_000), status: 'active', bonuses: [] } });
  const user = await prisma.user.create({ data: { email: `ae-${suffix}@test.local`, name: 'AE' } });
  const mk = (folio: string, tickets: number[]) => prisma.order.create({ data: { folio, raffleId: raffle.id, userId: user.id, tickets, total: 50 * tickets.length, status: 'PENDING', expiresAt: new Date(Date.now() - 60_000), notes: '' } });
  return { raffle, user, mk };
}

test('respeta pagos con tarjeta en curso, cobrados sin confirmar o en revisión', { skip: !url ? 'Define TEST_DATABASE_URL' : isProd(url) ? 'parece producción' : false }, async () => {
  const { PrismaClient } = require('@prisma/client');
  const { AdminService } = require('../../src/admin/admin.service');
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const { raffle, user, mk } = await seed(prisma, suffix);
  const orders: Record<string, any> = {};
  try {
    orders.plain = await mk(`AE-${suffix}-1`, [1]);
    orders.linkAlive = await mk(`AE-${suffix}-2`, [2]);
    orders.linkGrace = await mk(`AE-${suffix}-3`, [3]);
    orders.linkDead = await mk(`AE-${suffix}-4`, [4]);
    orders.paidUnconfirmed = await mk(`AE-${suffix}-5`, [5]);
    orders.review = await mk(`AE-${suffix}-6`, [6]);
    const pay = (orderId: string, data: Record<string, unknown>) => prisma.payment.create({ data: { orderId, provider: 'roki', environment: 'live', externalReference: orderId, idempotencyKey: `ae:${orderId}`, amountExpected: 50, currencyCode: '340', currencyIso: 'HNL', requestSnapshot: {}, ...data } });
    await pay(orders.linkAlive.id, { status: 'pending', expiresAt: new Date(Date.now() + 3_600_000) });
    await pay(orders.linkGrace.id, { status: 'pending', expiresAt: new Date(Date.now() - 2 * 60_000) }); // dentro de los 10 min de gracia
    await pay(orders.linkDead.id, { status: 'pending', expiresAt: new Date(Date.now() - 30 * 60_000) });
    await pay(orders.paidUnconfirmed.id, { status: 'paid', expiresAt: new Date(Date.now() - 30 * 60_000) });
    await pay(orders.review.id, { status: 'expired', reviewReason: 'late_payment', expiresAt: new Date(Date.now() - 30 * 60_000) });

    await new AdminService(prisma).autoExpireOrders();

    const status = async (o: any) => (await prisma.order.findUnique({ where: { id: o.id } })).status;
    assert.equal(await status(orders.plain), 'CANCELLED', 'apartado normal vencido se libera');
    assert.equal(await status(orders.linkDead), 'CANCELLED', 'enlace vencido hace más de 10 min se libera');
    assert.equal(await status(orders.linkAlive), 'PENDING', 'enlace vigente no se libera');
    assert.equal(await status(orders.linkGrace), 'PENDING', 'gracia de 10 min para terminar el 3DS');
    assert.equal(await status(orders.paidUnconfirmed), 'PENDING', 'cobro pagado sin confirmar no se libera');
    assert.equal(await status(orders.review), 'PENDING', 'incidencia abierta no se libera');
  } finally {
    const ids = Object.values(orders).map((o: any) => o.id);
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } }).catch(() => undefined);
    await prisma.order.deleteMany({ where: { id: { in: ids } } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    await prisma.raffle.delete({ where: { id: raffle.id } }).catch(() => undefined);
    await prisma.$disconnect();
  }
});

test('si la tabla payments no existe (migración sin aplicar), sigue liberando apartados', { skip: !oldUrl ? 'Define TEST_DATABASE_URL_NO_PAYMENTS' : isProd(oldUrl) ? 'parece producción' : false }, async () => {
  const { PrismaClient } = require('@prisma/client');
  const { AdminService } = require('../../src/admin/admin.service');
  const prisma = new PrismaClient({ datasources: { db: { url: oldUrl } } });
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const { raffle, user, mk } = await seed(prisma, suffix);
  let order: any;
  try {
    order = await mk(`AE-${suffix}-OLD`, [9]);
    await new AdminService(prisma).autoExpireOrders();
    assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).status, 'CANCELLED');
  } finally {
    if (order) await prisma.order.delete({ where: { id: order.id } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    await prisma.raffle.delete({ where: { id: raffle.id } }).catch(() => undefined);
    await prisma.$disconnect();
  }
});
