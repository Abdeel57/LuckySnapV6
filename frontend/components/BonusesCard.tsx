import React from 'react';
import { motion } from 'framer-motion';

interface BonusesCardProps {
    bonuses: string[];
    className?: string;
}

const BonusesCard: React.FC<BonusesCardProps> = ({ bonuses, className = '' }) => {
    if (!bonuses || bonuses.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`bg-gradient-to-br from-background-secondary to-background-primary rounded-2xl border border-slate-700/50 shadow-xl p-6 ${className}`}
        >
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">Bonos y Premios Adicionales</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-accent to-action rounded-full"></div>
            </div>
            
            <div className="space-y-3">
                {bonuses.map((bonus, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-3 bg-background-primary/50 rounded-lg p-4 border border-slate-700/30 hover:border-accent/50 transition-all duration-200"
                    >
                        <div className="flex-shrink-0 w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <p className="text-slate-200 text-base leading-relaxed flex-1">{bonus}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default BonusesCard;

