// Tipos del contrato de ROKI Connect (checkout alojado, API v1).
// Documentación: https://aura.roki.systems/api/connect/v1 (secciones Payments / Webhooks).

export type RokiEnvironment = 'sandbox' | 'live';

/** Estados que devuelve el proveedor en Payment.status */
export type RokiPaymentStatus =
  | 'pending'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'voided'
  | 'expired'
  | 'disabled';

export interface RokiCustomer {
  name?: string;
  email?: string;
  phone?: string;
  identity_number?: string;
}

/** Cuerpo de POST /payments. Los campos desconocidos se ignoran en silencio (revisar `warnings`). */
export interface RokiCreatePaymentBody {
  amount: number; // unidades decimales (p. ej. 150.00), mínimo 0.01
  external_reference: string; // ≤191, NO es único en el proveedor
  name: string; // ≤191
  currency_code?: string; // ISO 4217 numérico, "340" = HNL
  description?: string; // ≤120
  metadata?: Record<string, string | number | boolean>;
  success_url?: string;
  cancel_url?: string;
  expires_at?: string; // hora de Honduras (UTC-6) "YYYY-MM-DD HH:MM:SS" o ISO 8601, en el futuro
  customer?: RokiCustomer;
  lock_customer_fields?: boolean;
  reusable?: boolean;
  sales_tax_type?: 'none' | string;
  tip_enabled?: boolean;
  service_fee_enabled?: boolean;
}

/** Objeto Payment devuelto por el proveedor (POST/GET /payments y `data` de los webhooks). */
export interface RokiPayment {
  id: number;
  status: RokiPaymentStatus | string;
  amount: number | string;
  subtotal?: number | string;
  sales_tax_amount?: number | string;
  service_fee_amount?: number | string;
  total?: number | string;
  currency: string; // "340"
  currency_iso?: string; // "HNL"
  external_reference?: string | null;
  name?: string;
  description?: string | null;
  metadata?: Record<string, unknown> | unknown[] | null; // [] cuando está vacío
  checkout_url?: string | null; // nunca reconstruirla: usar la devuelta
  transaction_id?: string | null; // UUID, null hasta que se paga
  expires_at?: string | null;
  created_at?: string;
  paid_at?: string | null;
  warnings?: string[];
  refunded_amount?: number | string;
  refund_status?: 'none' | 'partial' | 'full' | string;
}

export interface RokiMe {
  id: number | string;
  business_name?: string;
  environment?: RokiEnvironment | string;
}

export interface RokiWebhookEvent {
  id: string; // uuid, sin prefijo
  type: string; // payment.approved | payment.failed | payment.expired | payment.voided | payment.refunded | payment.partially_refunded | webhook.test | ...
  created_at?: string;
  data?: RokiPayment | Record<string, unknown> | null;
}

export interface RokiListResponse<T> {
  data: T[];
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
}
