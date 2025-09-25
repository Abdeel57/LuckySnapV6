import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface TicketSelectorProps {
    totalTickets: number;
    occupiedTickets: number[];
    selectedTickets: number[];
    onTicketClick: (ticket: number) => void;
}

const TicketSelector = ({ totalTickets, occupiedTickets, selectedTickets, onTicketClick }: TicketSelectorProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 50;
    const totalPages = Math.ceil(totalTickets / ticketsPerPage);

    const renderTickets = () => {
        const start = (currentPage - 1) * ticketsPerPage;
        const end = start + ticketsPerPage;
        const tickets = Array.from({ length: totalTickets }, (_, i) => i + 1);

        return tickets.slice(start, end).map(ticket => {
            const isOccupied = occupiedTickets.includes(ticket);
            const isSelected = selectedTickets.includes(ticket);
            
            let baseClasses = 'relative p-1 text-center rounded-md text-sm cursor-pointer transition-all duration-200 flex items-center justify-center aspect-square';
            let stateClasses = '';

            if (isOccupied) {
                stateClasses = 'bg-slate-700/50 text-slate-500/50 cursor-not-allowed line-through';
            } else if (isSelected) {
                stateClasses = 'bg-accent text-white font-bold shadow-neon-accent';
            } else {
                stateClasses = 'bg-background-primary text-slate-300 hover:bg-slate-700 hover:shadow-neon-accent';
            }
            
            return (
                <motion.div 
                    key={ticket} 
                    className={`${baseClasses} ${stateClasses}`} 
                    onClick={() => !isOccupied && onTicketClick(ticket)}
                    whileTap={{ scale: isOccupied ? 1 : 0.9 }}
                >
                    <AnimatePresence>
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Check size={16} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className={isSelected ? 'opacity-0' : 'opacity-100'}>
                         {String(ticket).padStart(String(totalTickets).length, '0')}
                    </span>
                </motion.div>
            );
        });
    };
    
    const Legend = () => (
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-background-primary border border-slate-600"></div><span>Disponible</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-accent"></div><span>Seleccionado</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-700/50 line-through"></div><span>Vendido</span></div>
        </div>
    );
    
    return (
        <div className="bg-background-secondary p-4 rounded-lg shadow-lg border border-slate-700/50">
            <Legend />
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {renderTickets()}
            </div>
            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-4 text-white">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-action rounded-md disabled:opacity-50">Anterior</button>
                <span>Página {currentPage} de {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-action rounded-md disabled:opacity-50">Siguiente</button>
            </div>
        </div>
    );
};

export default TicketSelector;