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
    email: string;
    district: string;
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
                setPaymentAccounts(settingsData.paymentAccounts);
                setContactWhatsapp(settingsData.contactInfo.whatsapp);
            })
            .catch(err => {
                console.error('❌ Error loading raffle for purchase:', err);
            })
            .finally(() => setLoading(false));
        }
    }, [slug]);

    const pricePerTicket = raffle?.packs.find(p => p.tickets === 1 || p.q === 1)?.price || 0;
    const total = initialTickets.length * pricePerTicket;

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
                email: data.email || '',
                district: data.district
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
                <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
                    <h1 className="text-3xl font-bold text-accent mb-4">¡Tu Apartado ha sido Creado!</h1>
                    <p className="text-slate-300 mb-8">Utiliza el siguiente folio como concepto de pago al realizar tu transferencia.</p>
                     <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 mb-8">
                        <p className="text-slate-400 text-sm">Folio / Concepto de Pago</p>
                        <p className="text-4xl font-mono text-white tracking-widest">{createdOrder.folio}</p>
                    </div>
                    
                    <div className="text-left mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">Cuentas para Realizar tu Pago</h2>
                         <div className="space-y-4">
                            {paymentAccounts.map(acc => (
                                <div key={acc.id} className="bg-background-secondary p-4 rounded-lg text-sm">
                                    <p className="font-bold text-white">{acc.bank}</p>
                                    <p><span className="text-slate-400">Titular:</span> {acc.accountHolder}</p>
                                    <p><span className="text-slate-400">CLABE:</span> {acc.clabe}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <a 
                        href={`https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=Hola!%20Quiero%20enviar%20mi%20comprobante%20para%20el%20folio%20${createdOrder.folio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full text-center bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                    >
                       Enviar Comprobante de Pago
                    </a>
                </div>
            </PageAnimator>
        );
    }
    
    return (
        <PageAnimator>
             <div className="container mx-auto px-4 py-12 max-w-2xl">
                <h1 className="text-3xl font-bold text-center text-white mb-2">Confirmar Compra</h1>
                <p className="text-center text-slate-300 mb-8">Estás a un paso de apartar tus boletos para: {raffle.title}</p>
                 <div className="bg-background-secondary p-4 md:p-8 rounded-lg border border-slate-700/50 shadow-lg">
                    <RaffleGallery 
                        images={(() => {
                            // Priorizar galería si existe, sino usar heroImage, sino imagen por defecto
                            if (raffle.gallery && raffle.gallery.length > 0) {
                                console.log('🖼️ Using gallery images:', raffle.gallery.length);
                                return raffle.gallery;
                            } else if (raffle.heroImage) {
                                console.log('🖼️ Using heroImage:', raffle.heroImage.substring(0, 50) + '...');
                                return [raffle.heroImage];
                            } else {
                                console.log('🖼️ Using default image');
                                return ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'];
                            }
                        })()}
                        title={raffle.title}
                        className="w-full max-w-md mx-auto mb-6"
                    />
                    <div className="mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3">Boletos Seleccionados</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {initialTickets.map(t => <span key={t} className="bg-background-primary px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-mono">{t}</span>)}
                        </div>
                        <div className="bg-background-primary rounded-lg p-4 border border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300">Precio por boleto:</span>
                                <span className="text-accent font-bold">LPS {pricePerTicket.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300">Cantidad:</span>
                                <span className="text-white font-bold">{initialTickets.length} boleto(s)</span>
                            </div>
                            <div className="border-t border-slate-700/50 pt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-bold text-lg">Total:</span>
                                    <span className="text-accent font-bold text-xl">LPS {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <h3 className="text-base md:text-lg font-bold text-white border-t border-slate-700/50 pt-4 md:pt-6">Completa tus datos</h3>
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white mb-1">Nombre Completo</label>
                            <input id="name" {...register('name', { required: 'El nombre es requerido' })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 md:py-2 px-3 text-white focus:ring-accent focus:border-accent text-base" />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">Teléfono (8 dígitos)</label>
                            <input id="phone" type="tel" {...register('phone', { required: 'El teléfono es requerido', pattern: {value: /^\d{8}$/, message: 'Ingresa un teléfono válido de 8 dígitos' } })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 md:py-2 px-3 text-white focus:ring-accent focus:border-accent text-base" />
                            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">Email (opcional)</label>
                            <input id="email" type="email" {...register('email', { pattern: {value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresa un email válido' } })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 md:py-2 px-3 text-white focus:ring-accent focus:border-accent text-base" />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="district" className="block text-sm font-medium text-white mb-1">Distrito</label>
                            <input id="district" {...register('district', { required: 'El distrito es requerido' })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 md:py-2 px-3 text-white focus:ring-accent focus:border-accent text-base" />
                            {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district.message}</p>}
                        </div>
                         <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-700 text-center">
                            <button type="submit" disabled={isSubmitting || initialTickets.length === 0} className="w-full bg-action text-white font-bold py-4 md:py-3 px-6 md:px-12 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-base md:text-base">
                                {isSubmitting ? 'Apartando...' : `Generar Folio para Pagar - LPS ${total.toFixed(2)}`}
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        </PageAnimator>
    );
};

export default PurchasePage;