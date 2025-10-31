import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Raffle } from '../types';
import { motion } from 'framer-motion';
import { useOptimizedAnimations } from '../utils/deviceDetection';

interface RaffleCardProps {
    raffle: Raffle;
}

// FIX: Explicitly type as React.FC to handle special props like 'key'.
const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const reduceAnimations = useOptimizedAnimations();
    const progress = (raffle.sold / raffle.tickets) * 100;

    // Detectar si la descripción es larga
    const isLongDescription = raffle.description && raffle.description.length > 120;

    return (
        <motion.div
            initial={reduceAnimations ? {} : { opacity: 0, y: 20 }}
            whileInView={reduceAnimations ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={reduceAnimations ? {} : { duration: 0.5 }}
            className="card h-full flex flex-col group overflow-hidden"
        >
            <Link to={`/sorteo/${raffle.slug}`} className="block">
                {/* Imagen cuadrada sin bordes redondeados */}
                <div className="relative overflow-hidden rounded-t-2xl aspect-square mb-0">
                    <img 
                        src={raffle.imageUrl || raffle.heroImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop'} 
                        alt={raffle.title} 
                        className={`w-full h-full object-cover transition-transform ${reduceAnimations ? '' : 'duration-500 group-hover:scale-110'}`}
                        loading="lazy"
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
            
            <div className="flex flex-col flex-grow p-6">
                {/* Título */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {raffle.title}
                </h3>
                
                {/* Descripción con interacción */}
                {raffle.description && (
                    <div 
                        className="mb-4 relative"
                        onMouseEnter={() => isLongDescription && setIsDescriptionExpanded(true)}
                        onMouseLeave={() => setIsDescriptionExpanded(false)}
                    >
                        <p 
                            className={`text-sm md:text-base text-gray-600 leading-relaxed transition-all duration-300 ${
                                isLongDescription && !isDescriptionExpanded 
                                    ? 'line-clamp-3 cursor-pointer' 
                                    : ''
                            }`}
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                            {raffle.description}
                        </p>
                        
                        {/* Indicador de "ver más" */}
                        {isLongDescription && !isDescriptionExpanded && (
                            <div className="absolute bottom-0 right-0 text-primary text-xs font-semibold bg-white/80 backdrop-blur-sm px-2 py-1 rounded-tl-lg border-l border-t border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                📖 Pasa el cursor para leer más
                            </div>
                        )}
                    </div>
                )}
                
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Boletos vendidos</span>
                        <span className="text-sm font-bold text-primary">{raffle.sold} / {raffle.tickets}</span>
                    </div>
                    {/* Barra de progreso mejorada */}
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner border border-gray-300">
                        <div 
                            className="h-4 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                            style={{ 
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, #10b981, #34d399)`,
                                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            {/* Efecto de brillo */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                style={{
                                    animation: 'axios 2s ease-in-out infinite'
                                }}
                            ></div>
                        </div>
                    </div>
                    {/* Indicador de porcentaje encima de la barra */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">0%</span>
                        <span className="text-xs font-bold text-green-600">{progress.toFixed(0)}% vendido</span>
                        <span className="text-xs text-gray-500">100%</span>
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

export default memo(RaffleCard);
