import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RokiPublicController } from '../../src/roki/roki-public.controller';

/** Respuesta de Express mínima para inspeccionar redirecciones y HTML. */
function fakeResponse() {
  const res: any = { headers: {}, statusCode: 200, body: '', redirected: null as null | { status: number; url: string } };
  res.setHeader = (k: string, v: string) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.type = () => res;
  res.send = (body: string) => { res.body = body; return res; };
  res.redirect = (status: number, url: string) => { res.redirected = { status, url }; return res; };
  return res;
}

const config = { publicAppUrl: 'https://luckysnaphn.com' };

test('enlace por folio: redirige al checkout https de ROKI sin caché', async () => {
  const service: any = { config, startCheckoutByFolio: async (folio: string) => ({ orderId: 'o1', checkoutUrl: `https://pay.roki.systems/abc?f=${folio}` }) };
  const res = fakeResponse();
  await new RokiPublicController(service).payByFolio('lksnp-ab12c', res);
  assert.deepEqual(res.redirected, { status: 302, url: 'https://pay.roki.systems/abc?f=lksnp-ab12c' });
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('enlace por folio: nunca redirige a una URL no https', async () => {
  const service: any = { config, startCheckoutByFolio: async () => ({ orderId: 'o1', checkoutUrl: 'javascript:alert(1)' }) };
  const res = fakeResponse();
  await new RokiPublicController(service).payByFolio('LKSNP-AB12C', res);
  assert.equal(res.redirected, null);
  assert.equal(res.statusCode, 502);
});

test('enlace por folio: pedido ya pagado → comprobante', async () => {
  const service: any = { config, startCheckoutByFolio: async () => { throw new ConflictException({ code: 'already_paid', message: 'Este pedido ya está pagado.' }); } };
  const res = fakeResponse();
  await new RokiPublicController(service).payByFolio('LKSNP-AB12C', res);
  assert.deepEqual(res.redirected, { status: 302, url: 'https://luckysnaphn.com/#/comprobante/LKSNP-AB12C' });
});

test('enlace por folio: importe no verificable → página con el motivo (409)', async () => {
  const service: any = { config, startCheckoutByFolio: async () => { throw new ConflictException({ code: 'amount_unverified', message: 'No pudimos validar el importe de este pedido para pagar con tarjeta.' }); } };
  const res = fakeResponse();
  await new RokiPublicController(service).payByFolio('LKSNP-AB12C', res);
  assert.equal(res.statusCode, 409);
  assert.ok(res.body.includes('No pudimos validar el importe'));
  assert.ok(res.body.includes('LKSNP-AB12C'));
});

test('enlace por folio: folio inexistente → 404', async () => {
  const service: any = { config, startCheckoutByFolio: async () => { throw new NotFoundException('Pedido no encontrado'); } };
  const res = fakeResponse();
  await new RokiPublicController(service).payByFolio('NOPE', res);
  assert.equal(res.statusCode, 404);
  assert.ok(res.body.includes('No encontramos este apartado'));
});

test('regreso: redirige cuando el servicio lo indica y muestra página en otro caso', async () => {
  const calls: any[] = [];
  const service: any = {
    config,
    resolveReturn: async (...args: any[]) => {
      calls.push(args);
      return args[2] === 'success' ? { redirect: 'https://luckysnaphn.com/#/comprobante/LKSNP-AB12C' } : { page: { tone: 'warning', title: 'No se completó el pago', message: 'm' } };
    },
  };
  const ok = fakeResponse();
  await new RokiPublicController(service).handleReturn('o1', 'lksnp-ab12c', 'success', undefined as any, ok);
  assert.deepEqual(ok.redirected, { status: 302, url: 'https://luckysnaphn.com/#/comprobante/LKSNP-AB12C' });
  assert.deepEqual(calls[0], ['o1', 'LKSNP-AB12C', 'success', 0]);

  const cancel = fakeResponse();
  await new RokiPublicController(service).handleReturn('o1', 'LKSNP-AB12C', 'cualquiera', '3', cancel);
  assert.equal(cancel.statusCode, 200);
  assert.ok(cancel.body.includes('No se completó el pago'));
  assert.deepEqual(calls[1], ['o1', 'LKSNP-AB12C', 'cancel', 3]);
});
