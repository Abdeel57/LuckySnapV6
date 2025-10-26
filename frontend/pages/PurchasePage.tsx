import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getRaffleBySlug, createOrder, getSettings } from '../services/api';
import { Raffle, Order, PaymentAccount } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import RaffleGallery from '../components/RaffleGallery';
import { Link } from 'react-router-dom';
import metaPixelService from '../services/metaPixel';

type FormData = {
    name: string;
    phone: string;
    department: string;
};

const PurchasePage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
    const [contactWhatsapp, setContactWhatsapp] = useState('');
    
    const initialTickets = searchParams.get('tickets')?.split(',').map(Number).filter(n => !isNaN(n)) || [];

    // Lista de departamentos de Honduras
    const honduranDepartments = [
        'Atlántida',
        'Choluteca',
        'Colón',
        'Comayagua',
        'Copán',
        'Cortés',
        'El Paraíso',
        'Francisco Morazán',
        'Gracias a Dios',
        'Intibucá',
        'Islas de la Bahía',
        'La Paz',
        'Lempira',
        'Ocotepeque',
        'Olancho',
        'Santa Bárbara',
        'Valle',
        'Yoro'
    ];

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    
    useEffect(() => {
        if (slug) {
            setLoading(true);
            console.log('🛒 Loading raffle for purchase:', slug);
            Promise.all([getRaffleBySlug(slug), getSettings()])
            .then(([raffleData, settingsData]) => {
            console.log('🛒 Raffle data loaded:', {
                id: raffleData?.id,
                title: raffleData?.title,
                slug: raffleData?.slug,
                hasHeroImage: !!raffleData?.heroImage,
                heroImageLength: raffleData?.heroImage?.length || 0,
                heroImagePreview: raffleData?.heroImage?.substring(0, 50) + '...' || 'NO_IMAGE',
                galleryCount: raffleData?.gallery?.length || 0,
                galleryImages: raffleData?.gallery?.map((img, i) => ({
                    index: i,
                    hasImage: !!img,
                    length: img ? img.length : 0,
                    preview: img ? img.substring(0, 30) + '...' : 'NO_IMAGE'
                })) || []
            });
                setRaffle(raffleData || null);
                setPaymentAccounts(settingsData.paymentAccounts || []);
                // Usar número por defecto si no existe contactInfo
                setContactWhatsapp(settingsData.contactInfo?.whatsapp || '50400000000');
            })
            .catch(err => {
                console.error('❌ Error loading raffle for purchase:', err);
            })
            .finally(() => setLoading(false));
        }
    }, [slug]);

    // Usar el precio base del esquema Prisma (no packs)
    const pricePerTicket = raffle?.price || raffle?.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
    const total = initialTickets.length * pricePerTicket;
    
    // Calcular boletos de regalo si tiene oportunidades
    const boletosAdicionales = raffle?.boletosConOportunidades && raffle?.numeroOportunidades > 1
        ? initialTickets.length * (raffle.numeroOportunidades - 1)
        : 0;

    const onSubmit = async (data: FormData) => {
        if (!raffle || initialTickets.length === 0) return;
        setIsSubmitting(true);
        try {
            // Track InitiateCheckout event
            metaPixelService.trackInitiateCheckout(raffle.id, initialTickets, total);

            // Primero crear o buscar el usuario
            const userData = {
                name: data.name,
                phone: data.phone,
                email: '',
                district: data.department
            };
            
            // Crear usuario temporal (en una app real esto sería más complejo)
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const orderData = {
                userId: userId,
                raffleId: raffle.id,
                tickets: initialTickets,
                total: total,
                paymentMethod: 'transfer',
                notes: `Compra de ${initialTickets.length} boleto(s) para ${raffle.title}`,
                // Datos del usuario para crear en el backend
                userData: userData
            };
            console.log('🛒 Creating order with data:', orderData);
            const newOrder = await createOrder(orderData);
            console.log('✅ Order created successfully:', newOrder);
            
            // Track Purchase event
            metaPixelService.trackPurchase(newOrder.id, raffle.id, initialTickets, total);
            
            setCreatedOrder(newOrder);
        } catch (err) {
            console.error('❌ Error creating order:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`Hubo un error al crear tu apartado: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="w-full h-screen flex items-center justify-center bg-background-primary"><Spinner /></div>;
    if (!raffle) return <PageAnimator><div className="text-center py-20"><h2 className="text-2xl text-white">Sorteo no encontrado.</h2></div></PageAnimator>;

    if (createdOrder) {
        return (
            <PageAnimator>
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    {/* Header de éxito */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4">¡Apartado Creado Exitosamente!</h1>
                        <p className="text-slate-300 text-lg">Tu folio ha sido generado. Realiza el pago usando la información a continuación.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Columna izquierda - Información del folio */}
                        <div className="space-y-6">
                            {/* Folio destacado */}
                            <div className="bg-gradient-to-br from-background-secondary to-background-primary p-8 rounded-2xl border border-slate-700/50 shadow-xl text-center">
                                <h2 className="text-xl font-bold text-white mb-4">Tu Folio de Pago</h2>
                                <div className="bg-background-primary p-6 rounded-xl border border-slate-700/50 mb-4">
                                    <p className="text-slate-400 text-sm mb-2">Concepto de Pago</p>
                                    <p className="text-5xl font-mono text-accent tracking-widest font-bold">{createdOrder.folio}</p>
                                </div>
                                <p className="text-slate-300 text-sm">Usa este folio como concepto al realizar tu transferencia</p>
                            </div>

                            {/* Información del pedido */}
                            <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Detalles del Pedido
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Sorteo:</span>
                                        <span className="text-white font-semibold">{raffle.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Boletos:</span>
                                        <span className="text-white font-semibold">{initialTickets.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Total:</span>
                                        <span className="text-accent font-bold text-lg">LPS {total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Estado:</span>
                                        <span className="text-yellow-400 font-semibold">Pendiente de Pago</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha - Información de pago */}
                        <div className="space-y-6">
                            {/* Cuentas de pago */}
                            <div className="bg-gradient-to-br from-background-secondary to-background-primary p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Cuentas para Transferencia
                                </h3>
                                
                                <div className="space-y-4">
                                    {paymentAccounts.map(acc => (
                                        <div key={acc.id} className="bg-background-primary p-4 rounded-xl border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-white">{acc.bank}</h4>
                                                <span className="bg-accent/20 text-accent px-2 py-1 rounded-full text-xs font-semibold">
                                                    {acc.type || 'Transferencia'}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Titular:</span>
                                                    <span className="text-white font-semibold">{acc.accountHolder}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">CLABE:</span>
                                                    <span className="text-white font-mono">{acc.clabe}</span>
                                                </div>
                                                {acc.accountNumber && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">No. Cuenta:</span>
                                                        <span className="text-white font-mono">{acc.accountNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Botón de WhatsApp */}
                            <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                                <h4 className="text-lg font-bold text-white mb-4">Enviar Comprobante</h4>
                                <p className="text-slate-300 text-sm mb-4">
                                    Una vez realizado el pago, envía tu comprobante por WhatsApp para confirmar tu apartado.
                                </p>
                                
                                <a 
                                    href={`https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=Hola!%20Quiero%20enviar%20mi%20comprobante%20para%20el%20folio%20${createdOrder.folio}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                    Enviar por WhatsApp
                                </a>
                            </div>

                            {/* Instrucciones */}
                            <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                                <h4 className="text-lg font-bold text-white mb-4">Instrucciones de Pago</h4>
                                <div className="space-y-3 text-sm text-slate-300">
                                    <div className="flex items-start">
                                        <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                                        <span>Realiza una transferencia bancaria por el monto exacto: <strong className="text-accent">LPS {total.toFixed(2)}</strong></span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                                        <span>Usa el folio <strong className="text-accent">{createdOrder.folio}</strong> como concepto de pago</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                                        <span>Envía tu comprobante por WhatsApp para confirmar</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                                        <span>Recibirás confirmación de tu apartado en minutos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageAnimator>
        );
    }
    
    return (
        <PageAnimator>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header mejorado */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-accent to-action rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Confirmar tu Compra</h1>
                    <p className="text-slate-300 text-lg">Estás a un paso de apartar tus boletos</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna izquierda - Información del producto */}
                    <div className="space-y-6">
                        {/* Información del sorteo */}
                        <div className="bg-gradient-to-br from-background-secondary to-background-primary p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                            <h2 className="text-2xl font-bold text-white mb-4">{raffle.title}</h2>
                            
                            {/* Galería mejorada */}
                            <div className="mb-6">
                                <RaffleGallery 
                                    images={(() => {
                                        // Priorizar imageUrl (campo real de Prisma), sino galería, sino heroImage
                                        if (raffle.imageUrl) {
                                            return [raffle.imageUrl];
                                        } else if (raffle.gallery && raffle.gallery.length > 0) {
                                            return raffle.gallery;
                                        } else if (raffle.heroImage) {
                                            return [raffle.heroImage];
                                        } else {
                                            return ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'];
                                        }
                                    })()}
                                    title={raffle.title}
                                    className="w-full h-64"
                                />
                            </div>

                            {/* Información del sorteo */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-background-primary/50 p-3 rounded-lg">
                                    <p className="text-slate-400">Fecha del sorteo</p>
                                    <p className="text-white font-semibold">
                                        {raffle.drawDate ? new Date(raffle.drawDate).toLocaleDateString('es-HN') : 'Por definir'}
                                    </p>
                                </div>
                                <div className="bg-background-primary/50 p-3 rounded-lg">
                                    <p className="text-slate-400">Precio por boleto</p>
                                    <p className="text-accent font-bold text-lg">LPS {pricePerTicket.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Boletos seleccionados */}
                        <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Tus Boletos
                            </h3>
                            
                            {/* Boletos comprados */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {initialTickets.map(t => (
                                    <span key={t} className="bg-gradient-to-r from-accent to-action px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg">
                                        #{t.toString().padStart(3, '0')}
                                    </span>
                                ))}
                            </div>
                            
                            {/* Boletos de regalo */}
                            {boletosAdicionales > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                                        <span className="mr-2">🎁</span>
                                        Boletos de Regalo ({boletosAdicionales})
                                    </h4>
                                    <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-3">
                                        <p className="text-green-300 text-sm">
                                            Recibirás {boletosAdicionales} boleto{boletosAdicionales > 1 ? 's' : ''} adicional{boletosAdicionales > 1 ? 'es' : ''} de regalo para aumentar tus probabilidades de ganar.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-background-primary rounded-xl p-4 border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-slate-300">Cantidad de boletos:</span>
                                    <span className="text-white font-bold text-lg">{initialTickets.length}</span>
                                </div>
                                {boletosAdicionales > 0 && (
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-green-400">Boletos de regalo:</span>
                                        <span className="text-green-400 font-bold">+ {boletosAdicionales}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-slate-300">Precio unitario:</span>
                                    <span className="text-accent font-bold">LPS {pricePerTicket.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-700/50 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-xl">Total a pagar:</span>
                                        <span className="text-accent font-bold text-2xl">LPS {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha - Formulario */}
                    <div className="space-y-6">
                        {/* Formulario mejorado */}
                        <div className="bg-gradient-to-br from-background-secondary to-background-primary p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información Personal
                            </h3>
                            
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                                        Nombre Completo *
                                    </label>
                                    <input 
                                        id="name" 
                                        {...register('name', { required: 'El nombre es requerido' })} 
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200" 
                                        placeholder="Tu nombre completo"
                                    />
                                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                                </div>
                                
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                                        Teléfono *
                                    </label>
                                    <input 
                                        id="phone" 
                                        type="tel" 
                                        {...register('phone', { 
                                            required: 'El teléfono es requerido', 
                                            pattern: {value: /^\d{8}$/, message: 'Ingresa un teléfono válido de 8 dígitos'} 
                                        })} 
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200" 
                                        placeholder="12345678"
                                    />
                                    {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>}
                                </div>
                                
                                <div>
                                    <label htmlFor="department" className="block text-sm font-medium text-white mb-2">
                                        Departamento *
                                    </label>
                                    <select 
                                        id="department" 
                                        {...register('department', { required: 'El departamento es requerido' })} 
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                                    >
                                        <option value="">Selecciona tu departamento</option>
                                        {honduranDepartments.map(dept => (
                                            <option key={dept} value={dept} className="bg-slate-800 text-white">
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department.message}</p>}
                                </div>
                                
                                {/* Botón mejorado */}
                                <div className="pt-6">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || initialTickets.length === 0} 
                                        className="w-full bg-gradient-to-r from-action to-accent text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generando folio...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                Generar Folio - LPS {total.toFixed(2)}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Elementos de confianza */}
                        <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                            <h4 className="text-lg font-bold text-white mb-4">¿Por qué elegirnos?</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-slate-300 text-sm">Transacciones 100% seguras</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-slate-300 text-sm">Confirmación inmediata</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                                    </svg>
                                    <span className="text-slate-300 text-sm">Soporte 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageAnimator>
    );
};

export default PurchasePage;