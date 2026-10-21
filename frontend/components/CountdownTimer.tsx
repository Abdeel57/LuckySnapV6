import React, { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '../utils/format';

interface CountdownTimerProps {
    targetDate: Date | string;
    /** `blocks`: cuatro celdas con etiqueta (hero/detalle). `inline`: una línea compacta (tarjetas, barra). */
    variant?: 'blocks' | 'inline';
    className?: string;
}

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number; finished: boolean };

const getTimeLeft = (target: Date | null): TimeLeft => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
    const totalSeconds = Math.floor(diffMs / 1000);
    return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor(totalSeconds / 3600) % 24,
        minutes: Math.floor(totalSeconds / 60) % 60,
        seconds: totalSeconds % 60,
        finished: false,
    };
};

const pad = (n: number) => String(n).padStart(2, '0');

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, variant = 'blocks', className = '' }) => {
    const target = useMemo(() => {
        const date = new Date(targetDate);
        return isNaN(date.getTime()) ? null : date;
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

    useEffect(() => {
        setTimeLeft(getTimeLeft(target));
        if (!target) return;
        const timer = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
        return () => clearInterval(timer);
    }, [target]);

    if (!target) {
        return <p className={`text-sm text-slate-400 ${className}`}>Fecha del sorteo por confirmar</p>;
    }

    if (timeLeft.finished) {
        return (
            <p className={`inline-flex items-center h-9 px-3 rounded-full bg-white/[0.08] text-sm font-bold text-white ${className}`}>
                Sorteo finalizado
            </p>
        );
    }

    const units = [
        { label: 'días', short: 'd', value: timeLeft.days, pad: timeLeft.days > 99 ? 3 : 2 },
        { label: 'horas', short: 'h', value: timeLeft.hours, pad: 2 },
        { label: 'min', short: 'm', value: timeLeft.minutes, pad: 2 },
        { label: 'seg', short: 's', value: timeLeft.seconds, pad: 2 },
    ];
    const accessible = `Faltan ${timeLeft.days} días, ${timeLeft.hours} horas y ${timeLeft.minutes} minutos. Sorteo: ${formatDateTime(target)}`;

    if (variant === 'inline') {
        return (
            <span className={`tnum inline-flex items-baseline gap-1.5 font-bold text-white ${className}`} aria-label={accessible} title={formatDateTime(target)}>
                {units.map((u, i) => (
                    <span key={u.label} className="inline-flex items-baseline">
                        {String(u.value).padStart(u.pad, '0')}<span className="text-slate-400 font-semibold text-[0.85em] ml-0.5">{u.short}</span>
                        {i < units.length - 1 && <span className="sr-only">, </span>}
                    </span>
                ))}
            </span>
        );
    }

    return (
        <div className={className} role="timer" aria-live="off" aria-label={accessible}>
            <div className="flex items-stretch justify-between gap-1.5 sm:gap-2">
                {units.map((u, i) => (
                    <React.Fragment key={u.label}>
                        <div className="glow-border-soft flex-1 min-w-0 rounded-xl py-2.5 sm:py-3 text-center">
                            {/* key por valor: el dígito "salta" al cambiar. Los segundos no saltan ni llevan halo:
                                re-renderizar con animación y text-shadow cada segundo costaba ~130 ms/s con CPU lenta */}
                            <div key={u.value} className={`tnum font-display text-[1.35rem] sm:text-3xl font-bold text-white leading-none ${u.label === 'seg' ? '' : 'neon-text animate-pop'}`}>
                                {String(u.value).padStart(u.pad, '0')}
                            </div>
                            <div className="mt-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{u.label}</div>
                        </div>
                        {i < units.length - 1 && (
                            <span className="self-center -mt-4 text-xl font-extrabold text-accent/70" aria-hidden>:</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export { pad };
export default CountdownTimer;
