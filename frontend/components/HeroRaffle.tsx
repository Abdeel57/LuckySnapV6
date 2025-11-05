import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Raffle } from '../types';
import CountdownTimer from './CountdownTimer';
import { ShoppingBag } from 'lucide-react';
import ResponsiveImage from './ResponsiveImage';

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

    // Cambio automático DESACTIVADO en móviles para mejor rendimiento
    useEffect(() => {
        // Solo activar en desktop
        if (allImages.length > 1 && window.innerWidth >= 768) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [allImages.length]);

    // Detectar móvil para desactivar animaciones
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-secondary to-tertiary">
            {/* Imagen principal como fondo de pantalla completa */}
            <div className="absolute inset-0 w-full h-full">
                {isMobile ? (
                    // Móvil: Imagen estática con fade-in suave
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                    >
                        <ResponsiveImage
                            src={allImages[currentImageIndex]}
                            alt={raffle.title}
                            widths={[768, 1200]}
                            sizesHint="100vw"
                            preferFormat="auto"
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                ) : (
                    // Desktop: Con animaciones
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentImageIndex}
                            className="w-full h-full"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                        >
                            <ResponsiveImage
                                src={allImages[currentImageIndex]}
                                alt={raffle.title}
                                widths={[768, 1200, 1600, 1920, 2160]}
                                sizesHint="100vw"
                                preferFormat="auto"
                                loading="eager"
                                decoding="async"
                                fetchPriority="high"
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>
                )}
                
                {/* Overlay oscuro para legibilidad */}
                <div className="absolute inset-0 bg-black/35"></div>
                
                {/* Patrón de textura deshabilitado (se removió la marca de agua) */}
            </div>

            {/* Contenido centrado sobre la imagen */}
            <div className="container mx-auto px-4 relative z-10 min-h-screen flex flex-col justify-center py-8">
                <motion.div
                    initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={isMobile ? { duration: 0.4 } : { duration: 0.8 }}
                    className="flex flex-col items-center text-center space-y-8"
                >
                    {/* Título */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight max-w-4xl">
                        {raffle.title}
                    </h1>

                    {/* Descripción (solo si existe) */}
                    {raffle.description && (
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-black tracking-wide max-w-2xl">
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
                        initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={isMobile ? { duration: 0.4, delay: 0.1 } : { duration: 0.8, delay: 0.2 }}
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
                                    <ResponsiveImage
                                        src={img}
                                        alt={`Vista ${index + 1}`}
                                        widths={[240, 320, 480, 640]}
                                        sizesHint="96px"
                                        preferFormat="auto"
                                        loading="lazy"
                                        decoding="async"
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

