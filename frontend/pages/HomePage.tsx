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
import HeroRaffle from '../components/HeroRaffle';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { Trophy, Sparkles, Gift, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOptimizedAnimations } from '../utils/deviceDetection';

const HomePage = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    const { trackPageView } = useAnalytics();
    const reduceAnimations = useOptimizedAnimations();

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
                <HeroRaffle raffle={mainRaffle} />
            ) : null}

            {/* Other Active Raffles */}
            {!loading && otherRaffles.length > 0 && (
                <section className="relative py-16 md:py-24 overflow-hidden">
                    {/* Fondo con efectos decorativos */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-action/5 to-background-primary" />
                    {!reduceAnimations && (
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-20 left-10 w-96 h-96 bg-action/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
                        </div>
                    )}
                    
                    <div className="container mx-auto px-4 max-w-7xl relative z-10">
                        {/* Header mejorado */}
                        <motion.div
                            initial={reduceAnimations ? {} : { opacity: 0, y: 30 }}
                            whileInView={reduceAnimations ? {} : { opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={reduceAnimations ? {} : { duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center justify-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-action to-accent rounded-2xl shadow-lg">
                                    <Gift className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                                {!reduceAnimations && <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent animate-pulse" />}
                                <div className="p-3 bg-gradient-to-br from-accent to-action rounded-2xl shadow-lg">
                                    <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                            </div>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                                Más Sorteos Disponibles
                            </h2>
                            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                                Explora todos nuestros sorteos activos y encuentra el premio perfecto para ti
                            </p>
                        </motion.div>
                        
                        {/* Grid con animaciones escalonadas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {otherRaffles.map((raffle, index) => (
                                <motion.div
                                    key={raffle.id}
                                    initial={reduceAnimations ? {} : { opacity: 0, y: 40, scale: 0.9 }}
                                    whileInView={reduceAnimations ? {} : { opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={reduceAnimations ? {} : { 
                                        duration: 0.5, 
                                        delay: Math.min(index * 0.1, 0.6),
                                        type: "spring",
                                        stiffness: 100
                                    }}
                                >
                                    <RaffleCard raffle={raffle} />
                                </motion.div>
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
                <section className="relative py-16 md:py-24 overflow-hidden">
                    {/* Fondo con efecto - reducido en móviles */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-purple-900/10 to-background-primary" />
                    {!reduceAnimations && (
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
                        </div>
                    )}
                    
                    <div className="container mx-auto px-4 max-w-7xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center justify-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
                                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
                            </div>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                                Nuestros Últimos Ganadores
                            </h2>
                            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                                Conoce a las personas afortunadas que ya han ganado increíbles premios
                            </p>
                        </motion.div>
                        
                        <div className={`${
                            winners.length === 1 
                                ? 'flex justify-center max-w-md mx-auto' 
                                : winners.length === 2 
                                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto' 
                                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10'
                        }`}>
                            {winners.map((winner, index) => (
                                <motion.div
                                    key={winner.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.1, 0.5) }}
                                >
                                    <WinnerCard winner={winner} />
                                </motion.div>
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
