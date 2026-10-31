import React, { memo } from 'react';
import { Link } from 'react-router-dom';
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
        <article className="group relative h-full flex flex-col rounded-3xl bg-surface shadow-soft lit lit-hover overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-within:ring-2 focus-within:ring-action">
            <Link to={detailUrl} tabIndex={-1} aria-hidden className="block aspect-[4/3] overflow-hidden bg-surface-2">
                <img
                    src={raffle.imageUrl || raffle.heroImage || FALLBACK_IMAGE}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
            </Link>

            <div className="flex flex-col flex-grow p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-ink line-clamp-2">
                        <Link to={detailUrl} className="after:absolute after:inset-0 focus-visible:outline-none">{raffle.title}</Link>
                    </h3>
                    <p className="tnum flex-shrink-0 font-display text-lg font-semibold text-accent leading-tight">{formatMoney(raffle.price)}</p>
                </div>

                {hasOpportunities && (
                    <Badge tone="accent" className="self-start mt-2">
                        {raffle.numeroOportunidades} oportunidades por boleto
                    </Badge>
                )}

                <p className="mt-2 text-sm text-muted">Sorteo el {formatDate(raffle.drawDate)}</p>

                {showSoldPercentage && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold text-muted mb-1.5">
                            <span>{progress.toFixed(0)} % vendido</span>
                            <span className="tnum">{sold.toLocaleString('es-HN')} / {tickets.toLocaleString('es-HN')}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ink/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                <span className="mt-4 text-sm font-semibold text-action-ink group-hover:underline" aria-hidden>Ver sorteo</span>
            </div>
        </article>
    );
};

export default memo(RaffleCard);
