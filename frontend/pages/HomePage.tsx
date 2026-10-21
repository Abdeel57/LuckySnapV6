import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Gift, Sparkles, Ticket, Trophy } from 'lucide-react';
import { getActiveRaffles, getPastWinners, getSettings } from '../services/api';
import { Raffle, Winner } from '../types';
import PageAnimator from '../components/PageAnimator';
import RaffleCard from '../components/RaffleCard';
import WinnerCard from '../components/WinnerCard';
import HowItWorks from '../components/HowItWorks';
import Faq from '../components/Faq';
import HeroRaffle from '../components/HeroRaffle';
import TickerStrip, { TickerItem } from '../components/TickerStrip';
import SectionHeading from '../components/ui/SectionHeading';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { formatDate, formatMoney } from '../utils/format';
import { packLabel } from '../utils/checkout';

// En móvil el héroe real mide más que la pantalla: el esqueleto también, para que la sección
// siguiente no asome y luego salte al llegar el sorteo (CLS).
const HeroSkeleton = () => (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl pt-5 md:pt-10 min-h-screen lg:min-h-0" aria-busy="true" aria-label="Cargando sorteos">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10 animate-pulse">
            <div className="lg:col-span-7 rounded-2xl bg-white/[0.06] aspect-[4/3]" />
            <div className="lg:col-span-5 space-y-4">
                <div className="h-3 w-24 rounded bg-white/[0.08]" />
                <div className="h-10 w-4/5 rounded bg-white/[0.08]" />
                <div className="h-10 w-3/5 rounded bg-white/[0.08]" />
                <div className="grid grid-cols-4 gap-2 pt-4">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.06]" />)}
                </div>
                <div className="h-14 rounded-xl bg-white/[0.08]" />
            </div>
        </div>
    </div>
);

/** Datos reales del sorteo principal para la cinta deslizante. */
const tickerItemsFor = (raffle: Raffle): TickerItem[] => {
    const items: TickerItem[] = [
        { icon: <Ticket className="w-4 h-4" aria-hidden />, text: `${formatMoney(raffle.price)} por boleto` },
        { icon: <Calendar className="w-4 h-4" aria-hidden />, text: `Sorteo: ${formatDate(raffle.drawDate)}` },
    ];
    if (raffle.boletosConOportunidades && raffle.numeroOportunidades > 1) {
        items.push({ icon: <Gift className="w-4 h-4" aria-hidden />, text: `${raffle.numeroOportunidades} oportunidades por boleto` });
    }
    raffle.packs?.forEach(pack => {
        items.push({ icon: <Sparkles className="w-4 h-4" aria-hidden />, text: `${packLabel(pack)}: ${formatMoney(pack.price)}` });
    });
    items.push({ icon: <Trophy className="w-4 h-4" aria-hidden />, text: raffle.title });
    return items;
};

const HomePage = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [rafflesStatus, setRafflesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [winners, setWinners] = useState<Winner[]>([]);
    const [winnersInView, setWinnersInView] = useState(false);
    const winnersAnchorRef = useRef<HTMLDivElement>(null);
    const winnersRequestedRef = useRef(false);
    // Inicia oculto para no mostrar el porcentaje antes de conocer la preferencia del admin
    const [showSoldPercentage, setShowSoldPercentage] = useState(false);
    const { trackPageView } = useAnalytics();

    useEffect(() => {
        getSettings()
            .then(settings => setShowSoldPercentage((settings as any)?.displayPreferences?.showSoldPercentage !== false))
            .catch(() => setShowSoldPercentage(true));
    }, []);

    const loadRaffles = useCallback(() => {
        setRafflesStatus('loading');
        getActiveRaffles()
            .then(data => {
                setRaffles(data);
                setRafflesStatus('ready');
            })
            .catch(() => setRafflesStatus('error'));
    }, []);

    useEffect(() => {
        trackPageView('/');
        loadRaffles();
    }, [trackPageView, loadRaffles]);

    // /public/winners puede pesar varios MB (fotos en base64): no debe retrasar el sorteo
    // principal. Se pide cuando su sección está a ~600 px de verse. Se empieza a observar cuando
    // el héroe ya tiene su altura final; con el esqueleto el ancla parecería cercana al montar.
    const heroSettled = rafflesStatus !== 'loading';
    useEffect(() => {
        const anchor = winnersAnchorRef.current;
        if (!anchor || !heroSettled) return;
        if (typeof IntersectionObserver === 'undefined') {
            setWinnersInView(true);
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                setWinnersInView(true);
                observer.disconnect();
            }
        }, { rootMargin: '600px 0px' });
        observer.observe(anchor);
        return () => observer.disconnect();
    }, [heroSettled]);

    useEffect(() => {
        if (!winnersInView || winnersRequestedRef.current) return;
        winnersRequestedRef.current = true;
        getPastWinners()
            .then(setWinners)
            .catch(() => { /* sección opcional: si falla, no se muestra */ });
    }, [winnersInView]);

    const mainRaffle = raffles.length > 0 ? raffles[0] : null;
    const otherRaffles = raffles.length > 1 ? raffles.slice(1) : [];

    return (
        <PageAnimator>
            {rafflesStatus === 'loading' ? (
                <HeroSkeleton />
            ) : mainRaffle ? (
                <>
                    <HeroRaffle raffle={mainRaffle} showSoldPercentage={showSoldPercentage} />
                    <div className="container mx-auto px-4 sm:px-6 max-w-6xl pt-10 md:pt-14">
                        <TickerStrip items={tickerItemsFor(mainRaffle)} />
                    </div>
                </>
            ) : rafflesStatus === 'error' ? (
                <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-8 md:pt-14">
                    <Card className="max-w-xl mx-auto text-center py-10" role="alert">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-2">Sorteos</p>
                        <h1 className="text-title font-extrabold text-white">No pudimos cargar los sorteos</h1>
                        <p className="mt-2 text-slate-400">Revisa tu conexión e inténtalo de nuevo.</p>
                        <Button variant="secondary" className="mt-6" onClick={loadRaffles}>Reintentar</Button>
                    </Card>
                </section>
            ) : (
                <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-8 md:pt-14">
                    <Card glow className="max-w-xl mx-auto text-center py-10">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-2">Sorteos</p>
                        <h1 className="text-title neon-text font-extrabold text-white">Próximo sorteo en preparación</h1>
                        <p className="mt-2 text-slate-400">Vuelve pronto o síguenos en redes para enterarte del próximo.</p>
                    </Card>
                </section>
            )}

            {rafflesStatus === 'ready' && otherRaffles.length > 0 && (
                <Reveal as="section" className="container mx-auto px-4 sm:px-6 max-w-6xl pt-14 md:pt-20" aria-labelledby="more-raffles">
                    <SectionHeading eyebrow="También activos" title="Más sorteos" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {otherRaffles.map(raffle => (
                            <RaffleCard key={raffle.id} raffle={raffle} showSoldPercentage={showSoldPercentage} />
                        ))}
                    </div>
                </Reveal>
            )}

            <Reveal as="section" className="pt-14 md:pt-20">
                <HowItWorks />
            </Reveal>

            <div ref={winnersAnchorRef} aria-hidden />
            {winners.length > 0 && (
                <Reveal as="section" className="relative pt-14 md:pt-20">
                    {/* Banda dorada estática detrás de los ganadores */}
                    <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-[420px] bg-[radial-gradient(42rem_18rem_at_50%_30%,rgb(251_191_36/0.12),transparent_65%)]" aria-hidden />
                    <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                        <SectionHeading eyebrow="Ya ganaron" title="Ganadores recientes" tone="gold" />
                        {/* grid-cols-1: el nombre con truncate no debe ensanchar la columna en móvil */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {winners.map((winner, index) => (
                                <Reveal key={winner.id} delay={index * 90}>
                                    <WinnerCard winner={winner} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </Reveal>
            )}

            <Reveal as="section" className="pt-14 md:pt-20">
                <Faq />
            </Reveal>
        </PageAnimator>
    );
};

export default HomePage;
