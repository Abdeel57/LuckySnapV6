import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Raffle } from '../types';
import CountdownTimer from './CountdownTimer';
import { ShoppingBag } from 'lucide-react';

interface HeroRaffleProps {
    raffle: Raffle;
}

const HeroRaffle: React.FC<HeroRaffleProps> = ({ raffle }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Preparar imágenes: incluir imagen principal + galería (evitando duplicados)
    const allImages = (() => {
        const images: string[] = [];
        
        // Agregar imageUrl si existe
        if (raffle.imageUrl) {
            images.push(raffle.imageUrl);
        }
        
        // Agregar heroImage si existe y no está duplicado
        if (raffle.heroImage && !images.includes(raffle.heroImage)) {
            images.push(raffle.heroImage);
        }
        
        // Agregar galería si existe (evitando duplicados)
        if (raffle.gallery && raffle.gallery.length > 0) {
            raffle.gallery.forEach(img => {
                if (!images.includes(img)) {
                    images.push(img);
                }
            });
        }
        
        // Si no hay ninguna imagen, usar default
        if (images.length === 0) {
            return ['https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&h=600&fit=crop'];
        }
        
        return images;
    })();

    // Cambio automático de imágenes cada 5 segundos
    useEffect(() => {
        if (allImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [allImages.length]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-secondary to-tertiary">
            {/* Imagen principal como fondo de pantalla completa */}
            <div className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentImageIndex}
                        src={allImages[currentImageIndex]}
                        alt={raffle.title}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>
                
                {/* Overlay oscuro para legibilidad */}
                <div className="absolute inset-0 bg-black/50"></div>
                
                {/* Patrón de textura */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V4h4V2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V2H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
            </div>

            {/* Contenido centrado sobre la imagen */}
            <div className="container mx-auto px-4 relative z-10 min-h-screen flex flex-col justify-center py-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center text-center space-y-8"
                >
                    {/* Título */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
                        {raffle.title}
                    </h1>

                    {/* Descripción (solo si existe) */}
                    {raffle.description && (
                        <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl">
                            {raffle.description}
                        </p>
                    )}

                    {/* Precio */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent rounded-full">
                        <span className="text-white/80 text-sm font-medium">Precio por boleto:</span>
                        <span className="text-white text-xl font-bold">L. {raffle.price}</span>
                    </div>

                    {/* Botón principal - Comprar Boletos */}
                    <Link
                        to={`/sorteo/${raffle.slug}`}
                        className="inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-white font-bold text-lg sm:text-xl px-8 py-4 rounded-2xl shadow-2xl hover:shadow-accent/50 hover:scale-105 transition-all duration-300"
                    >
                        <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span>Comprar Boletos</span>
                    </Link>

                    {/* Contador de tiempo */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 mt-8"
                    >
                        <div className="mb-4">
                            <p className="text-white/80 text-sm sm:text-base font-medium">El sorteo termina en:</p>
                        </div>
                        <CountdownTimer targetDate={raffle.drawDate} />
                    </motion.div>

                    {/* Galería de miniaturas (si hay múltiples imágenes) */}
                    {allImages.length > 1 && (
                        <div className="mt-6 flex gap-2 sm:gap-3">
                            {allImages.slice(0, 4).map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                        index === currentImageIndex 
                                            ? 'border-accent scale-110 shadow-lg shadow-accent/50' 
                                            : 'border-white/40 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img 
                                        src={img} 
                                        alt={`Vista ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                            {allImages.length > 4 && (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/20 flex items-center justify-center text-white text-xs border-2 border-white/40">
                                    +{allImages.length - 4}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default HeroRaffle;

