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
            className="bg-background-secondary rounded-lg overflow-hidden shadow-lg shadow-black/30 border border-slate-700/50 p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Trophy className="text-yellow-400 h-12 w-12 mx-auto mb-4" />
            <img src={winner.imageUrl} alt={winner.prize} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-accent"/>
            <p className="text-xl font-bold text-white">{winner.name}</p>
            <p className="text-slate-300">Ganó</p>
            <p className="text-lg font-semibold text-accent mb-2">{winner.raffleTitle}</p>
            <p className="text-xs text-slate-400">
                Sorteo del {format(new Date(winner.drawDate), "dd 'de' MMMM, yyyy", { locale: es })}
            </p>
        </motion.div>
    );
};

export default WinnerCard;
