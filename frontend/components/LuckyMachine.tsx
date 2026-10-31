import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Button from './ui/Button';
import { formatMoney, formatTicket, pluralize } from '../utils/format';

interface LuckyMachineProps {
    open: boolean;
    onClose: () => void;
    totalTickets: number;
    occupiedTickets: number[];
    pricePerTicket: number;
    onTicketsSelected: (tickets: number[]) => void;
    raffleSlug: string;
}

const QUANTITY_OPTIONS = [1, 3, 5, 10, 25, 50, 100, 150, 200, 250];

/** Selecciona N elementos aleatorios sin repetir (Fisher-Yates parcial). */
const pickRandom = (pool: number[], count: number): number[] => {
    const shuffled = [...pool];
    const picked: number[] = [];
    for (let i = 0; i < count && i < shuffled.length; i++) {
        const j = i + Math.floor(Math.random() * (shuffled.length - i));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        picked.push(shuffled[i]);
    }
    return picked.sort((a, b) => a - b);
};

/** Diálogo "Elegir al azar": escoge N boletos entre los disponibles. */
const LuckyMachine: React.FC<LuckyMachineProps> = ({ open, onClose, totalTickets, occupiedTickets, pricePerTicket, onTicketsSelected, raffleSlug }) => {
    const navigate = useNavigate();
    const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
    const [generatedTickets, setGeneratedTickets] = useState<number[]>([]);
    const dialogRef = useRef<HTMLDivElement>(null);

    const occupiedSet = useMemo(() => new Set(occupiedTickets), [occupiedTickets]);
    const availableTickets = useMemo(
        () => Array.from({ length: totalTickets }, (_, i) => i + 1).filter(ticket => !occupiedSet.has(ticket)),
        [totalTickets, occupiedSet]
    );

    const reset = () => { setSelectedQuantity(null); setGeneratedTickets([]); };

    // Cerrar con Escape, bloquear scroll de fondo y enfocar el diálogo al abrir
    useEffect(() => {
        if (!open) { reset(); return; }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    const pick = () => {
        if (!selectedQuantity || selectedQuantity > availableTickets.length) return;
        setGeneratedTickets(pickRandom(availableTickets, selectedQuantity));
    };

    const applySelection = () => { onTicketsSelected(generatedTickets); onClose(); };
    const goToCheckout = () => {
        onTicketsSelected(generatedTickets);
        navigate(`/comprar/${raffleSlug}?tickets=${generatedTickets.join(',')}`);
        onClose();
    };

    const totalPrice = generatedTickets.length * pricePerTicket;
    const hasResults = generatedTickets.length > 0;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="lucky-title"
                        tabIndex={-1}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface shadow-lift focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 sm:p-6 pb-safe">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 id="lucky-title" className="text-xl font-bold text-ink">Elegir al azar</h2>
                                    <p className="mt-1 text-sm text-muted">Indica cuántos boletos quieres; los números se escogen entre los disponibles.</p>
                                </div>
                                <button type="button" onClick={onClose} className="-mr-2 -mt-2 inline-flex items-center justify-center w-11 h-11 rounded-xl text-muted hover:text-ink hover:bg-ink/5" aria-label="Cerrar">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!hasResults ? (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-ink mb-2">¿Cuántos boletos?</p>
                                    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Cantidad de boletos">
                                        {QUANTITY_OPTIONS.map(quantity => {
                                            const isAvailable = quantity <= availableTickets.length;
                                            const checked = selectedQuantity === quantity;
                                            return (
                                                <button
                                                    key={quantity}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={checked}
                                                    onClick={() => setSelectedQuantity(quantity)}
                                                    disabled={!isAvailable}
                                                    className={`tnum h-12 rounded-xl border-2 font-semibold transition-[background-color,border-color,color] duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
                                                        checked ? 'border-action bg-action text-white' : 'border-line bg-surface text-ink hover:border-ink/30'
                                                    }`}
                                                >
                                                    {quantity}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="tnum mt-3 text-xs text-muted">{availableTickets.length.toLocaleString('es-HN')} boletos disponibles</p>
                                    <Button onClick={pick} disabled={!selectedQuantity} size="lg" fullWidth className="mt-5">
                                        {selectedQuantity ? `Elegir ${pluralize(selectedQuantity, 'boleto')}` : 'Elige una cantidad'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-5 animate-fade-up">
                                    <p className="text-sm font-semibold text-ink">Tus {pluralize(generatedTickets.length, 'boleto')}</p>
                                    <ul className="mt-2 max-h-48 overflow-y-auto flex flex-wrap gap-2 rounded-xl bg-surface-2 p-3" aria-label="Boletos elegidos">
                                        {generatedTickets.map(ticket => (
                                            <li key={ticket} className="tnum inline-flex items-center h-9 px-3 rounded-lg bg-action/20 text-sm font-semibold text-action-ink">
                                                {formatTicket(ticket, totalTickets)}
                                            </li>
                                        ))}
                                    </ul>
                                    <dl className="mt-4 space-y-1.5 text-sm">
                                        <div className="flex justify-between"><dt className="text-muted">{generatedTickets.length} × {formatMoney(pricePerTicket)}</dt><dd className="tnum text-ink font-semibold">{formatMoney(totalPrice)}</dd></div>
                                        <div className="flex justify-between items-baseline border-t border-line pt-2"><dt className="font-bold text-ink">Total</dt><dd className="tnum font-display text-xl font-semibold text-accent">{formatMoney(totalPrice)}</dd></div>
                                    </dl>
                                    <div className="mt-5 space-y-2">
                                        <Button onClick={goToCheckout} size="lg" fullWidth>Continuar al pago</Button>
                                        <Button onClick={applySelection} variant="secondary" fullWidth>Usar estos boletos y seguir viendo</Button>
                                        <Button onClick={reset} variant="ghost" fullWidth>Elegir otros</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LuckyMachine;
