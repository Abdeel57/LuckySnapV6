/** Fecha objetivo aceptada: Date, milisegundos Unix o ISO con zona explícita (Z u offset). */
export type CountdownTarget = Date | number | string | null | undefined;

export interface CountdownTime {
    totalSeconds: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Devuelve el instante en ms o null si no es válido. Las cadenas sin zona horaria se
 * rechazan a propósito: interpretarlas con la hora del dispositivo daría cuentas distintas
 * en cada teléfono. El backend entrega `drawDate` como ISO en UTC (…Z) y `services/api`
 * ya lo convierte a Date, así que ambos formatos entran por aquí.
 */
export function parseTargetDate(value: CountdownTarget): number | null {
    if (value instanceof Date) {
        const time = value.getTime();
        return Number.isFinite(time) ? time : null;
    }
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) return null;
    const time = Date.parse(text);
    return Number.isFinite(time) ? time : null;
}

/** Se calcula desde el instante real: no acumula restas ni valores negativos. */
export function getCountdown(targetMs: number, nowMs: number = Date.now()): CountdownTime {
    const totalSeconds = Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
    return {
        totalSeconds,
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    };
}

export function twoDigits(value: number): string {
    return String(value).padStart(2, '0');
}
