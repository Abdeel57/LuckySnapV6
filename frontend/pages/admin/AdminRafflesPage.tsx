import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRaffles, createRaffle, updateRaffle, deleteRaffle, parseRaffleDates } from '../../services/api';
import { Raffle } from '../../types';
import { Plus, RefreshCw, Download, Upload } from 'lucide-react';
import Spinner from '../../components/Spinner';
import OptimizedRaffleManager from '../../components/admin/OptimizedRaffleManager';
import AdvancedRaffleForm from '../../components/admin/AdvancedRaffleForm';
import MobileOptimizedRaffleForm from '../../components/admin/MobileOptimizedRaffleForm';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

// Hook para detectar dispositivos móviles
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
};

const AdminRafflesPage: React.FC = () => {
    const isMobile = useIsMobile();
    const toast = useToast();
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRaffle, setEditingRaffle] = useState<Partial<Raffle> | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRaffles = async () => {
        setLoading(true);
        try {
            console.log('📋 Fetching raffles...');
            const data = await getRaffles();
            console.log('✅ Raffles fetched:', data.length);
            if (data.length > 0) {
                console.log('📝 First raffle ID:', data[0]?.id);
                console.log('📝 First raffle title:', data[0]?.title);
            }
            setRaffles(data);
        } catch (error) {
            console.error('❌ Error fetching raffles:', error);
            toast.error('Error al cargar rifas', 'No se pudieron cargar las rifas desde el backend');
        } finally {
            setLoading(false);
        }
    };

    const refreshRaffles = async () => {
        setRefreshing(true);
        try {
            console.log('🔄 Fetching raffles from backend...');
            const data = await getRaffles();
            console.log('✅ Raffles fetched:', data.length);
            if (data.length > 0) {
                console.log('📦 First raffle packs:', data[0]?.packs);
                console.log('🎁 First raffle bonuses:', data[0]?.bonuses);
            }
            setRaffles(data);
            console.log('✅ Raffles state updated');
        } catch (error) {
            console.error('❌ Error refreshing raffles:', error);
            toast.error('Error al refrescar', 'No se pudieron cargar las rifas actualizadas');
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

    // Función para limpiar datos antes de enviar - SOLO campos válidos del esquema Prisma
    const cleanRaffleData = (data: Raffle) => {
        // Validar campos requeridos
        if (!data.title || data.title.trim() === '') {
            throw new Error('El título es requerido');
        }
        if (!data.tickets || data.tickets < 1) {
            throw new Error('El número de boletos debe ser mayor a 0');
        }
        if (!data.price || data.price <= 0) {
            throw new Error('El precio debe ser mayor a 0');
        }
        if (!data.drawDate) {
            throw new Error('La fecha del sorteo es requerida');
        }

        const gallery = data.gallery || [];
        
        // Logs detallados para debug - expandir objetos
        console.log('🧹 CLEANING RAFFLE DATA - INICIO');
        console.log('📦 Original packs:', data.packs);
        console.log('📦 Packs type:', typeof data.packs);
        console.log('📦 Packs isArray:', Array.isArray(data.packs));
        console.log('🎁 Original bonuses:', data.bonuses);
        console.log('🎁 Bonuses type:', typeof data.bonuses);
        console.log('🎁 Bonuses isArray:', Array.isArray(data.bonuses));
        
        // Procesar packs - asegurar que sea un array o null
        let processedPacks = null;
        if (data.packs) {
            if (Array.isArray(data.packs) && data.packs.length > 0) {
                // Normalizar los packs: asegurar que todos los valores numéricos sean números
                processedPacks = data.packs.map(pack => ({
                    name: pack.name || '',
                    tickets: Number(pack.tickets || pack.q || 1),
                    q: Number(pack.q || pack.tickets || 1),
                    price: Number(pack.price || 0)
                })).filter(pack => pack.price > 0);
            } else if (typeof data.packs === 'string') {
                try {
                    const parsed = JSON.parse(data.packs);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        processedPacks = parsed.map((pack: any) => ({
                            name: pack.name || '',
                            tickets: Number(pack.tickets || pack.q || 1),
                            q: Number(pack.q || pack.tickets || 1),
                            price: Number(pack.price || 0)
                        })).filter((pack: any) => pack.price > 0);
                    } else {
                        processedPacks = null;
                    }
                } catch (e) {
                    console.warn('Error parsing packs string:', e);
                    processedPacks = null;
                }
            }
        }
        
        // Procesar bonuses - asegurar que sea un array de strings
        let processedBonuses: string[] = [];
        if (data.bonuses) {
            if (Array.isArray(data.bonuses)) {
                processedBonuses = data.bonuses
                    .map(b => {
                        // Si es un objeto con 'value', extraer el valor
                        if (typeof b === 'object' && b !== null && 'value' in b) {
                            return String((b as any).value || '').trim();
                        }
                        // Si ya es un string, usarlo directamente
                        return typeof b === 'string' ? b.trim() : '';
                    })
                    .filter(b => b !== '');
            } else if (typeof data.bonuses === 'string') {
                try {
                    const parsed = JSON.parse(data.bonuses);
                    if (Array.isArray(parsed)) {
                        processedBonuses = parsed
                            .map((b: any) => {
                                if (typeof b === 'object' && b !== null && 'value' in b) {
                                    return String(b.value || '').trim();
                                }
                                return typeof b === 'string' ? b.trim() : '';
                            })
                            .filter((b: string) => b !== '');
                    }
                } catch (e) {
                    processedBonuses = data.bonuses.trim() !== '' ? [data.bonuses.trim()] : [];
                }
            }
        }
        
        console.log('✅ PROCESSED DATA');
        console.log('📦 Processed packs:', processedPacks);
        console.log('📦 Packs length:', processedPacks?.length || 0);
        console.log('🎁 Processed bonuses:', processedBonuses);
        console.log('🎁 Bonuses length:', processedBonuses.length);
        
        const cleaned = {
            title: data.title.trim(),
            description: data.description || null,
            imageUrl: gallery.length > 0 ? gallery[0] : (data.imageUrl || data.heroImage || null),
            gallery: gallery.length > 0 ? gallery : null,
            price: Number(data.price),
            tickets: Number(data.tickets),
            drawDate: new Date(data.drawDate),
            status: data.status || 'draft',
            slug: data.slug || null,
            boletosConOportunidades: data.boletosConOportunidades || false,
            numeroOportunidades: data.numeroOportunidades || 1,
            packs: processedPacks,
            bonuses: processedBonuses
            // NO enviar: heroImage, sold, createdAt, updatedAt
            // Estos no existen en el esquema Prisma o son generados automáticamente
        };
        
        console.log('📤 SENDING TO BACKEND');
        console.log('📤 Full cleaned object:', JSON.stringify(cleaned, null, 2));
        console.log('📦 Packs in cleaned:', cleaned.packs);
        console.log('🎁 Bonuses in cleaned:', cleaned.bonuses);
        return cleaned;
    };

    const handleSaveRaffle = async (data: Raffle) => {
        try {
            setRefreshing(true);
            
            console.log('💾 Saving raffle:', {
                isEdit: !!editingRaffle,
                originalData: data
            });
            
            const cleanedData = cleanRaffleData(data);
            console.log('✅ Cleaned data:', cleanedData);
            
            let savedRaffle: Raffle;
            if (editingRaffle?.id) {
                // Asegurar que el ID sea el correcto de la base de datos
                const raffleId = editingRaffle.id;
                console.log('📝 Updating existing raffle:', raffleId);
                console.log('📝 Editing raffle object:', editingRaffle);
                savedRaffle = await updateRaffle(raffleId, cleanedData);
                toast.success('¡Rifa actualizada!', 'La rifa se actualizó correctamente');
            } else {
                console.log('🆕 Creating new raffle');
                savedRaffle = await createRaffle(cleanedData);
                toast.success('¡Rifa creada!', 'La rifa se creó exitosamente');
            }
            
            console.log('✅ RAFFLE SAVED SUCCESSFULLY');
            console.log('✅ Saved raffle object:', JSON.stringify(savedRaffle, null, 2));
            console.log('📦 Saved raffle packs:', savedRaffle.packs);
            console.log('📦 Saved packs type:', typeof savedRaffle.packs);
            console.log('📦 Saved packs isArray:', Array.isArray(savedRaffle.packs));
            console.log('🎁 Saved raffle bonuses:', savedRaffle.bonuses);
            console.log('🎁 Saved bonuses type:', typeof savedRaffle.bonuses);
            console.log('🎁 Saved bonuses isArray:', Array.isArray(savedRaffle.bonuses));
            
            // Parsear el raffle guardado para asegurar que packs y bonuses estén correctos
            const parsedRaffle = parseRaffleDates(savedRaffle);
            console.log('✅ PARSED RAFFLE');
            console.log('📦 Parsed packs:', parsedRaffle.packs);
            console.log('🎁 Parsed bonuses:', parsedRaffle.bonuses);
            
            // Cerrar modal primero
            handleCloseModal();
            
            // IMPORTANTE: Refrescar desde el backend para obtener los datos actualizados
            // Esto asegura que se muestren los cambios correctamente
            console.log('🔄 Refreshing raffles from backend...');
            await refreshRaffles();
            console.log('✅ Raffles refreshed successfully');
        } catch (error: any) {
            console.error('❌ Error saving raffle:', error);
            toast.error(
                'Error al guardar',
                error.message || 'No se pudo guardar la rifa. Verifica todos los campos e intenta de nuevo.'
            );
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteRaffle = async (raffleId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta rifa? Esto no se puede deshacer.')) {
            try {
                setRefreshing(true);
                console.log('🗑️ Deleting raffle:', raffleId);
                await deleteRaffle(raffleId);
                await refreshRaffles();
                console.log('✅ Raffle deleted successfully');
                toast.success('Rifa eliminada', 'La rifa se eliminó correctamente');
            } catch (error) {
                console.error('❌ Error deleting raffle:', error);
                toast.error('Error al eliminar', error instanceof Error ? error.message : 'No se pudo eliminar la rifa');
            } finally {
                setRefreshing(false);
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
            createdAt: undefined,
            updatedAt: undefined
        };
        console.log('📋 Duplicating raffle:', { original: raffle.title, duplicate: duplicatedRaffle.title });
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
            className="space-y-4"
        >
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rifas</h1>
                    <p className="text-gray-600 text-sm">Administra tus rifas de forma profesional</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={refreshRaffles}
                        disabled={refreshing}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    
                    <button
                        onClick={handleExportRaffles}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all duration-200 text-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    
                    <button
                        onClick={handleImportRaffles}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200 text-sm"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Importar</span>
                    </button>
                    
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Rifa</span>
                    </button>
                </div>
            </div>

            {/* Panel de administración optimizado */}
            <OptimizedRaffleManager
                raffles={raffles}
                onEdit={handleOpenModal}
                onDelete={handleDeleteRaffle}
                onDuplicate={handleDuplicateRaffle}
                onCreate={() => handleOpenModal()}
                loading={refreshing}
            />
            
            {/* Modal de formulario - Responsive */}
            <AnimatePresence>
                {isModalOpen && (
                    isMobile ? (
                        <MobileOptimizedRaffleForm
                            raffle={editingRaffle}
                            onClose={handleCloseModal}
                            onSave={handleSaveRaffle}
                            loading={refreshing}
                        />
                    ) : (
                        <AdvancedRaffleForm
                            raffle={editingRaffle}
                            onClose={handleCloseModal}
                            onSave={handleSaveRaffle}
                            loading={refreshing}
                        />
                    )
                )}
            </AnimatePresence>
            
            {/* Toast Container */}
            <ToastContainer />
        </motion.div>
    );
};

export default AdminRafflesPage;