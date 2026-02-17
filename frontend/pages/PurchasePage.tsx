import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getRaffleBySlug, createOrder, getSettings, getOccupiedTickets } from '../services/api';
import { Raffle, Order, PaymentAccount, Pack } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import metaPixelService from '../services/metaPixel';
import PayPalCheckout from '../components/PayPalCheckout';

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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'transfer'>('paypal');
    const formRef = useRef<HTMLFormElement | null>(null);
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

        // Usar emojis Unicode directamente para asegurar compatibilidad
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

    /**
     * Codifica un mensaje para WhatsApp preservando correctamente los emojis
     * WhatsApp acepta emojis Unicode codificados en UTF-8
     * encodeURIComponent codifica correctamente los emojis si el string está en UTF-8
     */
    const encodeWhatsAppMessage = (message: string): string => {
        // encodeURIComponent debería codificar correctamente los emojis Unicode
        // Si los emojis aparecen como "?", puede ser un problema de codificación del archivo fuente
        // o del navegador. Esta función asegura que se codifique correctamente.
        
        // Normalizar el string para asegurar que los emojis estén en formato Unicode normalizado
        const normalized = message.normalize('NFC');
        
        // Codificar usando encodeURIComponent que maneja UTF-8 correctamente
        // Los emojis Unicode se codificarán como %F0%9F%... (formato UTF-8)
        const encoded = encodeURIComponent(normalized);
        
        return encoded;
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
                    getOccupiedTickets(raffleData.id).then(occupiedResponse => {
                        setOccupiedTickets(occupiedResponse.tickets || []);
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

    useEffect(() => {
        if (loading || createdOrder) return;
        const rafId = requestAnimationFrame(() => {
            formRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
        return () => cancelAnimationFrame(rafId);
    }, [loading, createdOrder, slug]);

    // Determinar si se está usando un paquete o boletos individuales
    const selectedPack = useMemo(() => {
        if (!raffle || !selectedPackName || !raffle.packs) return null;
        return raffle.packs.find(p => (p.name || '').toLowerCase() === selectedPackName.toLowerCase()) || null;
    }, [raffle, selectedPackName]);
    
    /**
     * Función para seleccionar N elementos aleatorios de un array sin repetir
     */
    const selectRandomElements = <T,>(array: T[], count: number): T[] => {
        if (count >= array.length) {
            return [...array]; // Devolver todos si se piden más de los disponibles
        }
        
        const shuffled = [...array]; // Copia para no modificar el original
        const selected: T[] = [];
        
        // Algoritmo Fisher-Yates para mezclar y seleccionar
        for (let i = 0; i < count && i < shuffled.length; i++) {
            // Generar índice aleatorio entre i y el final del array
            const randomIndex = i + Math.floor(Math.random() * (shuffled.length - i));
            
            // Intercambiar elementos
            [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
            
            // Agregar el elemento seleccionado
            selected.push(shuffled[i]);
        }
        
        return selected;
    };

    // Calcular y asignar boletos cuando hay un paquete seleccionado
    useEffect(() => {
        if (selectedPack && raffle && occupiedTickets.length >= 0) {
            const ticketsInPack = (selectedPack.tickets || selectedPack.q || 1) * packQuantity;
            const totalTickets = raffle.tickets || 1000;
            
            // Generar todos los números de boletos posibles (1 a totalTickets)
            const allTickets = Array.from({ length: totalTickets }, (_, i) => i + 1);
            
            // Filtrar solo los disponibles (no ocupados)
            const availableTickets = allTickets.filter(ticket => !occupiedTickets.includes(ticket));
            
            // Seleccionar boletos aleatorios en lugar de secuenciales
            const assigned = selectRandomElements(availableTickets, ticketsInPack);
            
            // Ordenar los boletos asignados para mostrarlos ordenados (opcional)
            assigned.sort((a, b) => a - b);
            
            setAssignedPackTickets(assigned);
            
            console.log('🎫 Assigned pack tickets (random):', {
                pack: selectedPack.name,
                quantity: packQuantity,
                ticketsNeeded: ticketsInPack,
                occupiedCount: occupiedTickets.length,
                availableCount: availableTickets.length,
                assigned: assigned,
                isRandom: true
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
    
    // Calcular boletos de regalo si tiene oportunidades
    const boletosAdicionales = useMemo(() => {
        if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
        if (selectedPack) {
            const ticketsInPack = (selectedPack.tickets || selectedPack.q || 1) * packQuantity;
            return ticketsInPack * (raffle.numeroOportunidades - 1);
        }
        return initialTickets.length * (raffle.numeroOportunidades - 1);
    }, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, initialTickets.length, selectedPack, packQuantity]);

    const baseTicketsCount = useMemo(() => {
        if (selectedPack) {
            return (selectedPack.tickets || selectedPack.q || 1) * packQuantity;
        }
        return initialTickets.length;
    }, [selectedPack, packQuantity, initialTickets.length]);

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
                paymentMethod: selectedPaymentMethod,
                notes: orderNotes,
                // Datos del usuario para crear en el backend
                userData: userData
            };
            console.log('🛒 Creating order with data:', orderData);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/2db1715e-cfcb-4080-ae03-a6764011ef8d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PurchasePage.tsx:328',message:'Creando orden con método de pago',data:{paymentMethod:orderData.paymentMethod,raffleId:orderData.raffleId,ticketsCount:orderData.tickets.length,total:orderData.total,userData:orderData.userData},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            const newOrder = await createOrder(orderData);
            console.log('✅ Order created successfully:', newOrder);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/2db1715e-cfcb-4080-ae03-a6764011ef8d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PurchasePage.tsx:330',message:'Orden creada exitosamente',data:{orderId:newOrder.id,folio:newOrder.folio,paymentMethod:(newOrder as any).paymentMethod,status:newOrder.status,hasCustomer:!!newOrder.customer},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
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
            alert(`Hubo un error al crear tu compra: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="w-full h-screen flex items-center justify-center bg-background-primary"><Spinner /></div>;
    if (!raffle) return <PageAnimator><div className="text-center py-20"><h2 className="text-2xl text-white">Sorteo no encontrado.</h2></div></PageAnimator>;

    if (createdOrder) {
        const orderPaymentMethod = (createdOrder as any).paymentMethod || selectedPaymentMethod;
        const isPaypalPayment = orderPaymentMethod === 'paypal';
        const orderTicketsCount = createdOrder.tickets?.length || baseTicketsCount;
        const orderTotal = createdOrder.total || total;
        
        // Calcular boletos adicionales: la orden ya contiene todos los boletos (comprados + regalo)
        // Si numeroOportunidades = 5, cada boleto comprado genera 4 de regalo
        // Total = boletosComprados * numeroOportunidades
        // Entonces: boletosRegalo = total * (numeroOportunidades - 1) / numeroOportunidades
        const orderGiftTickets = (raffle?.boletosConOportunidades && raffle.numeroOportunidades > 1)
            ? Math.floor(orderTicketsCount * (raffle.numeroOportunidades - 1) / raffle.numeroOportunidades)
            : 0;
        
        // Boletos comprados originalmente (sin regalos)
        const orderPurchasedTickets = orderTicketsCount - orderGiftTickets;

        return (
            <PageAnimator>
                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
                    {/* Header minimalista */}
                    <div className="text-center mb-8">
                        {createdOrder.status === 'PAID' ? (
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full mb-5 border border-green-500/30">
                                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        ) : (
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-action/20 to-accent/20 rounded-full mb-5 border border-action/30">
                                <svg className="w-10 h-10 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            {createdOrder.status === 'PAID' ? '¡Pago completado!' : 'Completa tu pago'}
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base">
                            {isPaypalPayment
                                ? 'Pago seguro procesado por PayPal'
                                : 'Realiza la transferencia y envía tu comprobante'}
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* Resumen de orden - diseño minimalista */}
                        <div className="bg-background-secondary/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-slate-700/30 shadow-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-5 border-b border-slate-700/30">
                                <div className="flex-1">
                                    <p className="text-slate-500 text-xs font-medium mb-1.5 uppercase tracking-wide">Folio de orden</p>
                                    <p className="text-white font-mono text-base sm:text-lg font-semibold">{createdOrder.folio}</p>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold w-fit ${
                                    createdOrder.status === 'PAID' 
                                        ? 'bg-green-500/15 text-green-400 border border-green-500/30' 
                                        : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                        createdOrder.status === 'PAID' ? 'bg-green-400' : 'bg-yellow-400'
                                    }`}></span>
                                    {createdOrder.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Boletos</p>
                                    <p className="text-white font-semibold text-lg sm:text-xl">
                                        {orderPurchasedTickets}
                                        {orderGiftTickets > 0 && (
                                            <span className="text-accent ml-1.5 text-base">
                                                +{orderGiftTickets} regalo
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Total</p>
                                    <p className="text-accent font-bold text-xl sm:text-2xl">L. {orderTotal.toFixed(2)}</p>
                                </div>
                            </div>
                            
                            {orderPaymentMethod === 'transfer' && (
                                <div className="mt-4 pt-4 border-t border-slate-700/30">
                                    <p className="text-slate-400 text-xs flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Usa el folio como concepto de pago en tu transferencia
                                    </p>
                                </div>
                            )}
                        </div>

                        {createdOrder.status === 'PAID' ? (
                            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-green-500/30 shadow-xl text-center">
                                <div className="mb-5">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full">
                                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">¡Pago Completado!</h3>
                                <p className="text-slate-400 text-sm mb-6">Tu compra ha sido confirmada exitosamente.</p>
                                <button
                                    onClick={() => navigate(`/#/comprobante/${createdOrder.folio}`)}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
                                >
                                    Ver Comprobante
                                </button>
                            </div>
                        ) : isPaypalPayment ? (
                            <div className="bg-background-secondary/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-slate-700/30 shadow-lg">
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/30">
                                    <div className="flex items-center justify-center w-10 h-10 bg-action/20 rounded-lg">
                                        <svg className="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Pago con tarjeta</h3>
                                        <p className="text-slate-400 text-xs">Procesado de forma segura por PayPal</p>
                                    </div>
                                </div>
                                <PayPalCheckout
                                    orderId={createdOrder.id}
                                    amount={orderTotal}
                                    onSuccess={async () => {
                                        // Actualizar el estado local para mostrar confirmación
                                        setCreatedOrder({ ...createdOrder, status: 'PAID' });
                                        // Redirigir inmediatamente al comprobante
                                        navigate(`/#/comprobante/${createdOrder.folio}`);
                                    }}
                                    onError={(error) => {
                                        console.error('Error en PayPal:', error);
                                        alert(`Error al procesar el pago: ${error}`);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="bg-background-secondary/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-slate-700/30 shadow-lg">
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/30">
                                    <div className="flex items-center justify-center w-10 h-10 bg-accent/20 rounded-lg">
                                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Transferencia bancaria</h3>
                                        <p className="text-slate-400 text-xs">Realiza tu transferencia y envía el comprobante</p>
                                    </div>
                                </div>
                                <p className="text-slate-300 text-sm mb-6">
                                    Realiza la transferencia por <span className="text-accent font-semibold text-base">L. {orderTotal.toFixed(2)}</span> y envía tu comprobante.
                                </p>

                                {paymentAccounts.length > 0 ? (
                                    <div className="space-y-3 mb-6">
                                        {paymentAccounts.map((acc) => {
                                            const copyAccountNumber = () => {
                                                if (acc.accountNumber) {
                                                    navigator.clipboard.writeText(acc.accountNumber).then(() => {
                                                        alert('Número de cuenta copiado al portapapeles');
                                                    });
                                                }
                                            };

                                            return (
                                                <div key={acc.id} className="bg-background-primary/60 p-4 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-white text-base">{acc.bank}</h4>
                                                    </div>
                                                    <div className="space-y-2.5 text-sm">
                                                        <div className="flex justify-between items-center py-1.5">
                                                            <span className="text-slate-500 text-xs uppercase tracking-wide">Titular</span>
                                                            <span className="text-white font-medium">{acc.accountHolder}</span>
                                                        </div>
                                                        {acc.accountNumber && (
                                                            <div 
                                                                className="flex justify-between items-center py-1.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-colors group"
                                                                onClick={copyAccountNumber}
                                                                title="Click para copiar"
                                                            >
                                                                <span className="text-slate-500 text-xs uppercase tracking-wide">No. Cuenta</span>
                                                                <span className="text-white font-mono text-base group-hover:text-accent transition-colors flex items-center gap-2">
                                                                    {acc.accountNumber}
                                                                    <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-background-primary/30 p-4 rounded-xl border border-slate-700/20 mb-6">
                                        <p className="text-slate-400 text-sm text-center">No hay cuentas configuradas para transferencia.</p>
                                    </div>
                                )}

                                {(() => {
                                    const customerName = customerData?.name || (createdOrder as any)?.customer?.name || 'Cliente';
                                    const customerPhone = customerData?.phone || (createdOrder as any)?.customer?.phone || '';
                                    const orderTickets = createdOrder?.tickets || [];
                                    const whatsappMessage = formatWhatsAppMessage(
                                        customerName,
                                        customerPhone,
                                        createdOrder?.folio || '',
                                        raffle?.title || '',
                                        orderTickets,
                                        orderTotal
                                    );
                                    const encodedMessage = encodeWhatsAppMessage(whatsappMessage);
                                    const whatsappUrl = `https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;

                                    if (!contactWhatsapp) return null;

                                    return (
                                        <a 
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                            </svg>
                                            Enviar comprobante por WhatsApp
                                        </a>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </PageAnimator>
        );
    }
    
    return (
        <PageAnimator>
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-accent to-action rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Confirmar tu Compra</h1>
                    <p className="text-slate-300 text-sm sm:text-base">Compra rápida: datos, método de pago y listo.</p>
                </div>

                <div className="bg-background-secondary p-4 rounded-2xl border border-slate-700/50 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-slate-400 text-xs">Boletos</p>
                            <p className="text-white font-semibold text-lg">
                                {baseTicketsCount}
                                {boletosAdicionales > 0 ? ` + ${boletosAdicionales} regalo` : ''}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs">Total a pagar</p>
                            <p className="text-accent font-bold text-2xl">LPS {total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-gradient-to-br from-background-secondary to-background-primary p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-5">Datos del cliente</h3>

                        <div className="space-y-4">
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
                        </div>
                    </div>

                    <div className="bg-background-secondary p-6 rounded-2xl border border-slate-700/50">
                        <h3 className="text-xl font-bold text-white mb-4">Método de pago</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className={`cursor-pointer border rounded-xl p-4 transition-all ${
                                selectedPaymentMethod === 'transfer'
                                    ? 'border-accent/70 bg-background-primary/60'
                                    : 'border-slate-700/50 bg-background-primary/30 hover:border-slate-600'
                            }`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="transfer"
                                    className="sr-only"
                                    checked={selectedPaymentMethod === 'transfer'}
                                    onChange={() => setSelectedPaymentMethod('transfer')}
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-white font-semibold">Transferencia</p>
                                        <p className="text-slate-400 text-xs">Paga por banco y envía tu comprobante</p>
                                    </div>
                                    {selectedPaymentMethod === 'transfer' && (
                                        <span className="text-accent text-xs font-semibold">Seleccionado</span>
                                    )}
                                </div>
                            </label>

                            <label className={`cursor-pointer border rounded-xl p-4 transition-all ${
                                selectedPaymentMethod === 'paypal'
                                    ? 'border-accent/70 bg-background-primary/60'
                                    : 'border-slate-700/50 bg-background-primary/30 hover:border-slate-600'
                            }`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="paypal"
                                    className="sr-only"
                                    checked={selectedPaymentMethod === 'paypal'}
                                    onChange={() => setSelectedPaymentMethod('paypal')}
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-white font-semibold">Tarjeta (PayPal)</p>
                                        <p className="text-slate-400 text-xs">Pago inmediato con tarjeta o PayPal</p>
                                    </div>
                                    {selectedPaymentMethod === 'paypal' && (
                                        <span className="text-accent text-xs font-semibold">Seleccionado</span>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting || (initialTickets.length === 0 && !selectedPack)} 
                        className="w-full bg-gradient-to-r from-action to-accent text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                Comprar Boletos - LPS {total.toFixed(2)}
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </PageAnimator>
    );
};

export default PurchasePage;