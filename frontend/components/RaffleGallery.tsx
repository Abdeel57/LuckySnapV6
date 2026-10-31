import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RaffleGalleryProps {
    images: string[];
    title: string;
    className?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop';
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; };

const arrowClass = 'absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-surface/90 text-ink shadow-soft backdrop-blur-sm hover:bg-surface transition-colors';
const lightboxArrowClass = 'absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white border border-white/15 hover:bg-white/20 transition-colors';

const RaffleGallery: React.FC<RaffleGalleryProps> = ({ images, title, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const hasMany = images.length > 1;

    const next = useCallback(() => setCurrentIndex(prev => (prev + 1) % images.length), [images.length]);
    const prev = useCallback(() => setCurrentIndex(prev => (prev - 1 + images.length) % images.length), [images.length]);

    useEffect(() => {
        if (!isModalOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsModalOpen(false);
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [isModalOpen, next, prev]);

    if (!images || images.length === 0) {
        return (
            <div className={`aspect-[4/3] rounded-3xl bg-surface-2 flex items-center justify-center ${className}`}>
                <span className="text-sm text-muted">Sin imágenes</span>
            </div>
        );
    }

    return (
        <>
            <div className={`relative isolate ${className}`}>
                {/* Luz ambiental: la foto actual desenfocada detrás del marco (misma URL, ya en caché) */}
                <div className="pointer-events-none absolute -inset-x-3 -inset-y-4 -z-10 opacity-60 blur-[40px] saturate-[1.6]" aria-hidden>
                    <img key={`ambient-${images[currentIndex]}`} src={images[currentIndex] || FALLBACK_IMAGE} alt="" className="w-full h-full object-cover rounded-[40px]" decoding="async" fetchPriority="low" onError={onImgError} />
                </div>
                <div className="relative overflow-hidden rounded-3xl bg-surface-2 aspect-[4/3] shadow-soft lit">
                    <img
                        key={images[currentIndex]}
                        src={images[currentIndex] || FALLBACK_IMAGE}
                        alt={`${title} — foto ${currentIndex + 1} de ${images.length}`}
                        className="w-full h-full object-cover"
                        onError={onImgError}
                        decoding="async"
                        fetchPriority="high"
                    />
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-surface/90 text-ink text-xs font-semibold shadow-soft backdrop-blur-sm hover:bg-surface"
                    >
                        <Maximize2 className="w-3.5 h-3.5" aria-hidden />
                        <span className="sr-only">Ver en pantalla completa, foto </span>
                        {hasMany ? <span className="tnum">{currentIndex + 1}/{images.length}</span> : 'Ampliar'}
                    </button>
                    {hasMany && (
                        <>
                            <button type="button" onClick={prev} className={`${arrowClass} left-3`} aria-label="Foto anterior"><ChevronLeft className="w-5 h-5" /></button>
                            <button type="button" onClick={next} className={`${arrowClass} right-3`} aria-label="Siguiente foto"><ChevronRight className="w-5 h-5" /></button>
                        </>
                    )}
                </div>

                {hasMany && (
                    <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Fotos del premio">
                        {images.map((image, index) => (
                            <button
                                key={`${image}-${index}`}
                                type="button"
                                role="tab"
                                aria-selected={index === currentIndex}
                                aria-label={`Foto ${index + 1}`}
                                onClick={() => setCurrentIndex(index)}
                                className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 bg-surface-2 transition-[border-color,opacity] ${index === currentIndex ? 'border-action' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                {/* Fotos completas (no hay miniaturas en el backend): prioridad baja frente a la principal */}
                                <img src={image || FALLBACK_IMAGE} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" fetchPriority="low" onError={onImgError} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${title} — galería`}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-3 sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 sm:top-5 sm:right-5 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Cerrar">
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            key={images[currentIndex]}
                            src={images[currentIndex] || FALLBACK_IMAGE}
                            alt={`${title} — foto ${currentIndex + 1} de ${images.length}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            decoding="async"
                            onClick={(e) => e.stopPropagation()}
                            onError={onImgError}
                        />
                        {hasMany && (
                            <>
                                <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className={`${lightboxArrowClass} left-3 sm:left-6`} aria-label="Foto anterior"><ChevronLeft className="w-5 h-5" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className={`${lightboxArrowClass} right-3 sm:right-6`} aria-label="Siguiente foto"><ChevronRight className="w-5 h-5" /></button>
                                <p className="tnum absolute bottom-4 left-1/2 -translate-x-1/2 h-8 px-3 inline-flex items-center rounded-full bg-white/10 text-white text-xs font-semibold">{currentIndex + 1} de {images.length}</p>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RaffleGallery;
