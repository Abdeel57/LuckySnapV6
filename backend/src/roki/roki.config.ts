import { Injectable } from '@nestjs/common';
import type { RokiEnvironment } from './roki.types';

/**
 * Configuración de ROKI leída del entorno. Los secretos nunca salen de aquí:
 * `describe()` devuelve solo banderas (configurado / no configurado).
 */
export interface RokiConfig {
  enabled: boolean; // ROKI_ENABLED=true y sin problemas bloqueantes (API, enlaces y webhooks operan)
  requestedEnabled: boolean; // valor crudo de ROKI_ENABLED
  publicCheckout: boolean; // ROKI_PUBLIC_CHECKOUT=true: la opción "Tarjeta" se muestra en la tienda
  returnPage: 'result' | 'receipt'; // a dónde vuelve el comprador: /#/pago (frontend nuevo) o comprobante + página del backend
  environment: RokiEnvironment;
  secretKey: string | null;
  webhookSecret: string | null;
  currencyCode: string; // "340"
  currencyIso: string; // "HNL"
  publicAppUrl: string; // origen del frontend para success_url / cancel_url
  publicApiUrl: string | null; // origen público del backend (solo para mostrar la URL del webhook)
  apiBaseUrl: string;
  webhookToleranceSeconds: number;
  reconcileIntervalSeconds: number;
  minMinutesBeforeOrderExpiry: number; // no crear enlaces si el apartado vence antes
  problems: string[]; // problemas de configuración (texto sin secretos)
}

export const ROKI_DEFAULT_API_BASE_URL = 'https://aura.roki.systems/api/connect/v1';
export const ROKI_WEBHOOK_PATH = '/api/payments/roki/webhook';
export const ROKI_PAY_LINK_PATH = '/api/public/payments/roki/pay';
export const ROKI_RETURN_PATH = '/api/public/payments/roki/return';

/** Origen público del backend sin el sufijo /api (o null si no está configurado). */
export const apiOrigin = (config: Pick<RokiConfig, 'publicApiUrl'>): string | null => (config.publicApiUrl ? config.publicApiUrl.replace(/\/api$/, '') : null);

const CURRENCY_ISO: Record<string, string> = {
  '340': 'HNL',
  '840': 'USD',
};

const KEY_PREFIX: Record<RokiEnvironment, string> = {
  sandbox: 'sk_test_',
  live: 'sk_live_',
};

const trim = (value: string | undefined | null): string => (value ?? '').trim();

const toInt = (value: string | undefined, fallback: number): number => {
  const n = Number.parseInt(trim(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function loadRokiConfig(env: NodeJS.ProcessEnv = process.env): RokiConfig {
  const problems: string[] = [];
  const requestedEnabled = trim(env.ROKI_ENABLED).toLowerCase() === 'true';

  const rawEnv = trim(env.ROKI_ENVIRONMENT).toLowerCase() || 'sandbox';
  let environment: RokiEnvironment = 'sandbox';
  if (rawEnv === 'live' || rawEnv === 'production' || rawEnv === 'prod') environment = 'live';
  else if (rawEnv !== 'sandbox' && rawEnv !== 'test') problems.push(`ROKI_ENVIRONMENT desconocido ("${rawEnv}"); se usa sandbox`);

  const secretKey = trim(env.ROKI_SECRET_KEY) || null;
  if (requestedEnabled && !secretKey) problems.push('Falta ROKI_SECRET_KEY');
  if (secretKey && !secretKey.startsWith(KEY_PREFIX[environment])) {
    problems.push(`ROKI_SECRET_KEY no corresponde al entorno ${environment} (se esperaba prefijo ${KEY_PREFIX[environment]})`);
  }

  const webhookSecret = trim(env.ROKI_WEBHOOK_SECRET) || null;
  if (requestedEnabled && !webhookSecret) problems.push('Falta ROKI_WEBHOOK_SECRET (los webhooks se rechazarán hasta configurarlo)');

  const currencyCode = trim(env.ROKI_CURRENCY_CODE) || '340';
  if (!/^\d{3}$/.test(currencyCode)) problems.push(`ROKI_CURRENCY_CODE debe ser ISO 4217 numérico de 3 dígitos ("${currencyCode}")`);
  const currencyIso = trim(env.ROKI_CURRENCY_ISO) || CURRENCY_ISO[currencyCode] || currencyCode;

  const publicAppUrl = (trim(env.PUBLIC_APP_URL) || trim(env.FRONTEND_URL) || 'http://localhost:5173').replace(/\/+$/, '');
  if (requestedEnabled && environment === 'live' && !/^https:\/\//.test(publicAppUrl)) {
    problems.push('PUBLIC_APP_URL debe ser https en producción');
  }
  const publicApiUrl = trim(env.PUBLIC_API_URL) ? trim(env.PUBLIC_API_URL).replace(/\/+$/, '') : null;

  const apiBaseUrl = (trim(env.ROKI_API_BASE_URL) || ROKI_DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  const publicCheckout = trim(env.ROKI_PUBLIC_CHECKOUT).toLowerCase() === 'true';
  const rawReturn = trim(env.ROKI_RETURN_PAGE).toLowerCase() || 'result';
  const returnPage: RokiConfig['returnPage'] = rawReturn === 'receipt' ? 'receipt' : 'result';
  if (rawReturn !== 'receipt' && rawReturn !== 'result') problems.push(`ROKI_RETURN_PAGE desconocido ("${rawReturn}"); se usa result`);
  if (requestedEnabled && !publicApiUrl) problems.push('Falta PUBLIC_API_URL: el regreso desde ROKI no podrá verificar el cobro al instante ni existirán enlaces de pago por folio');

  // Problemas que impiden operar aunque ROKI_ENABLED=true
  const blocking = problems.some((p) => p.startsWith('Falta ROKI_SECRET_KEY') || p.startsWith('ROKI_SECRET_KEY no corresponde') || p.startsWith('ROKI_CURRENCY_CODE'));

  return {
    enabled: requestedEnabled && !blocking,
    requestedEnabled,
    publicCheckout,
    returnPage,
    environment,
    secretKey,
    webhookSecret,
    currencyCode,
    currencyIso,
    publicAppUrl,
    publicApiUrl,
    apiBaseUrl,
    webhookToleranceSeconds: toInt(env.ROKI_WEBHOOK_TOLERANCE_SECONDS, 300),
    reconcileIntervalSeconds: toInt(env.ROKI_RECONCILE_INTERVAL_SECONDS, 120),
    minMinutesBeforeOrderExpiry: toInt(env.ROKI_MIN_MINUTES_BEFORE_EXPIRY, 5),
    problems,
  };
}

/** Vista segura de la configuración (sin secretos) para diagnósticos. */
export function describeRokiConfig(config: RokiConfig) {
  const origin = apiOrigin(config);
  return {
    enabled: config.enabled,
    requestedEnabled: config.requestedEnabled,
    publicCheckout: config.publicCheckout,
    returnPage: config.returnPage,
    payLinkExample: origin ? `${origin}${ROKI_PAY_LINK_PATH}/<FOLIO>` : null,
    environment: config.environment,
    secretKeyConfigured: Boolean(config.secretKey),
    webhookSecretConfigured: Boolean(config.webhookSecret),
    currencyCode: config.currencyCode,
    currencyIso: config.currencyIso,
    publicAppUrl: config.publicAppUrl,
    apiBaseUrl: config.apiBaseUrl,
    webhookUrl: origin ? `${origin}${ROKI_WEBHOOK_PATH}` : `<PUBLIC_API_URL>${ROKI_WEBHOOK_PATH}`,
    problems: config.problems,
  };
}

@Injectable()
export class RokiConfigService {
  readonly config: RokiConfig;

  constructor() {
    this.config = loadRokiConfig();
    if (this.config.problems.length > 0) {
      console.warn(`⚠️ [ROKI] Configuración: ${this.config.problems.join(' | ')}`);
    }
    console.log(`💳 [ROKI] ${this.config.enabled ? 'activo' : 'inactivo'} · entorno ${this.config.environment} · moneda ${this.config.currencyIso} · ${this.config.publicCheckout ? 'visible en la tienda' : 'oculto en la tienda'} · regreso ${this.config.returnPage}`);
  }
}
