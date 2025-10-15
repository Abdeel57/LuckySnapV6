import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveRaffles, getPastWinners } from '../services/api';
import { Raffle, Winner } from '../types';
import PageAnimator from '../components/PageAnimator';
import RaffleCard from '../components/RaffleCard';
import Spinner from '../components/Spinner';
import WinnerCard from '../components/WinnerCard';
import HowItWorks from '../components/HowItWorks';
import Faq from '../components/Faq';
import CountdownTimer from '../components/CountdownTimer';
import { useAnalytics } from '../contexts/AnalyticsContext';

const HomePage = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    const { trackPageView } = useAnalytics();

    useEffect(() => {
        setLoading(true);
        trackPageView('/');
        Promise.all([
            getActiveRaffles(),
            getPastWinners()
        ]).then(([raffleData, winnerData]) => {
            setRaffles(raffleData);
            setWinners(winnerData);
        }).catch(err => {
            console.error("Failed to load home page data", err);
        }).finally(() => {
            setLoading(false);
        });
    }, [trackPageView]);

    const mainRaffle = raffles.length > 0 ? raffles[0] : null;
    const otherRaffles = raffles.length > 1 ? raffles.slice(1) : [];

    return (
        <PageAnimator>
            {/* Main Raffle Block */}
            {loading ? (
                <div className="py-16 md:py-20 flex justify-center">
                    <div className="text-center">
                        <Spinner />
                        <p className="text-slate-400 mt-4">Cargando sorteos...</p>
                    </div>
                </div>
            ) : mainRaffle ? (
                <div className="container mx-auto px-4 pt-8 md:pt-16 text-center">
                    <div className="max-w-4xl mx-auto bg-background-secondary rounded-lg p-4 md:p-6 lg:p-8 border border-slate-700/50 shadow-lg shadow-neon-accent">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Próximo Gran Sorteo</h2>
                        <img src={mainRaffle.imageUrl || mainRaffle.heroImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800'} alt={mainRaffle.title} className="w-full h-48 md:h-64 lg:h-96 object-cover rounded-lg mb-4 md:mb-6"/>
                        <h3 className="text-xl md:text-2xl lg:text-4xl font-bold text-white mb-4">{mainRaffle.title}</h3>
                        <div className="mb-6 md:mb-8">
                            <CountdownTimer targetDate={mainRaffle.drawDate} />
                        </div>
                        <Link
                            to={`/sorteo/${mainRaffle.slug}`}
                            className="inline-block bg-action text-white font-bold py-3 md:py-3 px-6 md:px-12 rounded-lg hover:opacity-90 transition-opacity text-sm md:text-lg"
                        >
                            ¡Participa Ahora!
                        </Link>
                    </div>
                </div>
            ) : null}

            {/* Other Active Raffles */}
            {!loading && otherRaffles.length > 0 && (
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6 md:mb-8">Más Sorteos Disponibles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {otherRaffles.map(raffle => (
                            <RaffleCard key={raffle.id} raffle={raffle} />
                        ))}
                    </div>
                </div>
            )}
            
            { !loading && raffles.length === 0 && (
                <div className="container mx-auto px-4 py-16 md:py-20 text-center">
                    <div className="bg-background-secondary rounded-lg p-8 md:p-12 border border-slate-700/50 shadow-lg">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¡Próximamente!</h2>
                        <p className="text-slate-300 text-lg md:text-xl mb-6">Estamos preparando nuevos sorteos increíbles para ti.</p>
                        <p className="text-slate-400">¡Vuelve pronto para participar!</p>
                    </div>
                </div>
            )}

            <div className="py-8 md:py-12">
                <HowItWorks />
            </div>

            {/* Past Winners */}
            {!loading && winners.length > 0 && (
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6 md:mb-8">Nuestros Últimos Ganadores</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {winners.map(winner => (
                            <WinnerCard key={winner.id} winner={winner} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty Winners State */}
            {!loading && winners.length === 0 && (
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="text-center">
                        <div className="bg-background-secondary rounded-lg p-8 md:p-12 border border-slate-700/50 shadow-lg max-w-2xl mx-auto">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¡Sé el Primer Ganador!</h2>
                            <p className="text-slate-300 text-lg md:text-xl mb-6">Aún no tenemos ganadores, pero eso puede cambiar pronto.</p>
                            <p className="text-slate-400">¡Participa en nuestros sorteos y podrías ser el primero!</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="py-8 md:py-12">
                <Faq />
            </div>

        </PageAnimator>
    );
};

export default HomePage;
