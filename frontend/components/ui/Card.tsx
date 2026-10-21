import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Sin relleno interno (p. ej. para imágenes a sangre). */
    flush?: boolean;
    /** Superficie más tenue para contenido secundario. */
    tone?: 'default' | 'subtle';
    /** Borde degradado acción → acento (tarjetas protagonistas). */
    glow?: boolean;
    /** Se eleva y brilla al pasar el cursor (listas de tarjetas). */
    hover?: boolean;
}

/** Superficie base del sitio: fondo secundario, borde sutil y esquinas de 16 px. */
const Card: React.FC<CardProps> = ({ flush, tone = 'default', glow, hover, className = '', children, ...rest }) => {
    const surface = glow
        ? 'glow-border bg-background-secondary'
        : tone === 'subtle'
            ? 'bg-white/[0.03] border border-white/[0.06]'
            : 'bg-background-secondary border border-white/[0.08]';
    const interactive = hover ? 'transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-card-hover' : '';
    return (
        <div className={`rounded-2xl ${surface} ${interactive} ${flush ? '' : 'p-5 sm:p-6'} ${className}`} {...rest}>
            {children}
        </div>
    );
};

export default Card;
