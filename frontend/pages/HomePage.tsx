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

const HomePage = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
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
    }, []);

    const mainRaffle = raffles.length > 0 ? raffles[0] : null;
    const otherRaffles = raffles.length > 1 ? raffles.slice(1) : [];

    return (
        <PageAnimator>
            {/* Main Raffle Block */}
            {loading ? (
                <div className="py-20 flex justify-center"><Spinner /></div>
            ) : mainRaffle ? (
                <div className="container mx-auto px-4 pt-16 text-center">
                    <div className="max-w-4xl mx-auto bg-background-secondary rounded-lg p-6 md:p-8 border border-slate-700/50 shadow-lg shadow-neon-accent">
                        <h2 className="text-3xl font-bold text-white mb-6">Próximo Gran Sorteo</h2>
                        <img src={mainRaffle.heroImage} alt={mainRaffle.title} className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"/>
                        <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">{mainRaffle.title}</h3>
                        <div className="mb-8">
                            <CountdownTimer targetDate={mainRaffle.drawDate} />
                        </div>
                        <Link
                            to={`/sorteo/${mainRaffle.slug}`}
                            className="inline-block bg-action text-white font-bold py-3 px-12 rounded-lg hover:opacity-90 transition-opacity text-lg"
                        >
                            ¡Participa Ahora!
                        </Link>
                    </div>
                </div>
            ) : null}

            {/* Other Active Raffles */}
            {!loading && otherRaffles.length > 0 && (
                <div className="container mx-auto px-4 py-16">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">Más Sorteos Disponibles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {otherRaffles.map(raffle => (
                            <RaffleCard key={raffle.id} raffle={raffle} />
                        ))}
                    </div>
                </div>
            )}
            
            { !loading && raffles.length === 0 && (
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-slate-400 text-lg">No hay sorteos activos en este momento. ¡Vuelve pronto!</p>
                </div>
            )}

            <HowItWorks />

            {/* Past Winners */}
            {winners.length > 0 && (
                <div className="container mx-auto px-4 py-16">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">Nuestros Últimos Ganadores</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {winners.map(winner => (
                            <WinnerCard key={winner.id} winner={winner} />
                        ))}
                    </div>
                </div>
            )}
            
            <Faq />

        </PageAnimator>
    );
};

export default HomePage;
