import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    Edit3, 
    Trash2, 
    Eye, 
    Copy, 
    Calendar,
    Users,
    DollarSign,
    Image as ImageIcon,
    BarChart3,
    Settings,
    Download,
    Upload,
    RefreshCw,
    Star,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Target
} from 'lucide-react';
import RaffleAnalytics from './RaffleAnalytics';
import { Raffle } from '../../types';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvancedRaffleManagerProps {
    raffles: Raffle[];
    onEdit: (raffle: Raffle) => void;
    onDelete: (id: string) => void;
    onDuplicate: (raffle: Raffle) => void;
    onCreate: () => void;
    loading?: boolean;
}

const AdvancedRaffleManager: React.FC<AdvancedRaffleManagerProps> = ({
    raffles,
    onEdit,
    onDelete,
    onDuplicate,
    onCreate,
    loading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'finished'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'tickets' | 'sold'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid');
    const [selectedRaffles, setSelectedRaffles] = useState<string[]>([]);

    // Estadísticas calculadas
    const stats = useMemo(() => {
        const total = raffles.length;
        const active = raffles.filter(r => r.status === 'active').length;
        const draft = raffles.filter(r => r.status === 'draft').length;
        const finished = raffles.filter(r => r.status === 'finished').length;
        const totalTickets = raffles.reduce((sum, r) => sum + r.tickets, 0);
        const soldTickets = raffles.reduce((sum, r) => sum + r.sold, 0);
        const revenue = raffles.reduce((sum, r) => {
            const pricePerTicket = r.packs.find(p => p.tickets === 1 || p.q === 1)?.price || 0;
            return sum + (r.sold * pricePerTicket);
        }, 0);

        return {
            total,
            active,
            draft,
            finished,
            totalTickets,
            soldTickets,
            revenue,
            conversionRate: totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0
        };
    }, [raffles]);

    // Filtrado y ordenamiento
    const filteredAndSortedRaffles = useMemo(() => {
        let filtered = raffles.filter(raffle => {
            const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                raffle.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || raffle.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'tickets':
                    comparison = a.tickets - b.tickets;
                    break;
                case 'sold':
                    comparison = a.sold - b.sold;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [raffles, searchTerm, statusFilter, sortBy, sortOrder]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'finished': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'finished': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getProgressPercentage = (raffle: Raffle) => {
        return raffle.tickets > 0 ? (raffle.sold / raffle.tickets) * 100 : 0;
    };

    const isExpiringSoon = (raffle: Raffle) => {
        const drawDate = new Date(raffle.drawDate);
        const threeDaysFromNow = addDays(new Date(), 3);
        return isAfter(drawDate, new Date()) && isBefore(drawDate, threeDaysFromNow);
    };

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Gestión Avanzada de Rifas</h2>
                        <p className="text-blue-100">Administra y supervisa todas tus rifas desde un panel profesional</p>
                    </div>
                    <button
                        onClick={onCreate}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-xl flex items-center space-x-2 border border-white/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Rifa</span>
                    </button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <BarChart3 className="w-5 h-5" />
                            <span className="text-sm font-medium">Total</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span className="text-sm font-medium">Activas</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.active}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-5 h-5 text-yellow-300" />
                            <span className="text-sm font-medium">Borradores</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.draft}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-5 h-5 text-blue-300" />
                            <span className="text-sm font-medium">Boletos</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.totalTickets.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-300" />
                            <span className="text-sm font-medium">Vendidos</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.soldTickets.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-purple-300" />
                            <span className="text-sm font-medium">Ingresos</span>
                        </div>
                        <div className="text-2xl font-bold">LPS {stats.revenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-orange-300" />
                            <span className="text-sm font-medium">Conversión</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            {/* Controles de filtrado y búsqueda */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Búsqueda */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar rifas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center space-x-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activas</option>
                            <option value="draft">Borradores</option>
                            <option value="finished">Terminadas</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                            <option value="date">Ordenar por fecha</option>
                            <option value="title">Ordenar por título</option>
                            <option value="tickets">Ordenar por boletos</option>
                            <option value="sold">Ordenar por vendidos</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 rounded-xl transition-all duration-200 ${
                                    viewMode === 'grid' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Vista de tarjetas"
                            >
                                <BarChart3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 rounded-xl transition-all duration-200 ${
                                    viewMode === 'list' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Vista de lista"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('analytics')}
                                className={`p-3 rounded-xl transition-all duration-200 ${
                                    viewMode === 'analytics' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Analytics y métricas"
                            >
                                <TrendingUp className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="space-y-4">
                {viewMode === 'analytics' ? (
                    <RaffleAnalytics raffles={raffles} />
                ) : (
                    <AnimatePresence>
                        {filteredAndSortedRaffles.map((raffle) => (
                        <motion.div
                            key={raffle.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                                selectedRaffles.includes(raffle.id) ? 'ring-2 ring-blue-500' : ''
                            }`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    {/* Información principal */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-xl font-bold text-gray-900">{raffle.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(raffle.status)}`}>
                                                {getStatusIcon(raffle.status)}
                                                <span className="ml-1 capitalize">{raffle.status}</span>
                                            </span>
                                            {isExpiringSoon(raffle) && (
                                                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200">
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    Próximo a vencer
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-600 mb-4 line-clamp-2">{raffle.description}</p>

                                        {/* Métricas */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm font-medium text-gray-600">Total Boletos</span>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{raffle.tickets.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm font-medium text-gray-600">Vendidos</span>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{raffle.sold.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <BarChart3 className="w-4 h-4 text-purple-500" />
                                                    <span className="text-sm font-medium text-gray-600">Progreso</span>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{getProgressPercentage(raffle).toFixed(1)}%</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Calendar className="w-4 h-4 text-orange-500" />
                                                    <span className="text-sm font-medium text-gray-600">Fecha Sorteo</span>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">
                                                    {format(new Date(raffle.drawDate), 'dd/MM/yyyy', { locale: es })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Barra de progreso */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>Progreso de ventas</span>
                                                <span>{raffle.sold} / {raffle.tickets}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${getProgressPercentage(raffle)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => onEdit(raffle)}
                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-200"
                                            title="Editar"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDuplicate(raffle)}
                                            className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-200"
                                            title="Duplicar"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(raffle.id)}
                                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {viewMode !== 'analytics' && filteredAndSortedRaffles.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <BarChart3 className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron rifas</h3>
                        <p className="text-gray-600 mb-4">Intenta ajustar los filtros o crear una nueva rifa</p>
                        <button
                            onClick={onCreate}
                            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-200"
                        >
                            Crear Nueva Rifa
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedRaffleManager;
