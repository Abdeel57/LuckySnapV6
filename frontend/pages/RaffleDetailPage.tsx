import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRaffleBySlug, getOccupiedTickets } from '../services/api';
import { Raffle } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import StickyPurchaseBar from '../components/StickyPurchaseBar';
import TicketSelector from '../components/TicketSelector';
import RaffleGallery from '../components/RaffleGallery';
import { motion } from 'framer-motion';

const RaffleDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [occupiedTickets, setOccupiedTickets] = useState<number[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            setLoading(true);
            getRaffleBySlug(slug).then(raffleData => {
                 setRaffle(raffleData || null);
                 if (raffleData) {
                    getOccupiedTickets(raffleData.id).then(occupiedData => {
                        setOccupiedTickets(occupiedData);
                        setLoading(false);
                    });
                 } else {
                    setLoading(false);
                 }
            }).catch(err => {
                console.error("Failed to load raffle details", err);
                setLoading(false);
            });
        }
    }, [slug]);

    const handleTicketClick = (ticketNumber: number) => {
        setSelectedTickets(prev => 
            prev.includes(ticketNumber) 
            ? prev.filter(t => t !== ticketNumber)
            : [...prev, ticketNumber]
        );
    };
    
    if (loading) return <div className="w-full h-screen flex items-center justify-center bg-background-primary"><Spinner /></div>;
    if (!raffle) return <PageAnimator><div className="text-center py-20"><h2 className="text-2xl text-white">Sorteo no encontrado.</h2></div></PageAnimator>;
    
    const progress = (raffle.sold / raffle.tickets) * 100;
    const pricePerTicket = raffle.packs.find(p => p.tickets === 1 || p.q === 1)?.price || 0;
    const totalPrice = selectedTickets.length * pricePerTicket;

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-3">
                        <RaffleGallery 
                            images={raffle.gallery && raffle.gallery.length > 0 ? raffle.gallery : [raffle.heroImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop']}
                            title={raffle.title}
                            className="w-full h-64 md:h-80 mb-4"
                        />
                        <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50">
                            <h1 className="text-3xl font-bold mb-4">{raffle.title}</h1>
                            <p className="text-slate-300 mb-6">{raffle.description}</p>
                             {raffle.bonuses.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-bold mb-2 text-accent">Bonos y Premios Adicionales</h3>
                                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                                        {raffle.bonuses.map((bonus, i) => <li key={i}>{bonus}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg shadow-neon-accent">
                                <h2 className="text-2xl font-bold text-center mb-4">Participa Ahora</h2>
                                <CountdownTimer targetDate={raffle.drawDate} />
                                <div className="my-6">
                                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                                        <motion.div 
                                            className="bg-accent h-2.5 rounded-full" 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <p className="text-center text-sm text-slate-300 mt-2">{progress.toFixed(2)}% vendido</p>
                                </div>
                                <div className="text-center mb-4">
                                    <p className="text-slate-400 mb-2">Selecciona tus boletos de la tabla de abajo para comenzar.</p>
                                    <div className="bg-background-primary rounded-lg p-3 border border-slate-700/50">
                                        <p className="text-sm text-slate-300">Precio por boleto:</p>
                                        <p className="text-xl font-bold text-accent">LPS {pricePerTicket.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <TicketSelector
                                totalTickets={raffle.tickets}
                                occupiedTickets={occupiedTickets}
                                selectedTickets={selectedTickets}
                                onTicketClick={handleTicketClick}
                            />
                            
                            {/* Purchase Summary */}
                            {selectedTickets.length > 0 && (
                                <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-4 text-center">Resumen de Compra</h3>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-slate-300">
                                            <span>Boletos seleccionados:</span>
                                            <span>{selectedTickets.length}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>Precio por boleto:</span>
                                            <span>LPS {pricePerTicket.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-white font-bold text-lg">
                                                <span>Total:</span>
                                                <span className="text-accent">LPS {totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/comprar/${raffle.slug}?tickets=${selectedTickets.join(',')}`}
                                        className="block w-full text-center bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Proceder al Pago
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <StickyPurchaseBar 
                raffleSlug={raffle.slug}
                selectedTickets={selectedTickets}
                totalPrice={totalPrice}
                onRemoveTicket={handleTicketClick}
                isSubmitting={false}
            />
        </PageAnimator>
    );
};

export default RaffleDetailPage;
