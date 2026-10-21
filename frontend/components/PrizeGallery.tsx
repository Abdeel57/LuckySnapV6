import React from 'react';
import ResponsiveImage from './ResponsiveImage';
import SectionHeading from './ui/SectionHeading';

interface PrizeGalleryProps {
    images: string[];
    title: string;
}

/** Tira de fotos del premio con desplazamiento por tarjetas (snap). Solo si hay más de una foto. */
const PrizeGallery: React.FC<PrizeGalleryProps> = ({ images, title }) => {
    if (images.length < 2) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <SectionHeading eyebrow="El premio" title="Míralo de cerca" lead={title} />
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2" role="list" aria-label="Fotos del premio">
                {images.map((img, index) => (
                    <figure key={`${img}-${index}`} role="listitem" className="snap-center flex-shrink-0 w-[82%] sm:w-[48%] lg:w-[32%]">
                        <div className="glow-border-soft rounded-2xl p-1 transition-transform duration-300 hover:-translate-y-1">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-background-secondary">
                                <ResponsiveImage src={img} alt={`${title} — foto ${index + 1}`} widths={[480, 768, 1024]} sizesHint="(min-width: 1024px) 380px, 82vw" preferFormat="auto" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <figcaption className="tnum mt-2 text-xs font-bold text-slate-400">Foto {index + 1} de {images.length}</figcaption>
                    </figure>
                ))}
            </div>
        </div>
    );
};

export default PrizeGallery;
