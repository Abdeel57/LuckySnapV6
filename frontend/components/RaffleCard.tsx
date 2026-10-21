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
        <article className="group relative h-full flex flex-col rounded-2xl border border-white/[0.08] bg-background-secondary overflow-hidden transition-colors hover:border-white/20 focus-within:border-action">
            <Link to={detailUrl} tabIndex={-1} aria-hidden className="block aspect-[4/3] overflow-hidden bg-background-primary">
                <img
                    src={raffle.imageUrl || raffle.heroImage || FALLBACK_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
            </Link>

            <div className="flex flex-col flex-grow p-4 sm:p-5">
                {hasOpportunities && (
                    <Badge tone="accent" icon={<Gift className="w-3.5 h-3.5" aria-hidden />} className="self-start mb-2">
                        {raffle.numeroOportunidades} oportunidades por boleto
                    </Badge>
                )}
                <h3 className="text-lg font-extrabold text-white line-clamp-2">
                    <Link to={detailUrl} className="after:absolute after:inset-0 focus-visible:outline-none">{raffle.title}</Link>
                </h3>

                <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Por boleto</p>
                        <p className="tnum text-xl font-extrabold text-accent leading-tight">{formatMoney(raffle.price)}</p>
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-slate-300"><Calendar className="w-4 h-4 text-slate-400" aria-hidden />{formatDate(raffle.drawDate)}</p>
                </div>

                {showSoldPercentage && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                            <span>{progress.toFixed(0)} % vendido</span>
                            <span className="tnum">{sold.toLocaleString('es-HN')} / {tickets.toLocaleString('es-HN')}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                <span className="mt-4 inline-flex items-center justify-center h-11 rounded-xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-white group-hover:bg-white/10 transition-colors" aria-hidden>
                    Ver sorteo
                </span>
            </div>
        </article>
    );
};

export default memo(RaffleCard);
