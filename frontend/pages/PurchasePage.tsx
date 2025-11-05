import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getRaffleBySlug, createOrder, getSettings, getOccupiedTickets } from '../services/api';
import { Raffle, Order, PaymentAccount, Pack } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import BonusesCard from '../components/BonusesCard';
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
    const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
    const [assignedPackTickets, setAssignedPackTickets] = useState<number[]>([]);
    const [occupiedTickets, setOccupiedTickets] = useState<number[]>([]);
    
    const initialTickets = searchParams.get('tickets')?.split(',').map(Number).filter(n => !isNaN(n)) || [];
    const selectedPackName = searchParams.get('pack');
    const packQuantity = parseInt(searchParams.get('quantity') || '1', 10);

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
    
    // Función para formatear el mensaje de WhatsApp
    const formatWhatsAppMessage = (
        customerName: string,
        customerPhone: string,
        folio: string,
        raffleTitle: string,
        tickets: number[],
        total: number
    ): string => {
        // Formatear lista de boletos (mostrar máximo 10, luego "y X más")
        const formatTickets = (tickets: number[]): string => {
            if (tickets.length === 0) return 'N/A';
            if (tickets.length <= 10) {
                return tickets.join(', ');
            }
            return `${tickets.slice(0, 10).join(', ')} y ${tickets.length - 10} más`;
        };

        const ticketsText = formatTickets(tickets);
        const totalFormatted = total.toFixed(2);

        return `Hola! 👋

Acabo de realizar mi pago y quiero enviarte mi comprobante para confirmar mi apartado.

📋 *Mis datos:*
• Nombre: ${customerName}
• Teléfono: ${customerPhone}
• Folio: *${folio}*

🎫 *Información del apartado:*
• Rifa: ${raffleTitle}
• Boletos: ${ticketsText}
• Total pagado: L. ${totalFormatted}

Adjunto el comprobante de pago. Gracias! 🙏`;
    };
    
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
                
                // Cargar boletos ocupados para poder asignar los disponibles
                if (raffleData?.id) {
                    getOccupiedTickets(raffleData.id).then(occupied => {
                        setOccupiedTickets(occupied || []);
                    }).catch(err => {
                        console.error('❌ Error loading occupied tickets:', err);
                        setOccupiedTickets([]);
                    });
                }
            })
            .catch(err => {
                console.error('❌ Error loading raffle for purchase:', err);
            })
            .finally(() => setLoading(false));
        }
    }, [slug]);

    // Determinar si se está usando un paquete o boletos individuales
    const selectedPack = useMemo(() => {
        if (!raffle || !selectedPackName || !raffle.packs) return null;
        return raffle.packs.find(p => (p.name || '').toLowerCase() === selectedPackName.toLowerCase()) || null;
    }, [raffle, selectedPackName]);
    
    // Calcular y asignar boletos cuando hay un paquete seleccionado
    useEffect(() => {
        if (selectedPack && raffle && occupiedTickets.length >= 0) {
            const ticketsInPack = (selectedPack.tickets || selectedPack.q || 1) * packQuantity;
            const totalTickets = raffle.tickets || 1000;
            
            // Generar todos los números de boletos posibles (1 a totalTickets)
            const allTickets = Array.from({ length: totalTickets }, (_, i) => i + 1);
            
            // Filtrar solo los disponibles (no ocupados)
            const availableTickets = allTickets.filter(ticket => !occupiedTickets.includes(ticket));
            
            // Asignar los primeros N boletos disponibles
            const assigned = availableTickets.slice(0, ticketsInPack);
            setAssignedPackTickets(assigned);
            
            console.log('🎫 Assigned pack tickets:', {
                pack: selectedPack.name,
                quantity: packQuantity,
                ticketsNeeded: ticketsInPack,
                occupiedCount: occupiedTickets.length,
                availableCount: availableTickets.length,
                assigned: assigned
            });
        } else {
            setAssignedPackTickets([]);
        }
    }, [selectedPack, packQuantity, raffle, occupiedTickets]);

    // Usar el precio base del esquema Prisma (no packs)
    const pricePerTicket = raffle?.price || raffle?.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
    
    // Detectar si la selección manual coincide con algún paquete
    const matchedPack = useMemo(() => {
        if (selectedPack || initialTickets.length === 0 || !raffle?.packs) return null;
        
        // Buscar un paquete que coincida con la cantidad de boletos seleccionados
        const matchingPack = raffle.packs.find(pack => {
            const packTicketCount = pack.tickets || pack.q || 1;
            return packTicketCount === initialTickets.length;
        });
        
        return matchingPack || null;
    }, [selectedPack, initialTickets.length, raffle?.packs]);

    // Calcular total según si hay paquete o boletos individuales
    const total = useMemo(() => {
        if (selectedPack) {
            return selectedPack.price * packQuantity;
        }
        
        // Si la selección manual coincide con un paquete, aplicar su precio
        if (matchedPack) {
            return matchedPack.price;
        }
        
        return initialTickets.length * pricePerTicket;
    }, [selectedPack, packQuantity, initialTickets.length, pricePerTicket, matchedPack]);
    
    // Calcular ahorro si se aplicó un paquete automáticamente
    const savingsFromPack = useMemo(() => {
        if (!matchedPack || selectedPack) return 0;
        const individualPrice = initialTickets.length * pricePerTicket;
        return individualPrice - matchedPack.price;
    }, [matchedPack, initialTickets.length, pricePerTicket, selectedPack]);
    
    // Calcular boletos de regalo si tiene oportunidades
    const boletosAdicionales = useMemo(() => {
        if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
        if (selectedPack) {
            const ticketsInPack = (selectedPack.tickets || selectedPack.q || 1) * packQuantity;
            return ticketsInPack * (raffle.numeroOportunidades - 1);
        }
        return initialTickets.length * (raffle.numeroOportunidades - 1);
    }, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, initialTickets.length, selectedPack, packQuantity]);

    const onSubmit = async (data: FormData) => {
        if (!raffle || (initialTickets.length === 0 && !selectedPack)) return;
        setIsSubmitting(true);
        try {
            // Determinar tickets según si hay paquete o boletos individuales
            let ticketsToOrder: number[] = [];
            let orderNotes = '';
            
            if (selectedPack) {
                // Usar los boletos asignados previamente
                ticketsToOrder = assignedPackTickets;
                const ticketsInPack = assignedPackTickets.length;
                orderNotes = `Compra de ${packQuantity} paquete(s) "${selectedPack.name || 'Pack'}" (${ticketsInPack} boletos) para ${raffle.title}`;
            } else {
                ticketsToOrder = initialTickets;
                orderNotes = `Compra de ${initialTickets.length} boleto(s) para ${raffle.title}`;
            }
            
            // Track InitiateCheckout event
            metaPixelService.trackInitiateCheckout(raffle.id, ticketsToOrder, total);

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
                tickets: ticketsToOrder,
                total: total,
                paymentMethod: 'transfer',
                notes: orderNotes,
                // Datos del usuario para crear en el backend
                userData: userData
            };
            console.log('🛒 Creating order with data:', orderData);
            const newOrder = await createOrder(orderData);
            console.log('✅ Order created successfully:', newOrder);
            
            // Track Purchase event
            metaPixelService.trackPurchase(newOrder.id, raffle.id, ticketsToOrder, total);
            
            // Guardar datos del cliente para el mensaje de WhatsApp
            setCustomerData({
                name: data.name,
                phone: data.phone
            });
            
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
                                    {paymentAccounts.map(acc => {
                                        const copyAccountNumber = () => {
                                            if (acc.accountNumber) {
                                                navigator.clipboard.writeText(acc.accountNumber).then(() => {
                                                    alert('Número de cuenta copiado al portapapeles');
                                                });
                                            }
                                        };
                                        
                                        return (
                                            <div key={acc.id} className="bg-background-primary p-4 rounded-xl border border-slate-700/50">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-bold text-white">{acc.bank}</h4>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Titular:</span>
                                                        <span className="text-white font-semibold">{acc.accountHolder}</span>
                                                    </div>
                                                    {acc.accountNumber && (
                                                        <div 
                                                            className="flex justify-between cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
                                                            onClick={copyAccountNumber}
                                                            title="Click para copiar"
                                                        >
                                                            <span className="text-slate-400">No. Cuenta:</span>
                                                            <span className="text-white font-mono hover:text-accent transition-colors">
                                                                {acc.accountNumber} 📋
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Botón de WhatsApp */}
                            <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                                <h4 className="text-lg font-bold text-white mb-4">Enviar Comprobante</h4>
                                <p className="text-slate-300 text-sm mb-4">
                                    Una vez realizado el pago, envía tu comprobante por WhatsApp para confirmar tu apartado.
                                </p>
                                
                                {(() => {
                                    // Obtener datos del cliente (de customerData o de createdOrder)
                                    const customerName = customerData?.name || (createdOrder as any)?.customer?.name || 'Cliente';
                                    const customerPhone = customerData?.phone || (createdOrder as any)?.customer?.phone || '';
                                    const orderTickets = createdOrder?.tickets || initialTickets;
                                    const orderTotal = createdOrder?.total || createdOrder?.totalAmount || total;
                                    
                                    // Generar mensaje de WhatsApp con toda la información
                                    const whatsappMessage = formatWhatsAppMessage(
                                        customerName,
                                        customerPhone,
                                        createdOrder?.folio || '',
                                        raffle?.title || '',
                                        orderTickets,
                                        orderTotal
                                    );
                                    
                                    const whatsappUrl = `https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
                                    
                                    return (
                                        <a 
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                            </svg>
                                            Enviar por WhatsApp
                                        </a>
                                    );
                                })()}
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
                            
                            {/* Imagen principal (sin galería rotativa) */}
                            <div className="mb-6 relative z-0">
                                <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-xl border-2 border-slate-700/50">
                                    <img 
                                        src={raffle.imageUrl || raffle.heroImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                        alt={raffle.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                        }}
                                    />
                                </div>
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

                        {/* Bonos y Premios Adicionales */}
                        <BonusesCard bonuses={raffle.bonuses || []} className="mb-6" />

                        {/* Boletos seleccionados */}
                        <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Tus Boletos
                            </h3>
                            
                            {/* Boletos comprados o paquete seleccionado */}
                            {selectedPack ? (
                                <div className="mb-4">
                                    <div className="bg-gradient-to-r from-accent to-action px-4 py-3 rounded-xl mb-3">
                                        <p className="text-white font-bold text-lg">{selectedPack.name || `Pack de ${selectedPack.tickets || selectedPack.q || 1} boletos`}</p>
                                        <p className="text-white/80 text-sm">Cantidad: {packQuantity} paquete(s)</p>
                                        <p className="text-white/80 text-sm">Total de boletos: {(selectedPack.tickets || selectedPack.q || 1) * packQuantity}</p>
                                    </div>
                                    {/* Mostrar los boletos asignados */}
                                    {assignedPackTickets.length > 0 ? (
                                        <div className="mb-4">
                                            <h4 className="text-white font-semibold mb-2 text-sm">Tus boletos asignados:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {assignedPackTickets.map(t => (
                                                    <span key={t} className="bg-gradient-to-r from-accent to-action px-3 py-2 rounded-full text-sm font-bold text-white shadow-lg">
                                                        #{t.toString().padStart(3, '0')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4">
                                            <p className="text-slate-400 text-sm">Calculando boletos disponibles...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {initialTickets.map(t => (
                                            <span key={t} className="bg-gradient-to-r from-accent to-action px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg">
                                                #{t.toString().padStart(3, '0')}
                                            </span>
                                        ))}
                                    </div>
                                    {/* Mostrar si se aplicó un paquete automáticamente */}
                                    {matchedPack && savingsFromPack > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-gradient-to-r from-green-900/30 to-green-800/30 border-2 border-green-500/50 rounded-xl p-3"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-green-400 font-semibold text-sm flex items-center">
                                                    <span className="mr-2">🎁</span>
                                                    Descuento de Paquete Aplicado
                                                </span>
                                                <span className="text-green-400 font-bold text-sm">
                                                    -LPS {savingsFromPack.toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-green-300 text-xs">
                                                {matchedPack.name || `Pack de ${matchedPack.tickets || matchedPack.q || 1} boletos`} aplicado automáticamente
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                            
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
                                {selectedPack ? (
                                    <>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-slate-300">Paquete:</span>
                                            <span className="text-white font-bold text-lg">{selectedPack.name || `Pack de ${selectedPack.tickets || selectedPack.q || 1} boletos`}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-slate-300">Cantidad de paquetes:</span>
                                            <span className="text-white font-bold text-lg">{packQuantity}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-slate-300">Total de boletos:</span>
                                            <span className="text-white font-bold text-lg">{(selectedPack.tickets || selectedPack.q || 1) * packQuantity}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-slate-300">Cantidad de boletos:</span>
                                            <span className="text-white font-bold text-lg">{initialTickets.length}</span>
                                        </div>
                                        {matchedPack && savingsFromPack > 0 && (
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-green-400">Descuento aplicado:</span>
                                                <span className="text-green-400 font-bold">-LPS {savingsFromPack.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {!matchedPack && (
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-slate-300">Precio unitario:</span>
                                                <span className="text-accent font-bold">LPS {pricePerTicket.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {boletosAdicionales > 0 && (
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-green-400">Boletos de regalo:</span>
                                        <span className="text-green-400 font-bold">+ {boletosAdicionales}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-700/50 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-xl">Total a pagar:</span>
                                        <span className="text-accent font-bold text-2xl">LPS {total.toFixed(2)}</span>
                                    </div>
                                    {matchedPack && savingsFromPack > 0 && (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-green-400 text-sm">Ahorro:</span>
                                            <span className="text-green-400 font-bold text-sm">LPS {savingsFromPack.toFixed(2)}</span>
                                        </div>
                                    )}
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
                                        disabled={isSubmitting || (initialTickets.length === 0 && !selectedPack)} 
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