import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    RefreshCw,
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Target,
    ShoppingCart
} from 'lucide-react';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import Spinner from '../../components/Spinner';
import { 
    getSalesTrends, 
    getCustomerInsights, 
    getConversionFunnel,
    getROIMetrics,
    getPopularRaffles,
    SalesTrend,
    CustomerInsight,
    ConversionFunnel,
    ROIMetrics
} from '../../services/api';

const AdminAnalyticsPage: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Data states
    const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
    const [customerInsights, setCustomerInsights] = useState<CustomerInsight | null>(null);
    const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel | null>(null);
    const [roiMetrics, setRoiMetrics] = useState<ROIMetrics | null>(null);
    const [popularRaffles, setPopularRaffles] = useState<any[]>([]);

    const loadAnalyticsData = async () => {
        try {
            const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
            
            const [trends, insights, funnel, roi, raffles] = await Promise.all([
                getSalesTrends('day', days),
                getCustomerInsights(),
                getConversionFunnel(),
                getROIMetrics(),
                getPopularRaffles()
            ]);

            setSalesTrends(trends);
            setCustomerInsights(insights);
            setConversionFunnel(funnel);
            setRoiMetrics(roi);
            setPopularRaffles(raffles);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        loadAnalyticsData();
    }, [selectedPeriod]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadAnalyticsData();
    };

    const getPeriodData = () => {
        return salesTrends || [];
    };

    const salesData = getPeriodData().map(stat => ({
        label: new Date(stat.date).toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
        }),
        value: stat.revenue,
        color: 'bg-blue-500'
    }));

    const ordersData = getPeriodData().map(stat => ({
        label: new Date(stat.date).toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
        }),
        value: stat.orders,
        color: 'bg-green-500'
    }));

    const ticketsData = getPeriodData().map(stat => ({
        label: new Date(stat.date).toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
        }),
        value: stat.sales,
        color: 'bg-purple-500'
    }));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <Spinner />
                    <p className="text-gray-600 mt-4 text-sm sm:text-base">Cargando analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header optimizado para móvil */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
                            <p className="text-gray-600 text-xs sm:text-sm">Métricas de rendimiento</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="7d">7 días</option>
                            <option value="30d">30 días</option>
                            <option value="90d">90 días</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors text-xs sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Actualizar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tarjetas de métricas principales - Optimizado para móvil */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        L. {roiMetrics?.totalRevenue?.toLocaleString('es-HN') || '0'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Ingresos Totales</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {customerInsights?.totalCustomers || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Clientes Totales</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {conversionFunnel?.conversionRate?.toFixed(1) || '0'}%
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Tasa Conversión</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {roiMetrics?.totalOrders || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Órdenes Totales</p>
                </motion.div>
            </div>

            {/* Gráficos principales - Optimizado para móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <AnalyticsChart
                    title="Ingresos por Día"
                    data={salesData}
                    type="line"
                    height={250}
                />
                
                <AnalyticsChart
                    title="Órdenes por Día"
                    data={ordersData}
                    type="bar"
                    height={250}
                />
            </div>

            {/* Gráfico de boletos - Ancho completo en móvil */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <AnalyticsChart
                    title="Boletos Vendidos por Día"
                    data={ticketsData}
                    type="bar"
                    height={250}
                />
            </div>

            {/* Métricas adicionales - Optimizado para móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Insights de Clientes */}
                {customerInsights && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Insights de Clientes
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200">
                                <span className="text-xs sm:text-sm text-gray-600">Clientes Nuevos</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">{customerInsights.newCustomers}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200">
                                <span className="text-xs sm:text-sm text-gray-600">Clientes Recurrentes</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">{customerInsights.returningCustomers}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200">
                                <span className="text-xs sm:text-sm text-gray-600">Valor Promedio Orden</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">L. {customerInsights.averageOrderValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm text-gray-600">Valor de Vida Cliente</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">L. {customerInsights.customerLifetimeValue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Métricas ROI */}
                {roiMetrics && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Métricas ROI
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200">
                                <span className="text-xs sm:text-sm text-gray-600">Retorno en Publicidad</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">{roiMetrics.returnOnAdSpend.toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200">
                                <span className="text-xs sm:text-sm text-gray-600">Costo por Adquisición</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">L. {roiMetrics.costPerAcquisition.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200">
                                <span className="text-xs sm:text-sm text-gray-600">Ingreso por Cliente</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">L. {roiMetrics.revenuePerCustomer.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm text-gray-600">Gasto en Publicidad</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900">L. {roiMetrics.totalAdSpend.toLocaleString('es-HN')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Funnel de Conversión - Optimizado para móvil */}
            {conversionFunnel && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Embudo de Conversión</h3>
                    <div className="space-y-2 sm:space-y-3">
                        {[
                            { label: 'Visitantes', value: conversionFunnel.visitors, color: 'bg-blue-500' },
                            { label: 'Interesados', value: conversionFunnel.interested, color: 'bg-purple-500' },
                            { label: 'Agregaron al Carrito', value: conversionFunnel.addedToCart, color: 'bg-yellow-500' },
                            { label: 'Iniciaron Checkout', value: conversionFunnel.initiatedCheckout, color: 'bg-orange-500' },
                            { label: 'Compra Completada', value: conversionFunnel.completedPurchase, color: 'bg-green-500' },
                        ].map((step, index) => {
                            const percentage = conversionFunnel.visitors > 0 
                                ? (step.value / conversionFunnel.visitors) * 100 
                                : 0;
                            return (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-gray-700 font-medium">{step.label}</span>
                                        <span className="text-gray-900 font-bold">{step.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                                        <motion.div
                                            className={`h-full ${step.color}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Rifas Populares - Optimizado para móvil */}
            {popularRaffles.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Rifas Más Populares</h3>
                    <div className="space-y-2 sm:space-y-3 overflow-x-auto">
                        <div className="min-w-full">
                            {popularRaffles.slice(0, 5).map((raffle, index) => (
                                <motion.div
                                    key={raffle.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg mb-2 sm:mb-3 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{raffle.title}</p>
                                        <div className="flex gap-2 sm:gap-3 text-xs text-gray-500 mt-1">
                                            <span>{raffle.ticketsSold} boletos</span>
                                            <span>•</span>
                                            <span>L. {raffle.revenue.toLocaleString('es-HN')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-2 sm:ml-4">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900">{raffle.conversionRate.toFixed(1)}%</p>
                                        <p className="text-xs text-gray-500">Conversión</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnalyticsPage;
