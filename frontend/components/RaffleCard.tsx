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
            className="card h-full flex flex-col group"
        >
            <Link to={`/sorteo/${raffle.slug}`} className="block">
                <div className="relative overflow-hidden rounded-xl mb-6">
                    <img 
                        src={raffle.imageUrl || raffle.heroImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop'} 
                        alt={raffle.title} 
                        className="w-full h-48 md:h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <span className="bg-primary text-inverse px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                            {progress.toFixed(0)}% vendido
                        </span>
                        {raffle.boletosConOportunidades && raffle.numeroOportunidades > 1 && (
                            <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                🎯 {raffle.numeroOportunidades}x Oportunidades
                            </span>
                        )}
                    </div>
                </div>
            </Link>
            
            <div className="flex flex-col flex-grow">
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-4 flex-grow line-clamp-2 group-hover:text-link transition-colors">
                    {raffle.title}
                </h3>
                
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-secondary">Progreso</span>
                        <span className="text-sm font-semibold text-primary">{raffle.sold}/{raffle.tickets}</span>
                    </div>
                    <div className="w-full bg-light rounded-full h-3 overflow-hidden">
                        <div 
                            className="h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-accent))`
                            }}
                        ></div>
                    </div>
                </div>
                
                <Link
                    to={`/sorteo/${raffle.slug}`}
                    className="btn-primary w-full text-center mt-auto transition-all duration-300 hover:shadow-brand-sm"
                >
                    Ver Sorteo
                </Link>
            </div>
        </motion.div>
    );
};

export default RaffleCard;
