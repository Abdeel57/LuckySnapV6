import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  User,
  Calendar,
  Phone,
  MapPin,
  Download,
  RefreshCw,
  FileText,
  Mail
} from 'lucide-react';
import { Order, Raffle } from '../../types';
import { getOrders, updateOrder, deleteOrder } from '../../services/api';
import { getRaffles } from '../../services/api';
import EditOrderForm from '../../components/admin/EditOrderForm';

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, rafflesData] = await Promise.all([
                getOrders(),
                getRaffles()
            ]);
            setOrders(ordersData || []);
            setRaffles(rafflesData || []);
            console.log('📋 Orders and raffles loaded:', { orders: ordersData?.length || 0, raffles: rafflesData?.length || 0 });
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

    // Filtrar órdenes
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.phone.includes(searchTerm) ||
            order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Obtener rifa por ID
    const getRaffleById = (raffleId: string) => {
        return raffles.find(r => r.id === raffleId);
    };

    // Actualizar estado de orden
    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            setRefreshing(true);
            await updateOrder(orderId, { status: newStatus });
            await refreshData();
            console.log('✅ Order status updated:', { orderId, newStatus });
            alert(`Estado de la orden actualizado a: ${newStatus}`);
        } catch (error) {
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
            setRefreshing(true);
            await updateOrder(updatedOrder.id!, updatedOrder);
            await refreshData();
            handleCloseEditModal();
            console.log('✅ Order updated successfully');
        } catch (error) {
            console.error('❌ Error updating order:', error);
            alert('Error al actualizar la orden');
        } finally {
            setRefreshing(false);
        }
    };

    // Obtener color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            case 'EXPIRED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    // Obtener icono del estado
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return Clock;
            case 'COMPLETED': return CheckCircle;
            case 'CANCELLED': return XCircle;
            case 'EXPIRED': return Clock;
            default: return Clock;
        }
    };

    // Exportar órdenes
    const handleExportOrders = () => {
        const dataStr = JSON.stringify(orders, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `ordenes-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
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
                                <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
                                <p className="text-gray-600">Administra todas las órdenes de boletos</p>
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
                                <Download className="w-4 h-4" />
                                <span>Exportar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Órdenes</p>
                                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                            </div>
                            <ShoppingCart className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {orders.filter(o => o.status === 'PENDING').length}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completadas</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {orders.filter(o => o.status === 'COMPLETED').length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Vendido</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
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
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="PENDING">Pendientes</option>
                                <option value="COMPLETED">Completadas</option>
                                <option value="CANCELLED">Canceladas</option>
                                <option value="EXPIRED">Expiradas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de órdenes optimizada */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {filteredOrders.map((order) => {
                            const raffle = getRaffleById(order.raffleId);
                            const StatusIcon = getStatusIcon(order.status);
                            
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                                >
                                    {/* Header con folio y estado */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-xl">
                                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{order.folio}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString('es-ES')} - {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            <StatusIcon className="w-4 h-4 inline mr-1" />
                                            {order.status}
                                        </span>
                                    </div>
                                    
                                    {/* Información del cliente */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-gray-500" />
                                            Cliente
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">{order.customer.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">{order.customer.phone}</span>
                                            </div>
                                            {order.customer.email && (
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{order.customer.email}</span>
                                                </div>
                                            )}
                                            {order.customer.district && (
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{order.customer.district}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Detalles de la orden */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                                            Detalles
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Rifa:</span>
                                                <span className="font-medium text-gray-900">{raffle?.title || 'Rifa no encontrada'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Boletos:</span>
                                                <span className="font-medium text-gray-900">{order.tickets.length} ({order.tickets.join(', ')})</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total:</span>
                                                <span className="font-bold text-green-600 text-lg">
                                                    ${(order.totalAmount || order.total || 0).toLocaleString()}
                                                </span>
                                            </div>
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
                                        
                                        {order.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id!, 'COMPLETED')}
                                                className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Marcar Pagado</span>
                                            </button>
                                        )}
                                        
                                        {order.status === 'COMPLETED' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id!, 'PENDING')}
                                                className="flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors text-sm"
                                            >
                                                <Clock className="w-4 h-4" />
                                                <span>Liberar</span>
                                            </button>
                                        )}
                                        
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
                                {searchTerm || statusFilter !== 'all' 
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
                                            <div>
                                                <span className="text-sm text-gray-600">Nombre:</span>
                                                <p className="font-medium">{selectedOrder.customer.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Teléfono:</span>
                                                <p className="font-medium">{selectedOrder.customer.phone}</p>
                                            </div>
                                            {selectedOrder.customer.email && (
                                                <div>
                                                    <span className="text-sm text-gray-600">Email:</span>
                                                    <p className="font-medium">{selectedOrder.customer.email}</p>
                                                </div>
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
                                                <p className="font-medium">{selectedOrder.tickets.length}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Números:</span>
                                                <p className="font-medium">{selectedOrder.tickets.join(', ')}</p>
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
                                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Marcar Pagado</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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