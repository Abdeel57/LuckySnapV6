// Cliente del pago con tarjeta (ROKI Connect, checkout alojado).
// Todo pasa por nuestro backend: aquí no hay llaves ni llamadas directas al proveedor.

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

export interface RokiPublicConfig {
    provider: 'roki';
    enabled: boolean;
    environment: 'sandbox' | 'live';
    currencyIso: string;
    currencyCode: string;
}

export interface RokiCheckout {
    paymentId: string;
    providerPaymentId: number | null;
    checkoutUrl: string;
    expiresAt: string | null;
    status: string;
    reused: boolean;
}

export type RokiPublicState = 'confirmed' | 'verifying' | 'pending' | 'failed' | 'expired' | 'review' | 'released' | 'none';

export interface RokiStatus {
    state: RokiPublicState;
    provider: 'roki';
    environment: 'sandbox' | 'live';
    order: {
        id: string;
        folio: string;
        status: string;
        total: number;
        tickets: number[];
        expiresAt: string;
        raffle: { title: string; slug: string | null };
    };
    payment: {
        id: string;
        status: string;
        providerPaymentId: number | null;
        checkoutUrl: string | null;
        expiresAt: string | null;
        paidAt: string | null;
        confirmedAt: string | null;
        amount: number;
        currencyIso: string;
        reviewPending: boolean;
    } | null;
    canContinue: boolean;
    canRetry: boolean;
}

export class RokiApiError extends Error {
    constructor(message: string, readonly code: string | null, readonly status: number) {
        super(message);
        this.name = 'RokiApiError';
    }
}

const DISABLED: RokiPublicConfig = { provider: 'roki', enabled: false, environment: 'sandbox', currencyIso: 'HNL', currencyCode: '340' };

const readError = async (response: Response): Promise<RokiApiError> => {
    let message = `Error ${response.status}`;
    let code: string | null = null;
    try {
        const body = await response.json();
        // Nest envuelve los objetos lanzados con HttpException como { message: {code,message} } o planos
        const inner = body && typeof body.message === 'object' ? body.message : body;
        if (typeof inner?.message === 'string') message = inner.message;
        else if (typeof body?.message === 'string') message = body.message;
        if (typeof inner?.code === 'string') code = inner.code;
        else if (typeof body?.code === 'string') code = body.code;
    } catch { /* sin cuerpo JSON */ }
    return new RokiApiError(message, code, response.status);
};

/** Nunca bloquea la compra: si el backend no responde, la opción simplemente no aparece. */
export const getRokiConfig = async (): Promise<RokiPublicConfig> => {
    try {
        const response = await fetch(`${API_URL}/public/payments/roki/config`);
        if (!response.ok) return DISABLED;
        const data = await response.json();
        return { ...DISABLED, ...data, enabled: data?.enabled === true };
    } catch {
        return DISABLED;
    }
};

export const startRokiCheckout = async (orderId: string, folio: string): Promise<RokiCheckout> => {
    const response = await fetch(`${API_URL}/public/payments/roki/orders/${encodeURIComponent(orderId)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio }),
    });
    if (!response.ok) throw await readError(response);
    return response.json();
};

export const getRokiStatus = async (orderId: string, folio: string): Promise<RokiStatus> => {
    const response = await fetch(`${API_URL}/public/payments/roki/orders/${encodeURIComponent(orderId)}/status?folio=${encodeURIComponent(folio)}`, { cache: 'no-store' });
    if (!response.ok) throw await readError(response);
    return response.json();
};

/** Redirige al checkout alojado. Solo se acepta la URL devuelta por el backend y solo si es https. */
export const goToRokiCheckout = (checkoutUrl: string): boolean => {
    try {
        const url = new URL(checkoutUrl);
        if (url.protocol !== 'https:') return false;
        window.location.assign(url.toString());
        return true;
    } catch {
        return false;
    }
};

// ───────────── Admin ─────────────

export interface RokiAdminPayment {
    id: string;
    provider: string;
    environment: string;
    status: string;
    providerPaymentId: number | null;
    transactionId: string | null;
    externalReference: string;
    amountExpected: number;
    amountConfirmed: number | null;
    currencyIso: string;
    checkoutUrl: string | null;
    expiresAt: string | null;
    paidAt: string | null;
    confirmedAt: string | null;
    lastCheckedAt: string | null;
    nextCheckAt: string | null;
    checkCount: number;
    failureCount: number;
    reviewReason: string | null;
    reviewDetails: Record<string, unknown> | null;
    reviewResolvedAt: string | null;
    reviewResolution: string | null;
    createdAt: string;
    updatedAt: string;
    order: {
        id: string;
        folio: string;
        status: string;
        total: number;
        ticketsCount: number;
        paymentMethod: string | null;
        raffleTitle: string;
        customerName: string;
        customerPhone: string;
    };
}

export interface RokiDiagnostics {
    enabled: boolean;
    requestedEnabled: boolean;
    publicCheckout: boolean;
    returnPage: 'result' | 'receipt';
    payLinkExample: string | null;
    environment: string;
    secretKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
    currencyCode: string;
    currencyIso: string;
    publicAppUrl: string;
    apiBaseUrl: string;
    webhookUrl: string;
    problems: string[];
    merchant: { id: string; business_name: string | null; environment: string | null } | null;
    merchantError: string | null;
    environmentMatches: boolean | null;
    counters: { pending: number; paidUnconfirmed: number; incidents: number; eventsReceived: number; eventsFailed: number; eventsProcessed: number };
    lastWebhook: { eventType: string; receivedAt: string; status: string } | null;
    reconcileIntervalSeconds: number;
}

const adminFetch = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_URL}/admin/payments/roki${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
    if (!response.ok) throw await readError(response);
    return response.json();
};

export const adminGetRokiDiagnostics = () => adminFetch<RokiDiagnostics>('/diagnostics');
export const adminListRokiPayments = (params: { status?: string; environment?: string; folio?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.set(k, String(v)); });
    const suffix = query.toString();
    return adminFetch<RokiAdminPayment[]>(`/payments${suffix ? `?${suffix}` : ''}`);
};
export const adminListRokiIncidents = () => adminFetch<RokiAdminPayment[]>('/incidents');
export const adminReconcileRoki = () => adminFetch<Record<string, unknown>>('/reconcile', { method: 'POST' });
export const adminSyncRokiPayment = (id: string) => adminFetch<Record<string, unknown>>(`/payments/${encodeURIComponent(id)}/sync`, { method: 'POST' });
export const adminResolveRokiIncident = (id: string, action: 'confirm' | 'dismiss', note?: string) =>
    adminFetch<{ ok: boolean; result: unknown }>(`/payments/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: JSON.stringify({ action, note }) });
export const adminRokiWebhookTest = () => adminFetch<Record<string, unknown>>('/webhook-test', { method: 'POST' });
