import React, { useState } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { motion } from 'framer-motion';
import { 
    Users, 
    Eye, 
    ShoppingCart, 
    TrendingUp, 
    Clock, 
    MousePointer,
    Smartphone,
    Monitor,
    Tablet,
    RefreshCw,
    Calendar,
    BarChart3
} from 'lucide-react';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import Spinner from '../../components/Spinner';

const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    change, 
    color = 'blue' 
}: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number, 
    change?: string,
    color?: string 
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {change && (
                    <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {change} vs mes anterior
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
                <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
        </div>
    </motion.div>
);

const AdminAnalyticsPage: React.FC = () => {
    const { data, isLoading, refreshData } = useAnalytics();
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <Spinner />
                    <p className="text-gray-600 mt-4">Cargando analytics...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-600">No se pudieron cargar los datos de analytics</p>
            </div>
        );
    }

    const getPeriodData = () => {
        const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        return data.dailyStats.slice(-days);
    };

    const visitorsData = getPeriodData().map(stat => ({
        label: new Date(stat.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        value: stat.visitors
    }));

    const salesData = getPeriodData().map(stat => ({
        label: new Date(stat.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        value: stat.sales
    }));

    const deviceData = data.deviceStats.map(stat => ({
        label: stat.device,
        value: stat.count,
        color: stat.device === 'Móvil' ? '#3b82f6' : stat.device === 'Desktop' ? '#10b981' : '#f59e0b'
    }));

    const topPagesData = data.topPages.map(page => ({
        label: page.page,
        value: page.views
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-1">Métricas de uso y rendimiento de la plataforma</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                    </select>
                    <button
                        onClick={refreshData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    title="Visitantes Totales"
                    value={data.totalVisitors.toLocaleString()}
                    change="+12.5%"
                    color="blue"
                />
                <StatCard
                    icon={Eye}
                    title="Páginas Vistas"
                    value={data.pageViews.toLocaleString()}
                    change="+8.3%"
                    color="purple"
                />
                <StatCard
                    icon={ShoppingCart}
                    title="Ventas Totales"
                    value={`LPS ${data.totalSales.toLocaleString()}`}
                    change="+15.2%"
                    color="green"
                />
                <StatCard
                    icon={TrendingUp}
                    title="Tasa de Conversión"
                    value={`${data.conversionRate}%`}
                    change="+2.1%"
                    color="orange"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visitors Chart */}
                <AnalyticsChart
                    title="Visitantes por Día"
                    data={visitorsData}
                    type="line"
                    height={300}
                />
                
                {/* Sales Chart */}
                <AnalyticsChart
                    title="Ventas por Día"
                    data={salesData}
                    type="bar"
                    height={300}
                />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Device Stats */}
                <AnalyticsChart
                    title="Dispositivos"
                    data={deviceData}
                    type="pie"
                    height={250}
                />
                
                {/* Top Pages */}
                <AnalyticsChart
                    title="Páginas Más Visitadas"
                    data={topPagesData}
                    type="bar"
                    height={250}
                />
                
                {/* Performance Metrics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas de Rendimiento</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-gray-600">Duración Promedio</span>
                            </div>
                            <span className="font-semibold text-gray-900">{data.averageSessionDuration} min</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MousePointer className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-gray-600">Tasa de Rebote</span>
                            </div>
                            <span className="font-semibold text-gray-900">{data.bounceRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="h-5 w-5 text-purple-600" />
                                <span className="text-sm text-gray-600">Valor Promedio</span>
                            </div>
                            <span className="font-semibold text-gray-900">LPS {data.averageOrderValue}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-orange-600" />
                                <span className="text-sm text-gray-600">Rifas Activas</span>
                            </div>
                            <span className="font-semibold text-gray-900">{data.activeRaffles}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Mensual</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Mes</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Visitantes</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Ventas</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Órdenes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.monthlyStats.slice(-6).map((stat, index) => (
                                <motion.tr
                                    key={stat.month}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                    <td className="py-3 px-4 font-medium text-gray-900">{stat.month}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{stat.visitors.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">LPS {stat.sales.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{stat.orders.toLocaleString()}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
