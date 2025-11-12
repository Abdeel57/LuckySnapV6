import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Trash2,
    Save,
    Eye,
    Info,
    DollarSign,
    Image as ImageIcon,
    Gift,
    Settings,
    Clock,
    Star
} from 'lucide-react';
import { Raffle } from '../../types';
import MultiImageUploader from './MultiImageUploader';
import { format } from 'date-fns';

type RaffleFormValues = Omit<Raffle, 'bonuses' | 'id'> & {
    id?: string;
    bonuses: { value: string }[];
    featured?: string;
    terms?: string;
    startDate?: Date | string | null;
};

interface MobileOptimizedRaffleFormProps {
    raffle?: Partial<Raffle> | null;
    onClose: () => void;
    onSave: (data: Raffle) => void;
    loading?: boolean;
}

const inputClasses =
    'w-full mt-1 p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base';
const labelClasses = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5';

const MobileOptimizedRaffleForm: React.FC<MobileOptimizedRaffleFormProps> = ({
    raffle,
    onClose,
    onSave,
    loading = false,
}) => {
    const [activeTab, setActiveTab] = useState<'form' | 'images'>('form');
    const [previewMode, setPreviewMode] = useState(false);

    const defaultPacks = Array.isArray(raffle?.packs)
        ? raffle!.packs!.map((pack) => ({
              ...pack,
              name: pack?.name || '',
              tickets: pack?.tickets || pack?.q || 1,
              q: pack?.q || pack?.tickets || 1,
              price: pack?.price || 0,
          }))
        : [];

    const defaultBonuses = raffle?.bonuses?.map((b) => ({ value: b })) || [];

    const featuredDefault = (raffle as any)?.featured ?? 'false';
    const termsDefault = (raffle as any)?.terms ?? '';
    const startDateDefault = (raffle as any)?.startDate ?? null;

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RaffleFormValues>({
        defaultValues: {
            ...(raffle as RaffleFormValues | undefined),
            title: raffle?.title || '',
            description: raffle?.description || '',
            status: raffle?.status || 'draft',
            drawDate: raffle?.drawDate || new Date(),
            price: raffle?.price || 50,
            tickets: raffle?.tickets || 1000,
            boletosConOportunidades: raffle?.boletosConOportunidades ?? false,
            numeroOportunidades: raffle?.numeroOportunidades ?? 1,
            giftTickets: raffle?.giftTickets ?? 0,
            packs: defaultPacks,
            bonuses: defaultBonuses,
            gallery: raffle?.gallery || [],
            featured: featuredDefault,
            terms: termsDefault,
            startDate: startDateDefault,
        },
    });

    const { fields: bonusFields, append: appendBonus, remove: removeBonus } = useFieldArray({
        control,
        name: 'bonuses',
    });

    const { fields: packFields, append: appendPack, remove: removePack } = useFieldArray({
        control,
        name: 'packs',
    });

    const isMultiChance = watch('boletosConOportunidades');

    const onSubmit = async (data: RaffleFormValues) => {
        try {
            const processedPacks = data.packs
                ?.map((pack) => ({
                    name: pack.name || '',
                    tickets: pack.tickets || pack.q || 1,
                    q: pack.tickets || pack.q || 1,
                    price: pack.price || 0,
                }))
                .filter((pack) => pack.price > 0);

            const saveData = {
                ...data,
                bonuses: data.bonuses?.map((b) => b.value).filter((value) => value && value.trim() !== '') || [],
                packs: processedPacks && processedPacks.length > 0 ? processedPacks : null,
                featured: data.featured ?? 'false',
            } as Raffle;

            await onSave({ ...raffle, ...saveData } as Raffle);
        } catch (error) {
            console.error('❌ Error in mobile form submit:', error);
            throw error;
        }
    };

    const tabs = [
        { id: 'form', label: 'Detalles', icon: Info, shortLabel: 'Detalles' },
        { id: 'images', label: 'Imágenes', icon: ImageIcon, shortLabel: 'Fotos' },
    ];

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
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-2xl font-bold truncate">{raffle ? 'Editar Rifa' : 'Nueva Rifa'}</h2>
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

                    <div className="mt-4">
                        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                                            isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'
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

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <form id="mobile-raffle-form" onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'form' && (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <Info className="w-4 h-4 text-blue-600" />
                                            <span>Datos generales</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelClasses}>Título de la rifa</label>
                                                <input
                                                    {...register('title', { required: 'El título es requerido' })}
                                                    className={inputClasses}
                                                    placeholder="Ej: iPhone 15 Pro Max"
                                                />
                                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Slug (opcional)</label>
                                                <input
                                                    {...register('slug')}
                                                    className={inputClasses}
                                                    placeholder="ej: iphone-15-pro-max"
                                                />
                                                <p className="text-[11px] text-gray-500 mt-1">Se genera automáticamente si lo dejas vacío.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelClasses}>Estado</label>
                                                <select {...register('status')} className={inputClasses}>
                                                    <option value="draft">Borrador</option>
                                                    <option value="active">Activa</option>
                                                    <option value="finished">Finalizada</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Fecha del sorteo</label>
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
                                                {errors.drawDate && <p className="text-red-500 text-xs mt-1">La fecha es obligatoria.</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Descripción</label>
                                            <textarea
                                                {...register('description')}
                                                rows={3}
                                                className={`${inputClasses} min-h-[96px] resize-vertical`}
                                                placeholder="Describe el premio y los detalles más relevantes."
                                            />
                                        </div>
                                    </section>

                                    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            <span>Precios y boletos</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelClasses}>Precio por boleto (LPS)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register('price', {
                                                        required: 'El precio es requerido',
                                                        min: { value: 0.01, message: 'Debe ser mayor a 0' },
                                                        valueAsNumber: true,
                                                    })}
                                                    className={inputClasses}
                                                    placeholder="50"
                                                />
                                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Cantidad total de boletos</label>
                                                <input
                                                    type="number"
                                                    {...register('tickets', {
                                                        required: 'El número de boletos es requerido',
                                                        min: { value: 1, message: 'Mínimo 1 boleto' },
                                                        valueAsNumber: true,
                                                    })}
                                                    className={inputClasses}
                                                    placeholder="1000"
                                                />
                                                {errors.tickets && <p className="text-red-500 text-xs mt-1">{errors.tickets.message}</p>}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                <Gift className="w-4 h-4 text-violet-500" />
                                                <span>Paquetes opcionales</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => appendPack({ name: '', tickets: 1, price: 50 })}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Agregar
                                            </button>
                                        </div>
                                        <p className="text-[12px] text-gray-500">
                                            Úsalos solo si quieres ofrecer combos con precio especial. Si no agregas ninguno, la compra será por boletos individuales.
                                        </p>
                                        {packFields.length === 0 && (
                                            <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-[12px] text-blue-700">
                                                No hay paquetes configurados actualmente.
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {packFields.map((field, index) => (
                                                <div key={field.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <span className="text-sm font-semibold text-gray-700">Paquete {index + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removePack(index)}
                                                            className="text-xs text-red-500 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div>
                                                            <label className={labelClasses}>Nombre</label>
                                                            <input
                                                                {...register(`packs.${index}.name`)}
                                                                className={inputClasses}
                                                                placeholder="Ej: Pack Básico"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>Boletos</label>
                                                            <input
                                                                type="number"
                                                                {...register(`packs.${index}.tickets`, { required: true, min: 1, valueAsNumber: true })}
                                                                className={inputClasses}
                                                                placeholder="1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>Precio (LPS)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                {...register(`packs.${index}.price`, { required: true, min: 0, valueAsNumber: true })}
                                                                className={inputClasses}
                                                                placeholder="100"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <Star className="w-4 h-4 text-amber-500" />
                                            <span>Bonificaciones visibles</span>
                                        </div>
                                        {bonusFields.length === 0 && (
                                            <p className="text-[12px] text-gray-500">Describe premios adicionales, descuentos o beneficios que verán tus clientes.</p>
                                        )}
                                        <div className="space-y-2">
                                            {bonusFields.map((field, index) => (
                                                <div key={field.id} className="flex items-center gap-2">
                                                    <input
                                                        {...register(`bonuses.${index}.value`)}
                                                        className={`${inputClasses} flex-1`}
                                                        placeholder="Ej: 2 boletos gratis por cada 10 comprados"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBonus(index)}
                                                        className="text-xs text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => appendBonus({ value: '' })}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Añadir bonificación
                                        </button>
                                    </section>

                                    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            <span>Promociones y oportunidades extra</span>
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                {...register('boletosConOportunidades')}
                                            />
                                            Activar múltiples oportunidades por boleto
                                        </label>
                                        {isMultiChance && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelClasses}>Número de oportunidades</label>
                                                    <input
                                                        type="number"
                                                        {...register('numeroOportunidades', { min: 1, max: 10, valueAsNumber: true })}
                                                        className={inputClasses}
                                                        placeholder="2"
                                                    />
                                                    <p className="text-[11px] text-gray-500 mt-1">Cada boleto participará esta cantidad de veces en el sorteo.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <label className={labelClasses}>Boletos de regalo automáticos</label>
                                            <input
                                                type="number"
                                                {...register('giftTickets', { min: 0, valueAsNumber: true })}
                                                className={inputClasses}
                                                placeholder="0"
                                            />
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                Se sumarán al resumen de compra para mostrar cuántos boletos adicionales recibe cada cliente (opcional).
                                            </p>
                                        </div>
                                    </section>

                                    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <details className="group">
                                            <summary className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                                                <Settings className="w-4 h-4 text-gray-600 group-open:rotate-90 transition-transform" />
                                                Configuración avanzada (opcional)
                                            </summary>
                                            <div className="mt-4 space-y-3 text-sm text-gray-700">
                                                <div>
                                                    <label className={labelClasses}>Fecha de inicio</label>
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
                                                    <label className={labelClasses}>Términos y condiciones</label>
                                                    <textarea
                                                        {...register('terms')}
                                                        rows={3}
                                                        className={`${inputClasses} min-h-[96px] resize-vertical`}
                                                        placeholder="Añade condiciones especiales si las necesitas."
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Mostrar en la página principal</label>
                                                    <select {...register('featured')} className={inputClasses}>
                                                        <option value="true">Sí</option>
                                                        <option value="false">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </details>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'images' && (
                                <motion.div
                                    key="images"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <ImageIcon className="w-4 h-4 text-pink-500" />
                                            <span>Galería del premio</span>
                                        </div>
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
                                        <p className="text-[11px] text-gray-500">
                                            Sube hasta 10 imágenes. La primera se usa como portada en la página pública.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                <div className="bg-white border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="mobile-raffle-form"
                            disabled={isSubmitting || loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
