import React, { useId } from 'react';
import { CheckCircle2, ChevronDown, Clock } from 'lucide-react';
import Badge from './ui/Badge';
import { formatDate, formatMoney, pluralize } from '../utils/format';

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

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'neutral'; icon: React.ReactNode }> = {
    PAID: { label: 'Pagado', tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> },
    PENDING: { label: 'Pendiente de pago', tone: 'warning', icon: <Clock className="w-3.5 h-3.5" aria-hidden /> },
};

const OrdenCard: React.FC<OrdenCardProps> = ({ orden, isExpanded, onToggle }) => {
    const panelId = useId();
    const status = STATUS[orden.estado] || { label: orden.estado, tone: 'neutral' as const, icon: null };

    return (
        <article className="rounded-xl bg-surface-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="tnum text-base font-bold text-ink">{orden.folio}</p>
                <Badge tone={status.tone} icon={status.icon}>{status.label}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-ink/80">{orden.rifa.titulo}</p>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <div className="tnum"><dt className="sr-only">Boletos</dt><dd>{pluralize(orden.cantidadBoletos, 'boleto')}</dd></div>
                <div className="tnum"><dt className="sr-only">Monto</dt><dd>{formatMoney(orden.monto)}</dd></div>
                {orden.fechaPago && (
                    <div><dt className="sr-only">Fecha de pago</dt><dd>Pagado el {formatDate(orden.fechaPago)}</dd></div>
                )}
            </dl>

            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className="mt-3 inline-flex items-center gap-1.5 h-10 text-sm font-semibold text-action-ink hover:underline"
            >
                {isExpanded ? 'Ocultar boletos' : `Ver boletos (${orden.cantidadBoletos})`}
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            <div id={panelId} hidden={!isExpanded} className="mt-2">
                <ul className="flex flex-wrap gap-1.5" aria-label="Números de boleto">
                    {orden.boletos.map((boleto, idx) => (
                        <li key={idx} className="tnum inline-flex items-center h-8 px-2.5 rounded-lg bg-surface border border-line text-xs font-semibold text-ink">{boleto}</li>
                    ))}
                </ul>
            </div>
        </article>
    );
};

export default OrdenCard;
