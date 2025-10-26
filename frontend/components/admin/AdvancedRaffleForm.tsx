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
    Info
} from 'lucide-react';
import { Raffle } from '../../types';
import MultiImageUploader from './MultiImageUploader';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';

interface AdvancedRaffleFormProps {
    raffle?: Partial<Raffle> | null;
    onClose: () => void;
    onSave: (data: Raffle) => void;
    loading?: boolean;
}

type RaffleFormValues = Omit<Raffle, 'bonuses' | 'id'> & {
    id?: string;
    bonuses: { value: string }[];
    boletosConOportunidades?: boolean;
    numeroOportunidades?: number;
};

const AdvancedRaffleForm: React.FC<AdvancedRaffleFormProps> = ({
    raffle,
    onClose,
    onSave,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'images' | 'advanced'>('basic');
    const [previewMode, setPreviewMode] = useState(false);
    const toast = useToast();

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
                price: 50,
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
            // Validar campos requeridos
            if (!data.title || data.title.trim() === '') {
                toast.error('Título requerido', 'Por favor ingresa un título para la rifa');
                return;
            }
            
            if (!data.tickets || data.tickets < 1) {
                toast.error('Boletos requeridos', 'Debes especificar al menos 1 boleto');
                return;
            }
            
            if (!data.price || data.price <= 0) {
                toast.error('Precio requerido', 'El precio debe ser mayor a 0');
                return;
            }
            
            if (!data.drawDate) {
                toast.error('Fecha requerida', 'Debes seleccionar la fecha del sorteo');
                return;
            }

            const saveData = {
                ...data,
                bonuses: data.bonuses.map(b => b.value),
            };
            
            await onSave({ ...raffle, ...saveData } as Raffle);
            
            toast.success(
                raffle ? '¡Rifa actualizada!' : '¡Rifa creada!',
                raffle ? 'La rifa se actualizó correctamente' : 'La rifa se creó exitosamente'
            );
            
            onClose();
        } catch (error: any) {
            console.error('Error saving raffle:', error);
            toast.error(
                'Error al guardar',
                error.message || 'No se pudo guardar la rifa. Verifica todos los campos e intenta de nuevo.'
            );
        }
    };

    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: Info },
        { id: 'pricing', label: 'Precios y Paquetes', icon: DollarSign },
        { id: 'images', label: 'Imágenes', icon: ImageIcon },
        { id: 'advanced', label: 'Configuración Avanzada', icon: Settings }
    ];

    const inputClasses = "w-full mt-1 p-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200";
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-2";

    return (
        <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: -20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {raffle ? 'Editar Rifa' : 'Crear Nueva Rifa'}
                            </h2>
                            <p className="text-blue-100 mt-1">
                                {raffle ? 'Modifica los detalles de tu rifa' : 'Configura todos los aspectos de tu nueva rifa'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 px-4 py-2 rounded-xl flex items-center space-x-2 border border-white/20"
                            >
                                <Eye className="w-4 h-4" />
                                <span>{previewMode ? 'Editar' : 'Vista Previa'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 p-2 rounded-xl border border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex h-[calc(95vh-120px)]">
                    {/* Sidebar de navegación */}
                    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                        <nav className="space-y-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Información de estado */}
                        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                            <h4 className="font-semibold text-gray-700 mb-3">Estado Actual</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Estado:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        watchedData.status === 'active' ? 'bg-green-100 text-green-800' :
                                        watchedData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {watchedData.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Boletos:</span>
                                    <span className="font-medium">{watchedData.tickets?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Paquetes:</span>
                                    <span className="font-medium">{watchedData.packs?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Imágenes:</span>
                                    <span className="font-medium">{watchedData.gallery?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                            <AnimatePresence mode="wait">
                                {/* Tab: Información Básica */}
                                {activeTab === 'basic' && (
                                    <motion.div
                                        key="basic"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClasses}>
                                                    <Info className="w-4 h-4 inline mr-2" />
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

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className={labelClasses}>
                                                    <Users className="w-4 h-4 inline mr-2" />
                                                    Total de Boletos
                                                </label>
                                                <input
                                                    type="number"
                                                    {...register('tickets', { required: 'El número de boletos es requerido', min: 1 })}
                                                    className={inputClasses}
                                                    placeholder="1000"
                                                />
                                                {errors.tickets && <p className="text-red-500 text-sm mt-1">{errors.tickets.message}</p>}
                                            </div>

                                            <div>
                                                <label className={labelClasses}>
                                                    <DollarSign className="w-4 h-4 inline mr-2" />
                                                    Precio por Boleto (LPS)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register('price', { 
                                                        required: 'El precio es requerido', 
                                                        min: { value: 0.01, message: 'El precio debe ser mayor a 0' }
                                                    })}
                                                    className={inputClasses}
                                                    placeholder="50.00"
                                                />
                                                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                                            </div>

                                            <div>
                                                <label className={labelClasses}>
                                                    <Settings className="w-4 h-4 inline mr-2" />
                                                    Estado
                                                </label>
                                                <select {...register('status')} className={inputClasses}>
                                                    <option value="draft">Borrador</option>
                                                    <option value="active">Activa</option>
                                                    <option value="finished">Terminada</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Bonos */}
                                        <div>
                                            <label className={labelClasses}>
                                                <Star className="w-4 h-4 inline mr-2" />
                                                Bonos y Premios Adicionales
                                            </label>
                                            <div className="space-y-3">
                                                {bonusFields.map((field, index) => (
                                                    <div key={field.id} className="flex items-center space-x-3">
                                                        <input
                                                            {...register(`bonuses.${index}.value`)}
                                                            className={`${inputClasses} flex-1`}
                                                            placeholder="Ej: Descuento 10%, Boletos extra"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBonus(index)}
                                                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => appendBonus({ value: '' })}
                                                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center space-x-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>Agregar Bono</span>
                                                </button>
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
                                        className="space-y-6"
                                    >
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <DollarSign className="w-5 h-5 text-blue-600" />
                                                <h3 className="font-semibold text-blue-900">Configuración de Precios</h3>
                                            </div>
                                            <p className="text-blue-700 text-sm">
                                                Configura diferentes paquetes de boletos con precios especiales para incentivar las compras.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {packFields.map((field, index) => (
                                                <div key={field.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-4">
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
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className={labelClasses}>Nombre del Paquete</label>
                                                            <input
                                                                {...register(`packs.${index}.name`)}
                                                                className={inputClasses}
                                                                placeholder="Ej: Pack Básico"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>Cantidad de Boletos</label>
                                                            <input
                                                                type="number"
                                                                {...register(`packs.${index}.tickets`, { min: 1 })}
                                                                className={inputClasses}
                                                                placeholder="1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>Precio (LPS)</label>
                                                            <input
                                                                type="number"
                                                                {...register(`packs.${index}.price`, { min: 0 })}
                                                                className={inputClasses}
                                                                placeholder="50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => appendPack({ name: '', tickets: 1, price: 50 })}
                                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center space-x-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span>Agregar Nuevo Paquete</span>
                                            </button>
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
                                        className="space-y-6"
                                    >
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <ImageIcon className="w-5 h-5 text-green-600" />
                                                <h3 className="font-semibold text-green-900">Imagen Principal</h3>
                                            </div>
                                            <p className="text-green-700 text-sm">
                                                Sube la imagen principal del premio (opcional). Se usará una imagen por defecto si no subes ninguna.
                                            </p>
                                        </div>

                                        <div>
                                            <label className={labelClasses}>
                                                <ImageIcon className="w-4 h-4 inline mr-2" />
                                                URL de Imagen
                                            </label>
                                            <input
                                                {...register('imageUrl')}
                                                className={inputClasses}
                                                placeholder="https://ejemplo.com/imagen.jpg"
                                            />
                                            <p className="text-gray-500 text-sm mt-1">
                                                Pega una URL de imagen o déjalo vacío para usar imagen por defecto
                                            </p>
                                            {watchedData.imageUrl && (
                                                <div className="mt-3">
                                                    <img 
                                                        src={watchedData.imageUrl} 
                                                        alt="Preview" 
                                                        className="w-full max-w-md h-48 object-cover rounded-xl border border-gray-300"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop';
                                                        }}
                                                    />
                                                </div>
                                            )}
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
                                        className="space-y-6"
                                    >
                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Settings className="w-5 h-5 text-purple-600" />
                                                <h3 className="font-semibold text-purple-900">Configuración Avanzada</h3>
                                            </div>
                                            <p className="text-purple-700 text-sm">
                                                Configuraciones adicionales para personalizar tu rifa.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClasses}>Slug (URL amigable)</label>
                                                <input
                                                    {...register('slug')}
                                                    className={inputClasses}
                                                    placeholder="iphone-15-pro-max"
                                                />
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Se genera automáticamente si se deja vacío
                                                </p>
                                            </div>

                                            <div>
                                                <label className={labelClasses}>Boletos Vendidos</label>
                                                <input
                                                    type="number"
                                                    {...register('sold', { min: 0 })}
                                                    className={inputClasses}
                                                    placeholder="0"
                                                />
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Número inicial de boletos vendidos
                                                </p>
                                            </div>
                                        </div>

                                        {/* Boletos con Múltiples Oportunidades */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Gift className="w-5 h-5 text-blue-600" />
                                                <h3 className="font-semibold text-blue-900">Múltiples Oportunidades</h3>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        {...register('boletosConOportunidades')}
                                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label className="text-gray-700 font-medium">
                                                        Boletos con Múltiples Oportunidades
                                                    </label>
                                                </div>
                                                
                                                {watch('boletosConOportunidades') && (
                                                    <div>
                                                        <label className={labelClasses}>
                                                            Número de Oportunidades (1-10)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            {...register('numeroOportunidades', { 
                                                                min: 1, 
                                                                max: 10,
                                                                valueAsNumber: true
                                                            })}
                                                            className={inputClasses}
                                                            placeholder="2"
                                                            defaultValue={raffle?.numeroOportunidades || 2}
                                                        />
                                                        <p className="text-gray-500 text-sm mt-1">
                                                            Cada boleto participará X veces en el sorteo
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                                <h4 className="font-semibold text-yellow-900">Información Importante</h4>
                                            </div>
                                            <ul className="text-yellow-800 text-sm space-y-1">
                                                <li>• El slug debe ser único y no contener espacios</li>
                                                <li>• Los boletos vendidos no pueden exceder el total de boletos</li>
                                                <li>• Una vez activada, la rifa será visible públicamente</li>
                                                <li>• Las imágenes se optimizan automáticamente</li>
                                                <li>• Las múltiples oportunidades permiten que cada boleto participe varias veces</li>
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Botones de acción */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                                >
                                    Cancelar
                                </button>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode(!previewMode)}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>Vista Previa</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || loading}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting || loading ? (
                                            <>
                                                <Clock className="w-4 h-4 animate-spin" />
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
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AdvancedRaffleForm;
