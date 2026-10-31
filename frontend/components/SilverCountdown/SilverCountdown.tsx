import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CountdownTarget, CountdownTime, getCountdown, parseTargetDate, twoDigits } from './countdown';
import './SilverCountdown.css';

interface SilverCountdownProps {
    /** Date, ms Unix o string ISO con zona horaria explícita. */
    targetDate: CountdownTarget;
    /** Encabezado; vacío para omitirlo. */
    title?: string;
    completedText?: string;
    invalidText?: string;
    /** Aviso visual al llegar a cero, una vez por objetivo mostrado. No decide nada de negocio. */
    onComplete?: () => void;
    /** false = pausar el temporizador (p. ej. fuera de pantalla); al volver a true se recalcula. */
    active?: boolean;
    className?: string;
}

type Clock = { targetMs: number; time: CountdownTime };

const UNITS: Array<[keyof Omit<CountdownTime, 'totalSeconds'>, string]> = [
    ['days', 'DÍAS'],
    ['hours', 'HORAS'],
    ['minutes', 'MIN'],
    ['seconds', 'SEG'],
];

/**
 * Contador de plata: marcos satinados, interior grafito y cifras cromadas en relieve (solo CSS).
 * Es visual: la disponibilidad, el cierre de ventas y el estado del sorteo los decide el backend.
 */
const SilverCountdown: React.FC<SilverCountdownProps> = ({
    targetDate,
    title = 'EL SORTEO COMIENZA EN',
    completedText = 'La cuenta regresiva terminó.',
    invalidText = 'Fecha por confirmar.',
    onComplete,
    active = true,
    className = '',
}) => {
    const titleId = useId();
    const targetMs = useMemo(() => parseTargetDate(targetDate), [targetDate]);
    // Estado inicial neutro (guiones) hasta el primer cálculo en el cliente.
    const [clock, setClock] = useState<Clock | null>(null);
    const completedTarget = useRef<number | null>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (targetMs === null) {
            setClock(null);
            return undefined;
        }

        let timer: number | undefined;
        let cancelled = false;

        // Un solo temporizador alineado al siguiente segundo; se detiene en cero.
        const sync = () => {
            if (cancelled) return;
            const now = Date.now();
            const next = getCountdown(targetMs, now);
            setClock(previous => (
                previous?.targetMs === targetMs && previous.time.totalSeconds === next.totalSeconds
                    ? previous
                    : { targetMs, time: next }
            ));

            if (next.totalSeconds === 0) {
                if (completedTarget.current !== targetMs) {
                    completedTarget.current = targetMs;
                    onCompleteRef.current?.();
                }
                return;
            }

            if (!document.hidden && active) {
                const nextBoundary = (targetMs - now) - (next.totalSeconds - 1) * 1000;
                timer = window.setTimeout(sync, Math.max(30, Math.min(1000, nextBoundary + 12)));
            }
        };

        const onVisibilityChange = () => {
            window.clearTimeout(timer);
            if (!document.hidden) sync();
        };

        sync();
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [targetMs, active]);

    // Al cambiar de sorteo nunca se muestran las cifras del anterior.
    const time = clock?.targetMs === targetMs ? clock.time : null;
    const isInvalid = targetMs === null;
    const isComplete = time?.totalSeconds === 0;
    const accessibleTime = time
        ? `${time.days} días, ${time.hours} horas, ${time.minutes} minutos y ${time.seconds} segundos restantes`
        : (isInvalid ? invalidText : 'Cargando cuenta regresiva');

    return (
        <section
            className={`sc3d ${className}`.trim()}
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Cuenta regresiva del sorteo'}
            data-state={isInvalid ? 'invalid' : isComplete ? 'complete' : time ? 'running' : 'loading'}
        >
            {title && <h2 className="sc3d__heading" id={titleId}>{title}</h2>}
            <div className="sc3d__timer" role="timer" aria-live="off" aria-label={accessibleTime}>
                {UNITS.map(([key, label], index) => {
                    const value = time ? twoDigits(time[key]) : '--';
                    return (
                        <React.Fragment key={key}>
                            {index > 0 && <span className="sc3d__separator" aria-hidden="true" />}
                            <div className="sc3d__unit" aria-hidden="true">
                                <div className="sc3d__tile">
                                    <div className="sc3d__face">
                                        <span
                                            key={value}
                                            className={key === 'seconds' ? 'sc3d__digits sc3d__digits--seconds' : 'sc3d__digits'}
                                            data-value={value}
                                            style={value.length > 2 ? { fontSize: `${220 / value.length}%` } : undefined}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                </div>
                                <span className="sc3d__label">{label}</span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
            {(isInvalid || isComplete) && (
                <p className="sc3d__message" role="status">
                    {isInvalid ? invalidText : completedText}
                </p>
            )}
        </section>
    );
};

export default SilverCountdown;
