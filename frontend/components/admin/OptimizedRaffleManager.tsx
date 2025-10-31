import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    Copy, 
    Calendar,
    Filter,
    Grid3X3,
    List,
    MoreVertical,
    Download,
    FileText,
    FileSpreadsheet,
    Eye
} from 'lucide-react';
import RaffleAnalytics from './RaffleAnalytics';
import { Raffle } from '../../types';
import { downloadTickets } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface OptimizedRaffleManagerProps {
    raffles: Raffle[];
    onEdit: (raffle: Raffle) => void;
    onDelete: (id: string) => void;
    onDuplicate: (raffle: Raffle) => void;
    onCreate: () => void;
    loading?: boolean;
}

const OptimizedRaffleManager: React.FC<OptimizedRaffleManagerProps> = ({
    raffles,
    onEdit,
    onDelete,
    onDuplicate,
    onCreate,
    loading = false
}) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'finished'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'tickets' | 'sold'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [downloading, setDownloading] = useState<string | null>(null);
    const toast = useToast();

    // Función para ver el sorteo en la página pública
    const handleViewRaffle = (raffle: Raffle) => {
        if (!raffle.slug) {
            toast.error('Error', 'Este sorteo no tiene un slug válido para visualizar');
            return;
        }
        // Usar HashRouter - abrir en nueva pestaña
        const url = `#/sorteo/${raffle.slug}`;
        window.open(url, '_blank');
    };

    // Función para descargar boletos
    const handleDownloadTickets = async (raffleId: string, tipo: 'apartados' | 'pagados', formato: 'csv' | 'excel') => {
        const downloadKey = `${raffleId}-${tipo}-${formato}`;
        setDownloading(downloadKey);
        
        try {
            await downloadTickets(raffleId, tipo, formato);
            toast.success(
                'Descarga exitosa',
                `Boletos ${tipo} descargados en formato ${formato.toUpperCase()}`
            );
        } catch (error: any) {
            console.error('Error downloading tickets:', error);
            toast.error(
                'Error al descargar',
                error.message || 'No se pudieron descargar los boletos'
            );
        } finally {
            setDownloading(null);
        }
    };


    // Filtrado y ordenamiento
    const filteredAndSortedRaffles = useMemo(() => {
        let filtered = raffles.filter(raffle => {
            const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (raffle.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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


    return (
        <div className="space-y-4">
            {/* Header simplificado */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Rifas</h1>
                            <p className="text-gray-600">Administra tus rifas</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={onCreate}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nueva Rifa</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Controles optimizados */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Búsqueda */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar rifas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        />
                    </div>

                    {/* Controles compactos */}
                    <div className="flex items-center space-x-2">

                        {/* Filtros desktop */}
                        <div className="hidden lg:flex items-center space-x-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                            >
                                <option value="all">Todos</option>
                                <option value="active">Activas</option>
                                <option value="draft">Borradores</option>
                                <option value="finished">Terminadas</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                            >
                                <option value="date">Fecha</option>
                                <option value="title">Título</option>
                                <option value="tickets">Boletos</option>
                                <option value="sold">Vendidos</option>
                            </select>

                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                    </div>
                </div>

            </div>

            {/* Tarjetas simplificadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {filteredAndSortedRaffles.map((raffle) => (
                        <motion.div
                            key={raffle.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                        >
                            {/* Información esencial */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{raffle.title}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>💰 Precio: ${raffle.price}</p>
                                    <p>🎫 Boletos: {raffle.sold || 0}/{raffle.tickets}</p>
                                    <p>📅 Sorteo: {new Date(raffle.drawDate).toLocaleDateString('es-ES')}</p>
                                    <p className={`font-bold ${raffle.status === 'active' ? 'text-green-600' : raffle.status === 'draft' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        📊 {raffle.status === 'active' ? 'Activa' : raffle.status === 'draft' ? 'Borrador' : 'Terminada'}
                                    </p>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onEdit(raffle)}
                                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    <span>Editar</span>
                                </button>
                                
                                <button
                                    onClick={() => onDuplicate(raffle)}
                                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>Duplicar</span>
                                </button>
                                
                                <button
                                    onClick={() => onDelete(raffle.id)}
                                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Eliminar</span>
                                </button>
                                
                                <button
                                    onClick={() => handleViewRaffle(raffle)}
                                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Ver</span>
                                </button>
                            </div>

                            {/* Botones de descarga */}
                            {(raffle.sold > 0) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Descargar Boletos</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Boletos Apartados */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-600">Apartados</p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleDownloadTickets(raffle.id, 'apartados', 'csv')}
                                                    disabled={downloading === `${raffle.id}-apartados-csv`}
                                                    className="flex items-center justify-center space-x-1 px-2 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs disabled:opacity-50"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    <span>CSV</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadTickets(raffle.id, 'apartados', 'excel')}
                                                    disabled={downloading === `${raffle.id}-apartados-excel`}
                                                    className="flex items-center justify-center space-x-1 px-2 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs disabled:opacity-50"
                                                >
                                                    <FileSpreadsheet className="w-3 h-3" />
                                                    <span>Excel</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Boletos Pagados */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-600">Pagados</p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleDownloadTickets(raffle.id, 'pagados', 'csv')}
                                                    disabled={downloading === `${raffle.id}-pagados-csv`}
                                                    className="flex items-center justify-center space-x-1 px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs disabled:opacity-50"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    <span>CSV</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadTickets(raffle.id, 'pagados', 'excel')}
                                                    disabled={downloading === `${raffle.id}-pagados-excel`}
                                                    className="flex items-center justify-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs disabled:opacity-50"
                                                >
                                                    <FileSpreadsheet className="w-3 h-3" />
                                                    <span>Excel</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

                {filteredAndSortedRaffles.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Calendar className="w-16 h-16 mx-auto" />
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
    );
};

export default OptimizedRaffleManager;
