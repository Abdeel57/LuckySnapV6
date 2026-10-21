import React, { useMemo, useState } from 'react';
import { Calendar, Gift, Ticket } from 'lucide-react';
import { Raffle } from '../types';
import CountdownTimer from './CountdownTimer';
import ResponsiveImage from './ResponsiveImage';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { formatDate, formatMoney } from '../utils/format';

interface HeroRaffleProps {
    raffle: Raffle;
    showSoldPercentage?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&h=900&fit=crop';

export const collectRaffleImages = (raffle: Raffle): string[] => {
    const images: string[] = [];
    if (raffle.imageUrl) images.push(raffle.imageUrl);
    if (raffle.heroImage && !images.includes(raffle.heroImage)) images.push(raffle.heroImage);
    raffle.gallery?.forEach(img => { if (img && !images.includes(img)) images.push(img); });
    return images.length > 0 ? images : [FALLBACK_IMAGE];
};

const HeroRaffle: React.FC<HeroRaffleProps> = ({ raffle, showSoldPercentage = false }) => {
    const images = useMemo(() => collectRaffleImages(raffle), [raffle.id, raffle.imageUrl, raffle.heroImage, raffle.gallery?.length]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);

    const hasOpportunities = Boolean(raffle.boletosConOportunidades && raffle.numeroOportunidades > 1);
    const hasPacks = Boolean(raffle.packs && raffle.packs.length > 0);
    const isLongDescription = (raffle.description?.length || 0) > 160;
    const sold = typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0;
    const progress = raffle.tickets > 0 ? Math.max(0, Math.min(100, (sold / raffle.tickets) * 100)) : 0;
    const detailUrl = `/sorteo/${raffle.slug}`;

    return (
        <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-5 md:pt-10" aria-labelledby="hero-title">
            {/* grid-cols-1 = minmax(0,1fr): sin él la fila de miniaturas ensancha la columna en móvil (360 px) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10 lg:items-start">
                {/* Imagen */}
                <div className="lg:col-span-7">
                    <div className="relative overflow-hidden rounded-2xl bg-background-secondary aspect-[4/3]">
                        <ResponsiveImage
                            key={images[currentIndex]}
                            src={images[currentIndex]}
                            alt={raffle.title}
                            widths={[640, 960, 1280, 1600]}
                            sizesHint="(min-width: 1024px) 700px, 100vw"
                            preferFormat="auto"
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Fotos del premio">
                            {images.map((img, index) => (
                                <button
                                    key={img}
                                    type="button"
                                    role="tab"
                                    aria-selected={index === currentIndex}
                                    aria-label={`Foto ${index + 1} de ${images.length}`}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                                        index === currentIndex ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    {/* El backend no genera miniaturas: son las fotos completas; prioridad baja para no competir con la principal (LCP) */}
                                    <ResponsiveImage src={img} alt="" widths={[160, 240, 320]} sizesHint="64px" preferFormat="auto" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contenido */}
                <div className="lg:col-span-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">Sorteo activo</p>
                    <h1 id="hero-title" className="text-display font-extrabold text-white">{raffle.title}</h1>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                            <dt className="text-xs font-semibold text-slate-400">Precio por boleto</dt>
                            <dd className="tnum text-2xl font-extrabold text-accent leading-tight">{formatMoney(raffle.price)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold text-slate-400">Fecha del sorteo</dt>
                            <dd className="flex items-center gap-1.5 text-sm font-semibold text-white mt-1"><Calendar className="w-4 h-4 text-slate-400" aria-hidden />{formatDate(raffle.drawDate)}</dd>
                        </div>
                    </dl>

                    {(hasOpportunities || hasPacks) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {hasOpportunities && <Badge tone="accent" icon={<Gift className="w-3.5 h-3.5" aria-hidden />}>{raffle.numeroOportunidades} oportunidades por boleto</Badge>}
                            {hasPacks && <Badge tone="neutral" icon={<Ticket className="w-3.5 h-3.5" aria-hidden />}>Paquetes con descuento</Badge>}
                        </div>
                    )}

                    <div className="mt-5">
                        <p className="text-xs font-semibold text-slate-400 mb-2">Cierra en</p>
                        <CountdownTimer targetDate={raffle.drawDate} variant="blocks" />
                    </div>

                    {showSoldPercentage && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                                <span>{progress.toFixed(0)} % vendido</span>
                                <span className="tnum">{sold.toLocaleString('es-HN')} / {raffle.tickets.toLocaleString('es-HN')}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    <Button to={detailUrl} size="lg" fullWidth className="mt-6" icon={<Ticket className="w-5 h-5" aria-hidden />}>
                        Comprar boletos
                    </Button>

                    {raffle.description && (
                        <div className="mt-5">
                            <p className={`text-[15px] text-slate-300 whitespace-pre-line ${isLongDescription && !descriptionExpanded ? 'line-clamp-3' : ''}`}>
                                {raffle.description}
                            </p>
                            {isLongDescription && (
                                <button
                                    type="button"
                                    onClick={() => setDescriptionExpanded(v => !v)}
                                    className="mt-1 h-10 text-sm font-semibold text-accent hover:underline"
                                    aria-expanded={descriptionExpanded}
                                >
                                    {descriptionExpanded ? 'Leer menos' : 'Leer más'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroRaffle;
