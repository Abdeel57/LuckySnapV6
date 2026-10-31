import React, { useMemo, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { Raffle } from '../types';
import SilverCountdown from './SilverCountdown/SilverCountdown';
import ResponsiveImage from './ResponsiveImage';
import Button from './ui/Button';
import { formatMoney } from '../utils/format';

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

/** Portada: la foto del premio grande y, al lado, lo necesario para decidir y comprar. */
const HeroRaffle: React.FC<HeroRaffleProps> = ({ raffle, showSoldPercentage = false }) => {
    const images = useMemo(() => collectRaffleImages(raffle), [raffle.id, raffle.imageUrl, raffle.heroImage, raffle.gallery?.length]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    // El contador solo se actualiza cada segundo mientras se ve
    const countdownRef = useRef<HTMLDivElement>(null);
    const countdownInView = useInView(countdownRef);

    const hasOpportunities = Boolean(raffle.boletosConOportunidades && raffle.numeroOportunidades > 1);
    const hasPacks = Boolean(raffle.packs && raffle.packs.length > 0);
    const extras = [
        hasOpportunities && `${raffle.numeroOportunidades} números por boleto`,
        hasPacks && 'Paquetes con descuento',
    ].filter(Boolean).join(' · ');
    const isLongDescription = (raffle.description?.length || 0) > 180;
    const sold = typeof raffle.sold === 'number' && raffle.sold >= 0 ? raffle.sold : 0;
    const progress = raffle.tickets > 0 ? Math.max(0, Math.min(100, (sold / raffle.tickets) * 100)) : 0;
    const detailUrl = `/sorteo/${raffle.slug}`;

    return (
        <section className="container mx-auto px-4 sm:px-6 max-w-6xl pt-6 md:pt-10" aria-labelledby="hero-title">
            {/* grid-cols-1 = minmax(0,1fr): sin él la fila de miniaturas ensancha la columna en móvil */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-12 lg:items-start">
                {/* Imagen (contenido principal, LCP): sin animación de entrada */}
                <div className="lg:col-span-7">
                    <div className="relative isolate">
                        {/* Luz ambiental: la misma foto desenfocada detrás del marco, como si el premio iluminara la página.
                            El desenfoque no cuenta como desbordamiento, así que no provoca scroll horizontal. */}
                        <div className="pointer-events-none absolute -inset-x-3 -inset-y-4 -z-10 opacity-60 blur-[40px] saturate-[1.6]" aria-hidden>
                            <ResponsiveImage key={images[currentIndex]} src={images[currentIndex]} alt="" widths={[320]} sizesHint="320px" preferFormat="auto" decoding="async" fetchPriority="low" className="w-full h-full object-cover rounded-[40px]" />
                        </div>
                        <div className="relative overflow-hidden rounded-[28px] bg-surface-2 aspect-[4/3] shadow-lift lit">
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
                            {/* Sticker sobre la foto: lo que hace especial a este sorteo */}
                            {hasOpportunities && (
                                <span className="absolute left-4 top-4 inline-flex items-center h-9 px-3.5 rounded-full bg-page/85 backdrop-blur text-ink text-sm font-extrabold -rotate-2 shadow-lift">
                                    {raffle.numeroOportunidades} números por boleto
                                </span>
                            )}
                        </div>
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
                                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 bg-surface-2 transition-[border-color,opacity,transform] duration-200 ${
                                        index === currentIndex ? 'border-accent' : 'border-transparent opacity-55 hover:opacity-100 hover:-translate-y-0.5'
                                    }`}
                                >
                                    {/* El backend no genera miniaturas: son las fotos completas; prioridad baja para no competir con la principal */}
                                    <ResponsiveImage src={img} alt="" widths={[160, 240, 320]} sizesHint="72px" preferFormat="auto" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Datos y acción */}
                <div className="lg:col-span-5">
                    <h1 id="hero-title" className="font-display text-[clamp(2rem,2.6vw+0.9rem,3rem)] leading-[1.08] font-semibold text-ink">{raffle.title}</h1>

                    {/* Precio en una sola línea. Sin fecha ni insignias aparte: el contador dice cuándo cierra
                        y los extras van en una línea de texto, para que el bloque sea corto en móvil. */}
                    <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                        <span className="tnum font-display text-4xl font-semibold text-accent leading-none">{formatMoney(raffle.price)}</span>
                        <span className="text-sm font-bold text-muted">por boleto</span>
                    </p>
                    {extras && <p className="mt-2 text-sm font-semibold text-muted">{extras}</p>}

                    {/* Cuenta hasta drawDate (fecha del sorteo, que es cuando cierra); el backend decide el estado real */}
                    <div className="mt-5" ref={countdownRef}>
                        <SilverCountdown
                            targetDate={raffle.drawDate}
                            title="EL SORTEO CIERRA EN"
                            completedText="Sorteo finalizado."
                            invalidText="Fecha del sorteo por confirmar."
                            active={countdownInView}
                        />
                    </div>

                    {showSoldPercentage && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-extrabold text-muted mb-1.5">
                                <span>{progress.toFixed(0)} % vendido</span>
                                <span className="tnum">{sold.toLocaleString('es-HN')} / {raffle.tickets.toLocaleString('es-HN')}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boletos vendidos">
                                <div className="h-full rounded-full bg-gradient-to-r from-accent to-action" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    <Button to={detailUrl} variant="hot" size="lg" fullWidth className="mt-6 uppercase tracking-wide">
                        Comprar boletos
                    </Button>
                    <p className="mt-3 text-center text-xs font-bold text-muted">Pago por transferencia · Comprobante digital con código QR</p>

                    {raffle.description && (
                        <div className="mt-6">
                            <p className="text-xs font-extrabold text-muted mb-2">Sobre este sorteo</p>
                            <p className={`text-[15px] text-ink/85 whitespace-pre-line ${isLongDescription && !descriptionExpanded ? 'line-clamp-4' : ''}`}>
                                {raffle.description}
                            </p>
                            {isLongDescription && (
                                <button
                                    type="button"
                                    onClick={() => setDescriptionExpanded(v => !v)}
                                    className="mt-1 h-10 text-sm font-extrabold text-action-ink hover:underline"
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
