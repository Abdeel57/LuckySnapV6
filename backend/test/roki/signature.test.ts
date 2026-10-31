import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSignatureHeader, computeRokiSignature, parseSignatureHeader, verifyRokiSignature } from '../../src/roki/roki.signature';

const secret = 'whsec_test_secret_123';
const body = Buffer.from(JSON.stringify({ id: 'evt-1', type: 'payment.approved', data: { id: 42, status: 'paid' } }));
const now = 1_800_000_000;

test('firma válida sobre el cuerpo crudo exacto', () => {
  const header = buildSignatureHeader(secret, body, now);
  const result = verifyRokiSignature({ header, rawBody: body, secret, nowSeconds: now });
  assert.equal(result.valid, true);
  assert.equal(result.timestamp, now);
});

test('la firma cambia si cambia un solo byte del cuerpo', () => {
  const header = buildSignatureHeader(secret, body, now);
  const tampered = Buffer.from(body.toString('utf8').replace('"paid"', '"pend"'));
  const result = verifyRokiSignature({ header, rawBody: tampered, secret, nowSeconds: now });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'mismatch');
});

test('un cuerpo re-serializado (espacios distintos) no verifica: hay que usar el crudo', () => {
  const header = buildSignatureHeader(secret, body, now);
  const pretty = Buffer.from(JSON.stringify(JSON.parse(body.toString('utf8')), null, 2));
  assert.equal(verifyRokiSignature({ header, rawBody: pretty, secret, nowSeconds: now }).valid, false);
});

test('secreto incorrecto', () => {
  const header = buildSignatureHeader('whsec_otro', body, now);
  assert.equal(verifyRokiSignature({ header, rawBody: body, secret, nowSeconds: now }).reason, 'mismatch');
});

test('timestamp fuera de tolerancia (repetición tardía)', () => {
  const header = buildSignatureHeader(secret, body, now - 10_000);
  const result = verifyRokiSignature({ header, rawBody: body, secret, nowSeconds: now, toleranceSeconds: 300 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'timestamp_out_of_tolerance');
});

test('cabecera ausente, mal formada o sin secreto configurado', () => {
  assert.equal(verifyRokiSignature({ header: undefined, rawBody: body, secret }).reason, 'missing_header');
  assert.equal(verifyRokiSignature({ header: 'garbage', rawBody: body, secret }).reason, 'malformed');
  assert.equal(verifyRokiSignature({ header: 't=abc,v1=zz', rawBody: body, secret }).reason, 'malformed');
  assert.equal(verifyRokiSignature({ header: buildSignatureHeader(secret, body, now), rawBody: body, secret: null }).reason, 'missing_secret');
});

test('acepta varias v1 durante una rotación de secreto', () => {
  const good = computeRokiSignature(secret, now, body);
  const stale = computeRokiSignature('whsec_viejo', now, body);
  const header = `t=${now},v1=${stale},v1=${good}`;
  assert.equal(verifyRokiSignature({ header, rawBody: body, secret, nowSeconds: now }).valid, true);
  assert.deepEqual(parseSignatureHeader(header).signatures.length, 2);
});

test('la firma es HMAC-SHA256 de "timestamp.body" en hexadecimal', () => {
  const sig = computeRokiSignature('s', 1, 'x');
  assert.match(sig, /^[0-9a-f]{64}$/);
  // Referencia calculada de forma independiente
  const { createHmac } = require('node:crypto');
  assert.equal(sig, createHmac('sha256', 's').update('1.x').digest('hex'));
});
