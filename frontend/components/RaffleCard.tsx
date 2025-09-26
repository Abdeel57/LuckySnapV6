import React from 'react';
import { Link } from 'react-router-dom';
import { Raffle } from '../types';
import { motion } from 'framer-motion';

interface RaffleCardProps {
    raffle: Raffle;
}

// FIX: Explicitly type as React.FC to handle special props like 'key'.
const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
    const progress = (raffle.sold / raffle.tickets) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="bg-background-secondary rounded-lg overflow-hidden shadow-lg shadow-black/30 border border-slate-700/50 flex flex-col"
        >
            <Link to={`/sorteo/${raffle.slug}`}>
                <img src={raffle.heroImage} alt={raffle.title} className="w-full h-48 object-cover" />
            </Link>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-2 flex-grow">{raffle.title}</h3>
                <div className="my-4">
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-right text-sm text-slate-400 mt-2">{progress.toFixed(2)}% vendido</p>
                </div>
                <Link
                    to={`/sorteo/${raffle.slug}`}
                    className="block w-full text-center bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity mt-auto"
                >
                    Ver Sorteo
                </Link>
            </div>
        </motion.div>
    );
};

export default RaffleCard;
