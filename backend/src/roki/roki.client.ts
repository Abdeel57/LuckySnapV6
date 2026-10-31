import { Injectable } from '@nestjs/common';
import { RokiConfigService } from './roki.config';
import type { RokiCreatePaymentBody, RokiListResponse, RokiMe, RokiPayment } from './roki.types';

export class RokiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    readonly path: string,
  ) {
    super(message);
    this.name = 'RokiApiError';
  }
}

export interface RokiHttpClient {
  getMe(): Promise<RokiMe>;
  createPayment(body: RokiCreatePaymentBody, idempotencyKey: string): Promise<RokiPayment>;
  getPayment(id: number): Promise<RokiPayment>;
  listPayments(params: Record<string, string | number | undefined>): Promise<RokiListResponse<RokiPayment>>;
  listWebhooks(): Promise<unknown>;
  testWebhook(): Promise<unknown>;
}

const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Cliente HTTP mínimo sobre fetch global (Node ≥ 18). La llave secreta solo se
 * usa aquí y nunca se registra ni se devuelve en errores.
 */
@Injectable()
export class RokiClient implements RokiHttpClient {
  constructor(private readonly configService: RokiConfigService) {}

  private get config() {
    return this.configService.config;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, options: { body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
    if (!this.config.secretKey) {
      throw new RokiApiError('ROKI_SECRET_KEY no configurada', 0, null, path);
    }
    const url = `${this.config.apiBaseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.secretKey}`,
      Accept: 'application/json',
      'User-Agent': 'LuckySnap/1.0 (+roki-connect)',
      ...options.headers,
    };
    let payload: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url, { method, headers, body: payload, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new RokiApiError(`No se pudo contactar a ROKI (${reason})`, 0, null, path);
    }

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.slice(0, 500) };
      }
    }

    if (!response.ok) {
      const message = typeof (data as any)?.message === 'string' ? (data as any).message : `ROKI respondió ${response.status}`;
      throw new RokiApiError(message, response.status, data, path);
    }

    // ROKI envuelve algunas respuestas en { data: ... }
    if (data && typeof data === 'object' && 'data' in (data as any) && !Array.isArray((data as any).data) && path !== '/payments' && !path.startsWith('/payments?')) {
      return (data as any).data as T;
    }
    return data as T;
  }

  getMe(): Promise<RokiMe> {
    return this.request<RokiMe>('GET', '/me');
  }

  async createPayment(body: RokiCreatePaymentBody, idempotencyKey: string): Promise<RokiPayment> {
    const payment = await this.request<RokiPayment | { data: RokiPayment }>('POST', '/payments', {
      body,
      headers: { 'Idempotency-Key': idempotencyKey.slice(0, 191) },
    });
    return unwrap(payment);
  }

  async getPayment(id: number): Promise<RokiPayment> {
    const payment = await this.request<RokiPayment | { data: RokiPayment }>('GET', `/payments/${encodeURIComponent(String(id))}`);
    return unwrap(payment);
  }

  listPayments(params: Record<string, string | number | undefined>): Promise<RokiListResponse<RokiPayment>> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
    }
    const suffix = query.toString();
    return this.request<RokiListResponse<RokiPayment>>('GET', `/payments${suffix ? `?${suffix}` : ''}`);
  }

  listWebhooks(): Promise<unknown> {
    return this.request<unknown>('GET', '/webhooks');
  }

  testWebhook(): Promise<unknown> {
    return this.request<unknown>('POST', '/webhooks/test', { body: {} });
  }
}

function unwrap(value: RokiPayment | { data: RokiPayment }): RokiPayment {
  if (value && typeof value === 'object' && 'data' in value && value.data && typeof (value as any).data === 'object' && 'id' in (value as any).data) {
    return (value as { data: RokiPayment }).data;
  }
  return value as RokiPayment;
}
