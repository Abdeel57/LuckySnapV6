import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Search,
    Eye,
    FileText,
    Clock,
    RefreshCw,
    Ticket,
    ArrowLeft,
    Users,
    CreditCard,
    ArrowLeftRight,
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
    const [searchType, setSearchType] = useState<'nombre' | 'telefono' | 'folio' | 'boleto'>('nombre');
    const [selectedRaffleId, setSelectedRaffleId] = useState<string>('');
    const [viewMode, setViewMode] = useState<'rifas' | 'clientes'>('rifas'); // Nueva vista: rifas o clientes
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

    // Helper para obtener el badge del método de pago
    const getPaymentMethodBadge = (paymentMethod: string | null | undefined) => {
        if (!paymentMethod) {
            return {
                label: 'Sin método',
                icon: Clock,
                className: 'bg-gray-100 text-gray-700 border-gray-300',
                iconColor: 'text-gray-600'
            };
        }
        
        switch (paymentMethod.toLowerCase()) {
            case 'paypal':
                return {
                    label: 'Tarjeta',
                    icon: CreditCard,
                    className: 'bg-blue-100 text-blue-700 border-blue-300',
                    iconColor: 'text-blue-600'
                };
            case 'transfer':
            case 'transferencia':
                return {
                    label: 'Transferencia',
                    icon: ArrowLeftRight,
                    className: 'bg-green-100 text-green-700 border-green-300',
                    iconColor: 'text-green-600'
                };
            default:
                return {
                    label: paymentMethod,
                    icon: Clock,
                    className: 'bg-gray-100 text-gray-700 border-gray-300',
                    iconColor: 'text-gray-600'
                };
        }
    };

    // Calcular estadísticas por rifa
    const rafflesWithStats = useMemo(() => {
        const paidOrders = orders.filter(o => isPaid(String(o.status)));
        
        return raffles.map(raffle => {
            const raffleOrders = paidOrders.filter(o => o.raffleId === raffle.id);
            const uniqueCustomers = new Set(raffleOrders.map(o => o.customer?.phone || o.customer?.name || o.id));
            
            return {
                ...raffle,
                customerCount: uniqueCustomers.size,
                orderCount: raffleOrders.length,
                totalRevenue: raffleOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0),
            };
        }).filter(r => r.customerCount > 0); // Solo mostrar rifas con clientes pagados
    }, [raffles, orders]);

    const paidCustomers = useMemo(() => {
        // Filtrar por rifa primero
        let base = orders.filter(o => isPaid(String(o.status)));
        if (selectedRaffleId) {
            base = base.filter(o => o.raffleId === selectedRaffleId);
        }
        
        if (!searchTerm) return base;
        const term = searchTerm.toLowerCase();
        return base.filter(o => {
            switch (searchType) {
                case 'nombre':
                    // Nombre permite búsqueda parcial
                    return o.customer?.name?.toLowerCase?.().includes(term);
                case 'telefono':
                    // Teléfono debe ser búsqueda exacta (sin espacios, guiones, etc.)
                    const cleanPhone = searchTerm.replace(/[\s\-\(\)]/g, '');
                    const orderPhone = o.customer?.phone?.replace(/[\s\-\(\)]/g, '');
                    return orderPhone?.includes(cleanPhone);
                case 'folio':
                    // Folio debe ser búsqueda exacta
                    return o.folio?.toLowerCase() === searchTerm.toLowerCase();
                case 'boleto':
                    // Boleto debe ser búsqueda exacta
                    const boletoNum = parseInt(searchTerm);
                    return !isNaN(boletoNum) && o.tickets?.includes(boletoNum);
                default:
                    return true;
            }
        });
    }, [orders, searchTerm, selectedRaffleId]);

    // Manejar selección de rifa
    const handleRaffleSelect = (raffleId: string) => {
        setSelectedRaffleId(raffleId);
        setViewMode('clientes');
        setSearchTerm(''); // Limpiar búsqueda al cambiar de rifa
    };

    // Volver a vista de rifas
    const handleBackToRaffles = () => {
        setViewMode('rifas');
        setSelectedRaffleId('');
        setSearchTerm('');
    };

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

    const selectedRaffle = raffles.find(r => r.id === selectedRaffleId);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                                <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {viewMode === 'rifas' ? 'Clientes por Rifa' : selectedRaffle?.title || 'Clientes'}
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600">
                                    {viewMode === 'rifas' ? 'Selecciona una rifa para ver sus clientes' : 'Clientes con pago confirmado'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {viewMode === 'clientes' && (
                                <button
                                    onClick={handleBackToRaffles}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Volver</span>
                                </button>
                            )}
                            <button
                                onClick={refreshData}
                                disabled={refreshing}
                                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>Actualizar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vista de Rifas */}
                {viewMode === 'rifas' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <AnimatePresence>
                            {rafflesWithStats.map((raffle) => (
                                <motion.div
                                    key={raffle.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    onClick={() => handleRaffleSelect(raffle.id)}
                                    className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-6 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex-shrink-0">
                                                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate leading-tight">
                                                    {raffle.title}
                                                </h3>
                                            </div>
                                        </div>
                                        {raffle.description && (
                                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 ml-11">
                                                {raffle.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2.5 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between py-1.5">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <Users className="w-4 h-4 text-blue-600" />
                                                <span>Clientes</span>
                                            </div>
                                            <span className="text-base sm:text-lg font-bold text-blue-600">
                                                {raffle.customerCount}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <Ticket className="w-4 h-4 text-purple-600" />
                                                <span>Órdenes</span>
                                            </div>
                                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                                                {raffle.orderCount}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                                            <span className="text-xs sm:text-sm text-gray-600 font-medium">Total</span>
                                            <span className="text-base sm:text-lg font-bold text-green-600">
                                                L. {raffle.totalRevenue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {rafflesWithStats.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay rifas con clientes</h3>
                                <p className="text-gray-600">Aún no hay rifas con clientes pagados</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Búsqueda y Filtros - Solo en vista de clientes */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Tipo de búsqueda */}
                                <div className="w-full md:w-auto md:min-w-[150px]">
                                    <select
                                        value={searchType}
                                        onChange={(e) => setSearchType(e.target.value as 'nombre' | 'telefono' | 'folio' | 'boleto')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="nombre">Buscar por nombre</option>
                                        <option value="telefono">Buscar por teléfono</option>
                                        <option value="folio">Buscar por folio</option>
                                        <option value="boleto">Buscar por boleto</option>
                                    </select>
                                </div>

                                {/* Búsqueda */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type={searchType === 'nombre' ? 'text' :
                                                  searchType === 'telefono' ? 'tel' :
                                                  searchType === 'folio' ? 'text' : 'number'}
                                            placeholder={
                                                searchType === 'nombre' ? 'Ingresa el nombre...' :
                                                searchType === 'telefono' ? 'Ingresa el teléfono (ej: 9999-9999)' :
                                                searchType === 'folio' ? 'Ingresa el folio exacto (ej: LKSNP-XXXXX)' :
                                                'Ingresa el número de boleto exacto'
                                            }
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Clientes - Optimizada para móviles */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {paidCustomers.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all"
                                    >
                                        {/* Información del cliente - Optimizada para móviles */}
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    {order.customer && (
                                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                                                            {order.customer.name || 'Sin nombre'}
                                                        </h3>
                                                    )}
                                                    {order.customer?.phone && (
                                                        <a 
                                                            href={`tel:${order.customer.phone}`}
                                                            className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
                                                        >
                                                            <span>📞</span>
                                                            <span>{order.customer.phone}</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    {order.folio && (
                                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                            {order.folio}
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const paymentBadge = getPaymentMethodBadge((order as any).paymentMethod);
                                                        const IconComponent = paymentBadge.icon;
                                                        return (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${paymentBadge.className} whitespace-nowrap`}>
                                                                <IconComponent className={`w-3.5 h-3.5 ${paymentBadge.iconColor}`} />
                                                                {paymentBadge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">Boletos</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {order.tickets?.length || 0}
                                                    </p>
                                                    {order.tickets && order.tickets.length > 0 && (
                                                        <p className="text-xs text-gray-600 mt-1 truncate">
                                                            {order.tickets.slice(0, 3).join(', ')}
                                                            {order.tickets.length > 3 && ` +${order.tickets.length - 3}`}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-gray-500 text-xs mb-1">Total</p>
                                                    <p className="font-bold text-green-600 text-base sm:text-lg">
                                                        L. {(order.totalAmount || order.total || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones de acción - Optimizados para móviles */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <button
                                                onClick={() => handleView(order)}
                                                disabled={isLoadingAction}
                                                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors text-xs sm:text-sm disabled:opacity-50 active:scale-95"
                                            >
                                                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="hidden sm:inline">Ver</span>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(order)}
                                                disabled={isLoadingAction}
                                                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 sm:px-3 sm:py-2 bg-purple-600 text-white rounded-lg sm:rounded-xl hover:bg-purple-700 transition-colors text-xs sm:text-sm disabled:opacity-50 active:scale-95"
                                            >
                                                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </button>
                                            <button
                                                onClick={() => handleRelease(order.id!)}
                                                disabled={isLoadingAction}
                                                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 sm:px-3 sm:py-2 bg-yellow-600 text-white rounded-lg sm:rounded-xl hover:bg-yellow-700 transition-colors text-xs sm:text-sm disabled:opacity-50 active:scale-95"
                                            >
                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="hidden sm:inline">Liberar</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {paidCustomers.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes</h3>
                                    <p className="text-gray-600">
                                        {searchTerm ? 'No se encontraron clientes con los filtros aplicados' : 'Aún no hay clientes pagados en esta rifa'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
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
                                                <p className="font-bold text-green-600">L. {(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-sm text-gray-600">Método de Pago:</span>
                                                {(() => {
                                                    const paymentBadge = getPaymentMethodBadge((selectedOrder as any).paymentMethod);
                                                    const IconComponent = paymentBadge.icon;
                                                    return (
                                                        <div className="mt-1">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${paymentBadge.className}`}>
                                                                <IconComponent className={`w-4 h-4 ${paymentBadge.iconColor}`} />
                                                                {paymentBadge.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
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