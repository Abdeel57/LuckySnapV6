import React from 'react';
import { Winner } from '../types';
import WinnerCard from './WinnerCard';
import SectionHeading from './ui/SectionHeading';

const MAX_WINNERS = 6;

/** Ganadores anteriores en tarjetas compactas (los más recientes primero). */
const WinnersShowcase: React.FC<{ winners: Winner[] }> = ({ winners }) => {
    if (winners.length === 0) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <SectionHeading eyebrow="Ya ganaron" title="Ganadores anteriores" lead="Personas reales que se llevaron el premio a casa." />
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {winners.slice(0, MAX_WINNERS).map(winner => (
                    <li key={winner.id}>
                        <WinnerCard winner={winner} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default WinnersShowcase;
