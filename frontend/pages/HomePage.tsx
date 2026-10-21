import React, { useState, useEffect } from 'react';
import { getActiveRaffles, getPastWinners, getSettings } from '../services/api';
import { Raffle, Winner } from '../types';
import PageAnimator from '../components/PageAnimator';
import RaffleCard from '../components/RaffleCard';
import WinnerCard from '../components/WinnerCard';
import HowItWorks from '../components/HowItWorks';
import Faq from '../components/Faq';
import HeroRaffle from '../components/HeroRaffle';
import SectionHeading from '../components/ui/SectionHeading';
import Card from '../components/ui/Card';
import { useAnalytics } from '../contexts/AnalyticsContext';

const HeroSkeleton = () => (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl pt-5 md:pt-10" aria-busy="true" aria-label="Cargando sorteos">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-10 animate-pulse">
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

const HomePage = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    // Inicia oculto para no mostrar el porcentaje antes de conocer la preferencia del admin
    const [showSoldPercentage, setShowSoldPercentage] = useState(false);
    const { trackPageView } = useAnalytics();

    useEffect(() => {
        getSettings()
            .then(settings => setShowSoldPercentage((settings as any)?.displayPreferences?.showSoldPercentage !== false))
            .catch(() => setShowSoldPercentage(true));
    }, []);

    useEffect(() => {
        setLoading(true);
        trackPageView('/');
        Promise.allSettled([getActiveRaffles(), getPastWinners()])
            .then(([raffleResult, winnerResult]) => {
                setRaffles(raffleResult.status === 'fulfilled' ? raffleResult.value : []);
                setWinners(winnerResult.status === 'fulfilled' ? winnerResult.value : []);
            })
            .finally(() => setLoading(false));
    }, [trackPageView]);

    const mainRaffle = raffles.length > 0 ? raffles[0] : null;
    const otherRaffles = raffles.length > 1 ? raffles.slice(1) : [];

    return (
        <PageAnimator>
            {loading ? (
                <HeroSkeleton />
            ) : mainRaffle ? (
                <HeroRaffle raffle={mainRaffle} showSoldPercentage={showSoldPercentage} />
            ) : (
                <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-8 md:pt-14">
                    <Card className="max-w-xl mx-auto text-center py-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">Sorteos</p>
                        <h1 className="text-title font-extrabold text-white">No hay sorteos activos por ahora</h1>
                        <p className="mt-2 text-slate-400">Vuelve pronto o síguenos en redes para enterarte del próximo.</p>
                    </Card>
                </section>
            )}

            {!loading && otherRaffles.length > 0 && (
                <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-14 md:pt-20" aria-labelledby="more-raffles">
                    <SectionHeading title="Más sorteos activos" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {otherRaffles.map(raffle => (
                            <RaffleCard key={raffle.id} raffle={raffle} showSoldPercentage={showSoldPercentage} />
                        ))}
                    </div>
                </section>
            )}

            <section className="pt-14 md:pt-20">
                <HowItWorks />
            </section>

            {!loading && winners.length > 0 && (
                <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-14 md:pt-20">
                    <SectionHeading title="Ganadores recientes" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {winners.map(winner => <WinnerCard key={winner.id} winner={winner} />)}
                    </div>
                </section>
            )}

            <section className="pt-14 md:pt-20">
                <Faq />
            </section>
        </PageAnimator>
    );
};

export default HomePage;
