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
    
    // Calcular progreso con validación para evitar valores negativos o inválidos
    const progress = React.useMemo(() => {
        const sold = typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0;
        const tickets = typeof raffle.tickets === 'number' && raffle.tickets > 0 ? raffle.tickets : 1;
        const percentage = (sold / tickets) * 100;
        // Asegurar que el porcentaje esté entre 0 y 100
        return Math.max(0, Math.min(100, percentage));
    }, [raffle.sold, raffle.tickets]);

    // Detectar si la descripción es larga
    const isLongDescription = raffle.description && raffle.description.length > 120;

    return (
        <div
            className="relative h-full flex flex-col group overflow-hidden bg-background-secondary rounded-2xl shadow-lg border border-slate-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        >
            <Link to={`/sorteo/${raffle.slug}`} className="block relative">
                {/* Efecto de resplandor al hover */}
                {!reduceAnimations && (
                    <div className="absolute inset-0 bg-gradient-to-r from-action/10 via-accent/10 to-action/10 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
                )}
                
                {/* Imagen cuadrada con efectos mejorados */}
                <div className="relative overflow-hidden rounded-t-2xl aspect-square mb-0">
                    {/* Overlay decorativo */}
                    {!reduceAnimations && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    )}
                    
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
                    
                    {/* Badges mejorados */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                        <motion.span 
                            initial={reduceAnimations ? {} : { scale: 0 }}
                            whileInView={reduceAnimations ? {} : { scale: 1 }}
                            viewport={{ once: true }}
                            transition={reduceAnimations ? {} : { delay: 0.2, type: "spring" }}
                            className="bg-background-secondary/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-xl border border-slate-600/50"
                        >
                            {progress.toFixed(0)}% vendido
                        </motion.span>
                        {raffle.boletosConOportunidades && raffle.numeroOportunidades > 1 && (
                            <motion.span 
                                initial={reduceAnimations ? {} : { scale: 0 }}
                                whileInView={reduceAnimations ? {} : { scale: 1 }}
                                viewport={{ once: true }}
                                transition={reduceAnimations ? {} : { delay: 0.3, type: "spring" }}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-xl border-2 border-white/50"
                            >
                                🎯 {raffle.numeroOportunidades}x Oportunidades
                            </motion.span>
                        )}
                    </div>
                </div>
            </Link>
            
            <div className="flex flex-col flex-grow p-6 bg-gradient-to-b from-background-secondary to-background-primary/50">
                {/* Título mejorado */}
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-action group-hover:to-accent transition-all duration-300">
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
                            className={`text-sm md:text-base text-slate-300 leading-relaxed transition-all duration-300 ${
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
                            <div className="absolute bottom-0 right-0 text-accent text-xs font-semibold bg-background-secondary/80 backdrop-blur-sm px-2 py-1 rounded-tl-lg border-l border-t border-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                📖 Pasa el cursor para leer más
                            </div>
                        )}
                    </div>
                )}
                
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-slate-300">Boletos vendidos</span>
                        <span className="text-sm font-bold text-accent">{(typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0)} / {raffle.tickets}</span>
                    </div>
                    {/* Barra de progreso mejorada */}
                    <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden shadow-inner border border-slate-600/50">
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
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
                            ></div>
                        </div>
                    </div>
                    {/* Indicador de porcentaje encima de la barra */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400">0%</span>
                        <span className="text-xs font-bold text-accent">{progress.toFixed(0)}% vendido</span>
                        <span className="text-xs text-slate-400">100%</span>
                    </div>
                </div>
                
                <Link
                    to={`/sorteo/${raffle.slug}`}
                    className="relative w-full text-center mt-auto px-6 py-3 bg-gradient-to-r from-action to-accent text-white font-bold rounded-xl hover:from-action/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] group/btn overflow-hidden"
                >
                    {/* Efecto de brillo en hover */}
                    {!reduceAnimations && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 -translate-x-full group-hover/btn:translate-x-full" />
                    )}
                    <span className="relative z-10">Ver Sorteo</span>
                </Link>
            </div>
        </div>
    );
};

export default memo(RaffleCard);
