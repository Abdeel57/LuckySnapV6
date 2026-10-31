import React from 'react';

interface SectionHeadingProps {
    /** Etiqueta corta sobre el título (p. ej. "Ya ganaron"). */
    eyebrow?: string;
    title: string;
    lead?: string;
    align?: 'left' | 'center';
    as?: 'h1' | 'h2';
    className?: string;
    /** Acción alineada a la derecha en escritorio (p. ej. "Ver todos"). */
    action?: React.ReactNode;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, lead, align = 'left', as: Tag = 'h2', className = '', action }) => (
    <div className={`${align === 'center' ? 'text-center' : 'sm:flex sm:items-end sm:justify-between sm:gap-6'} mb-6 md:mb-8 ${className}`}>
        <div className={align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}>
            {eyebrow && <p className="text-sm font-extrabold text-action-ink mb-1.5">{eyebrow}</p>}
            <Tag className={`font-display font-semibold text-ink ${Tag === 'h1' ? 'text-display' : 'text-title'}`}>{title}</Tag>
            {lead && <p className="mt-2 text-base text-muted">{lead}</p>}
        </div>
        {action && <div className="mt-4 sm:mt-0 flex-shrink-0">{action}</div>}
    </div>
);

export default SectionHeading;
