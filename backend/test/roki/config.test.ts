import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeRokiConfig, loadRokiConfig } from '../../src/roki/roki.config';

test('desactivado por defecto y sin secretos', () => {
  const c = loadRokiConfig({});
  assert.equal(c.enabled, false);
  assert.equal(c.environment, 'sandbox');
  assert.equal(c.currencyCode, '340');
  assert.equal(c.currencyIso, 'HNL');
});

test('sandbox con llave sk_test_ y secreto de webhook → activo', () => {
  const c = loadRokiConfig({ ROKI_ENABLED: 'true', ROKI_ENVIRONMENT: 'sandbox', ROKI_SECRET_KEY: 'sk_test_abc', ROKI_WEBHOOK_SECRET: 'whsec_x', PUBLIC_APP_URL: 'http://localhost:5173/', PUBLIC_API_URL: 'http://localhost:3000' });
  assert.equal(c.enabled, true);
  assert.deepEqual(c.problems, []);
  assert.equal(c.publicAppUrl, 'http://localhost:5173');
});

test('llave de otro entorno bloquea la activación (sandbox y producción separados)', () => {
  const c = loadRokiConfig({ ROKI_ENABLED: 'true', ROKI_ENVIRONMENT: 'sandbox', ROKI_SECRET_KEY: 'sk_live_abc', ROKI_WEBHOOK_SECRET: 'whsec_x' });
  assert.equal(c.enabled, false);
  assert.ok(c.problems.some((p) => p.includes('no corresponde al entorno')));
  const live = loadRokiConfig({ ROKI_ENABLED: 'true', ROKI_ENVIRONMENT: 'live', ROKI_SECRET_KEY: 'sk_test_abc', ROKI_WEBHOOK_SECRET: 'whsec_x', PUBLIC_APP_URL: 'https://luckysnaphn.com' });
  assert.equal(live.enabled, false);
});

test('sin llave: inactivo aunque ROKI_ENABLED=true; sin secreto de webhook: aviso no bloqueante', () => {
  const noKey = loadRokiConfig({ ROKI_ENABLED: 'true' });
  assert.equal(noKey.enabled, false);
  const noWebhook = loadRokiConfig({ ROKI_ENABLED: 'true', ROKI_SECRET_KEY: 'sk_test_abc' });
  assert.equal(noWebhook.enabled, true);
  assert.ok(noWebhook.problems.some((p) => p.includes('ROKI_WEBHOOK_SECRET')));
});

test('producción exige https en PUBLIC_APP_URL (aviso) y acepta alias prod/production', () => {
  const c = loadRokiConfig({ ROKI_ENABLED: 'true', ROKI_ENVIRONMENT: 'production', ROKI_SECRET_KEY: 'sk_live_abc', ROKI_WEBHOOK_SECRET: 'whsec_x', PUBLIC_APP_URL: 'http://luckysnaphn.com' });
  assert.equal(c.environment, 'live');
  assert.ok(c.problems.some((p) => p.includes('https')));
});

test('la descripción para diagnósticos nunca incluye los secretos', () => {
  const c = loadRokiConfig({ ROKI_ENABLED: 'true', ROKI_SECRET_KEY: 'sk_test_SECRETO', ROKI_WEBHOOK_SECRET: 'whsec_SECRETO', PUBLIC_API_URL: 'https://api.example.com/api' });
  const d = describeRokiConfig(c);
  const json = JSON.stringify(d);
  assert.ok(!json.includes('SECRETO'));
  assert.equal(d.secretKeyConfigured, true);
  assert.equal(d.webhookSecretConfigured, true);
  assert.equal(d.webhookUrl, 'https://api.example.com/api/payments/roki/webhook');
});
