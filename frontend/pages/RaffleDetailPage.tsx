import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRaffleBySlug, getOccupiedTickets, getSettings } from '../services/api';
import { Raffle } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import StickyPurchaseBar from '../components/StickyPurchaseBar';
import TicketSelector from '../components/TicketSelector';
import RaffleGallery from '../components/RaffleGallery';
import { motion } from 'framer-motion';
import metaPixelService from '../services/metaPixel';

const RaffleDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [occupiedTickets, setOccupiedTickets] = useState<number[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [listingMode, setListingMode] = useState<'paginado' | 'scroll'>('paginado');
    const [hideOccupied, setHideOccupied] = useState<boolean>(false);

    useEffect(() => {
        // Cargar preferencias de visualización desde settings públicos
        getSettings().then(settings => {
            const prefs = (settings as any)?.displayPreferences;
            if (prefs?.listingMode) setListingMode(prefs.listingMode);
            if (prefs?.paidTicketsVisibility) setHideOccupied(prefs.paidTicketsVisibility === 'no_disponibles');
        }).catch(() => {});

        if (slug) {
            setLoading(true);
            getRaffleBySlug(slug).then(raffleData => {
                 setRaffle(raffleData || null);
                 if (raffleData) {
                    // Track ViewContent event
                    metaPixelService.trackViewContent(raffleData.id, raffleData);
                    
                    getOccupiedTickets(raffleData.id).then(occupiedData => {
                        setOccupiedTickets(occupiedData);
                        setLoading(false);
                    });
                 } else {
                    setLoading(false);
                 }
            }).catch(err => {
                // Error logging removed for production
                setLoading(false);
            });
        }
    }, [slug]);

    const handleTicketClick = (ticketNumber: number) => {
        // Verificar si el boleto ya está ocupado
        if (occupiedTickets.includes(ticketNumber)) {
            alert('Este boleto ya está ocupado. Por favor selecciona otro.');
            return;
        }
        
        const wasSelected = selectedTickets.includes(ticketNumber);
        const newSelectedTickets = wasSelected 
            ? selectedTickets.filter(t => t !== ticketNumber)
            : [...selectedTickets, ticketNumber];
        
        setSelectedTickets(newSelectedTickets);
        
        // Track AddToCart when tickets are selected
        if (!wasSelected && raffle) {
            const pricePerTicket = raffle.price || raffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
            const totalValue = newSelectedTickets.length * pricePerTicket;
            metaPixelService.trackAddToCart(raffle.id, newSelectedTickets, totalValue);
        }
    };
    
    if (loading) return <div className="w-full h-screen flex items-center justify-center bg-background-primary"><Spinner /></div>;
    if (!raffle) return <PageAnimator><div className="text-center py-20"><h2 className="text-2xl text-white">Sorteo no encontrado.</h2></div></PageAnimator>;
    
    const progress = (raffle.sold / raffle.tickets) * 100;
    const pricePerTicket = raffle.price || raffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
    const totalPrice = selectedTickets.length * pricePerTicket;
    
    // Calcular boletos adicionales si tiene oportunidades
    const boletosAdicionales = raffle.boletosConOportunidades && raffle.numeroOportunidades > 1
        ? selectedTickets.length * (raffle.numeroOportunidades - 1)
        : 0;

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-3">
                        <RaffleGallery 
                            images={(() => {
                                // Combinar todas las imágenes: imageUrl, heroImage y gallery
                                const allImages: string[] = [];
                                
                                // Agregar imageUrl si existe
                                if (raffle.imageUrl) {
                                    allImages.push(raffle.imageUrl);
                                }
                                
                                // Agregar heroImage si existe y no está duplicado
                                if (raffle.heroImage && !allImages.includes(raffle.heroImage)) {
                                    allImages.push(raffle.heroImage);
                                }
                                
                                // Agregar galería si existe (evitando duplicados)
                                if (raffle.gallery && raffle.gallery.length > 0) {
                                    raffle.gallery.forEach(img => {
                                        if (!allImages.includes(img)) {
                                            allImages.push(img);
                                        }
                                    });
                                }
                                
                                // Si no hay ninguna imagen, usar default
                                if (allImages.length === 0) {
                                    return ['https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop'];
                                }
                                
                                console.log('🖼️ Detail page using combined images:', allImages.length);
                                return allImages;
                            })()}
                            title={raffle.title}
                            className="w-full max-w-2xl mx-auto mb-6"
                        />
                        <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50">
                            <h1 className="text-3xl font-bold mb-4">{raffle.title}</h1>
                            <p className="text-slate-300 mb-6">{raffle.description || 'Participa en esta increíble rifa'}</p>
                             {raffle.bonuses && raffle.bonuses.length > 0 && (
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
                                    <div className="bg-background-primary rounded-lg p-3 border border-slate-700/50 mb-4">
                                        <p className="text-sm text-slate-300">Precio por boleto:</p>
                                        <p className="text-xl font-bold text-accent">LPS {pricePerTicket.toFixed(2)}</p>
                                    </div>
                                    {raffle.boletosConOportunidades && raffle.numeroOportunidades > 1 && (
                                        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-2 border-green-500/50 rounded-xl p-4 shadow-lg">
                                            <div className="flex items-center justify-center space-x-2 mb-2">
                                                <span className="text-2xl">🎯</span>
                                                <h4 className="text-green-400 font-bold text-lg">
                                                    {raffle.numeroOportunidades}x Oportunidades
                                                </h4>
                                            </div>
                                            <p className="text-green-300 text-sm">
                                                Cada boleto que compres recibirá <span className="font-bold text-white">{raffle.numeroOportunidades - 1} boleto{raffle.numeroOportunidades > 2 ? 's' : ''} adicional{raffle.numeroOportunidades > 2 ? 'es' : ''}</span> de regalo para aumentar tus probabilidades
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <TicketSelector
                                totalTickets={raffle.tickets}
                                occupiedTickets={occupiedTickets}
                                selectedTickets={selectedTickets}
                                listingMode={listingMode}
                                hideOccupied={hideOccupied}
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
                                        {boletosAdicionales > 0 && (
                                            <div className="flex justify-between text-green-400 font-semibold">
                                                <span>🎁 Boletos de regalo:</span>
                                                <span>+{boletosAdicionales}</span>
                                            </div>
                                        )}
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
                                        {boletosAdicionales > 0 && (
                                            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mt-3">
                                                <p className="text-green-400 text-sm font-medium text-center">
                                                    🎯 Recibirás {selectedTickets.length + boletosAdicionales} boletos en total<br/>
                                                    ({selectedTickets.length} comprados + {boletosAdicionales} de regalo)
                                                </p>
                                            </div>
                                        )}
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
                raffle={raffle}
            />
        </PageAnimator>
    );
};

export default RaffleDetailPage;
