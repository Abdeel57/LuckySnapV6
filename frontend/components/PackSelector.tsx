import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pack } from '../types';

interface PackSelectorProps {
    packs: Pack[];
    pricePerTicket: number;
    onPackSelect: (pack: Pack | null, quantity: number) => void;
    selectedPack: Pack | null;
    selectedQuantity: number;
    className?: string;
}

const PackSelector: React.FC<PackSelectorProps> = ({
    packs,
    pricePerTicket,
    onPackSelect,
    selectedPack,
    selectedQuantity,
    className = ''
}) => {
    const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(null);

    // Si no hay paquetes, no mostrar el selector
    if (!packs || packs.length === 0) {
        return null;
    }

    // Calcular descuentos para cada paquete
    const packsWithDiscount = useMemo(() => {
        return packs.map((pack) => {
            const ticketCount = pack.tickets || pack.q || 1;
            const individualPrice = ticketCount * pricePerTicket;
            const packPrice = pack.price;
            const discount = individualPrice - packPrice;
            const discountPercent = ticketCount > 0 ? ((discount / individualPrice) * 100) : 0;
            
            return {
                ...pack,
                ticketCount,
                individualPrice,
                discount,
                discountPercent: discountPercent > 0 ? discountPercent : 0,
                pricePerTicketInPack: ticketCount > 0 ? packPrice / ticketCount : packPrice
            };
        });
    }, [packs, pricePerTicket]);

    const handlePackClick = (pack: Pack, index: number) => {
        if (selectedPackIndex === index) {
            // Si ya está seleccionado, deseleccionar
            setSelectedPackIndex(null);
            onPackSelect(null, 1);
        } else {
            setSelectedPackIndex(index);
            onPackSelect(pack, 1);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`bg-gradient-to-br from-background-secondary to-background-primary rounded-2xl border border-slate-700/50 shadow-xl p-6 ${className}`}
        >
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Precios y Paquetes</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-accent to-action rounded-full"></div>
                <p className="text-slate-400 text-sm mt-2">Selecciona un paquete para ahorrar en tu compra</p>
            </div>

            <div className="space-y-3">
                {/* Opción de boleto individual */}
                <motion.button
                    onClick={() => {
                        setSelectedPackIndex(null);
                        onPackSelect(null, 1);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedPackIndex === null
                            ? 'border-accent bg-accent/10 shadow-lg'
                            : 'border-slate-700/50 bg-background-primary/50 hover:border-slate-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">Boleto Individual</p>
                            <p className="text-sm text-slate-400">1 boleto</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-accent text-lg">LPS {pricePerTicket.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">por boleto</p>
                        </div>
                    </div>
                </motion.button>

                {/* Paquetes disponibles */}
                {packsWithDiscount.map((pack, index) => {
                    const isSelected = selectedPackIndex === index;
                    const packName = pack.name || `Pack de ${pack.ticketCount} boletos`;
                    
                    return (
                        <motion.button
                            key={index}
                            onClick={() => handlePackClick(pack, index)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                    ? 'border-accent bg-accent/10 shadow-lg'
                                    : 'border-slate-700/50 bg-background-primary/50 hover:border-slate-600'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-white">{packName}</p>
                                    <p className="text-sm text-slate-400">{pack.ticketCount} boletos</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-accent text-lg">LPS {pack.price.toFixed(2)}</p>
                                    <p className="text-xs text-slate-400">
                                        LPS {(pack.pricePerTicketInPack || 0).toFixed(2)} por boleto
                                    </p>
                                </div>
                            </div>
                            
                            {pack.discountPercent > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-700/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-green-400 font-medium">
                                            Ahorras LPS {pack.discount.toFixed(2)}
                                        </span>
                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-semibold">
                                            {pack.discountPercent.toFixed(0)}% OFF
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {selectedPack && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-xl"
                >
                    <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">Paquete seleccionado:</span>{' '}
                        {selectedPack.name || `Pack de ${selectedPack.tickets || selectedPack.q || 1} boletos`} - 
                        <span className="text-accent font-bold"> LPS {selectedPack.price.toFixed(2)}</span>
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default PackSelector;

