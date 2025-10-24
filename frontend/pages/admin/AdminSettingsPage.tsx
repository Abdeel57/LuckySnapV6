import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { getSettings, adminUpdateSettings } from '../../services/api';
import { Settings, AppearanceSettings } from '../../types';
import { Plus, Trash2, Save, RefreshCw, Palette, Globe, CreditCard, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../../components/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import ImageUploaderAdvanced from '../../components/admin/ImageUploaderAdvanced';

const OptimizedSectionWrapper: React.FC<{ 
    title: string, 
    icon: React.ElementType, 
    children: React.ReactNode,
    description?: string 
}> = ({ title, icon: Icon, children, description }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6"
    >
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-xl">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                {description && <p className="text-sm text-gray-600">{description}</p>}
            </div>
        </div>
        {children}
    </motion.div>
);

const inputClasses = "w-full mt-1 p-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200";
const labelClasses = "block text-sm font-semibold text-gray-700 mb-2";

const AdminSettingsPage = () => {
    const { register, control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<Settings>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { updateAppearance } = useTheme();

    const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({ control, name: "paymentAccounts" });
    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faqs" });

    useEffect(() => {
        getSettings().then(data => {
            reset(data);
            setLoading(false);
        });
    }, [reset]);
    
    const onSubmit = async (data: Settings) => {
        setSaving(true);
        try {
            console.log('🔧 Saving settings:', data);
            const result = await adminUpdateSettings(data);
            console.log('✅ Settings saved successfully:', result);
            reset(result);
            
            if (result.appearance) {
                console.log('🎨 Updating appearance in real-time...');
                updateAppearance(result.appearance);
            }
            
            // Show success message with more details
            alert(`✅ Configuración guardada con éxito!\n\nCambios aplicados:\n- Apariencia: ${result.appearance?.siteName || 'N/A'}\n- Contacto: ${result.contactInfo?.whatsapp ? 'WhatsApp configurado' : 'Sin WhatsApp'}\n- Redes: ${Object.values(result.socialLinks || {}).filter(Boolean).length} redes configuradas`);
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            alert('❌ Error al guardar la configuración. Revisa la consola para más detalles.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-gray-600">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header simplificado */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Palette className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                            <p className="text-gray-600">Personaliza tu plataforma</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <OptimizedSectionWrapper
                    title="Apariencia General"
                    icon={Palette}
                    description="Configura la apariencia visual de tu plataforma"
                >
                    <div className="space-y-4">
                         <div>
                            <label className={labelClasses}>Nombre del Sitio</label>
                            <input {...register('appearance.siteName', { required: true })} className={inputClasses} />
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Logo del Sitio</label>
                            <Controller
                                name="appearance.logo"
                                control={control}
                                render={({ field }) => (
                                    <ImageUploaderAdvanced
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Seleccionar logo del sitio"
                                        maxWidth={200}
                                        maxHeight={200}
                                        quality={0.9}
                                    />
                                )}
                            />
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Favicon</label>
                            <Controller
                                name="appearance.favicon"
                                control={control}
                                render={({ field }) => (
                                    <ImageUploaderAdvanced
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Seleccionar favicon"
                                        maxWidth={32}
                                        maxHeight={32}
                                        quality={0.8}
                                    />
                                )}
                            />
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(Object.keys(defaultAppearance.colors) as Array<keyof AppearanceSettings['colors']>).map(colorKey => (
                                <div key={colorKey}>
                                    <label className={labelClasses}>Color {colorKey}</label>
                                    <Controller
                                        name={`appearance.colors.${colorKey}`}
                                        control={control}
                                        render={({ field }) => (
                                            <div className="space-y-2">
                                                <input 
                                                    type="color" 
                                                    {...field} 
                                                    className="w-full h-10 p-1 border rounded-md cursor-pointer" 
                                                />
                                                <div 
                                                    className="w-full h-8 rounded-md border"
                                                    style={{ backgroundColor: field.value }}
                                                />
                                                <input 
                                                    type="text" 
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="w-full text-xs p-1 border rounded text-center"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Preview section */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                            <h3 className="text-lg font-semibold mb-3">Vista Previa</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Colores principales</label>
                                    <div className="space-y-2">
                                        <Controller
                                            name="appearance.colors.backgroundPrimary"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: field.value }}></div>
                                                    <span className="text-sm text-gray-600">Fondo Principal</span>
                                                </div>
                                            )}
                                        />
                                        <Controller
                                            name="appearance.colors.accent"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: field.value }}></div>
                                                    <span className="text-sm text-gray-600">Color de Acento</span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Colores secundarios</label>
                                    <div className="space-y-2">
                                        <Controller
                                            name="appearance.colors.backgroundSecondary"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: field.value }}></div>
                                                    <span className="text-sm text-gray-600">Fondo Secundario</span>
                                                </div>
                                            )}
                                        />
                                        <Controller
                                            name="appearance.colors.action"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: field.value }}></div>
                                                    <span className="text-sm text-gray-600">Color de Acción</span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </OptimizedSectionWrapper>
                
                <OptimizedSectionWrapper
                    title="Información de Contacto y Redes"
                    icon={Globe}
                    description="Configura la información de contacto y redes sociales"
                >
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
                </OptimizedSectionWrapper>

                <OptimizedSectionWrapper
                    title="Cuentas de Pago"
                    icon={CreditCard}
                    description="Configura las cuentas para recibir pagos"
                >
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
                </OptimizedSectionWrapper>
                
                <OptimizedSectionWrapper
                    title="Preguntas Frecuentes (FAQ)"
                    icon={HelpCircle}
                    description="Mantén informados a tus usuarios con preguntas frecuentes"
                >
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
                </OptimizedSectionWrapper>
                
                {/* Botones de acción simplificados */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {isDirty && "Tienes cambios sin guardar"}
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || saving || !isDirty}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting || saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Guardar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
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
