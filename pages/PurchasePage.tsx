import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getRaffleBySlug, createOrder, getSettings } from '../services/api';
import { Raffle, Order, PaymentAccount } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';

type FormData = {
    name: string;
    phone: string;
    state: string;
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
            Promise.all([getRaffleBySlug(slug), getSettings()])
            .then(([raffleData, settingsData]) => {
                setRaffle(raffleData || null);
                setPaymentAccounts(settingsData.paymentAccounts);
                setContactWhatsapp(settingsData.contactInfo.whatsapp);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
        }
    }, [slug]);

    const pricePerTicket = raffle?.packs.find(p => p.q === 1)?.price || 0;
    const total = initialTickets.length * pricePerTicket;

    const onSubmit = async (data: FormData) => {
        if (!raffle || initialTickets.length === 0) return;
        setIsSubmitting(true);
        try {
            const orderData = {
                ...data,
                raffleId: raffle.id,
                raffleTitle: raffle.title,
                tickets: initialTickets,
                total: total,
            };
            // @ts-ignore
            const newOrder = await createOrder(orderData);
            setCreatedOrder(newOrder);
        } catch (err) {
            console.error(err);
            alert("Hubo un error al crear tu apartado.");
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
                 <div className="bg-background-secondary p-8 rounded-lg border border-slate-700/50 shadow-lg">
                    <img src={raffle.heroImage} alt={raffle.title} className="w-full h-48 object-cover rounded-lg mb-6" />
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">Boletos Seleccionados</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {initialTickets.map(t => <span key={t} className="bg-background-primary px-3 py-1 rounded-full text-sm font-mono">{t}</span>)}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <h3 className="text-lg font-bold text-white border-t border-slate-700/50 pt-6">Completa tus datos</h3>
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white mb-1">Nombre Completo</label>
                            <input id="name" {...register('name', { required: 'El nombre es requerido' })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-accent focus:border-accent" />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">Teléfono (8 dígitos)</label>
                            <input id="phone" type="tel" {...register('phone', { required: 'El teléfono es requerido', pattern: {value: /^\d{8}$/, message: 'Ingresa un teléfono válido de 8 dígitos' } })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-accent focus:border-accent" />
                            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-white mb-1">Departamento</label>
                            <input id="state" {...register('state', { required: 'El departamento es requerido' })} className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-accent focus:border-accent" />
                            {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state.message}</p>}
                        </div>
                         <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                            <p className="text-2xl font-bold text-white">Total a Pagar: LPS {total.toFixed(2)}</p>
                            <p className="text-slate-400">Por {initialTickets.length} boleto(s)</p>
                            <button type="submit" disabled={isSubmitting || initialTickets.length === 0} className="mt-4 w-full bg-action text-white font-bold py-3 px-12 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                {isSubmitting ? 'Apartando...' : 'Generar Folio para Pagar'}
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        </PageAnimator>
    );
};

export default PurchasePage;