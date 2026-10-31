import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedTotals, countPurchasedTickets, decideConfirmation, isLegitimateTotal, parsePacks, unitPrice } from '../../src/roki/roki.decision';
import { describeRokiConfig, loadRokiConfig } from '../../src/roki/roki.config';
import { renderPaymentPage } from '../../src/roki/roki.html';

const raffle = { price: 50, tickets: 1000, packs: [{ name: 'Pack 5', tickets: 5, price: 200 }, { name: 'Pack 10', q: 10, price: 350 }] };

test('precio unitario igual que la tienda: price, si no paquete de 1, si no 50', () => {
  assert.equal(unitPrice(raffle), 50);
  assert.equal(unitPrice({ price: 0, tickets: 10, packs: [{ tickets: 1, price: 30 }] }), 30);
  assert.equal(unitPrice({ price: null, tickets: 10, packs: null }), 50);
});

test('paquetes: acepta tickets o q, ignora precios inválidos y JSON en texto', () => {
  assert.deepEqual(parsePacks(JSON.stringify([{ q: 3, price: '100' }, { tickets: 2, price: 0 }, null])), [{ tickets: 3, price: 100 }]);
  assert.deepEqual(parsePacks('no-json'), []);
});

test('los boletos de regalo (fuera del rango base) no se cobran', () => {
  assert.equal(countPurchasedTickets([1, 2, 1500, 1800], 1000), 2);
});

test('totales válidos: unitario, paquete exacto y paquete × cantidad', () => {
  assert.deepEqual(allowedTotals(raffle, 1), [50]);
  assert.deepEqual(allowedTotals(raffle, 5), [200, 250]);
  assert.deepEqual(allowedTotals(raffle, 10), [350, 400, 500]); // 10×50, 2×Pack5, 1×Pack10
  assert.deepEqual(allowedTotals(raffle, 0), []);
});

test('rechaza totales manipulados desde el navegador', () => {
  const tickets = [10, 20, 30, 40, 50];
  assert.equal(isLegitimateTotal(250, raffle, tickets).ok, true);
  assert.equal(isLegitimateTotal(200, raffle, tickets).ok, true);
  assert.equal(isLegitimateTotal(1, raffle, tickets).ok, false);
  assert.equal(isLegitimateTotal(249.99, raffle, tickets).ok, false);
  // 50 boletos pagando L 1 → nunca válido
  assert.equal(isLegitimateTotal(1, raffle, Array.from({ length: 50 }, (_, i) => i + 1)).ok, false);
  // Con regalos: 2 comprados + 2 de regalo cuestan 2 × 50
  assert.equal(isLegitimateTotal(100, raffle, [5, 6, 1200, 1300]).ok, true);
});

test('pedido editado después de crear el enlace → revisión order_changed', () => {
  const r = decideConfirmation({
    payment: { providerPaymentId: 7, externalReference: 'F1', amountExpected: 100, currencyCode: '340', confirmedAt: null },
    providerPayment: { id: 7, status: 'paid', amount: 100, total: 100, currency: '340', external_reference: 'F1' },
    order: { id: 'o', status: 'PENDING', paymentMethod: 'transfer', tickets: [1, 2, 3], total: 150 },
    conflictingOrders: [],
  });
  assert.equal(r.action, 'review');
  assert.equal((r as any).reason, 'order_changed');
});

test('ROKI_PUBLIC_CHECKOUT oculta la opción por defecto; ROKI_RETURN_PAGE elige el regreso', () => {
  const base = { ROKI_ENABLED: 'true', ROKI_ENVIRONMENT: 'live', ROKI_SECRET_KEY: 'sk_live_x', ROKI_WEBHOOK_SECRET: 'whsec_x', PUBLIC_APP_URL: 'https://luckysnaphn.com', PUBLIC_API_URL: 'https://api.example.com' };
  const hidden = loadRokiConfig({ ...base, ROKI_RETURN_PAGE: 'receipt' });
  assert.equal(hidden.enabled, true);
  assert.equal(hidden.publicCheckout, false);
  assert.equal(hidden.returnPage, 'receipt');
  assert.deepEqual(hidden.problems, []);
  assert.equal(describeRokiConfig(hidden).payLinkExample, 'https://api.example.com/api/public/payments/roki/pay/<FOLIO>');
  const shown = loadRokiConfig({ ...base, ROKI_PUBLIC_CHECKOUT: 'true' });
  assert.equal(shown.publicCheckout, true);
  assert.equal(shown.returnPage, 'result');
  assert.ok(loadRokiConfig({ ...base, PUBLIC_API_URL: '' }).problems.some((p) => p.includes('PUBLIC_API_URL')));
});

test('la página del backend escapa el contenido', () => {
  const html = renderPaymentPage({ tone: 'warning', title: '<script>x</script>', message: 'a & b', details: [['Folio', '"LK"']], actions: [{ label: 'Ir', href: 'https://x.test/?a=1&b=2' }] });
  assert.ok(!html.includes('<script>x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('a &amp; b'));
  assert.ok(html.includes('href="https://x.test/?a=1&amp;b=2"'));
  assert.ok(html.includes('noindex'));
});
