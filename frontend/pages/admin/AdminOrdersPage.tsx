import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  FileText,
  Download as DownloadIcon,
  Clock
} from 'lucide-react';
import { Order, Raffle, Settings } from '../../types';
import { getOrders, updateOrder, deleteOrder, markOrderPaid, releaseOrder, getSettings } from '../../services/api';
import { getRaffles } from '../../services/api';
import EditOrderForm from '../../components/admin/EditOrderForm';
import PaymentMethodModal from '../../components/admin/PaymentMethodModal';
import PaymentConfirmationModal from '../../components/admin/PaymentConfirmationModal';

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<string | null>(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [paidOrder, setPaidOrder] = useState<Order | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, rafflesData, settingsData] = await Promise.all([
                getOrders(),
                getRaffles(),
                getSettings()
            ]);
            
            // Deduplicar órdenes por ID o folio para evitar duplicados
            const uniqueOrders = (ordersData || []).reduce((acc: Order[], order: Order) => {
                const exists = acc.find(
                    (o) => o.id === order.id || 
                    (o.folio && order.folio && o.folio === order.folio)
                );
                if (!exists) {
                    acc.push(order);
                }
                return acc;
            }, []);
            
            setOrders(uniqueOrders);
            setRaffles(rafflesData || []);
            setSettings(settingsData || null);
            console.log('📋 Orders and raffles loaded:', { 
                total: ordersData?.length || 0, 
                unique: uniqueOrders.length,
                duplicates: (ordersData?.length || 0) - uniqueOrders.length,
                raffles: rafflesData?.length || 0 
            });
        } catch (error) {
            console.error('❌ Error loading data:', error);
            // Mostrar mensaje de error al usuario
            alert('Error al cargar los datos. Verifica la conexión al servidor.');
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

    // Filtrar órdenes - SOLO PENDING con deduplicación adicional
    const filteredOrdersMap = new Map<string | undefined, Order>();
    
    orders.forEach(order => {
        // Solo mostrar órdenes PENDING
        if (order.status !== 'PENDING') return;
        
        // Validar que customer existe
        if (!order.customer) return;
        
        // Validar búsqueda
        const matchesSearch = 
            !searchTerm ||
            order.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.phone?.includes(searchTerm) ||
            order.customer.district?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return;
        
        // Usar folio como clave única (o ID como fallback)
        const uniqueKey = order.folio || order.id;
        
        // Solo agregar si no existe ya (priorizar la más reciente por createdAt)
        if (!filteredOrdersMap.has(uniqueKey)) {
            filteredOrdersMap.set(uniqueKey, order);
        } else {
            const existing = filteredOrdersMap.get(uniqueKey);
            // Mantener la orden más reciente si hay duplicados
            if (existing && order.createdAt && existing.createdAt && 
                new Date(order.createdAt) > new Date(existing.createdAt)) {
                filteredOrdersMap.set(uniqueKey, order);
            }
        }
    });
    
    const filteredOrders = Array.from(filteredOrdersMap.values());

    // Abrir modal de método de pago
    const handleOpenPaymentModal = (orderId: string) => {
        setSelectedOrderForPayment(orderId);
        setIsPaymentModalOpen(true);
    };

    // Confirmar pago con método y notas
    const handleConfirmPayment = async (paymentMethod: string, notes: string) => {
        if (!selectedOrderForPayment) return;
        
        try {
            setRefreshing(true);
            const paidOrderResult = await markOrderPaid(selectedOrderForPayment, paymentMethod, notes);
            console.log('✅ Order marked as paid:', { orderId: selectedOrderForPayment, paymentMethod, notes });
            
            // Guardar la orden pagada y mostrar modal de confirmación
            setPaidOrder(paidOrderResult);
            setIsPaymentModalOpen(false);
            setIsConfirmationModalOpen(true);
            setSelectedOrderForPayment(null);
            
            // Refrescar datos en segundo plano
            refreshData();
        } catch (error: any) {
            console.error('❌ Error marking order as paid:', error);
            alert(`Error al marcar la orden como pagada: ${error.message || 'Error desconocido'}`);
        } finally {
            setRefreshing(false);
        }
    };

    // Actualizar estado de orden
    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            setRefreshing(true);
            
            // Para COMPLETED, abrir modal de método de pago
            if (newStatus === 'COMPLETED') {
                handleOpenPaymentModal(orderId);
                return;
            }
            
            await updateOrder(orderId, { status: newStatus });
            console.log('✅ Order status updated:', { orderId, newStatus });
            alert(`Estado de la orden actualizado a: ${newStatus}`);
            
            await refreshData();
        } catch (error: any) {
            console.error('❌ Error updating order status:', error);
            alert(`Error al actualizar el estado de la orden: ${error.message || 'Error desconocido'}`);
        } finally {
            setRefreshing(false);
        }
    };

    // Eliminar orden
    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta orden? Esto no se puede deshacer.')) {
            try {
                setRefreshing(true);
                await deleteOrder(orderId);
                await refreshData();
                console.log('✅ Order deleted:', orderId);
                alert('Orden eliminada exitosamente');
            } catch (error) {
                console.error('❌ Error deleting order:', error);
                alert(`Error al eliminar la orden: ${error.message || 'Error desconocido'}`);
            } finally {
                setRefreshing(false);
            }
        }
    };

    // Ver detalles de orden
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setSelectedOrder(null);
        setIsModalOpen(false);
    };

    // Editar orden
    const handleEditOrder = (order: Order) => {
        setEditingOrder(order);
        setIsEditModalOpen(true);
    };

    // Cerrar modal de edición
    const handleCloseEditModal = () => {
        setEditingOrder(null);
        setIsEditModalOpen(false);
    };

    // Guardar cambios de orden
    const handleSaveOrderChanges = async (updatedOrder: Order) => {
        try {
            setIsLoadingAction(true);
            await updateOrder(updatedOrder.id!, updatedOrder);
            await refreshData();
            handleCloseEditModal();
            console.log('✅ Order updated successfully');
            alert('✅ Orden actualizada correctamente');
        } catch (error) {
            console.error('❌ Error updating order:', error);
            alert(`❌ Error: ${error.message || 'Error al actualizar la orden'}`);
        } finally {
            setIsLoadingAction(false);
        }
    };

    // Liberar boletos usando releaseOrder
    const handleReleaseOrder = async (orderId: string) => {
        if (!window.confirm('¿Estás seguro de liberar estos boletos? Volverán al inventario.')) return;
        try {
            setIsLoadingAction(true);
            await releaseOrder(orderId);
            await refreshData();
            handleCloseModal();
            console.log('✅ Order released successfully');
            alert('✅ Boletos liberados correctamente');
        } catch (error) {
            console.error('❌ Error releasing order:', error);
            alert(`❌ Error: ${error.message || 'Error al liberar la orden'}`);
        } finally {
            setIsLoadingAction(false);
        }
    };

    // Exportar órdenes
    const handleExportOrders = () => {
        try {
            // Filtrar solo órdenes con datos válidos
            const validOrders = orders.filter(order => order.customer && order.tickets);
            const dataStr = JSON.stringify(validOrders, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `ordenes-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        } catch (error) {
            console.error('Error exporting orders:', error);
            alert('Error al exportar las órdenes');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando órdenes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Apartados Pendientes</h1>
                                <p className="text-gray-600">Órdenes pendientes de pago</p>
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
                            
                            <button
                                onClick={handleExportOrders}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span>Exportar</span>
                            </button>
                        </div>
                    </div>
                </div>


                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por folio, cliente, teléfono o email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                    </div>
                </div>

                {/* Lista de órdenes optimizada */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {filteredOrders.map((order) => {
                            return (
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
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{order.folio}</h3>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            {order.customer && (
                                                <>
                                                    <p>👤 {order.customer.name || 'Sin nombre'}</p>
                                                    <p>📞 {order.customer.phone || 'Sin teléfono'}</p>
                                                </>
                                            )}
                                            <p>🎫 Boletos: {order.tickets?.join(', ') || 'N/A'}</p>
                                            <p className="font-bold text-green-600">💰 ${(order.totalAmount || order.total || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleViewOrder(order)}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Ver</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleEditOrder(order)}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleUpdateStatus(order.id!, 'COMPLETED')}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Marcar Pagado</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleDeleteOrder(order.id!)}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            <span>Eliminar</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay órdenes</h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'No se encontraron órdenes con los filtros aplicados'
                                    : 'Aún no hay órdenes registradas'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalles de orden */}
            <AnimatePresence>
                {isModalOpen && selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={handleCloseModal}
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
                                    <h2 className="text-2xl font-bold text-gray-900">Detalles de la Orden</h2>
                                    <button
                                        onClick={handleCloseModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <XCircle className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Información del Sorteo */}
                                    {selectedOrder.raffleTitle && (
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <span>🎰</span>
                                                <span>Sorteo</span>
                                            </h3>
                                            <p className="font-bold text-blue-800 text-lg">{selectedOrder.raffleTitle}</p>
                                        </div>
                                    )}

                                    {/* Información básica */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Información Básica</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Folio:</span>
                                                <p className="font-medium">{selectedOrder.folio}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Estado:</span>
                                                <p className="font-medium">{selectedOrder.status}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Fecha:</span>
                                                <p className="font-medium">
                                                    {new Date(selectedOrder.createdAt!).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Total:</span>
                                                <p className="font-bold text-green-600">
                                                    ${(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información del cliente */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Cliente</h3>
                                        <div className="space-y-2">
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
                                            {selectedOrder.customer.district && (
                                                <div>
                                                    <span className="text-sm text-gray-600">Distrito:</span>
                                                    <p className="font-medium">{selectedOrder.customer.district}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Boletos */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Boletos</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Cantidad:</span>
                                                <p className="font-medium">{selectedOrder.tickets?.length || 0}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Números:</span>
                                                <p className="font-medium">{selectedOrder.tickets?.join(', ') || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                handleCloseModal();
                                                handleEditOrder(selectedOrder);
                                            }}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                        
                                        {selectedOrder.status === 'PENDING' && (
                                            <button
                                                onClick={() => {
                                                    handleCloseModal();
                                                    handleUpdateStatus(selectedOrder.id!, 'COMPLETED');
                                                }}
                                                disabled={isLoadingAction}
                                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Marcar Pagado</span>
                                            </button>
                                        )}
                                        
                                        {selectedOrder.status === 'COMPLETED' && (
                                            <button
                                                onClick={() => {
                                                    handleCloseModal();
                                                    handleReleaseOrder(selectedOrder.id!);
                                                }}
                                                disabled={isLoadingAction}
                                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors disabled:opacity-50"
                                            >
                                                <Clock className="w-4 h-4" />
                                                <span>Liberar Boletos</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                    )}
            </AnimatePresence>

            {/* Modal de método de pago */}
            <PaymentMethodModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedOrderForPayment(null);
                }}
                onSave={handleConfirmPayment}
            />

            {/* Modal de confirmación post-pago */}
            <PaymentConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => {
                    setIsConfirmationModalOpen(false);
                    setPaidOrder(null);
                }}
                order={paidOrder}
                settings={settings || undefined}
            />

            {/* Modal de edición */}
            <AnimatePresence>
                {isEditModalOpen && editingOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={handleCloseEditModal}
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
                                    <button
                                        onClick={handleCloseEditModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <XCircle className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                                
                                <EditOrderForm
                                    order={editingOrder}
                                    onSave={handleSaveOrderChanges}
                                    onCancel={handleCloseEditModal}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrdersPage;