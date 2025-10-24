import React, { useState } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { motion } from 'framer-motion';
import { 
    RefreshCw,
    BarChart3
} from 'lucide-react';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import Spinner from '../../components/Spinner';

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

    return (
        <div className="space-y-6">
            {/* Header simplificado */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                            <p className="text-gray-600">Métricas de rendimiento</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="7d">Últimos 7 días</option>
                            <option value="30d">Últimos 30 días</option>
                            <option value="90d">Últimos 90 días</option>
                        </select>
                        <button
                            onClick={refreshData}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChart
                    title="Visitantes por Día"
                    data={visitorsData}
                    type="line"
                    height={300}
                />
                
                <AnalyticsChart
                    title="Ventas por Día"
                    data={salesData}
                    type="bar"
                    height={300}
                />
            </div>

        </div>
    );
};

export default AdminAnalyticsPage;
