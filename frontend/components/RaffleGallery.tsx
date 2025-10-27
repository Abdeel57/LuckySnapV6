import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/gallery.css';

interface RaffleGalleryProps {
    images: string[];
    title: string;
    className?: string;
}

const RaffleGallery: React.FC<RaffleGalleryProps> = ({ images, title, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cambio automático de imágenes cada 5 segundos (solo si hay múltiples imágenes)
    useEffect(() => {
        if (images && images.length > 1 && !isModalOpen) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [images.length, isModalOpen]);

    if (!images || images.length === 0) {
        return (
            <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
                <span className="text-gray-500">Sin imágenes</span>
            </div>
        );
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const openModal = (index: number) => {
        setCurrentIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Galería principal */}
            <div className={`relative ${className}`}>
                {/* Imagen principal con diseño creativo */}
                <div className="relative group">
                    {/* Contenedor con aspecto cuadrado y efectos visuales */}
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl border-2 border-slate-700/50">
                        {/* Imagen principal con transición automática */}
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentIndex}
                                src={images[currentIndex] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                alt={`${title} - Imagen ${currentIndex + 1}`}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                onClick={() => openModal(currentIndex)}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                }}
                            />
                        </AnimatePresence>
                        
                        {/* Indicador de galería */}
                        {images.length > 1 && (
                            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/70 backdrop-blur-md rounded-full px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                                <span className="text-white text-xs sm:text-sm font-semibold">
                                    📷 {currentIndex + 1}/{images.length}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controles de navegación elegantes - Optimizados para móvil */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-md text-white p-2 sm:p-2.5 rounded-full hover:bg-black/90 active:scale-95 transition-all z-10 shadow-lg border border-white/20"
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-md text-white p-2 sm:p-2.5 rounded-full hover:bg-black/90 active:scale-95 transition-all z-10 shadow-lg border border-white/20"
                            aria-label="Siguiente imagen"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </>
                )}

                {/* Miniaturas elegantes - Optimizadas para móvil */}
                {images.length > 1 && (
                    <div className="flex space-x-2 sm:space-x-3 mt-3 sm:mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                    index === currentIndex 
                                        ? 'border-accent shadow-lg shadow-accent/20 scale-105' 
                                        : 'border-slate-600 hover:border-slate-400 active:scale-95'
                                }`}
                            >
                                <img
                                    src={image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                    alt={`${title} - Miniatura ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de imagen completa - Optimizado para móvil */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <div className="relative max-w-4xl max-h-full w-full">
                            {/* Botón cerrar - Optimizado para móvil */}
                            <button
                                onClick={closeModal}
                                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-black/70 backdrop-blur-md text-white p-3 sm:p-4 rounded-full hover:bg-black/90 active:scale-95 transition-all shadow-lg border border-white/20"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>

                            {/* Imagen en modal */}
                            <motion.img
                                key={currentIndex}
                                src={images[currentIndex] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                alt={`${title} - Imagen ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                }}
                            />

                            {/* Controles en modal - Optimizados para móvil */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            prevImage();
                                        }}
                                        className="absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-md text-white p-3 sm:p-4 rounded-full hover:bg-black/90 active:scale-95 transition-all shadow-lg border border-white/20"
                                        aria-label="Imagen anterior"
                                    >
                                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            nextImage();
                                        }}
                                        className="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-md text-white p-3 sm:p-4 rounded-full hover:bg-black/90 active:scale-95 transition-all shadow-lg border border-white/20"
                                        aria-label="Siguiente imagen"
                                    >
                                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </>
                            )}

                            {/* Indicador de posición - Optimizado para móvil */}
                            {images.length > 1 && (
                                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg border border-white/20">
                                    📷 {currentIndex + 1} de {images.length}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RaffleGallery;
