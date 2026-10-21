import React, { memo } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Winner } from '../types';
import { formatDate } from '../utils/format';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop';

const WinnerCard: React.FC<{ winner: Winner }> = ({ winner }) => {
    const prizeTitle = winner.raffleTitle || winner.prize;
    const showPrizeDetail = Boolean(winner.prize && winner.prize !== winner.raffleTitle);

    return (
        <article className="shine-sweep group h-full flex gap-4 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/[0.09] via-background-secondary to-background-secondary p-4 sm:p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-glow-gold">
            <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-background-primary ring-2 ring-amber-300/60 shadow-glow-gold">
                    <img
                        src={winner.imageUrl || FALLBACK_IMAGE}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                </div>
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-300 text-amber-950 shadow-glow-gold transition-transform duration-300 group-hover:scale-110" aria-hidden>
                    <Trophy className="w-3.5 h-3.5" />
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="neon-gold-text text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Ganador</p>
                <h3 className="mt-1 text-lg font-extrabold text-white truncate">{winner.name}</h3>
                <p className="text-sm text-slate-300">
                    Ganó <span className="font-bold text-white">{prizeTitle}</span>
                    {showPrizeDetail && <span className="text-slate-400"> · {winner.prize}</span>}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" aria-hidden /> Sorteo del {formatDate(winner.drawDate)}
                </p>
            </div>
        </article>
    );
};

export default memo(WinnerCard);
