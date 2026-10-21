import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Gift, Shuffle } from 'lucide-react';
import { getRaffleBySlug, getOccupiedTickets, getSettings } from '../services/api';
import { Raffle, Pack } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import StickyPurchaseBar from '../components/StickyPurchaseBar';
import PurchaseSummary from '../components/PurchaseSummary';
import TicketSelector from '../components/TicketSelector';
import RaffleGallery from '../components/RaffleGallery';
import BonusesCard from '../components/BonusesCard';
import PackSelector from '../components/PackSelector';
import LuckyMachine from '../components/LuckyMachine';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { collectRaffleImages } from '../components/HeroRaffle';
import metaPixelService from '../services/metaPixel';
import { useToast } from '../hooks/useToast';
import { formatDate, formatMoney } from '../utils/format';
import { packTicketCount } from '../utils/checkout';

const RaffleDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [occupiedTickets, setOccupiedTickets] = useState<number[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    const [packQuantity, setPackQuantity] = useState<number>(1);
    const [raffleStatus, setRaffleStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
    const [raffleReloadKey, setRaffleReloadKey] = useState(0);
    // La disponibilidad se carga aparte: la página (y su imagen LCP) se pinta en cuanto llega el sorteo
    const [occupiedStatus, setOccupiedStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [occupiedReloadKey, setOccupiedReloadKey] = useState(0);
    // Hasta conocer las preferencias no se pinta la cuadrícula (evita saltar de paginado a scroll)
    const [prefsReady, setPrefsReady] = useState(false);
    const [listingMode, setListingMode] = useState<'paginado' | 'scroll'>('paginado');
    const [hideOccupied, setHideOccupied] = useState<boolean>(false);
    // Inicia oculto para no mostrar el porcentaje antes de conocer la preferencia del admin
    const [showSoldPercentage, setShowSoldPercentage] = useState<boolean>(false);
    const [luckyOpen, setLuckyOpen] = useState(false);
    const toast = useToast();

    // Referencias estables para que handleTicketClick no cambie en cada selección:
    // así tocar un boleto no obliga a volver a crear todas las celdas de la cuadrícula.
    const toastRef = useRef(toast);
    useEffect(() => { toastRef.current = toast; }, [toast]);
    const occupiedSet = useMemo(() => new Set(occupiedTickets), [occupiedTickets]);
    const occupiedSetRef = useRef(occupiedSet);
    useEffect(() => { occupiedSetRef.current = occupiedSet; }, [occupiedSet]);
    const selectedRef = useRef<number[]>(selectedTickets);
    useEffect(() => { selectedRef.current = selectedTickets; }, [selectedTickets]);
    const raffleRef = useRef<Raffle | null>(raffle);
    useEffect(() => { raffleRef.current = raffle; }, [raffle]);

    useEffect(() => {
        // Cargar preferencias de visualización desde settings públicos
        getSettings().then(settings => {
            const prefs = (settings as any)?.displayPreferences;
            if (prefs?.listingMode) setListingMode(prefs.listingMode);
            if (prefs?.paidTicketsVisibility) setHideOccupied(prefs.paidTicketsVisibility === 'no_disponibles');
            setShowSoldPercentage(prefs?.showSoldPercentage !== false);
        }).catch(() => setShowSoldPercentage(true))
            .finally(() => setPrefsReady(true));
    }, []);

    useEffect(() => {
        if (!slug) return;
        // Al cambiar de sorteo se descarta la selección anterior y cualquier respuesta tardía
        let active = true;
        setRaffleStatus('loading');
        setRaffle(null);
        setOccupiedTickets([]);
        setOccupiedStatus('loading');
        setSelectedTickets([]);
        setSelectedPack(null);
        setPackQuantity(1);
        getRaffleBySlug(slug)
            .then(raffleData => {
                if (!active) return;
                if (!raffleData) {
                    setRaffleStatus('notfound');
                    return;
                }
                setRaffle(raffleData);
                setRaffleStatus('ready');
                metaPixelService.trackViewContent(raffleData.id, raffleData);
            })
            .catch(() => { if (active) setRaffleStatus('error'); });
        return () => { active = false; };
    }, [slug, raffleReloadKey]);

    const raffleId = raffle?.id;
    useEffect(() => {
        if (!raffleId) return;
        const controller = new AbortController();
        setOccupiedStatus('loading');
        getOccupiedTickets(raffleId, { signal: controller.signal })
            .then(occupiedData => {
                if (controller.signal.aborted) return;
                setOccupiedTickets(occupiedData.tickets || []);
                setOccupiedStatus('ready');
            })
            // Sin la lista de ocupados no se muestra la cuadrícula: todo parecería disponible
            .catch(() => { if (!controller.signal.aborted) setOccupiedStatus('error'); });
        return () => controller.abort();
    }, [raffleId, occupiedReloadKey]);

    // Set.has() es O(1): instantáneo incluso con 10,000 boletos
    const handleTicketClick = useCallback((ticketNumber: number) => {
        if (!ticketNumber || typeof ticketNumber !== 'number') return;

        if (occupiedSetRef.current.has(ticketNumber)) {
            toastRef.current.error('Boleto vendido', 'Ese número ya está ocupado. Elige otro.');
            return;
        }

        const current = selectedRef.current;
        const wasSelected = current.includes(ticketNumber);
        const newSelectedTickets = wasSelected
            ? current.filter(t => t !== ticketNumber)
            : [...current, ticketNumber];
        // Se actualiza ya para que dos toques seguidos antes del re-render no se pisen
        selectedRef.current = newSelectedTickets;
        setSelectedTickets(newSelectedTickets);

        // Track AddToCart sin bloquear la UI
        const currentRaffle = raffleRef.current;
        if (!wasSelected && currentRaffle) {
            setTimeout(() => {
                const price = currentRaffle.price || currentRaffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
                metaPixelService.trackAddToCart(currentRaffle.id, newSelectedTickets, newSelectedTickets.length * price);
            }, 0);
        }
    }, []);

    // Todos los hooks deben ejecutarse antes de cualquier return condicional
    const pricePerTicket = useMemo(() => {
        if (!raffle) return 50;
        return raffle.price || raffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
    }, [raffle?.id, raffle?.price, raffle?.packs?.length]);

    // Si la selección manual coincide con un paquete, se aplica su precio
    const matchedPack = useMemo(() => {
        if (selectedPack || selectedTickets.length === 0 || !raffle?.packs) return null;
        return raffle.packs.find(pack => packTicketCount(pack) === selectedTickets.length) || null;
    }, [selectedPack, selectedTickets.length, raffle?.packs]);

    const totalPrice = useMemo(() => {
        if (selectedPack) return selectedPack.price * packQuantity;
        if (matchedPack) return matchedPack.price;
        return selectedTickets.length * pricePerTicket;
    }, [selectedPack, packQuantity, selectedTickets.length, pricePerTicket, matchedPack]);

    const savingsFromPack = useMemo(() => {
        if (!matchedPack || selectedPack) return 0;
        return selectedTickets.length * pricePerTicket - matchedPack.price;
    }, [matchedPack, selectedTickets.length, pricePerTicket, selectedPack]);

    const handlePackSelect = useCallback((pack: Pack | null, quantity: number) => {
        setSelectedPack(pack);
        setPackQuantity(quantity);
        // Un paquete reemplaza la selección manual de boletos
        if (pack) setSelectedTickets([]);
    }, []);

    const handleLuckyMachineTickets = useCallback((tickets: number[]) => {
        setSelectedPack(null);
        setPackQuantity(1);
        setSelectedTickets(tickets);
    }, []);

    const boletosAdicionales = useMemo(() => {
        if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
        const base = selectedPack ? packTicketCount(selectedPack) * packQuantity : selectedTickets.length;
        return base * (raffle.numeroOportunidades - 1);
    }, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, selectedTickets.length, selectedPack, packQuantity]);

    const progress = useMemo(() => {
        if (!raffle || !raffle.tickets) return 0;
        const sold = typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0;
        return Math.max(0, Math.min(100, (sold / raffle.tickets) * 100));
    }, [raffle?.id, raffle?.sold, raffle?.tickets]);

    const raffleImages = useMemo(() => (raffle ? collectRaffleImages(raffle) : []), [raffle?.id, raffle?.imageUrl, raffle?.heroImage, raffle?.gallery?.length]);

    // Los ocupados incluyen boletos de regalo fuera del rango 1..tickets; solo cuentan los del rango
    const availableCount = useMemo(() => {
        if (!raffle?.tickets) return 0;
        const occupiedInRange = new Set(occupiedTickets.filter(t => t >= 1 && t <= raffle.tickets));
        return Math.max(0, raffle.tickets - occupiedInRange.size);
    }, [raffle?.tickets, occupiedTickets]);

    // Alto de pantalla completa: con menos, el pie asoma durante la carga y luego salta (CLS)
    if (raffleStatus === 'loading') return <div className="w-full min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
    if (raffleStatus === 'error') {
        return (
            <PageAnimator>
                <div className="container mx-auto px-4 max-w-lg py-20 text-center" role="alert">
                    <h1 className="text-title font-extrabold text-white">No pudimos cargar el sorteo</h1>
                    <p className="mt-2 text-slate-400">Revisa tu conexión e inténtalo de nuevo.</p>
                    <Button variant="secondary" className="mt-6" onClick={() => setRaffleReloadKey(k => k + 1)}>Reintentar</Button>
                </div>
            </PageAnimator>
        );
    }
    if (!raffle) {
        return (
            <PageAnimator>
                <div className="container mx-auto px-4 max-w-lg py-20 text-center">
                    <h1 className="text-title font-extrabold text-white">Sorteo no encontrado</h1>
                    <p className="mt-2 text-slate-400">Puede que haya finalizado o que el enlace no sea correcto.</p>
                    <Button to="/" variant="secondary" className="mt-6">Ver sorteos activos</Button>
                </div>
            </PageAnimator>
        );
    }

    const hasOpportunities = Boolean(raffle.boletosConOportunidades && raffle.numeroOportunidades > 1);
    const hasPacks = Boolean(raffle.packs && raffle.packs.length > 0);
    const hasSelection = selectedTickets.length > 0 || selectedPack !== null;
    const summaryProps = {
        raffle, selectedTickets, selectedPack, packQuantity, matchedPack, savingsFromPack,
        totalPrice, pricePerTicket, boletosAdicionales,
        onRemoveTicket: handleTicketClick,
        onClearPack: () => handlePackSelect(null, 1),
    };

    return (
        <PageAnimator>
            <div className={`container mx-auto px-4 sm:px-6 max-w-6xl pt-4 md:pt-8 ${hasSelection ? 'pb-28 lg:pb-0' : ''}`}>
                <nav className="mb-3 flex items-center min-w-0 text-sm" aria-label="Migas de pan">
                    <Link to="/" className="flex-shrink-0 text-slate-400 hover:text-white">Sorteos</Link>
                    <span className="mx-2 flex-shrink-0 text-slate-600" aria-hidden>/</span>
                    <span className="truncate text-slate-300">{raffle.title}</span>
                </nav>

                {/* En móvil es una columna (orden por `order-*`); en escritorio dos columnas con panel fijo a la derecha */}
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:gap-y-8 lg:items-start">
                    <div className="contents lg:block lg:col-span-7 lg:space-y-8">
                        <div className="order-1">
                            <RaffleGallery images={raffleImages} title={raffle.title} />
                        </div>

                        {/* Elegir boletos */}
                        <section className="order-3" id="boletos" aria-labelledby="tickets-title">
                            <Card>
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <h2 id="tickets-title" className="text-lg font-extrabold text-white">Elige tus boletos</h2>
                                    {!selectedPack && (
                                        <Button variant="secondary" size="sm" onClick={() => setLuckyOpen(true)} disabled={occupiedStatus !== 'ready'} icon={<Shuffle className="w-4 h-4" aria-hidden />}>
                                            Elegir al azar
                                        </Button>
                                    )}
                                </div>

                                {hasPacks && (
                                    <PackSelector
                                        packs={raffle.packs!}
                                        pricePerTicket={pricePerTicket}
                                        onPackSelect={handlePackSelect}
                                        selectedPack={selectedPack}
                                        selectedQuantity={packQuantity}
                                        availableTickets={occupiedStatus === 'ready' ? availableCount : undefined}
                                        className="mb-5"
                                    />
                                )}

                                {selectedPack ? (
                                    <p className="text-sm text-slate-400 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                                        Con un paquete, los números se asignan al azar entre los disponibles al confirmar tu compra.
                                    </p>
                                ) : occupiedStatus === 'error' ? (
                                    <div role="alert" className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 text-center">
                                        <p className="text-sm text-slate-300">No pudimos comprobar qué boletos siguen disponibles.</p>
                                        <Button variant="secondary" size="sm" onClick={() => setOccupiedReloadKey(k => k + 1)}>Reintentar</Button>
                                    </div>
                                ) : occupiedStatus === 'ready' && prefsReady ? (
                                    <TicketSelector
                                        totalTickets={raffle.tickets}
                                        occupiedTickets={occupiedTickets}
                                        selectedTickets={selectedTickets}
                                        listingMode={listingMode}
                                        hideOccupied={hideOccupied}
                                        showAvailability={showSoldPercentage}
                                        onTicketClick={handleTicketClick}
                                    />
                                ) : (
                                    <div role="status" className="flex min-h-[320px] items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-sm text-slate-400">
                                        Cargando boletos disponibles…
                                    </div>
                                )}
                            </Card>
                        </section>

                        {/* Sobre el premio */}
                        {(raffle.description || (raffle.bonuses && raffle.bonuses.length > 0)) && (
                            <section className="order-4" aria-labelledby="about-title">
                                <h2 id="about-title" className="text-lg font-extrabold text-white mb-3">Sobre el premio</h2>
                                {raffle.description && <p className="text-[15px] text-slate-300 whitespace-pre-line">{raffle.description}</p>}
                                <BonusesCard bonuses={raffle.bonuses || []} className={raffle.description ? 'mt-5' : ''} />
                            </section>
                        )}
                    </div>

                    <aside className="contents lg:block lg:col-span-5">
                        <div className="contents lg:block lg:sticky lg:top-20 lg:space-y-5">
                            {/* Título y datos clave */}
                            <div className="order-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">Sorteo activo</p>
                                <h1 className="text-title font-extrabold text-white">{raffle.title}</h1>
                                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div>
                                        <dt className="text-xs font-semibold text-slate-400">Precio por boleto</dt>
                                        <dd className="tnum text-2xl font-extrabold text-accent leading-tight">{formatMoney(pricePerTicket)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-slate-400">Fecha del sorteo</dt>
                                        <dd className="flex items-center gap-1.5 text-sm font-semibold text-white mt-1"><Calendar className="w-4 h-4 text-slate-400" aria-hidden />{formatDate(raffle.drawDate)}</dd>
                                    </div>
                                </dl>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {hasOpportunities && (
                                        <Badge tone="accent" icon={<Gift className="w-3.5 h-3.5" aria-hidden />}>
                                            {raffle.numeroOportunidades} oportunidades por boleto
                                        </Badge>
                                    )}
                                    <span className="text-sm text-slate-400">Cierra en <CountdownTimer targetDate={raffle.drawDate} variant="inline" /></span>
                                </div>
                                {hasOpportunities && (
                                    <p className="mt-2 text-sm text-slate-400">
                                        Por cada boleto que compres recibes {raffle.numeroOportunidades - 1} {raffle.numeroOportunidades - 1 === 1 ? 'boleto adicional' : 'boletos adicionales'} de regalo.
                                    </p>
                                )}
                                {showSoldPercentage && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                                            <span>{progress.toFixed(0)} % vendido</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                                            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Resumen (solo escritorio; en móvil vive en la barra inferior) */}
                            <div className="hidden lg:block">
                                <Card>
                                    <PurchaseSummary {...summaryProps} />
                                </Card>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <StickyPurchaseBar {...summaryProps} />

            <LuckyMachine
                open={luckyOpen}
                onClose={() => setLuckyOpen(false)}
                totalTickets={raffle.tickets}
                occupiedTickets={occupiedTickets}
                pricePerTicket={pricePerTicket}
                onTicketsSelected={handleLuckyMachineTickets}
                raffleSlug={raffle.slug || ''}
            />
        </PageAnimator>
    );
};

export default RaffleDetailPage;
