import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import type { GridChildComponentProps } from 'react-window';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTicket } from '../utils/format';

interface TicketSelectorProps {
    totalTickets: number;
    occupiedTickets: number[];
    selectedTickets: number[];
    listingMode?: 'paginado' | 'scroll';
    hideOccupied?: boolean;
    /** Mostrar "N disponibles de M" (respeta la preferencia del admin de ocultar ventas). */
    showAvailability?: boolean;
    onTicketClick: (ticket: number) => void;
}

type ScrollGridData = {
    tickets: number[];
    columns: number;
    cellWidth: number;
    cellGap: number;
    hideOccupied: boolean;
    occupiedSet: Set<number>;
    selectedSet: Set<number>;
    createTicketNode: (ticket: number, isOccupied: boolean, isSelected: boolean) => React.ReactNode;
};

const CELL_GAP = 8;
const MIN_SCROLL_HEIGHT = 320;
const TICKETS_PER_PAGE = 50;

const VirtualTicketCell: React.FC<GridChildComponentProps<ScrollGridData>> = ({ columnIndex, rowIndex, style, data }) => {
    const index = rowIndex * data.columns + columnIndex;
    if (index >= data.tickets.length) return <div style={style} />;

    const ticket = data.tickets[index];
    if (data.hideOccupied && data.occupiedSet.has(ticket)) return <div style={style} />;

    const content = data.createTicketNode(ticket, data.occupiedSet.has(ticket), data.selectedSet.has(ticket));
    if (!content) return <div style={style} />;

    const marginRight = columnIndex === data.columns - 1 ? 0 : data.cellGap;
    return (
        <div style={{ ...style, width: data.cellWidth + marginRight, height: data.cellWidth + data.cellGap, display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ width: data.cellWidth, height: data.cellWidth, marginRight }}>{content}</div>
        </div>
    );
};

const CELL_BASE = 'tnum w-full h-full flex items-center justify-center rounded-lg text-sm font-semibold border transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background-secondary';
const CELL_STATES = {
    available: 'bg-white/[0.05] border-white/10 text-slate-200 hover:border-action/70 hover:bg-action/10 active:bg-action/20',
    selected: 'bg-action border-action text-white',
    occupied: 'ticket-sold bg-transparent border-white/[0.05] text-slate-600 line-through cursor-not-allowed',
};

interface TicketCellProps {
    ticket: number;
    label: string;
    isOccupied: boolean;
    isSelected: boolean;
    onTicketClick: (ticket: number) => void;
}

// Memoizada: al seleccionar un boleto solo se vuelve a renderizar la celda que cambió
// (con onTicketClick estable en el padre), no las 50 de la página ni las visibles del scroll.
const TicketCell = React.memo(({ ticket, label, isOccupied, isSelected, onTicketClick }: TicketCellProps) => {
    const state = isOccupied ? 'occupied' : isSelected ? 'selected' : 'available';
    return (
        <button
            type="button"
            className={`${CELL_BASE} ${CELL_STATES[state]}`}
            onClick={() => !isOccupied && onTicketClick(ticket)}
            aria-pressed={isOccupied ? undefined : isSelected}
            aria-disabled={isOccupied || undefined}
            aria-label={`Boleto ${label}${isOccupied ? ', vendido' : isSelected ? ', seleccionado' : ''}`}
        >
            {isSelected ? (
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" aria-hidden />{label}</span>
            ) : label}
        </button>
    );
});

const Legend = () => (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400" aria-label="Leyenda">
        <li className="flex items-center gap-2"><span className={`w-5 h-5 rounded-md border ${CELL_STATES.available}`} aria-hidden /> Disponible</li>
        <li className="flex items-center gap-2"><span className={`w-5 h-5 rounded-md border flex items-center justify-center ${CELL_STATES.selected}`} aria-hidden><Check className="w-3 h-3" /></span> Seleccionado</li>
        <li className="flex items-center gap-2"><span className={`w-5 h-5 rounded-md border ${CELL_STATES.occupied}`} aria-hidden /> Vendido</li>
    </ul>
);

const TicketSelector = ({ totalTickets, occupiedTickets, selectedTickets, onTicketClick, listingMode = 'paginado', hideOccupied = false, showAvailability = false }: TicketSelectorProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const occupiedSet = useMemo(() => new Set(occupiedTickets), [occupiedTickets]);
    const selectedSet = useMemo(() => new Set(selectedTickets), [selectedTickets]);

    // Disponibles primero y, si el admin lo permite, los vendidos al final
    const { orderedTickets, availableCount } = useMemo(() => {
        if (!totalTickets || totalTickets <= 0) return { orderedTickets: [] as number[], availableCount: 0 };
        const allTickets = Array.from({ length: totalTickets }, (_, i) => i + 1);
        const available = allTickets.filter(ticket => !occupiedSet.has(ticket));
        if (hideOccupied) return { orderedTickets: available, availableCount: available.length };
        const occupiedOnly = allTickets.filter(ticket => occupiedSet.has(ticket));
        return { orderedTickets: [...available, ...occupiedOnly], availableCount: available.length };
    }, [totalTickets, occupiedSet, hideOccupied]);
    const totalDisplayTickets = orderedTickets.length;
    const totalPages = Math.max(1, Math.ceil(totalDisplayTickets / TICKETS_PER_PAGE));

    useEffect(() => { setCurrentPage(prev => Math.min(prev, totalPages)); }, [totalPages]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));

    useEffect(() => {
        const updateDimensions = () => {
            if (typeof window !== 'undefined') setViewportHeight(window.innerHeight);
            if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateDimensions) : null;
        if (observer && containerRef.current) observer.observe(containerRef.current);
        return () => {
            window.removeEventListener('resize', updateDimensions);
            observer?.disconnect();
        };
    }, []);

    const createTicketNode = useCallback((ticket: number, isOccupied: boolean, isSelected: boolean) => (
        <TicketCell
            ticket={ticket}
            label={formatTicket(ticket, totalTickets)}
            isOccupied={isOccupied}
            isSelected={isSelected}
            onTicketClick={onTicketClick}
        />
    ), [onTicketClick, totalTickets]);

    const paginatedTickets = useMemo(() => {
        if (listingMode !== 'paginado' || totalDisplayTickets <= 0) return [];
        const start = (currentPage - 1) * TICKETS_PER_PAGE;
        return orderedTickets.slice(start, start + TICKETS_PER_PAGE).map(ticket => (
            <div key={ticket} className="aspect-square">
                {createTicketNode(ticket, occupiedSet.has(ticket), selectedSet.has(ticket))}
            </div>
        ));
    }, [listingMode, orderedTickets, totalDisplayTickets, currentPage, occupiedSet, selectedSet, createTicketNode]);

    const columns = useMemo(() => {
        if (containerWidth >= 900) return 10;
        if (containerWidth >= 720) return 9;
        if (containerWidth >= 640) return 8;
        if (containerWidth >= 520) return 7;
        if (containerWidth >= 400) return 6;
        return 5;
    }, [containerWidth]);

    const cellWidth = useMemo(() => {
        if (columns <= 0 || containerWidth <= 0) return 56;
        const availableWidth = Math.max(containerWidth - CELL_GAP * (columns - 1), 0);
        return Math.max(Math.floor(availableWidth / columns), 44);
    }, [columns, containerWidth]);

    const gridWidth = useMemo(() => Math.min(containerWidth, columns * (cellWidth + CELL_GAP) - CELL_GAP), [columns, containerWidth, cellWidth]);

    const gridHeight = useMemo(() => {
        if (listingMode !== 'scroll') return 0;
        const desired = (cellWidth + CELL_GAP) * 7;
        return Math.max(MIN_SCROLL_HEIGHT, Math.min(desired, Math.floor(viewportHeight * 0.6) || desired));
    }, [cellWidth, listingMode, viewportHeight]);

    const rowCount = useMemo(() => (columns <= 0 || totalDisplayTickets <= 0 ? 0 : Math.ceil(totalDisplayTickets / columns)), [columns, totalDisplayTickets]);

    const itemData = useMemo<ScrollGridData>(() => ({
        tickets: orderedTickets, columns, cellWidth, cellGap: CELL_GAP, hideOccupied, occupiedSet, selectedSet, createTicketNode,
    }), [orderedTickets, columns, cellWidth, hideOccupied, occupiedSet, selectedSet, createTicketNode]);

    const showScrollGrid = listingMode === 'scroll' && totalDisplayTickets > 0 && columns > 0 && rowCount > 0 && containerWidth > 0;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <Legend />
                {showAvailability && (
                    <p className="tnum text-xs font-semibold text-slate-400">
                        <span className="text-white">{availableCount.toLocaleString('es-HN')}</span> disponibles de {totalTickets.toLocaleString('es-HN')}
                    </p>
                )}
            </div>

            <div ref={containerRef}>
                {listingMode === 'scroll' ? (
                    showScrollGrid ? (
                        <Grid
                            columnCount={columns}
                            columnWidth={cellWidth + CELL_GAP}
                            height={gridHeight}
                            rowCount={rowCount}
                            rowHeight={cellWidth + CELL_GAP}
                            width={gridWidth}
                            itemData={itemData}
                            className="mx-auto"
                        >
                            {VirtualTicketCell}
                        </Grid>
                    ) : (
                        <p className="text-center text-sm text-slate-400 py-8">
                            {totalDisplayTickets > 0 ? 'Cargando boletos…' : 'No hay boletos disponibles en este momento.'}
                        </p>
                    )
                ) : totalDisplayTickets > 0 ? (
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">{paginatedTickets}</div>
                ) : (
                    <p className="text-center text-sm text-slate-400 py-8">No hay boletos disponibles en este momento.</p>
                )}
            </div>

            {listingMode === 'paginado' && totalPages > 1 && (
                <nav className="flex items-center justify-between gap-3 mt-4" aria-label="Páginas de boletos">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 h-11 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-white disabled:opacity-40 hover:bg-white/10"
                    >
                        <ChevronLeft className="w-4 h-4" aria-hidden /> Anterior
                    </button>
                    <span className="tnum text-sm text-slate-400">Página <span className="text-white font-semibold">{currentPage}</span> de {totalPages}</span>
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 h-11 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-white disabled:opacity-40 hover:bg-white/10"
                    >
                        Siguiente <ChevronRight className="w-4 h-4" aria-hidden />
                    </button>
                </nav>
            )}
        </div>
    );
};

export default TicketSelector;
