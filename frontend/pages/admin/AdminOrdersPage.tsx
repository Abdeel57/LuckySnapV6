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
  RefreshCw
} from 'lucide-react';
import { Order, Raffle } from '../../types';
import { getOrders, updateOrder, deleteOrder } from '../../services/api';
import { getRaffles } from '../../services/api';

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            setOrders(ordersData);
            setRaffles(rafflesData);
            console.log('📋 Orders and raffles loaded:', { orders: ordersData.length, raffles: rafflesData.length });
        } catch (error) {
            console.error('❌ Error loading data:', error);
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
        } catch (error) {
            console.error('❌ Error updating order status:', error);
            alert('Error al actualizar el estado de la orden');
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
            } catch (error) {
                console.error('❌ Error deleting order:', error);
                alert('Error al eliminar la orden');
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

                {/* Lista de órdenes */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredOrders.map((order) => {
                            const raffle = getRaffleById(order.raffleId);
                            const StatusIcon = getStatusIcon(order.status);
                            
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="text-lg font-bold text-gray-900">{order.folio}</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                    <StatusIcon className="w-4 h-4 inline mr-1" />
                                                    {order.status}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-700">{order.customer.name}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-700">{order.customer.phone}</span>
                                                        </div>
                                                        {order.customer.email && (
                                                            <div className="flex items-center space-x-2">
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
                                                
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-2">Detalles de la Orden</h3>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-gray-700">
                                                                <strong>Rifa:</strong> {raffle?.title || 'Rifa no encontrada'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-gray-700">
                                                                <strong>Boletos:</strong> {order.tickets.length} ({order.tickets.join(', ')})
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-700">
                                                                <strong>Total:</strong> ${order.totalAmount?.toLocaleString() || '0'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-700">
                                                                {new Date(order.createdAt).toLocaleDateString('es-ES')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>Ver</span>
                                            </button>
                                            
                                            {order.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Completar</span>
                                                </button>
                                            )}
                                            
                                            {order.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'PENDING')}
                                                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                    <span>Pendiente</span>
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Eliminar</span>
                                            </button>
                                        </div>
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
        </div>
    );
};

export default AdminOrdersPage;