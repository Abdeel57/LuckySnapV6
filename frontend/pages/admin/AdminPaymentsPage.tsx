import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Copy, CreditCard, RefreshCw, Search, ShieldCheck, ShieldAlert, Wifi, XCircle } from 'lucide-react';
import {
    adminGetRokiDiagnostics,
    adminListRokiIncidents,
    adminListRokiPayments,
    adminReconcileRoki,
    adminResolveRokiIncident,
    adminRokiWebhookTest,
    adminSyncRokiPayment,
    type RokiAdminPayment,
    type RokiDiagnostics,
} from '../../services/rokiApi';
import Spinner from '../../components/Spinner';
import { formatDateTime, formatMoney } from '../../utils/format';

/**
 * Pagos con tarjeta (ROKI): diagnóstico de la integración, incidencias que
 * requieren revisión humana y el historial de intentos con su estado financiero.
 */

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    pending: { label: 'Esperando pago', className: 'bg-amber-100 text-amber-800 border-amber-300' },
    paid: { label: 'Pagado', className: 'bg-green-100 text-green-800 border-green-300' },
    failed: { label: 'Falló', className: 'bg-red-100 text-red-800 border-red-300' },
    expired: { label: 'Enlace vencido', className: 'bg-gray-100 text-gray-700 border-gray-300' },
    voided: { label: 'Anulado', className: 'bg-gray-100 text-gray-700 border-gray-300' },
    disabled: { label: 'Deshabilitado', className: 'bg-gray-100 text-gray-700 border-gray-300' },
    refunded: { label: 'Reembolsado', className: 'bg-purple-100 text-purple-800 border-purple-300' },
    partially_refunded: { label: 'Reembolso parcial', className: 'bg-purple-100 text-purple-800 border-purple-300' },
};

const REVIEW_LABEL: Record<string, string> = {
    order_changed: 'El pedido cambió de importe después de crear el enlace',
    late_payment: 'Pago tardío: el apartado ya se había liberado',
    ticket_conflict: 'Boletos ya asignados a otro pedido',
    amount_mismatch: 'El importe cobrado no coincide con el pedido',
    currency_mismatch: 'La moneda no coincide',
    reference_mismatch: 'La referencia (folio) no coincide',
    payment_id_mismatch: 'El pago no corresponde al registrado',
    order_paid_other_method: 'El pedido ya estaba pagado por otra vía (posible doble cobro)',
    order_missing: 'El pedido no existe',
    order_status_unknown: 'Estado del pedido desconocido',
    refunded_after_confirmation: 'Reembolso sobre un pedido ya confirmado',
};

const ORDER_LABEL: Record<string, string> = { PENDING: 'Apartado', PAID: 'Pagado', CANCELLED: 'Liberado', EXPIRED: 'Vencido', RELEASED: 'Liberado' };

const badge = (status: string) => {
    const meta = STATUS_LABEL[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-300' };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.className}`}>{meta.label}</span>;
};

const AdminPaymentsPage: React.FC = () => {
    const [diagnostics, setDiagnostics] = useState<RokiDiagnostics | null>(null);
    const [incidents, setIncidents] = useState<RokiAdminPayment[]>([]);
    const [payments, setPayments] = useState<RokiAdminPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [folioFilter, setFolioFilter] = useState('');
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [diag, inc, pays] = await Promise.all([
                adminGetRokiDiagnostics(),
                adminListRokiIncidents(),
                adminListRokiPayments({ status: statusFilter || undefined, folio: folioFilter.trim() || undefined, limit: 200 }),
            ]);
            setDiagnostics(diag);
            setIncidents(inc);
            setPayments(pays);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar la información de pagos');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, folioFilter]);

    useEffect(() => { load(); }, [load]);

    const run = async (key: string, action: () => Promise<unknown>, okText: string) => {
        setBusy(key);
        setMessage(null);
        try {
            const result = await action();
            setMessage({ tone: 'ok', text: typeof result === 'string' ? result : okText });
            await load();
        } catch (err) {
            setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'La acción falló' });
        } finally {
            setBusy(null);
        }
    };

    const copyWebhook = async () => {
        if (!diagnostics) return;
        try {
            await navigator.clipboard.writeText(diagnostics.webhookUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* sin portapapeles */ }
    };

    const health = useMemo(() => {
        if (!diagnostics) return null;
        if (!diagnostics.requestedEnabled) return { tone: 'warn' as const, text: 'Desactivado (ROKI_ENABLED=false)' };
        if (!diagnostics.enabled) return { tone: 'error' as const, text: 'Configuración incompleta' };
        if (diagnostics.merchantError) return { tone: 'error' as const, text: 'Sin conexión con ROKI' };
        if (diagnostics.environmentMatches === false) return { tone: 'error' as const, text: 'La llave es de otro entorno' };
        if (!diagnostics.webhookSecretConfigured) return { tone: 'warn' as const, text: 'Activo, falta el secreto del webhook' };
        return { tone: 'ok' as const, text: 'Operativo' };
    }, [diagnostics]);

    if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-600" aria-hidden /> Pagos con tarjeta</h1>
                    <p className="text-sm text-gray-500">ROKI Connect · checkout alojado</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => run('reconcile', adminReconcileRoki, 'Conciliación ejecutada')} disabled={busy !== null} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${busy === 'reconcile' ? 'animate-spin' : ''}`} aria-hidden /> Conciliar ahora
                    </button>
                    <button type="button" onClick={() => load()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Actualizar
                    </button>
                </div>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
            {message && (
                <div role="status" className={`rounded-xl border p-3 text-sm ${message.tone === 'ok' ? 'border-green-300 bg-green-50 text-green-800' : message.tone === 'warn' ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-red-300 bg-red-50 text-red-800'}`}>{message.text}</div>
            )}

            {/* Diagnóstico */}
            {diagnostics && health && (
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            {health.tone === 'ok' ? <ShieldCheck className="w-5 h-5 text-green-600" aria-hidden /> : <ShieldAlert className="w-5 h-5 text-amber-600" aria-hidden />}
                            Estado de la integración
                        </h2>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${health.tone === 'ok' ? 'bg-green-100 text-green-800 border-green-300' : health.tone === 'warn' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-300'}`}>{health.text}</span>
                    </div>
                    <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                        <div><dt className="text-gray-500">Entorno</dt><dd className="font-semibold text-gray-900">{diagnostics.environment === 'live' ? 'Producción (live)' : 'Pruebas (sandbox)'}{diagnostics.environmentMatches === false && <span className="ml-2 text-red-700">⚠ la llave no coincide</span>}</dd></div>
                        <div><dt className="text-gray-500">Comercio</dt><dd className="font-semibold text-gray-900">{diagnostics.merchant ? `${diagnostics.merchant.business_name || 'Sin nombre'} (#${diagnostics.merchant.id})` : diagnostics.merchantError ? <span className="text-red-700">{diagnostics.merchantError}</span> : 'Sin llave configurada'}</dd></div>
                        <div><dt className="text-gray-500">Moneda</dt><dd className="font-semibold text-gray-900">{diagnostics.currencyIso} ({diagnostics.currencyCode})</dd></div>
                        <div><dt className="text-gray-500">Visible en la tienda</dt><dd className="font-semibold text-gray-900">{diagnostics.publicCheckout ? 'Sí' : 'No (solo enlaces de pago por folio)'}</dd></div>
                        <div><dt className="text-gray-500">Regreso del comprador</dt><dd className="font-semibold text-gray-900">{diagnostics.returnPage === 'receipt' ? 'Comprobante / página del backend' : 'Página de resultado de la tienda'}</dd></div>
                        <div><dt className="text-gray-500">Llave secreta</dt><dd className="font-semibold text-gray-900">{diagnostics.secretKeyConfigured ? 'Configurada' : 'Falta'}</dd></div>
                        <div><dt className="text-gray-500">Secreto del webhook</dt><dd className="font-semibold text-gray-900">{diagnostics.webhookSecretConfigured ? 'Configurado' : 'Falta'}</dd></div>
                        <div><dt className="text-gray-500">Último webhook</dt><dd className="font-semibold text-gray-900">{diagnostics.lastWebhook ? `${diagnostics.lastWebhook.eventType} · ${formatDateTime(diagnostics.lastWebhook.receivedAt)} · ${diagnostics.lastWebhook.status}` : 'Ninguno recibido'}</dd></div>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <dt className="text-gray-500">URL del webhook (configurarla en el portal de ROKI, eventos payment.*)</dt>
                            <dd className="mt-1 flex items-center gap-2">
                                <code className="text-xs sm:text-sm bg-gray-100 rounded-lg px-2 py-1 break-all">{diagnostics.webhookUrl}</code>
                                <button type="button" onClick={copyWebhook} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">{copied ? <CheckCircle className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}{copied ? 'Copiada' : 'Copiar'}</button>
                            </dd>
                        </div>
                    </dl>
                    {diagnostics.payLinkExample && (
                        <p className="mt-3 text-sm text-gray-600">Enlace de pago por folio (para enviar por WhatsApp): <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5 break-all">{diagnostics.payLinkExample}</code></p>
                    )}
                    {diagnostics.problems.length > 0 && (
                        <ul className="mt-4 space-y-1 text-sm text-amber-800">
                            {diagnostics.problems.map(p => <li key={p} className="flex gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />{p}</li>)}
                        </ul>
                    )}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
                        <span>Esperando pago: <strong className="tnum">{diagnostics.counters.pending}</strong></span>
                        <span>Pagados sin confirmar: <strong className="tnum">{diagnostics.counters.paidUnconfirmed}</strong></span>
                        <span>Incidencias: <strong className="tnum">{diagnostics.counters.incidents}</strong></span>
                        <span>Webhooks procesados: <strong className="tnum">{diagnostics.counters.eventsProcessed}</strong> · pendientes {diagnostics.counters.eventsReceived} · fallidos {diagnostics.counters.eventsFailed}</span>
                    </div>
                    {diagnostics.secretKeyConfigured && (
                        <button type="button" onClick={() => run('webhook-test', adminRokiWebhookTest, 'Ping enviado: revisa que aparezca como webhook.test en "Último webhook"')} disabled={busy !== null} className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                            <Wifi className="w-4 h-4" aria-hidden /> Enviar webhook de prueba
                        </button>
                    )}
                </section>
            )}

            {/* Incidencias */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden /> Incidencias por revisar <span className="tnum text-sm font-semibold text-gray-500">({incidents.length})</span></h2>
                {incidents.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No hay cobros pendientes de revisión.</p>
                ) : (
                    <ul className="mt-4 space-y-3">
                        {incidents.map(inc => {
                            const details = (inc.reviewDetails || {}) as Record<string, any>;
                            const canConfirm = inc.status === 'paid' && (inc.reviewReason === 'late_payment' ? details.ticketsAvailable !== false : inc.reviewReason === 'ticket_conflict' || inc.reviewReason === 'order_missing' ? false : true);
                            return (
                                <li key={inc.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900">{REVIEW_LABEL[inc.reviewReason || ''] || inc.reviewReason}</p>
                                            <p className="text-sm text-gray-700 mt-1">
                                                Folio <strong className="tnum">{inc.order.folio}</strong> · {inc.order.raffleTitle} · {inc.order.customerName || 'Sin nombre'} {inc.order.customerPhone && <span className="tnum">({inc.order.customerPhone})</span>}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                Pedido: <strong>{ORDER_LABEL[inc.order.status] || inc.order.status}</strong> · Cobro ROKI #{inc.providerPaymentId ?? '—'} {badge(inc.status)} · Esperado <span className="tnum">{formatMoney(inc.amountExpected)}</span>{inc.amountConfirmed !== null && <> · Cobrado <span className="tnum">{formatMoney(inc.amountConfirmed)}</span></>}
                                            </p>
                                            {inc.reviewReason === 'late_payment' && (
                                                <p className="text-xs text-gray-600 mt-1">{details.ticketsAvailable === false ? 'Los boletos ya pertenecen a otro pedido: hay que devolver el dinero manualmente desde el portal de ROKI.' : 'Los boletos siguen libres: puedes confirmar y reactivar el pedido.'}</p>
                                            )}
                                            {inc.transactionId && <p className="text-xs text-gray-500 mt-1 break-all">tx {inc.transactionId}</p>}
                                        </div>
                                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                                            {canConfirm && (
                                                <button type="button" disabled={busy !== null} onClick={() => run(`confirm-${inc.id}`, () => adminResolveRokiIncident(inc.id, 'confirm'), 'Pedido confirmado y boletos asignados')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                                                    <CheckCircle className="w-4 h-4" aria-hidden /> Confirmar pedido
                                                </button>
                                            )}
                                            <button type="button" disabled={busy !== null} onClick={() => { const note = window.prompt('Motivo (opcional). Ej: reembolsado desde el portal de ROKI'); if (note === null) return; run(`dismiss-${inc.id}`, () => adminResolveRokiIncident(inc.id, 'dismiss', note), 'Incidencia cerrada'); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-white disabled:opacity-50">
                                                <XCircle className="w-4 h-4" aria-hidden /> Cerrar incidencia
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Historial */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h2 className="font-bold text-gray-900">Intentos de pago <span className="tnum text-sm font-semibold text-gray-500">({payments.length})</span></h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                            <input value={folioFilter} onChange={e => setFolioFilter(e.target.value)} placeholder="Buscar folio" className="pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm w-full sm:w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Todos los estados</option>
                            {Object.entries(STATUS_LABEL).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                        </select>
                    </div>
                </div>

                {payments.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Todavía no hay intentos de pago con tarjeta.</p>
                ) : (
                    <>
                        {/* Móvil: tarjetas */}
                        <ul className="mt-4 space-y-3 md:hidden">
                            {payments.map(p => (
                                <li key={p.id} className="rounded-xl border border-gray-200 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="tnum font-bold text-gray-900">{p.order.folio}</span>
                                        {badge(p.status)}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{p.order.customerName || 'Sin nombre'} · {p.order.raffleTitle}</p>
                                    <p className="text-sm text-gray-700"><span className="tnum">{formatMoney(p.amountExpected)}</span> · Pedido {ORDER_LABEL[p.order.status] || p.order.status}{p.confirmedAt && ' · confirmado'}</p>
                                    <p className="text-xs text-gray-500 mt-1">#{p.providerPaymentId ?? '—'} · {p.environment} · {formatDateTime(p.createdAt)}</p>
                                    {p.status === 'pending' && (
                                        <button type="button" disabled={busy !== null} onClick={() => run(`sync-${p.id}`, () => adminSyncRokiPayment(p.id), 'Estado sincronizado con ROKI')} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">Sincronizar con ROKI</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {/* Escritorio: tabla */}
                        <div className="mt-4 hidden md:block overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                                        <th className="py-2 pr-3">Fecha</th>
                                        <th className="py-2 pr-3">Folio</th>
                                        <th className="py-2 pr-3">Cliente</th>
                                        <th className="py-2 pr-3">Rifa</th>
                                        <th className="py-2 pr-3 text-right">Importe</th>
                                        <th className="py-2 pr-3">Cobro</th>
                                        <th className="py-2 pr-3">Pedido</th>
                                        <th className="py-2 pr-3">Ref. ROKI</th>
                                        <th className="py-2 pr-3">Confirmado</th>
                                        <th className="py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.map(p => (
                                        <tr key={p.id} className="align-top">
                                            <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{formatDateTime(p.createdAt)}</td>
                                            <td className="py-2 pr-3 tnum font-semibold text-gray-900">{p.order.folio}</td>
                                            <td className="py-2 pr-3 text-gray-700">{p.order.customerName || 'Sin nombre'}<br /><span className="tnum text-xs text-gray-500">{p.order.customerPhone}</span></td>
                                            <td className="py-2 pr-3 text-gray-700 max-w-[14rem] truncate" title={p.order.raffleTitle}>{p.order.raffleTitle}</td>
                                            <td className="py-2 pr-3 tnum text-right text-gray-900">{formatMoney(p.amountExpected)}{p.amountConfirmed !== null && p.amountConfirmed !== p.amountExpected && <><br /><span className="text-xs text-red-700">cobrado {formatMoney(p.amountConfirmed)}</span></>}</td>
                                            <td className="py-2 pr-3">{badge(p.status)}{p.reviewReason && !p.reviewResolvedAt && <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Revisar</span>}</td>
                                            <td className="py-2 pr-3 text-gray-700">{ORDER_LABEL[p.order.status] || p.order.status}</td>
                                            <td className="py-2 pr-3 tnum text-gray-700">#{p.providerPaymentId ?? '—'}<br /><span className="text-xs text-gray-500">{p.environment}</span></td>
                                            <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{p.confirmedAt ? formatDateTime(p.confirmedAt) : '—'}</td>
                                            <td className="py-2 text-right">
                                                {(p.status === 'pending' || (p.status === 'paid' && !p.confirmedAt)) && (
                                                    <button type="button" disabled={busy !== null} onClick={() => run(`sync-${p.id}`, () => adminSyncRokiPayment(p.id), 'Estado sincronizado con ROKI')} className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">Sincronizar</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default AdminPaymentsPage;
