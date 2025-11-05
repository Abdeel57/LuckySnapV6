import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Plus, 
    Trash2, 
    Save, 
    Eye, 
    Calendar,
    DollarSign,
    Users,
    Image as ImageIcon,
    Star,
    Gift,
    Settings,
    Clock,
    AlertCircle,
    CheckCircle,
    Info,
    ChevronLeft,
    ChevronRight,
    Smartphone
} from 'lucide-react';
import { Raffle } from '../../types';
import MultiImageUploader from './MultiImageUploader';
import { format } from 'date-fns';

interface MobileOptimizedRaffleFormProps {
    raffle?: Partial<Raffle> | null;
    onClose: () => void;
    onSave: (data: Raffle) => void;
    loading?: boolean;
}

type RaffleFormValues = Omit<Raffle, 'bonuses' | 'id'> & {
    id?: string;
    bonuses: { value: string }[];
};

const MobileOptimizedRaffleForm: React.FC<MobileOptimizedRaffleFormProps> = ({
    raffle,
    onClose,
    onSave,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'images' | 'advanced'>('basic');
    const [previewMode, setPreviewMode] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);

    const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<RaffleFormValues>({
        defaultValues: raffle 
            ? { 
                ...raffle, 
                packs: raffle.packs?.length ? raffle.packs : [{q: 1, price: 100}], 
                bonuses: raffle.bonuses?.map(b => ({ value: b })) || [],
                gallery: raffle.gallery || []
            }
            : { 
                status: 'draft', 
                tickets: 1000, 
                packs: [{ q: 1, price: 100 }], 
                bonuses: [], 
                gallery: [], 
                sold: 0 
            }
    });

    const { fields: bonusFields, append: appendBonus, remove: removeBonus } = useFieldArray({
        control, name: "bonuses"
    });

    const { fields: packFields, append: appendPack, remove: removePack } = useFieldArray({
        control, name: "packs"
    });

    const watchedData = watch();

    const onSubmit = async (data: RaffleFormValues) => {
        try {
            console.log('📱 MOBILE FORM SUBMIT - INICIO');
            console.log('📱 Form data:', JSON.stringify(data, null, 2));
            console.log('📦 Form packs:', data.packs);
            console.log('🎁 Form bonuses:', data.bonuses);
            
            // Asegurar que packs tenga la estructura correcta
            const processedPacks = data.packs?.map(pack => ({
                name: pack.name || '',
                tickets: pack.tickets || pack.q || 1,
                q: pack.q || pack.tickets || 1,
                price: pack.price || 0
            })).filter(pack => pack.price > 0) || null;
            
            const saveData = {
                ...data,
                bonuses: data.bonuses?.map(b => b.value).filter(b => b && b.trim() !== '') || [],
                packs: processedPacks && processedPacks.length > 0 ? processedPacks : null
            };
            
            console.log('💾 MOBILE SAVING DATA:', JSON.stringify(saveData, null, 2));
            console.log('📦 SaveData packs:', saveData.packs);
            console.log('🎁 SaveData bonuses:', saveData.bonuses);
            
            await onSave({ ...raffle, ...saveData } as Raffle);
        } catch (error: any) {
            console.error('❌ Error in mobile form submit:', error);
            throw error;
        }
    };

    const tabs = [
        { id: 'basic', label: 'Básica', icon: Info, shortLabel: 'Info' },
        { id: 'pricing', label: 'Precios', icon: DollarSign, shortLabel: 'Precios' },
        { id: 'images', label: 'Imágenes', icon: ImageIcon, shortLabel: 'Fotos' },
        { id: 'advanced', label: 'Avanzada', icon: Settings, shortLabel: 'Más' }
    ];

    const inputClasses = "w-full mt-1 p-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"; // text-base para iOS
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-2";

    const nextTab = () => {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1].id as any);
        }
    };

    const prevTab = () => {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1].id as any);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%', scale: 1 }} 
                animate={{ y: 0, scale: 1 }} 
                exit={{ y: '100%', scale: 0.95 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full h-[95vh] sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header optimizado para móvil */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-2xl font-bold truncate">
                                {raffle ? 'Editar Rifa' : 'Nueva Rifa'}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1 hidden sm:block">
                                {raffle ? 'Modifica los detalles de tu rifa' : 'Configura todos los aspectos de tu nueva rifa'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 px-2 sm:px-4 py-2 rounded-xl flex items-center space-x-1 sm:space-x-2 border border-white/20 text-sm"
                            >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">{previewMode ? 'Editar' : 'Vista Previa'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 p-2 rounded-xl border border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navegación por pestañas optimizada para móvil */}
                    <div className="mt-4">
                        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                                            isActive
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        <span className="sm:hidden">{tab.shortLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Contenido principal con scroll optimizado */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
                        <AnimatePresence mode="wait">
                            {/* Tab: Información Básica */}
                            {activeTab === 'basic' && (
                                <motion.div
                                    key="basic"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 sm:space-y-6"
                                >
                                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <Info className="w-5 h-5 mr-2 text-blue-600" />
                                            Información Básica
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelClasses}>
                                                    Título de la Rifa
                                                </label>
                                                <input
                                                    {...register('title', { required: 'El título es requerido' })}
                                                    className={inputClasses}
                                                    placeholder="Ej: iPhone 15 Pro Max"
                                                />
                                                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                                            </div>

                                            <div>
                                                <label className={labelClasses}>
                                                    <Calendar className="w-4 h-4 inline mr-2" />
                                                    Fecha del Sorteo
                                                </label>
                                                <Controller
                                                    name="drawDate"
                                                    control={control}
                                                    rules={{ required: true }}
                                                    render={({ field }) => (
                                                        <input
                                                            type="datetime-local"
                                                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                                            className={inputClasses}
                                                        />
                                                    )}
                                                />
                                                {errors.drawDate && <p className="text-red-500 text-sm mt-1">La fecha es requerida</p>}
                                            </div>

                                            <div>
                                                <label className={labelClasses}>
                                                    <Gift className="w-4 h-4 inline mr-2" />
                                                    Descripción
                                                </label>
                                                <textarea
                                                    {...register('description')}
                                                    rows={4}
                                                    className={inputClasses}
                                                    placeholder="Describe el premio y los detalles de la rifa..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClasses}>
                                                        <Users className="w-4 h-4 inline mr-2" />
                                                        Total de Boletos
                                                    </label>
                                                    <input
                                                        {...register('tickets', { 
                                                            required: 'El número de boletos es requerido',
                                                            min: { value: 1, message: 'Mínimo 1 boleto' }
                                                        })}
                                                        type="number"
                                                        className={inputClasses}
                                                        placeholder="1000"
                                                    />
                                                    {errors.tickets && <p className="text-red-500 text-sm mt-1">{errors.tickets.message}</p>}
                                                </div>

                                                <div>
                                                    <label className={labelClasses}>
                                                        <Star className="w-4 h-4 inline mr-2" />
                                                        Estado
                                                    </label>
                                                    <select {...register('status')} className={inputClasses}>
                                                        <option value="draft">Borrador</option>
                                                        <option value="active">Activa</option>
                                                        <option value="finished">Finalizada</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Tab: Precios y Paquetes */}
                            {activeTab === 'pricing' && (
                                <motion.div
                                    key="pricing"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 sm:space-y-6"
                                >
                                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                            Precios y Paquetes
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {packFields.map((field, index) => (
                                                <div key={field.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-700">Paquete {index + 1}</h4>
                                                        {packFields.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removePack(index)}
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className={labelClasses}>Cantidad de Boletos</label>
                                                            <input
                                                                {...register(`packs.${index}.q`, { required: true, min: 1 })}
                                                                type="number"
                                                                className={inputClasses}
                                                                placeholder="1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>Precio (LPS)</label>
                                                            <input
                                                                {...register(`packs.${index}.price`, { required: true, min: 0 })}
                                                                type="number"
                                                                className={inputClasses}
                                                                placeholder="100"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <button
                                                type="button"
                                                onClick={() => appendPack({ q: 1, price: 100 })}
                                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center space-x-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span>Agregar Paquete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bonificaciones */}
                                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <Gift className="w-5 h-5 mr-2 text-purple-600" />
                                            Bonificaciones
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {bonusFields.map((field, index) => (
                                                <div key={field.id} className="flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <input
                                                            {...register(`bonuses.${index}.value`)}
                                                            className={inputClasses}
                                                            placeholder="Ej: 2 boletos gratis por cada 10 comprados"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBonus(index)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            <button
                                                type="button"
                                                onClick={() => appendBonus({ value: '' })}
                                                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-all duration-200 flex items-center justify-center space-x-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Agregar Bonificación</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Tab: Imágenes */}
                            {activeTab === 'images' && (
                                <motion.div
                                    key="images"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 sm:space-y-6"
                                >
                                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <ImageIcon className="w-5 h-5 mr-2 text-pink-600" />
                                            Imágenes del Premio
                                        </h3>
                                        
                                        <Controller
                                            name="gallery"
                                            control={control}
                                            render={({ field }) => (
                                                <MultiImageUploader
                                                    images={field.value || []}
                                                    onChange={field.onChange}
                                                    maxImages={10}
                                                />
                                            )}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Tab: Configuración Avanzada */}
                            {activeTab === 'advanced' && (
                                <motion.div
                                    key="advanced"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 sm:space-y-6"
                                >
                                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <Settings className="w-5 h-5 mr-2 text-orange-600" />
                                            Configuración Avanzada
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelClasses}>
                                                    <Clock className="w-4 h-4 inline mr-2" />
                                                    Fecha de Inicio
                                                </label>
                                                <Controller
                                                    name="startDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            type="datetime-local"
                                                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                                            className={inputClasses}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClasses}>
                                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                                    Términos y Condiciones
                                                </label>
                                                <textarea
                                                    {...register('terms')}
                                                    rows={4}
                                                    className={inputClasses}
                                                    placeholder="Especifica los términos y condiciones de la rifa..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClasses}>
                                                        <Users className="w-4 h-4 inline mr-2" />
                                                        Boletos Vendidos
                                                    </label>
                                                    <input
                                                        {...register('sold', { min: 0 })}
                                                        type="number"
                                                        className={inputClasses}
                                                        placeholder="0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className={labelClasses}>
                                                        <CheckCircle className="w-4 h-4 inline mr-2" />
                                                        Mostrar en Página Principal
                                                    </label>
                                                    <select {...register('featured')} className={inputClasses}>
                                                        <option value="true">Sí</option>
                                                        <option value="false">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Footer con navegación y botones optimizado para móvil */}
                <div className="bg-white border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
                    {/* Navegación entre pestañas en móvil */}
                    <div className="flex items-center justify-between mb-4 sm:hidden">
                        <button
                            type="button"
                            onClick={prevTab}
                            disabled={activeTab === 'basic'}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Anterior</span>
                        </button>
                        
                        <div className="flex items-center space-x-1">
                            {tabs.map((tab, index) => (
                                <div
                                    key={tab.id}
                                    className={`w-2 h-2 rounded-full ${
                                        activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        <button
                            type="button"
                            onClick={nextTab}
                            disabled={activeTab === 'advanced'}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Siguiente</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {isSubmitting || loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>{raffle ? 'Actualizar Rifa' : 'Crear Rifa'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MobileOptimizedRaffleForm;
