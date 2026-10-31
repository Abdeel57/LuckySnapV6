import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectImageMime, GENERATED_IMAGE_NAME, mimeForFilename, SAFE_IMAGE_NAME } from '../../src/services/imageStore.service';

const pad = (head: number[]) => Buffer.concat([Buffer.from(head), Buffer.alloc(16)]);

test('detecta el tipo real por los primeros bytes', () => {
  assert.equal(detectImageMime(pad([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(detectImageMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(detectImageMime(Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(10)])), 'image/gif');
  assert.equal(detectImageMime(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(4)])), 'image/webp');
  assert.equal(detectImageMime(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypavif'), Buffer.alloc(4)])), 'image/avif');
  assert.equal(detectImageMime(Buffer.from('<html>no es imagen</html>')), null);
  assert.equal(detectImageMime(Buffer.alloc(3)), null);
});

test('nombres seguros para /uploads: sin rutas ni caracteres raros', () => {
  assert.ok(SAFE_IMAGE_NAME.test('luckysnap_1792612301708_f7a1714721e9.jpg'));
  assert.ok(!SAFE_IMAGE_NAME.test('../secret.jpg'));
  assert.ok(!SAFE_IMAGE_NAME.test('a/b.jpg'));
  assert.ok(!SAFE_IMAGE_NAME.test('foto.svg'));
  assert.ok(!SAFE_IMAGE_NAME.test('foto.jpg.exe'));
});

test('restauración: solo nombres generados por el servicio de subida', () => {
  assert.ok(GENERATED_IMAGE_NAME.test('luckysnap_1792612301708_f7a1714721e9.jpg'));
  assert.ok(!GENERATED_IMAGE_NAME.test('luckysnap_1_f7a1714721e9.jpg'));
  assert.ok(!GENERATED_IMAGE_NAME.test('otra_1792612301708_f7a1714721e9.jpg'));
  assert.ok(!GENERATED_IMAGE_NAME.test('luckysnap_1792612301708_F7A1714721E9.jpg'));
});

test('tipo por extensión', () => {
  assert.equal(mimeForFilename('a.JPG'), 'image/jpeg');
  assert.equal(mimeForFilename('a.webp'), 'image/webp');
  assert.equal(mimeForFilename('a.bin'), 'application/octet-stream');
});
