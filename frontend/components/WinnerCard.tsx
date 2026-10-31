import React, { memo } from 'react';
import { Winner } from '../types';
import { formatDate } from '../utils/format';
import './WinnerCard.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop';

const WinnerCard: React.FC<{ winner: Winner }> = ({ winner }) => {
    const prizeTitle = winner.raffleTitle || winner.prize;
    const showPrizeDetail = Boolean(winner.prize && winner.prize !== winner.raffleTitle);

    // Placa de oro: estilos en WinnerCard.css
    return (
        <article className="gold-card h-full flex gap-4 p-4">
            <div className="flex-shrink-0">
                <div className="gold-card__photo">
                    <img
                        src={winner.imageUrl || FALLBACK_IMAGE}
                        alt=""
                        className="w-[74px] h-[74px] object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                </div>
            </div>
            <div className="min-w-0 flex-1">
                <p className="gold-card__label">Ganador</p>
                <h3 className="gold-card__name mt-0.5 text-base font-extrabold truncate">{winner.name}</h3>
                <p className="gold-card__text mt-0.5 text-sm">
                    Ganó <span className="gold-card__strong">{prizeTitle}</span>
                    {showPrizeDetail && <span> · {winner.prize}</span>}
                </p>
                <p className="gold-card__text mt-2 text-xs font-semibold">
                    Sorteo del {formatDate(winner.drawDate)}
                </p>
            </div>
        </article>
    );
};

export default memo(WinnerCard);
