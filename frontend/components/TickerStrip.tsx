import React from 'react';

export interface TickerItem {
    icon: React.ReactNode;
    text: string;
}

interface TickerStripProps {
    items: TickerItem[];
    className?: string;
}

/**
 * Cinta deslizante con datos reales del sorteo (precio, fecha, oportunidades…).
 * Se repite dos veces para un bucle continuo; se pausa al pasar el cursor y
 * se detiene con prefers-reduced-motion.
 */
const TickerStrip: React.FC<TickerStripProps> = ({ items, className = '' }) => {
    if (items.length === 0) return null;
    const sequence = [...items, ...items];
    return (
        <div className={`glow-border-soft rounded-full py-2.5 ${className}`} role="marquee" aria-label="Datos del sorteo">
            <div className="ticker">
                <div className="ticker__track">
                    {sequence.map((item, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-5 text-sm font-bold text-white whitespace-nowrap" aria-hidden={index >= items.length}>
                            <span className="text-accent">{item.icon}</span>
                            {item.text}
                            <span className="ml-5 w-1.5 h-1.5 rounded-full bg-action/80" aria-hidden />
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TickerStrip;
