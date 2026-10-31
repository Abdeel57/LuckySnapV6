import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Sin relleno interno (p. ej. para imágenes a sangre). */
    flush?: boolean;
    /** `subtle`: superficie un punto más clara, sin borde, para contenido secundario. */
    tone?: 'default' | 'subtle';
    /** Se eleva al pasar el cursor (listas de tarjetas). */
    hover?: boolean;
}

/** Superficie base del sitio: gris muy oscuro sobre negro, "iluminada desde arriba" (.lit) y esquinas de 24 px. */
const Card: React.FC<CardProps> = ({ flush, tone = 'default', hover, className = '', children, ...rest }) => {
    const surface = tone === 'subtle'
        ? 'bg-surface-2 border border-transparent'
        : 'bg-surface shadow-soft lit';
    const interactive = hover ? 'transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lift lit-hover' : '';
    return (
        <div className={`rounded-3xl ${surface} ${interactive} ${flush ? '' : 'p-5 sm:p-6'} ${className}`} {...rest}>
            {children}
        </div>
    );
};

export default Card;
