import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, X } from 'lucide-react';
import Button from './ui/Button';
import PurchaseSummary, { PurchaseSummaryProps } from './PurchaseSummary';
import { formatMoney, pluralize } from '../utils/format';
import { buildCheckoutUrl, packTicketCount } from '../utils/checkout';

type StickyPurchaseBarProps = Omit<PurchaseSummaryProps, 'hideAction'>;

/**
 * Barra fija inferior para móvil/tablet: resumen en una línea + continuar.
 * Tocar el resumen abre una hoja con el detalle y permite quitar boletos.
 */
const StickyPurchaseBar: React.FC<StickyPurchaseBarProps> = (props) => {
    const { raffle, selectedTickets, selectedPack, packQuantity, totalPrice, boletosAdicionales } = props;
    const [isOpen, setIsOpen] = useState(false);

    const ticketsCount = selectedPack ? packTicketCount(selectedPack) * packQuantity : selectedTickets.length;
    const shouldShow = ticketsCount > 0;
    const checkoutUrl = buildCheckoutUrl(raffle.slug || '', selectedPack, packQuantity, selectedTickets);

    useEffect(() => { if (!shouldShow) setIsOpen(false); }, [shouldShow]);
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    key="sticky-bar"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                    className="lg:hidden fixed inset-x-0 bottom-0 z-40"
                >
                    {isOpen && (
                        <div className="fixed inset-0 bg-black/60" onClick={() => setIsOpen(false)} aria-hidden />
                    )}
                    <div className="relative bg-background-secondary border-t border-white/10 shadow-raised">
                        {isOpen && (
                            <div role="dialog" aria-label="Detalle de tu selección" className="max-h-[60vh] overflow-y-auto px-4 pt-4 pb-2">
                                <div className="flex justify-end -mt-1 mb-1">
                                    <button type="button" onClick={() => setIsOpen(false)} className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]" aria-label="Cerrar detalle">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <PurchaseSummary {...props} hideAction />
                            </div>
                        )}
                        <div className="flex items-center gap-3 px-4 pt-3 pb-safe">
                            <button
                                type="button"
                                onClick={() => setIsOpen(open => !open)}
                                className="flex-1 min-w-0 text-left rounded-xl -mx-2 px-2 py-1"
                                aria-expanded={isOpen}
                            >
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                    {pluralize(ticketsCount, 'boleto')}
                                    {boletosAdicionales > 0 && <span className="text-accent">+{boletosAdicionales} regalo</span>}
                                    <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                                </span>
                                <span className="tnum block text-xl font-extrabold text-white leading-tight">{formatMoney(totalPrice)}</span>
                            </button>
                            <Button to={checkoutUrl} size="md" className="flex-shrink-0 px-6">
                                Continuar
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyPurchaseBar;
