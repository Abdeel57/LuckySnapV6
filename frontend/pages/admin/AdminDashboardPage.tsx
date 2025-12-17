import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Users, BarChart3, Calendar, DollarSign, List, TrendingUp, Clock, CheckCircle, AlertCircle, Package, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import MetaPixelManager from '../../components/admin/MetaPixelManager';
import { getDashboardStats, getOrders, getRaffles } from '../../services/api';
import { Order, Raffle } from '../../types';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../contexts/AuthContext';

const QuickActionCard = ({ 
    icon: Icon, 
    title, 
    description, 
    onClick, 
    color 
}: { 
    icon: React.ElementType, 
    title: string, 
    description: string, 
    onClick: () => void, 
    color: string 
}) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-left w-full"
    >
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color} mb-2 sm:mb-3 w-fit`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{description}</p>
    </motion.button>
);

interface DashboardStats {
    todaySales: number;
    pendingOrders: number;
    activeRaffles: number;
}

const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle,
    color,
    trend 
}: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number, 
    subtitle?: string,
    color: string,
    trend?: { value: number; isPositive: boolean }
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
    >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            {trend && (
                <div className={`flex items-center space-x-1 text-xs sm:text-sm font-semibold ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                    <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
                    <span>{Math.abs(trend.value)}%</span>
                </div>
            )}
        </div>
        <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 break-words">{value}</h3>
            <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1 hidden sm:block">{subtitle}</p>}
        </div>
    </motion.div>
);

const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isVendedor = user?.role === 'ventas';
    const [activeTab, setActiveTab] = useState<'overview' | 'meta'>('overview');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [recentRaffles, setRecentRaffles] = useState<Raffle[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // Si es vendedor, solo cargar órdenes y clientes
                if (isVendedor) {
                    // Cargar últimas órdenes (10 más recientes)
                    const ordersData = await getOrders(1, 10);
                    const orders = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.orders || [];
                    setRecentOrders(orders.slice(0, 5)); // Últimas 5 órdenes
                    
                    // Extraer clientes únicos de órdenes pagadas
                    const paidOrders = orders.filter(order => 
                        order.status === 'PAID' || order.status === 'COMPLETED'
                    );
                    // Agrupar por cliente y tomar los más recientes
                    const uniqueCustomers = new Map();
                    paidOrders.forEach(order => {
                        if (order.customer?.name || order.customer?.phone) {
                            const customerKey = order.customer?.phone || order.customer?.name;
                            if (!uniqueCustomers.has(customerKey) || 
                                new Date(order.createdAt) > new Date(uniqueCustomers.get(customerKey).createdAt)) {
                                uniqueCustomers.set(customerKey, order);
                            }
                        }
                    });
                    setRecentCustomers(Array.from(uniqueCustomers.values()).slice(0, 5));
                } else {
                    // Cargar estadísticas (solo para admin/superadmin)
                    const statsData = await getDashboardStats();
                    setStats(statsData);

                    // Cargar últimas órdenes (5 más recientes)
                    const ordersData = await getOrders(1, 5);
                    const orders = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.orders || [];
                    setRecentOrders(orders);

                    // Cargar rifas recientes (5 más recientes)
                    const rafflesData = await getRaffles();
                    const activeRaffles = (Array.isArray(rafflesData) ? rafflesData : []).slice(0, 5);
                    setRecentRaffles(activeRaffles);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'overview') {
            loadDashboardData();
        }
    }, [activeTab, isVendedor]);

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-6">
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 text-sm">Resumen general de tu plataforma</p>
                </div>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </div>

            {/* Tabs - Solo mostrar si no es vendedor */}
            {!isVendedor && (
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Resumen
                        </button>
                        <button
                            onClick={() => setActiveTab('meta')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === 'meta'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Meta Pixel & Ads
                        </button>
                    </nav>
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                            </div>
                        </div>
                    ) : isVendedor ? (
                        /* Vista simplificada para vendedores */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Últimas Órdenes */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        <span className="hidden sm:inline">Últimas Órdenes</span>
                                        <span className="sm:hidden">Órdenes</span>
                                    </h2>
                                    <button
                                        onClick={() => navigate('/admin/apartados')}
                                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                                    >
                                        Ver todas →
                                    </button>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    {recentOrders.length === 0 ? (
                                        <p className="text-gray-500 text-xs sm:text-sm text-center py-4">No hay órdenes recientes</p>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                                onClick={() => navigate('/admin/apartados')}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                    <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                                                        order.status === 'PAID' 
                                                            ? 'bg-green-100' 
                                                            : order.status === 'PENDING' 
                                                            ? 'bg-orange-100' 
                                                            : 'bg-gray-100'
                                                    }`}>
                                                        {order.status === 'PAID' ? (
                                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                        ) : (
                                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                            {order.customer?.name || 'Sin nombre'}
                                                        </p>
                                                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 truncate">
                                                            <span className="font-mono text-xs">{order.folio}</span>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="truncate">{order.raffleTitle}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                                                        L. {order.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDate(order.createdAt)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Clientes Recientes */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                        <span>Clientes Recientes</span>
                                    </h2>
                                    <button
                                        onClick={() => navigate('/admin/clientes')}
                                        className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                                    >
                                        Ver todos →
                                    </button>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    {recentCustomers.length === 0 ? (
                                        <p className="text-gray-500 text-xs sm:text-sm text-center py-4">No hay clientes recientes</p>
                                    ) : (
                                        recentCustomers.map((order) => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                                onClick={() => navigate('/admin/clientes')}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                    <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0 bg-green-100">
                                                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                            {order.customer?.name || 'Sin nombre'}
                                                        </p>
                                                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 truncate">
                                                            {order.customer?.phone && (
                                                                <>
                                                                    <span>{order.customer.phone}</span>
                                                                    <span className="hidden sm:inline">•</span>
                                                                </>
                                                            )}
                                                            <span className="truncate">{order.raffleTitle}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <div className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full inline-block bg-green-100 text-green-700">
                                                        Pagado
                                                    </div>
                                                    <p className="text-xs text-gray-500 whitespace-nowrap mt-1">
                                                        {formatDate(order.createdAt)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Vista completa para admin/superadmin */
                        <>
                            {/* Estadísticas principales - Optimizado para móvil */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <StatCard
                                    icon={DollarSign}
                                    title="Ventas de Hoy"
                                    value={`LPS ${stats?.todaySales?.toLocaleString() || 0}`}
                                    subtitle="Ingresos del día actual"
                                    color="bg-gradient-to-r from-green-500 to-green-600"
                                />
                                <StatCard
                                    icon={List}
                                    title="Órdenes Pendientes"
                                    value={stats?.pendingOrders || 0}
                                    subtitle="Requieren atención"
                                    color="bg-gradient-to-r from-orange-500 to-orange-600"
                                />
                                <StatCard
                                    icon={Ticket}
                                    title="Rifas Activas"
                                    value={stats?.activeRaffles || 0}
                                    subtitle="En curso actualmente"
                                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                                />
                            </div>

                            {/* Contenido en dos columnas - Optimizado para móvil */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Últimas Órdenes */}
                                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                            <span className="hidden sm:inline">Últimas Órdenes</span>
                                            <span className="sm:hidden">Órdenes</span>
                                        </h2>
                                        <button
                                            onClick={() => navigate('/admin/apartados')}
                                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                                        >
                                            Ver todas →
                                        </button>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                        {recentOrders.length === 0 ? (
                                            <p className="text-gray-500 text-xs sm:text-sm text-center py-4">No hay órdenes recientes</p>
                                        ) : (
                                            recentOrders.map((order) => (
                                                <motion.div
                                                    key={order.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                                    onClick={() => navigate('/admin/apartados')}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                                                            order.status === 'PAID' 
                                                                ? 'bg-green-100' 
                                                                : order.status === 'PENDING' 
                                                                ? 'bg-orange-100' 
                                                                : 'bg-gray-100'
                                                        }`}>
                                                            {order.status === 'PAID' ? (
                                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                            ) : (
                                                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                                {order.customer?.name || 'Sin nombre'}
                                                            </p>
                                                            <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 truncate">
                                                                <span className="font-mono text-xs">{order.folio}</span>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="truncate">{order.raffleTitle}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0 ml-2">
                                                        <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                                                            L. {order.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 whitespace-nowrap">
                                                            {formatDate(order.createdAt)}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Rifas Activas */}
                                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                            <span>Rifas Activas</span>
                                        </h2>
                                        <button
                                            onClick={() => navigate('/admin/sorteos')}
                                            className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                                        >
                                            Ver todas →
                                        </button>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                        {recentRaffles.length === 0 ? (
                                            <p className="text-gray-500 text-xs sm:text-sm text-center py-4">No hay rifas activas</p>
                                        ) : (
                                            recentRaffles.map((raffle) => (
                                                <motion.div
                                                    key={raffle.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                                    onClick={() => navigate('/admin/sorteos')}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                        {raffle.imageUrl && (
                                                            <img
                                                                src={raffle.imageUrl}
                                                                alt={raffle.title}
                                                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                                {raffle.title}
                                                            </p>
                                                            <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                                                                <span>{raffle.sold || 0} vendidos</span>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="hidden sm:inline">{raffle.tickets - (raffle.sold || 0)} disponibles</span>
                                                                <span className="sm:hidden">{raffle.tickets - (raffle.sold || 0)} disp.</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0 ml-2">
                                                        <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                                                            L. {raffle.price?.toFixed(2) || '0.00'}
                                                        </p>
                                                        <div className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full inline-block ${
                                                            raffle.status === 'active' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {raffle.status === 'active' ? 'Activa' : raffle.status}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Acciones rápidas - Optimizado para móvil */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Acciones Rápidas</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <QuickActionCard
                                        icon={Ticket}
                                        title="Nueva Rifa"
                                        description="Crear una nueva rifa"
                                        onClick={() => navigate('/admin/sorteos')}
                                        color="bg-gradient-to-r from-blue-500 to-blue-600"
                                    />
                                    <QuickActionCard
                                        icon={Users}
                                        title="Gestionar Usuarios"
                                        description="Administrar usuarios admin"
                                        onClick={() => navigate('/admin/usuarios')}
                                        color="bg-gradient-to-r from-purple-500 to-purple-600"
                                    />
                                    <QuickActionCard
                                        icon={BarChart3}
                                        title="Ver Analytics"
                                        description="Estadísticas detalladas"
                                        onClick={() => navigate('/admin/analytics')}
                                        color="bg-gradient-to-r from-green-500 to-green-600"
                                    />
                                    <QuickActionCard
                                        icon={Calendar}
                                        title="Configuración"
                                        description="Ajustar configuración"
                                        onClick={() => navigate('/admin/ajustes')}
                                        color="bg-gradient-to-r from-orange-500 to-orange-600"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {activeTab === 'meta' && !isVendedor && (
                <MetaPixelManager />
            )}

        </div>
    );
};

export default AdminDashboardPage;