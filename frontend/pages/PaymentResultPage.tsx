import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/BrandIcons';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { fetchPublicSettings } from '../services/api';
import { getRokiStatus, goToRokiCheckout, startRokiCheckout, RokiApiError, type RokiStatus } from '../services/rokiApi';
import { formatDateTime, formatMoney, pluralize } from '../utils/format';

/**
 * Pantalla de retorno del checkout alojado (success_url / cancel_url de ROKI).
 * El estado real lo decide el backend (webhook + verificación); aquí solo se
 * consulta con un sondeo acotado y se ofrecen las salidas correctas.
 */

// Sondeo acotado: 5×2 s, 6×5 s, 9×10 s ≈ 2 min 10 s. Después se detiene y se ofrece "Actualizar".
const POLL_SCHEDULE_MS = [...Array(5).fill(2000), ...Array(6).fill(5000), ...Array(9).fill(10000)];

type Phase = 'loading' | 'ready' | 'error';

const PaymentResultPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    // ROKI podría añadir parámetros fuera del hash; se aceptan ambos lugares
    const extra = useMemo(() => new URLSearchParams(window.location.search), []);
    const folio = (searchParams.get('folio') || extra.get('folio') || '').trim().toUpperCase();
    const result = (searchParams.get('result') || extra.get('result') || '').toLowerCase();
    const cameFromSuccess = result === 'success';

    const [phase, setPhase] = useState<Phase>('loading');
    const [status, setStatus] = useState<RokiStatus | null>(null);
    const [pollsDone, setPollsDone] = useState(0);
    const [pollingExhausted, setPollingExhausted] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [whatsapp, setWhatsapp] = useState('');
    const timerRef = useRef<number | null>(null);
    const activeRef = useRef(true);

    const load = useCallback(async (): Promise<RokiStatus | null> => {
        if (!orderId || !folio) return null;
        const data = await getRokiStatus(orderId, folio);
        if (!activeRef.current) return null;
        setStatus(data);
        setPhase('ready');
        return data;
    }, [orderId, folio]);

    useEffect(() => {
        activeRef.current = true;
        fetchPublicSettings().then(s => { if (activeRef.current) setWhatsapp(s.contactInfo?.whatsapp || ''); }).catch(() => undefined);
        return () => { activeRef.current = false; };
    }, []);

    // Carga inicial
    useEffect(() => {
        if (!orderId || !folio) { setPhase('error'); return; }
        load().catch(err => {
            console.error('❌ Estado de pago:', err);
            if (activeRef.current) setPhase('error');
        });
    }, [orderId, folio, load]);

    // Mientras el backend aún no confirma, se consulta con intervalos crecientes (y se pausa si la pestaña está oculta)
    const shouldPoll = Boolean(status && (status.state === 'verifying' || (status.state === 'pending' && cameFromSuccess)) && !pollingExhausted);
    useEffect(() => {
        if (!shouldPoll) return;
        if (pollsDone >= POLL_SCHEDULE_MS.length) { setPollingExhausted(true); return; }
        const delay = POLL_SCHEDULE_MS[pollsDone];
        const tick = () => {
            if (!activeRef.current) return;
            if (document.hidden) { timerRef.current = window.setTimeout(tick, 2000); return; }
            load().catch(() => undefined).finally(() => { if (activeRef.current) setPollsDone(n => n + 1); });
        };
        timerRef.current = window.setTimeout(tick, delay);
        return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    }, [shouldPoll, pollsDone, load]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await load();
            setPollsDone(0);
            setPollingExhausted(false);
        } catch {
            toast.error('No pudimos consultar el estado', 'Revisa tu conexión e inténtalo de nuevo.');
        } finally {
            setRefreshing(false);
        }
    };

    const payWithCard = async () => {
        if (!status || !orderId || redirecting) return;
        setRedirecting(true);
        try {
            if (status.canContinue && status.payment?.checkoutUrl) {
                if (goToRokiCheckout(status.payment.checkoutUrl)) return;
            }
            const checkout = await startRokiCheckout(orderId, folio);
            if (!goToRokiCheckout(checkout.checkoutUrl)) throw new Error('El enlace de pago no es válido.');
        } catch (err) {
            const message = err instanceof RokiApiError || err instanceof Error ? err.message : 'Inténtalo de nuevo.';
            toast.error('No se pudo abrir el pago con tarjeta', message);
            setRedirecting(false);
            load().catch(() => undefined);
        }
    };

    if (phase === 'loading') return <div className="w-full min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

    if (phase === 'error' || !status) {
        return (
            <PageAnimator>
                <div className="container mx-auto px-4 max-w-lg py-20 text-center" role="alert">
                    <h1 className="font-display text-title font-bold text-ink">No encontramos este pago</h1>
                    <p className="mt-2 text-muted">Revisa el enlace o busca tu apartado con el folio que te dimos.</p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        {orderId && folio && <Button variant="secondary" onClick={refresh} loading={refreshing}>Reintentar</Button>}
                        <Button to="/verificador" variant="secondary">Buscar mi folio</Button>
                        <Button to="/">Ir al inicio</Button>
                    </div>
                </div>
            </PageAnimator>
        );
    }

    const { order, payment, state } = status;
    const raffleLink = order.raffle.slug ? `/sorteo/${order.raffle.slug}` : '/';
    const expiresAt = order.expiresAt ? formatDateTime(order.expiresAt) : '';
    const whatsappUrl = whatsapp
        ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, pagué con tarjeta el folio ${order.folio} (${order.raffle.title}) y quiero confirmar mi pago.`)}`
        : '';
    const verifying = state === 'verifying' || (state === 'pending' && cameFromSuccess && !pollingExhausted);

    const view = (() => {
        if (state === 'confirmed') return { tone: 'success' as const, icon: <CheckCircle2 className="w-7 h-7" aria-hidden />, title: '¡Pago confirmado!', text: 'Tu compra quedó registrada. Mucha suerte en el sorteo.', badge: 'Pagado' };
        if (state === 'review') return { tone: 'warning' as const, icon: <AlertTriangle className="w-7 h-7" aria-hidden />, title: 'Recibimos tu pago y lo estamos validando', text: 'Un miembro del equipo revisará el cobro y te confirmará por WhatsApp. Guarda tu folio.', badge: 'En validación' };
        if (verifying) return { tone: 'action' as const, icon: <Loader2 className="w-7 h-7 animate-spin" aria-hidden />, title: 'Estamos confirmando tu pago…', text: 'Suele tardar unos segundos. No cierres esta página.', badge: 'Verificando' };
        if (state === 'pending' && cameFromSuccess) return { tone: 'warning' as const, icon: <Clock className="w-7 h-7" aria-hidden />, title: 'Seguimos verificando tu pago', text: 'Aún no recibimos la confirmación del banco. Si ya pagaste, se confirmará automáticamente; puedes actualizar o escribirnos.', badge: 'Verificando' };
        if (state === 'pending' || state === 'none') return { tone: 'warning' as const, icon: <Clock className="w-7 h-7" aria-hidden />, title: 'No se completó el pago', text: expiresAt ? `Tus boletos siguen apartados hasta el ${expiresAt}. Puedes intentar de nuevo o pagar por transferencia.` : 'Tus boletos siguen apartados. Puedes intentar de nuevo o pagar por transferencia.', badge: 'Pendiente de pago' };
        if (state === 'expired') return { tone: 'danger' as const, icon: <XCircle className="w-7 h-7" aria-hidden />, title: 'El enlace de pago venció', text: status.canRetry ? 'Tu apartado sigue vigente: genera un nuevo enlace para pagar con tarjeta.' : 'Elige tus boletos de nuevo para seguir participando.', badge: 'Vencido' };
        if (state === 'released') return { tone: 'danger' as const, icon: <XCircle className="w-7 h-7" aria-hidden />, title: 'Este apartado ya no está vigente', text: 'El tiempo para pagar terminó y los boletos se liberaron. Puedes elegirlos de nuevo.', badge: 'Liberado' };
        return { tone: 'danger' as const, icon: <XCircle className="w-7 h-7" aria-hidden />, title: 'El pago no se pudo procesar', text: 'Tu banco no autorizó el cobro o la operación se canceló. No se te cobró nada.', badge: 'No procesado' };
    })();

    const iconTone: Record<string, string> = {
        success: 'bg-emerald-500/15 text-emerald-300',
        warning: 'bg-amber-400/15 text-amber-300',
        action: 'bg-action/20 text-action-ink',
        danger: 'bg-red-500/15 text-red-300',
    };

    const showCard = state !== 'confirmed' && state !== 'review' && (status.canContinue || status.canRetry) && !verifying;
    const showTransfer = state !== 'confirmed' && state !== 'review' && state !== 'released' && order.status === 'PENDING' && !verifying;

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 sm:px-6 max-w-2xl pt-6 md:pt-10 pb-16">
                <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${iconTone[view.tone]}`}>{view.icon}</div>
                    <h1 className="font-display text-title font-bold text-ink">{view.title}</h1>
                    <p className="mt-2 text-muted" aria-live="polite">{view.text}</p>
                </div>

                <Card className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-muted">Folio del apartado</p>
                            <p className="tnum mt-0.5 font-display text-2xl font-bold text-ink tracking-tight break-all">{order.folio}</p>
                            <p className="mt-1 text-sm text-muted truncate">{order.raffle.title}</p>
                        </div>
                        <Badge tone={view.tone === 'action' ? 'action' : view.tone} className="flex-shrink-0 mt-1">{view.badge}</Badge>
                    </div>
                    <dl className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-4">
                        <div>
                            <dt className="text-xs font-semibold text-muted">Boletos</dt>
                            <dd className="tnum text-lg font-bold text-ink">{pluralize(order.tickets.length, 'boleto')}</dd>
                        </div>
                        <div className="text-right">
                            <dt className="text-xs font-semibold text-muted">Total</dt>
                            <dd className="tnum text-lg font-bold text-ink">{formatMoney(order.total)}</dd>
                        </div>
                    </dl>
                    {payment?.providerPaymentId && (
                        <p className="mt-3 text-xs text-muted">
                            Referencia del pago: <span className="tnum font-semibold text-ink">#{payment.providerPaymentId}</span>
                            {status.environment === 'sandbox' && <span className="ml-2 inline-flex items-center h-5 px-1.5 rounded bg-amber-400/15 text-amber-300 font-bold">PRUEBAS</span>}
                        </p>
                    )}
                </Card>

                {state === 'confirmed' && (
                    <Card className="text-center">
                        <p className="text-muted">Guarda tu comprobante; incluye un código QR para verificar tus boletos.</p>
                        <Button onClick={() => navigate(`/comprobante/${order.folio}`)} size="lg" fullWidth className="mt-5">Ver comprobante</Button>
                        <Button to="/" variant="ghost" className="mt-2">Volver al inicio</Button>
                    </Card>
                )}

                {state !== 'confirmed' && (
                    <Card>
                        <div className="flex flex-col gap-3">
                            {verifying && (
                                <p className="text-sm text-muted text-center">Consultando al banco… {pollsDone > 0 && <span className="tnum">({pollsDone}/{POLL_SCHEDULE_MS.length})</span>}</p>
                            )}
                            {(state === 'verifying' || state === 'pending' || state === 'review') && !verifying && (
                                <Button variant="secondary" fullWidth onClick={refresh} loading={refreshing} icon={<RefreshCw className="w-4 h-4" aria-hidden />}>Actualizar estado</Button>
                            )}
                            {showCard && (
                                <Button fullWidth size="lg" onClick={payWithCard} loading={redirecting} icon={<CreditCard className="w-5 h-5" aria-hidden />}>
                                    {status.canContinue ? 'Continuar el pago con tarjeta' : 'Reintentar con tarjeta'}
                                </Button>
                            )}
                            {showTransfer && (
                                <Button to="/cuentas-de-pago" variant="secondary" fullWidth>Pagar por transferencia</Button>
                            )}
                            {whatsappUrl && (state === 'review' || (state === 'pending' && cameFromSuccess) || state === 'failed') && (
                                <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" fullWidth icon={<WhatsAppIcon className="w-5 h-5" tone="current" />}>Escribir por WhatsApp</Button>
                            )}
                            {(state === 'released' || (state === 'expired' && !status.canRetry)) && (
                                <Button to={raffleLink} fullWidth size="lg">Elegir boletos de nuevo</Button>
                            )}
                            {order.status === 'PENDING' && (
                                <p className="text-xs text-muted text-center">
                                    ¿Dudas? Guarda tu folio <span className="tnum font-semibold text-ink">{order.folio}</span>. Puedes consultarlo en <Link to="/verificador" className="underline">el verificador</Link>.
                                </p>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </PageAnimator>
    );
};

export default PaymentResultPage;
