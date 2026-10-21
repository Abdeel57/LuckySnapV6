import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Gift } from 'lucide-react';
import { Raffle } from '../types';
import Badge from './ui/Badge';
import { formatDate, formatMoney } from '../utils/format';

interface RaffleCardProps {
    raffle: Raffle;
    showSoldPercentage?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop';

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle, showSoldPercentage = true }) => {
    const sold = typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0;
    const tickets = typeof raffle.tickets === 'number' && raffle.tickets > 0 ? raffle.tickets : 1;
    const progress = Math.max(0, Math.min(100, (sold / tickets) * 100));
    const detailUrl = `/sorteo/${raffle.slug}`;
    const hasOpportunities = Boolean(raffle.boletosConOportunidades && raffle.numeroOportunidades > 1);

    return (
        <article className="group relative h-full flex flex-col rounded-2xl border border-white/[0.08] bg-background-secondary overflow-hidden transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-action/50 hover:shadow-card-hover focus-within:border-action">
            <Link to={detailUrl} tabIndex={-1} aria-hidden className="block aspect-[4/3] overflow-hidden bg-background-primary">
                <img
                    src={raffle.imageUrl || raffle.heroImage || FALLBACK_IMAGE}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
            </Link>
            <div className="absolute left-3 top-3 ticket-shape rounded-md bg-background-primary/90 border border-white/10 px-4 py-1.5">
                <p className="tnum neon-accent-text text-base font-extrabold text-accent leading-none">{formatMoney(raffle.price)}</p>
            </div>

            <div className="flex flex-col flex-grow p-4 sm:p-5">
                {hasOpportunities && (
                    <Badge tone="accent" icon={<Gift className="w-3.5 h-3.5" aria-hidden />} className="self-start mb-2">
                        {raffle.numeroOportunidades} oportunidades por boleto
                    </Badge>
                )}
                <h3 className="text-lg font-extrabold text-white line-clamp-2">
                    <Link to={detailUrl} className="after:absolute after:inset-0 focus-visible:outline-none">{raffle.title}</Link>
                </h3>

                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-300"><Calendar className="w-4 h-4 text-accent" aria-hidden />{formatDate(raffle.drawDate)}</p>

                {showSoldPercentage && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                            <span>{progress.toFixed(0)} % vendido</span>
                            <span className="tnum">{sold.toLocaleString('es-HN')} / {tickets.toLocaleString('es-HN')}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                            <div className="h-full rounded-full bg-gradient-to-r from-accent to-action" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                <span className="btn-shine mt-4 inline-flex items-center justify-center h-11 rounded-xl bg-white/[0.06] border border-white/15 text-sm font-bold text-white transition-colors group-hover:bg-action group-hover:border-action group-hover:shadow-glow-action" aria-hidden>
                    Ver sorteo
                </span>
            </div>
        </article>
    );
};

export default memo(RaffleCard);
