import React, { useMemo } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { Pack } from '../types';
import { formatMoney, pluralize } from '../utils/format';
import { packLabel, packTicketCount } from '../utils/checkout';

interface PackSelectorProps {
    packs: Pack[];
    pricePerTicket: number;
    onPackSelect: (pack: Pack | null, quantity: number) => void;
    selectedPack: Pack | null;
    selectedQuantity: number;
    /** Boletos disponibles; limita cuántos paquetes se pueden pedir. */
    availableTickets?: number;
    className?: string;
}

const isSamePack = (a: Pack | null, b: Pack) => !!a && (a === b || (a.name === b.name && a.price === b.price && packTicketCount(a) === packTicketCount(b)));

const optionClass = (selected: boolean) =>
    `w-full text-left rounded-xl border-2 bg-surface p-3.5 sm:p-4 transition-[border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 ${
        selected ? 'border-action bg-action/[0.04]' : 'border-line hover:border-ink/25'
    }`;

const RadioMark = ({ checked }: { checked: boolean }) => (
    <span className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${checked ? 'border-action bg-action' : 'border-ink/30 bg-surface'}`} aria-hidden>
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
);

const stepperButton = 'w-11 h-11 inline-flex items-center justify-center text-ink disabled:opacity-40 hover:bg-ink/5';

const PackSelector: React.FC<PackSelectorProps> = ({ packs, pricePerTicket, onPackSelect, selectedPack, selectedQuantity, availableTickets, className = '' }) => {
    const packsWithDiscount = useMemo(() => packs.map(pack => {
        const ticketCount = packTicketCount(pack);
        const individualPrice = ticketCount * pricePerTicket;
        const discount = individualPrice - pack.price;
        const discountPercent = individualPrice > 0 && discount > 0 ? (discount / individualPrice) * 100 : 0;
        return { pack, ticketCount, discount, discountPercent, perTicket: ticketCount > 0 ? pack.price / ticketCount : pack.price };
    }), [packs, pricePerTicket]);

    if (!packs || packs.length === 0) return null;

    const maxQuantity = selectedPack && availableTickets !== undefined
        ? Math.max(1, Math.floor(availableTickets / packTicketCount(selectedPack)))
        : 99;

    return (
        <div className={className} role="radiogroup" aria-label="Forma de compra">
            <div className="space-y-2">
                <button type="button" role="radio" aria-checked={!selectedPack} onClick={() => onPackSelect(null, 1)} className={optionClass(!selectedPack)}>
                    <div className="flex items-start gap-3">
                        <RadioMark checked={!selectedPack} />
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-ink">Boletos individuales</p>
                                <p className="text-sm text-muted">Elige tus números en la tabla</p>
                            </div>
                            <p className="tnum text-right flex-shrink-0">
                                <span className="block font-bold text-ink">{formatMoney(pricePerTicket)}</span>
                                <span className="block text-xs text-muted">por boleto</span>
                            </p>
                        </div>
                    </div>
                </button>

                {packsWithDiscount.map(({ pack, ticketCount, discount, discountPercent, perTicket }, index) => {
                    const checked = isSamePack(selectedPack, pack);
                    return (
                        <div key={`${pack.name || 'pack'}-${index}`} className={optionClass(checked)}>
                            <button type="button" role="radio" aria-checked={checked} onClick={() => onPackSelect(checked ? null : pack, 1)} className="w-full text-left focus-visible:outline-none">
                                <div className="flex items-start gap-3">
                                    <RadioMark checked={checked} />
                                    <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-ink">{packLabel(pack)}</p>
                                            <p className="text-sm text-muted">
                                                {pluralize(ticketCount, 'boleto')} · números al azar
                                                {discount > 0 && <span className="text-accent-ink font-semibold"> · ahorras {formatMoney(discount)} ({discountPercent.toFixed(0)} %)</span>}
                                            </p>
                                        </div>
                                        <p className="tnum text-right flex-shrink-0">
                                            <span className="block font-bold text-ink">{formatMoney(pack.price)}</span>
                                            <span className="block text-xs text-muted">{formatMoney(perTicket)} c/u</span>
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {checked && (
                                <div className="mt-3 ml-8 flex items-center justify-between gap-3">
                                    <span className="text-sm text-muted">Cantidad de paquetes</span>
                                    <div className="inline-flex items-center rounded-xl border border-line bg-surface overflow-hidden" role="group" aria-label="Cantidad de paquetes">
                                        <button type="button" onClick={() => onPackSelect(pack, Math.max(1, selectedQuantity - 1))} disabled={selectedQuantity <= 1} className={stepperButton} aria-label="Menos paquetes">
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="tnum w-10 text-center font-bold text-ink" aria-live="polite">{selectedQuantity}</span>
                                        <button type="button" onClick={() => onPackSelect(pack, Math.min(maxQuantity, selectedQuantity + 1))} disabled={selectedQuantity >= maxQuantity} className={stepperButton} aria-label="Más paquetes">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PackSelector;
