import React from 'react';
import { Winner } from '../types';
import { format } from 'date-fns';
// FIX: Corrected import path for 'es' locale.
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

// FIX: Explicitly type as React.FC to handle special props like 'key'.
const WinnerCard: React.FC<{ winner: Winner }> = ({ winner }) => {
    return (
        <motion.div 
            className="bg-background-secondary rounded-lg overflow-hidden shadow-lg shadow-black/30 border border-slate-700/50 p-4 md:p-6 text-center h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Trophy className="text-yellow-400 h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
            <img src={winner.imageUrl} alt={winner.prize} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mx-auto mb-3 md:mb-4 border-4 border-accent"/>
            <p className="text-lg md:text-xl font-bold text-white mb-1">{winner.name}</p>
            <p className="text-slate-300 text-sm md:text-base mb-1">Ganó</p>
            <p className="text-base md:text-lg font-semibold text-accent mb-2 flex-grow">{winner.raffleTitle}</p>
            <p className="text-xs text-slate-400 mt-auto">
                Sorteo del {format(new Date(winner.drawDate), "dd 'de' MMMM, yyyy", { locale: es })}
            </p>
        </motion.div>
    );
};

export default WinnerCard;
