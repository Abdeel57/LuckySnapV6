import React from 'react';

interface SectionHeadingProps {
    /** Etiqueta corta sobre el título (p. ej. "Sorteo activo"). */
    eyebrow?: string;
    title: string;
    lead?: string;
    align?: 'left' | 'center';
    as?: 'h1' | 'h2';
    /** Tono del acento decorativo. */
    tone?: 'action' | 'gold';
    className?: string;
    /** Acción alineada a la derecha en escritorio (p. ej. "Ver todos"). */
    action?: React.ReactNode;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, lead, align = 'left', as: Tag = 'h2', tone = 'action', className = '', action }) => {
    const dash = tone === 'gold' ? 'from-amber-300 to-amber-300/0' : 'from-action to-accent/0';
    const eyebrowColor = tone === 'gold' ? 'text-amber-300' : 'text-accent';
    return (
        <div className={`${align === 'center' ? 'text-center' : 'sm:flex sm:items-end sm:justify-between sm:gap-6'} mb-6 md:mb-8 ${className}`}>
            <div className={align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}>
                <span className={`block h-1 w-12 rounded-full bg-gradient-to-r ${dash} mb-3 ${align === 'center' ? 'mx-auto' : ''}`} aria-hidden />
                {eyebrow && <p className={`text-xs font-bold uppercase tracking-[0.16em] ${eyebrowColor} mb-2`}>{eyebrow}</p>}
                <Tag className={`font-display font-bold text-white ${Tag === 'h1' ? 'text-[clamp(1.7rem,3.6vw+0.6rem,2.6rem)] leading-[1.1] neon-text' : 'text-[clamp(1.35rem,1.8vw+0.6rem,1.9rem)] leading-[1.15]'}`}>{title}</Tag>
                {lead && <p className="mt-2 text-base text-slate-400">{lead}</p>}
            </div>
            {action && <div className="mt-4 sm:mt-0 flex-shrink-0">{action}</div>}
        </div>
    );
};

export default SectionHeading;
