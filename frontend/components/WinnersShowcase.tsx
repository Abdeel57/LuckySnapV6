import React from 'react';
import { Calendar, Sparkles, Trophy } from 'lucide-react';
import { Winner } from '../types';
import WinnerCard from './WinnerCard';
import Reveal from './ui/Reveal';
import SectionHeading from './ui/SectionHeading';
import { formatDate } from '../utils/format';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&h=600&fit=crop';

/** Salón de ganadores: el más reciente en grande (cara y premio), el resto en tarjetas. */
const WinnersShowcase: React.FC<{ winners: Winner[] }> = ({ winners }) => {
    if (winners.length === 0) return null;
    const [featured, ...rest] = winners;
    const prizeTitle = featured.raffleTitle || featured.prize;
    const showPrizeDetail = Boolean(featured.prize && featured.prize !== featured.raffleTitle);

    return (
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <SectionHeading eyebrow="Ya ganaron" title="Salón de ganadores" tone="gold" lead="Personas reales que se llevaron el premio a casa." />

            <article className="shine-sweep relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.12] via-background-secondary to-background-secondary p-5 sm:p-7 lg:p-9">
                <Sparkles className="pointer-events-none absolute top-5 right-5 w-6 h-6 text-amber-300/70" aria-hidden />
                <Sparkles className="pointer-events-none absolute bottom-5 right-10 hidden md:block w-4 h-4 text-amber-300/50" aria-hidden />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:gap-10 items-center">
                    <div className="relative mx-auto w-full max-w-[300px]">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-background-primary ring-4 ring-amber-300/70 shadow-glow-gold">
                            <img
                                src={featured.imageUrl || FALLBACK_IMAGE}
                                alt={`${featured.name}, ganador de ${prizeTitle}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                            />
                        </div>
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-amber-300 text-amber-950 text-xs font-extrabold uppercase tracking-[0.12em] shadow-glow-gold">
                            <Trophy className="w-3.5 h-3.5" aria-hidden /> Ganador
                        </span>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="neon-gold-text text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Ganador más reciente</p>
                        <h3 className="font-display mt-2 text-[clamp(1.5rem,2.4vw+0.6rem,2.25rem)] leading-[1.1] font-bold text-white">{featured.name}</h3>
                        <p className="mt-3 text-lg text-slate-200">
                            Se llevó <span className="font-bold text-white">{prizeTitle}</span>
                            {showPrizeDetail && <span className="text-slate-400"> · {featured.prize}</span>}
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" aria-hidden /> Sorteo del {formatDate(featured.drawDate)}
                        </p>
                    </div>
                </div>
            </article>

            {rest.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((winner, index) => (
                        <Reveal key={winner.id} delay={index * 90}>
                            <WinnerCard winner={winner} />
                        </Reveal>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WinnersShowcase;
