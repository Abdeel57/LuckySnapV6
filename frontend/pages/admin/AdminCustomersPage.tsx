import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { getCustomers } from '../../services/api';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orders: Array<{
    id: string;
    folio: string;
    raffleId: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

const AdminCustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'totalSpent' | 'lastOrderDate'>('lastOrderDate');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const customersData = await getCustomers();
            setCustomers(customersData);
            console.log('👥 Customers loaded:', customersData.length);
        } catch (error) {
            console.error('❌ Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await loadCustomers();
        setRefreshing(false);
    };

    // Filtrar y ordenar clientes
    const filteredAndSortedCustomers = customers
        .filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.district.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'totalSpent':
                    return b.totalSpent - a.totalSpent;
                case 'lastOrderDate':
                default:
                    return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
            }
        });

    // Ver detalles de cliente
    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setSelectedCustomer(null);
        setIsModalOpen(false);
    };

    // Exportar clientes
    const handleExportCustomers = () => {
        const dataStr = JSON.stringify(customers, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `clientes-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Estadísticas
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue = totalCustomers > 0 ? totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) : 0;
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;

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
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
                                <p className="text-gray-600">Administra la base de datos de clientes</p>
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
                                <p className="text-sm text-gray-600">Total Clientes</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600" />
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
                                <p className="text-sm text-gray-600">Clientes Recurrentes</p>
                                <p className="text-2xl font-bold text-purple-600">{repeatCustomers}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ticket Promedio</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    ${averageOrderValue.toFixed(0)}
                                </p>
                            </div>
                            <ShoppingCart className="w-8 h-8 text-orange-600" />
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="lastOrderDate">Última compra</option>
                                <option value="totalSpent">Mayor gasto</option>
                                <option value="name">Nombre</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de clientes */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredAndSortedCustomers.map((customer) => (
                            <motion.div
                                key={customer.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                {customer.totalOrders} {customer.totalOrders === 1 ? 'orden' : 'órdenes'}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-2">Información de Contacto</h4>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-700">{customer.phone}</span>
                                                    </div>
                                                    {customer.email && (
                                                        <div className="flex items-center space-x-2">
                                                            <Mail className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-700">{customer.email}</span>
                                                        </div>
                                                    )}
                                                    {customer.district && (
                                                        <div className="flex items-center space-x-2">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-700">{customer.district}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-2">Historial de Compras</h4>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-700">
                                                            <strong>Total gastado:</strong> ${customer.totalSpent.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-700">
                                                            <strong>Primera compra:</strong> {new Date(customer.firstOrderDate).toLocaleDateString('es-ES')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-700">
                                                            <strong>Última compra:</strong> {new Date(customer.lastOrderDate).toLocaleDateString('es-ES')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => handleViewCustomer(customer)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Ver Detalles</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {filteredAndSortedCustomers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes</h3>
                            <p className="text-gray-600">
                                {searchTerm 
                                    ? 'No se encontraron clientes con los filtros aplicados'
                                    : 'Aún no hay clientes registrados'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalles */}
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
                            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Detalles del Cliente</h2>
                                    <button
                                        onClick={handleCloseModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <Eye className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Información del cliente */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Personal</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-600">Nombre</label>
                                                <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Teléfono</label>
                                                <p className="text-gray-900">{selectedCustomer.phone}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Email</label>
                                                <p className="text-gray-900">{selectedCustomer.email || 'No proporcionado'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Distrito</label>
                                                <p className="text-gray-900">{selectedCustomer.district || 'No proporcionado'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Estadísticas */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Estadísticas</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-600">Total de Órdenes</label>
                                                <p className="font-semibold text-gray-900">{selectedCustomer.totalOrders}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Total Gastado</label>
                                                <p className="font-semibold text-green-600 text-lg">
                                                    ${selectedCustomer.totalSpent.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Primera Compra</label>
                                                <p className="text-gray-900">{new Date(selectedCustomer.firstOrderDate).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Última Compra</label>
                                                <p className="text-gray-900">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString('es-ES')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Historial de órdenes */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Historial de Órdenes</h3>
                                        <div className="space-y-3">
                                            {selectedCustomer.orders.map((order) => (
                                                <div key={order.id} className="bg-gray-50 rounded-xl p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{order.folio}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(order.createdAt).toLocaleDateString('es-ES')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-green-600">
                                                                ${order.amount.toLocaleString()}
                                                            </p>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCustomersPage;