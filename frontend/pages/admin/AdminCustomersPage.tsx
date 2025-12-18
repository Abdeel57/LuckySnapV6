import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Search,
    Eye,
    FileText,
    Clock,
    RefreshCw,
} from 'lucide-react';
import { Order, Raffle } from '../../types';
import { getOrders, updateOrder, releaseOrder, getRaffles } from '../../services/api';
import EditOrderForm from '../../components/admin/EditOrderForm';

const AdminCustomersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRaffleId, setSelectedRaffleId] = useState<string>('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoadingAction, setIsLoadingAction] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, rafflesData] = await Promise.all([
                getOrders(1, 200),
                getRaffles()
            ]);
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setRaffles(Array.isArray(rafflesData) ? rafflesData : []);
        } catch (e) {
            console.error('Error cargando datos:', e);
            alert('Error al cargar datos. Verifica el servidor.');
            setOrders([]);
            setRaffles([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // Considerar variaciones: 'PAID' | 'COMPLETED' (robusto ante backends distintos)
    const isPaid = (status?: string) => {
        if (!status) return false;
        const s = String(status).toUpperCase();
        return s === 'PAID' || s === 'COMPLETED';
    };

    const paidCustomers = useMemo(() => {
        // Filtrar por rifa primero
        let base = orders.filter(o => isPaid(String(o.status)));
        if (selectedRaffleId) {
            base = base.filter(o => o.raffleId === selectedRaffleId);
        }
        
        if (!searchTerm) return base;
        const term = searchTerm.toLowerCase();
        return base.filter(o => {
            const name = o.customer?.name?.toLowerCase?.() || '';
            const phone = o.customer?.phone || '';
            const district = o.customer?.district?.toLowerCase?.() || '';
            const folio = o.folio?.toLowerCase() || '';
            // Buscar en los números de boleto
            const ticketsMatch = o.tickets?.some(ticket => 
                ticket.toString().includes(searchTerm)
            ) || false;
            return (
                name.includes(term) ||
                phone.includes(searchTerm) ||
                district.includes(term) ||
                folio.includes(term) ||
                ticketsMatch
            );
        });
    }, [orders, searchTerm, selectedRaffleId]);

    const handleView = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleEdit = (order: Order) => {
        setEditingOrder(order);
        setIsEditOpen(true);
    };

    const closeDetails = () => {
        setSelectedOrder(null);
        setIsDetailsOpen(false);
    };

    const closeEdit = () => {
        setEditingOrder(null);
        setIsEditOpen(false);
    };

    const handleSaveEdit = async (updated: Order) => {
        try {
            setIsLoadingAction(true);
            await updateOrder(updated.id!, updated);
            await refreshData();
            closeEdit();
            console.log('✅ Orden actualizada');
            alert('✅ Orden actualizada correctamente');
        } catch (e) {
            console.error('❌ Error al actualizar orden:', e);
            alert(`❌ Error: ${e.message || 'Error al actualizar la orden'}`);
        } finally {
            setIsLoadingAction(false);
        }
    };

    // Liberar boletos usando releaseOrder
    const handleRelease = async (orderId: string) => {
        if (!window.confirm('¿Estás seguro de liberar estos boletos? Volverán al inventario.')) return;
        try {
            setIsLoadingAction(true);
            await releaseOrder(orderId);
            await refreshData();
            closeDetails();
            closeEdit();
            console.log('✅ Boletos liberados');
            alert('✅ Boletos liberados correctamente');
        } catch (e) {
            console.error('❌ Error al liberar orden:', e);
            alert(`❌ Error: ${e.message || 'Error al liberar la orden'}`);
        } finally {
            setIsLoadingAction(false);
        }
    };

    /**
     * Formatea una fecha a formato hondureño con fecha y hora
     * Formato: "DD/MM/YYYY HH:MM:SS"
     */
    const formatDateTime = (date: Date | string | undefined): string => {
        if (!date) return 'No disponible';
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return 'Fecha inválida';
            
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
            
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return 'Fecha inválida';
        }
    };

    /**
     * Obtiene la fecha de pago de una orden
     * Para órdenes pagadas, usa updatedAt (fecha de última actualización)
     * Si no está pagada, retorna null
     */
    const getPaymentDate = (order: Order): Date | string | undefined => {
        if (isPaid(order.status)) {
            return order.updatedAt;
        }
        return undefined;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando clientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Clientes Pagados</h1>
                                <p className="text-gray-600">Órdenes con pago confirmado</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={refreshData}
                                disabled={refreshing}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>Actualizar</span>
                            </button>
                        </div>
                    </div>
                </div>


                {/* Búsqueda y Filtros */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filtro por rifa */}
                        <div className="w-full md:w-auto md:min-w-[250px]">
                            <select
                                value={selectedRaffleId}
                                onChange={(e) => setSelectedRaffleId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todas las rifas</option>
                                {raffles.map((raffle) => (
                                    <option key={raffle.id} value={raffle.id}>
                                        {raffle.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Búsqueda */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, teléfono, distrito, folio o número de boleto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {paidCustomers.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                            >
                                {/* Información esencial */}
                                <div className="mb-4">
                                    {order.raffleTitle && (
                                        <div className="mb-3 pb-3 border-b border-gray-200">
                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                🎰 {order.raffleTitle}
                                            </span>
                                        </div>
                                    )}
                                    {order.customer && <h3 className="text-lg font-bold text-gray-900 mb-2">{order.customer.name || 'Sin nombre'}</h3>}
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {order.customer && <p>📞 {order.customer.phone || 'Sin teléfono'}</p>}
                                        {order.folio && (
                                            <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 inline-block">
                                                🏷️ Folio: <span className="font-bold">{order.folio}</span>
                                            </p>
                                        )}
                                        <p>🎫 Boletos: {order.tickets?.join(', ') || 'N/A'}</p>
                                        <p className="font-bold text-green-600">💰 ${(order.totalAmount || order.total || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => handleView(order)}
                                        disabled={isLoadingAction}
                                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>Ver</span>
                                    </button>
                                    <button
                                        onClick={() => handleEdit(order)}
                                        disabled={isLoadingAction}
                                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Editar</span>
                                    </button>
                                    <button
                                        onClick={() => handleRelease(order.id!)}
                                        disabled={isLoadingAction}
                                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span>Liberar</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {paidCustomers.length === 0 && (
                        <div className="text-center py-12">
                            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes</h3>
                            <p className="text-gray-600">
                                {searchTerm ? 'No se encontraron clientes con los filtros aplicados' : 'Aún no hay clientes pagados'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detalles */}
            <AnimatePresence>
                {isDetailsOpen && selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={closeDetails}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Detalles del Cliente</h2>
                                    <button onClick={closeDetails} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedOrder.customer && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Nombre:</span>
                                                        <p className="font-medium">{selectedOrder.customer.name || 'Sin nombre'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Teléfono:</span>
                                                        <p className="font-medium">{selectedOrder.customer.phone || 'Sin teléfono'}</p>
                                                    </div>
                                                </>
                                            )}
                                            {selectedOrder.customer?.district && (
                                                <div>
                                                    <span className="text-sm text-gray-600">Distrito:</span>
                                                    <p className="font-medium">{selectedOrder.customer.district}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-sm text-gray-600">Monto:</span>
                                                <p className="font-bold text-green-600">${(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-blue-600" />
                                            Fechas Importantes
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">📅 Fecha y Hora de Apartado</span>
                                                <p className="font-medium text-gray-900 mt-1">
                                                    {formatDateTime(selectedOrder.createdAt)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Momento en que el cliente apartó los boletos
                                                </p>
                                            </div>
                                            {isPaid(selectedOrder.status) && (
                                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">✅ Fecha y Hora de Pago</span>
                                                    <p className="font-medium text-gray-900 mt-1">
                                                        {formatDateTime(getPaymentDate(selectedOrder))}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Momento en que se confirmó el pago
                                                    </p>
                                                </div>
                                            )}
                                            {!isPaid(selectedOrder.status) && (
                                                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                                    <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">⏳ Estado de Pago</span>
                                                    <p className="font-medium text-gray-900 mt-1">
                                                        Pendiente
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        El pago aún no ha sido confirmado
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Boletos</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Cantidad:</span>
                                                <p className="font-medium">{selectedOrder.tickets.length}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Números:</span>
                                                <p className="font-medium">{selectedOrder.tickets.join(', ')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                closeDetails();
                                                handleEdit(selectedOrder);
                                            }}
                                            disabled={isLoadingAction}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                closeDetails();
                                                handleRelease(selectedOrder.id!);
                                            }}
                                            disabled={isLoadingAction}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors disabled:opacity-50"
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>Liberar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Edición */}
            <AnimatePresence>
                {isEditOpen && editingOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={closeEdit}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Editar Orden</h2>
                                    <button onClick={closeEdit} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">✕</button>
                                </div>

                                <EditOrderForm
                                    order={editingOrder}
                                    onSave={handleSaveEdit}
                                    onCancel={closeEdit}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCustomersPage;