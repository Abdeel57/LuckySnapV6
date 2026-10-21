import React, { memo } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Winner } from '../types';
import { formatDate } from '../utils/format';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop';

const WinnerCard: React.FC<{ winner: Winner }> = ({ winner }) => {
    const prizeTitle = winner.raffleTitle || winner.prize;
    const showPrizeDetail = Boolean(winner.prize && winner.prize !== winner.raffleTitle);

    return (
        <article className="h-full flex gap-4 rounded-2xl border border-white/[0.08] bg-background-secondary p-4 sm:p-5">
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-background-primary border border-white/[0.08]">
                <img
                    src={winner.imageUrl || FALLBACK_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
                    <Trophy className="w-3.5 h-3.5" aria-hidden /> Ganador
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-white truncate">{winner.name}</h3>
                <p className="text-sm text-slate-300">
                    Ganó <span className="font-semibold text-white">{prizeTitle}</span>
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
