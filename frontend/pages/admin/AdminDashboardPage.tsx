import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Users, BarChart3, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import MetaPixelManager from '../../components/admin/MetaPixelManager';

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

const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'meta'>('overview');

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

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'analytics'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Analytics Avanzado
                    </button>
                    <button
                        onClick={() => setActiveTab('meta')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'meta'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Meta Pixel & Ads
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Acciones rápidas simplificadas */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <QuickActionCard
                                icon={Ticket}
                                title="Nueva Rifa"
                                description="Crear una nueva rifa"
                                onClick={() => navigate('/admin/raffles')}
                                color="bg-gradient-to-r from-blue-500 to-blue-600"
                            />
                            <QuickActionCard
                                icon={Users}
                                title="Gestionar Usuarios"
                                description="Administrar usuarios"
                                onClick={() => navigate('/admin/users')}
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
                                onClick={() => navigate('/admin/settings')}
                                color="bg-gradient-to-r from-orange-500 to-orange-600"
                            />
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'analytics' && (
                <AnalyticsDashboard />
            )}

            {activeTab === 'meta' && (
                <MetaPixelManager />
            )}

        </div>
    );
};

export default AdminDashboardPage;