import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Sin relleno interno (p. ej. para imágenes a sangre). */
    flush?: boolean;
    /** Superficie más tenue para contenido secundario. */
    tone?: 'default' | 'subtle';
}

/** Superficie base del sitio: fondo secundario, borde sutil y esquinas de 16 px. */
const Card: React.FC<CardProps> = ({ flush, tone = 'default', className = '', children, ...rest }) => (
    <div
        className={`rounded-2xl border ${tone === 'subtle' ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-background-secondary border-white/[0.08]'} ${flush ? '' : 'p-5 sm:p-6'} ${className}`}
        {...rest}
    >
        {children}
    </div>
);

export default Card;
