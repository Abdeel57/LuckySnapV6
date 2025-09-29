import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { getRaffles, createRaffle, updateRaffle, deleteRaffle } from '../../services/api';
import { Raffle } from '../../types';
import { Plus, Trash2, X } from 'lucide-react';
import Spinner from '../../components/Spinner';
import { format } from 'date-fns';
import ImageUploaderAdvanced from '../../components/admin/ImageUploaderAdvanced';

// FIX: Define a type for the form values to handle bonuses as an array of objects,
// which is more compatible with react-hook-form's useFieldArray.
type RaffleFormValues = Omit<Raffle, 'bonuses' | 'id'> & {
    id?: string;
    bonuses: { value: string }[];
};

const RaffleFormModal = ({ raffle, onClose, onSave }: { raffle: Partial<Raffle> | null, onClose: () => void, onSave: (data: Raffle) => void }) => {
    // FIX: Use the new RaffleFormValues type and transform the defaultValues for bonuses.
    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<RaffleFormValues>({
        defaultValues: raffle 
            ? { ...raffle, packs: raffle.packs?.length ? raffle.packs : [{q: 1, price: 100}], bonuses: raffle.bonuses?.map(b => ({ value: b })) || [] }
            : { status: 'draft', tickets: 1000, packs: [{ q: 1, price: 100 }], bonuses: [], gallery: [], sold: 0 }
    });

    const { fields: bonusFields, append: appendBonus, remove: removeBonus } = useFieldArray({
        control, name: "bonuses"
    });

    // FIX: The onSubmit data is of type RaffleFormValues. It needs to be transformed back before saving.
    const onSubmit = (data: RaffleFormValues) => {
        const saveData = {
            ...data,
            bonuses: data.bonuses.map(b => b.value),
        };
        onSave({ ...raffle, ...saveData } as Raffle);
    };

    const inputClasses = "w-full mt-1 p-2 border rounded-md bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{raffle?.id ? 'Editar Rifa' : 'Nueva Rifa'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200"><X /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Título</label>
                        <input {...register('title', { required: 'El título es requerido' })} className={inputClasses} />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as React.ReactNode}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Slug (URL amigable, ej. auto-deportivo-2024)</label>
                        <input {...register('slug', { required: 'El slug es requerido' })} className={inputClasses} />
                        {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message as React.ReactNode}</p>}
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-600">Descripción</label>
                        <textarea {...register('description')} className={inputClasses} rows={3} />
                    </div>

                    <div>
                        <Controller
                            name="heroImage"
                            control={control}
                            rules={{ required: 'La imagen es requerida' }}
                            render={({ field }) => (
                                            <ImageUploaderAdvanced
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Seleccionar imagen principal"
                                                maxWidth={800}
                                                maxHeight={600}
                                                quality={0.8}
                                            />
                            )}
                        />
                        {errors.heroImage && <p className="text-red-500 text-xs mt-1">{errors.heroImage.message as React.ReactNode}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Las imágenes se optimizan automáticamente para mejor rendimiento
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Fecha del Sorteo</label>
                            <Controller
                                name="drawDate"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <input type="date" value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''} 
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            // Add time to avoid timezone issues
                                            field.onChange(new Date(e.target.value + 'T12:00:00Z'));
                                        }
                                    }} className={inputClasses} />
                                )}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Total de Boletos</label>
                            <input type="number" {...register('tickets', { required: true, valueAsNumber: true, min: 1 })} className={inputClasses} />
                        </div>
                         
                        <div>
                            <label className="text-sm font-medium text-gray-600">Precio por Boleto (LPS)</label>
                            <input type="number" {...register('packs.0.price', { required: "El precio es requerido", valueAsNumber: true, min: { value: 0.01, message: "El precio debe ser positivo" } })} className={inputClasses} step="0.01" />
                             {/* @ts-ignore */}
                            {errors.packs?.[0]?.price && <p className="text-red-500 text-xs mt-1">{errors.packs[0].price.message as React.ReactNode}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">Estado</label>
                            <select {...register('status')} className={inputClasses}>
                                <option value="draft">Borrador</option>
                                <option value="active">Activa</option>
                                <option value="finished">Finalizada</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Bonos</label>
                        {bonusFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 mt-1">
                                {/* FIX: Register the nested 'value' property of the bonus object. */}
                                <input {...register(`bonuses.${index}.value`)} className={`${inputClasses} mt-0`} />
                                <button type="button" onClick={() => removeBonus(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                         {/* FIX: Append an object { value: '' } to match the new form data structure for bonuses. */}
                         <button type="button" onClick={() => appendBonus({ value: '' })} className="mt-2 text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={14}/>Agregar Bono</button>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                            {isSubmitting ? 'Guardando...' : 'Guardar Rifa'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};


const AdminRafflesPage: React.FC = () => {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRaffle, setEditingRaffle] = useState<Partial<Raffle> | null>(null);

    const fetchRaffles = async () => {
        setLoading(true);
        const data = await getRaffles();
        setRaffles(data);
        setLoading(false);
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

    // Función para limpiar datos antes de enviar (SIN reemplazar imágenes)
    const cleanRaffleData = (data: Raffle) => {
        return {
            title: data.title,
            description: data.description,
            heroImage: data.heroImage || '',
            gallery: data.gallery || [],
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
            fetchRaffles();
            handleCloseModal();
        } catch (error) {
            console.error(error)
            alert("Error al guardar la rifa.");
        }
    };

    const handleDeleteRaffle = async (raffleId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta rifa? Esto no se puede deshacer.')) {
            try {
                await deleteRaffle(raffleId);
                fetchRaffles();
            } catch (error) {
                alert("Error al eliminar la rifa.");
            }
        }
    };

    const getStatusChip = (status: 'draft' | 'active' | 'finished') => {
        switch (status) {
            case 'active': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Activa</span>;
            case 'finished': return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Finalizada</span>;
            case 'draft': return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Borrador</span>;
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Rifas</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    <span>Nueva Rifa</span>
                </button>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                {loading ? <Spinner /> : (
                    <div>
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {raffles.map(raffle => (
                                <div key={raffle.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-gray-800 pr-2">{raffle.title}</p>
                                        <div className="flex-shrink-0">{getStatusChip(raffle.status)}</div>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        <p>{format(new Date(raffle.drawDate), 'dd MMM, yyyy')}</p>
                                        <p>{raffle.sold} / {raffle.tickets} boletos</p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => handleOpenModal(raffle)} className="flex-1 py-2 px-3 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">Editar</button>
                                        <button onClick={() => handleDeleteRaffle(raffle.id)} className="flex-1 py-2 px-3 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Eliminar</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boletos</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {raffles.map(raffle => (
                                        <tr key={raffle.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{raffle.title}</div>
                                                <div className="text-sm text-gray-500">{format(new Date(raffle.drawDate), 'dd MMM, yyyy')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{raffle.sold} / {raffle.tickets}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusChip(raffle.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleOpenModal(raffle)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                                <button onClick={() => handleDeleteRaffle(raffle.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            <AnimatePresence>
                {isModalOpen && <RaffleFormModal raffle={editingRaffle} onClose={handleCloseModal} onSave={handleSaveRaffle} />}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminRafflesPage;