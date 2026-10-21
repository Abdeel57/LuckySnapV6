import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, Shuffle, X } from 'lucide-react';
import Button from './ui/Button';
import { formatMoney, formatTicket, pluralize } from '../utils/format';
import { useOptimizedAnimations } from '../utils/deviceDetection';

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

/** Modal "Elegir al azar": escoge N boletos entre los disponibles. */
const LuckyMachine: React.FC<LuckyMachineProps> = ({ open, onClose, totalTickets, occupiedTickets, pricePerTicket, onTicketsSelected, raffleSlug }) => {
    const navigate = useNavigate();
    const reduceAnimations = useOptimizedAnimations();
    const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [generatedTickets, setGeneratedTickets] = useState<number[]>([]);
    const dialogRef = useRef<HTMLDivElement>(null);

    const occupiedSet = useMemo(() => new Set(occupiedTickets), [occupiedTickets]);
    const availableTickets = useMemo(
        () => Array.from({ length: totalTickets }, (_, i) => i + 1).filter(ticket => !occupiedSet.has(ticket)),
        [totalTickets, occupiedSet]
    );

    const reset = () => { setSelectedQuantity(null); setGeneratedTickets([]); setIsSpinning(false); };

    // Cerrar con Escape, bloquear scroll de fondo y enfocar el diálogo al abrir
    useEffect(() => {
        if (!open) { reset(); return; }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSpinning) onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, isSpinning, onClose]);

    const spin = () => {
        if (!selectedQuantity || selectedQuantity > availableTickets.length) return;
        setIsSpinning(true);
        setGeneratedTickets([]);
        const pick = () => {
            const shuffled = [...availableTickets].sort(() => Math.random() - 0.5);
            setGeneratedTickets(shuffled.slice(0, selectedQuantity).sort((a, b) => a - b));
            setIsSpinning(false);
        };
        if (reduceAnimations) pick(); else setTimeout(pick, 1200);
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
                    onClick={() => !isSpinning && onClose()}
                >
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="lucky-title"
                        tabIndex={-1}
                        initial={reduceAnimations ? { opacity: 0 } : { opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceAnimations ? { opacity: 0 } : { opacity: 0, y: 24 }}
                        transition={{ duration: 0.18 }}
                        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-background-secondary border border-white/10 shadow-2xl focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 sm:p-6 pb-safe">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 id="lucky-title" className="text-xl font-extrabold text-white flex items-center gap-2">
                                        <Shuffle className="w-5 h-5 text-accent" aria-hidden /> Elegir al azar
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-400">Indica cuántos boletos quieres; los números se escogen entre los disponibles.</p>
                                </div>
                                <button type="button" onClick={onClose} disabled={isSpinning} className="-mr-2 -mt-2 inline-flex items-center justify-center w-11 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-40" aria-label="Cerrar">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!hasResults && !isSpinning && (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-slate-200 mb-2">¿Cuántos boletos?</p>
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
                                                    className={`tnum h-12 rounded-xl border-2 font-extrabold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                                        checked ? 'border-action bg-action text-white' : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/30'
                                                    }`}
                                                >
                                                    {quantity}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="tnum mt-3 text-xs text-slate-400">{availableTickets.length.toLocaleString('es-HN')} boletos disponibles</p>
                                    <Button onClick={spin} disabled={!selectedQuantity} size="lg" fullWidth className="mt-5" icon={<Shuffle className="w-5 h-5" aria-hidden />}>
                                        {selectedQuantity ? `Elegir ${pluralize(selectedQuantity, 'boleto')}` : 'Elige una cantidad'}
                                    </Button>
                                </div>
                            )}

                            {isSpinning && (
                                <div className="my-10 flex flex-col items-center gap-4" role="status" aria-live="polite">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                        className="w-16 h-16 rounded-full border-4 border-white/10 border-t-accent"
                                        aria-hidden
                                    />
                                    <p className="font-semibold text-white">Escogiendo tus números…</p>
                                </div>
                            )}

                            {hasResults && (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-slate-200">Tus {pluralize(generatedTickets.length, 'boleto')}</p>
                                    <ul className="mt-2 max-h-48 overflow-y-auto flex flex-wrap gap-2 rounded-xl bg-background-primary p-3 border border-white/[0.06]" aria-label="Boletos elegidos">
                                        {generatedTickets.map(ticket => (
                                            <li key={ticket} className="tnum inline-flex items-center h-9 px-3 rounded-lg bg-action/15 border border-action/40 text-sm font-semibold text-white">
                                                {formatTicket(ticket, totalTickets)}
                                            </li>
                                        ))}
                                    </ul>
                                    <dl className="mt-4 space-y-1.5 text-sm">
                                        <div className="flex justify-between"><dt className="text-slate-400">{generatedTickets.length} × {formatMoney(pricePerTicket)}</dt><dd className="tnum text-white font-semibold">{formatMoney(totalPrice)}</dd></div>
                                        <div className="flex justify-between items-baseline border-t border-white/[0.08] pt-2"><dt className="font-extrabold text-white">Total</dt><dd className="tnum text-xl font-extrabold text-accent">{formatMoney(totalPrice)}</dd></div>
                                    </dl>
                                    <div className="mt-5 space-y-2">
                                        <Button onClick={goToCheckout} size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" aria-hidden />}>Continuar al pago</Button>
                                        <Button onClick={applySelection} variant="secondary" fullWidth>Usar estos boletos y seguir viendo</Button>
                                        <Button onClick={reset} variant="ghost" fullWidth icon={<RotateCcw className="w-4 h-4" aria-hidden />}>Elegir otros</Button>
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
