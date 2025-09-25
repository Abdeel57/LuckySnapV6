import React from 'react';
import { Order, OrderStatus } from '../types';
import { format } from 'date-fns';
// FIX: Corrected import path for 'es' locale.
import { es } from 'date-fns/locale';

const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.PAID: return { text: 'Pagado', color: 'bg-green-500/20 text-green-400 border-green-500/50' };
        case OrderStatus.PENDING: return { text: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
        case OrderStatus.CANCELLED: return { text: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/50' };
        default: return { text: 'Desconocido', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' };
    }
};

// FIX: Explicitly type as React.FC to handle special props like 'key'.
const OrderHistoryCard: React.FC<{ order: Order }> = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);
    
    return (
        <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-400 text-sm">Folio</p>
                    <p className="font-mono text-lg text-white">{order.folio}</p>
                </div>
                <div className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}>{statusInfo.text}</div>
            </div>
            <div className="space-y-3 text-sm">
                <p className="text-white"><span className="font-semibold text-slate-300">Rifa:</span> {order.raffleTitle}</p>
                <p className="text-white"><span className="font-semibold text-slate-300">Nombre:</span> {order.name}</p>
                <p className="text-white"><span className="font-semibold text-slate-300">Total:</span> LPS {order.total.toFixed(2)}</p>
                <p className="text-white"><span className="font-semibold text-slate-300">Boletos:</span> <span className="font-mono bg-background-primary px-2 py-1 rounded">{order.tickets.join(', ')}</span></p>
                <p className="text-slate-400"><span className="font-semibold">Fecha de apartado:</span> {format(order.createdAt, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
                {order.status === OrderStatus.PENDING && (
                     <p className="text-yellow-400"><span className="font-semibold">Vence:</span> {format(order.expiresAt, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryCard;