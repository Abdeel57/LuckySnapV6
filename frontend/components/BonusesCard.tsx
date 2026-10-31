import React from 'react';

interface BonusesCardProps {
    bonuses: string[];
    className?: string;
}

/** Premios o bonos adicionales configurados por el admin para el sorteo. */
const BonusesCard: React.FC<BonusesCardProps> = ({ bonuses, className = '' }) => {
    if (!bonuses || bonuses.length === 0) return null;

    return (
        <div className={className}>
            <h3 className="text-base font-bold text-ink mb-3">Premios adicionales</h3>
            <ul className="space-y-2">
                {bonuses.map((bonus, index) => (
                    <li key={index} className="rounded-xl bg-surface-2 px-4 py-3">
                        <p className="text-[15px] text-ink/80">{bonus}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BonusesCard;
