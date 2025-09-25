import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { getSettings, adminUpdateSettings } from '../../services/api';
import { Settings, AppearanceSettings } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Spinner from '../../components/Spinner';

const SectionWrapper: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h2>
        {children}
    </div>
);

const inputClasses = "w-full mt-1 p-2 border rounded-md bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClasses = "text-sm font-medium text-gray-600";

const AdminSettingsPage = () => {
    const { register, control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<Settings>();
    const [loading, setLoading] = useState(true);

    const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({ control, name: "paymentAccounts" });
    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faqs" });

    useEffect(() => {
        getSettings().then(data => {
            reset(data);
            setLoading(false);
        });
    }, [reset]);
    
    const onSubmit = async (data: Settings) => {
        try {
            const result = await adminUpdateSettings(data);
            reset(result); // Reset form with data from server to clear dirty state
            alert('Configuración guardada con éxito');
        } catch (error) {
            alert('Error al guardar la configuración');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Configuración</h1>
            <form onSubmit={handleSubmit(onSubmit)}>

                <SectionWrapper title="Apariencia General">
                    <div className="space-y-4">
                         <div>
                            <label className={labelClasses}>Nombre del Sitio</label>
                            <input {...register('appearance.siteName', { required: true })} className={inputClasses} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(Object.keys(defaultAppearance.colors) as Array<keyof AppearanceSettings['colors']>).map(colorKey => (
                                <div key={colorKey}>
                                    <label className={labelClasses}>Color {colorKey}</label>
                                    <Controller
                                        name={`appearance.colors.${colorKey}`}
                                        control={control}
                                        render={({ field }) => <input type="color" {...field} className="w-full h-10 p-1 border rounded-md" />}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionWrapper>
                
                <SectionWrapper title="Información de Contacto y Redes">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>WhatsApp (con código de país, ej. 521...)</label>
                            <input {...register('contactInfo.whatsapp')} className={inputClasses} />
                        </div>
                         <div>
                            <label className={labelClasses}>Email de Contacto</label>
                            <input type="email" {...register('contactInfo.email')} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>URL Facebook</label>
                            <input type="url" {...register('socialLinks.facebookUrl')} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>URL Instagram</label>
                            <input type="url" {...register('socialLinks.instagramUrl')} className={inputClasses} />
                        </div>
                         <div>
                            <label className={labelClasses}>URL Twitter</label>
                            <input type="url" {...register('socialLinks.twitterUrl')} className={inputClasses} />
                        </div>
                    </div>
                </SectionWrapper>

                <SectionWrapper title="Cuentas de Pago">
                    <div className="space-y-4">
                    {paymentFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md bg-gray-50/50 space-y-2 relative">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                    <label className={labelClasses}>Banco</label>
                                    <input {...register(`paymentAccounts.${index}.bank` as const, { required: true })} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Titular de la cuenta</label>
                                    <input {...register(`paymentAccounts.${index}.accountHolder` as const, { required: true })} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>No. de Cuenta</label>
                                    <input {...register(`paymentAccounts.${index}.accountNumber` as const)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>CLABE</label>
                                    <input {...register(`paymentAccounts.${index}.clabe` as const, { required: true })} className={inputClasses} />
                                </div>
                             </div>
                            <button type="button" onClick={() => removePayment(index)} className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    </div>
                    <button type="button" onClick={() => appendPayment({ id: '', bank: '', accountHolder: '', accountNumber: '', clabe: '' })} className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={14}/>Agregar Cuenta</button>
                </SectionWrapper>
                
                <SectionWrapper title="Preguntas Frecuentes (FAQ)">
                    <div className="space-y-4">
                        {faqFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-md bg-gray-50/50 relative">
                                <div>
                                    <label className={labelClasses}>Pregunta</label>
                                    <input {...register(`faqs.${index}.question` as const, { required: true })} className={inputClasses} />
                                </div>
                                <div className="mt-2">
                                    <label className={labelClasses}>Respuesta</label>
                                    <textarea {...register(`faqs.${index}.answer` as const, { required: true })} className={inputClasses} rows={2}/>
                                </div>
                                <button type="button" onClick={() => removeFaq(index)} className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={() => appendFaq({ id: '', question: '', answer: '' })} className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={14}/>Agregar Pregunta</button>
                </SectionWrapper>
                
                <div className="mt-8 flex justify-end">
                     <button type="submit" disabled={isSubmitting || !isDirty} className="py-2.5 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// Dummy data for color keys mapping.
const defaultAppearance: AppearanceSettings = {
  siteName: 'Lucky Snap',
  logoAnimation: 'rotate',
  colors: {
    backgroundPrimary: '#111827',
    backgroundSecondary: '#1f2937',
    accent: '#ec4899',
    action: '#0ea5e9',
  }
};


export default AdminSettingsPage;
