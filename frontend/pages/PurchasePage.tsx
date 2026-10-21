import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Check, CheckCircle2, Clock, Copy, CreditCard, Landmark, MessageCircle, Phone } from 'lucide-react';
import { getRaffleBySlug, createOrder, fetchPublicSettings, getOccupiedTickets } from '../services/api';
import { Raffle, Order, PaymentAccount, Pack } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import PayPalCheckout from '../components/PayPalCheckout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Field, { inputClass } from '../components/ui/Field';
import metaPixelService from '../services/metaPixel';
import { useToast } from '../hooks/useToast';
import { formatDateTime, formatMoney, formatTicket, pluralize } from '../utils/format';
import { packLabel, packTicketCount } from '../utils/checkout';

type FormData = {
    name: string;
    phone: string;
    department: string;
};

// Lista de departamentos de Honduras
const HONDURAN_DEPARTMENTS = [
    'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso', 'Francisco Morazán',
    'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho',
    'Santa Bárbara', 'Valle', 'Yoro',
];

/** Mensaje de WhatsApp con los datos del apartado (máximo 10 boletos listados). */
const formatWhatsAppMessage = (customerName: string, customerPhone: string, folio: string, raffleTitle: string, tickets: number[], total: number): string => {
    const ticketsText = tickets.length === 0
        ? 'N/A'
        : tickets.length <= 10
            ? tickets.join(', ')
            : `${tickets.slice(0, 10).join(', ')} y ${tickets.length - 10} más`;

    return `Hola! 👋

Acabo de realizar mi pago y quiero enviarte mi comprobante para confirmar mi apartado.

📋 *Mis datos:*
• Nombre: ${customerName}
• Teléfono: ${customerPhone}
• Folio: *${folio}*

🎫 *Información del apartado:*
• Rifa: ${raffleTitle}
• Boletos: ${ticketsText}
• Total pagado: L. ${total.toFixed(2)}

Adjunto el comprobante de pago. Gracias! 🙏`;
};

/** Los emojis se codifican como UTF-8 (%F0%9F…); normalizar a NFC evita variantes descompuestas. */
const encodeWhatsAppMessage = (message: string): string => encodeURIComponent(message.normalize('NFC'));

/** Selecciona N elementos aleatorios sin repetir (Fisher-Yates parcial). */
const selectRandomElements = <T,>(array: T[], count: number): T[] => {
    if (count >= array.length) return [...array];
    const shuffled = [...array];
    const selected: T[] = [];
    for (let i = 0; i < count && i < shuffled.length; i++) {
        const randomIndex = i + Math.floor(Math.random() * (shuffled.length - i));
        [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
        selected.push(shuffled[i]);
    }
    return selected;
};

const expirationLabel = (minutes?: number): string | null => {
    if (!minutes || minutes <= 0) return null;
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.round(minutes / 60);
    if (hours < 72) return `${hours} horas`;
    return `${Math.round(hours / 24)} días`;
};

const PurchasePage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
    const [reloadKey, setReloadKey] = useState(0);
    // Cuentas de pago y WhatsApp siempre del servidor; si fallan se ofrece reintentar
    const [settingsStatus, setSettingsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [occupiedStatus, setOccupiedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [occupiedReloadKey, setOccupiedReloadKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // El estado tarda un render en aplicarse; el ref bloquea un segundo toque inmediato
    const submittingRef = useRef(false);
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
    const [contactWhatsapp, setContactWhatsapp] = useState('');
    const [orderExpirationMinutes, setOrderExpirationMinutes] = useState<number | undefined>(undefined);
    const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
    // PayPal deshabilitado por defecto; activar con VITE_PAYPAL_ENABLED=true en el entorno
    const paypalEnabled = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PAYPAL_ENABLED === 'true';
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'transfer'>(paypalEnabled ? 'paypal' : 'transfer');
    const [assignedPackTickets, setAssignedPackTickets] = useState<number[]>([]);
    const [occupiedTickets, setOccupiedTickets] = useState<number[]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const initialTickets = searchParams.get('tickets')?.split(',').map(Number).filter(n => !isNaN(n)) || [];
    const selectedPackName = searchParams.get('pack');
    const packQuantity = parseInt(searchParams.get('quantity') || '1', 10);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    useEffect(() => {
        if (!slug) return;
        let active = true;
        setLoadStatus('loading');
        getRaffleBySlug(slug)
            .then(raffleData => {
                if (!active) return;
                setRaffle(raffleData || null);
                setLoadStatus(raffleData ? 'ready' : 'notfound');
            })
            .catch(err => {
                console.error('❌ Error loading raffle for purchase:', err);
                if (active) setLoadStatus('error');
            });
        return () => { active = false; };
    }, [slug, reloadKey]);

    const loadPaymentSettings = useCallback(() => {
        setSettingsStatus('loading');
        // fresh: las cuentas bancarias se muestran para pagar; no usar una copia en caché
        fetchPublicSettings({ fresh: true })
            .then(settingsData => {
                setPaymentAccounts(settingsData.paymentAccounts || []);
                // Sin número configurado no se muestra el botón (nunca un número inventado)
                setContactWhatsapp(settingsData.contactInfo?.whatsapp || '');
                setOrderExpirationMinutes(settingsData.orderExpirationMinutes);
                setSettingsStatus('ready');
            })
            .catch(err => {
                console.error('❌ Error loading payment settings:', err);
                setSettingsStatus('error');
            });
    }, []);

    useEffect(() => { loadPaymentSettings(); }, [loadPaymentSettings]);

    // Los ocupados solo hacen falta para asignar números a un paquete
    const raffleId = raffle?.id;
    useEffect(() => {
        if (!raffleId || !selectedPackName) return;
        const controller = new AbortController();
        setOccupiedStatus('loading');
        getOccupiedTickets(raffleId, { signal: controller.signal })
            .then(occupiedResponse => {
                if (controller.signal.aborted) return;
                setOccupiedTickets(occupiedResponse.tickets || []);
                setOccupiedStatus('ready');
            })
            .catch(() => { if (!controller.signal.aborted) setOccupiedStatus('error'); });
        return () => controller.abort();
    }, [raffleId, selectedPackName, occupiedReloadKey]);

    // Empezar arriba al entrar y al pasar a la pantalla de pago
    useEffect(() => { window.scrollTo({ top: 0 }); }, [loadStatus, createdOrder]);

    // Determinar si se está usando un paquete o boletos individuales
    const selectedPack = useMemo<Pack | null>(() => {
        if (!raffle || !selectedPackName || !raffle.packs) return null;
        return raffle.packs.find(p => (p.name || '').toLowerCase() === selectedPackName.toLowerCase()) || null;
    }, [raffle, selectedPackName]);

    // Asignar boletos aleatorios disponibles cuando hay un paquete (solo con la lista real de ocupados)
    useEffect(() => {
        if (selectedPack && raffle && occupiedStatus === 'ready') {
            const ticketsInPack = packTicketCount(selectedPack) * packQuantity;
            const totalTickets = raffle.tickets || 1000;
            const occupiedSet = new Set(occupiedTickets);
            const availableTickets = Array.from({ length: totalTickets }, (_, i) => i + 1).filter(ticket => !occupiedSet.has(ticket));
            const assigned = selectRandomElements(availableTickets, ticketsInPack).sort((a, b) => a - b);
            setAssignedPackTickets(assigned);
        } else {
            setAssignedPackTickets([]);
        }
    }, [selectedPack, packQuantity, raffle, occupiedTickets, occupiedStatus]);

    // Usar el precio base del esquema Prisma (no packs)
    const pricePerTicket = raffle?.price || raffle?.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;

    // Si la selección manual coincide con un paquete, aplicar su precio
    const matchedPack = useMemo(() => {
        if (selectedPack || initialTickets.length === 0 || !raffle?.packs) return null;
        return raffle.packs.find(pack => packTicketCount(pack) === initialTickets.length) || null;
    }, [selectedPack, initialTickets.length, raffle?.packs]);

    const total = useMemo(() => {
        if (selectedPack) return selectedPack.price * packQuantity;
        if (matchedPack) return matchedPack.price;
        return initialTickets.length * pricePerTicket;
    }, [selectedPack, packQuantity, initialTickets.length, pricePerTicket, matchedPack]);

    const boletosAdicionales = useMemo(() => {
        if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
        const base = selectedPack ? packTicketCount(selectedPack) * packQuantity : initialTickets.length;
        return base * (raffle.numeroOportunidades - 1);
    }, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, initialTickets.length, selectedPack, packQuantity]);

    const baseTicketsCount = useMemo(
        () => (selectedPack ? packTicketCount(selectedPack) * packQuantity : initialTickets.length),
        [selectedPack, packQuantity, initialTickets.length]
    );

    const savingsFromPack = matchedPack && !selectedPack ? initialTickets.length * pricePerTicket - matchedPack.price : 0;

    const copyText = async (text: string, key: string, successTitle: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            toast.success(successTitle);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch {
            toast.error('No se pudo copiar', 'Selecciona el texto y cópialo manualmente.');
        }
    };

    const onSubmit = async (data: FormData) => {
        if (submittingRef.current || !raffle || (initialTickets.length === 0 && !selectedPack)) return;
        if (selectedPack && assignedPackTickets.length < packTicketCount(selectedPack) * packQuantity) {
            toast.error('No hay suficientes boletos disponibles', 'Elige un paquete más pequeño o boletos individuales.');
            return;
        }
        submittingRef.current = true;
        setIsSubmitting(true);
        try {
            let ticketsToOrder: number[] = [];
            let orderNotes = '';
            if (selectedPack) {
                ticketsToOrder = assignedPackTickets;
                orderNotes = `Compra de ${packQuantity} paquete(s) "${selectedPack.name || 'Pack'}" (${assignedPackTickets.length} boletos) para ${raffle.title}`;
            } else {
                ticketsToOrder = initialTickets;
                orderNotes = `Compra de ${initialTickets.length} boleto(s) para ${raffle.title}`;
            }

            metaPixelService.trackInitiateCheckout(raffle.id, ticketsToOrder, total);

            const userData = { name: data.name, phone: data.phone, email: '', district: data.department };
            // Usuario temporal; el backend crea o reutiliza el cliente a partir de userData
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const orderData = {
                userId,
                raffleId: raffle.id,
                tickets: ticketsToOrder,
                total,
                paymentMethod: selectedPaymentMethod,
                notes: orderNotes,
                userData,
            };
            const newOrder = await createOrder(orderData);

            metaPixelService.trackPurchase(newOrder.id, raffle.id, ticketsToOrder, total);
            setCustomerData({ name: data.name, phone: data.phone });
            setCreatedOrder(newOrder);
        } catch (err) {
            console.error('❌ Error creating order:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            toast.error('No se pudo crear tu apartado', errorMessage);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    // Alto de pantalla completa: con menos, el pie asoma durante la carga y luego salta (CLS)
    if (loadStatus === 'loading') return <div className="w-full min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
    if (loadStatus === 'error') {
        return (
            <PageAnimator>
                <div className="container mx-auto px-4 max-w-lg py-20 text-center" role="alert">
                    <h1 className="text-title font-extrabold text-white">No pudimos cargar el sorteo</h1>
                    <p className="mt-2 text-slate-400">Revisa tu conexión e inténtalo de nuevo. Tu selección se conserva.</p>
                    <Button variant="secondary" className="mt-6" onClick={() => setReloadKey(k => k + 1)}>Reintentar</Button>
                </div>
            </PageAnimator>
        );
    }
    if (!raffle) {
        return (
            <PageAnimator>
                <div className="container mx-auto px-4 max-w-lg py-20 text-center">
                    <h1 className="text-title font-extrabold text-white">Sorteo no encontrado</h1>
                    <Button to="/" variant="secondary" className="mt-6">Ver sorteos activos</Button>
                </div>
            </PageAnimator>
        );
    }

    const raffleImage = raffle.imageUrl || raffle.heroImage;
    const sortedTickets = [...initialTickets].sort((a, b) => a - b);

    // ─────────────────────────── Pantalla de pago (orden creada) ───────────────────────────
    if (createdOrder) {
        const orderPaymentMethod = (createdOrder as any).paymentMethod || selectedPaymentMethod;
        const isPaypalPayment = orderPaymentMethod === 'paypal';
        const isPaid = createdOrder.status === 'PAID';
        const orderTickets = createdOrder.tickets || [];
        const orderTicketsCount = orderTickets.length || baseTicketsCount;
        const orderTotal = createdOrder.total || total;
        // La orden ya incluye comprados + regalo: regalo = total * (n-1)/n
        const orderGiftTickets = (raffle.boletosConOportunidades && raffle.numeroOportunidades > 1)
            ? Math.floor(orderTicketsCount * (raffle.numeroOportunidades - 1) / raffle.numeroOportunidades)
            : 0;
        const orderPurchasedTickets = orderTicketsCount - orderGiftTickets;
        const folio = createdOrder.folio || '';
        const expiresAt = (createdOrder as any).expiresAt ? formatDateTime((createdOrder as any).expiresAt) : '';
        const expiration = expirationLabel(orderExpirationMinutes);

        const customerName = customerData?.name || (createdOrder as any)?.customer?.name || 'Cliente';
        const customerPhone = customerData?.phone || (createdOrder as any)?.customer?.phone || '';
        const whatsappUrl = contactWhatsapp
            ? `https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=${encodeWhatsAppMessage(formatWhatsAppMessage(customerName, customerPhone, folio, raffle.title, orderTickets, orderTotal))}`
            : '';

        return (
            <PageAnimator>
                <div className="container mx-auto px-4 sm:px-6 max-w-2xl pt-6 md:pt-10">
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${isPaid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-action/15 text-white'}`}>
                            {isPaid ? <CheckCircle2 className="w-7 h-7" aria-hidden /> : <Clock className="w-7 h-7" aria-hidden />}
                        </div>
                        <h1 className="text-title font-extrabold text-white">{isPaid ? 'Pago completado' : 'Boletos apartados'}</h1>
                        <p className="mt-2 text-slate-400">
                            {isPaid ? 'Tu compra quedó confirmada.' : isPaypalPayment ? 'Completa el pago con tarjeta para confirmar tus boletos.' : 'Completa el pago para confirmar tus boletos.'}
                        </p>
                    </div>

                    <Card className="mb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-400">Folio del apartado</p>
                                <p className="tnum mt-0.5 text-2xl font-extrabold text-white tracking-tight break-all">{folio}</p>
                            </div>
                            <Badge tone={isPaid ? 'success' : 'warning'} className="flex-shrink-0 mt-1">{isPaid ? 'Pagado' : 'Pendiente de pago'}</Badge>
                        </div>
                        {!isPaid && folio && (
                            <button
                                type="button"
                                onClick={() => copyText(folio, 'folio', 'Folio copiado')}
                                className="mt-2 inline-flex items-center gap-1.5 h-9 text-sm font-semibold text-accent hover:underline"
                            >
                                {copiedKey === 'folio' ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
                                {copiedKey === 'folio' ? 'Copiado' : 'Copiar folio'}
                            </button>
                        )}

                        <dl className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 gap-4">
                            <div>
                                <dt className="text-xs font-semibold text-slate-400">Boletos</dt>
                                <dd className="tnum text-lg font-extrabold text-white">
                                    {orderPurchasedTickets}
                                    {orderGiftTickets > 0 && <span className="text-accent text-sm font-semibold"> +{orderGiftTickets} regalo</span>}
                                </dd>
                            </div>
                            <div className="text-right">
                                <dt className="text-xs font-semibold text-slate-400">Total</dt>
                                <dd className="tnum text-lg font-extrabold text-accent">{formatMoney(orderTotal)}</dd>
                            </div>
                        </dl>
                        {orderTickets.length > 0 && (
                            <ul className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar" aria-label="Números de boleto">
                                {[...orderTickets].sort((a, b) => a - b).map(ticket => (
                                    <li key={ticket} className="tnum inline-flex items-center h-8 px-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-semibold text-white">{formatTicket(ticket, raffle.tickets)}</li>
                                ))}
                            </ul>
                        )}
                        {!isPaid && (expiresAt || expiration) && (
                            <p className="mt-4 flex items-start gap-2 text-sm text-amber-300">
                                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                                {expiresAt ? `Paga antes del ${expiresAt}. Si no se recibe el pago, los boletos se liberan.` : `Tienes ${expiration} para pagar. Si no se recibe el pago, los boletos se liberan.`}
                            </p>
                        )}
                    </Card>

                    {isPaid ? (
                        <Card className="text-center">
                            <p className="text-slate-300">Guarda tu comprobante; incluye un código QR para verificar tus boletos.</p>
                            <Button onClick={() => navigate(`/comprobante/${folio}`)} size="lg" fullWidth className="mt-5">Ver comprobante</Button>
                        </Card>
                    ) : isPaypalPayment ? (
                        <Card>
                            <div className="flex items-center gap-3 mb-5">
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-action/15 text-white"><CreditCard className="w-5 h-5" aria-hidden /></span>
                                <div>
                                    <h2 className="font-extrabold text-white">Pago con tarjeta</h2>
                                    <p className="text-sm text-slate-400">Procesado de forma segura por PayPal</p>
                                </div>
                            </div>
                            <PayPalCheckout
                                orderId={createdOrder.id}
                                amount={orderTotal}
                                onSuccess={async () => {
                                    setCreatedOrder({ ...createdOrder, status: 'PAID' });
                                    navigate(`/comprobante/${folio}`);
                                }}
                                onError={(error) => {
                                    console.error('Error en PayPal:', error);
                                    toast.error('No se pudo procesar el pago', String(error));
                                }}
                            />
                        </Card>
                    ) : (
                        <Card>
                            <h2 className="font-extrabold text-white">Cómo completar tu pago</h2>
                            <ol className="mt-4 space-y-5">
                                <li className="flex gap-3">
                                    <span className="tnum flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-action text-white text-sm font-extrabold" aria-hidden>1</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white">Transfiere <span className="tnum text-accent">{formatMoney(orderTotal)}</span> a una de estas cuentas</p>
                                        <p className="text-sm text-slate-400">Usa el folio <span className="tnum font-semibold text-slate-200">{folio}</span> como referencia.</p>
                                        {paymentAccounts.length > 0 ? (
                                            <ul className="mt-3 space-y-2">
                                                {paymentAccounts.map(acc => (
                                                    <li key={acc.id} className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5">
                                                        <div className="flex items-center gap-2 text-sm font-extrabold text-white"><Landmark className="w-4 h-4 text-slate-400" aria-hidden />{acc.bank}</div>
                                                        <p className="mt-1 text-sm text-slate-400">{acc.accountHolder}</p>
                                                        {acc.accountNumber && (
                                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                                <span className="tnum text-base font-extrabold text-white break-all select-all">{acc.accountNumber}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyText(acc.accountNumber, acc.id, 'Número de cuenta copiado')}
                                                                    className="flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-semibold text-white hover:bg-white/10"
                                                                >
                                                                    {copiedKey === acc.id ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                                                                    {copiedKey === acc.id ? 'Copiado' : 'Copiar'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : settingsStatus === 'error' ? (
                                            <div role="alert" className="mt-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                                                <p className="text-sm text-slate-300">No pudimos cargar las cuentas de pago. Tu apartado ya está registrado con el folio {folio}.</p>
                                                <Button variant="secondary" size="sm" className="mt-3" onClick={loadPaymentSettings}>Reintentar</Button>
                                            </div>
                                        ) : settingsStatus === 'loading' ? (
                                            <p role="status" className="mt-3 text-sm text-slate-400 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">Cargando cuentas de pago…</p>
                                        ) : (
                                            <p className="mt-3 text-sm text-slate-400 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">No hay cuentas configuradas para transferencia. Escríbenos por WhatsApp.</p>
                                        )}
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="tnum flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-action text-white text-sm font-extrabold" aria-hidden>2</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white">Envía el comprobante por WhatsApp</p>
                                        <p className="text-sm text-slate-400">El mensaje ya incluye tu folio y tus boletos; solo adjunta la captura.</p>
                                        {whatsappUrl && (
                                            <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg" fullWidth className="mt-3" icon={<MessageCircle className="w-5 h-5" aria-hidden />}>
                                                Enviar comprobante
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            </ol>
                        </Card>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-400">
                        Puedes consultar tus boletos en cualquier momento en el <Link to="/verificador" className="text-accent font-semibold hover:underline">verificador</Link> con tu folio.
                    </p>
                </div>
            </PageAnimator>
        );
    }

    // ─────────────────────────── Formulario de confirmación ───────────────────────────
    const summary = (
        <Card>
            <div className="flex gap-3">
                {/* Es la foto completa (~0.7 MB, sin miniatura en el backend): decodificación asíncrona
                    para no retener el pintado de la página mientras se decodifica */}
                {raffleImage && <img src={raffleImage} alt="" decoding="async" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-background-primary" />}
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">Sorteo</p>
                    <p className="font-extrabold text-white line-clamp-2">{raffle.title}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.08]">
                {selectedPack ? (
                    <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">{packLabel(selectedPack)}{packQuantity > 1 ? ` × ${packQuantity}` : ''}</span>
                        {' · '}{pluralize(baseTicketsCount, 'boleto')} con números al azar
                    </p>
                ) : (
                    <>
                        <p className="text-sm font-semibold text-white mb-2">{pluralize(baseTicketsCount, 'boleto')}</p>
                        <ul className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar" aria-label="Boletos elegidos">
                            {sortedTickets.map(ticket => (
                                <li key={ticket} className="tnum inline-flex items-center h-8 px-2.5 rounded-lg bg-action/15 border border-action/40 text-xs font-semibold text-white">{formatTicket(ticket, raffle.tickets)}</li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <dl className="mt-4 pt-4 border-t border-white/[0.08] space-y-2 text-sm">
                {selectedPack ? (
                    <div className="flex justify-between"><dt className="text-slate-400">{packQuantity > 1 ? `Paquete × ${packQuantity}` : 'Paquete'}</dt><dd className="tnum font-semibold text-white">{formatMoney(total)}</dd></div>
                ) : matchedPack ? (
                    <>
                        <div className="flex justify-between"><dt className="text-slate-400">{baseTicketsCount} × {formatMoney(pricePerTicket)}</dt><dd className="tnum font-semibold text-white">{formatMoney(baseTicketsCount * pricePerTicket)}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-400">Descuento · {packLabel(matchedPack)}</dt><dd className="tnum font-semibold text-accent">−{formatMoney(savingsFromPack)}</dd></div>
                    </>
                ) : (
                    <div className="flex justify-between"><dt className="text-slate-400">{baseTicketsCount} × {formatMoney(pricePerTicket)}</dt><dd className="tnum font-semibold text-white">{formatMoney(total)}</dd></div>
                )}
                {boletosAdicionales > 0 && (
                    <div className="flex justify-between"><dt className="text-slate-400">Boletos de regalo</dt><dd className="tnum font-semibold text-accent">+{boletosAdicionales}</dd></div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-white/[0.08]">
                    <dt className="text-base font-extrabold text-white">Total a pagar</dt>
                    <dd className="tnum text-2xl font-extrabold text-accent">{formatMoney(total)}</dd>
                </div>
            </dl>
        </Card>
    );

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl pt-4 md:pt-8">
                <Link to={`/sorteo/${raffle.slug}`} className="inline-flex items-center gap-1.5 h-10 text-sm font-semibold text-slate-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4" aria-hidden /> Volver al sorteo
                </Link>
                <h1 className="mt-2 text-title font-extrabold text-white">Confirma tu compra</h1>
                <p className="mt-1 text-slate-400">Tus datos, el método de pago y listo.</p>

                <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-10 lg:items-start">
                    <div className="lg:col-span-5 lg:order-2 lg:sticky lg:top-20">{summary}</div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="lg:col-span-7 lg:order-1 space-y-5">
                        <Card>
                            <h2 className="font-extrabold text-white mb-4">Tus datos</h2>
                            <div className="space-y-4">
                                <Field id="name" label="Nombre completo" error={errors.name?.message}>
                                    <input
                                        {...register('name', { required: 'Escribe tu nombre completo' })}
                                        className={inputClass}
                                        placeholder="Como aparece en tu identidad"
                                        autoComplete="name"
                                    />
                                </Field>
                                <Field id="phone" label="Teléfono" hint="8 dígitos, sin el prefijo +504." error={errors.phone?.message} addon={<><Phone className="w-4 h-4" />+504</>}>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        autoComplete="tel-national"
                                        {...register('phone', {
                                            required: 'Escribe tu teléfono',
                                            pattern: { value: /^\d{8}$/, message: 'Ingresa un teléfono válido de 8 dígitos' },
                                        })}
                                        className={`${inputClass} pl-[5.75rem]`}
                                        placeholder="99999999"
                                    />
                                </Field>
                                <Field id="department" label="Departamento" error={errors.department?.message}>
                                    <select {...register('department', { required: 'Selecciona tu departamento' })} className={inputClass} defaultValue="">
                                        <option value="" disabled>Selecciona tu departamento</option>
                                        {HONDURAN_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="font-extrabold text-white mb-4">Método de pago</h2>
                            <div className={`grid gap-3 ${paypalEnabled ? 'sm:grid-cols-2' : ''}`} role="radiogroup" aria-label="Método de pago">
                                <label className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${selectedPaymentMethod === 'transfer' ? 'border-action bg-action/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                                    <input type="radio" name="paymentMethod" value="transfer" className="sr-only" checked={selectedPaymentMethod === 'transfer'} onChange={() => setSelectedPaymentMethod('transfer')} />
                                    <div className="flex items-start gap-3">
                                        <Landmark className="w-5 h-5 mt-0.5 text-slate-300 flex-shrink-0" aria-hidden />
                                        <div>
                                            <p className="font-semibold text-white">Transferencia bancaria</p>
                                            <p className="text-sm text-slate-400">Te mostramos las cuentas al confirmar. Envías el comprobante por WhatsApp.</p>
                                        </div>
                                    </div>
                                </label>
                                {paypalEnabled && (
                                    <label className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${selectedPaymentMethod === 'paypal' ? 'border-action bg-action/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                                        <input type="radio" name="paymentMethod" value="paypal" className="sr-only" checked={selectedPaymentMethod === 'paypal'} onChange={() => setSelectedPaymentMethod('paypal')} />
                                        <div className="flex items-start gap-3">
                                            <CreditCard className="w-5 h-5 mt-0.5 text-slate-300 flex-shrink-0" aria-hidden />
                                            <div>
                                                <p className="font-semibold text-white">Tarjeta (PayPal)</p>
                                                <p className="text-sm text-slate-400">Pago inmediato con tarjeta o cuenta PayPal.</p>
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </Card>

                        {selectedPack && occupiedStatus === 'error' && (
                            <div role="alert" className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-sm text-slate-300">
                                No pudimos comprobar qué boletos siguen disponibles para tu paquete.
                                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setOccupiedReloadKey(k => k + 1)}>Reintentar</Button>
                            </div>
                        )}
                        <Button
                            type="submit"
                            size="lg"
                            fullWidth
                            loading={isSubmitting || (!!selectedPack && occupiedStatus === 'loading')}
                            disabled={(initialTickets.length === 0 && !selectedPack) || (!!selectedPack && occupiedStatus !== 'ready')}
                        >
                            {isSubmitting ? 'Apartando boletos…' : `Apartar boletos · ${formatMoney(total)}`}
                        </Button>
                        <p className="text-center text-xs text-slate-400">Al continuar aceptas los <Link to="/terminos" className="text-slate-300 underline underline-offset-2">términos y condiciones</Link>.</p>
                    </form>
                </div>
            </div>
        </PageAnimator>
    );
};

export default PurchasePage;
