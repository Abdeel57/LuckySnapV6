import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  DollarSign,
  Calendar,
  RefreshCw,
  FileText,
  User
} from 'lucide-react';
import { Order, Raffle } from '../../types';
import { getOrders, updateOrder, deleteOrder } from '../../services/api';
import { getRaffles } from '../../services/api';
import EditOrderForm from '../../components/admin/EditOrderForm';

const AdminCustomersPage: React.FC = () => {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Order | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Filtrar solo órdenes pagadas (clientes confirmados)
    const customers = allOrders.filter(order => order.status === 'PAID');

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
            setAllOrders(ordersData || []);
            setRaffles(rafflesData || []);
            console.log('👥 Customers and raffles loaded:', { 
                totalOrders: ordersData?.length || 0, 
                paidCustomers: customers.length,
                raffles: rafflesData?.length || 0 
            });
        } catch (error) {
            console.error('❌ Error loading data:', error);
            alert('Error al cargar los datos. Verifica la conexión al servidor.');
            setAllOrders([]);
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

    // Filtrar clientes por búsqueda
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = 
            customer.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customer.phone.includes(searchTerm) ||
            customer.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customer.district.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    // Obtener rifa por ID
    const getRaffleById = (raffleId: string) => {
        return raffles.find(r => r.id === raffleId);
    };

    // Eliminar cliente (orden)
    const handleDeleteCustomer = async (customerId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esto no se puede deshacer.')) {
            try {
                setRefreshing(true);
                await deleteOrder(customerId);
                await refreshData();
                console.log('✅ Customer deleted:', customerId);
                alert('Cliente eliminado exitosamente');
            } catch (error) {
                console.error('❌ Error deleting customer:', error);
                alert(`Error al eliminar el cliente: ${error.message || 'Error desconocido'}`);
            } finally {
                setRefreshing(false);
            }
        }
    };

    // Ver detalles de cliente
    const handleViewCustomer = (customer: Order) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setSelectedCustomer(null);
        setIsModalOpen(false);
    };

    // Editar cliente
    const handleEditCustomer = (customer: Order) => {
        setEditingCustomer(customer);
        setIsEditModalOpen(true);
    };

    // Cerrar modal de edición
    const handleCloseEditModal = () => {
        setEditingCustomer(null);
        setIsEditModalOpen(false);
    };

    // Guardar cambios de cliente
    const handleSaveCustomerChanges = async (updatedCustomer: Order) => {
        try {
            setRefreshing(true);
            await updateOrder(updatedCustomer.id!, updatedCustomer);
            await refreshData();
            handleCloseEditModal();
            console.log('✅ Customer updated successfully');
        } catch (error) {
            console.error('❌ Error updating customer:', error);
            alert('Error al actualizar el cliente');
        } finally {
            setRefreshing(false);
        }
    };

    // Exportar clientes
    const handleExportCustomers = () => {
        const dataStr = JSON.stringify(customers, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `clientes-pagados-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Estadísticas
    const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalAmount || customer.total || 0), 0);
    const averageOrderValue = customers.length > 0 ? totalRevenue / customers.length : 0;

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
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Clientes Confirmados</h1>
                                <p className="text-gray-600">Clientes que han pagado sus órdenes</p>
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
                                onClick={handleExportCustomers}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
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
                                <p className="text-sm text-gray-600">Total Clientes</p>
                                <p className="text-2xl font-bold text-green-600">{customers.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ingresos Totales</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${totalRevenue.toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ticket Promedio</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    ${averageOrderValue.toFixed(0)}
                                </p>
                            </div>
                            <ShoppingCart className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Estado</p>
                                <p className="text-2xl font-bold text-green-600">Pagados</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
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
                                    placeholder="Buscar por nombre, teléfono, email o distrito..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <div className="px-3 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-medium">
                                Clientes Pagados
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de clientes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {filteredCustomers.map((customer) => {
                            const raffle = getRaffleById(customer.raffleId);
                            
                            return (
                                <motion.div
                                    key={customer.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                                >
                                    {/* Header con folio y estado */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 rounded-xl">
                                                <Users className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{customer.folio}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(customer.createdAt).toLocaleDateString('es-ES')} - {new Date(customer.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-4 h-4 inline mr-1" />
                                            PAGADO
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
                                                <span className="font-medium text-gray-900">{customer.customer.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">{customer.customer.phone}</span>
                                            </div>
                                            {customer.customer.email && (
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{customer.customer.email}</span>
                                                </div>
                                            )}
                                            {customer.customer.district && (
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{customer.customer.district}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Detalles de la compra */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                                            Compra
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Rifa:</span>
                                                <span className="font-medium text-gray-900">{raffle?.title || 'Rifa no encontrada'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Boletos:</span>
                                                <span className="font-medium text-gray-900">{customer.tickets.length} ({customer.tickets.join(', ')})</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total:</span>
                                                <span className="font-bold text-green-600 text-lg">
                                                    ${(customer.totalAmount || customer.total || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Botones de acción */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleViewCustomer(customer)}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Ver</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleEditCustomer(customer)}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleDeleteCustomer(customer.id!)}
                                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm col-span-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            <span>Eliminar</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    
                    {filteredCustomers.length === 0 && (
                        <div className="text-center py-12 col-span-2">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes pagados</h3>
                            <p className="text-gray-600">
                                {searchTerm 
                                    ? 'No se encontraron clientes con los filtros aplicados'
                                    : 'Aún no hay clientes que hayan pagado sus órdenes'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalles de cliente */}
            <AnimatePresence>
                {isModalOpen && selectedCustomer && (
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
                                    <h2 className="text-2xl font-bold text-gray-900">Detalles del Cliente</h2>
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
                                        <h3 className="font-semibold text-gray-900 mb-3">Información de la Orden</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Folio:</span>
                                                <p className="font-medium">{selectedCustomer.folio}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Estado:</span>
                                                <p className="font-medium text-green-600">PAGADO</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Fecha:</span>
                                                <p className="font-medium">
                                                    {new Date(selectedCustomer.createdAt!).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Total:</span>
                                                <p className="font-bold text-green-600">
                                                    ${(selectedCustomer.totalAmount || selectedCustomer.total || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información del cliente */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Nombre:</span>
                                                <p className="font-medium">{selectedCustomer.customer.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Teléfono:</span>
                                                <p className="font-medium">{selectedCustomer.customer.phone}</p>
                                            </div>
                                            {selectedCustomer.customer.email && (
                                                <div>
                                                    <span className="text-sm text-gray-600">Email:</span>
                                                    <p className="font-medium">{selectedCustomer.customer.email}</p>
                                                </div>
                                            )}
                                            {selectedCustomer.customer.district && (
                                                <div>
                                                    <span className="text-sm text-gray-600">Distrito:</span>
                                                    <p className="font-medium">{selectedCustomer.customer.district}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Boletos */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Boletos Comprados</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Cantidad:</span>
                                                <p className="font-medium">{selectedCustomer.tickets.length}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Números:</span>
                                                <p className="font-medium">{selectedCustomer.tickets.join(', ')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                handleCloseModal();
                                                handleEditCustomer(selectedCustomer);
                                            }}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de edición */}
            <AnimatePresence>
                {isEditModalOpen && editingCustomer && (
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
                                    <h2 className="text-2xl font-bold text-gray-900">Editar Cliente</h2>
                                    <button
                                        onClick={handleCloseEditModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <XCircle className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                                
                                <EditOrderForm
                                    order={editingCustomer}
                                    onSave={handleSaveCustomerChanges}
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

export default AdminCustomersPage;