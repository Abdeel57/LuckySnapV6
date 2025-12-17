import React, { memo } from 'react';
import { Winner } from '../types';
import { format } from 'date-fns';
// FIX: Corrected import path for 'es' locale.
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Trophy, Calendar } from 'lucide-react';
import { useOptimizedAnimations } from '../utils/deviceDetection';

// FIX: Explicitly type as React.FC to handle special props like 'key'.
const WinnerCard: React.FC<{ winner: Winner }> = ({ winner }) => {
    const reduceAnimations = useOptimizedAnimations();
    
    return (
        <motion.div 
            className="relative group w-full"
            initial={reduceAnimations ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={reduceAnimations ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={reduceAnimations ? { duration: 0.3 } : { duration: 0.5 }}
            whileHover={reduceAnimations ? {} : { scale: 1.05 }}
        >
            {/* Efecto de brillo de fondo - reducido en móviles */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl ${reduceAnimations ? 'opacity-10' : 'blur opacity-20'} group-hover:opacity-30 transition-opacity duration-300 ${reduceAnimations ? '' : 'animate-pulse'}`} />
            
            {/* Contenedor principal */}
            <div className="relative bg-gradient-to-br from-background-secondary via-slate-800/90 to-background-secondary rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 h-full flex flex-col min-h-[400px] sm:min-h-[450px]">
                {/* Header con gradiente dorado */}
                <div className="relative bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-yellow-400/20 p-6 pb-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <motion.div
                            animate={reduceAnimations ? {} : { rotate: [0, 10, -10, 0] }}
                            transition={reduceAnimations ? {} : { duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="relative"
                        >
                            <Trophy className="text-yellow-400 h-12 w-12 md:h-16 md:w-16 drop-shadow-lg" />
                        </motion.div>
                    </div>
                    <div className="text-center">
                        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-sm md:text-base font-black text-gray-900 shadow-lg">
                            🏆 GANADOR 🏆
                        </span>
                    </div>
                </div>
                
                {/* Contenido principal */}
                <div className="p-6 md:p-8 flex-1 flex flex-col items-center">
                    {/* Imagen del premio con efecto especial */}
                    <div className="relative mb-6">
                        {!reduceAnimations && <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-md opacity-50 animate-pulse" />}
                        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-400/20">
                            <img 
                                src={winner.imageUrl} 
                                alt={winner.prize} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop';
                                }}
                            />
                        </div>
                    </div>
                    
                    {/* Nombre del ganador */}
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2 text-center">
                        {winner.name}
                    </h3>
                    
                    {/* Línea divisoria decorativa */}
                    <div className="w-20 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent my-4" />
                    
                    {/* Premio ganado */}
                    <div className="text-center mb-4">
                        <p className="text-slate-300 text-sm md:text-base mb-2 flex items-center justify-center gap-2">
                            <span>Ganó</span>
                        </p>
                        <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            {winner.raffleTitle || winner.prize}
                        </p>
                        {winner.prize && winner.prize !== winner.raffleTitle && (
                            <p className="text-base md:text-lg text-accent mt-2">
                                {winner.prize}
                            </p>
                        )}
                    </div>
                    
                    {/* Fecha del sorteo */}
                    <div className="mt-auto pt-4 border-t border-slate-700/50 w-full">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <p className="text-xs md:text-sm">
                                Sorteo del {format(new Date(winner.drawDate), "dd 'de' MMMM, yyyy", { locale: es })}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
        </motion.div>
    );
};

export default memo(WinnerCard);
