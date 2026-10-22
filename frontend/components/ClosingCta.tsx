import React, { useRef } from 'react';
import { Ticket } from 'lucide-react';
import { Raffle } from '../types';
import CountdownTimer from './CountdownTimer';
import Button from './ui/Button';
import { LiveDot } from './HeroRaffle';
import { useInView } from '../hooks/useInView';
import { formatDate, formatMoney } from '../utils/format';

/** Llamada final antes del pie: el contador y la acción principal, otra vez a mano. */
const ClosingCta: React.FC<{ raffle: Raffle }> = ({ raffle }) => {
    // Está al final de la página: su contador solo corre cuando se ve
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    return (
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl" ref={ref}>
            <div className="glow-border relative overflow-hidden rounded-3xl bg-background-secondary px-5 py-8 sm:p-10 text-center">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(36rem_18rem_at_50%_120%,rgb(var(--color-action)/0.35),transparent_65%)]" aria-hidden />
                <div className="relative max-w-2xl mx-auto">
                    <p className="inline-flex items-center text-xs font-bold uppercase tracking-[0.16em] text-accent"><LiveDot />Sorteo en marcha</p>
                    <h2 className="font-display mt-3 text-[clamp(1.5rem,2.6vw+0.6rem,2.4rem)] leading-[1.1] font-bold text-white neon-text">Elige tus números antes del cierre</h2>
                    <p className="mt-2 text-slate-300">
                        <span className="tnum font-bold text-accent">{formatMoney(raffle.price)}</span> por boleto · Sorteo el {formatDate(raffle.drawDate)}
                    </p>
                    <div className="mt-6 max-w-md mx-auto">
                        <CountdownTimer targetDate={raffle.drawDate} variant="blocks" active={inView} />
                    </div>
                    <Button to={`/sorteo/${raffle.slug}`} size="lg" shine className="mt-7 w-full sm:w-auto sm:px-10" icon={<Ticket className="w-5 h-5" aria-hidden />}>
                        Comprar boletos
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClosingCta;
