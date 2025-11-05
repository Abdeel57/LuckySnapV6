import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Raffle, Pack } from '../types';

interface StickyPurchaseBarProps {
  raffleSlug: string;
  selectedTickets: number[];
  totalPrice: number;
  onRemoveTicket: (ticket: number) => void;
  isSubmitting: boolean;
  raffle?: Raffle;
  selectedPack?: Pack | null;
  packQuantity?: number;
  onClearPack?: () => void;
}

const StickyPurchaseBar = ({ 
    raffleSlug, 
    selectedTickets, 
    totalPrice, 
    onRemoveTicket, 
    isSubmitting, 
    raffle,
    selectedPack,
    packQuantity = 1,
    onClearPack
}: StickyPurchaseBarProps) => {
    const navigate = useNavigate();

    const handlePurchase = () => {
       const params = new URLSearchParams();
       if (selectedPack) {
           params.append('pack', selectedPack.name || 'pack');
           params.append('quantity', packQuantity.toString());
       } else {
           params.append('tickets', selectedTickets.join(','));
       }
       navigate(`/comprar/${raffleSlug}?${params.toString()}`);
    }

    // Calcular boletos según si es paquete o selección individual
    const ticketsCount = selectedPack 
        ? (selectedPack.tickets || selectedPack.q || 1) * packQuantity
        : selectedTickets.length;

    // Calcular boletos de regalo si el sorteo tiene oportunidades
    const boletosAdicionales = raffle?.boletosConOportunidades && raffle?.numeroOportunidades > 1
        ? ticketsCount * (raffle.numeroOportunidades - 1)
        : 0;
    
    const totalBoletos = ticketsCount + boletosAdicionales;

    const shouldShow = selectedTickets.length > 0 || selectedPack !== null;

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "100%" }}
                    transition={{ type: "tween", ease: "easeInOut" }}
                    className="fixed bottom-0 left-0 right-0 bg-background-secondary/90 backdrop-blur-sm p-4 border-t border-slate-700 shadow-lg z-40"
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-2">
                            {selectedPack ? (
                                <>
                                    <p className="text-sm text-slate-300">
                                        Paquete: <span className="font-semibold text-white">{selectedPack.name || `Pack de ${selectedPack.tickets || selectedPack.q || 1} boletos`}</span>
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Cantidad: {packQuantity} paquete(s) = {ticketsCount} boleto(s)
                                        {boletosAdicionales > 0 && (
                                            <span className="text-green-400 font-semibold"> + {boletosAdicionales} de regalo</span>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-slate-300">
                                    Has seleccionado {selectedTickets.length} boleto(s)
                                    {boletosAdicionales > 0 && (
                                        <span className="text-green-400 font-semibold"> + {boletosAdicionales} de regalo</span>
                                    )}
                                </p>
                            )}
                            <p className="font-bold text-white text-lg">
                                LPS {totalPrice.toFixed(2)}
                                {boletosAdicionales > 0 && (
                                    <span className="text-xs text-green-400 block mt-1">
                                        Recibirás {totalBoletos} boletos en total
                                    </span>
                                )}
                            </p>
                        </div>
                        
                        {selectedPack ? (
                            <div className="text-center mb-3">
                                <button 
                                    onClick={onClearPack}
                                    className="bg-gradient-to-r from-accent to-action text-white text-sm font-semibold px-6 py-2 rounded-full hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                                >
                                    {selectedPack.name || `Pack de ${selectedPack.tickets || selectedPack.q || 1} boletos`} × {packQuantity}
                                    <span className="text-lg">&times;</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-1 mb-3 max-h-20 overflow-y-auto no-scrollbar">
                                {/* Boletos comprados */}
                                {selectedTickets.map(ticket => (
                                    <button key={ticket} onClick={() => onRemoveTicket(ticket)} className="bg-blue-600 text-xs text-white px-2 py-1 rounded-full hover:bg-blue-700 transition-colors">
                                        {ticket} &times;
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Boletos de regalo - mensaje compacto */}
                        {boletosAdicionales > 0 && !selectedPack && (
                            <div className="text-center mb-3">
                                <span className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-lg">
                                    🎁 + {boletosAdicionales} boletos de regalo
                                </span>
                            </div>
                        )}
                        <button 
                            onClick={handlePurchase} 
                            disabled={isSubmitting}
                            className="w-full text-center bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Procesando...' : selectedPack ? 'Comprar Paquete' : 'Comprar Boletos'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyPurchaseBar;