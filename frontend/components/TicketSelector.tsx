import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { isMobile } from '../utils/deviceDetection';

interface TicketSelectorProps {
    totalTickets: number;
    occupiedTickets: number[];
    selectedTickets: number[];
    listingMode?: 'paginado' | 'scroll';
    hideOccupied?: boolean;
    onTicketClick: (ticket: number) => void;
}

const TicketSelector = ({ totalTickets, occupiedTickets, selectedTickets, onTicketClick, listingMode = 'paginado', hideOccupied = false }: TicketSelectorProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 50;
    const totalPages = Math.ceil(totalTickets / ticketsPerPage);

    // CRÍTICO: Los Sets se crean dentro de renderTickets para evitar problemas de dependencias
    // No necesitamos memoizar Sets separados, se crean dentro del useMemo cuando se necesitan

    // Memoizar padding para evitar recalcular
    const ticketPadding = useMemo(() => {
        if (!totalTickets || totalTickets <= 0) return 1;
        return String(totalTickets).length;
    }, [totalTickets]);

    // Detectar móvil una vez
    const mobile = useMemo(() => {
        try {
            return isMobile();
        } catch {
            return false;
        }
    }, []);

    // CRÍTICO: Memoizar renderTickets para evitar recalcular en cada render
    // Usar arrays directamente en dependencias (no Sets), Sets se recrean dentro
    const renderTickets = useMemo(() => {
        // Validaciones defensivas
        if (!totalTickets || totalTickets <= 0) return [];
        if (!Array.isArray(occupiedTickets)) return [];
        if (!Array.isArray(selectedTickets)) return [];

        // Crear Sets una vez dentro del useMemo (más eficiente)
        const currentOccupiedSet = new Set(occupiedTickets);
        const currentSelectedSet = new Set(selectedTickets);

        const tickets = Array.from({ length: totalTickets }, (_, i) => i + 1);
        const visibleTickets = listingMode === 'paginado'
            ? tickets.slice((currentPage - 1) * ticketsPerPage, (currentPage * ticketsPerPage))
            : tickets;

        return visibleTickets
            .filter(ticket => hideOccupied ? !currentOccupiedSet.has(ticket) : true)
            .map(ticket => {
            // CRÍTICO: Usar Set.has() en lugar de Array.includes() - O(1) vs O(n)
            const isOccupied = currentOccupiedSet.has(ticket);
            const isSelected = currentSelectedSet.has(ticket);
            
            let baseClasses = 'relative p-1 text-center rounded-md text-sm cursor-pointer transition-all duration-200 flex items-center justify-center aspect-square';
            let stateClasses = '';

            if (isOccupied) {
                stateClasses = 'bg-slate-700/50 text-slate-500/50 cursor-not-allowed line-through';
            } else if (isSelected) {
                stateClasses = 'bg-accent text-white font-bold shadow-neon-accent';
            } else {
                stateClasses = 'bg-background-primary text-slate-300 hover:bg-slate-700 hover:shadow-neon-accent';
            }
            
            // Móvil: div estático sin animaciones (mejor rendimiento)
            // Desktop: motion.div con animaciones
            if (mobile) {
                return (
                    <div 
                        key={ticket} 
                        className={`${baseClasses} ${stateClasses}`} 
                        onClick={() => !isOccupied && onTicketClick(ticket)}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Check size={16} />
                            </div>
                        )}
                        <span className={isSelected ? 'opacity-0' : 'opacity-100'}>
                            {String(ticket).padStart(ticketPadding, '0')}
                        </span>
                    </div>
                );
            }

            // Desktop: Con animaciones
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
                        {String(ticket).padStart(ticketPadding, '0')}
                    </span>
                </motion.div>
            );
        });
    }, [totalTickets, occupiedTickets, selectedTickets, currentPage, listingMode, hideOccupied, ticketsPerPage, mobile, ticketPadding, onTicketClick]);
    
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
            <div className={listingMode === 'scroll' ? 'max-h-[60vh] overflow-y-auto pr-1' : ''}>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {renderTickets}
                </div>
            </div>
            {listingMode === 'paginado' && (
                <div className="flex justify-center items-center gap-4 mt-4 text-white">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-action rounded-md disabled:opacity-50">Anterior</button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-action rounded-md disabled:opacity-50">Siguiente</button>
                </div>
            )}
        </div>
    );
};

export default TicketSelector;