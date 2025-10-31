import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { getSettings, adminUpdateSettings } from '../../services/api';
import { Settings, AppearanceSettings } from '../../types';
import { Plus, Trash2, Save, RefreshCw, Palette, Globe, CreditCard, HelpCircle, Eye } from 'lucide-react';
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

// Componente simplificado de preview de colores
const SimpleColorPreview: React.FC<{
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    secondaryBackgroundColor: string;
}> = ({ primaryColor, accentColor, backgroundColor, secondaryBackgroundColor }) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                        <Eye className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Vista Previa de Colores</h3>
                        <p className="text-sm text-gray-600">Ve cómo se verán los cambios</p>
                    </div>
                </div>
                
                <button
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    {isPreviewOpen ? 'Ocultar' : 'Mostrar'} Preview
                </button>
            </div>

            <AnimatePresence>
                {isPreviewOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border rounded-xl p-4 bg-gray-50">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Paleta de Colores Actual</h4>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center">
                                    <div 
                                        className="w-full h-16 rounded-lg border shadow-sm"
                                        style={{ backgroundColor: primaryColor }}
                                    ></div>
                                    <p className="text-xs text-gray-600 mt-1">Primario</p>
                                </div>
                                <div className="text-center">
                                    <div 
                                        className="w-full h-16 rounded-lg border shadow-sm"
                                        style={{ backgroundColor: accentColor }}
                                    ></div>
                                    <p className="text-xs text-gray-600 mt-1">Acento</p>
                                </div>
                                <div className="text-center">
                                    <div 
                                        className="w-full h-16 rounded-lg border shadow-sm"
                                        style={{ backgroundColor: backgroundColor }}
                                    ></div>
                                    <p className="text-xs text-gray-600 mt-1">Fondo</p>
                                </div>
                                <div className="text-center">
                                    <div 
                                        className="w-full h-16 rounded-lg border shadow-sm"
                                        style={{ backgroundColor: secondaryBackgroundColor }}
                                    ></div>
                                    <p className="text-xs text-gray-600 mt-1">Secundario</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Componente simplificado de presets
const SimpleColorPresets: React.FC<{
    onPresetSelect: (preset: any) => void;
}> = ({ onPresetSelect }) => {
    const presets = [
        {
            name: 'Azul Profesional',
            colors: {
                primary: '#3B82F6',
                accent: '#10B981',
                background: '#111827',
                secondaryBackground: '#1F2937'
            }
        },
        {
            name: 'Púrpura Creativo',
            colors: {
                primary: '#8B5CF6',
                accent: '#F59E0B',
                background: '#111827',
                secondaryBackground: '#1F2937'
            }
        },
        {
            name: 'Verde Naturaleza',
            colors: {
                primary: '#10B981',
                accent: '#F59E0B',
                background: '#111827',
                secondaryBackground: '#1F2937'
            }
        }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl">
                    <Palette className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Presets de Colores</h3>
                    <p className="text-sm text-gray-600">Selecciona una paleta predefinida</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {presets.map((preset, index) => (
                    <motion.div
                        key={preset.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onPresetSelect(preset)}
                        className="p-4 rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md"
                    >
                        <h4 className="font-semibold text-gray-900 mb-3">{preset.name}</h4>
                        
                        <div className="flex space-x-2">
                            <div 
                                className="w-8 h-8 rounded-lg border shadow-sm"
                                style={{ backgroundColor: preset.colors.primary }}
                                title="Color primario"
                            ></div>
                            <div 
                                className="w-8 h-8 rounded-lg border shadow-sm"
                                style={{ backgroundColor: preset.colors.accent }}
                                title="Color de acento"
                            ></div>
                            <div 
                                className="w-8 h-8 rounded-lg border shadow-sm"
                                style={{ backgroundColor: preset.colors.background }}
                                title="Color de fondo"
                            ></div>
                            <div 
                                className="w-8 h-8 rounded-lg border shadow-sm"
                                style={{ backgroundColor: preset.colors.secondaryBackground }}
                                title="Color secundario"
                            ></div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const AdminSettingsPage = () => {
    const { register, control, handleSubmit, reset, setValue, formState: { isSubmitting, isDirty } } = useForm<Settings>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { updateAppearance } = useTheme();
    const [listingMode, setListingMode] = useState<'paginado' | 'scroll'>('paginado');
    const [paidTicketsVisibility, setPaidTicketsVisibility] = useState<'a_la_vista' | 'no_disponibles'>('a_la_vista');
    const [previewColors, setPreviewColors] = useState({
        primary: '#0ea5e9',
        accent: '#ec4899',
        background: '#111827',
        secondaryBackground: '#1f2937'
    });

    const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({ control, name: "paymentAccounts" });
    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faqs" });

    useEffect(() => {
        getSettings().then(data => {
            // Inicializar preview de colores
            if (data.appearance?.colors) {
                setPreviewColors({
                    primary: data.appearance.colors.action || '#0ea5e9',
                    accent: data.appearance.colors.accent || '#ec4899',
                    background: data.appearance.colors.backgroundPrimary || '#111827',
                    secondaryBackground: data.appearance.colors.backgroundSecondary || '#1f2937'
                });
            }

            // Inicializar preferencias visuales - parsear si viene como string JSON
            let displayPrefs = data.displayPreferences;
            if (typeof displayPrefs === 'string') {
                try {
                    displayPrefs = JSON.parse(displayPrefs);
                } catch (e) {
                    console.error('Error parsing displayPreferences:', e);
                    displayPrefs = null;
                }
            }

            if (displayPrefs) {
                const listing = displayPrefs.listingMode || 'paginado';
                const visibility = displayPrefs.paidTicketsVisibility || 'a_la_vista';
                setListingMode(listing);
                setPaidTicketsVisibility(visibility);
                // Actualizar el formulario con los valores correctos
                setValue('displayPreferences', {
                    listingMode: listing,
                    paidTicketsVisibility: visibility
                });
            } else {
                // Valores por defecto si no existen
                setListingMode('paginado');
                setPaidTicketsVisibility('a_la_vista');
                setValue('displayPreferences', {
                    listingMode: 'paginado',
                    paidTicketsVisibility: 'a_la_vista'
                });
            }

            // Reset del formulario con datos parseados
            reset({
                ...data,
                displayPreferences: displayPrefs || {
                    listingMode: 'paginado',
                    paidTicketsVisibility: 'a_la_vista'
                }
            });
            setLoading(false);
        }).catch(error => {
            console.error('Error loading settings:', error);
            setLoading(false);
        });
    }, [reset, setValue]);

    const handleColorChange = (colors: {
        primary: string;
        accent: string;
        background: string;
        secondaryBackground: string;
    }) => {
        setPreviewColors(colors);
        // Aplicar cambios en tiempo real
        updateAppearance({
            siteName: 'Lucky Snap',
            logoAnimation: 'rotate',
            colors: {
                backgroundPrimary: colors.background,
                backgroundSecondary: colors.secondaryBackground,
                accent: colors.accent,
                action: colors.primary
            }
        });
    };

    const handlePresetSelect = (preset: any) => {
        setPreviewColors(preset.colors);
        // Actualizar el formulario
        reset({
            ...reset,
            appearance: {
                ...reset.appearance,
                colors: {
                    backgroundPrimary: preset.colors.background,
                    backgroundSecondary: preset.colors.secondaryBackground,
                    accent: preset.colors.accent,
                    action: preset.colors.primary
                }
            }
        });
        handleColorChange(preset.colors);
    };
    
    const onSubmit = async (data: Settings) => {
        setSaving(true);
        try {
            console.log('🔧 Saving settings:', data);
            
            // Usar valores del formulario o estado local como fallback
            const formDisplayPrefs = data.displayPreferences || {
                listingMode,
                paidTicketsVisibility,
            };
            
            // Validate data before sending
            const validatedData = {
                ...data,
                displayPreferences: formDisplayPrefs,
                appearance: {
                    ...data.appearance,
                    colors: {
                        backgroundPrimary: data.appearance?.colors?.backgroundPrimary || '#111827',
                        backgroundSecondary: data.appearance?.colors?.backgroundSecondary || '#1f2937',
                        accent: data.appearance?.colors?.accent || '#ec4899',
                        action: data.appearance?.colors?.action || '#0ea5e9',
                    }
                },
                contactInfo: {
                    whatsapp: data.contactInfo?.whatsapp || '',
                    email: data.contactInfo?.email || '',
                },
                socialLinks: {
                    facebookUrl: data.socialLinks?.facebookUrl || '',
                    instagramUrl: data.socialLinks?.instagramUrl || '',
                    tiktokUrl: data.socialLinks?.tiktokUrl || '',
                },
                paymentAccounts: data.paymentAccounts || [],
                faqs: data.faqs || [],
            };
            
            const result = await adminUpdateSettings(validatedData);
            console.log('✅ Settings saved successfully:', result);
            
            // Parsear displayPreferences si viene como string
            let resultDisplayPrefs = result.displayPreferences;
            if (typeof resultDisplayPrefs === 'string') {
                try {
                    resultDisplayPrefs = JSON.parse(resultDisplayPrefs);
                } catch (e) {
                    console.error('Error parsing displayPreferences from response:', e);
                    resultDisplayPrefs = formDisplayPrefs;
                }
            }
            
            // Actualizar estados locales desde la respuesta
            if (resultDisplayPrefs) {
                const listing = resultDisplayPrefs.listingMode || 'paginado';
                const visibility = resultDisplayPrefs.paidTicketsVisibility || 'a_la_vista';
                setListingMode(listing);
                setPaidTicketsVisibility(visibility);
            }
            
            // Reset del formulario con datos parseados
            reset({
                ...result,
                displayPreferences: resultDisplayPrefs || formDisplayPrefs
            });
            
            if (result.appearance) {
                console.log('🎨 Updating appearance in real-time...');
                updateAppearance(result.appearance);
            }
            
            // Show success message
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                            <p className="text-gray-600 mt-2">Personaliza la apariencia y configuración de tu plataforma</p>
                        </div>
                        <div className="flex space-x-3">
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
                    {/* Color Presets */}
                    <SimpleColorPresets onPresetSelect={handlePresetSelect} />

                    {/* Color Preview */}
                    <SimpleColorPreview
                        primaryColor={previewColors.primary}
                        accentColor={previewColors.accent}
                        backgroundColor={previewColors.background}
                        secondaryBackgroundColor={previewColors.secondaryBackground}
                    />

                    {/* Appearance Section */}
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

                            <div>
                                <label className={labelClasses}>Animación del Logo</label>
                                <select {...register('appearance.logoAnimation')} className={inputClasses}>
                                    <option value="rotate">Rotación</option>
                                    <option value="pulse">Pulso</option>
                                    <option value="bounce">Rebote</option>
                                    <option value="none">Ninguna</option>
                                </select>
                            </div>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* Colors Section */}
                    <OptimizedSectionWrapper
                        title="Colores Personalizados"
                        icon={Palette}
                        description="Personaliza los colores de tu plataforma"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>Color Primario</label>
                                <input 
                                    type="color" 
                                    {...register('appearance.colors.action')} 
                                    className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                                    onChange={(e) => {
                                        const newColors = { ...previewColors, primary: e.target.value };
                                        setPreviewColors(newColors);
                                        handleColorChange(newColors);
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Color principal para botones y elementos destacados</p>
                            </div>
                            
                            <div>
                                <label className={labelClasses}>Color de Acento</label>
                                <input 
                                    type="color" 
                                    {...register('appearance.colors.accent')} 
                                    className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                                    onChange={(e) => {
                                        const newColors = { ...previewColors, accent: e.target.value };
                                        setPreviewColors(newColors);
                                        handleColorChange(newColors);
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Color secundario para elementos especiales</p>
                            </div>
                            
                            <div>
                                <label className={labelClasses}>Color de Fondo Principal</label>
                                <input 
                                    type="color" 
                                    {...register('appearance.colors.backgroundPrimary')} 
                                    className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                                    onChange={(e) => {
                                        const newColors = { ...previewColors, background: e.target.value };
                                        setPreviewColors(newColors);
                                        handleColorChange(newColors);
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Color de fondo principal de la página</p>
                            </div>
                            
                            <div>
                                <label className={labelClasses}>Color de Fondo Secundario</label>
                                <input 
                                    type="color" 
                                    {...register('appearance.colors.backgroundSecondary')} 
                                    className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                                    onChange={(e) => {
                                        const newColors = { ...previewColors, secondaryBackground: e.target.value };
                                        setPreviewColors(newColors);
                                        handleColorChange(newColors);
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Color de fondo para secciones y cards</p>
                            </div>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* Contact Info Section */}
                    <OptimizedSectionWrapper
                        title="Información de Contacto"
                        icon={Globe}
                        description="Configura la información de contacto visible en tu sitio"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>WhatsApp</label>
                                <input {...register('contactInfo.whatsapp')} className={inputClasses} placeholder="+50499999999" />
                            </div>
                            <div>
                                <label className={labelClasses}>Email</label>
                                <input {...register('contactInfo.email')} className={inputClasses} placeholder="contacto@ejemplo.com" />
                            </div>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* Social Links Section */}
                    <OptimizedSectionWrapper
                        title="Redes Sociales"
                        icon={Globe}
                        description="Configura los enlaces a tus redes sociales"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClasses}>Facebook</label>
                                <input {...register('socialLinks.facebookUrl')} className={inputClasses} placeholder="https://facebook.com/tu-pagina" />
                            </div>
                            <div>
                                <label className={labelClasses}>Instagram</label>
                                <input {...register('socialLinks.instagramUrl')} className={inputClasses} placeholder="https://instagram.com/tu-perfil" />
                            </div>
                            <div>
                                <label className={labelClasses}>TikTok</label>
                                <input {...register('socialLinks.tiktokUrl')} className={inputClasses} placeholder="https://tiktok.com/@tu-perfil" />
                            </div>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* Listados y Boletos - SOLO VISUAL (sin lógica aún) */}
                    <OptimizedSectionWrapper
                        title="Listados y Boletos"
                        icon={Eye}
                        description="Configura cómo se muestran los números y los boletos pagados"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Modo de listado de números */}
                            <div>
                                <label className={labelClasses}>Listado de números</label>
                                <div className="inline-flex rounded-xl overflow-hidden border border-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setListingMode('paginado');
                                            setValue('displayPreferences.listingMode', 'paginado', { shouldDirty: true });
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${listingMode === 'paginado' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Por página
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setListingMode('scroll');
                                            setValue('displayPreferences.listingMode', 'scroll', { shouldDirty: true });
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${listingMode === 'scroll' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Hacia abajo
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Selecciona si el listado usa paginación o desplazamiento continuo.</p>
                            </div>

                            {/* Visibilidad de boletos pagados */}
                            <div>
                                <label className={labelClasses}>Boletos pagados</label>
                                <div className="inline-flex rounded-xl overflow-hidden border border-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaidTicketsVisibility('a_la_vista');
                                            setValue('displayPreferences.paidTicketsVisibility', 'a_la_vista', { shouldDirty: true });
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${paidTicketsVisibility === 'a_la_vista' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        A la vista
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaidTicketsVisibility('no_disponibles');
                                            setValue('displayPreferences.paidTicketsVisibility', 'no_disponibles', { shouldDirty: true });
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${paidTicketsVisibility === 'no_disponibles' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        No disponibles
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Elige si se muestran o se deshabilitan los boletos ya pagados.</p>
                            </div>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* Payment Accounts Section */}
                    <OptimizedSectionWrapper
                        title="Cuentas de Pago"
                        icon={CreditCard}
                        description="Configura las cuentas donde los usuarios pueden realizar pagos"
                    >
                        <div className="space-y-4">
                            {paymentFields.map((field, index) => (
                                <div key={field.id} className="p-4 border border-gray-200 rounded-xl">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClasses}>Nombre del Banco</label>
                                            <input {...register(`paymentAccounts.${index}.bank`)} className={inputClasses} placeholder="Banco Atlántida" />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Número de Cuenta</label>
                                            <input {...register(`paymentAccounts.${index}.accountNumber`)} className={inputClasses} placeholder="1234567890" />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Nombre del Titular</label>
                                            <input {...register(`paymentAccounts.${index}.accountHolder`)} className={inputClasses} placeholder="Juan Pérez" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePayment(index)}
                                        className="mt-3 flex items-center space-x-2 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => appendPayment({ bank: '', accountNumber: '', accountHolder: '' })}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Agregar Cuenta de Pago</span>
                            </button>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* FAQs Section */}
                    <OptimizedSectionWrapper
                        title="Preguntas Frecuentes"
                        icon={HelpCircle}
                        description="Configura las preguntas frecuentes que aparecerán en tu sitio"
                    >
                        <div className="space-y-4">
                            {faqFields.map((field, index) => (
                                <div key={field.id} className="p-4 border border-gray-200 rounded-xl">
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClasses}>Pregunta</label>
                                            <input {...register(`faqs.${index}.question`)} className={inputClasses} placeholder="¿Cómo funciona el sistema?" />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Respuesta</label>
                                            <textarea {...register(`faqs.${index}.answer`)} className={inputClasses} rows={3} placeholder="El sistema funciona de la siguiente manera..." />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFaq(index)}
                                        className="mt-3 flex items-center space-x-2 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => appendFaq({ question: '', answer: '' })}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Agregar Pregunta Frecuente</span>
                            </button>
                        </div>
                    </OptimizedSectionWrapper>

                    {/* Save Button */}
                    <div className="flex justify-end space-x-4 pt-6">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || saving}
                            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Guardar Configuración</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettingsPage;