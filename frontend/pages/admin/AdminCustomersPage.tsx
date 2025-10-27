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
import { Order } from '../../types';
import { getOrders, updateOrder, releaseOrder } from '../../services/api';
import EditOrderForm from '../../components/admin/EditOrderForm';

const AdminCustomersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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
            const data = await getOrders(1, 200);
            setOrders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error cargando órdenes:', e);
            alert('Error al cargar datos. Verifica el servidor.');
            setOrders([]);
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
        const base = orders.filter(o => isPaid(String(o.status)));
        if (!searchTerm) return base;
        const term = searchTerm.toLowerCase();
        return base.filter(o => {
            const name = o.customer?.name?.toLowerCase?.() || '';
            const phone = o.customer?.phone || '';
            const district = o.customer?.district?.toLowerCase?.() || '';
            return (
                name.includes(term) ||
                phone.includes(searchTerm) ||
                district.includes(term)
            );
        });
    }, [orders, searchTerm]);

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


                {/* Búsqueda */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, teléfono o distrito..."
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
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{order.customer.name}</h3>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>📞 {order.customer.phone}</p>
                                        <p>🎫 Boletos: {order.tickets.join(', ')}</p>
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
                                        <h3 className="font-semibold text-gray-900 mb-3">Información</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Nombre:</span>
                                                <p className="font-medium">{selectedOrder.customer.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Teléfono:</span>
                                                <p className="font-medium">{selectedOrder.customer.phone}</p>
                                            </div>
                                            {selectedOrder.customer.district && (
                                                <div>
                                                    <span className="text-sm text-gray-600">Distrito:</span>
                                                    <p className="font-medium">{selectedOrder.customer.district}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-sm text-gray-600">Fecha:</span>
                                                <p className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('es-ES') : ''}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Monto:</span>
                                                <p className="font-bold text-green-600">${(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</p>
                                            </div>
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