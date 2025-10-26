import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Raffle } from '../types';

interface StickyPurchaseBarProps {
  raffleSlug: string;
  selectedTickets: number[];
  totalPrice: number;
  onRemoveTicket: (ticket: number) => void;
  isSubmitting: boolean;
  raffle?: Raffle;
}

const StickyPurchaseBar = ({ raffleSlug, selectedTickets, totalPrice, onRemoveTicket, isSubmitting, raffle }: StickyPurchaseBarProps) => {
    const navigate = useNavigate();

    const handlePurchase = () => {
       const params = new URLSearchParams();
       params.append('tickets', selectedTickets.join(','));
       navigate(`/comprar/${raffleSlug}?${params.toString()}`);
    }

    // Calcular boletos de regalo si el sorteo tiene oportunidades
    const boletosAdicionales = raffle?.boletosConOportunidades && raffle?.numeroOportunidades > 1
        ? selectedTickets.length * (raffle.numeroOportunidades - 1)
        : 0;
    
    const totalBoletos = selectedTickets.length + boletosAdicionales;

    return (
        <AnimatePresence>
            {selectedTickets.length > 0 && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "100%" }}
                    transition={{ type: "tween", ease: "easeInOut" }}
                    className="fixed bottom-0 left-0 right-0 bg-background-secondary/90 backdrop-blur-sm p-4 border-t border-slate-700 shadow-lg z-40"
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-2">
                            <p className="text-sm text-slate-300">
                                Has seleccionado {selectedTickets.length} boleto(s)
                                {boletosAdicionales > 0 && (
                                    <span className="text-green-400 font-semibold"> + {boletosAdicionales} de regalo</span>
                                )}
                            </p>
                            <p className="font-bold text-white text-lg">
                                LPS {totalPrice.toFixed(2)}
                                {boletosAdicionales > 0 && (
                                    <span className="text-xs text-green-400 block mt-1">
                                        Recibirás {totalBoletos} boletos en total
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 mb-3 max-h-20 overflow-y-auto no-scrollbar">
                            {/* Boletos comprados */}
                            {selectedTickets.map(ticket => (
                                <button key={ticket} onClick={() => onRemoveTicket(ticket)} className="bg-blue-600 text-xs text-white px-2 py-1 rounded-full hover:bg-blue-700 transition-colors">
                                    {ticket} &times;
                                </button>
                            ))}
                            {/* Boletos de regalo (simulados) */}
                            {boletosAdicionales > 0 && (
                                <>
                                    {Array.from({ length: Math.min(boletosAdicionales, 20) }).map((_, index) => (
                                        <span key={`gift-${index}`} className="bg-green-600 text-xs text-white px-2 py-1 rounded-full animate-pulse">
                                            🎁
                                        </span>
                                    ))}
                                    {boletosAdicionales > 20 && (
                                        <span className="bg-green-600 text-xs text-white px-2 py-1 rounded-full">
                                            +{boletosAdicionales - 20} más
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                        <button 
                            onClick={handlePurchase} 
                            disabled={isSubmitting}
                            className="w-full text-center bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Procesando...' : 'Comprar Boletos'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyPurchaseBar;