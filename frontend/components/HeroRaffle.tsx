import React, { useMemo, useState } from 'react';
import { Calendar, Gift, Sparkles, Ticket } from 'lucide-react';
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

/** Punto "en vivo": halo que se expande (1 elemento en bucle). */
export const LiveDot = () => (
    <span className="relative inline-flex w-2.5 h-2.5 mr-2" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" />
        <span className="relative rounded-full w-2.5 h-2.5 bg-accent shadow-neon-accent" />
    </span>
);

const HeroRaffle: React.FC<HeroRaffleProps> = ({ raffle, showSoldPercentage = false }) => {
    const images = useMemo(() => collectRaffleImages(raffle), [raffle.id, raffle.imageUrl, raffle.heroImage, raffle.gallery?.length]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);

    const hasOpportunities = Boolean(raffle.boletosConOportunidades && raffle.numeroOportunidades > 1);
    const hasPacks = Boolean(raffle.packs && raffle.packs.length > 0);
    const isLongDescription = (raffle.description?.length || 0) > 220;
    const sold = typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0;
    const progress = raffle.tickets > 0 ? Math.max(0, Math.min(100, (sold / raffle.tickets) * 100)) : 0;
    const detailUrl = `/sorteo/${raffle.slug}`;

    return (
        <section className="relative container mx-auto px-4 sm:px-6 max-w-6xl pt-6 md:pt-12" aria-labelledby="hero-title">
            {/* Foco de escenario detrás del héroe (degradado estático, sin filtros) */}
            <div className="pointer-events-none absolute -z-10 inset-x-0 -top-10 h-[540px] bg-[radial-gradient(40rem_22rem_at_28%_10%,rgb(var(--color-action)/0.28),transparent_62%),radial-gradient(28rem_18rem_at_85%_30%,rgb(var(--color-accent)/0.16),transparent_60%)]" aria-hidden />

            {/* grid-cols-1 = minmax(0,1fr): sin él la fila de miniaturas ensancha la columna en móvil (360 px) */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-10 lg:items-start">
                {/* Imagen */}
                <div className="lg:col-span-7 animate-fade-up">
                    <div className="relative">
                        {/* Aro de ruleta girando (decorativo, escritorio) */}
                        <svg className="hidden lg:block pointer-events-none absolute -top-12 -right-12 w-44 h-44 text-action/60 animate-spin-slow" viewBox="0 0 100 100" fill="none" aria-hidden>
                            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 7" />
                            <circle cx="50" cy="50" r="34" stroke="rgb(var(--color-accent) / 0.5)" strokeWidth="1" strokeDasharray="2 6" />
                        </svg>

                        {/* Marquesina de bombillas alrededor del premio */}
                        <div className="marquee-frame mx-2.5 my-2.5">
                            <div className="glow-border relative rounded-[20px] p-1.5 shadow-glow-action">
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
                                    {/* Viñeta inferior para que el chip de precio lea bien sobre cualquier foto */}
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
                                    <div className="absolute left-4 bottom-4 flex items-end gap-2">
                                        <div className="ticket-shape rounded-lg bg-background-primary/90 backdrop-blur-sm border border-white/10 px-5 py-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">Boleto</p>
                                            <p className="tnum font-display neon-accent-text text-2xl sm:text-3xl font-bold text-accent leading-none">{formatMoney(raffle.price)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {images.length > 1 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Fotos del premio">
                            {images.map((img, index) => (
                                <button
                                    key={img}
                                    type="button"
                                    role="tab"
                                    aria-selected={index === currentIndex}
                                    aria-label={`Foto ${index + 1} de ${images.length}`}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-[border-color,opacity,transform] duration-200 ${
                                        index === currentIndex ? 'border-accent shadow-glow-accent scale-105' : 'border-transparent opacity-60 hover:opacity-100'
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
                <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
                    <p className="inline-flex items-center text-xs font-bold uppercase tracking-[0.16em] text-accent mb-3">
                        <LiveDot />Sorteo activo
                    </p>
                    <h1 id="hero-title" className="font-display neon-text text-[clamp(1.7rem,3.6vw+0.6rem,2.6rem)] leading-[1.1] font-bold text-white">{raffle.title}</h1>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Precio por boleto</dt>
                            <dd className="tnum font-display neon-accent-text text-2xl font-bold text-accent leading-tight">{formatMoney(raffle.price)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Fecha del sorteo</dt>
                            <dd className="flex items-center gap-1.5 text-sm font-bold text-white mt-1"><Calendar className="w-4 h-4 text-accent" aria-hidden />{formatDate(raffle.drawDate)}</dd>
                        </div>
                    </dl>

                    {(hasOpportunities || hasPacks) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {hasOpportunities && <Badge tone="accent" icon={<Gift className="w-3.5 h-3.5" aria-hidden />}>{raffle.numeroOportunidades} oportunidades por boleto</Badge>}
                            {hasPacks && <Badge tone="gold" icon={<Sparkles className="w-3.5 h-3.5" aria-hidden />}>Paquetes con descuento</Badge>}
                        </div>
                    )}
                    {hasOpportunities && (
                        <p className="mt-2 text-sm text-slate-300">
                            Con cada boleto juegas con <span className="tnum font-bold text-white">{raffle.numeroOportunidades}</span> números: {raffle.numeroOportunidades - 1} de regalo.
                        </p>
                    )}

                    <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Cierra en</p>
                        <CountdownTimer targetDate={raffle.drawDate} variant="blocks" />
                    </div>

                    {showSoldPercentage && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                                <span>{progress.toFixed(0)} % vendido</span>
                                <span className="tnum">{sold.toLocaleString('es-HN')} / {raffle.tickets.toLocaleString('es-HN')}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                                <div className="h-full rounded-full bg-gradient-to-r from-accent to-action shadow-neon-accent" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    <Button to={detailUrl} size="lg" fullWidth shine className="mt-6" icon={<Ticket className="w-5 h-5" aria-hidden />}>
                        Comprar boletos
                    </Button>

                    {/* La historia del sorteo, con voz propia (texto del admin) */}
                    {raffle.description && (
                        <div className="relative mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 pl-6">
                            <span className="font-display absolute -top-3 left-4 text-5xl leading-none text-accent/80 select-none" aria-hidden>“</span>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">Sobre este sorteo</p>
                            <p className={`text-[15px] text-slate-200 whitespace-pre-line ${isLongDescription && !descriptionExpanded ? 'line-clamp-4' : ''}`}>
                                {raffle.description}
                            </p>
                            {isLongDescription && (
                                <button
                                    type="button"
                                    onClick={() => setDescriptionExpanded(v => !v)}
                                    className="mt-1 h-10 text-sm font-bold text-accent hover:underline"
                                    aria-expanded={descriptionExpanded}
                                >
                                    {descriptionExpanded ? 'Leer menos' : 'Leer la historia completa'}
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
