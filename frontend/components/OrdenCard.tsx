import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OrdenCardProps {
    orden: {
        ordenId: string;
        folio: string;
        rifa: {
            id: string;
            titulo: string;
        };
        boletos: number[];
        cantidadBoletos: number;
        estado: string;
        monto: number;
        fechaCreacion: Date;
        fechaPago?: Date | null;
        metodoPago?: string | null;
    };
    isExpanded: boolean;
    onToggle: () => void;
}

const OrdenCard: React.FC<OrdenCardProps> = ({ orden, isExpanded, onToggle }) => {
    const statusColor = orden.estado === 'PAID' 
        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    const statusText = orden.estado === 'PAID' ? '✅ PAGADO' : '⏳ PENDIENTE';
    
    return (
        <div className="bg-background-primary p-4 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
            {/* Información principal */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono text-sm bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                            🏷️ {orden.folio}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${statusColor}`}>
                            {statusText}
                        </span>
                    </div>
                    <p className="text-white font-semibold mb-2">🎰 {orden.rifa.titulo}</p>
                    <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                            🎫 <span className="font-semibold text-white">{orden.cantidadBoletos}</span> boletos
                        </span>
                        <span className="flex items-center gap-1">
                            💰 L. <span className="font-semibold text-white">{orden.monto.toFixed(2)}</span>
                        </span>
                        {orden.fechaPago && (
                            <span className="flex items-center gap-1">
                                📅 {new Date(orden.fechaPago).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="ml-4 text-accent hover:text-action transition-colors p-1 rounded hover:bg-slate-800"
                    aria-label={isExpanded ? 'Ocultar boletos' : 'Ver boletos'}
                >
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>
            </div>
            
            {/* Boletos expandibles */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-sm font-semibold text-slate-400 mb-3">🎫 Boletos de esta compra:</p>
                    <div className="flex flex-wrap gap-2">
                        {orden.boletos.map((boleto: number, idx: number) => (
                            <span
                                key={idx}
                                className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm font-mono border border-slate-700 hover:bg-slate-700 transition-colors"
                            >
                                {boleto}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdenCard;

