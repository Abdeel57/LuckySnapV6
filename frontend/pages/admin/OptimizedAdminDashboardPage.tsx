import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/api';
import { DollarSign, List, Ticket, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import Spinner from '../../components/Spinner';

interface Stats {
    todaySales: number;
    pendingOrders: number;
    activeRaffles: number;
}

const OptimizedStatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    color, 
    subtitle,
    trend 
}: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number, 
    color: string,
    subtitle?: string,
    trend?: { value: number; isPositive: boolean }
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            {trend && (
                <div className={`flex items-center space-x-1 text-sm ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                    <TrendingUp className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
                    <span>{Math.abs(trend.value)}%</span>
                </div>
            )}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    </motion.div>
);

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
        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-left w-full"
    >
        <div className={`p-3 rounded-xl ${color} mb-3 w-fit`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </motion.button>
);

const OptimizedAdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats().then(data => {
            setStats(data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load dashboard stats", err);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

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

            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <OptimizedStatCard
                    icon={DollarSign}
                    title="Ventas de Hoy"
                    value={`LPS ${stats?.todaySales?.toLocaleString() || 0}`}
                    color="bg-gradient-to-r from-green-500 to-green-600"
                    subtitle="Ingresos del día actual"
                    trend={{ value: 12, isPositive: true }}
                />
                <OptimizedStatCard
                    icon={List}
                    title="Órdenes Pendientes"
                    value={stats?.pendingOrders || 0}
                    color="bg-gradient-to-r from-orange-500 to-orange-600"
                    subtitle="Requieren atención"
                    trend={{ value: 5, isPositive: false }}
                />
                <OptimizedStatCard
                    icon={Ticket}
                    title="Rifas Activas"
                    value={stats?.activeRaffles || 0}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                    subtitle="En curso actualmente"
                    trend={{ value: 8, isPositive: true }}
                />
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionCard
                        icon={Ticket}
                        title="Nueva Rifa"
                        description="Crear una nueva rifa"
                        onClick={() => window.location.href = '/admin/raffles'}
                        color="bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                    <QuickActionCard
                        icon={Users}
                        title="Gestionar Usuarios"
                        description="Administrar usuarios"
                        onClick={() => window.location.href = '/admin/users'}
                        color="bg-gradient-to-r from-purple-500 to-purple-600"
                    />
                    <QuickActionCard
                        icon={BarChart3}
                        title="Ver Analytics"
                        description="Estadísticas detalladas"
                        onClick={() => window.location.href = '/admin/analytics'}
                        color="bg-gradient-to-r from-green-500 to-green-600"
                    />
                    <QuickActionCard
                        icon={Calendar}
                        title="Configuración"
                        description="Ajustar configuración"
                        onClick={() => window.location.href = '/admin/settings'}
                        color="bg-gradient-to-r from-orange-500 to-orange-600"
                    />
                </div>
            </div>

            {/* Resumen de actividad reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Ticket className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Nueva rifa creada</p>
                                <p className="text-xs text-gray-500">iPhone 15 Pro Max - Hace 2 horas</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Usuario registrado</p>
                                <p className="text-xs text-gray-500">Juan Pérez - Hace 4 horas</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <DollarSign className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Venta realizada</p>
                                <p className="text-xs text-gray-500">LPS 500 - Hace 6 horas</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Métricas Rápidas</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Conversión promedio</span>
                            <span className="text-lg font-bold text-gray-900">24.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tiempo promedio de venta</span>
                            <span className="text-lg font-bold text-gray-900">2.3 días</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Satisfacción del cliente</span>
                            <span className="text-lg font-bold text-gray-900">4.8/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tickets vendidos hoy</span>
                            <span className="text-lg font-bold text-gray-900">47</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptimizedAdminDashboardPage;
