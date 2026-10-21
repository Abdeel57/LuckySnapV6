import { format as formatDateFns } from 'date-fns';
import { es } from 'date-fns/locale';

/** Moneda en lempiras: "L 1,250.00". Siempre con dos decimales y separador de miles. */
export const formatMoney = (amount: number | undefined | null): string => {
    const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
    return `L ${value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Número de boleto con ceros a la izquierda según el total del sorteo (0007, 0123). */
export const formatTicket = (ticket: number, totalTickets?: number): string => {
    const digits = totalTickets && totalTickets > 0 ? String(totalTickets).length : 0;
    return digits > 0 ? String(ticket).padStart(digits, '0') : String(ticket);
};

/** Fecha corta en español: "29 de noviembre, 2026". */
export const formatDate = (date: Date | string | undefined | null): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return formatDateFns(d, "d 'de' MMMM, yyyy", { locale: es });
};

/** Fecha con hora: "29 de noviembre, 2026 · 5:00 p. m." */
export const formatDateTime = (date: Date | string | undefined | null): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return formatDateFns(d, "d 'de' MMMM, yyyy · h:mm a", { locale: es });
};

/** "1 boleto" / "5 boletos" */
export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
    `${count} ${count === 1 ? singular : plural}`;
