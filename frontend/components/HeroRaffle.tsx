import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Raffle } from '../types';
import CountdownTimer from './CountdownTimer';
import { Clock, ShoppingBag, Trophy, Users } from 'lucide-react';

interface HeroRaffleProps {
    raffle: Raffle;
}

const HeroRaffle: React.FC<HeroRaffleProps> = ({ raffle }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Preparar imágenes: incluir imagen principal + galería
    const allImages = raffle.gallery && raffle.gallery.length > 0 
        ? [raffle.imageUrl || raffle.heroImage, ...raffle.gallery]
        : [raffle.imageUrl || raffle.heroImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&h=600&fit=crop'];

    // Cambio automático de imágenes cada 5 segundos
    useEffect(() => {
        if (allImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [allImages.length]);

    const progress = raffle.tickets > 0 ? (raffle.sold / raffle.tickets) * 100 : 0;
    const ticketsRemaining = raffle.tickets - raffle.sold;

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-secondary to-tertiary">
            {/* Fondo animado */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V4h4V2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V2H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Lado izquierdo: Información */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full border border-accent">
                            <Trophy className="w-4 h-4 text-accent" />
                            <span className="text-accent font-semibold">Sorteo Principal</span>
                        </div>

                        {/* Título */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-inverse leading-tight">
                            {raffle.title}
                        </h1>

                        {/* Descripción */}
                        {raffle.description && (
                            <p className="text-lg md:text-xl text-secondary leading-relaxed">
                                {raffle.description}
                            </p>
                        )}

                        {/* Estadísticas */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Boletos vendidos */}
                            <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShoppingBag className="w-6 h-6 text-accent" />
                                    <span className="text-sm text-muted font-medium">Boletos Vendidos</span>
                                </div>
                                <div className="text-3xl font-bold text-accent">{raffle.sold}</div>
                                <div className="text-sm text-muted">de {raffle.tickets} total</div>
                            </div>

                            {/* Boletos disponibles */}
                            <div className="bg-secondary/10 rounded-2xl p-6 border border-secondary/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-6 h-6 text-primary" />
                                    <span className="text-sm text-muted font-medium">Disponibles</span>
                                </div>
                                <div className="text-3xl font-bold text-primary">{ticketsRemaining}</div>
                                <div className="text-sm text-muted">para comprar</div>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        <div>
                            <div className="flex justify-between text-sm text-muted mb-2">
                                <span>Progreso de ventas</span>
                                <span className="font-semibold text-accent">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-3 bg-secondary/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                                />
                            </div>
                        </div>

                        {/* Contador mejorado */}
                        <div className="bg-inverse/10 backdrop-blur-sm rounded-2xl p-6 border border-inverse/20">
                            <div className="flex items-center gap-2 text-muted mb-4">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">Sorteo en:</span>
                            </div>
                            <CountdownTimer targetDate={raffle.drawDate} />
                        </div>

                        {/* Botón CTA */}
                        <Link
                            to={`/sorteo/${raffle.slug}`}
                            className="inline-flex items-center gap-3 btn-primary text-lg px-8 py-4 shadow-brand-lg hover:shadow-brand-xl hover:scale-105 transition-all duration-300"
                        >
                            <ShoppingBag className="w-6 h-6" />
                            <span>Comprar Boletos Ahora</span>
                        </Link>
                    </motion.div>

                    {/* Lado derecho: Imagen/Galería */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-primary/20">
                            {/* Imagen principal con transición */}
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

                            {/* Overlay con gradiente */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                            {/* Indicadores de imagen */}
                            {allImages.length > 1 && (
                                <div className="absolute top-6 right-6 flex gap-2">
                                    {allImages.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                index === currentImageIndex 
                                                    ? 'bg-accent w-8' 
                                                    : 'bg-white/40 hover:bg-white/60'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Precio destacado */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-inverse/90 backdrop-blur-md rounded-2xl p-4 border border-accent/20">
                                    <div className="text-sm text-muted mb-1">Precio por boleto</div>
                                    <div className="text-3xl font-bold text-accent">
                                        L. {raffle.price}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Galería de miniaturas (si hay múltiples imágenes) */}
                        {allImages.length > 1 && (
                            <div className="mt-4 flex gap-3">
                                {allImages.slice(0, 4).map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                                            index === currentImageIndex 
                                                ? 'border-accent scale-105' 
                                                : 'border-transparent opacity-60 hover:opacity-100'
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
                                    <button className="w-20 h-20 rounded-xl bg-secondary/20 flex items-center justify-center text-muted text-sm border-2 border-dashed">
                                        +{allImages.length - 4}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Partículas flotantes */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-accent/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroRaffle;

