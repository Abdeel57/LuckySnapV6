import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StickyPurchaseBarProps {
  raffleSlug: string;
  selectedTickets: number[];
  totalPrice: number;
  onRemoveTicket: (ticket: number) => void;
  isSubmitting: boolean;
}

const StickyPurchaseBar = ({ raffleSlug, selectedTickets, totalPrice, onRemoveTicket, isSubmitting }: StickyPurchaseBarProps) => {
    const navigate = useNavigate();

    const handlePurchase = () => {
       const params = new URLSearchParams();
       params.append('tickets', selectedTickets.join(','));
       navigate(`/comprar/${raffleSlug}?${params.toString()}`);
    }

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
                            <p className="text-sm text-slate-300">Has seleccionado {selectedTickets.length} boleto(s)</p>
                            <p className="font-bold text-white text-lg">LPS {totalPrice.toFixed(2)}</p>
                        </div>
                         <div className="flex flex-wrap justify-center gap-1 mb-3 max-h-20 overflow-y-auto no-scrollbar">
                             {selectedTickets.map(ticket => (
                                <button key={ticket} onClick={() => onRemoveTicket(ticket)} className="bg-background-primary text-xs text-white px-2 py-1 rounded-full">
                                    {ticket} &times;
                                </button>
                             ))}
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