import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Raffle, Pack } from '../types';
import Button from './ui/Button';
import { formatMoney, formatTicket, pluralize } from '../utils/format';
import { buildCheckoutUrl, packLabel, packTicketCount } from '../utils/checkout';

export interface PurchaseSummaryProps {
    raffle: Raffle;
    selectedTickets: number[];
    selectedPack: Pack | null;
    packQuantity: number;
    matchedPack: Pack | null;
    savingsFromPack: number;
    totalPrice: number;
    pricePerTicket: number;
    boletosAdicionales: number;
    onRemoveTicket: (ticket: number) => void;
    onClearPack: () => void;
    /** Oculta el botón de continuar (la barra móvil ya lo muestra). */
    hideAction?: boolean;
}

const Row = ({ label, value, tone = 'default' }: { label: React.ReactNode; value: React.ReactNode; tone?: 'default' | 'accent' }) => (
    <div className="flex items-baseline justify-between gap-4 text-sm">
        <dt className="text-slate-400">{label}</dt>
        <dd className={`tnum font-semibold ${tone === 'accent' ? 'text-accent' : 'text-white'}`}>{value}</dd>
    </div>
);

/**
 * Resumen de la selección actual (boletos o paquete), total y acción para
 * continuar. Se usa en la columna lateral (escritorio) y en la hoja de la barra móvil.
 */
const PurchaseSummary: React.FC<PurchaseSummaryProps> = ({
    raffle, selectedTickets, selectedPack, packQuantity, matchedPack, savingsFromPack,
    totalPrice, pricePerTicket, boletosAdicionales, onRemoveTicket, onClearPack, hideAction,
}) => {
    const ticketsCount = selectedPack ? packTicketCount(selectedPack) * packQuantity : selectedTickets.length;
    const hasSelection = ticketsCount > 0;
    const checkoutUrl = buildCheckoutUrl(raffle.slug || '', selectedPack, packQuantity, selectedTickets);
    const sortedTickets = [...selectedTickets].sort((a, b) => a - b);

    return (
        <div>
            <h2 className="text-base font-extrabold text-white">Tu selección</h2>

            {!hasSelection ? (
                <p className="mt-2 text-sm text-slate-400">Elige tus boletos o un paquete para continuar.</p>
            ) : selectedPack ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{packLabel(selectedPack)}{packQuantity > 1 ? ` × ${packQuantity}` : ''}</p>
                        <p className="text-xs text-slate-400">{pluralize(ticketsCount, 'boleto')} · números asignados al azar al confirmar</p>
                    </div>
                    <button type="button" onClick={onClearPack} className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]" aria-label="Quitar paquete">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <ul className="mt-3 flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar" aria-label="Boletos seleccionados">
                    {sortedTickets.map(ticket => (
                        <li key={ticket}>
                            <button
                                type="button"
                                onClick={() => onRemoveTicket(ticket)}
                                className="tnum inline-flex items-center gap-1 h-9 pl-3 pr-2 rounded-lg bg-action/15 border border-action/40 text-sm font-semibold text-white hover:bg-action/25"
                                aria-label={`Quitar boleto ${formatTicket(ticket, raffle.tickets)}`}
                            >
                                {formatTicket(ticket, raffle.tickets)}
                                <X className="w-3.5 h-3.5 text-slate-300" aria-hidden />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {hasSelection && (
                <dl className="mt-4 space-y-2 border-t border-white/[0.08] pt-4">
                    <Row label="Boletos" value={ticketsCount} />
                    {selectedPack ? (
                        <Row label={packQuantity > 1 ? `Paquete × ${packQuantity}` : 'Paquete'} value={formatMoney(selectedPack.price * packQuantity)} />
                    ) : matchedPack ? (
                        <>
                            <Row label={`${ticketsCount} × ${formatMoney(pricePerTicket)}`} value={formatMoney(ticketsCount * pricePerTicket)} />
                            <Row label={`Descuento · ${packLabel(matchedPack)}`} value={`−${formatMoney(savingsFromPack)}`} tone="accent" />
                        </>
                    ) : (
                        <Row label="Precio por boleto" value={formatMoney(pricePerTicket)} />
                    )}
                    {boletosAdicionales > 0 && (
                        <Row label="Boletos de regalo" value={`+${boletosAdicionales}`} tone="accent" />
                    )}
                    <div className="flex items-baseline justify-between gap-4 border-t border-white/[0.08] pt-3">
                        <dt className="text-base font-extrabold text-white">Total</dt>
                        <dd className="tnum text-2xl font-extrabold text-accent">{formatMoney(totalPrice)}</dd>
                    </div>
                    {boletosAdicionales > 0 && (
                        <p className="text-xs text-slate-400">Recibirás {ticketsCount + boletosAdicionales} boletos en total ({ticketsCount} comprados + {boletosAdicionales} de regalo).</p>
                    )}
                </dl>
            )}

            {!hideAction && (
                <Button to={checkoutUrl} size="lg" fullWidth className="mt-5" disabled={!hasSelection} icon={<ArrowRight className="w-5 h-5" aria-hidden />}>
                    Continuar al pago
                </Button>
            )}
        </div>
    );
};

export default PurchaseSummary;
