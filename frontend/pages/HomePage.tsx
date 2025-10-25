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
            {/* Hero Section - Main Raffle */}
            {loading ? (
                <div className="py-16 md:py-20 flex justify-center">
                    <div className="text-center">
                        <Spinner />
                        <p className="text-muted mt-4">Cargando sorteos...</p>
                    </div>
                </div>
            ) : mainRaffle ? (
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary mb-6 leading-tight">
                                Próximo Gran Sorteo
                            </h1>
                            <p className="text-xl md:text-2xl text-secondary max-w-3xl mx-auto leading-relaxed">
                                Participa en nuestro sorteo más emocionante y gana premios increíbles
                            </p>
                        </div>
                        
                        <div className="card max-w-5xl mx-auto shadow-brand-md">
                            <div className="relative overflow-hidden rounded-xl mb-8">
                                <img 
                                    src={mainRaffle.imageUrl || mainRaffle.heroImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&h=600&fit=crop'} 
                                    alt={mainRaffle.title} 
                                    className="w-full h-64 md:h-80 lg:h-96 object-cover transition-transform duration-500 hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-inverse mb-4 leading-tight">
                                        {mainRaffle.title}
                                    </h2>
                                </div>
                            </div>
                            
                            <div className="text-center mb-8">
                                <div className="inline-block p-6 bg-secondary/10 rounded-xl border border-brand">
                                    <CountdownTimer targetDate={mainRaffle.drawDate} />
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <Link
                                    to={`/sorteo/${mainRaffle.slug}`}
                                    className="btn-primary text-lg px-12 py-4 shadow-brand-sm hover:shadow-brand-md"
                                >
                                    ¡Participa Ahora!
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* Other Active Raffles */}
            {!loading && otherRaffles.length > 0 && (
                <section className="py-16 md:py-24 bg-tertiary">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">
                                Más Sorteos Disponibles
                            </h2>
                            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto">
                                Explora todos nuestros sorteos activos y encuentra el premio perfecto para ti
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {otherRaffles.map(raffle => (
                                <RaffleCard key={raffle.id} raffle={raffle} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
            
            {/* Empty State */}
            {!loading && raffles.length === 0 && (
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 max-w-4xl text-center">
                        <div className="card max-w-2xl mx-auto">
                            <div className="text-8xl mb-8">🎯</div>
                            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                                ¡Próximamente!
                            </h2>
                            <p className="text-lg md:text-xl text-secondary mb-8 leading-relaxed">
                                Estamos preparando nuevos sorteos increíbles para ti.
                            </p>
                            <p className="text-muted">
                                ¡Vuelve pronto para participar!
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works Section */}
            <section className="py-16 md:py-24 bg-secondary/5">
                <HowItWorks />
            </section>

            {/* Past Winners */}
            {!loading && winners.length > 0 && (
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">
                                Nuestros Últimos Ganadores
                            </h2>
                            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto">
                                Conoce a las personas afortunadas que ya han ganado increíbles premios
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {winners.map(winner => (
                                <WinnerCard key={winner.id} winner={winner} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Empty Winners State */}
            {!loading && winners.length === 0 && (
                <section className="py-16 md:py-24 bg-tertiary">
                    <div className="container mx-auto px-4 max-w-4xl text-center">
                        <div className="card max-w-2xl mx-auto">
                            <div className="text-8xl mb-8">🏆</div>
                            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                                ¡Sé el Primer Ganador!
                            </h2>
                            <p className="text-lg md:text-xl text-secondary mb-8 leading-relaxed">
                                Aún no tenemos ganadores, pero eso puede cambiar pronto.
                            </p>
                            <p className="text-muted">
                                ¡Participa en nuestros sorteos y podrías ser el primero!
                            </p>
                        </div>
                    </div>
                </section>
            )}
            
            {/* FAQ Section */}
            <section className="py-16 md:py-24 bg-secondary/5">
                <Faq />
            </section>

        </PageAnimator>
    );
};

export default HomePage;
