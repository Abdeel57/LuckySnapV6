import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gift, Zap, Coins } from 'lucide-react';

interface LuckyMachineProps {
    totalTickets: number;
    occupiedTickets: number[];
    pricePerTicket: number;
    onTicketsSelected: (tickets: number[]) => void;
    raffleSlug: string;
}

const QUANTITY_OPTIONS = [1, 3, 5, 10, 100, 200, 300, 400, 500, 1000];

const LuckyMachine: React.FC<LuckyMachineProps> = ({
    totalTickets,
    occupiedTickets,
    pricePerTicket,
    onTicketsSelected,
    raffleSlug
}) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [generatedTickets, setGeneratedTickets] = useState<number[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showTooltip, setShowTooltip] = useState(true);

    const occupiedSet = useMemo(() => new Set(occupiedTickets), [occupiedTickets]);
    
    // Generar lista de boletos disponibles
    const availableTickets = useMemo(() => {
        const allTickets = Array.from({ length: totalTickets }, (_, i) => i + 1);
        return allTickets.filter(ticket => !occupiedSet.has(ticket));
    }, [totalTickets, occupiedSet]);

    const handleQuantitySelect = (quantity: number) => {
        if (quantity > availableTickets.length) {
            alert(`Solo hay ${availableTickets.length} boletos disponibles. No puedes seleccionar ${quantity}.`);
            return;
        }
        setSelectedQuantity(quantity);
    };

    const spinMachine = () => {
        if (!selectedQuantity || selectedQuantity > availableTickets.length) return;
        
        setIsSpinning(true);
        setShowResults(false);
        setGeneratedTickets([]);

        // Animación de 2-3 segundos
        setTimeout(() => {
            // Generar boletos aleatorios
            const shuffled = [...availableTickets].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, selectedQuantity);
            setGeneratedTickets(selected.sort((a, b) => a - b));
            setIsSpinning(false);
            setShowResults(true);
        }, 2500);
    };

    const handlePurchase = () => {
        if (generatedTickets.length > 0) {
            // Notificar al componente padre
            onTicketsSelected(generatedTickets);
            // Redirigir a la página de compra con los boletos seleccionados
            const ticketsParam = generatedTickets.join(',');
            navigate(`/comprar/${raffleSlug}?tickets=${ticketsParam}`);
            // Resetear estado
            setIsOpen(false);
            setSelectedQuantity(null);
            setGeneratedTickets([]);
            setShowResults(false);
        }
    };

    const totalPrice = useMemo(() => {
        return generatedTickets.length * pricePerTicket;
    }, [generatedTickets.length, pricePerTicket]);

    // Ocultar tooltip después de 3 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {/* Botón flotante de la máquina de la suerte */}
            <motion.div
                className="fixed bottom-6 right-6 z-40"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
                {/* Mensaje explicativo con flecha */}
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute right-full mr-3 bottom-1/2 transform translate-y-1/2 w-56 z-50"
                        >
                            <div className="bg-background-secondary border-2 border-purple-500/50 rounded-lg p-3 shadow-xl relative">
                                <p className="text-sm text-white font-medium leading-tight">
                                    ¡Máquina de la Suerte! Deja que el azar elija tus boletos
                                </p>
                                {/* Flecha apuntando al botón */}
                                <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[10px] border-l-purple-500/50 border-b-[10px] border-b-transparent"></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Botón flotante circular */}
                <motion.button
                    onClick={() => setIsOpen(true)}
                    className="relative w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group overflow-hidden flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Abrir Máquina de la Suerte"
                >
                    {/* Efecto de brillo animado */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                        animate={{
                            x: ['-100%', '200%'],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: 'linear'
                        }}
                    />
                    
                    <Coins className="w-8 h-8 text-yellow-300 relative z-10" />
                </motion.button>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => !isSpinning && setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-background-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="flex justify-center space-x-2 mb-3">
                                        <Sparkles className="w-10 h-10 text-yellow-400" />
                                        <Gift className="w-10 h-10 text-pink-400" />
                                        <Zap className="w-10 h-10 text-orange-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">🎰 Máquina de la Suerte</h2>
                                    <p className="text-slate-300">Selecciona cuántos boletos quieres y deja que la suerte decida</p>
                                </div>

                                {/* Selector de cantidad */}
                                {!showResults && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-white mb-4 text-center">
                                            ¿Cuántos boletos quieres comprar?
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                            {QUANTITY_OPTIONS.map((quantity) => {
                                                const isAvailable = quantity <= availableTickets.length;
                                                return (
                                                    <motion.button
                                                        key={quantity}
                                                        onClick={() => handleQuantitySelect(quantity)}
                                                        disabled={!isAvailable || isSpinning}
                                                        className={`p-4 rounded-lg font-bold text-lg transition-all ${
                                                            selectedQuantity === quantity
                                                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                                                                : isAvailable
                                                                ? 'bg-background-primary text-slate-300 hover:bg-slate-700 border border-slate-600'
                                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                                        }`}
                                                        whileHover={isAvailable && selectedQuantity !== quantity ? { scale: 1.05 } : {}}
                                                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                                                    >
                                                        {quantity}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                        {availableTickets.length < 1000 && (
                                            <p className="text-sm text-slate-400 text-center mt-3">
                                                Boletos disponibles: {availableTickets.length}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Botón de tirar */}
                                {selectedQuantity && !showResults && (
                                    <motion.button
                                        onClick={spinMachine}
                                        disabled={isSpinning}
                                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xl"
                                        whileHover={!isSpinning ? { scale: 1.02 } : {}}
                                        whileTap={!isSpinning ? { scale: 0.98 } : {}}
                                    >
                                        {isSpinning ? '🎰 Girando...' : '🎰 ¡Tirar de la Máquina!'}
                                    </motion.button>
                                )}

                                {/* Animación de giro */}
                                {isSpinning && (
                                    <motion.div
                                        className="my-8 flex flex-col items-center justify-center space-y-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <motion.div
                                            animate={{
                                                rotate: [0, 360],
                                                scale: [1, 1.2, 1],
                                            }}
                                            transition={{
                                                rotate: {
                                                    repeat: Infinity,
                                                    duration: 0.5,
                                                    ease: 'linear'
                                                },
                                                scale: {
                                                    repeat: Infinity,
                                                    duration: 1,
                                                    ease: 'easeInOut'
                                                }
                                            }}
                                            className="w-32 h-32 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
                                        >
                                            <Sparkles className="w-16 h-16 text-yellow-300" />
                                        </motion.div>
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="text-xl font-bold text-white"
                                        >
                                            La suerte está decidiendo...
                                        </motion.p>
                                    </motion.div>
                                )}

                                {/* Resultados */}
                                {showResults && generatedTickets.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-2 border-green-500/50 rounded-xl p-4 text-center">
                                            <h3 className="text-2xl font-bold text-green-400 mb-2">
                                                ¡Boletos Asignados! 🎉
                                            </h3>
                                            <p className="text-white">
                                                La máquina de la suerte ha seleccionado {generatedTickets.length} boleto{generatedTickets.length > 1 ? 's' : ''} para ti
                                            </p>
                                        </div>

                                        {/* Lista de boletos */}
                                        <div className="bg-background-primary rounded-lg p-4 max-h-60 overflow-y-auto">
                                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                                {generatedTickets.map((ticket) => (
                                                    <motion.div
                                                        key={ticket}
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ type: 'spring', stiffness: 200 }}
                                                        className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm p-2 rounded text-center shadow-lg"
                                                    >
                                                        {ticket}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Resumen de precio */}
                                        <div className="bg-background-primary rounded-lg p-4 border border-slate-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-300">Boletos seleccionados:</span>
                                                <span className="text-white font-bold">{generatedTickets.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-300">Precio por boleto:</span>
                                                <span className="text-white font-bold">LPS {pricePerTicket.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                                                <span className="text-white font-bold text-lg">Total:</span>
                                                <span className="text-accent font-bold text-xl">LPS {totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Botón de compra */}
                                        <motion.button
                                            onClick={handlePurchase}
                                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-green-500/50 transition-all text-xl"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            🛒 Proceder a Comprar
                                        </motion.button>

                                        {/* Botón para volver a tirar */}
                                        <button
                                            onClick={() => {
                                                setShowResults(false);
                                                setSelectedQuantity(null);
                                                setGeneratedTickets([]);
                                            }}
                                            className="w-full bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-600 transition-all"
                                        >
                                            🔄 Intentar de Nuevo
                                        </button>
                                    </motion.div>
                                )}

                                {/* Botón cerrar */}
                                {!isSpinning && (
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full mt-4 bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-600 transition-all"
                                    >
                                        Cerrar
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default LuckyMachine;

