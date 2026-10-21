import React from 'react';
import { Gift } from 'lucide-react';

interface BonusesCardProps {
    bonuses: string[];
    className?: string;
}

/** Premios o bonos adicionales configurados por el admin para el sorteo. */
const BonusesCard: React.FC<BonusesCardProps> = ({ bonuses, className = '' }) => {
    if (!bonuses || bonuses.length === 0) return null;

    return (
        <div className={className}>
            <h3 className="text-base font-extrabold text-white mb-3">Premios adicionales</h3>
            <ul className="space-y-2">
                {bonuses.map((bonus, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                        <Gift className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" aria-hidden />
                        <p className="text-[15px] text-slate-200">{bonus}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BonusesCard;
