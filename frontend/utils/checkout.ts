import { Pack } from '../types';

/** Boletos que incluye un paquete (el backend guarda `tickets` o `q`). */
export const packTicketCount = (pack: Pack): number => pack.tickets || pack.q || 1;

export const packLabel = (pack: Pack): string => pack.name || `Paquete de ${packTicketCount(pack)} boletos`;

/**
 * URL de la página de compra. El formato de parámetros es el que lee PurchasePage:
 * `pack=<nombre>&quantity=<n>` o `tickets=<n1,n2,...>`.
 */
export const buildCheckoutUrl = (slug: string, selectedPack: Pack | null, packQuantity: number, selectedTickets: number[]): string => {
    const params = new URLSearchParams();
    if (selectedPack) {
        params.append('pack', selectedPack.name || 'pack');
        params.append('quantity', String(packQuantity));
    } else {
        params.append('tickets', selectedTickets.join(','));
    }
    return `/comprar/${slug}?${params.toString()}`;
};
