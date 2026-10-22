import React, { useEffect, useRef, useState } from 'react';

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Retraso en ms para escalonar varios elementos. */
    delay?: number;
    as?: 'div' | 'section' | 'li';
}

// Nunca dejar contenido oculto: si el observador no dispara (capturas, lectores, fallos),
// el elemento se muestra solo pasado este tiempo.
const FALLBACK_MS = 2500;

/**
 * Entra con un desvanecimiento hacia arriba la primera vez que se ve (IntersectionObserver).
 * Sin observer (o con prefers-reduced-motion, vía CSS) simplemente se muestra.
 */
const Reveal: React.FC<RevealProps> = ({ delay = 0, as = 'div', className = '', style, children, ...rest }) => {
    // ElementType: las props genéricas de div valen para section/li sin pelear con los tipos por etiqueta
    const Tag: React.ElementType = as;
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting)) { setShown(true); observer.disconnect(); }
        }, { rootMargin: '0px 0px -8% 0px' });
        observer.observe(el);
        const fallback = setTimeout(() => { setShown(true); observer.disconnect(); }, FALLBACK_MS);
        return () => { observer.disconnect(); clearTimeout(fallback); };
    }, []);

    return (
        <Tag
            ref={ref}
            className={`${shown ? 'animate-fade-up' : 'opacity-0'} ${className}`}
            style={{ animationDelay: delay ? `${delay}ms` : undefined, ...style }}
            {...rest}
        >
            {children}
        </Tag>
    );
};

export default Reveal;
