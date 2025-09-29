import React from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    DollarSign, 
    Calendar,
    Target,
    Award,
    Clock,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { Raffle } from '../../types';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface RaffleAnalyticsProps {
    raffles: Raffle[];
}

const RaffleAnalytics: React.FC<RaffleAnalyticsProps> = ({ raffles }) => {
    // Cálculos de métricas
    const metrics = React.useMemo(() => {
        const totalRaffles = raffles.length;
        const activeRaffles = raffles.filter(r => r.status === 'active').length;
        const draftRaffles = raffles.filter(r => r.status === 'draft').length;
        const finishedRaffles = raffles.filter(r => r.status === 'finished').length;
        
        const totalTickets = raffles.reduce((sum, r) => sum + r.tickets, 0);
        const soldTickets = raffles.reduce((sum, r) => sum + r.sold, 0);
        const availableTickets = totalTickets - soldTickets;
        
        const totalRevenue = raffles.reduce((sum, r) => {
            const pricePerTicket = r.packs.find(p => p.tickets === 1 || p.q === 1)?.price || 0;
            return sum + (r.sold * pricePerTicket);
        }, 0);
        
        const conversionRate = totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;
        
        // Rifas próximas a vencer (3 días)
        const expiringSoon = raffles.filter(r => {
            const drawDate = new Date(r.drawDate);
            const threeDaysFromNow = addDays(new Date(), 3);
            return r.status === 'active' && isAfter(drawDate, new Date()) && isBefore(drawDate, threeDaysFromNow);
        });
        
        // Rifas más populares (por ventas)
        const mostPopular = [...raffles]
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 3);
        
        // Rifas con mejor conversión
        const bestConversion = [...raffles]
            .filter(r => r.tickets > 0)
            .sort((a, b) => (b.sold / b.tickets) - (a.sold / a.tickets))
            .slice(0, 3);
        
        // Estadísticas por mes
        const monthlyStats = raffles.reduce((acc, raffle) => {
            const month = format(new Date(raffle.createdAt), 'MMM yyyy', { locale: es });
            if (!acc[month]) {
                acc[month] = { count: 0, revenue: 0, tickets: 0 };
            }
            acc[month].count += 1;
            acc[month].tickets += raffle.sold;
            const pricePerTicket = raffle.packs.find(p => p.tickets === 1 || p.q === 1)?.price || 0;
            acc[month].revenue += raffle.sold * pricePerTicket;
            return acc;
        }, {} as Record<string, { count: number; revenue: number; tickets: number }>);

        return {
            totalRaffles,
            activeRaffles,
            draftRaffles,
            finishedRaffles,
            totalTickets,
            soldTickets,
            availableTickets,
            totalRevenue,
            conversionRate,
            expiringSoon,
            mostPopular,
            bestConversion,
            monthlyStats: Object.entries(monthlyStats).slice(-6) // Últimos 6 meses
        };
    }, [raffles]);

    const StatCard = ({ 
        title, 
        value, 
        icon: Icon, 
        color, 
        subtitle, 
        trend 
    }: {
        title: string;
        value: string | number;
        icon: React.ComponentType<any>;
        color: string;
        subtitle?: string;
        trend?: { value: number; isPositive: boolean };
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
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
                <p className="text-gray-600 font-medium">{title}</p>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </motion.div>
    );

    const RaffleCard = ({ raffle, metric, icon: Icon }: { raffle: Raffle; metric: string; icon: React.ComponentType<any> }) => (
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{raffle.title}</h4>
                    <p className="text-sm text-gray-500">{metric}</p>
                </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{raffle.sold} / {raffle.tickets} boletos</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    raffle.status === 'active' ? 'bg-green-100 text-green-800' :
                    raffle.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {raffle.status}
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Rifas"
                    value={metrics.totalRaffles}
                    icon={BarChart3}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                    subtitle={`${metrics.activeRaffles} activas, ${metrics.draftRaffles} borradores`}
                />
                <StatCard
                    title="Boletos Vendidos"
                    value={metrics.soldTickets.toLocaleString()}
                    icon={Users}
                    color="bg-gradient-to-r from-green-500 to-green-600"
                    subtitle={`${metrics.availableTickets.toLocaleString()} disponibles`}
                />
                <StatCard
                    title="Ingresos Totales"
                    value={`LPS ${metrics.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-gradient-to-r from-purple-500 to-purple-600"
                    subtitle="Todas las rifas"
                />
                <StatCard
                    title="Tasa de Conversión"
                    value={`${metrics.conversionRate.toFixed(1)}%`}
                    icon={Target}
                    color="bg-gradient-to-r from-orange-500 to-orange-600"
                    subtitle="Promedio general"
                />
            </div>

            {/* Alertas y notificaciones */}
            {metrics.expiringSoon.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border border-orange-200 rounded-2xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-orange-900">Rifas Próximas a Vencer</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metrics.expiringSoon.map((raffle) => (
                            <div key={raffle.id} className="bg-white rounded-xl p-4 border border-orange-200">
                                <h4 className="font-semibold text-gray-900 mb-2">{raffle.title}</h4>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-orange-600">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {differenceInDays(new Date(raffle.drawDate), new Date())} días
                                    </span>
                                    <span className="text-gray-600">{raffle.sold} / {raffle.tickets}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Rifas destacadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Más populares */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Rifas Más Populares</h3>
                            <p className="text-sm text-gray-600">Por número de boletos vendidos</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {metrics.mostPopular.map((raffle, index) => (
                            <RaffleCard
                                key={raffle.id}
                                raffle={raffle}
                                metric={`${raffle.sold} boletos vendidos`}
                                icon={Users}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Mejor conversión */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Mejor Conversión</h3>
                            <p className="text-sm text-gray-600">Por porcentaje de ventas</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {metrics.bestConversion.map((raffle, index) => (
                            <RaffleCard
                                key={raffle.id}
                                raffle={raffle}
                                metric={`${((raffle.sold / raffle.tickets) * 100).toFixed(1)}% vendido`}
                                icon={CheckCircle}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Estadísticas mensuales */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Estadísticas Mensuales</h3>
                        <p className="text-sm text-gray-600">Últimos 6 meses</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Mes</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rifas</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Boletos</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.monthlyStats.map(([month, stats]) => (
                                <tr key={month} className="border-b border-gray-100">
                                    <td className="py-3 px-4 font-medium text-gray-900">{month}</td>
                                    <td className="py-3 px-4 text-gray-600">{stats.count}</td>
                                    <td className="py-3 px-4 text-gray-600">{stats.tickets.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-gray-600">LPS {stats.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default RaffleAnalytics;
