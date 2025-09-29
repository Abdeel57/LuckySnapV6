import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRaffles, createRaffle, updateRaffle, deleteRaffle } from '../../services/api';
import { Raffle } from '../../types';
import { Plus, RefreshCw, Download, Upload, BarChart3, Settings } from 'lucide-react';
import Spinner from '../../components/Spinner';
import AdvancedRaffleManager from '../../components/admin/AdvancedRaffleManager';
import AdvancedRaffleForm from '../../components/admin/AdvancedRaffleForm';

const AdminRafflesPage: React.FC = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRaffle, setEditingRaffle] = useState<Partial<Raffle> | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRaffles = async () => {
        setLoading(true);
        try {
            const data = await getRaffles();
            setRaffles(data);
        } catch (error) {
            console.error('Error fetching raffles:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshRaffles = async () => {
        setRefreshing(true);
        try {
            const data = await getRaffles();
            setRaffles(data);
        } catch (error) {
            console.error('Error refreshing raffles:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRaffles();
    }, []);

    const handleOpenModal = (raffle: Partial<Raffle> | null = null) => {
        setEditingRaffle(raffle);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingRaffle(null);
        setIsModalOpen(false);
    };

    // Función para limpiar datos antes de enviar
    const cleanRaffleData = (data: Raffle) => {
        const gallery = data.gallery || [];
        return {
            title: data.title,
            description: data.description,
            heroImage: gallery.length > 0 ? gallery[0] : (data.heroImage || ''),
            gallery: gallery,
            tickets: data.tickets,
            drawDate: data.drawDate,
            packs: data.packs || [],
            bonuses: data.bonuses || [],
            status: data.status || 'draft',
            slug: data.slug
        };
    };

    const handleSaveRaffle = async (data: Raffle) => {
        try {
            const cleanedData = cleanRaffleData(data);
            
            if (data.id) {
                await updateRaffle(data.id!, cleanedData);
            } else {
                await createRaffle(cleanedData as Omit<Raffle, 'id' | 'sold'>);
            }
            await refreshRaffles();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving raffle:', error);
            alert("Error al guardar la rifa.");
        }
    };

    const handleDeleteRaffle = async (raffleId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta rifa? Esto no se puede deshacer.')) {
            try {
                await deleteRaffle(raffleId);
                await refreshRaffles();
            } catch (error) {
                console.error('Error deleting raffle:', error);
                alert("Error al eliminar la rifa.");
            }
        }
    };

    const handleDuplicateRaffle = (raffle: Raffle) => {
        const duplicatedRaffle = {
            ...raffle,
            id: undefined,
            title: `${raffle.title} (Copia)`,
            slug: `${raffle.slug}-copia-${Date.now()}`,
            status: 'draft' as const,
            sold: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        handleOpenModal(duplicatedRaffle);
    };

    const handleExportRaffles = () => {
        const dataStr = JSON.stringify(raffles, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `rifas-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportRaffles = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedRaffles = JSON.parse(e.target?.result as string);
                        console.log('Rifas importadas:', importedRaffles);
                        // Aquí podrías implementar la lógica para importar las rifas
                        alert('Funcionalidad de importación en desarrollo');
                    } catch (error) {
                        alert('Error al leer el archivo JSON');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-gray-600">Cargando rifas...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header con acciones */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Rifas</h1>
                    <p className="text-gray-600">Administra y supervisa todas tus rifas desde un panel profesional</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button
                        onClick={refreshRaffles}
                        disabled={refreshing}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                    
                    <button
                        onClick={handleExportRaffles}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all duration-200"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar</span>
                    </button>
                    
                    <button
                        onClick={handleImportRaffles}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Importar</span>
                    </button>
                    
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Rifa</span>
                    </button>
                </div>
            </div>

            {/* Panel de administración avanzado */}
            <AdvancedRaffleManager
                raffles={raffles}
                onEdit={handleOpenModal}
                onDelete={handleDeleteRaffle}
                onDuplicate={handleDuplicateRaffle}
                onCreate={() => handleOpenModal()}
                loading={refreshing}
            />
            
            {/* Modal de formulario avanzado */}
            <AnimatePresence>
                {isModalOpen && (
                    <AdvancedRaffleForm
                        raffle={editingRaffle}
                        onClose={handleCloseModal}
                        onSave={handleSaveRaffle}
                        loading={refreshing}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminRafflesPage;