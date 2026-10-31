import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verificación de la cabecera `ROKI-Signature: t=<timestamp>,v1=<hex>`.
 * firma esperada = HMAC-SHA256(`${timestamp}.${cuerpo crudo exacto}`, signing_secret)
 * Sin dependencias de Nest para poder probarla de forma aislada.
 */

export interface ParsedSignature {
  timestamp: number | null;
  signatures: string[]; // puede traer varias v1 durante una rotación de secreto
}

export interface SignatureCheck {
  valid: boolean;
  reason?: 'missing_header' | 'missing_secret' | 'malformed' | 'timestamp_out_of_tolerance' | 'mismatch';
  timestamp?: number;
}

export function parseSignatureHeader(header: string | string[] | undefined | null): ParsedSignature {
  const raw = Array.isArray(header) ? header.join(',') : header ?? '';
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of raw.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') {
      const n = Number.parseInt(value, 10);
      timestamp = Number.isFinite(n) ? n : null;
    } else if (key === 'v1' && /^[0-9a-fA-F]+$/.test(value)) {
      signatures.push(value.toLowerCase());
    }
  }
  return { timestamp, signatures };
}

export function computeRokiSignature(secret: string, timestamp: number | string, rawBody: Buffer | string): string {
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  return createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(body)
    .digest('hex');
}

/** Devuelve un header válido para pruebas y para el endpoint de autodiagnóstico. */
export function buildSignatureHeader(secret: string, rawBody: Buffer | string, timestamp: number = Math.floor(Date.now() / 1000)): string {
  return `t=${timestamp},v1=${computeRokiSignature(secret, timestamp, rawBody)}`;
}

export function verifyRokiSignature(params: {
  header: string | string[] | undefined | null;
  rawBody: Buffer | string;
  secret: string | null | undefined;
  toleranceSeconds?: number;
  nowSeconds?: number;
}): SignatureCheck {
  const { header, rawBody, secret } = params;
  if (!secret) return { valid: false, reason: 'missing_secret' };
  if (!header) return { valid: false, reason: 'missing_header' };

  const parsed = parseSignatureHeader(header);
  if (parsed.timestamp === null || parsed.signatures.length === 0) return { valid: false, reason: 'malformed' };

  const tolerance = params.toleranceSeconds ?? 300;
  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (tolerance > 0 && Math.abs(now - parsed.timestamp) > tolerance) {
    return { valid: false, reason: 'timestamp_out_of_tolerance', timestamp: parsed.timestamp };
  }

  const expected = Buffer.from(computeRokiSignature(secret, parsed.timestamp, rawBody), 'hex');
  const matches = parsed.signatures.some((candidate) => {
    const received = Buffer.from(candidate, 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });

  return matches ? { valid: true, timestamp: parsed.timestamp } : { valid: false, reason: 'mismatch', timestamp: parsed.timestamp };
}
